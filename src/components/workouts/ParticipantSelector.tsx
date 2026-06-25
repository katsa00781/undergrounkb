import { Search, Trash2, Users } from 'lucide-react';
import type { ManualGuest } from '../../lib/manualGuests';
import type { FMSAssessmentSubject } from '../../lib/fms';

interface ParticipantSelectorProps {
  guestUsers: ManualGuest[];
  fmsSubjects: FMSAssessmentSubject[];
  isLoadingGuests: boolean;
  isLoadingFmsSubjects: boolean;
  selectedParticipantIds: string[];
  selectedFmsUserId: string;
  newGuestName: string;
  participantSearchQuery: string;
  isEditMode: boolean;
  onNewGuestNameChange: (value: string) => void;
  onAddGuest: () => void;
  onParticipantSearchChange: (value: string) => void;
  onToggleParticipant: (participantId: string) => void;
  onRemoveGuest: (guestId: string) => void;
  onGuestFmsLinkChange: (guestId: string, linkedFmsUserId: string) => void;
  onSelectedFmsUserChange: (value: string) => void;
}

const ParticipantSelector = ({
  guestUsers,
  fmsSubjects,
  isLoadingGuests,
  isLoadingFmsSubjects,
  selectedParticipantIds,
  selectedFmsUserId,
  newGuestName,
  participantSearchQuery,
  isEditMode,
  onNewGuestNameChange,
  onAddGuest,
  onParticipantSearchChange,
  onToggleParticipant,
  onRemoveGuest,
  onGuestFmsLinkChange,
  onSelectedFmsUserChange,
}: ParticipantSelectorProps) => {
  const filteredGuestUsers = guestUsers.filter((guestUser) =>
    guestUser.name.toLowerCase().includes(participantSearchQuery.trim().toLowerCase())
  );

  const selectedGuests = guestUsers.filter((guestUser) => selectedParticipantIds.includes(guestUser.id));

  const getFmsSubject = (linkedFmsUserId?: string | null) => {
    if (!linkedFmsUserId) {
      return null;
    }

    return fmsSubjects.find((item) => item.userId === linkedFmsUserId) || null;
  };

  const getFmsSubjectLabel = (linkedFmsUserId?: string | null) => {
    if (!linkedFmsUserId) {
      return 'FMS kapcsolat még nincs hozzárendelve';
    }

    const subject = getFmsSubject(linkedFmsUserId);
    if (!subject) {
      return 'Kapcsolt FMS alany nem található';
    }

    const scoreLabel = subject.latestTotalScore ? ` • összpontszám: ${subject.latestTotalScore}` : '';
    const dateLabel = subject.latestAssessmentDate ? ` • mérés: ${subject.latestAssessmentDate}` : '';
    return `${subject.displayName}${dateLabel}${scoreLabel}`;
  };

  return (
    <div className="mb-8 rounded-xl border border-gray-200 bg-white p-4 shadow-sm dark:border-gray-700 dark:bg-gray-800">
      <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
        <div>
          <div className="flex items-center gap-2 text-gray-900 dark:text-white">
            <Users size={18} />
            <h2 className="text-lg font-semibold">Résztvevők kiválasztása</h2>
          </div>
          <p className="mt-1 text-sm text-gray-600 dark:text-gray-400">
            A résztvevőket most külön, kézzel karbantartott vendéglistából választod ki. Ez a lista független az auth felhasználóktól, így nem keveredik más appok profiljaival.
          </p>
          {isEditMode && (
            <p className="mt-2 text-xs text-amber-700 dark:text-amber-300">
              Meglévő edzés szerkesztésekor a résztvevők kijelölése továbbra is csak a generálási célbeállításokat befolyásolja.
            </p>
          )}
        </div>

        <div className="w-full md:max-w-sm">
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">FMS-alapú generálás célvendége</label>
          <select
            value={selectedFmsUserId}
            onChange={(e) => onSelectedFmsUserChange(e.target.value)}
            className="mt-1 block w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm shadow-sm focus:border-primary-500 focus:outline-none focus:ring-1 focus:ring-primary-500 dark:border-gray-600 dark:bg-gray-700 dark:text-gray-100"
            disabled={selectedParticipantIds.length === 0}
          >
            <option value="">{selectedParticipantIds.length === 0 ? 'Előbb válassz résztvevőt' : 'Válassz résztvevőt'}</option>
            {selectedGuests.map((guestUser) => (
              <option key={guestUser.id} value={guestUser.id}>
                {guestUser.name}
              </option>
            ))}
          </select>
          <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
            A generátor a vendéghez rendelt adatbázisos FMS felmérést használja. A kapcsolat név alapján automatikusan javasolható, de kézzel is kiválasztható.
          </p>
        </div>
      </div>

      <div className="mt-4 grid gap-4 md:grid-cols-[minmax(0,1fr)_260px]">
        <div>
          <div className="mb-3 flex flex-col gap-2 sm:flex-row">
            <input
              type="text"
              value={newGuestName}
              onChange={(e) => onNewGuestNameChange(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  e.preventDefault();
                  onAddGuest();
                }
              }}
              className="block w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm shadow-sm focus:border-primary-500 focus:outline-none focus:ring-1 focus:ring-primary-500 dark:border-gray-600 dark:bg-gray-700 dark:text-gray-100"
              placeholder="Új vendég neve"
            />
            <button
              type="button"
              onClick={onAddGuest}
              className="btn btn-primary whitespace-nowrap"
            >
              Vendég hozzáadása
            </button>
          </div>

          <div className="relative">
            <Search size={16} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              value={participantSearchQuery}
              onChange={(e) => onParticipantSearchChange(e.target.value)}
              className="block w-full rounded-md border border-gray-300 bg-white py-2 pl-9 pr-3 text-sm shadow-sm focus:border-primary-500 focus:outline-none focus:ring-1 focus:ring-primary-500 dark:border-gray-600 dark:bg-gray-700 dark:text-gray-100"
              placeholder="Keresés név alapján"
            />
          </div>

          <div className="mt-3 max-h-72 space-y-2 overflow-y-auto rounded-lg border border-gray-200 p-2 dark:border-gray-700">
            {filteredGuestUsers.map((guestUser) => {
              const isSelected = selectedParticipantIds.includes(guestUser.id);
              const linkedFmsSubject = getFmsSubject(guestUser.linkedFmsUserId);

              return (
                <div
                  key={guestUser.id}
                  className={`rounded-lg border px-3 py-3 transition-colors ${
                    isSelected
                      ? 'border-primary-500 bg-primary-50 dark:border-primary-400 dark:bg-primary-900/30'
                      : 'border-gray-200 hover:bg-gray-50 dark:border-gray-700 dark:hover:bg-gray-700/50'
                  }`}
                >
                  <div className="flex items-center justify-between gap-3">
                    <button
                      type="button"
                      onClick={() => onToggleParticipant(guestUser.id)}
                      className="flex min-w-0 flex-1 items-center justify-between text-left"
                    >
                      <div>
                        <p className="font-medium text-gray-900 dark:text-white">{guestUser.name || 'Névtelen vendég'}</p>
                        <p className="text-sm text-gray-600 dark:text-gray-400">
                          {getFmsSubjectLabel(guestUser.linkedFmsUserId)}
                        </p>
                      </div>
                      <div className={`h-5 w-5 rounded border-2 ${isSelected ? 'border-primary-500 bg-primary-500' : 'border-gray-300 dark:border-gray-600'}`}></div>
                    </button>
                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => onRemoveGuest(guestUser.id)}
                        className="rounded-md p-2 text-gray-400 hover:bg-red-50 hover:text-red-600 dark:hover:bg-red-900/20 dark:hover:text-red-300"
                        aria-label={`${guestUser.name} törlése`}
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                  </div>

                  <div className="mt-3">
                    <label className="block text-xs font-medium text-gray-500 dark:text-gray-400">Kapcsolt FMS felmérés</label>
                    <select
                      value={guestUser.linkedFmsUserId || ''}
                      onChange={(e) => onGuestFmsLinkChange(guestUser.id, e.target.value)}
                      className="mt-1 block w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm shadow-sm focus:border-primary-500 focus:outline-none focus:ring-1 focus:ring-primary-500 dark:border-gray-600 dark:bg-gray-700 dark:text-gray-100"
                    >
                      <option value="">Nincs hozzárendelve</option>
                      {fmsSubjects.map((subject) => (
                        <option key={subject.userId} value={subject.userId}>
                          {subject.displayName}{subject.latestAssessmentDate ? ` • ${subject.latestAssessmentDate}` : ''}{subject.latestTotalScore ? ` • ${subject.latestTotalScore} pont` : ''}
                        </option>
                      ))}
                    </select>
                  </div>

                  {linkedFmsSubject && (
                    <div className="mt-3 grid gap-2 rounded-md border border-emerald-200 bg-emerald-50 p-3 text-xs text-emerald-900 dark:border-emerald-800 dark:bg-emerald-950/30 dark:text-emerald-100 md:grid-cols-2">
                      <p>Kapcsolt alany: {linkedFmsSubject.displayName}</p>
                      <p>Utolsó mérés: {linkedFmsSubject.latestAssessmentDate || 'nincs dátum'}</p>
                      <p>Összpontszám: {linkedFmsSubject.latestTotalScore ?? 'n/a'}</p>
                      <p>Adatbázis azonosító: {linkedFmsSubject.userId.slice(0, 8)}...</p>
                    </div>
                  )}
                </div>
              );
            })}

            {!isLoadingGuests && filteredGuestUsers.length === 0 && (
              <div className="rounded-lg border border-dashed border-gray-200 px-4 py-6 text-center text-sm text-gray-500 dark:border-gray-700 dark:text-gray-400">
                {guestUsers.length === 0 ? 'Még nincs manuálisan felvett vendég a listában.' : 'Nincs találat a vendéglistában.'}
              </div>
            )}

            {isLoadingGuests && (
              <div className="rounded-lg border border-dashed border-gray-200 px-4 py-6 text-center text-sm text-gray-500 dark:border-gray-700 dark:text-gray-400">
                Vendéglista betöltése...
              </div>
            )}

            {!isLoadingGuests && !isLoadingFmsSubjects && fmsSubjects.length === 0 && guestUsers.length > 0 && (
              <div className="rounded-lg border border-dashed border-amber-200 bg-amber-50 px-4 py-4 text-sm text-amber-800 dark:border-amber-800 dark:bg-amber-950/30 dark:text-amber-200">
                Nem találtam adatbázisban FMS felméréssel rendelkező alanyt, ezért a vendégekhez még nem rendelhető mérés.
              </div>
            )}
          </div>
        </div>

        <div className="rounded-lg border border-gray-200 bg-gray-50 p-4 dark:border-gray-700 dark:bg-gray-900/40">
          <h3 className="text-sm font-semibold text-gray-900 dark:text-white">
            Kiválasztott vendégek ({selectedParticipantIds.length})
          </h3>
          <div className="mt-3 space-y-2">
            {selectedGuests.map((guestUser) => (
              <div key={guestUser.id} className="rounded-md bg-white px-3 py-2 text-sm shadow-sm dark:bg-gray-800">
                <p className="font-medium text-gray-900 dark:text-white">{guestUser.name || 'Névtelen vendég'}</p>
                <p className="text-xs text-gray-600 dark:text-gray-400">
                  {getFmsSubjectLabel(guestUser.linkedFmsUserId)}
                </p>
              </div>
            ))}

            {selectedGuests.length === 0 && (
              <p className="text-sm text-gray-500 dark:text-gray-400">Még nincs kiválasztott résztvevő.</p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default ParticipantSelector;
