import express from 'express';
import path from 'path';
import multer from 'multer';
import OpenAI from 'openai';
import { toFile } from 'openai';
import { DigitalLifeTwinService, AIRequest } from '../ai/core/DigitalLifeTwinService';
import { PersonalityEngine } from '../ai/core/PersonalityEngine';
import AdvancedLearningEngine from '../ai/learning/AdvancedLearningEngine';
import type { LearningPattern } from '../ai/learning/AdvancedLearningEngine';
import { authenticateJWT } from '../middleware/auth';
import { prisma } from '../lib/prisma';
import { FeatureGatingService } from '../services/featureGatingService';
import { AIQueryService } from '../services/aiQueryService';

const router: express.Router = express.Router();
const digitalLifeTwin = new DigitalLifeTwinService(prisma);
const personalityEngine = new PersonalityEngine(prisma);
const learningEngine = new AdvancedLearningEngine(prisma);

function formatPatternForUser(p: LearningPattern): { id: string; description: string; type: string } {
  const type = p.patternType;
  const data = p.data as Record<string, unknown> | undefined;
  let description: string;
  if (type === 'temporal' && data?.peakHours) {
    const hours = (data.peakHours as [number, number][])?.slice(0, 2).map(([h]) => `${h}:00`).join(', ') || '';
    description = hours ? `You’re most active around ${hours}.` : 'Your activity tends to cluster at certain times.';
  } else if (type === 'temporal' && data?.dailyActivity) {
    description = 'Your usage follows a weekly rhythm.';
  } else if (type === 'behavioral') {
    const am = data?.activeModules;
    if (Array.isArray(am) && am.length > 0) {
      const modules = am.slice(0, 2).map((entry: unknown) => (Array.isArray(entry) ? entry[0] : String(entry))).join(', ');
      description = modules ? `You often use ${modules}.` : 'You have consistent usage across modules.';
    } else {
      description = 'Your actions follow recognizable patterns.';
    }
  } else if (type === 'preference') {
    description = 'The AI has learned your response preferences.';
  } else if (type === 'communication') {
    description = 'Your communication style is reflected in responses.';
  } else if (type === 'decision') {
    description = 'Your decision patterns inform suggestions.';
  } else {
    description = `Learned ${type} pattern (${Math.round((p.confidence ?? 0) * 100)}% confidence).`;
  }
  return { id: p.id, description, type };
}

/**
 * 🚀 POST /api/ai/twin
 * Revolutionary Digital Life Twin interaction endpoint
 */
