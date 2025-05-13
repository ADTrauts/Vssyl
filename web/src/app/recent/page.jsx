export default function RecentPage() {
  return (
    <main className="flex-1 p-6">
      <h1 className="text-2xl font-semibold mb-6">Recent files</h1>
      <div className="flex flex-col items-center justify-center h-[50vh] text-gray-500">
        <p className="text-lg">No recent activity</p>
        <p className="text-sm">Your recently accessed files will appear here</p>
      </div>
    </main>
  )
} 