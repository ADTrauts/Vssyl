import { cookies, headers } from 'next/headers'
import { redirect } from 'next/navigation'
import DriveLayoutWrapper from '@/components/drive/DriveLayoutWrapper'

export const dynamic = 'force-dynamic'

export default async function FolderPage(props) {
  // Get and await the params directly
  const params = await props.params
  const folderId = params.folderId
  
  console.log('Folder ID:', folderId)

  // Await cookies
  const cookieStore = await cookies()
  const token = cookieStore.get('token')?.value
  if (!token) redirect('/login')

  // Await headers
  const headerList = await headers()
  const headerObject = {}
  for (const [key, value] of headerList.entries()) {
    headerObject[key] = value
  }
  headerObject.cookie = `token=${token}`

  const baseURL = process.env.API_BASE_URL || 'http://localhost:5000'
  const query = new URLSearchParams({ parentId: folderId }).toString()
  
  console.log('API endpoints being called:')
  console.log(`Folders endpoint: ${baseURL}/folders?${query}`)
  console.log(`Files endpoint: ${baseURL}/files?folderId=${folderId}`)
  console.log(`Path endpoint: ${baseURL}/folders/path/${folderId}`)

  const [foldersRes, filesRes, pathRes] = await Promise.all([
    fetch(`${baseURL}/folders?${query}`, {
      headers: headerObject,
      cache: 'no-store',
    }),
    fetch(`${baseURL}/files?folderId=${folderId}`, {
      headers: headerObject,
      cache: 'no-store',
    }),
    fetch(`${baseURL}/folders/path/${folderId}`, {
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
  
  console.log('API Response Data:')
  console.log('Folders:', folders)
  console.log('Files:', files)
  console.log('Path:', path)

  return (
    <DriveLayoutWrapper
      folders={folders}
      files={files}
      currentFolderId={folderId}
      breadcrumbPath={path}
    />
  )
}