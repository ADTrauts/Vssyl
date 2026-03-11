import { Router } from 'express';
import { authenticateJWT } from '../middleware/auth';
import * as notesController from '../controllers/notesController';
import * as notesAIContextController from '../controllers/notesAIContextController';
import * as notesFolderController from '../controllers/notesFolderController';
import * as notesShareController from '../controllers/notesShareController';

const notesRouter: Router = Router();

// All routes require authentication
notesRouter.use(authenticateJWT);

// AI context (must be before /:id so "ai" is not captured as id)
notesRouter.get('/ai/context/recent', notesAIContextController.getRecentNotesContext);
notesRouter.get('/ai/context/pinned', notesAIContextController.getPinnedNotesContext);

// Folders (must be before /:id so "folders" is not captured as id)
notesRouter.get('/folders', notesFolderController.getFolders);
notesRouter.post('/folders', notesFolderController.createFolder);
notesRouter.put('/folders/:id', notesFolderController.updateFolder);
notesRouter.delete('/folders/:id', notesFolderController.deleteFolder);

notesRouter.get('/', notesController.getNotes);
notesRouter.get('/:id/shares', notesShareController.getNoteShares);
notesRouter.post('/:id/share', notesShareController.shareNote);
notesRouter.delete('/:id/share/:userId', notesShareController.revokeShare);
notesRouter.get('/:id', notesController.getNoteById);
notesRouter.post('/', notesController.createNote);
notesRouter.put('/:id', notesController.updateNote);
notesRouter.delete('/:id', notesController.deleteNote);

export default notesRouter;
