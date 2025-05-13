import { Request, Response } from 'express';
import { ThreadCollaborationService } from '../services/threadCollaborationService';
import { handleError } from '../utils/errorHandler';

const collaborationService = new ThreadCollaborationService();

// Mention endpoints
export const createMention = async (req: Request, res: Response) => {
  try {
    const { threadId, mentionedToId } = req.body;
    const mention = await collaborationService.createMention(threadId, req.user.id, mentionedToId);
    res.json(mention);
  } catch (error) {
    handleError(error, res);
  }
};

export const getThreadMentions = async (req: Request, res: Response) => {
  try {
    const { threadId } = req.params;
    const mentions = await collaborationService.getThreadMentions(threadId);
    res.json(mentions);
  } catch (error) {
    handleError(error, res);
  }
};

// Notification endpoints
export const getUserNotifications = async (req: Request, res: Response) => {
  try {
    const limit = req.query.limit ? parseInt(req.query.limit as string) : 20;
    const notifications = await collaborationService.getUserNotifications(req.user.id, limit);
    res.json(notifications);
  } catch (error) {
    handleError(error, res);
  }
};

export const markNotificationAsRead = async (req: Request, res: Response) => {
  try {
    const { notificationId } = req.params;
    const notification = await collaborationService.markNotificationAsRead(notificationId);
    res.json(notification);
  } catch (error) {
    handleError(error, res);
  }
};

// Assignment endpoints
export const createAssignment = async (req: Request, res: Response) => {
  try {
    const { threadId, assignedToId, dueDate } = req.body;
    const assignment = await collaborationService.createAssignment(threadId, assignedToId, req.user.id, dueDate);
    res.json(assignment);
  } catch (error) {
    handleError(error, res);
  }
};

export const updateAssignmentStatus = async (req: Request, res: Response) => {
  try {
    const { assignmentId } = req.params;
    const { status } = req.body;
    const assignment = await collaborationService.updateAssignmentStatus(assignmentId, status);
    res.json(assignment);
  } catch (error) {
    handleError(error, res);
  }
};

export const getThreadAssignments = async (req: Request, res: Response) => {
  try {
    const { threadId } = req.params;
    const assignments = await collaborationService.getThreadAssignments(threadId);
    res.json(assignments);
  } catch (error) {
    handleError(error, res);
  }
};

// Collaborator endpoints
export const addCollaborator = async (req: Request, res: Response) => {
  try {
    const { threadId, userId, role } = req.body;
    const collaborator = await collaborationService.addCollaborator(threadId, userId, role);
    res.json(collaborator);
  } catch (error) {
    handleError(error, res);
  }
};

export const updateCollaboratorRole = async (req: Request, res: Response) => {
  try {
    const { threadId, userId } = req.params;
    const { role } = req.body;
    const collaborator = await collaborationService.updateCollaboratorRole(threadId, userId, role);
    res.json(collaborator);
  } catch (error) {
    handleError(error, res);
  }
};

export const removeCollaborator = async (req: Request, res: Response) => {
  try {
    const { threadId, userId } = req.params;
    await collaborationService.removeCollaborator(threadId, userId);
    res.json({ message: 'Collaborator removed successfully' });
  } catch (error) {
    handleError(error, res);
  }
};

export const getThreadCollaborators = async (req: Request, res: Response) => {
  try {
    const { threadId } = req.params;
    const collaborators = await collaborationService.getThreadCollaborators(threadId);
    res.json(collaborators);
  } catch (error) {
    handleError(error, res);
  }
};

// Edit endpoints
export const createEdit = async (req: Request, res: Response) => {
  try {
    const { threadId, content } = req.body;
    const edit = await collaborationService.createEdit(threadId, req.user.id, content);
    res.json(edit);
  } catch (error) {
    handleError(error, res);
  }
};

export const getThreadEdits = async (req: Request, res: Response) => {
  try {
    const { threadId } = req.params;
    const limit = req.query.limit ? parseInt(req.query.limit as string) : 20;
    const edits = await collaborationService.getThreadEdits(threadId, limit);
    res.json(edits);
  } catch (error) {
    handleError(error, res);
  }
}; 