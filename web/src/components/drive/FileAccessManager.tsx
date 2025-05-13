import React, { useState, useEffect } from 'react';
import type { FileAccess, Permission } from '@/types/api';
import { filePermissionService } from '@/services/filePermissionService';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Avatar } from '@/components/ui/avatar';
import { Loader2, Shield, UserPlus, UserMinus } from 'lucide-react';
import { toast } from 'sonner';

interface FileAccessManagerProps {
  fileId: string;
  isOwner: boolean;
  onAccessChange?: () => void;
}

export const FileAccessManager: React.FC<FileAccessManagerProps> = ({
  fileId,
  isOwner,
  onAccessChange,
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [accessList, setAccessList] = useState<FileAccess[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [newUserId, setNewUserId] = useState('');
  const [newPermission, setNewPermission] = useState<Permission>('READ');

  const loadAccessList = async () => {
    try {
      setIsLoading(true);
      const access = await filePermissionService.getFileAccess(fileId);
      setAccessList(access);
    } catch (error) {
      toast.error('Failed to load file access list');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (isOpen) {
      loadAccessList();
    }
  }, [isOpen, fileId]);

  const handleGrantAccess = async () => {
    if (!newUserId.trim()) {
      toast.error('Please enter a user ID');
      return;
    }

    try {
      setIsLoading(true);
      await filePermissionService.grantAccess(fileId, newUserId, newPermission);
      toast.success('Access granted successfully');
      setNewUserId('');
      loadAccessList();
      onAccessChange?.();
    } catch (error) {
      toast.error('Failed to grant access');
    } finally {
      setIsLoading(false);
    }
  };

  const handleRevokeAccess = async (userId: string) => {
    try {
      setIsLoading(true);
      await filePermissionService.revokeAccess(fileId, userId);
      toast.success('Access revoked successfully');
      loadAccessList();
      onAccessChange?.();
    } catch (error) {
      toast.error('Failed to revoke access');
    } finally {
      setIsLoading(false);
    }
  };

  const handleTransferOwnership = async (userId: string) => {
    try {
      setIsLoading(true);
      await filePermissionService.transferOwnership(fileId, userId);
      toast.success('Ownership transferred successfully');
      setIsOpen(false);
      onAccessChange?.();
    } catch (error) {
      toast.error('Failed to transfer ownership');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm" className="gap-2">
          <Shield className="h-4 w-4" />
          Manage Access
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Manage File Access</DialogTitle>
        </DialogHeader>

        {isOwner && (
          <div className="space-y-4">
            <div className="flex gap-2">
              <Input
                placeholder="Enter user ID"
                value={newUserId}
                onChange={(e) => setNewUserId(e.target.value)}
                disabled={isLoading}
              />
              <Select
                value={newPermission}
                onValueChange={(value) => setNewPermission(value as Permission)}
                disabled={isLoading}
              >
                <SelectTrigger className="w-[120px]">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="READ">Read</SelectItem>
                  <SelectItem value="WRITE">Write</SelectItem>
                </SelectContent>
              </Select>
              <Button
                onClick={handleGrantAccess}
                disabled={isLoading || !newUserId.trim()}
                className="gap-2"
              >
                {isLoading ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <UserPlus className="h-4 w-4" />
                )}
                Grant
              </Button>
            </div>
          </div>
        )}

        <div className="space-y-4">
          {isLoading ? (
            <div className="flex justify-center py-4">
              <Loader2 className="h-6 w-6 animate-spin" />
            </div>
          ) : (
            accessList.map((access) => (
              <div
                key={access.id}
                className="flex items-center justify-between rounded-lg border p-3"
              >
                <div className="flex items-center gap-3">
                  <Avatar
                    className="h-8 w-8"
                  >
                    {access.user?.name && (
                      <p className="font-medium">{access.user?.name}</p>
                    )}
                  </Avatar>
                  <div>
                    <p className="font-medium">{access.user?.name || 'Unknown User'}</p>
                    <p className="text-sm text-muted-foreground">
                      {access.permission} access
                    </p>
                  </div>
                </div>
                {isOwner && (
                  <div className="flex gap-2">
                    {access.permission === 'READ' && (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleTransferOwnership(access.userId)}
                        disabled={isLoading}
                      >
                        Make Owner
                      </Button>
                    )}
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleRevokeAccess(access.userId)}
                      disabled={isLoading}
                      className="text-destructive hover:text-destructive"
                    >
                      <UserMinus className="h-4 w-4" />
                    </Button>
                  </div>
                )}
              </div>
            ))
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}; 