export default function SharedPage() {
  return (
    <main className="flex-1 p-6">
      <h1 className="text-2xl font-semibold mb-6">Shared with me</h1>
      <div className="flex flex-col items-center justify-center h-[50vh] text-gray-500">
        <p className="text-lg">No shared files yet</p>
        <p className="text-sm">Files shared with you will appear here</p>
      </div>
    </main>
  )
} 