export const dynamic = "force-dynamic";

import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";
import { authOptions } from "@/lib/auth";
import { getDashboards } from "@/api/dashboard";
import { getUserPreference } from "@/api/user";
import DashboardClient from "./DashboardClient";

export default async function DashboardPage() {
  const session = await getServerSession(authOptions);
  if (!session) {
    redirect("/auth/login");
  }

  if (!session.accessToken) {
    redirect("/auth/login");
  }

  try {
    const dashboardsObj = await getDashboards(session.accessToken);
    const dashboards = [
      ...dashboardsObj.personal,
      ...dashboardsObj.business,
      ...dashboardsObj.educational
    ];
    
    if (dashboards.length > 0) {
      // Try to get the last active dashboard
      const lastActiveDashboardId = await getUserPreference('lastActiveDashboardId', session.accessToken);
      
      if (lastActiveDashboardId) {
        // Check if the last active dashboard still exists and is accessible
        const lastActiveDashboard = dashboards.find(d => d.id === lastActiveDashboardId);
        if (lastActiveDashboard) {
          redirect(`/dashboard/${lastActiveDashboardId}`);
        }
      }
      
      // Fallback to the first dashboard
      redirect(`/dashboard/${dashboards[0].id}`);
    } else {
      // No dashboards exist, show create dashboard page
      return <DashboardClient dashboardId={null} />;
    }
  } catch (error) {
    // If there's an error fetching dashboards, show create dashboard page
    return <DashboardClient dashboardId={null} />;
  }
}
