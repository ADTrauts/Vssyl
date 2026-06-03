import { Router } from 'express';
import { authenticateJWT } from '../middleware/auth';
import * as notebookLinkController from '../controllers/notebookLinkController';
import * as notebookContextController from '../controllers/notebookContextController';
import * as notebookAIController from '../controllers/notebookAIController';
import * as notebookWorkspaceContextController from '../controllers/notebookWorkspaceContextController';

const notebookRouter: Router = Router();

notebookRouter.use(authenticateJWT);

notebookRouter.get('/workspace/context', notebookWorkspaceContextController.getWorkspaceContext);
notebookRouter.get('/workspace/insights', notebookWorkspaceContextController.getWorkspaceInsights);
notebookRouter.get('/entities/:entityType/:entityId/links', notebookLinkController.getEntityLinks);
notebookRouter.get('/pages/:pageId/context', notebookContextController.getPageContext);
notebookRouter.post('/pages/:pageId/ai/summary', notebookAIController.postPageSummary);
notebookRouter.post('/pages/:pageId/ai/action-items', notebookAIController.postExtractActionItems);
notebookRouter.post('/pages/:pageId/ai/action-items/confirm', notebookAIController.postConfirmActionItems);
notebookRouter.post('/pages/:pageId/ai/meeting-recap', notebookAIController.postMeetingRecap);
notebookRouter.post('/pages/:pageId/ai/suggest-links', notebookAIController.postSuggestLinks);
notebookRouter.get('/pages/:pageId/links', notebookLinkController.getPageLinks);
notebookRouter.post('/pages/:pageId/links', notebookLinkController.createPageLink);
notebookRouter.delete('/links/:linkId', notebookLinkController.archiveNotebookLink);

export default notebookRouter;