router.post('/twin', authenticateJWT, async (req, res) => {
  try {
    const { query, provider, context = {} } = req.body;
    const userId = req.user?.id;
    const businessId = context.businessId || null;
    
    console.log('[AI Twin Route] Request received:', {
      userId,
      queryLength: query?.length,
      provider,
      hasFileIds: !!context.fileIds,
      fileIdsCount: Array.isArray(context.fileIds) ? context.fileIds.length : 0,
      fileIds: context.fileIds
    });
    
    if (!userId) {
      return res.status(401).json({ error: 'User not authenticated' });
    }

    if (!query) {
      return res.status(400).json({ error: 'Query is required' });
    }

    // Validate provider if provided
    if (provider && !['auto', 'openai', 'anthropic'].includes(provider)) {
      return res.status(400).json({ error: 'Invalid provider. Must be auto, openai, or anthropic' });
    }

    // Admin users bypass feature gating
    const isAdmin = req.user?.role === 'ADMIN';
    
    // Check AI feature access (includes query balance check) - skip for admins
    if (!isAdmin) {
      const featureCheck = await FeatureGatingService.checkFeatureAccess(
        userId,
        'unlimited_ai',
        businessId || undefined
      );

      if (!featureCheck.hasAccess) {
        return res.status(429).json({
          error: 'AI query limit exceeded',
          message: featureCheck.reason || 'No queries remaining',
          remaining: featureCheck.usageInfo?.remaining || 0,
        });
      }
    }

    const wantStream = req.body.stream === true || (req.get('Accept') || '').includes('text/event-stream');
    if (wantStream) {
      await digitalLifeTwin.processAsDigitalLifeTwinStreaming(
        query,
        userId,
        {
          currentModule: context.currentModule,
          dashboardType: context.dashboardType,
          dashboardName: context.dashboardName,
          recentActivity: context.recentActivity,
          urgency: context.urgency || 'medium',
          preferredProvider: provider,
          conversationId: context.conversationId,
          fileIds: context.fileIds,
        },
        res,
        async (response) => {
          if (!isAdmin) {
            try {
              await AIQueryService.consumeQuery(userId, businessId, 1);
            } catch (e) {
              console.error('Stream: consume query failed', e);
            }
          }
          try {
            await prisma.aIConversationHistory.create({
              data: {
                userId,
                sessionId: `session_${Date.now()}`,
                interactionType: 'QUERY',
                context: JSON.parse(JSON.stringify(context)),
                userQuery: query,
                aiResponse: response.response,
                confidence: response.confidence,
                reasoning: response.reasoning || null,
                actions: JSON.parse(JSON.stringify(response.actions || [])),
                provider: response.metadata.provider,
                model: response.metadata.provider,
                tokensUsed: response.metadata.processingTime,
                cost: 0,
                processingTime: response.metadata.processingTime,
              },
            });
          } catch (e) {
            console.error('Stream: save history failed', e);
          }
          if (response.actions?.length) {
            const actionsRequiringApproval = response.actions.filter((a: { requiresApproval?: boolean }) => a.requiresApproval);
            for (const action of actionsRequiringApproval) {
              try {
                await prisma.aIApprovalRequest.create({
                  data: {
                    userId,
                    requestType: action.type,
                    actionData: JSON.parse(JSON.stringify(action.data)),
                    affectedUsers: action.peopleAffected,
                    reasoning: action.description,
                    status: 'PENDING',
                    expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000),
                  },
                });
              } catch (e) {
                console.error('Stream: approval create failed', e);
              }
            }
          }
        }
      );
      return;
    }

    // Use the revolutionary Digital Life Twin Core
    const response = await digitalLifeTwin.processAsDigitalLifeTwin(
      query, 
      userId, 
      {
        currentModule: context.currentModule,
        dashboardType: context.dashboardType,
        dashboardName: context.dashboardName,
        recentActivity: context.recentActivity,
        urgency: context.urgency || 'medium',
        preferredProvider: provider, // Pass provider preference
        conversationId: context.conversationId, // Pass so twin can use recent messages as context
        fileIds: context.fileIds, // Pass attached file IDs so AI can read them
      }
    );
    
    // Consume query (only after successful processing) - skip for admins
    if (!isAdmin) {
      try {
        const consumeResult = await AIQueryService.consumeQuery(userId, businessId, 1);
        if (!consumeResult.success) {
          // This shouldn't happen since we checked above, but handle gracefully
          console.warn('Query consumption failed after processing:', consumeResult.error);
        }
      } catch (consumeError) {
        // Log error but don't fail the request since processing already succeeded
        console.error('Error consuming query after processing:', consumeError);
      }
    }

    // Save conversation to history with enhanced cross-module data
    await prisma.aIConversationHistory.create({
      data: {
        userId,
        sessionId: `session_${Date.now()}`, // Generate session ID
        interactionType: 'QUERY',
        context: JSON.parse(JSON.stringify(context)),
        userQuery: query,
        aiResponse: response.response,
        confidence: response.confidence,
        reasoning: response.reasoning || null,
        actions: JSON.parse(JSON.stringify(response.actions || [])),
        provider: response.metadata.provider,
        model: response.metadata.provider, // Will be enhanced when we connect real providers
        tokensUsed: response.metadata.processingTime, // Placeholder
        cost: 0, // Will be calculated with real providers
        processingTime: response.metadata.processingTime
      }
    });

    // Note: Fact extraction now happens in the learning engine (AdvancedLearningEngine.processLearningEvent)
    // The learning engine processes the interaction and extracts facts as part of its learning flow
    // This keeps all learning logic centralized in one place

    // Record any actions that require approval
    if (response.actions && response.actions.length > 0) {
      const actionsRequiringApproval = response.actions.filter(action => action.requiresApproval);
      
      for (const action of actionsRequiringApproval) {
        await prisma.aIApprovalRequest.create({
          data: {
            userId,
            requestType: action.type,
            actionData: JSON.parse(JSON.stringify(action.data)),
            affectedUsers: action.peopleAffected,
            reasoning: action.description,
            status: 'PENDING',
            expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000) // Expires in 24 hours
          }
        });
      }
    }

    // Get updated query balance for response (skip for admins)
    let queryBalance = null;
    if (!isAdmin) {
      const updatedAvailability = await AIQueryService.checkQueryAvailability(userId, businessId);
      queryBalance = {
        remaining: updatedAvailability.remaining,
        isUnlimited: updatedAvailability.isUnlimited,
      };
    } else {
      queryBalance = {
        remaining: -1, // Unlimited for admins
        isUnlimited: true,
      };
    }

    res.json({
      success: true,
      data: {
        response: response.response,
        confidence: response.confidence,
        reasoning: response.reasoning,
        actions: response.actions,
        insights: response.insights,
        personalityAlignment: response.personalityAlignment,
        crossModuleConnections: response.crossModuleConnections,
        structured: response.structured,
        metadata: response.metadata,
        queryBalance,
        ...(response.fileIssues && response.fileIssues.length > 0 && { fileIssues: response.fileIssues }),
        ...(response.usedVisionParts && { usedVisionParts: true }),
      }
    });
  } catch (error) {
    console.error('Digital Life Twin error:', error);
    res.status(500).json({
      error: 'Failed to process Digital Life Twin request',
      message: error instanceof Error ? error.message : 'Unknown error occurred'
    });
  }
});

/**
 * POST /api/ai/generate-image
 * Generate image using DALL·E 3 (OpenAI). Requires OPENAI_API_KEY.
 */
router.post('/generate-image', authenticateJWT, async (req, res) => {
  try {
    const userId = req.user?.id;
    if (!userId) {
      return res.status(401).json({ error: 'User not authenticated' });
    }
    const { prompt, size, quality } = req.body;
    if (!prompt || typeof prompt !== 'string' || !prompt.trim()) {
      return res.status(400).json({ error: 'prompt is required and must be a non-empty string' });
    }
    const { OpenAIProvider } = await import('../ai/providers/OpenAIProvider');
    const { getProviderCapabilities } = await import('../ai/providers/capabilities');
    const caps = getProviderCapabilities('openai');
    if (!caps.supportsImageGeneration) {
      return res.status(501).json({ error: 'Image generation not supported by current provider' });
    }
    const provider = new OpenAIProvider();
    const result = await provider.generateImage(prompt.trim(), {
      size: size === '1024x1792' || size === '1792x1024' ? size : '1024x1024',
      quality: quality === 'hd' ? 'hd' : 'standard',
    });
    if (result.error) {
      return res.status(502).json({ success: false, error: result.error });
    }
    res.json({
      success: true,
      data: {
        url: result.url,
        revisedPrompt: result.revisedPrompt,
      },
    });
  } catch (error) {
    console.error('Generate image error:', error);
    res.status(500).json({
      error: 'Failed to generate image',
      message: error instanceof Error ? error.message : 'Unknown error occurred',
    });
  }
});

