console.log('[DEBUG] fileRouter loaded');
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

// List all files for the authenticated user (optionally by folder)
router.get('/', authenticateJWT, listFiles);

// List trashed files
router.get('/trashed', authenticateJWT, listTrashedFiles);

// Upload a new file
router.post('/', authenticateJWT, multerUploadWithErrorHandling, uploadFile);

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

router.put('/:id', authenticateJWT, fileIdParam, updateFile);

router.delete('/:id', authenticateJWT, fileIdParam, deleteFile);

export default router;

// Log all registered routes in development (after all routes are registered)
if (process.env.NODE_ENV === 'development') {
  setTimeout(() => {
    console.log('📁 File router registered routes:', {
      totalRoutes: router.stack.length,
      downloadRoute: router.stack.find(
        (layer: { route?: { methods?: { get?: boolean }; path?: string } }) =>
          layer.route?.methods?.get && layer.route?.path === '/:id/download'
      )
        ? '✅ Found'
        : '❌ Missing',
      directRoute: router.stack.find(
        (layer: { route?: { methods?: { get?: boolean }; path?: string } }) =>
          layer.route?.methods?.get && layer.route?.path === '/:id' && !layer.route?.path?.includes('download')
      )
        ? '✅ Found'
        : '❌ Missing',
      allRoutes: router.stack
        .map((layer: { route?: { path?: string; methods?: Record<string, boolean> } }) => ({
          path: layer.route?.path,
          methods: Object.keys(layer.route?.methods || {}),
        }))
        .filter((r: { path?: string }) => r.path),
    });
  }, 100);
}
