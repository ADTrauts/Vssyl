import express from 'express';
import { body, param } from 'express-validator';
import { authenticateJWT } from '../middleware/auth';
import { validate } from '../middleware/validateRequest';
import {
  listFiles,
  uploadFile,
  downloadFile,
  updateFile,
  deleteFile,
  multerUploadWithErrorHandling,
  listFilePermissions,
  grantFilePermission,
  updateFilePermission,
  revokeFilePermission,
  listTrashedFiles,
  restoreFile,
  hardDeleteFile,
  toggleFileStarred,
  reorderFiles,
  moveFile,
} from '../controllers/fileController';
import { logger } from '../lib/logger';

function logSrvErr(operation: string, message: string, err: unknown, context?: Record<string, unknown>): void {
  const e = err instanceof Error ? err : new Error(String(err));
  void logger.error(message, {
    operation,
    error: { message: e.message, stack: e.stack },
    ...(context ? { context } : {}),
  });
}
function logSrvWarn(operation: string, message: string, err?: unknown, context?: Record<string, unknown>): void {
  if (err !== undefined) {
    const e = err instanceof Error ? err : new Error(String(err));
    void logger.warn(message, {
      operation,
      error: { message: e.message, stack: e.stack },
      ...(context ? { context } : {}),
    });
  } else {
    void logger.warn(message, { operation, ...(context ? { context } : {}) });
  }
}
function logSrvDebug(operation: string, message: string, context?: Record<string, unknown>): void {
  void logger.debug(message, { operation, ...(context ? { context } : {}) });
}

const router: express.Router = express.Router();

/** File id in path (UUID) */
const fileIdParam = validate([param('id').isUUID()]);

/** Root folder uses literal `null` in path for reorder */
const reorderFolderIdParam = validate([
  param('folderId').custom((value: string) => {
    if (value === 'null') return true;
    if (typeof value === 'string' && /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(value)) {
      return true;
    }
    throw new Error('Invalid folderId');
  }),
]);

const reorderFilesBody = validate([
  body('fileIds').isArray({ min: 1 }),
  body('fileIds.*').isUUID(),
]);

const filePermissionUserParams = validate([param('id').isUUID(), param('userId').isUUID()]);

const grantFilePermissionBody = validate([
  body('userId').isUUID(),
  body('canRead').isBoolean(),
  body('canWrite').isBoolean(),
]);

const moveFileBody = validate([
  body('targetFolderId').optional({ nullable: true, values: 'null' }).isUUID(),
]);

/** Multipart text fields after multer (folderId / dashboardId from FormData) */
const uploadMultipartFields = validate([
  body('folderId')
    .optional()
    .custom((v) => v === undefined || v === null || v === '' || (typeof v === 'string' && /^[0-9a-f-]{36}$/i.test(v))),
  body('dashboardId')
    .optional()
    .custom((v) => v === undefined || v === null || v === '' || (typeof v === 'string' && /^[0-9a-f-]{36}$/i.test(v))),
  body('chat').optional().custom((v) => {
    if (v === undefined || v === null || v === '') return true;
    if (typeof v === 'boolean') return true;
    if (typeof v === 'string') return ['true', 'false', '1', '0'].includes(v);
    return false;
  }),
]);

const putUpdateFileBody = validate([
  body('name').optional().isString(),
  body('folderId').optional({ nullable: true, values: 'null' }).isUUID(),
]);

const putUpdateFilePermissionBody = validate([
  body('canRead').isBoolean(),
  body('canWrite').isBoolean(),
]);

// List all files for the authenticated user (optionally by folder)
router.get('/', authenticateJWT, listFiles);

// List trashed files
router.get('/trashed', authenticateJWT, listTrashedFiles);

// Upload a new file
router.post('/', authenticateJWT, multerUploadWithErrorHandling, uploadMultipartFields, uploadFile);

// Reorder files within a folder (specific route before parameterized routes)
router.post(
  '/reorder/:folderId',
  authenticateJWT,
  reorderFolderIdParam,
  reorderFilesBody,
  reorderFiles
);

// All specific routes with /:id must come before the generic /:id route
router.get('/:id/download', authenticateJWT, fileIdParam, downloadFile);

router.get('/:id/permissions', authenticateJWT, fileIdParam, listFilePermissions);

router.post(
  '/:id/permissions',
  authenticateJWT,
  fileIdParam,
  grantFilePermissionBody,
  grantFilePermission
);

router.put(
  '/:id/permissions/:userId',
  authenticateJWT,
  filePermissionUserParams,
  updateFilePermission
);

router.delete(
  '/:id/permissions/:userId',
  authenticateJWT,
  filePermissionUserParams,
  revokeFilePermission
);

router.put('/:id/star', authenticateJWT, fileIdParam, toggleFileStarred);

router.post('/:id/restore', authenticateJWT, fileIdParam, restoreFile);

router.delete('/:id/hard-delete', authenticateJWT, fileIdParam, hardDeleteFile);

router.post('/:id/move', authenticateJWT, fileIdParam, moveFileBody, moveFile);

router.get('/:id', authenticateJWT, fileIdParam, downloadFile);

router.put('/:id', authenticateJWT, fileIdParam, putUpdateFileBody, updateFile);

router.delete('/:id', authenticateJWT, fileIdParam, deleteFile);

export default router;

// Log all registered routes in development (after all routes are registered)
if (process.env.NODE_ENV === 'development') {
  setTimeout(() => {
    logSrvDebug('file_router_registered_routes', 'File router registered routes', {
      totalRoutes: router.stack.length,
      downloadRoute: router.stack.find(
        (layer: { route?: { methods?: { get?: boolean }; path?: string } }) =>
          layer.route?.methods?.get && layer.route?.path === '/:id/download'
      )
        ? 'found'
        : 'missing',
      directRoute: router.stack.find(
        (layer: { route?: { methods?: { get?: boolean }; path?: string } }) =>
          layer.route?.methods?.get && layer.route?.path === '/:id' && !layer.route?.path?.includes('download')
      )
        ? 'found'
        : 'missing',
      allRoutes: router.stack
        .map((layer: { route?: { path?: string; methods?: Record<string, boolean> } }) => ({
          path: layer.route?.path,
          methods: Object.keys(layer.route?.methods || {}),
        }))
        .filter((r: { path?: string }) => r.path),
    });
  }, 100);
}