/**
 * POST /api/ai/generate-image/save-to-drive
 * Save a generated image (by URL) to the user's Drive. Fetches image server-side, uploads to storage, creates File record.
 */
router.post('/generate-image/save-to-drive', authenticateJWT, async (req, res) => {
  try {
    const userId = req.user?.id;
    if (!userId) {
      return res.status(401).json({ error: 'User not authenticated' });
    }
    const { imageUrl, dashboardId, folderId, name } = req.body;
    if (!imageUrl || typeof imageUrl !== 'string' || !imageUrl.trim()) {
      return res.status(400).json({ error: 'imageUrl is required' });
    }
    const dashboardIdStr = dashboardId && typeof dashboardId === 'string' ? dashboardId : null;
    const folderIdStr = folderId && typeof folderId === 'string' ? folderId : null;
    const fileName = (name && typeof name === 'string' && name.trim()) ? name.trim() : `ai-generated-${Date.now()}.png`;

    const { storageService } = await import('../services/storageService');

    const imageRes = await fetch(imageUrl, { method: 'GET' });
    if (!imageRes.ok) {
      return res.status(502).json({ error: 'Failed to fetch image from URL' });
    }
    const contentType = imageRes.headers.get('content-type') || 'image/png';
    const arrayBuffer = await imageRes.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    const ext = path.extname(fileName) || (contentType.includes('png') ? '.png' : '.jpg');
    const uniqueFilename = `files/${userId}-${Date.now()}-${Math.round(Math.random() * 1E9)}${ext}`;

    const fileLike: Express.Multer.File = {
      fieldname: 'file',
      originalname: fileName,
      encoding: '7bit',
      mimetype: contentType,
      buffer,
      size: buffer.length,
    } as Express.Multer.File;

    const uploadResult = await storageService.uploadFile(fileLike, uniqueFilename, {
      makePublic: true,
      metadata: {
        userId,
        originalName: fileName,
        folderId: folderIdStr || '',
        dashboardId: dashboardIdStr || '',
      },
    });

    const fileRecord = await prisma.file.create({
      data: {
        userId,
        name: fileName,
        type: contentType,
        size: buffer.length,
        url: uploadResult.url,
        path: uploadResult.path,
        folderId: folderIdStr,
        dashboardId: dashboardIdStr,
      },
    });

    res.json({
      success: true,
      data: {
        fileId: fileRecord.id,
        url: uploadResult.url,
        name: fileRecord.name,
      },
    });
  } catch (error) {
    console.error('Save generated image to Drive error:', error);
    res.status(500).json({
      error: 'Failed to save image to Drive',
      message: error instanceof Error ? error.message : 'Unknown error occurred',
    });
  }
});

/**
 * POST /api/ai/edit-image
 * Phase 8: Edit an image (e.g. remove background). Accepts fileId + prompt; optional saveToDrive.
 */
router.post('/edit-image', authenticateJWT, async (req, res) => {
  try {
    const userId = req.user?.id;
    if (!userId) {
      return res.status(401).json({ error: 'User not authenticated' });
    }
    const { fileId, prompt, background, saveToDrive, dashboardId, folderId, name } = req.body;
    if (!fileId || typeof fileId !== 'string' || !prompt || typeof prompt !== 'string' || !prompt.trim()) {
      return res.status(400).json({ error: 'fileId and prompt are required' });
    }
    const file = await prisma.file.findFirst({
      where: { id: fileId, userId, trashedAt: null },
    });
    if (!file) {
      return res.status(404).json({ error: 'File not found or access denied' });
    }
    const { getProviderCapabilities } = await import('../ai/providers/capabilities');
    const caps = getProviderCapabilities('openai');
    if (!caps.supportsImageEdit) {
      return res.status(501).json({ error: 'Image edit not supported by current provider' });
    }
    let imageBuffer: Buffer;
    if (file.url && (file.url.startsWith('http://') || file.url.startsWith('https://'))) {
      const imageRes = await fetch(file.url, { method: 'GET' });
      if (!imageRes.ok) {
        return res.status(502).json({ error: 'Failed to fetch image from URL' });
      }
      const arrayBuffer = await imageRes.arrayBuffer();
      imageBuffer = Buffer.from(arrayBuffer);
    } else {
      if (!file.path) {
        return res.status(400).json({ error: 'File has no storage path' });
      }
      const { storageService } = await import('../services/storageService');
      imageBuffer = await storageService.getFileBuffer(file.path);
    }
    const { OpenAIProvider } = await import('../ai/providers/OpenAIProvider');
    const provider = new OpenAIProvider();
    const result = await provider.editImage(imageBuffer, prompt.trim(), {
      background: background === 'transparent' || background === 'opaque' ? background : 'auto',
    });
    if (result.error) {
      return res.status(502).json({ success: false, error: result.error });
    }
    let url = result.url;
    let fileRecord: { id: string; name: string } | null = null;
    if (saveToDrive && (url || result.b64_json)) {
      const { storageService } = await import('../services/storageService');
      const dashboardIdStr = dashboardId && typeof dashboardId === 'string' ? dashboardId : null;
      const folderIdStr = folderId && typeof folderId === 'string' ? folderId : null;
      const fileName = (name && typeof name === 'string' && name.trim()) ? name.trim() : `ai-edited-${Date.now()}.png`;
      let buffer: Buffer;
      let contentType: string;
      if (result.b64_json) {
        buffer = Buffer.from(result.b64_json, 'base64');
        contentType = 'image/png';
      } else if (url) {
        const imageRes = await fetch(url, { method: 'GET' });
        if (!imageRes.ok) {
          return res.status(502).json({ error: 'Failed to fetch edited image from provider' });
        }
        contentType = imageRes.headers.get('content-type') || 'image/png';
        buffer = Buffer.from(await imageRes.arrayBuffer());
      } else {
        return res.status(502).json({ error: 'No image data to save' });
      }
      const ext = path.extname(fileName) || (contentType.includes('png') ? '.png' : '.jpg');
      const uniqueFilename = `files/${userId}-${Date.now()}-${Math.round(Math.random() * 1E9)}${ext}`;
      const fileLike = {
        fieldname: 'file',
        originalname: fileName,
        encoding: '7bit' as const,
        mimetype: contentType,
        buffer,
        size: buffer.length,
      } as Express.Multer.File;
      const uploadResult = await storageService.uploadFile(fileLike, uniqueFilename, {
        makePublic: true,
        metadata: { userId, originalName: fileName, folderId: folderIdStr || '', dashboardId: dashboardIdStr || '' },
      });
      const created = await prisma.file.create({
        data: {
          userId,
          name: fileName,
          type: contentType,
          size: buffer.length,
          url: uploadResult.url,
          path: uploadResult.path,
          folderId: folderIdStr,
          dashboardId: dashboardIdStr,
        },
      });
      fileRecord = { id: created.id, name: created.name };
      url = uploadResult.url;
    }
    res.json({
      success: true,
      data: {
        url: url ?? (result.b64_json ? `data:image/png;base64,${result.b64_json}` : undefined),
        fileId: fileRecord?.id,
        name: fileRecord?.name,
      },
    });
  } catch (error) {
    console.error('Edit image error:', error);
    res.status(500).json({
      error: 'Failed to edit image',
      message: error instanceof Error ? error.message : 'Unknown error occurred',
    });
  }
});

