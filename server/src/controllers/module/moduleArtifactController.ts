import { Request, Response } from 'express';
import crypto from 'crypto';
import { Prisma, ModuleCategory } from '@prisma/client';
import { prisma } from '../../lib/prisma';
import { logger } from '../../lib/logger';
import { getUserFromRequest } from '../../middleware/auth';
import { ModuleSecurityService } from '../../services/moduleSecurityService';
import { initializeHrScheduleForBusiness } from '../../services/hrScheduleService';
import { storageService } from '../../services/storageService';
import { runBaselineZipScan } from '../../services/moduleArtifactBaselineScan';
import { runSmartModuleScan } from '../../services/moduleArtifactSmartScan';
import {
  asRecordJson,
  getManifestEntryUrl,
  isValidHttpsEntryUrl,
  VALID_MODULE_CATEGORIES,
  classifyArtifactUploadInitError,
} from './moduleShared';


export const initModuleArtifactUpload = async (req: Request, res: Response) => {
  try {
    const user = getUserFromRequest(req);
    if (!user) {
      return res.status(401).json({ success: false, error: 'Unauthorized' });
    }

    const { moduleId } = req.params;
    const { version, fileName, contentType, sizeBytes } = req.body as {
      version?: string;
      fileName?: string;
      contentType?: string;
      sizeBytes?: number;
    };

    if (!version || !fileName || !contentType || typeof sizeBytes !== 'number') {
      return res.status(400).json({
        success: false,
        error: 'version, fileName, contentType, and sizeBytes are required',
      });
    }

    const maxSizeBytes = 500 * 1024 * 1024; // 500MB hard limit
    if (sizeBytes <= 0 || sizeBytes > maxSizeBytes) {
      return res.status(400).json({
        success: false,
        error: 'Artifact size exceeds allowed limit',
        maxSizeBytes,
      });
    }

    const lowerName = fileName.toLowerCase();
    const looksLikeZip =
      contentType.includes('zip') ||
      contentType.includes('x-zip-compressed') ||
      lowerName.endsWith('.zip');
    if (!looksLikeZip) {
      return res.status(400).json({
        success: false,
        error: 'Only ZIP artifacts are supported (use a .zip file or application/zip content type)',
      });
    }

    const module = await prisma.module.findUnique({
      where: { id: moduleId },
      select: { id: true, developerId: true, name: true },
    });

    if (!module) {
      return res.status(404).json({ success: false, error: 'Module not found' });
    }

    if (module.developerId !== user.id && user.role !== 'ADMIN') {
      return res.status(403).json({ success: false, error: 'Only the module developer can upload artifacts' });
    }

    if (storageService.getProvider() !== 'gcs' || !storageService.isGCSConfigured()) {
      return res.status(503).json({
        success: false,
        error: 'Artifact upload requires configured Google Cloud Storage',
      });
    }

    const safeName = fileName.replace(/[^a-zA-Z0-9._-]/g, '_');
    const objectPath = `modules/${moduleId}/versions/${version}/${Date.now()}-${safeName}`;
    const uploadSessionId = crypto.randomUUID();
    const expiresAt = new Date(Date.now() + 15 * 60 * 1000);

    const signedUpload = await storageService.getSignedUploadUrl(objectPath, contentType, 15 * 60);

    await prisma.moduleUploadSession.create({
      data: {
        id: uploadSessionId,
        moduleId,
        targetVersion: version,
        uploaderId: user.id,
        bucket: process.env.GOOGLE_CLOUD_STORAGE_BUCKET || '',
        objectPath,
        status: 'INITIATED',
        expiresAt,
      },
    });

    return res.json({
      success: true,
      data: {
        uploadSessionId,
        signedUploadUrl: signedUpload.url,
        method: signedUpload.method,
        requiredHeaders: signedUpload.requiredHeaders,
        objectPath,
        expiresAt: signedUpload.expiresAt,
      },
    });
  } catch (error: unknown) {
    const err = error instanceof Error ? error : new Error(String(error));
    await logger.error('Failed to initialize module artifact upload', {
      operation: 'module_artifact_upload_init',
      error: { message: err.message, stack: err.stack },
    });

    if (error instanceof Prisma.PrismaClientKnownRequestError) {
      if (error.code === 'P2021' || error.code === 'P2022') {
        return res.status(503).json({
          success: false,
          error:
            'Database is missing module upload tables. Apply the latest Prisma migrations on this environment.',
          code: error.code,
          errorCode: 'DB_SCHEMA_MISSING',
          hint: 'Run prisma migrate deploy against the production DATABASE_URL.',
        });
      }
      return res.status(500).json({
        success: false,
        error: 'Failed to initialize artifact upload',
        code: error.code,
        errorCode: `PRISMA_${error.code}`,
        hint:
          'Database error while creating upload session. Confirm migrations are applied and module_upload_sessions exists.',
      });
    }

    const expose = process.env.NODE_ENV !== 'production';
    const classified = classifyArtifactUploadInitError(err);
    return res.status(500).json({
      success: false,
      error: expose ? err.message : 'Failed to initialize artifact upload',
      errorCode: classified.errorCode,
      hint: classified.hint,
      ...(expose && { detail: err.message, stack: err.stack }),
    });
  }
};

