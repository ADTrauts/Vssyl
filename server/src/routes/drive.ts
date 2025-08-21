import { Router } from 'express';
import fileRouter from './file';
import folderRouter from './folder';
import { getItemActivity, getSharedItems } from '../controllers/fileController';

const driveRouter = Router();

driveRouter.use('/files', fileRouter);
driveRouter.use('/folders', folderRouter);
driveRouter.get('/items/:itemId/activity', getItemActivity);
driveRouter.get('/shared', getSharedItems);

export default driveRouter; 