/**
 * POST /api/ai/extract-document
 * Extract structured data (invoice/receipt) from attached files. Schema-guaranteed output.
 */
router.post('/extract-document', authenticateJWT, async (req, res) => {
  try {
    const userId = req.user?.id;
    if (!userId) {
      return res.status(401).json({ error: 'User not authenticated' });
    }
    const { fileIds, documentType } = req.body;
    const ids = Array.isArray(fileIds) ? fileIds.filter((id: unknown) => typeof id === 'string') as string[] : [];
    if (ids.length === 0) {
      return res.status(400).json({ error: 'fileIds array with at least one file ID is required' });
    }
    const type: 'invoice' | 'receipt' = documentType === 'receipt' ? 'receipt' : 'invoice';

    const files = await prisma.file.findMany({
      where: {
        id: { in: ids },
        trashedAt: null,
        OR: [
          { userId },
          { permissions: { some: { userId, canRead: true } } },
        ],
      },
      select: { id: true, name: true, path: true, url: true, size: true, type: true },
    });

    if (files.length === 0) {
      return res.status(404).json({ error: 'No accessible files found' });
    }

    const { getFileSummaries } = await import('../services/fileAnalysisService');
    const summaries = await getFileSummaries(
      files.map((f) => ({
        id: f.id,
        name: f.name,
        path: f.path ?? undefined,
        url: f.url ?? undefined,
        size: f.size ?? 0,
        type: f.type ?? undefined,
      }))
    );

    const usableTexts = summaries
      .map((s) => s.summary)
      .filter((t) => t && t.length > 20 && !t.startsWith('(No text') && !t.startsWith('(File ') && !t.startsWith('(Could not') && !t.startsWith('(Image attached'));
    const combinedText = usableTexts.join('\n\n---\n\n');
    if (!combinedText || combinedText.length < 10) {
      return res.status(400).json({
        error: 'Could not extract enough text from the file(s). Try a text-based PDF or document.',
      });
    }

    const { extractInvoiceOrReceipt } = await import('../services/documentExtractionService');
    const result = await extractInvoiceOrReceipt(combinedText, type);
    if (!result.success) {
      return res.status(422).json({ success: false, error: result.error });
    }
    return res.json({ success: true, data: result.data });
  } catch (error) {
    console.error('Extract document error:', error);
    res.status(500).json({
      error: 'Failed to extract document',
      message: error instanceof Error ? error.message : 'Unknown error occurred',
    });
  }
});

/**
 * POST /api/ai/create-expense-from-extraction
 * Create an expense record from extracted invoice/receipt data (Phase 5 document intelligence workflow).
 */
