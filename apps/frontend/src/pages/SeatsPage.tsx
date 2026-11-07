import { useState } from 'react';
import { useSeats, useBulkCreateSeats, useUpdateSeatStatus } from '../hooks/useLibrary';
import type { SeatStatus } from '@atlas/shared';
import { CustomSelect, Modal } from '../components/ui';
import { Layers } from 'lucide-react';

export function SeatsPage() {
  const { data: seats = [], isLoading } = useSeats();
  const bulkCreate = useBulkCreateSeats();
  const updateStatus = useUpdateSeatStatus();

  // Generator form
  const [startNum, setStartNum] = useState(1);
  const [endNum, setEndNum] = useState(50);
  const [prefix, setPrefix] = useState('');
  const [section, setSection] = useState('Main Hall');
  const [showBulkModal, setShowBulkModal] = useState(false);

  // Filter
  const [filter, setFilter] = useState<'all' | SeatStatus>('all');

  const filteredSeats = seats.filter((s) => {
    if (filter === 'all') return true;
    return s.status === filter;
  });

  const handleBulkSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    bulkCreate.mutate(
      { startNumber: Number(startNum), endNumber: Number(endNum), prefix, section },
      {
        onSuccess: () => {
          setShowBulkModal(false);
        },
      },
    );
  };

  const getStatusColor = (status: SeatStatus) => {
    switch (status) {
      case 'available':
        return 'bg-emerald-500/20 text-emerald-400 border-emerald-500/40 hover:bg-emerald-500/30';
      case 'occupied':
        return 'bg-blue-500/20 text-blue-400 border-blue-500/40 hover:bg-blue-500/30';
      case 'maintenance':
      case 'blocked':
        return 'bg-amber-500/20 text-amber-400 border-amber-500/40 hover:bg-amber-500/30';
      default:
        return 'bg-surface-700 text-slate-300 border-surface-600';
    }
  };

  const toggleStatus = (seatId: string, currentStatus: SeatStatus) => {
    const nextStatus: SeatStatus = currentStatus === 'available' ? 'maintenance' : 'available';
    updateStatus.mutate({ id: seatId, status: nextStatus });
  };

  return (
    <div className="space-y-6 max-w-7xl">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white">Visual Seating Map</h1>
          <p className="mt-1 text-sm text-slate-400">
            Monitor, assign, and manage individual desk seats across library sections.
          </p>
        </div>
        <button
          onClick={() => setShowBulkModal(true)}
          className="rounded-lg bg-brand-600 px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-brand-500"
        >
          + Bulk Generate Seats
        </button>
      </div>

      {/* Legend & Filter Bar */}
      <div className="flex flex-wrap items-center justify-between gap-4 rounded-xl border border-surface-700 bg-surface-800 p-4">
        <div className="flex flex-wrap items-center gap-4 text-xs">
          <span className="font-semibold text-slate-400">Legend:</span>
          <div className="flex items-center gap-1.5">
            <span className="h-3 w-3 rounded-sm bg-emerald-500" />
            <span className="text-slate-300">Available</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="h-3 w-3 rounded-sm bg-blue-500" />
            <span className="text-slate-300">Occupied</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="h-3 w-3 rounded-sm bg-amber-500" />
            <span className="text-slate-300">Maintenance / Blocked</span>
          </div>
        </div>

        <div className="flex items-center gap-2 min-w-[180px]">
          <CustomSelect
            value={filter}
            onChange={(val) => setFilter(val as 'all' | SeatStatus)}
            options={[
              { value: 'all', label: `All Seats (${seats.length})` },
              { value: 'available', label: 'Available Only' },
              { value: 'occupied', label: 'Occupied Only' },
              { value: 'maintenance', label: 'Maintenance Only' },
            ]}
          />
        </div>
      </div>

      {/* Seating Grid */}
      <div className="rounded-xl border border-surface-700 bg-surface-800 p-6 min-h-[400px]">
        {isLoading ? (
          <div className="flex h-48 items-center justify-center text-slate-500 text-sm">
            Loading seat layout…
          </div>
        ) : filteredSeats.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-48 space-y-3 text-center">
            <p className="text-slate-400 text-sm">No seats found matching the criteria.</p>
            {seats.length === 0 && (
              <button
                onClick={() => setShowBulkModal(true)}
                className="text-xs text-brand-400 underline hover:text-brand-300"
              >
                Click here to bulk create seats 1 to 50
              </button>
            )}
          </div>
        ) : (
          <div className="grid grid-cols-4 sm:grid-cols-6 md:grid-cols-8 lg:grid-cols-10 gap-3">
            {filteredSeats.map((seat) => (
              <button
                key={seat._id}
                onClick={() => toggleStatus(seat._id, seat.status)}
                title={`Seat ${seat.seatNumber} (${seat.status}) - Click to toggle maintenance`}
                className={`flex flex-col items-center justify-center p-3 rounded-lg border text-center transition cursor-pointer select-none ${getStatusColor(
                  seat.status,
                )}`}
              >
                <span className="text-xs font-bold leading-tight">{seat.seatNumber}</span>
                <span className="text-[9px] capitalize opacity-80 mt-1">{seat.status}</span>
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Bulk Generator Modal */}
      <Modal
        isOpen={showBulkModal}
        onClose={() => setShowBulkModal(false)}
        title="Bulk Generate Seats"
        subtitle="Instantly populate a sequence of study desks for your library"
        icon={<Layers className="h-5 w-5" />}
        maxWidth="md"
      >
        <form onSubmit={handleBulkSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">Start Number</label>
              <input
                type="number"
                min="1"
                value={startNum}
                onChange={(e) => setStartNum(Number(e.target.value))}
                className="w-full rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 px-3.5 py-2 text-sm text-slate-900 dark:text-white"
                required
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">End Number</label>
              <input
                type="number"
                min="1"
                value={endNum}
                onChange={(e) => setEndNum(Number(e.target.value))}
                className="w-full rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 px-3.5 py-2 text-sm text-slate-900 dark:text-white"
                required
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">Prefix (Optional)</label>
              <input
                type="text"
                value={prefix}
                onChange={(e) => setPrefix(e.target.value)}
                placeholder="e.g. S- or A-"
                className="w-full rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 px-3.5 py-2 text-sm text-slate-900 dark:text-white"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">Section</label>
              <input
                type="text"
                value={section}
                onChange={(e) => setSection(e.target.value)}
                placeholder="Main Hall"
                className="w-full rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 px-3.5 py-2 text-sm text-slate-900 dark:text-white"
              />
            </div>
          </div>

          <div className="flex justify-end gap-3 pt-3 border-t border-slate-200 dark:border-slate-800">
            <button
              type="button"
              onClick={() => setShowBulkModal(false)}
              className="rounded-xl px-4 py-2 text-xs font-semibold text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={bulkCreate.isPending}
              className="rounded-xl bg-indigo-600 px-4 py-2 text-xs font-semibold !text-white hover:bg-indigo-500 disabled:opacity-50 shadow-sm"
            >
              {bulkCreate.isPending ? 'Generating…' : 'Generate Seats'}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
