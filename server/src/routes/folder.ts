import express from 'express';
import { body, param } from 'express-validator';
import { authenticateJWT } from '../middleware/auth';
import { validate } from '../middleware/validateRequest';
import {
  listFolders,
  createFolder,
  updateFolder,
  deleteFolder,
  listTrashedFolders,
  restoreFolder,
  hardDeleteFolder,
  getRecentActivity,
  toggleFolderStarred,
  reorderFolders,
  moveFolder,
} from '../controllers/folderController';
import {
  listFolderPermissions,
  grantFolderPermission,
  updateFolderPermission,
  revokeFolderPermission,
} from '../controllers/folderPermissionController';

const router: express.Router = express.Router();

const folderIdParam = validate([param('id').isUUID()]);

const parentIdReorderParam = validate([
  param('parentId').custom((value: string) => {
    if (value === 'null') return true;
    if (typeof value === 'string' && /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(value)) {
      return true;
    }
    throw new Error('Invalid parentId');
  }),
]);

const reorderFoldersBody = validate([
  body('folderIds').isArray({ min: 1 }),
  body('folderIds.*').isUUID(),
]);

const createFolderBody = validate([
  body('name').isString().notEmpty(),
  body('parentId').optional({ nullable: true, values: 'null' }).isUUID(),
  body('dashboardId').optional({ nullable: true, values: 'null' }).isUUID(),
]);

const moveFolderBody = validate([
  body('targetParentId').optional({ nullable: true, values: 'null' }).isUUID(),
]);

const folderPermissionUserParams = validate([param('id').isUUID(), param('userId').isUUID()]);

const grantFolderPermissionBody = validate([
  body('userId').isUUID(),
  body('canRead').isBoolean(),
  body('canWrite').isBoolean(),
]);

router.get('/', authenticateJWT, listFolders);

router.get('/trashed', authenticateJWT, listTrashedFolders);

router.post('/', authenticateJWT, createFolderBody, createFolder);

router.put('/:id', authenticateJWT, folderIdParam, updateFolder);

router.delete('/:id', authenticateJWT, folderIdParam, deleteFolder);

router.post('/:id/restore', authenticateJWT, folderIdParam, restoreFolder);

router.delete('/:id/hard', authenticateJWT, folderIdParam, hardDeleteFolder);

router.put('/:id/star', authenticateJWT, folderIdParam, toggleFolderStarred);

router.get('/activity/recent', authenticateJWT, getRecentActivity);

router.post(
  '/reorder/:parentId',
  authenticateJWT,
  parentIdReorderParam,
  reorderFoldersBody,
  reorderFolders
);

router.post('/:id/move', authenticateJWT, folderIdParam, moveFolderBody, moveFolder);

router.get('/:id/permissions', authenticateJWT, folderIdParam, listFolderPermissions);

router.post(
  '/:id/permissions',
  authenticateJWT,
  folderIdParam,
  grantFolderPermissionBody,
  grantFolderPermission
);

router.put(
  '/:id/permissions/:userId',
  authenticateJWT,
  folderPermissionUserParams,
  updateFolderPermission
);

router.delete(
  '/:id/permissions/:userId',
  authenticateJWT,
  folderPermissionUserParams,
  revokeFolderPermission
);

export default router;