router.post('/create-expense-from-extraction', authenticateJWT, async (req, res) => {
  try {
    const userId = req.user?.id;
    if (!userId) {
      return res.status(401).json({ error: 'User not authenticated' });
    }
    const body = req.body as Record<string, unknown>;
    const vendor = typeof body.vendor === 'string' ? body.vendor.trim() : '';
    const amount = typeof body.amount === 'number' ? body.amount : Number(body.amount);
    if (!vendor) {
      return res.status(400).json({ error: 'vendor is required' });
    }
    if (typeof amount !== 'number' || Number.isNaN(amount) || amount < 0) {
      return res.status(400).json({ error: 'amount must be a non-negative number' });
    }
    const currency = typeof body.currency === 'string' ? body.currency : null;
    const documentDate = typeof body.date === 'string' ? body.date : (typeof body.documentDate === 'string' ? body.documentDate : null);
    const category = typeof body.category === 'string' ? body.category : null;
    const invoiceNumber = typeof body.invoiceNumber === 'string' ? body.invoiceNumber : null;
    const notes = typeof body.notes === 'string' ? body.notes : null;
    const lineItems = Array.isArray(body.lineItems) ? (body.lineItems as Record<string, unknown>[]) : null;
    const sourceFileId = typeof body.sourceFileId === 'string' ? body.sourceFileId : null;
    const conversationId = typeof body.conversationId === 'string' ? body.conversationId : null;

    const expense = await prisma.aIExtractedExpense.create({
      data: {
        userId,
        vendor,
        amount,
        currency,
        documentDate,
        category,
        invoiceNumber,
        notes,
        lineItems: lineItems ? (lineItems as object) : undefined,
        sourceFileId,
        conversationId,
      },
    });

    res.status(201).json({
      success: true,
      data: {
        id: expense.id,
        vendor: expense.vendor,
        amount: expense.amount,
        currency: expense.currency,
        documentDate: expense.documentDate,
        category: expense.category,
        invoiceNumber: expense.invoiceNumber,
        sourceFileId: expense.sourceFileId,
        conversationId: expense.conversationId,
        createdAt: expense.createdAt,
      },
    });
  } catch (error) {
    console.error('Create expense from extraction error:', error);
    res.status(500).json({
      error: 'Failed to create expense',
      message: error instanceof Error ? error.message : 'Unknown error occurred',
    });
  }
});

// Multer for audio upload (STT): memory, 25MB, audio mime types
const audioUpload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 25 * 1024 * 1024 },
  fileFilter: (_req, file, cb) => {
    const ok = /^audio\//.test(file.mimetype) || ['video/webm', 'video/mp4'].includes(file.mimetype);
    cb(null, !!ok);
  },
}).single('audio');

/**
 * POST /api/ai/transcribe
 * Speech-to-text: accept audio file, return transcript (OpenAI Whisper). Phase 6.
 */
router.post('/transcribe', authenticateJWT, (req, res, next) => {
  audioUpload(req, res, (err: unknown) => {
    if (err) {
      return res.status(400).json({
        error: 'Invalid audio upload',
        message: err instanceof Error ? err.message : 'Upload failed',
      });
    }
    next();
  });
}, async (req, res) => {
  try {
    if (!req.user?.id) {
      return res.status(401).json({ error: 'User not authenticated' });
    }
    const file = (req as express.Request & { file?: Express.Multer.File }).file;
    if (!file || !file.buffer) {
      return res.status(400).json({ error: 'Audio file is required (field: audio)' });
    }
    const apiKey = process.env.OPENAI_API_KEY;
    if (!apiKey) {
      return res.status(503).json({ error: 'Transcription not configured (missing OPENAI_API_KEY)' });
    }
    const openai = new OpenAI({ apiKey });
    const ext = path.extname(file.originalname || '') || '.webm';
    const upload = await toFile(file.buffer, `audio${ext}`);
    const transcription = await openai.audio.transcriptions.create({
      file: upload,
      model: 'whisper-1',
    });
    const text = (transcription as { text?: string }).text ?? '';
    res.json({ success: true, transcript: text });
  } catch (error) {
    console.error('Transcribe error:', error);
    res.status(500).json({
      error: 'Transcription failed',
      message: error instanceof Error ? error.message : 'Unknown error',
    });
  }
});

/**
 * POST /api/ai/speech
 * Text-to-speech: accept text, return audio (OpenAI TTS). Phase 6 optional.
 */
router.post('/speech', authenticateJWT, async (req, res) => {
  try {
    if (!req.user?.id) {
      return res.status(401).json({ error: 'User not authenticated' });
    }
    const body = req.body as { text?: string; voice?: string };
    const text = typeof body.text === 'string' ? body.text.trim() : '';
    if (!text) {
      return res.status(400).json({ error: 'text is required' });
    }
    if (text.length > 4096) {
      return res.status(400).json({ error: 'text too long (max 4096 characters)' });
    }
    const apiKey = process.env.OPENAI_API_KEY;
    if (!apiKey) {
      return res.status(503).json({ error: 'TTS not configured (missing OPENAI_API_KEY)' });
    }
    const openai = new OpenAI({ apiKey });
    const allowedVoices = ['alloy', 'echo', 'fable', 'onyx', 'nova', 'shimmer'] as const;
    const voice = typeof body.voice === 'string' && allowedVoices.includes(body.voice as typeof allowedVoices[number])
      ? (body.voice as typeof allowedVoices[number])
      : 'alloy';
    const mp3 = await openai.audio.speech.create({
      model: 'tts-1',
      voice,
      input: text,
    });
    const buffer = Buffer.from(await mp3.arrayBuffer());
    res.setHeader('Content-Type', 'audio/mpeg');
    res.send(buffer);
  } catch (error) {
    console.error('TTS error:', error);
    res.status(500).json({
      error: 'Speech synthesis failed',
      message: error instanceof Error ? error.message : 'Unknown error',
    });
  }
});

/**
 * GET /api/ai/suggestions
 * List pending AI suggestions for the current user (Phase 7).
 */
router.get('/suggestions', authenticateJWT, async (req, res) => {
  try {
    const userId = req.user?.id;
    if (!userId) {
      return res.status(401).json({ error: 'User not authenticated' });
    }
    const list = await prisma.aISuggestion.findMany({
      where: { userId, status: 'PENDING' },
      orderBy: { createdAt: 'desc' },
      take: 20,
    });
    res.json({ success: true, data: list });
  } catch (error) {
    console.error('List suggestions error:', error);
    res.status(500).json({
      error: 'Failed to list suggestions',
      message: error instanceof Error ? error.message : 'Unknown error',
    });
  }
});

/**
 * POST /api/ai/suggestions/:id/accept
 * Mark suggestion as accepted (Phase 7). Optionally returns action URL for client to navigate.
 */
