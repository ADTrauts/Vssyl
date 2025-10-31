'use client';

import { useParams } from 'next/navigation';

export default function HRAttendancePage() {
  const params = useParams();
  const businessId = (params?.id as string) || '';

  return (
    <div className="p-6">
      <h1 className="text-3xl font-bold mb-4">Attendance Management</h1>
      <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-6">
        <h2 className="text-xl font-semibold mb-2">Feature Coming Soon</h2>
        <p className="text-gray-700">
          Attendance tracking, time-off calendar, and schedules will be available here.
          Time-off requests are currently handled in the Employee and Manager views.
        </p>
      </div>
    </div>
  );
}

