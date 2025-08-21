import { Request, Response, NextFunction } from 'express';
import * as widgetService from '../services/widgetService';
import { Widget, CreateWidgetRequest, UpdateWidgetRequest, WidgetResponse, WidgetsResponse } from 'shared/types';

function hasUserId(user: any): user is { id: string } {
  return user && typeof user.id === 'string';
}

export async function createWidget(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    if (!hasUserId(req.user)) {
      res.sendStatus(401);
      return;
    }
    const userId = req.user.id;
    const dashboardId = req.params.dashboardId;
    const data: CreateWidgetRequest = req.body;
    const widget = await widgetService.createWidget(userId, dashboardId, data);
    if (!widget) {
      res.sendStatus(404);
      return;
    }
    res.status(201).json({ widget });
    return;
  } catch (err) {
    next(err);
  }
}

export async function updateWidget(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    if (!hasUserId(req.user)) {
      res.sendStatus(401);
      return;
    }
    const userId = req.user.id;
    const widgetId = req.params.id;
    const data: UpdateWidgetRequest = req.body;
    const widget = await widgetService.updateWidget(userId, widgetId, data);
    if (!widget) {
      res.sendStatus(404);
      return;
    }
    res.json({ widget });
    return;
  } catch (err) {
    next(err);
  }
}

export async function deleteWidget(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    if (!hasUserId(req.user)) {
      res.sendStatus(401);
      return;
    }
    const userId = req.user.id;
    const widgetId = req.params.id;
    const widget = await widgetService.deleteWidget(userId, widgetId);
    if (!widget) {
      res.sendStatus(404);
      return;
    }
    res.json({ deleted: true });
    return;
  } catch (err) {
    next(err);
  }
}