router.post('/suggestions/:id/accept', authenticateJWT, async (req, res) => {
  try {
    const userId = req.user?.id;
    if (!userId) {
      return res.status(401).json({ error: 'User not authenticated' });
    }
    const id = req.params.id;
    if (!id) {
      return res.status(400).json({ error: 'Suggestion ID required' });
    }
    const suggestion = await prisma.aISuggestion.findFirst({
      where: { id, userId, status: 'PENDING' },
    });
    if (!suggestion) {
      return res.status(404).json({ error: 'Suggestion not found or already handled' });
    }
    await prisma.aISuggestion.update({
      where: { id },
      data: { status: 'ACCEPTED', respondedAt: new Date() },
    });
    const actionData = suggestion.actionData as Record<string, unknown> | null;
    const fileId = actionData?.fileId as string | undefined;
    res.json({
      success: true,
      data: {
        suggestionId: id,
        actionUrl: fileId ? `/ai-chat?fileIds=${encodeURIComponent(fileId)}&suggestion=extract` : '/ai-chat',
      },
    });
  } catch (error) {
    console.error('Accept suggestion error:', error);
    res.status(500).json({
      error: 'Failed to accept suggestion',
      message: error instanceof Error ? error.message : 'Unknown error',
    });
  }
});

/**
 * POST /api/ai/suggestions/:id/dismiss
 * Mark suggestion as dismissed (Phase 7).
 */
router.post('/suggestions/:id/dismiss', authenticateJWT, async (req, res) => {
  try {
    const userId = req.user?.id;
    if (!userId) {
      return res.status(401).json({ error: 'User not authenticated' });
    }
    const id = req.params.id;
    if (!id) {
      return res.status(400).json({ error: 'Suggestion ID required' });
    }
    const suggestion = await prisma.aISuggestion.findFirst({
      where: { id, userId, status: 'PENDING' },
    });
    if (!suggestion) {
      return res.status(404).json({ error: 'Suggestion not found or already handled' });
    }
    await prisma.aISuggestion.update({
      where: { id },
      data: { status: 'DISMISSED', respondedAt: new Date() },
    });
    res.json({ success: true, data: { suggestionId: id } });
  } catch (error) {
    console.error('Dismiss suggestion error:', error);
    res.status(500).json({
      error: 'Failed to dismiss suggestion',
      message: error instanceof Error ? error.message : 'Unknown error',
    });
  }
});

/**
 * GET /api/ai/context
 * Get comprehensive cross-module user context
 */
router.get('/context', authenticateJWT, async (req, res) => {
  try {
    const userId = req.user?.id;
    
    if (!userId) {
      return res.status(401).json({ error: 'User not authenticated' });
    }

    const context = await digitalLifeTwin.getCrossModuleContext(userId);

    res.json({
      success: true,
      data: context
    });
  } catch (error) {
    console.error('Get context error:', error);
    res.status(500).json({
      error: 'Failed to get cross-module context',
      message: error instanceof Error ? error.message : 'Unknown error occurred'
    });
  }
});

/**
 * GET /api/ai/context/:module
 * Get module-specific context with cross-module intelligence
 */
router.get('/context/:module', authenticateJWT, async (req, res) => {
  try {
    const userId = req.user?.id;
    const { module } = req.params;
    
    if (!userId) {
      return res.status(401).json({ error: 'User not authenticated' });
    }

    const moduleContext = await digitalLifeTwin.getModuleContext(userId, module);

    res.json({
      success: true,
      data: moduleContext
    });
  } catch (error) {
    console.error('Get module context error:', error);
    res.status(500).json({
      error: 'Failed to get module context',
      message: error instanceof Error ? error.message : 'Unknown error occurred'
    });
  }
});

/**
 * GET /api/ai/learning/my-patterns
 * User-friendly learned patterns for the Memories view (read-only)
 */
