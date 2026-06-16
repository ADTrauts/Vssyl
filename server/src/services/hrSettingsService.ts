import { getBusinessHRFeatures } from '../middleware/hrFeatureGating';

export async function getHRSettings(): Promise<{
  settings: {
    message: string;
    defaults: {
      timeOffSettings: { defaultPTODays: number };
      workWeekSettings: { daysPerWeek: number; hoursPerDay: number };
    };
  };
}> {
  // TODO: Enable after migration
  // const settings = await prisma.hRModuleSettings.findUnique({ where: { businessId } });
  const settings = null;

  return {
    settings: settings || {
      message: 'No custom settings configured',
      defaults: {
        timeOffSettings: { defaultPTODays: 15 },
        workWeekSettings: { daysPerWeek: 5, hoursPerDay: 8 },
      },
    },
  };
}

export async function updateHRSettings(): Promise<{
  message: string;
  note: string;
}> {
  // TODO: Implement HR settings update
  return {
    message: 'HR settings update - framework stub',
    note: 'Feature implementation pending',
  };
}

export async function getHRFeatureAvailability(
  businessId: string
): Promise<Awaited<ReturnType<typeof getBusinessHRFeatures>>> {
  return getBusinessHRFeatures(businessId);
}
