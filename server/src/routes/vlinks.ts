import { Router } from 'express';
import { authenticateJWT } from '../middleware/auth';
import * as vlinkController from '../controllers/vlinkController';
import * as vlinkAIContextController from '../controllers/vlinkAIContextController';

const vlinksRouter: Router = Router();

vlinksRouter.use(authenticateJWT);

vlinksRouter.get('/search', vlinkController.searchVLinksHandler);
vlinksRouter.get('/suggestions', vlinkController.listSuggestionsHandler);
vlinksRouter.post('/suggestions', vlinkController.createSuggestionHandler);
vlinksRouter.post('/suggestions/:id/accept', vlinkController.acceptSuggestionHandler);
vlinksRouter.post('/suggestions/:id/reject', vlinkController.rejectSuggestionHandler);
vlinksRouter.get('/entity/:entityType/:entityId', vlinkController.getEntityVLinksHandler);
vlinksRouter.get('/ai/context/recent', vlinkAIContextController.getVLinkAIContext);

vlinksRouter.get('/', vlinkController.listVLinksHandler);
vlinksRouter.post('/', vlinkController.createVLinkHandler);

vlinksRouter.patch('/:id', vlinkController.updateVLinkHandler);
vlinksRouter.delete('/:id', vlinkController.deleteVLinkHandler);
vlinksRouter.post('/:id/archive', vlinkController.archiveVLinkHandler);
vlinksRouter.post('/:id/restore', vlinkController.restoreVLinkHandler);
vlinksRouter.post('/:id/ownership/transfer', vlinkController.transferOwnershipHandler);
vlinksRouter.get('/:id/members', vlinkController.listVLinkMembersHandler);
vlinksRouter.post('/:id/members', vlinkController.inviteVLinkMemberHandler);
vlinksRouter.patch('/:id/members/:memberId', vlinkController.updateVLinkMemberHandler);
vlinksRouter.delete('/:id/members/:memberId', vlinkController.removeVLinkMemberHandler);
vlinksRouter.get('/:id/entities', vlinkController.listVLinkEntitiesHandler);
vlinksRouter.post('/:id/entities', vlinkController.linkEntityHandler);
vlinksRouter.delete('/:id/entities/:entityLinkId', vlinkController.unlinkEntityHandler);
vlinksRouter.get('/:id/activity', vlinkController.listActivityHandler);
vlinksRouter.get('/:idOrCode', vlinkController.getVLinkHandler);

export default vlinksRouter;
