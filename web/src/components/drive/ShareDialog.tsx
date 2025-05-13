'use client'

import React, { useState, useEffect } from 'react'
import { useUI } from '@/contexts/ui-context'
import axios from 'axios'
import { toast } from 'react-hot-toast'
import { PlusIcon, UsersIcon, LinkIcon, CopyIcon, CheckIcon } from '@/components/icons'

interface SharedUser {
  id: string
  name?: string
  email: string
  permission: 'viewer' | 'editor' | 'owner'
}

export default function ShareDialog() {
  const { shareDialog, closeShareDialog } = useUI()
  const [users, setUsers] = useState<SharedUser[]>([])
  const [email, setEmail] = useState('')
  const [permission, setPermission] = useState<'viewer' | 'editor'>('viewer')
  const [loading, setLoading] = useState(false)
  const [linkCopied, setLinkCopied] = useState(false)
  const [shareableLink, setShareableLink] = useState('')
  const [isMobile, setIsMobile] = useState(false)

  // Helper variables for safe access
  const shareDialogType = shareDialog && 'type' in shareDialog ? shareDialog.type : ''
  const shareDialogId = shareDialog && 'id' in shareDialog ? shareDialog.id : ''

  // Detect mobile view
  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 640)
    }
    
    // Check on initial load
    checkMobile()
    
    // Listen for resize events
    window.addEventListener('resize', checkMobile)
    
    return () => window.removeEventListener('resize', checkMobile)
  }, [])

  useEffect(() => {
    if (!shareDialog || !('type' in shareDialog) || !shareDialog.type || !shareDialog.id) return
    
    const fetchSharedUsers = async () => {
      try {
        setLoading(true)
        const response = await axios.get(`${process.env.NEXT_PUBLIC_API_BASE_URL}/api/share/${shareDialogType}/${shareDialogId}/users`)
        setUsers(response.data)
        
        // Check if item already has a share link
        try {
          const shareLinksResponse = await axios.get(`${process.env.NEXT_PUBLIC_API_BASE_URL}/api/share/${shareDialogType}/${shareDialogId}/links`)
          if (shareLinksResponse.data && shareLinksResponse.data.length > 0) {
            const shareData = shareLinksResponse.data[0]
            setShareableLink(`${window.location.origin}/s/${shareData.id}`)
          }
        } catch (err) {
          console.error('Error fetching existing share links:', err)
        }
      } catch (error) {
        console.error('Error fetching shared users:', error)
        toast.error('Failed to load sharing information')
      } finally {
        setLoading(false)
      }
    }
    
    fetchSharedUsers()
  }, [shareDialog])

  /**
   * @param {React.FormEvent} e
   */
  const handleAddUser = async (e: React.FormEvent) => {
    if (!shareDialog || !('type' in shareDialog) || !shareDialog.type || !shareDialog.id) return
    e.preventDefault()
    if (!email) return

    try {
      setLoading(true)
      await fetch(`${process.env.NEXT_PUBLIC_API_BASE_URL}/api/${shareDialogType}s/${shareDialogId}/share`, {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: email,
          permission: permission
        })
      })
      
      // Refresh the list
      const response = await axios.get(`${process.env.NEXT_PUBLIC_API_BASE_URL}/api/share/${shareDialogType}/${shareDialogId}/users`)
      setUsers(response.data)
      
      setEmail('')
      toast.success('User added successfully')
    } catch (error: unknown) {
      console.error('Error adding user:', error)
      toast.error(error instanceof Error ? error.message : 'Failed to add user')
    } finally {
      setLoading(false)
    }
  }

  /**
   * @param {string} userId
   * @param {SharedUser['permission']} newPermission
   */
  const handleUpdatePermission = async (userId: string, newPermission: SharedUser['permission']) => {
    if (!shareDialog || !('type' in shareDialog) || !shareDialog.type || !shareDialog.id) return
    try {
      setLoading(true)
      await fetch(`${process.env.NEXT_PUBLIC_API_BASE_URL}/api/${shareDialogType}s/${shareDialogId}/share`, {
        method: 'PUT',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: email,
          permission: newPermission
        })
      })
      
      // Update local state
      setUsers(users.map(user => 
        user.id === userId ? { ...user, permission: newPermission } : user
      ))
      
      toast.success('Permission updated')
    } catch (error) {
      console.error('Error updating permission:', error)
      toast.error('Failed to update permission')
    } finally {
      setLoading(false)
    }
  }

  /**
   * @param {string} userId
   */
  const handleRemoveUser = async (userId: string) => {
    if (!shareDialog || !('type' in shareDialog) || !shareDialog.type || !shareDialog.id) return
    try {
      setLoading(true)
      await fetch(`${process.env.NEXT_PUBLIC_API_BASE_URL}/api/${shareDialogType}s/${shareDialogId}/share`, {
        method: 'DELETE',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: email
        })
      })
      
      // Update local state
      setUsers(users.filter(user => user.id !== userId))
      
      toast.success('User removed from sharing')
    } catch (error) {
      console.error('Error removing user:', error)
      toast.error('Failed to remove user')
    } finally {
      setLoading(false)
    }
  }

  const generateShareableLink = async () => {
    try {
      setLoading(true)
      // Use the new public routes API
      const response = await axios.post(`${process.env.NEXT_PUBLIC_API_BASE_URL}/api/public/create-share-link`, {
        type: shareDialogType,
        id: shareDialogId
      })
      
      if (response.data && response.data.url) {
        setShareableLink(response.data.url)
        toast.success('Shareable link generated')
      } else {
        throw new Error('Invalid response from server')
      }
    } catch (error) {
      console.error('Error generating link:', error)
      toast.error('Failed to generate shareable link')
    } finally {
      setLoading(false)
    }
  }

  /**
   * @param {React.MouseEvent} e
   */
  const copyLinkToClipboard = (e: React.MouseEvent) => {
    e.preventDefault()
    navigator.clipboard.writeText(shareableLink)
    setLinkCopied(true)
    toast.success('Link copied to clipboard')
    setTimeout(() => setLinkCopied(false), 3000)
  }

  const disableSharing = async () => {
    try {
      setLoading(true)
      // Call the API to disable sharing
      await axios.post(`${process.env.NEXT_PUBLIC_API_BASE_URL}/api/public/disable-sharing`, {
        type: shareDialogType,
        id: shareDialogId
      })
      
      // Clear the link
      setShareableLink('')
      toast.success('Public sharing disabled')
    } catch (error) {
      console.error('Error disabling sharing:', error)
      toast.error('Failed to disable sharing')
    } finally {
      setLoading(false)
    }
  }

  if (!shareDialog || !('type' in shareDialog) || !shareDialog.type || !shareDialog.id) return null

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className={`bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] flex flex-col ${isMobile ? 'h-[90vh]' : ''}`}>
        <div className="px-6 py-4 border-b flex justify-between items-center">
          <h2 className="text-xl font-semibold">
            Share {shareDialogType === 'file' ? 'File' : 'Folder'}
          </h2>
          <button 
            onClick={closeShareDialog}
            className="text-gray-500 hover:text-gray-700"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"></path>
            </svg>
          </button>
        </div>
        
        <div className="p-6 overflow-y-auto flex-1">
          {/* Add people form */}
          <form onSubmit={handleAddUser} className={`mb-6 flex ${isMobile ? 'flex-col' : 'flex-row'} gap-2`}>
            <div className="flex-1">
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="Add people by email"
                className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                required
              />
            </div>
            <div className={`${isMobile ? 'w-full' : 'w-32'}`}>
              <select
                value={permission}
                onChange={(e) => setPermission(e.target.value as 'viewer' | 'editor')}
                className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="viewer">Viewer</option>
                <option value="editor">Editor</option>
              </select>
            </div>
            <button
              type="submit"
              disabled={loading}
              className={`${isMobile ? 'w-full' : 'w-auto'} bg-blue-500 text-white px-4 py-2 rounded-lg hover:bg-blue-600 flex items-center justify-center`}
            >
              <PlusIcon className="w-4 h-4 mr-2" />
              <span>{isMobile ? 'Add' : 'Add Person'}</span>
            </button>
          </form>
          
          {/* People with access */}
          <div className="mb-8">
            <h3 className="text-lg font-medium mb-3 flex items-center">
              <UsersIcon className="w-5 h-5 mr-2" />
              People with access
            </h3>
            
            <div className="space-y-3">
              {/* Owner (you) */}
              <div className="flex items-center justify-between border-b pb-2">
                <div className="flex items-center">
                  <div className="w-8 h-8 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center mr-3">
                    <span className="text-sm font-medium">You</span>
                  </div>
                  <div>
                    <div className="font-medium">You</div>
                    <div className="text-sm text-gray-500">Owner</div>
                  </div>
                </div>
              </div>
              
              {/* Shared users */}
              {loading && users.length === 0 ? (
                <div className="text-center py-4 text-gray-500">Loading...</div>
              ) : users.length === 0 ? (
                <div className="text-center py-4 text-gray-500">No shared users yet</div>
              ) : (
                users.map(user => (
                  <div key={user.id} className="flex items-center justify-between">
                    <div className="flex items-center">
                      <div className="w-8 h-8 bg-gray-100 rounded-full flex items-center justify-center mr-3">
                        <span className="text-sm font-medium">{user.name?.charAt(0) || user.email.charAt(0)}</span>
                      </div>
                      <div>
                        <div className="font-medium">{user.name || 'Unknown'}</div>
                        <div className="text-sm text-gray-500">{user.email}</div>
                      </div>
                    </div>
                    
                    <div className={`flex ${isMobile ? 'w-full justify-between' : ''}`}>
                      <select
                        value={user.permission}
                        onChange={(e) => handleUpdatePermission(user.id, e.target.value as 'viewer' | 'editor')}
                        className="px-3 py-1 border rounded-lg text-sm mr-2"
                      >
                        <option value="viewer">Viewer</option>
                        <option value="editor">Editor</option>
                        <option value="owner">Owner</option>
                      </select>
                      {user.permission !== 'owner' && (
                        <button
                          onClick={(e) => {
                            e.preventDefault()
                            handleRemoveUser(user.id)
                          }}
                          className="text-red-500 hover:text-red-700 text-sm"
                        >
                          Remove
                        </button>
                      )}
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
          
          {/* Shareable link */}
          <div>
            <h3 className="text-lg font-medium mb-3 flex items-center">
              <LinkIcon className="w-5 h-5 mr-2" />
              Get shareable link
            </h3>
            
            {shareableLink ? (
              <div className="space-y-2">
                <div className={`flex ${isMobile ? 'flex-col' : 'flex-row'} gap-2 items-center border rounded-lg p-2`}>
                  <div className="flex-1 truncate">
                    <input
                      type="text"
                      value={shareableLink}
                      readOnly
                      className="w-full bg-gray-50 px-3 py-2 rounded focus:outline-none"
                    />
                  </div>
                  <button
                    onClick={copyLinkToClipboard}
                    className="flex items-center justify-center bg-gray-100 hover:bg-gray-200 px-3 py-2 rounded-lg"
                  >
                    {linkCopied ? (
                      <CheckIcon className="w-5 h-5 text-green-600" />
                    ) : (
                      <CopyIcon className="w-5 h-5" />
                    )}
                    <span className="ml-1">{linkCopied ? 'Copied' : 'Copy'}</span>
                  </button>
                </div>
                
                <button
                  onClick={disableSharing}
                  className="text-red-500 hover:text-red-700 text-sm flex items-center mt-2"
                >
                  <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                  </svg>
                  Disable public sharing
                </button>
              </div>
            ) : (
              <button
                onClick={generateShareableLink}
                disabled={loading}
                className="w-full bg-blue-50 text-blue-600 border border-blue-200 px-4 py-2 rounded-lg hover:bg-blue-100 flex items-center justify-center"
              >
                <LinkIcon className="w-4 h-4 mr-2" />
                Generate shareable link
              </button>
            )}
          </div>
        </div>
        
        <div className="px-6 py-4 border-t bg-gray-50 flex justify-end">
          <button
            onClick={closeShareDialog}
            className="px-4 py-2 bg-gray-200 hover:bg-gray-300 rounded-lg mr-2"
          >
            Close
          </button>
          <button
            onClick={closeShareDialog}
            className="px-4 py-2 bg-blue-500 text-white hover:bg-blue-600 rounded-lg"
          >
            Done
          </button>
        </div>
      </div>
    </div>
  )
} 