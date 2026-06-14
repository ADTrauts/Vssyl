'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { Card, Button, Input, Spinner, ConfirmModal, DropdownMenu } from 'shared/components';
import type { ContextMenuItem } from 'shared/components';
import { PlaceListingLinksEmptyState } from './PlaceEmptyStates';
import { useGlobalTrash } from '@/contexts/GlobalTrashContext';
import { placeActionError, placeActionSuccess } from './placeUxFeedback';
import { getListing, upsertListing, addLink, updateLink, deleteLink, uploadCoverImage, deleteCoverImage, uploadAvatarImage, deleteAvatarImage } from '@/api/placeListing';
import type { PlaceListing, InteractionLink } from '@/api/placeListing';
import { Plus, Trash2, ExternalLink, Save, GripVertical, CheckCircle2, AlertCircle, ImageIcon, MoreHorizontal } from 'lucide-react';

const CATEGORIES = [
  { value: 'RESTAURANT', label: 'Restaurants & Dining' },
  { value: 'RETAIL', label: 'Retail & Shopping' },
  { value: 'GROCERY', label: 'Grocery & Markets' },
  { value: 'DIGITAL_SERVICE', label: 'Digital Services' },
  { value: 'DELIVERY', label: 'Delivery Services' },
  { value: 'LOCAL_SERVICE', label: 'Local Services' },
  { value: 'HEALTH_WELLNESS', label: 'Health & Wellness' },
  { value: 'ENTERTAINMENT', label: 'Entertainment' },
  { value: 'OTHER', label: 'Other' },
];

const LINK_TYPES = [
  { value: 'WEBSITE', label: 'Website' },
  { value: 'DOORDASH', label: 'DoorDash' },
  { value: 'UBEREATS', label: 'Uber Eats' },
  { value: 'INSTACART', label: 'Instacart' },
  { value: 'OPENTABLE', label: 'OpenTable' },
  { value: 'RESY', label: 'Resy' },
  { value: 'FACEBOOK', label: 'Facebook' },
  { value: 'INSTAGRAM', label: 'Instagram' },
  { value: 'TWITTER', label: 'Twitter / X' },
  { value: 'TIKTOK', label: 'TikTok' },
  { value: 'YELP', label: 'Yelp' },
  { value: 'GOOGLE_MAPS', label: 'Google Maps' },
  { value: 'CUSTOM', label: 'Custom Link' },
];

interface PlaceListingEditorProps {
  businessId: string;
  token: string | undefined;
  /** Compact mode for embedding in Business Admin (less header chrome) */
  compact?: boolean;
}

