'use client';

export const dynamic = "force-dynamic";

import { useSession } from 'next-auth/react';
import { useEffect, useState } from 'react';

function getAccessToken(session: unknown): string | undefined {
  if (session && typeof session === 'object' && 'accessToken' in session) {
    return (session as { accessToken?: string }).accessToken;
  }
  return undefined;
}

export default function Profile() {
  const sessionResult = useSession();
  const session = sessionResult?.data;
  const status = sessionResult?.status || 'loading';
  const [profile, setProfile] = useState<unknown>(null);
  const [error, setError] = useState('');
  const [editName, setEditName] = useState('');
  const [success, setSuccess] = useState('');
  const [updating, setUpdating] = useState(false);

  useEffect(() => {
    const fetchProfile = async () => {
      const accessToken = getAccessToken(session);
      if (accessToken) {
        try {
          const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || process.env.NEXT_PUBLIC_API_URL || 'https://vssyl.com/api';
          const res = await fetch(API_BASE_URL + '/profile', {
            headers: { Authorization: `Bearer ${accessToken}` }
          });
          if (res.ok) {
            const data = await res.json();
            setProfile(data.user);
            setEditName(data.user.name || '');
          } else {
            setError('Unauthorized');
          }
        } catch {
          setError('Failed to fetch profile');
        }
      }
    };
    fetchProfile();
  }, [session]);

  const handleUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    const accessToken = getAccessToken(session);
    if (!accessToken) return;
    if (!editName.trim()) {
      setError('Name is required');
      return;
    }
    setUpdating(true);
    try {
      const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || process.env.NEXT_PUBLIC_API_URL || 'https://vssyl-server-235369681725.us-central1.run.app';
      const res = await fetch(API_BASE_URL + '/profile', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${accessToken}`
        },
        body: JSON.stringify({ name: editName })
      });
      if (res.ok) {
        const data = await res.json();
        setProfile(data.user);
        setSuccess('Profile updated!');
      } else {
        const data = await res.json();
        setError(data.message || 'Update failed');
      }
    } catch {
      setError('Update failed');
    } finally {
      setUpdating(false);
    }
  };

  if (status === 'loading') return <div>Loading...</div>;
  if (!session) return <div>You must be signed in to view this page.</div>;

  return (
    <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '80vh', padding: 16 }}>
      <div style={{ width: '100%', maxWidth: 500, background: '#fff', borderRadius: 8, boxShadow: '0 2px 8px rgba(0,0,0,0.04)', padding: 32 }}>
        <h1 style={{ textAlign: 'center', marginBottom: 24 }}>Profile</h1>
        {error && <div style={{ color: 'red', marginBottom: 12, fontWeight: 500, textAlign: 'center' }}>{error}</div>}
        {success && <div style={{ color: 'green', marginBottom: 12, fontWeight: 500, textAlign: 'center' }}>{success}</div>}
        {profile ? (
          <>
            <pre style={{ background: '#f7f7f7', padding: 12, borderRadius: 4, fontSize: 14, marginBottom: 16 }}>{JSON.stringify(profile, null, 2)}</pre>
            <form onSubmit={handleUpdate} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
              <label style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                Name
                <input value={editName} onChange={e => setEditName(e.target.value)} type="text" style={{ padding: 8, borderRadius: 4, border: '1px solid #ccc', outline: 'none' }} />
              </label>
              <button type="submit" disabled={updating} style={{
                marginTop: 8,
                padding: 12,
                borderRadius: 4,
                border: 'none',
                background: updating ? '#ccc' : '#222',
                color: '#fff',
                fontWeight: 600,
                cursor: updating ? 'not-allowed' : 'pointer',
                width: '100%'
              }}>{updating ? 'Updating...' : 'Update Name'}</button>
            </form>
          </>
        ) : (
          <div>Loading profile...</div>
        )}
      </div>
    </div>
  );
} 