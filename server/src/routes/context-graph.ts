import { Router } from 'express';
import { authenticateJWT } from '../middleware/auth.js';
import * as contextGraphController from '../controllers/contextGraphController.js';
import * as contextGraphTagController from '../controllers/contextGraphTagController.js';

const contextGraphRouter: Router = Router();

contextGraphRouter.use(authenticateJWT);

contextGraphRouter.get('/vlinks/:id/bundle', contextGraphController.getVLinkBundleHandler);
contextGraphRouter.post('/bundle/resolve', contextGraphController.postBundleResolveHandler);
contextGraphRouter.post('/ai/grounding-bundle', contextGraphController.postAiGroundingBundleHandler);
contextGraphRouter.post('/knowledge/compose', contextGraphController.postKnowledgeComposeHandler);
contextGraphRouter.post('/knowledge/diagnostics', contextGraphController.postKnowledgeDiagnosticsHandler);
contextGraphRouter.post('/knowledge/neighborhood', contextGraphController.postKnowledgeNeighborhoodHandler);

contextGraphRouter.get('/tags/search', contextGraphTagController.getTagsSearchHandler);
contextGraphRouter.get('/tags/by-entity', contextGraphTagController.getTagsByEntityHandler);
contextGraphRouter.get('/tags/by-module', contextGraphTagController.getTagsByModuleHandler);

export default contextGraphRouter;
