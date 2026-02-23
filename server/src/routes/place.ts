import express from 'express';
import { authenticateJWT } from '../middleware/auth.js';
import * as placeController from '../controllers/placeController.js';
import * as placeListingController from '../controllers/placeListingController.js';
import * as placeDiscoveryController from '../controllers/placeDiscoveryController.js';
import * as placeTransactionController from '../controllers/placeTransactionController.js';
import * as placeAIController from '../controllers/placeAIController.js';
import * as placeMeetingController from '../controllers/placeMeetingController.js';
import * as placeCommunityController from '../controllers/placeCommunityController.js';
import * as placeAnalyticsController from '../controllers/placeAnalyticsController.js';

const router: express.Router = express.Router();

// All routes require authentication
router.use(authenticateJWT);

// Place CRUD
router.get('/', placeController.getPlace);
router.put('/settings', placeController.updatePlaceSettings);
router.post('/complete-setup', placeController.completeSetup);

// Node management
router.post('/nodes', placeController.addNode);
router.put('/nodes/:nodeId', placeController.updateNode);
router.delete('/nodes/:nodeId', placeController.removeNode);

// Interests
router.post('/interests', placeController.setInterests);

// Follow visibility
router.get('/follow-visibility/:businessId', placeController.getFollowVisibility);
router.put('/follow-visibility/:businessId', placeController.updateFollowVisibility);

// User connections
router.get('/connections', placeController.getConnections);
router.get('/users/search', placeController.searchUsers);
router.post('/connections/:targetUserId', placeController.sendConnectionRequest);
router.put('/connections/:relationshipId/accept', placeController.acceptConnection);

// Public explore & profile
router.get('/explore', placeListingController.explorePlaces);
router.get('/categories', placeListingController.getCategories);
router.get('/business/:businessId/profile', placeListingController.getBusinessProfile);

// Report listing (content moderation)
router.post('/report/:businessId', placeListingController.reportListing);

// Business admin listing management
router.get('/listing/:businessId', placeListingController.getListing);
router.post('/listing/:businessId', placeListingController.upsertListing);
router.post('/listing/:businessId/links', placeListingController.addInteractionLink);
router.put('/listing/:businessId/links/:linkId', placeListingController.updateInteractionLink);
router.delete('/listing/:businessId/links/:linkId', placeListingController.deleteInteractionLink);

// Transactions & Interactions
router.get('/transactions/summary', placeTransactionController.getTransactionSummary);
router.get('/transactions/:transactionId', placeTransactionController.getTransaction);
router.get('/transactions', placeTransactionController.getTransactions);
router.post('/transactions', placeTransactionController.createTransaction);
router.put('/transactions/:transactionId/privacy', placeTransactionController.updateTransactionPrivacy);
router.post('/interactions/click', placeTransactionController.trackInteractionClick);
router.get('/interactions/stats/:businessId', placeTransactionController.getInteractionStats);

// Meeting Places
router.get('/meetings', placeMeetingController.getMeetings);
router.post('/meetings', placeMeetingController.createMeeting);
router.get('/meetings/:meetingId', placeMeetingController.getMeeting);
router.put('/meetings/:meetingId', placeMeetingController.updateMeeting);
router.delete('/meetings/:meetingId', placeMeetingController.deleteMeeting);
router.put('/meetings/:meetingId/rsvp', placeMeetingController.rsvpMeeting);
router.post('/meetings/:meetingId/calendar', placeMeetingController.linkToCalendar);

// Location privacy
router.get('/location-privacy', placeMeetingController.getLocationPrivacy);
router.put('/location-privacy', placeMeetingController.updateLocationPrivacy);

// Communities
router.get('/communities', placeCommunityController.getCommunities);
router.post('/communities', placeCommunityController.createCommunity);
router.get('/communities/:communityId', placeCommunityController.getCommunity);
router.post('/communities/:communityId/join', placeCommunityController.joinCommunity);
router.delete('/communities/:communityId/leave', placeCommunityController.leaveCommunity);
router.post('/communities/auto-cluster', placeCommunityController.generateAutoClusters);

// Activity feed
router.get('/feed', placeAnalyticsController.getActivityFeed);

// Analytics
router.get('/analytics', placeAnalyticsController.getPersonalAnalytics);

// Data export (GDPR)
router.get('/export', placeAnalyticsController.exportUserData);

// Discovery & Suggestions
router.get('/discover/local', placeDiscoveryController.getLocalSuggestions);
router.get('/discover/for-you', placeDiscoveryController.getForYouSuggestions);
router.post('/discover/dismiss/:businessId', placeDiscoveryController.dismissSuggestion);

// AI assistant
router.get('/ai/recommendations', placeAIController.getAIRecommendations);
router.post('/ai/purchase-help', placeAIController.getPurchaseHelp);
router.post('/ai/reservation-help', placeAIController.getReservationHelp);

// AI context providers
router.get('/ai/context/overview', placeController.getPlaceContextOverview);
router.get('/ai/context/connections', placeDiscoveryController.getPlaceConnectionsContext);
router.get('/ai/context/discoveries', placeDiscoveryController.getPlaceDiscoveriesContext);
router.get('/ai/context/activity', placeAIController.getPlaceActivityContext);
router.get('/ai/context/analytics', placeAnalyticsController.getPlaceAnalyticsContext);

export default router;
