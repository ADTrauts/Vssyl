import { cookies, headers } from 'next/headers'
import { redirect } from 'next/navigation'
import DriveLayoutWrapper from '@/components/drive/DriveLayoutWrapper'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/app/api/auth/authOptions'

export const dynamic = 'force-dynamic'

export default async function FolderPage({ params }) {
  // Get and await the params
  const { folderId } = await params
  
  // Get the session
  const session = await getServerSession(authOptions)
  if (!session) redirect('/login')

  // Await headers
  const headerList = await headers()
  const headerObject = {}
  for (const [key, value] of headerList.entries()) {
    headerObject[key] = value
  }
  headerObject['Authorization'] = `Bearer ${session.serverToken}`

  const baseURL = process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:5000'
  const query = new URLSearchParams({ parentId: folderId }).toString()
  
  const [foldersRes, filesRes, pathRes] = await Promise.all([
    fetch(`${baseURL}/api/folders?${query}`, {
      headers: headerObject,
      cache: 'no-store',
    }),
    fetch(`${baseURL}/api/files?folderId=${folderId}`, {
      headers: headerObject,
      cache: 'no-store',
    }),
    fetch(`${baseURL}/api/folders/path/${folderId}`, {
      headers: headerObject,
      cache: 'no-store',
    }),
  ])

  if (!foldersRes.ok || !filesRes.ok || !pathRes.ok) {
    console.error('❌ Folder page fetch failed')
    console.error('Folders response status:', foldersRes.status)
    console.error('Files response status:', filesRes.status)
    console.error('Path response status:', pathRes.status)
    redirect('/drive')
  }

  const { folders } = await foldersRes.json()
  const { files } = await filesRes.json()
  const { path } = await pathRes.json()

  return (
    <DriveLayoutWrapper
      folders={folders}
      files={files}
      currentFolderId={folderId}
      breadcrumbPath={path}
    />
  )
} 