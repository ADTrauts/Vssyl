import { Request, Response } from 'express';
import { ThreadOrganizationService } from '../services/threadOrganizationService';
import { handleError } from '../utils/errorHandler';
import { logger } from '../utils/logger';

const organizationService = new ThreadOrganizationService();

// Category endpoints
export const createCategory = async (req: Request, res: Response) => {
  try {
    const { name, description, color } = req.body;
    const category = await organizationService.createCategory(name, description, color, req.user.id);
    res.json(category);
  } catch (error) {
    handleError(error, res);
  }
};

export const updateCategory = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { name, description, color } = req.body;
    const category = await organizationService.updateCategory(id, { name, description, color });
    res.json(category);
  } catch (error) {
    handleError(error, res);
  }
};

export const deleteCategory = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    await organizationService.deleteCategory(id);
    res.json({ message: 'Category deleted successfully' });
  } catch (error) {
    handleError(error, res);
  }
};

// Tag endpoints
export const createTag = async (req: Request, res: Response) => {
  try {
    const { name, color } = req.body;
    const tag = await organizationService.createTag(name, color, req.user.id);
    res.json(tag);
  } catch (error) {
    handleError(error, res);
  }
};

export const updateTag = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { name, color } = req.body;
    const tag = await organizationService.updateTag(id, { name, color });
    res.json(tag);
  } catch (error) {
    handleError(error, res);
  }
};

export const deleteTag = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    await organizationService.deleteTag(id);
    res.json({ message: 'Tag deleted successfully' });
  } catch (error) {
    handleError(error, res);
  }
};

// Collection endpoints
export const createCollection = async (req: Request, res: Response) => {
  try {
    const { name, description, isPrivate } = req.body;
    const collection = await organizationService.createCollection(name, description, isPrivate, req.user.id);
    res.json(collection);
  } catch (error) {
    handleError(error, res);
  }
};

export const updateCollection = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { name, description, isPrivate } = req.body;
    const collection = await organizationService.updateCollection(id, { name, description, isPrivate });
    res.json(collection);
  } catch (error) {
    handleError(error, res);
  }
};

export const deleteCollection = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    await organizationService.deleteCollection(id);
    res.json({ message: 'Collection deleted successfully' });
  } catch (error) {
    handleError(error, res);
  }
};

export const addThreadToCollection = async (req: Request, res: Response) => {
  try {
    const { collectionId, threadId } = req.params;
    const collection = await organizationService.addThreadToCollection(threadId, collectionId);
    res.json(collection);
  } catch (error) {
    handleError(error, res);
  }
};

export const removeThreadFromCollection = async (req: Request, res: Response) => {
  try {
    const { collectionId, threadId } = req.params;
    const collection = await organizationService.removeThreadFromCollection(threadId, collectionId);
    res.json(collection);
  } catch (error) {
    handleError(error, res);
  }
};

export const addMemberToCollection = async (req: Request, res: Response) => {
  try {
    const { collectionId, userId } = req.params;
    const collection = await organizationService.addMemberToCollection(collectionId, userId);
    res.json(collection);
  } catch (error) {
    handleError(error, res);
  }
};

export const removeMemberFromCollection = async (req: Request, res: Response) => {
  try {
    const { collectionId, userId } = req.params;
    const collection = await organizationService.removeMemberFromCollection(collectionId, userId);
    res.json(collection);
  } catch (error) {
    handleError(error, res);
  }
};

// Template endpoints
export const createTemplate = async (req: Request, res: Response) => {
  try {
    const { name, description, content, metadata } = req.body;
    const template = await organizationService.createTemplate(name, description, content, metadata, req.user.id);
    res.json(template);
  } catch (error) {
    handleError(error, res);
  }
};

export const updateTemplate = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { name, description, content, metadata } = req.body;
    const template = await organizationService.updateTemplate(id, { name, description, content, metadata });
    res.json(template);
  } catch (error) {
    handleError(error, res);
  }
};

export const deleteTemplate = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    await organizationService.deleteTemplate(id);
    res.json({ message: 'Template deleted successfully' });
  } catch (error) {
    handleError(error, res);
  }
};

// Thread relation endpoints
export const addThreadRelation = async (req: Request, res: Response) => {
  try {
    const { threadId, relatedThreadId } = req.params;
    const thread = await organizationService.addThreadRelation(threadId, relatedThreadId);
    res.json(thread);
  } catch (error) {
    handleError(error, res);
  }
};

export const removeThreadRelation = async (req: Request, res: Response) => {
  try {
    const { threadId, relatedThreadId } = req.params;
    const thread = await organizationService.removeThreadRelation(threadId, relatedThreadId);
    res.json(thread);
  } catch (error) {
    handleError(error, res);
  }
};

export const organizeByActivity = async (req: Request, res: Response) => {
  try {
    const userId = req.user.id;
    const { days } = req.query;

    const organizedThreads = await organizationService.organizeThreadsByActivity(
      userId,
      days ? parseInt(days as string) : undefined
    );

    res.json(organizedThreads);
  } catch (error) {
    logger.error('Error organizing threads by activity:', error);
    handleError(error, res);
  }
};

export const organizeByCategory = async (req: Request, res: Response) => {
  try {
    const userId = req.user.id;

    const organizedThreads = await organizationService.organizeThreadsByCategory(userId);

    res.json(organizedThreads);
  } catch (error) {
    logger.error('Error organizing threads by category:', error);
    handleError(error, res);
  }
};

export const organizeByPriority = async (req: Request, res: Response) => {
  try {
    const userId = req.user.id;

    const organizedThreads = await organizationService.organizeThreadsByPriority(userId);

    res.json(organizedThreads);
  } catch (error) {
    logger.error('Error organizing threads by priority:', error);
    handleError(error, res);
  }
}; 