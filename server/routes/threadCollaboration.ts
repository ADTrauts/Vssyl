import express from 'express';
import { authenticateToken } from '../middleware/auth.js';
import {
  createMention,
  getThreadMentions,
  getUserNotifications,
  markNotificationAsRead,
  createAssignment,
  updateAssignmentStatus,
  getThreadAssignments,
  addCollaborator,
  updateCollaboratorRole,
  removeCollaborator,
  getThreadCollaborators,
  createEdit,
  getThreadEdits
} from '../controllers/threadCollaboration';
import { logger } from '../utils/logger';
import { ThreadCollaborationService } from '../services/threadCollaborationService';

const router = express.Router();
const threadCollaborationService = new ThreadCollaborationService();

// Mention routes
router.post('/mentions', authenticateToken, createMention);
router.get('/threads/:threadId/mentions', authenticateToken, getThreadMentions);

// Notification routes
router.get('/notifications', authenticateToken, getUserNotifications);
router.put('/notifications/:notificationId/read', authenticateToken, markNotificationAsRead);

// Assignment routes
router.post('/assignments', authenticateToken, createAssignment);
router.put('/assignments/:assignmentId/status', authenticateToken, updateAssignmentStatus);
router.get('/threads/:threadId/assignments', authenticateToken, getThreadAssignments);

// Collaborator routes
router.post('/:threadId/collaborators', authenticateToken, async (req, res) => {
  try {
    const { threadId } = req.params;
    const { userId, role } = req.body;
    const collaborator = await threadCollaborationService.addCollaborator(threadId, userId, role);
    res.json(collaborator);
  } catch (error) {
    res.status(500).json({ error: 'Failed to add collaborator' });
  }
});

router.delete('/:threadId/collaborators/:userId', authenticateToken, async (req, res) => {
  try {
    const { threadId, userId } = req.params;
    await threadCollaborationService.removeCollaborator(threadId, userId);
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: 'Failed to remove collaborator' });
  }
});

router.get('/:threadId/collaborators', authenticateToken, async (req, res) => {
  try {
    const { threadId } = req.params;
    const collaborators = await threadCollaborationService.getCollaborators(threadId);
    res.json(collaborators);
  } catch (error) {
    res.status(500).json({ error: 'Failed to get collaborators' });
  }
});

// Edit routes
router.post('/edits', authenticateToken, createEdit);
router.get('/threads/:threadId/edits', authenticateToken, getThreadEdits);

// Comments
router.post('/:threadId/comments', authenticateToken, async (req, res) => {
  try {
    const { threadId } = req.params;
    const { content } = req.body;
    const comment = await threadCollaborationService.addComment(threadId, req.user.id, content);
    res.json(comment);
  } catch (error) {
    res.status(500).json({ error: 'Failed to add comment' });
  }
});

router.get('/:threadId/comments', authenticateToken, async (req, res) => {
  try {
    const { threadId } = req.params;
    const { limit } = req.query;
    const comments = await threadCollaborationService.getComments(threadId, limit ? parseInt(limit as string) : undefined);
    res.json(comments);
  } catch (error) {
    res.status(500).json({ error: 'Failed to get comments' });
  }
});

router.put('/comments/:commentId', authenticateToken, async (req, res) => {
  try {
    const comment = await threadCollaborationService.updateComment(
      req.params.commentId,
      req.body.content
    );
    res.json(comment);
  } catch (error) {
    logger.error('Error updating comment:', error);
    res.status(500).json({ error: 'Failed to update comment' });
  }
});

router.delete('/comments/:commentId', authenticateToken, async (req, res) => {
  try {
    await threadCollaborationService.deleteComment(req.params.commentId);
    res.status(204).send();
  } catch (error) {
    logger.error('Error deleting comment:', error);
    res.status(500).json({ error: 'Failed to delete comment' });
  }
});

// Insights
router.post('/:threadId/insights', authenticateToken, async (req, res) => {
  try {
    const { threadId } = req.params;
    const { type, content } = req.body;
    const insight = await threadCollaborationService.addInsight(threadId, req.user.id, type, content);
    res.json(insight);
  } catch (error) {
    res.status(500).json({ error: 'Failed to add insight' });
  }
});

router.get('/:threadId/insights', authenticateToken, async (req, res) => {
  try {
    const { threadId } = req.params;
    const insights = await threadCollaborationService.getInsights(threadId);
    res.json(insights);
  } catch (error) {
    res.status(500).json({ error: 'Failed to get insights' });
  }
});

router.put('/insights/:insightId', authenticateToken, async (req, res) => {
  try {
    const insight = await threadCollaborationService.updateInsight(
      req.params.insightId,
      req.body
    );
    res.json(insight);
  } catch (error) {
    logger.error('Error updating insight:', error);
    res.status(500).json({ error: 'Failed to update insight' });
  }
});

router.delete('/insights/:insightId', authenticateToken, async (req, res) => {
  try {
    await threadCollaborationService.deleteInsight(req.params.insightId);
    res.status(204).send();
  } catch (error) {
    logger.error('Error deleting insight:', error);
    res.status(500).json({ error: 'Failed to delete insight' });
  }
});

// Version History
router.post('/:threadId/versions', authenticateToken, async (req, res) => {
  try {
    const { threadId } = req.params;
    const { content } = req.body;
    const version = await threadCollaborationService.createVersion(threadId, req.user.id, content);
    res.json(version);
  } catch (error) {
    res.status(500).json({ error: 'Failed to create version' });
  }
});

router.get('/:threadId/versions', authenticateToken, async (req, res) => {
  try {
    const { threadId } = req.params;
    const { limit } = req.query;
    const versions = await threadCollaborationService.getVersions(threadId, limit ? parseInt(limit as string) : undefined);
    res.json(versions);
  } catch (error) {
    res.status(500).json({ error: 'Failed to get versions' });
  }
});

export default router; 