import axios from 'axios'
import { API_BASE_URL } from './api'

interface FileUploadResponse {
  file: {
    id: string;
    name: string;
    type: string;
    size: number;
    path: string;
    folderId: string;
    createdAt: string;
    updatedAt: string;
  };
}

export default async function uploadFile(
  file: File,
  folderId: string
): Promise<FileUploadResponse['file'] | null> {
  const formData = new FormData()
  formData.append('file', file)
  formData.append('name', file.name)
  formData.append('size', file.size.toString())
  formData.append('mimeType', file.type)
  formData.append('folderId', folderId)

  console.log('[Uploader] Uploading file:')
  console.log('  ➤ Name:', file.name)
  console.log('  ➤ Size:', file.size)
  console.log('  ➤ MIME:', file.type)
  console.log('  ➤ Target folderId:', folderId)

  try {
    const res = await axios.post<FileUploadResponse>(`${API_BASE_URL}/files`, formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
      withCredentials: true
    })
    console.log('[Uploader] Upload success:', res.data)
    return res.data.file
  } catch (err) {
    console.error('[Uploader] Upload failed:', err instanceof Error ? err.message : 'Unknown error')
    return null
  }
} 