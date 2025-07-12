import React, { useState, useEffect } from 'react';
import { getPendingInvites, cancelInvite, cleanupExpiredInvites, PendingInvite } from '../lib/invites';
import toast from 'react-hot-toast';

interface InviteManagementProps {
  onInviteCreated?: () => void;
}

export const InviteManagement: React.FC<InviteManagementProps> = ({ onInviteCreated }) => {
  const [invites, setInvites] = useState<PendingInvite[]>([]);
  const [loading, setLoading] = useState(true);

  const loadInvites = async () => {
    try {
      setLoading(true);
      const data = await getPendingInvites();
      setInvites(data);
    } catch (error) {
      console.error('Error loading invites:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadInvites();
  }, []);

  // Refresh when a new invite is created
  useEffect(() => {
    if (onInviteCreated) {
      loadInvites();
    }
  }, [onInviteCreated]);

  const handleCancelInvite = async (inviteId: string) => {
    if (!confirm('Biztosan törölni szeretnéd ezt a meghívót?')) {
      return;
    }

    try {
      await cancelInvite(inviteId);
      await loadInvites(); // Refresh list
    } catch (error) {
      console.error('Error canceling invite:', error);
    }
  };

  const handleCleanupExpired = async () => {
    try {
      const deletedCount = await cleanupExpiredInvites();
      if (deletedCount > 0) {
        await loadInvites(); // Refresh list
      }
    } catch (error) {
      console.error('Error cleaning up invites:', error);
    }
  };

  const copyInviteLink = (token: string) => {
    const inviteUrl = `${window.location.origin}/invite/${token}`;
    navigator.clipboard.writeText(inviteUrl).then(() => {
      toast.success('Meghívó link vágólapra másolva!');
    }).catch(() => {
      toast.error('Nem sikerült a vágólapra másolni');
    });
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('hu-HU', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  if (loading) {
    return (
      <div className="bg-white shadow rounded-lg p-6">
        <h3 className="text-lg font-medium text-gray-900 mb-4">Aktív meghívók</h3>
        <div className="animate-pulse">
          <div className="h-4 bg-gray-200 rounded w-3/4 mb-2"></div>
          <div className="h-4 bg-gray-200 rounded w-1/2"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white shadow rounded-lg p-6">
      <div className="flex justify-between items-center mb-4">
        <h3 className="text-lg font-medium text-gray-900">
          Aktív meghívók ({invites.length})
        </h3>
        <button
          onClick={handleCleanupExpired}
          className="text-sm bg-gray-100 hover:bg-gray-200 text-gray-700 px-3 py-1 rounded-md transition-colors"
        >
          Lejárt meghívók törlése
        </button>
      </div>

      {invites.length === 0 ? (
        <div className="text-center py-8 text-gray-500">
          <p>Nincsenek aktív meghívók</p>
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Email
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Szerepkör
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Létrehozva
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Lejárat
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Műveletek
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {invites.map((invite) => (
                <tr key={invite.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                    {invite.email}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                      invite.role === 'admin' 
                        ? 'bg-purple-100 text-purple-800' 
                        : 'bg-green-100 text-green-800'
                    }`}>
                      {invite.role === 'admin' ? 'Admin' : 'Felhasználó'}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {formatDate(invite.created_at)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {formatDate(invite.expires_at)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium space-x-2">
                    <button
                      onClick={() => copyInviteLink(invite.invite_token)}
                      className="text-blue-600 hover:text-blue-900 bg-blue-50 hover:bg-blue-100 px-3 py-1 rounded-md transition-colors"
                      title="Meghívó link másolása"
                    >
                      📋 Link
                    </button>
                    <button
                      onClick={() => handleCancelInvite(invite.id)}
                      className="text-red-600 hover:text-red-900 bg-red-50 hover:bg-red-100 px-3 py-1 rounded-md transition-colors"
                      title="Meghívó törlése"
                    >
                      🗑️ Törlés
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};
