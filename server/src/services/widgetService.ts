import { prisma } from '../lib/prisma';

// Widget service stubs
export async function createWidget(userId: string, dashboardId: string, data: { type: string; config?: any; position?: any }) {
  // Ensure dashboard belongs to user
  const dashboard = await prisma.dashboard.findFirst({ where: { id: dashboardId, userId } });
  if (!dashboard) return null;
  return prisma.widget.create({
    data: {
      dashboardId,
      type: data.type,
      config: data.config,
      position: data.position,
    },
  });
}

export async function updateWidget(userId: string, widgetId: string, data: { type?: string; config?: any; position?: any }) {
  // Ensure widget belongs to a dashboard owned by user
  const widget = await prisma.widget.findFirst({ where: { id: widgetId, dashboard: { userId } } });
  if (!widget) return null;
  return prisma.widget.update({
    where: { id: widgetId },
    data: {
      ...(data.type !== undefined ? { type: data.type } : {}),
      ...(data.config !== undefined ? { config: data.config } : {}),
      ...(data.position !== undefined ? { position: data.position } : {}),
    },
  });
}

export async function deleteWidget(userId: string, widgetId: string) {
  // Ensure widget belongs to a dashboard owned by user
  const widget = await prisma.widget.findFirst({ where: { id: widgetId, dashboard: { userId } } });
  if (!widget) return null;
  return prisma.widget.delete({ where: { id: widgetId } });
}