// Finalize a GCS upload and persist artifact/version metadata
export const finalizeModuleArtifactUpload = async (req: Request, res: Response) => {
  try {
    const user = getUserFromRequest(req);
    if (!user) {
      return res.status(401).json({ success: false, error: 'Unauthorized' });
    }

    const { moduleId, uploadSessionId } = req.params;
    const { version, manifest, permissions, dependencies } = req.body as {
      version?: string;
      manifest?: Record<string, unknown>;
      permissions?: string[];
      dependencies?: string[];
    };

    if (!version || !manifest || typeof manifest !== 'object') {
      return res.status(400).json({ success: false, error: 'version and manifest are required' });
    }

    const session = await prisma.moduleUploadSession.findUnique({
      where: { id: uploadSessionId },
    });

    if (!session || session.moduleId !== moduleId) {
      return res.status(404).json({ success: false, error: 'Upload session not found' });
    }

    if (session.uploaderId !== user.id && user.role !== 'ADMIN') {
      return res.status(403).json({ success: false, error: 'Access denied for this upload session' });
    }

    if (new Date(session.expiresAt).getTime() < Date.now()) {
      await prisma.moduleUploadSession.update({
        where: { id: uploadSessionId },
        data: { status: 'EXPIRED' },
      });
      return res.status(400).json({ success: false, error: 'Upload session expired' });
    }

    const exists = await storageService.fileExists(session.objectPath);
    if (!exists) {
      return res.status(400).json({ success: false, error: 'Artifact not found in storage for this session' });
    }

    const fileBuffer = await storageService.getFileBuffer(session.objectPath);
    const sha256 = crypto.createHash('sha256').update(fileBuffer).digest('hex');
    const sizeBytes = fileBuffer.length;

    const manifestRecord = asRecordJson(manifest);
    const entryUrl = getManifestEntryUrl(manifestRecord);
    const baseline = runBaselineZipScan(
      fileBuffer,
      { objectPath: session.objectPath },
      { requireHtmlEntry: !isValidHttpsEntryUrl(entryUrl) }
    );
    const smartScan = runSmartModuleScan(fileBuffer, { objectPath: session.objectPath });
    const scanStatus = baseline.scanStatus;
    const combinedScanSummary = {
      ...baseline.scanSummary,
      smartScan,
      scanLevel: 'baseline_plus_smart',
    };
    const scanSummary = combinedScanSummary as unknown as Prisma.InputJsonValue;

    const updatedModule = await prisma.module.update({
      where: { id: moduleId },
      data: {
        version,
        manifest: manifest as Prisma.InputJsonValue,
        permissions: Array.isArray(permissions) ? permissions : [],
        dependencies: Array.isArray(dependencies) ? dependencies : [],
        status: 'PENDING',
      },
      select: { id: true, name: true, version: true },
    });

    const moduleVersion = await prisma.moduleVersion.upsert({
      where: { moduleId_version: { moduleId, version } },
      update: {
        status: 'READY_FOR_REVIEW',
        manifestSnapshot: manifest as Prisma.InputJsonValue,
        submittedBy: user.id,
      },
      create: {
        moduleId,
        version,
        status: 'READY_FOR_REVIEW',
        manifestSnapshot: manifest as Prisma.InputJsonValue,
        submittedBy: user.id,
      },
    });

    const artifact = await prisma.moduleArtifact.upsert({
      where: { moduleVersionId: moduleVersion.id },
      update: {
        bucket: session.bucket,
        objectPath: session.objectPath,
        contentType: 'application/zip',
        sizeBytes,
        sha256,
        uploadedBy: user.id,
        uploadedAt: new Date(),
        scanStatus,
        scanSummary,
      },
      create: {
        moduleVersionId: moduleVersion.id,
        bucket: session.bucket,
        objectPath: session.objectPath,
        contentType: 'application/zip',
        sizeBytes,
        sha256,
        uploadedBy: user.id,
        uploadedAt: new Date(),
        scanStatus,
        scanSummary,
      },
    });

    await prisma.moduleUploadSession.update({
      where: { id: uploadSessionId },
      data: { status: 'FINALIZED' },
    });

    return res.json({
      success: true,
      data: {
        message: 'Module artifact upload finalized',
        module: updatedModule,
        moduleVersionId: moduleVersion.id,
        artifactId: artifact.id,
        scanStatus: artifact.scanStatus,
        scanSummary: combinedScanSummary,
      },
    });
  } catch (error: unknown) {
    const err = error instanceof Error ? error : new Error(String(error));
    await logger.error('Failed to finalize module artifact upload', {
      operation: 'module_artifact_upload_finalize',
      error: { message: err.message, stack: err.stack },
    });

    if (error instanceof Prisma.PrismaClientKnownRequestError) {
      if (error.code === 'P2021' || error.code === 'P2022') {
        return res.status(503).json({
          success: false,
          error:
            'Database is missing module artifact tables. Apply the latest Prisma migrations on this environment.',
          code: error.code,
        });
      }
      return res.status(500).json({
        success: false,
        error: 'Failed to finalize artifact upload',
        code: error.code,
      });
    }

    const expose = process.env.NODE_ENV !== 'production';
    return res.status(500).json({
      success: false,
      error: expose ? err.message : 'Failed to finalize artifact upload',
      ...(expose && { stack: err.stack }),
    });
  }
};
