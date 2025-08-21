import express from 'express';
import { 
  getInstalledModules, 
  getMarketplaceModules, 
  installModule, 
  uninstallModule, 
  configureModule, 
  getModuleCategories, 
  getModuleDetails,
  getModuleRuntimeConfig,
  submitModule,
  getModuleSubmissions,
  reviewModuleSubmission,
  getUserSubmissions,
  linkModuleToBusiness,
  getBusinessModules
} from '../controllers/moduleController';

const router = express.Router();

// Get installed modules for current user
router.get('/installed', getInstalledModules);

// Get marketplace modules
router.get('/marketplace', getMarketplaceModules);

// Get module categories
router.get('/categories', getModuleCategories);

// Get module details
router.get('/:moduleId', getModuleDetails);

// Get module runtime config
router.get('/:moduleId/runtime', getModuleRuntimeConfig);

// Install a module
router.post('/:moduleId/install', installModule);

// Uninstall a module
router.delete('/:moduleId/uninstall', uninstallModule);

// Configure a module
router.put('/:moduleId/configure', configureModule);

// Submit a module
router.post('/submit', submitModule);

// Get module submissions (admin only)
router.get('/submissions', getModuleSubmissions);

// Get user's submissions
router.get('/user/submissions', getUserSubmissions);

// Review a module submission (admin only)
router.post('/submissions/:submissionId/review', reviewModuleSubmission);

// Link module to business
router.post('/link-business', linkModuleToBusiness);

// Get modules for a specific business
router.get('/business/:businessId', getBusinessModules);

export default router; 