router.get('/learning/my-patterns', authenticateJWT, async (req, res) => {
  try {
    const userId = req.user?.id;
    if (!userId) {
      return res.status(401).json({ success: false, error: 'User not authenticated' });
    }
    const raw = await learningEngine.getUserPatterns(userId);
    const patterns = raw.map(formatPatternForUser);
    res.json({ success: true, patterns });
  } catch (error) {
    console.error('Get my-patterns error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to load learned patterns',
      message: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

/**
 * POST /api/ai/chat
 * Legacy AI conversation endpoint (kept for backward compatibility)
 */
router.post('/chat', authenticateJWT, async (req, res) => {
  try {
    const { query, context, priority = 'medium' } = req.body;
    const userId = req.user?.id;
    
    if (!userId) {
      return res.status(401).json({ error: 'User not authenticated' });
    }

    if (!query) {
      return res.status(400).json({ error: 'Query is required' });
    }

    const aiRequest: AIRequest = {
      id: `ai_req_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      userId,
      query,
      context: context || {},
      timestamp: new Date(),
      priority
    };

    const response = await digitalLifeTwin.processRequest(aiRequest);

    res.json({
      success: true,
      data: response
    });
  } catch (error) {
    console.error('AI chat error:', error);
    res.status(500).json({
      error: 'Failed to process AI request',
      message: error instanceof Error ? error.message : 'Unknown error occurred'
    });
  }
});

/**
 * GET /api/ai/personality
 * Get user's personality profile
 */
router.get('/personality', authenticateJWT, async (req, res) => {
  try {
    const userId = req.user?.id;
    
    if (!userId) {
      return res.status(401).json({ error: 'User not authenticated' });
    }
    const personality = await personalityEngine.getPersonalityProfile(userId);

    res.json({
      success: true,
      data: personality
    });
  } catch (error) {
    console.error('Get personality error:', error);
    res.status(500).json({
      error: 'Failed to get personality profile',
      message: error instanceof Error ? error.message : 'Unknown error occurred'
    });
  }
});

/**
 * PUT /api/ai/personality
 * Update user's personality profile
 */
router.put('/personality', authenticateJWT, async (req, res) => {
  try {
    const userId = req.user?.id;
    
    if (!userId) {
      return res.status(401).json({ error: 'User not authenticated' });
    }
    const { interaction, feedback } = req.body;

    const updatedPersonality = await personalityEngine.updatePersonalityFromInteraction(
      userId,
      interaction,
      feedback
    );

    res.json({
      success: true,
      data: updatedPersonality
    });
  } catch (error) {
    console.error('Update personality error:', error);
    res.status(500).json({
      error: 'Failed to update personality profile',
      message: error instanceof Error ? error.message : 'Unknown error occurred'
    });
  }
});

/**
 * GET /api/ai/autonomy
 * Get user's autonomy settings
 */
router.get('/autonomy', authenticateJWT, async (req, res) => {
  try {
    const userId = req.user?.id;
    
    if (!userId) {
      return res.status(401).json({ error: 'User not authenticated' });
    }
    
    const settings = await prisma.aIAutonomySettings.findUnique({
      where: { userId }
    });

    if (!settings) {
      // Create default autonomy settings
      const defaultSettings = await prisma.aIAutonomySettings.create({
        data: {
          userId,
          scheduling: 30,
          communication: 20,
          fileManagement: 40,
          taskCreation: 30,
          dataAnalysis: 60,
          crossModuleActions: 20
        }
      });

      return res.json({
        success: true,
        data: defaultSettings
      });
    }

    res.json({
      success: true,
      data: settings
    });
  } catch (error) {
    console.error('Get autonomy settings error:', error);
    res.status(500).json({
      error: 'Failed to get autonomy settings',
      message: error instanceof Error ? error.message : 'Unknown error occurred'
    });
  }
});

/**
 * PUT /api/ai/autonomy
 * Update user's autonomy settings
 */
router.put('/autonomy', authenticateJWT, async (req, res) => {
  try {
    const userId = req.user?.id;
    
    if (!userId) {
      return res.status(401).json({ error: 'User not authenticated' });
    }
    const autonomyUpdates = req.body;

    const updatedSettings = await prisma.aIAutonomySettings.upsert({
      where: { userId },
      update: autonomyUpdates,
      create: {
        userId,
        ...autonomyUpdates
      }
    });

    res.json({
      success: true,
      data: updatedSettings
    });
  } catch (error) {
    console.error('Update autonomy settings error:', error);
    res.status(500).json({
      error: 'Failed to update autonomy settings',
      message: error instanceof Error ? error.message : 'Unknown error occurred'
    });
  }
});

/**
 * GET /api/ai/approvals
 * Get pending approval requests for user
 */
router.get('/approvals', authenticateJWT, async (req, res) => {
  try {
    const userId = req.user?.id;
    
    if (!userId) {
      return res.status(401).json({ error: 'User not authenticated' });
    }

    const approvals = await prisma.aIApprovalRequest.findMany({
      where: {
        userId,
        status: 'PENDING',
        expiresAt: {
          gt: new Date()
        }
      },
      orderBy: {
        createdAt: 'desc'
      }
    });

    res.json({
      success: true,
      data: approvals
    });
  } catch (error) {
    console.error('Get approvals error:', error);
    res.status(500).json({
      error: 'Failed to get approval requests',
      message: error instanceof Error ? error.message : 'Unknown error occurred'
    });
  }
});

/**
 * POST /api/ai/approvals/:id/respond
 * Respond to an approval request
 */
router.post('/approvals/:id/respond', authenticateJWT, async (req, res) => {
  try {
    const { id } = req.params;
    const { response, reasoning } = req.body;
    const userId = req.user?.id;
    
    if (!userId) {
      return res.status(401).json({ error: 'User not authenticated' });
    }

    if (!['approve', 'reject'].includes(response)) {
      return res.status(400).json({ error: 'Response must be approve or reject' });
    }

    const approval = await prisma.aIApprovalRequest.findUnique({
      where: { id }
    });

    if (!approval) {
      return res.status(404).json({ error: 'Approval request not found' });
    }

    if (approval.userId !== userId) {
      return res.status(403).json({ error: 'Not authorized to respond to this approval' });
    }

    // Update approval request
    const updatedApproval = await prisma.aIApprovalRequest.update({
      where: { id },
      data: {
        status: response === 'approve' ? 'APPROVED' : 'REJECTED',
        approvedBy: response === 'approve' ? userId : null,
        rejectedBy: response === 'reject' ? userId : null,
        rejectionReason: response === 'reject' ? reasoning : null,
        respondedAt: new Date(),
        responses: {
          push: {
            userId,
            response,
            reasoning,
            timestamp: new Date()
          }
        }
      }
    });

    // If approved, execute the action
    if (response === 'approve') {
      // TODO: Execute the approved action
      console.log('Action approved, executing:', approval.actionData);
    }

    res.json({
      success: true,
      data: updatedApproval
    });
  } catch (error) {
    console.error('Respond to approval error:', error);
    res.status(500).json({
      error: 'Failed to respond to approval request',
      message: error instanceof Error ? error.message : 'Unknown error occurred'
    });
  }
});

/**
 * GET /api/ai/history
 * Get AI conversation history
 */
router.get('/history', authenticateJWT, async (req, res) => {
  try {
    const userId = req.user?.id;
    
    if (!userId) {
      return res.status(401).json({ error: 'User not authenticated' });
    }
    const { limit = 50, offset = 0, sessionId } = req.query;

    const whereClause: Record<string, unknown> = { userId };
    if (sessionId) {
      whereClause.sessionId = sessionId;
    }

    const history = await prisma.aIConversationHistory.findMany({
      where: whereClause,
      orderBy: {
        createdAt: 'desc'
      },
      take: parseInt(limit as string),
      skip: parseInt(offset as string)
    });

    res.json({
      success: true,
      data: history
    });
  } catch (error) {
    console.error('Get AI history error:', error);
    res.status(500).json({
      error: 'Failed to get conversation history',
      message: error instanceof Error ? error.message : 'Unknown error occurred'
    });
  }
});

/**
 * POST /api/ai/feedback
 * Provide feedback on AI response
 */
router.post('/feedback', authenticateJWT, async (req, res) => {
  try {
    const { interactionId, feedback, rating } = req.body;
    const userId = req.user?.id;
    
    if (!userId) {
      return res.status(401).json({ error: 'User not authenticated' });
    }

    if (!interactionId || !feedback || rating === undefined) {
      return res.status(400).json({
        error: 'interactionId, feedback, and rating are required'
      });
    }

    // Update the conversation history with feedback
    const updatedHistory = await prisma.aIConversationHistory.updateMany({
      where: {
        id: interactionId,
        userId
      },
      data: {
        userFeedback: feedback,
        feedbackRating: rating,
        correctionApplied: rating <= 3 // Consider ratings 3 and below as corrections needed
      }
    });

    if (updatedHistory.count === 0) {
      return res.status(404).json({ error: 'Interaction not found' });
    }

    // Process feedback for learning
    // TODO: Implement feedback processing in learning engine

    res.json({
      success: true,
      message: 'Feedback recorded successfully'
    });
  } catch (error) {
    console.error('AI feedback error:', error);
    res.status(500).json({
      error: 'Failed to record feedback',
      message: error instanceof Error ? error.message : 'Unknown error occurred'
    });
  }
});

/**
 * GET /api/ai/usage
 * Get AI usage statistics
 */
router.get('/usage', authenticateJWT, async (req, res) => {
  try {
    const userId = req.user?.id;
    
    if (!userId) {
      return res.status(401).json({ error: 'User not authenticated' });
    }
    const { month, year } = req.query;

    const currentDate = new Date();
    const targetMonth = month ? parseInt(month as string) : currentDate.getMonth() + 1;
    const targetYear = year ? parseInt(year as string) : currentDate.getFullYear();

    let usage = await prisma.aIUsageTracking.findUnique({
      where: {
        userId_month_year: {
          userId,
          month: targetMonth,
          year: targetYear
        }
      }
    });

    if (!usage) {
      // Create default usage record
      usage = await prisma.aIUsageTracking.create({
        data: {
          userId,
          month: targetMonth,
          year: targetYear
        }
      });
    }

    res.json({
      success: true,
      data: usage
    });
  } catch (error) {
    console.error('Get AI usage error:', error);
    res.status(500).json({
      error: 'Failed to get usage statistics',
      message: error instanceof Error ? error.message : 'Unknown error occurred'
    });
  }
});

/**
 * GET /api/ai/insights
 * Get AI-generated insights about user's digital life
 */
router.get('/insights', authenticateJWT, async (req, res) => {
  try {
    const userId = req.user?.id;
    
    if (!userId) {
      return res.status(401).json({ error: 'User not authenticated' });
    }

    // Get recent activity and generate insights
    // TODO: Use recentActivity for AI analysis when implemented
    // const recentActivity = await prisma.activity.findMany({
    //   where: { userId },
    //   orderBy: { timestamp: 'desc' },
    //   take: 100
    // });

    // TODO: Generate insights using AI analysis
    const insights = [
      {
        type: 'productivity',
        title: 'Peak Productivity Hours',
        description: 'You are most productive between 9 AM and 11 AM',
        recommendation: 'Schedule important tasks during this time',
        confidence: 0.8
      },
      {
        type: 'communication',
        title: 'Communication Pattern',
        description: 'You respond to messages fastest in the afternoon',
        recommendation: 'Set expectations for morning response times',
        confidence: 0.7
      }
    ];

    res.json({
      success: true,
      data: insights
    });
  } catch (error) {
    console.error('Get AI insights error:', error);
    res.status(500).json({
      error: 'Failed to generate insights',
      message: error instanceof Error ? error.message : 'Unknown error occurred'
    });
  }
});

/**
 * POST /api/ai/teach
 * Teach AI about user preferences
 */
router.post('/teach', authenticateJWT, async (req, res) => {
  try {
    const { scenario, preference, reasoning } = req.body;
    const userId = req.user?.id;
    
    if (!userId) {
      return res.status(401).json({ error: 'User not authenticated' });
    }

    if (!scenario || !preference) {
      return res.status(400).json({
        error: 'Scenario and preference are required'
      });
    }

    // Create learning event
    const learningEvent = await prisma.aILearningEvent.create({
      data: {
        userId,
        eventType: 'preference_update',
        context: scenario,
        newBehavior: preference,
        userFeedback: reasoning,
        confidence: 0.9 // High confidence for explicit teaching
      }
    });

    // Update personality profile with new preference
    // TODO: Implement preference integration

    res.json({
      success: true,
      data: learningEvent,
      message: 'Preference learned successfully'
    });
  } catch (error) {
    console.error('AI teach error:', error);
    res.status(500).json({
      error: 'Failed to record preference',
      message: error instanceof Error ? error.message : 'Unknown error occurred'
    });
  }
});

export default router;