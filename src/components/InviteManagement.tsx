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
      toast.success('Meghívó link a vágólapra másolva!');
    }).catch(() => {
      toast.error('Nem sikerült a vágólapra másolni');
    });
  };

  const copyEmailText = (_email: string, token: string) => {
    const inviteUrl = `${window.location.origin}/invite/${token}`;
    const emailText = `Szia!

Meghívást kaptál a UG KettleBell Pro rendszerbe!

Kattints a linkre a regisztrációhoz:
${inviteUrl}

Üdvözlettel,
UG KettleBell Pro csapat`;

    navigator.clipboard.writeText(emailText).then(() => {
      toast.success('Email szöveg a vágólapra másolva! Most elküldheted emailben.');
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
    <div className="bg-white dark:bg-gray-800 shadow rounded-lg p-4 md:p-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-4 gap-4">
        <h3 className="text-lg font-medium text-gray-900 dark:text-white">
          Aktív meghívók ({invites.length})
        </h3>
        <button
          onClick={handleCleanupExpired}
          className="text-sm bg-gray-100 hover:bg-gray-200 dark:bg-gray-700 dark:hover:bg-gray-600 text-gray-700 dark:text-gray-300 px-3 py-1 rounded-md transition-colors w-full sm:w-auto"
        >
          🗑️ Lejárt meghívók törlése
        </button>
      </div>

      {invites.length === 0 ? (
        <div className="text-center py-8 text-gray-500 dark:text-gray-400">
          <div className="text-4xl mb-2">📧</div>
          <p>Nincsenek aktív meghívók</p>
        </div>
      ) : (
        <>
          {/* Desktop/Tablet nézet - táblázat */}
          <div className="hidden lg:block overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
              <thead className="bg-gray-50 dark:bg-gray-700">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                    Email
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                    Szerepkör
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                    Létrehozva
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                    Lejárat
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                    Műveletek
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                {invites.map((invite) => (
                  <tr key={invite.id} className="hover:bg-gray-50 dark:hover:bg-gray-700">
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900 dark:text-white">
                      {invite.email}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                        invite.role === 'admin' 
                          ? 'bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-400' 
                          : 'bg-success-100 text-success-800 dark:bg-success-900/30 dark:text-success-400'
                      }`}>
                        {invite.role === 'admin' ? 'Admin' : 'Felhasználó'}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                      {formatDate(invite.created_at)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                      {formatDate(invite.expires_at)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      <div className="flex justify-end space-x-2">
                        <button
                          onClick={() => copyInviteLink(invite.invite_token)}
                          className="text-primary-600 hover:text-primary-900 dark:text-primary-400 dark:hover:text-primary-300 bg-primary-50 hover:bg-primary-100 dark:bg-primary-900/30 dark:hover:bg-primary-900/50 px-3 py-1 rounded-md transition-colors text-xs"
                          title="Meghívó link másolása"
                        >
                          📋 Link
                        </button>
                        <button
                          onClick={() => copyEmailText(invite.email, invite.invite_token)}
                          className="text-success-600 hover:text-success-900 dark:text-success-400 dark:hover:text-success-300 bg-success-50 hover:bg-success-100 dark:bg-success-900/30 dark:hover:bg-success-900/50 px-3 py-1 rounded-md transition-colors text-xs"
                          title="Email szöveg másolása"
                        >
                          ✉️ Email
                        </button>
                        <button
                          onClick={() => handleCancelInvite(invite.id)}
                          className="text-error-600 hover:text-error-900 dark:text-error-400 dark:hover:text-error-300 bg-error-50 hover:bg-error-100 dark:bg-error-900/30 dark:hover:bg-error-900/50 px-3 py-1 rounded-md transition-colors text-xs"
                          title="Meghívó törlése"
                        >
                          🗑️ Törlés
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Mobile/Tablet nézet - kártyák */}
          <div className="lg:hidden space-y-4">
            {invites.map((invite) => (
              <div key={invite.id} className="bg-gray-50 dark:bg-gray-700 rounded-lg p-4 border border-gray-200 dark:border-gray-600">
                <div className="flex flex-col space-y-3">
                  {/* Email és szerepkör */}
                  <div className="flex flex-col sm:flex-row sm:justify-between sm:items-start gap-2">
                    <div className="flex-1">
                      <p className="text-sm font-medium text-gray-900 dark:text-white break-all">
                        {invite.email}
                      </p>
                      <span className={`inline-flex mt-1 px-2 py-1 text-xs font-semibold rounded-full ${
                        invite.role === 'admin' 
                          ? 'bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-400' 
                          : 'bg-success-100 text-success-800 dark:bg-success-900/30 dark:text-success-400'
                      }`}>
                        {invite.role === 'admin' ? 'Admin' : 'Felhasználó'}
                      </span>
                    </div>
                  </div>

                  {/* Dátumok */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs text-gray-500 dark:text-gray-400">
                    <div>
                      <span className="font-medium">Létrehozva:</span>
                      <br />
                      {formatDate(invite.created_at)}
                    </div>
                    <div>
                      <span className="font-medium">Lejárat:</span>
                      <br />
                      {formatDate(invite.expires_at)}
                    </div>
                  </div>

                  {/* Műveletek - reszponzív gombok */}
                  <div className="flex flex-col sm:flex-row gap-2 pt-2 border-t border-gray-200 dark:border-gray-600">
                    <button
                      onClick={() => copyInviteLink(invite.invite_token)}
                      className="flex-1 flex items-center justify-center gap-2 text-primary-600 hover:text-primary-900 dark:text-primary-400 dark:hover:text-primary-300 bg-primary-50 hover:bg-primary-100 dark:bg-primary-900/30 dark:hover:bg-primary-900/50 px-3 py-2 rounded-md transition-colors text-sm font-medium"
                    >
                      📋 Link másolása
                    </button>
                    <button
                      onClick={() => copyEmailText(invite.email, invite.invite_token)}
                      className="flex-1 flex items-center justify-center gap-2 text-success-600 hover:text-success-900 dark:text-success-400 dark:hover:text-success-300 bg-success-50 hover:bg-success-100 dark:bg-success-900/30 dark:hover:bg-success-900/50 px-3 py-2 rounded-md transition-colors text-sm font-medium"
                    >
                      ✉️ Email szöveg
                    </button>
                    <button
                      onClick={() => handleCancelInvite(invite.id)}
                      className="flex-1 sm:flex-initial flex items-center justify-center gap-2 text-error-600 hover:text-error-900 dark:text-error-400 dark:hover:text-error-300 bg-error-50 hover:bg-error-100 dark:bg-error-900/30 dark:hover:bg-error-900/50 px-3 py-2 rounded-md transition-colors text-sm font-medium"
                    >
                      🗑️ Törlés
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  );
};