export function PlaceListingEditor({ businessId, token, compact = false }: PlaceListingEditorProps) {
  const { trashItem } = useGlobalTrash();
  const [listing, setListing] = useState<PlaceListing | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const [displayName, setDisplayName] = useState('');
  const [shortDescription, setShortDescription] = useState('');
  const [category, setCategory] = useState('OTHER');
  const [tags, setTags] = useState('');
  const [nodeColor, setNodeColor] = useState('#6366f1');
  const [isEnabled, setIsEnabled] = useState(false);
  const [isPublished, setIsPublished] = useState(false);

  const [newLinkType, setNewLinkType] = useState('WEBSITE');
  const [newLinkLabel, setNewLinkLabel] = useState('');
  const [newLinkUrl, setNewLinkUrl] = useState('');
  const [addingLink, setAddingLink] = useState(false);
  const [uploadingCover, setUploadingCover] = useState(false);
  const [removingCover, setRemovingCover] = useState(false);
  const [uploadingAvatar, setUploadingAvatar] = useState(false);
  const [removingAvatar, setRemovingAvatar] = useState(false);
  const coverInputRef = React.useRef<HTMLInputElement>(null);
  const avatarInputRef = React.useRef<HTMLInputElement>(null);
  const [openLinkMenuId, setOpenLinkMenuId] = useState<string | null>(null);

  const [pendingDeleteLink, setPendingDeleteLink] = useState<{ id: string; label: string } | null>(null);
  const [isDeletingLink, setIsDeletingLink] = useState(false);
  const [pendingRemoveCover, setPendingRemoveCover] = useState(false);
  const [pendingRemoveAvatar, setPendingRemoveAvatar] = useState(false);
  const [pendingTrashListing, setPendingTrashListing] = useState(false);
  const [isTrashingListing, setIsTrashingListing] = useState(false);

  const fetchListing = useCallback(async () => {
    if (!token) return;
    try {
      setLoading(true);
      const data = await getListing(businessId, token);
      setListing(data);
      if (data) {
        setDisplayName(data.displayName || '');
        setShortDescription(data.shortDescription || '');
        setCategory(data.category);
        setTags(data.tags.join(', '));
        setNodeColor(data.nodeColor || '#6366f1');
        setIsEnabled(data.isEnabled);
        setIsPublished(data.isPublished);
      }
    } catch (error: unknown) {
      setMessage({ type: 'error', text: 'Failed to load listing' });
      placeActionError('Failed to load listing', error);
    } finally {
      setLoading(false);
    }
  }, [token, businessId]);

  useEffect(() => { fetchListing(); }, [fetchListing]);

  const handleSave = async () => {
    if (!token) return;
    try {
      setSaving(true);
      setMessage(null);
      const payload = {
        displayName: displayName || undefined,
        shortDescription: shortDescription || undefined,
        category,
        tags: tags.split(',').map(t => t.trim().toLowerCase()).filter(Boolean),
        nodeColor: nodeColor || undefined,
        isEnabled,
        isPublished,
      };
      const updated = await upsertListing(businessId, payload, token);
      setListing(updated);
      setMessage({ type: 'success', text: 'Place listing saved' });
    } catch (err) {
      setMessage({ type: 'error', text: err instanceof Error ? err.message : 'Failed to save listing' });
    } finally {
      setSaving(false);
    }
  };

  const handleAddLink = async () => {
    if (!token || !newLinkLabel || !newLinkUrl) return;
    try {
      setAddingLink(true);
      await addLink(businessId, {
        type: newLinkType,
        label: newLinkLabel,
        url: newLinkUrl,
        sortOrder: (listing?.interactionLinks.length || 0),
      }, token);
      setNewLinkLabel('');
      setNewLinkUrl('');
      setNewLinkType('WEBSITE');
      await fetchListing();
    } catch {
      setMessage({ type: 'error', text: 'Failed to add link' });
    } finally {
      setAddingLink(false);
    }
  };

  const requestDeleteLink = (linkId: string, label: string) => {
    setPendingDeleteLink({ id: linkId, label });
    setOpenLinkMenuId(null);
  };

  const executeDeleteLink = async () => {
    if (!token || !pendingDeleteLink) return;
    setIsDeletingLink(true);
    try {
      await deleteLink(businessId, pendingDeleteLink.id, token);
      setPendingDeleteLink(null);
      await fetchListing();
      placeActionSuccess('Interaction link removed');
    } catch (error: unknown) {
      setMessage({ type: 'error', text: 'Failed to delete link' });
      placeActionError('Failed to delete link', error);
    } finally {
      setIsDeletingLink(false);
    }
  };

  const executeRemoveCover = async () => {
    if (!token) return;
    try {
      setRemovingCover(true);
      setMessage(null);
      await deleteCoverImage(businessId, token);
      setListing(prev => prev ? { ...prev, coverImage: null } : null);
      setMessage({ type: 'success', text: 'Cover image removed' });
      setPendingRemoveCover(false);
    } catch (error: unknown) {
      setMessage({ type: 'error', text: 'Failed to remove cover image' });
      placeActionError('Failed to remove cover image', error);
    } finally {
      setRemovingCover(false);
    }
  };

  const executeRemoveAvatar = async () => {
    if (!token) return;
    try {
      setRemovingAvatar(true);
      setMessage(null);
      await deleteAvatarImage(businessId, token);
      setListing(prev => prev ? { ...prev, avatarImage: null } : null);
      setMessage({ type: 'success', text: 'Thumbnail image removed' });
      setPendingRemoveAvatar(false);
    } catch (error: unknown) {
      setMessage({ type: 'error', text: 'Failed to remove thumbnail image' });
      placeActionError('Failed to remove thumbnail image', error);
    } finally {
      setRemovingAvatar(false);
    }
  };

  const executeTrashListing = async () => {
    if (!listing?.id) return;
    setIsTrashingListing(true);
    try {
      await trashItem({
        id: listing.id,
        name: displayName || 'Place listing',
        type: 'listing',
        moduleId: 'place',
        moduleName: 'Place',
        metadata: { businessId },
      });
      setPendingTrashListing(false);
      setListing(null);
      setMessage({ type: 'success', text: 'Listing moved to trash. Restore it from the global trash bin.' });
      placeActionSuccess('Listing moved to trash');
      window.dispatchEvent(new CustomEvent('placeItemTrashed', {
        detail: { moduleId: 'place', type: 'listing', id: listing.id },
      }));
    } catch (error: unknown) {
      setMessage({ type: 'error', text: 'Failed to move listing to trash' });
      placeActionError('Failed to move listing to trash', error);
    } finally {
      setIsTrashingListing(false);
    }
  };

  const buildLinkMenuItems = (link: InteractionLink): ContextMenuItem[] => [
    {
      label: link.isActive ? 'Hide link' : 'Show link',
      onClick: () => {
        void handleToggleLink(link);
        setOpenLinkMenuId(null);
      },
    },
    {
      label: 'Delete link',
      destructive: true,
      onClick: () => requestDeleteLink(link.id, link.label),
    },
  ];

  const handleToggleLink = async (link: InteractionLink) => {
    if (!token) return;
    try {
      await updateLink(businessId, link.id, { isActive: !link.isActive }, token);
      await fetchListing();
    } catch {
      setMessage({ type: 'error', text: 'Failed to update link' });
    }
  };

  const handleCoverUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !token) return;
    if (!file.type.startsWith('image/')) {
      setMessage({ type: 'error', text: 'Please select an image file (JPEG, PNG, WebP, GIF)' });
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      setMessage({ type: 'error', text: 'Image must be under 5MB' });
      return;
    }
    try {
      setUploadingCover(true);
      setMessage(null);
      const { coverImage } = await uploadCoverImage(businessId, file, token);
      setListing(prev => prev ? { ...prev, coverImage } : null);
      setMessage({ type: 'success', text: 'Cover image uploaded' });
    } catch {
      setMessage({ type: 'error', text: 'Failed to upload cover image' });
    } finally {
      setUploadingCover(false);
      if (coverInputRef.current) coverInputRef.current.value = '';
    }
  };

  const handleCoverRemove = () => {
    setPendingRemoveCover(true);
  };

  const handleAvatarRemove = () => {
    setPendingRemoveAvatar(true);
  };

  const handleAvatarUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !token) return;
    if (!file.type.startsWith('image/')) {
      setMessage({ type: 'error', text: 'Please select an image file (JPEG, PNG, WebP, GIF)' });
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      setMessage({ type: 'error', text: 'Image must be under 5MB' });
      return;
    }
    try {
      setUploadingAvatar(true);
      setMessage(null);
      const { avatarImage } = await uploadAvatarImage(businessId, file, token);
      setListing(prev => prev ? { ...prev, avatarImage } : null);
      setMessage({ type: 'success', text: 'Thumbnail image uploaded' });
    } catch {
      setMessage({ type: 'error', text: 'Failed to upload thumbnail image' });
    } finally {
      setUploadingAvatar(false);
      if (avatarInputRef.current) avatarInputRef.current.value = '';
    }
  };


  if (!token) {
    return (
      <div className="rounded-lg border border-amber-200 bg-amber-50 p-4 text-sm text-amber-800">
        Sign in to manage your Vssyl Place listing.
      </div>
    );
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[200px]">
        <Spinner size={32} />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {message && (
        <div className={`flex items-center gap-2 p-3 rounded-lg text-sm ${message.type === 'success' ? 'bg-green-50 text-green-800' : 'bg-red-50 text-red-800'}`}>
          {message.type === 'success' ? <CheckCircle2 className="w-4 h-4" /> : <AlertCircle className="w-4 h-4" />}
          {message.text}
        </div>
      )}

      <Card>
        <div className="p-5 space-y-4">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">Listing Details</h3>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Cover Image</label>
            <p className="text-xs text-gray-600 dark:text-gray-400 mb-2">Hero image for your Place listing (JPEG, PNG, WebP, GIF, max 5MB)</p>
            <div className="flex items-start gap-4">
              {listing?.coverImage ? (
                <div className="relative">
                  <img
                    src={listing.coverImage || ''}
                    alt="Cover"
                    className="w-40 h-24 object-cover rounded-lg border border-gray-200 dark:border-slate-700"
                  />
                  <button
                    type="button"
                    onClick={handleCoverRemove}
                    disabled={removingCover}
                    className="absolute -top-2 -right-2 p-1 rounded-full bg-red-100 text-red-600 hover:bg-red-200 transition-colors"
                    title="Remove cover"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              ) : (
                <div className="w-40 h-24 rounded-lg border-2 border-dashed border-gray-200 dark:border-slate-700 flex items-center justify-center bg-gray-50 dark:bg-slate-800">
                  <ImageIcon className="w-8 h-8 text-gray-400" />
                </div>
              )}
              <div className="flex flex-col gap-2">
                <input
                  ref={coverInputRef}
                  type="file"
                  accept="image/jpeg,image/jpg,image/png,image/webp,image/gif"
                  className="hidden"
                  onChange={handleCoverUpload}
                  disabled={uploadingCover}
                />
                <Button
                  variant="secondary"
                  size="sm"
                  onClick={() => coverInputRef.current?.click()}
                  disabled={uploadingCover}
                >
                  {uploadingCover ? <Spinner size={16} /> : 'Upload Cover'}
                </Button>
                {listing?.coverImage && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={handleCoverRemove}
                    disabled={removingCover}
                    className="text-red-600 hover:text-red-700 hover:bg-red-50"
                  >
                    {removingCover ? <Spinner size={16} /> : 'Remove'}
                  </Button>
                )}
              </div>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Thumbnail / Avatar Image</label>
            <p className="text-xs text-gray-600 dark:text-gray-400 mb-2">Small image for the card and map marker. If empty, the cover image or business logo is used.</p>
            <div className="flex items-start gap-4">
              {listing?.avatarImage ? (
                <div className="relative">
                  <img
                    src={listing.avatarImage}
                    alt="Avatar"
                    className="w-14 h-14 rounded-lg object-cover border border-gray-200 dark:border-slate-700"
                  />
                  <button
                    type="button"
                    onClick={handleAvatarRemove}
                    disabled={removingAvatar}
                    className="absolute -top-2 -right-2 p-1 rounded-full bg-red-100 text-red-600 hover:bg-red-200 transition-colors"
                    title="Remove thumbnail"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              ) : (
                <div className="w-14 h-14 rounded-lg border-2 border-dashed border-gray-200 dark:border-slate-700 flex items-center justify-center bg-gray-50 dark:bg-slate-800">
                  <ImageIcon className="w-6 h-6 text-gray-400" />
                </div>
              )}
              <div className="flex flex-col gap-2">
                <input
                  ref={avatarInputRef}
                  type="file"
                  accept="image/jpeg,image/jpg,image/png,image/webp,image/gif"
                  className="hidden"
                  onChange={handleAvatarUpload}
                  disabled={uploadingAvatar}
                />
                <Button
                  variant="secondary"
                  size="sm"
                  onClick={() => avatarInputRef.current?.click()}
                  disabled={uploadingAvatar}
                >
                  {uploadingAvatar ? <Spinner size={16} /> : 'Upload Thumbnail'}
                </Button>
                {listing?.avatarImage && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={handleAvatarRemove}
                    disabled={removingAvatar}
                    className="text-red-600 hover:text-red-700 hover:bg-red-50"
                  >
                    {removingAvatar ? <Spinner size={16} /> : 'Remove'}
                  </Button>
                )}
              </div>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Display Name</label>
            <Input value={displayName} onChange={(e: React.ChangeEvent<HTMLInputElement>) => setDisplayName(e.target.value)} placeholder="How your business appears on Place" />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Short Description</label>
            <textarea
              className="w-full rounded-lg border border-gray-300 dark:border-slate-600 px-3 py-2 text-sm text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-indigo-500"
              rows={2}
              value={shortDescription}
              onChange={(e) => setShortDescription(e.target.value)}
              placeholder="A brief tagline for your building on the map"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Category</label>
              <select
                className="w-full rounded-lg border border-gray-300 dark:border-slate-600 px-3 py-2 text-sm text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                value={category}
                onChange={(e) => setCategory(e.target.value)}
              >
                {CATEGORIES.map(c => <option key={c.value} value={c.value}>{c.label}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Node Color</label>
              <div className="flex items-center gap-2">
                <input
                  type="color"
                  value={nodeColor}
                  onChange={(e) => setNodeColor(e.target.value)}
                  className="w-10 h-10 rounded cursor-pointer border border-gray-300 dark:border-slate-600"
                />
                <span className="text-sm text-gray-700 dark:text-gray-300">{nodeColor}</span>
              </div>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Tags</label>
            <Input value={tags} onChange={(e: React.ChangeEvent<HTMLInputElement>) => setTags(e.target.value)} placeholder="Comma-separated tags (e.g. pizza, delivery, italian)" />
          </div>

          <div className="flex items-center gap-6 pt-2 border-t border-gray-100">
            <label className="flex items-center gap-2 cursor-pointer">
              <input type="checkbox" checked={isEnabled} onChange={(e) => setIsEnabled(e.target.checked)} className="rounded border-gray-300 dark:border-slate-600 text-indigo-600 focus:ring-indigo-500" />
              <span className="text-sm text-gray-700 dark:text-gray-300">Enable listing</span>
            </label>
            <label className="flex items-center gap-2 cursor-pointer">
              <input type="checkbox" checked={isPublished} onChange={(e) => setIsPublished(e.target.checked)} className="rounded border-gray-300 dark:border-slate-600 text-indigo-600 focus:ring-indigo-500" />
              <span className="text-sm text-gray-700 dark:text-gray-300">Publish (visible to users)</span>
            </label>
          </div>

          <div className="flex justify-end">
            <Button variant="primary" onClick={handleSave} disabled={saving}>
              <Save className="w-4 h-4 mr-1" />
              {saving ? 'Saving...' : 'Save Listing'}
            </Button>
          </div>
        </div>
      </Card>

      <Card>
        <div className="p-5 space-y-4">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">Interaction Links</h3>
          <p className="text-sm text-gray-600 dark:text-gray-400">
            Add ways for users to interact with your business — order food, visit your website, follow on social media, etc.
          </p>

          {listing?.interactionLinks && listing.interactionLinks.length > 0 ? (
            <div className="space-y-2">
              {listing.interactionLinks.map((link) => (
                <div key={link.id} className="flex items-center gap-3 p-3 rounded-lg border border-gray-200 dark:border-slate-700 bg-gray-50 dark:bg-slate-800">
                  <GripVertical className="w-4 h-4 text-gray-400 flex-shrink-0" />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-medium text-gray-900 dark:text-gray-100">{link.label}</span>
                      <span className="text-xs px-2 py-0.5 rounded-full bg-indigo-100 text-indigo-700">{link.type.replace('_', ' ')}</span>
                      {!link.isActive && <span className="text-xs px-2 py-0.5 rounded-full bg-gray-200 text-gray-600 dark:text-gray-400">Hidden</span>}
                    </div>
                    <p className="text-xs text-gray-600 dark:text-gray-400 truncate">{link.url}</p>
                  </div>
                  <DropdownMenu
                    open={openLinkMenuId === link.id}
                    onOpenChange={open => setOpenLinkMenuId(open ? link.id : null)}
                    items={buildLinkMenuItems(link)}
                    menuLabel={`Actions for ${link.label}`}
                    align="end"
                  >
                    <Button type="button" variant="ghost" size="sm" aria-label={`Actions for ${link.label}`}>
                      <MoreHorizontal className="h-4 w-4" />
                    </Button>
                  </DropdownMenu>
                </div>
              ))}
            </div>
          ) : (
            <PlaceListingLinksEmptyState />
          )}

          <div className="p-4 rounded-lg border border-dashed border-gray-300 dark:border-slate-600 space-y-3">
            <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300">Add New Link</h4>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <select
                className="rounded-lg border border-gray-300 dark:border-slate-600 px-3 py-2 text-sm text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                value={newLinkType}
                onChange={(e) => setNewLinkType(e.target.value)}
              >
                {LINK_TYPES.map(lt => <option key={lt.value} value={lt.value}>{lt.label}</option>)}
              </select>
              <Input value={newLinkLabel} onChange={(e: React.ChangeEvent<HTMLInputElement>) => setNewLinkLabel(e.target.value)} placeholder="Label (e.g. Order Now)" />
              <Input value={newLinkUrl} onChange={(e: React.ChangeEvent<HTMLInputElement>) => setNewLinkUrl(e.target.value)} placeholder="https://..." />
            </div>
            <div className="flex justify-end">
              <Button variant="secondary" onClick={handleAddLink} disabled={addingLink || !newLinkLabel || !newLinkUrl}>
                <Plus className="w-4 h-4 mr-1" />
                {addingLink ? 'Adding...' : 'Add Link'}
              </Button>
            </div>
          </div>
        </div>
      </Card>

      <p className="text-sm text-gray-600 dark:text-gray-400">
        <ExternalLink className="w-4 h-4 inline-block mr-1 align-middle" />
        Users will see your listing after your business is verified and the listing is published.
      </p>

      {listing?.id && (
        <Card className="border-red-200 dark:border-red-900">
          <div className="flex flex-col gap-3 p-5 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h3 className="text-sm font-semibold text-red-800 dark:text-red-300">Danger zone</h3>
              <p className="mt-1 text-sm text-gray-600 dark:text-gray-400">
                Move this listing to trash. You can restore it from the global trash bin.
              </p>
            </div>
            <Button variant="secondary" size="sm" className="text-red-700 border-red-200 hover:bg-red-50 dark:text-red-300 dark:border-red-800 dark:hover:bg-red-950" onClick={() => setPendingTrashListing(true)}>
              <Trash2 className="mr-2 h-4 w-4" />
              Move listing to trash
            </Button>
          </div>
        </Card>
      )}

      <ConfirmModal
        open={pendingDeleteLink !== null}
        onClose={() => setPendingDeleteLink(null)}
        onConfirm={executeDeleteLink}
        title="Delete interaction link?"
        description={
          pendingDeleteLink
            ? `Remove "${pendingDeleteLink.label}" from your listing?`
            : undefined
        }
        variant="destructive"
        confirmLabel="Delete"
        loading={isDeletingLink}
      />

      <ConfirmModal
        open={pendingRemoveCover}
        onClose={() => setPendingRemoveCover(false)}
        onConfirm={executeRemoveCover}
        title="Remove cover image?"
        description="This will remove your listing cover image. You can upload a new one anytime."
        variant="destructive"
        confirmLabel="Remove"
        loading={removingCover}
      />

      <ConfirmModal
        open={pendingRemoveAvatar}
        onClose={() => setPendingRemoveAvatar(false)}
        onConfirm={executeRemoveAvatar}
        title="Remove thumbnail image?"
        description="This will remove your listing thumbnail. You can upload a new one anytime."
        variant="destructive"
        confirmLabel="Remove"
        loading={removingAvatar}
      />

      <ConfirmModal
        open={pendingTrashListing}
        onClose={() => setPendingTrashListing(false)}
        onConfirm={executeTrashListing}
        title="Move listing to trash?"
        description="This unpublishes your storefront and moves the listing to trash. Restore it anytime from the global trash bin."
        variant="destructive"
        confirmLabel="Move to trash"
        loading={isTrashingListing}
      />
    </div>
  );
}
