import { useState } from 'react';
import { useShifts, useCreateShift, useUpdateShift, useDeleteShift, usePlans, useCreatePlan, useUpdatePlan, useDeletePlan } from '../hooks/useLibrary';
import { formatTime12H } from '../utils/time';
import type { ShiftDTO, PlanDTO } from '@atlas/shared';
import { CustomSelect, Modal, ConfirmModal } from '../components/ui';
import { Clock, CalendarClock } from 'lucide-react';

export function PlansPage() {
  const { data: shifts = [], isLoading: shiftsLoading } = useShifts();
  const { data: plans = [], isLoading: plansLoading } = usePlans();

  const createShift = useCreateShift();
  const updateShift = useUpdateShift();
  const deleteShift = useDeleteShift();

  const createPlan = useCreatePlan();
  const updatePlan = useUpdatePlan();
  const deletePlan = useDeletePlan();

  // Delete confirm modal state
  const [deleteConfirm, setDeleteConfirm] = useState<{ type: 'shift' | 'plan'; id: string; name: string } | null>(null);

  // Shift create form
  const [shiftName, setShiftName] = useState('');
  const [startTime, setStartTime] = useState('07:00');
  const [endTime, setEndTime] = useState('15:00');

  // Plan create form
  const [planName, setPlanName] = useState('');
  const [seatType, setSeatType] = useState<'reserved' | 'non-reserved'>('reserved');
  const [feeRupees, setFeeRupees] = useState('600');
  const [selectedShiftId, setSelectedShiftId] = useState('');
  const [description, setDescription] = useState('');

  // Editing Shift state
  const [editingShift, setEditingShift] = useState<ShiftDTO | null>(null);
  const [editShiftName, setEditShiftName] = useState('');
  const [editShiftStartTime, setEditShiftStartTime] = useState('');
  const [editShiftEndTime, setEditShiftEndTime] = useState('');

  // Editing Plan state
  const [editingPlan, setEditingPlan] = useState<PlanDTO | null>(null);
  const [editPlanName, setEditPlanName] = useState('');
  const [editPlanSeatType, setEditPlanSeatType] = useState<'reserved' | 'non-reserved'>('reserved');
  const [editPlanFeeRupees, setEditPlanFeeRupees] = useState('');
  const [editPlanShiftId, setEditPlanShiftId] = useState('');
  const [editPlanDescription, setEditPlanDescription] = useState('');

  // Error alerts
  const [actionError, setActionError] = useState<string | null>(null);

  const handleCreateShift = (e: React.FormEvent) => {
    e.preventDefault();
    if (!shiftName.trim()) return;
    setActionError(null);
    createShift.mutate(
      { name: shiftName, startTime, endTime },
      {
        onSuccess: () => {
          setShiftName('');
        },
        onError: (err: any) => {
          setActionError(err.response?.data?.error || 'Failed to create shift');
        },
      },
    );
  };

  const handleStartEditShift = (s: ShiftDTO) => {
    setEditingShift(s);
    setEditShiftName(s.name);
    setEditShiftStartTime(s.startTime);
    setEditShiftEndTime(s.endTime);
  };

  const handleSaveEditShift = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingShift || !editShiftName.trim()) return;
    setActionError(null);
    updateShift.mutate(
      {
        id: editingShift._id,
        name: editShiftName,
        startTime: editShiftStartTime,
        endTime: editShiftEndTime,
      },
      {
        onSuccess: () => {
          setEditingShift(null);
        },
        onError: (err: any) => {
          setActionError(err.response?.data?.error || 'Failed to update shift');
        },
      },
    );
  };

  const handleDeleteShift = (id: string, name: string) => {
    setDeleteConfirm({ type: 'shift', id, name });
  };

  const handleCreatePlan = (e: React.FormEvent) => {
    e.preventDefault();
    if (!planName.trim()) return;
    setActionError(null);
    const feePaise = Math.round(parseFloat(feeRupees || '0') * 100);
    createPlan.mutate(
      {
        name: planName,
        seatType,
        shiftIds: selectedShiftId ? [selectedShiftId] : [],
        feePaise,
        description,
      },
      {
        onSuccess: () => {
          setPlanName('');
          setDescription('');
        },
        onError: (err: any) => {
          setActionError(err.response?.data?.error || 'Failed to create plan');
        },
      },
    );
  };

  const handleStartEditPlan = (p: PlanDTO) => {
    setEditingPlan(p);
    setEditPlanName(p.name);
    setEditPlanSeatType(p.seatType);
    setEditPlanFeeRupees((p.feePaise / 100).toString());
    setEditPlanShiftId(p.shiftIds && p.shiftIds.length > 0 ? (typeof p.shiftIds[0] === 'string' ? p.shiftIds[0] : (p.shiftIds[0] as any)._id) : '');
    setEditPlanDescription(p.description || '');
  };

  const handleSaveEditPlan = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingPlan || !editPlanName.trim()) return;
    setActionError(null);
    const feePaise = Math.round(parseFloat(editPlanFeeRupees || '0') * 100);
    updatePlan.mutate(
      {
        id: editingPlan._id,
        name: editPlanName,
        seatType: editPlanSeatType,
        shiftIds: editPlanShiftId ? [editPlanShiftId] : [],
        feePaise,
        description: editPlanDescription,
      },
      {
        onSuccess: () => {
          setEditingPlan(null);
        },
        onError: (err: any) => {
          setActionError(err.response?.data?.error || 'Failed to update plan');
        },
      },
    );
  };

  const handleDeletePlan = (id: string, name: string) => {
    setDeleteConfirm({ type: 'plan', id, name });
  };

  return (
    <div className="space-y-6 sm:space-y-8 max-w-7xl mx-auto pb-12">
      <div>
        <h1 className="text-2xl font-bold text-white">Plans & Shifts</h1>
        <p className="mt-1 text-sm text-slate-400">
          Configure operational study hours and membership plan offerings for your library.
        </p>
      </div>

      {actionError && (
        <div className="rounded-lg bg-red-500/10 border border-red-500/20 p-4 text-sm text-red-400 flex items-center justify-between">
          <span>{actionError}</span>
          <button onClick={() => setActionError(null)} className="text-red-400 font-bold hover:text-red-300">✕</button>
        </div>
      )}

      <div className="grid grid-cols-1 gap-6 sm:gap-8 lg:grid-cols-2">
        {/* ── Shifts Section ── */}
        <div className="rounded-2xl border border-surface-700 bg-surface-800 p-4 sm:p-6 space-y-5 sm:space-y-6">
          <div>
            <h2 className="text-base sm:text-lg font-semibold text-white">Operational Shifts</h2>
            <p className="text-xs text-slate-400">Define library shifts and study periods in 12-hour format.</p>
          </div>

          <form onSubmit={handleCreateShift} className="space-y-3 bg-surface-900/60 p-3.5 sm:p-4 rounded-xl border border-surface-700">
            <h3 className="text-xs font-semibold uppercase tracking-wider text-slate-300">+ Add New Shift</h3>
            <div>
              <label className="block text-xs font-medium text-slate-300">Shift Name</label>
              <input
                type="text"
                value={shiftName}
                onChange={(e) => setShiftName(e.target.value)}
                placeholder="e.g. Morning Shift"
                className="mt-1 w-full rounded border border-surface-600 bg-surface-700 px-3 py-1.5 text-sm text-white"
                required
              />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-medium text-slate-300">
                  Start Time <span className="text-[10px] text-brand-400 font-normal">({formatTime12H(startTime)})</span>
                </label>
                <input
                  type="time"
                  value={startTime}
                  onChange={(e) => setStartTime(e.target.value)}
                  className="mt-1 w-full rounded border border-surface-600 bg-surface-700 px-3 py-1.5 text-sm text-white"
                  required
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-300">
                  End Time <span className="text-[10px] text-brand-400 font-normal">({formatTime12H(endTime)})</span>
                </label>
                <input
                  type="time"
                  value={endTime}
                  onChange={(e) => setEndTime(e.target.value)}
                  className="mt-1 w-full rounded border border-surface-600 bg-surface-700 px-3 py-1.5 text-sm text-white"
                  required
                />
              </div>
            </div>
            <button
              type="submit"
              disabled={createShift.isPending}
              className="w-full rounded bg-brand-600 px-3 py-2 text-xs font-semibold text-white hover:bg-brand-500 disabled:opacity-50"
            >
              {createShift.isPending ? 'Adding…' : 'Save Shift'}
            </button>
          </form>

          {/* Shifts list */}
          <div className="space-y-2">
            <h3 className="text-xs font-semibold text-slate-400">Configured Shifts ({shifts.length})</h3>
            {shiftsLoading ? (
              <p className="text-xs text-slate-500">Loading shifts…</p>
            ) : shifts.length === 0 ? (
              <p className="text-xs text-slate-500">No shifts created yet. Add one above.</p>
            ) : (
              shifts.map((s) => (
                <div key={s._id} className="flex items-center justify-between rounded border border-surface-700 bg-surface-700/40 p-3 hover:border-surface-600 transition">
                  <div>
                    <p className="text-sm font-medium text-white">{s.name}</p>
                    <p className="text-xs text-brand-300 font-mono mt-0.5">
                      {formatTime12H(s.startTime)} – {formatTime12H(s.endTime)}
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => handleStartEditShift(s)}
                      className="rounded bg-surface-600 hover:bg-surface-500 px-2 py-1 text-xs text-slate-200"
                    >
                      Edit
                    </button>
                    <button
                      onClick={() => handleDeleteShift(s._id, s.name)}
                      className="rounded bg-red-500/20 hover:bg-red-500/30 px-2 py-1 text-xs text-red-300"
                    >
                      Delete
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* ── Plans Section ── */}
        <div className="rounded-2xl border border-surface-700 bg-surface-800 p-4 sm:p-6 space-y-5 sm:space-y-6">
          <div>
            <h2 className="text-base sm:text-lg font-semibold text-white">Membership Plans</h2>
            <p className="text-xs text-slate-400">Configure plans with pricing in rupees (unlimited capacity).</p>
          </div>

          <form onSubmit={handleCreatePlan} className="space-y-3 bg-surface-900/60 p-3.5 sm:p-4 rounded-xl border border-surface-700">
            <h3 className="text-xs font-semibold uppercase tracking-wider text-slate-300">+ Add New Plan</h3>
            <div>
              <label className="block text-xs font-medium text-slate-300">Plan Name</label>
              <input
                type="text"
                value={planName}
                onChange={(e) => setPlanName(e.target.value)}
                placeholder="e.g. Full Day Reserved"
                className="mt-1 w-full rounded border border-surface-600 bg-surface-700 px-3 py-1.5 text-sm text-white"
                required
              />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <CustomSelect
                  label="Seat Type"
                  value={seatType}
                  onChange={(val) => setSeatType(val as 'reserved' | 'non-reserved')}
                  options={[
                    { value: 'reserved', label: 'Reserved' },
                    { value: 'non-reserved', label: 'Non-Reserved' },
                  ]}
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">Monthly Fee (₹)</label>
                <input
                  type="number"
                  min="0"
                  step="1"
                  value={feeRupees}
                  onChange={(e) => setFeeRupees(e.target.value)}
                  className="w-full rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 px-3.5 py-2 text-sm text-slate-900 dark:text-white"
                  required
                />
              </div>
            </div>
            <div>
              <CustomSelect
                label="Shift Assignment"
                value={selectedShiftId}
                onChange={(val) => setSelectedShiftId(val)}
                options={[
                  { value: '', label: 'Any / Not Shift-Specific' },
                  ...shifts.map((s) => ({
                    value: s._id,
                    label: `${s.name} (${formatTime12H(s.startTime)} – ${formatTime12H(s.endTime)})`,
                  })),
                ]}
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-300">Description (Optional)</label>
              <input
                type="text"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="e.g. Dedicated desk, Locker access"
                className="mt-1 w-full rounded border border-surface-600 bg-surface-700 px-3 py-1.5 text-sm text-white"
              />
            </div>
            <button
              type="submit"
              disabled={createPlan.isPending}
              className="w-full rounded bg-brand-600 px-3 py-2 text-xs font-semibold text-white hover:bg-brand-500 disabled:opacity-50"
            >
              {createPlan.isPending ? 'Adding…' : 'Save Plan'}
            </button>
          </form>

          {/* Plans list */}
          <div className="space-y-2">
            <h3 className="text-xs font-semibold text-slate-400">Configured Plans ({plans.length})</h3>
            {plansLoading ? (
              <p className="text-xs text-slate-500">Loading plans…</p>
            ) : plans.length === 0 ? (
              <p className="text-xs text-slate-500">No plans configured yet. Add one above.</p>
            ) : (
              plans.map((p) => (
                <div key={p._id} className="flex items-center justify-between rounded border border-surface-700 bg-surface-700/40 p-3 hover:border-surface-600 transition">
                  <div>
                    <div className="flex items-center gap-2">
                      <p className="text-sm font-medium text-white">{p.name}</p>
                      <span className="rounded bg-brand-500/20 px-1.5 py-0.5 text-[10px] text-brand-300 capitalize">
                        {p.seatType}
                      </span>
                    </div>
                    {p.description && <p className="text-xs text-slate-400 mt-0.5">{p.description}</p>}
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="text-right">
                      <p className="text-sm font-bold text-white">₹{(p.feePaise / 100).toFixed(0)}</p>
                      <p className="text-[10px] text-slate-400">/ month</p>
                    </div>
                    <button
                      onClick={() => handleStartEditPlan(p)}
                      className="rounded bg-surface-600 hover:bg-surface-500 px-2 py-1 text-xs text-slate-200"
                    >
                      Edit
                    </button>
                    <button
                      onClick={() => handleDeletePlan(p._id, p.name)}
                      className="rounded bg-red-500/20 hover:bg-red-500/30 px-2 py-1 text-xs text-red-300"
                    >
                      Delete
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>

      {/* ── Edit Shift Modal ── */}
      <Modal
        isOpen={!!editingShift}
        onClose={() => setEditingShift(null)}
        title="Edit Shift"
        subtitle="Update timing or name for this operational period"
        icon={<Clock className="h-5 w-5" />}
        maxWidth="md"
      >
        <form onSubmit={handleSaveEditShift} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">Shift Name</label>
            <input
              type="text"
              value={editShiftName}
              onChange={(e) => setEditShiftName(e.target.value)}
              className="w-full rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 px-3.5 py-2 text-sm text-slate-900 dark:text-white"
              required
            />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Start Time ({formatTime12H(editShiftStartTime)})
              </label>
              <input
                type="time"
                value={editShiftStartTime}
                onChange={(e) => setEditShiftStartTime(e.target.value)}
                className="w-full rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 px-3.5 py-2 text-sm text-slate-900 dark:text-white"
                required
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                End Time ({formatTime12H(editShiftEndTime)})
              </label>
              <input
                type="time"
                value={editShiftEndTime}
                onChange={(e) => setEditShiftEndTime(e.target.value)}
                className="w-full rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 px-3.5 py-2 text-sm text-slate-900 dark:text-white"
                required
              />
            </div>
          </div>
          <div className="flex justify-end gap-3 pt-3 border-t border-slate-200 dark:border-slate-800">
            <button
              type="button"
              onClick={() => setEditingShift(null)}
              className="rounded-xl px-4 py-2 text-xs font-semibold text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={updateShift.isPending}
              className="rounded-xl bg-indigo-600 px-4 py-2 text-xs font-semibold !text-white hover:bg-indigo-500 disabled:opacity-50 shadow-sm"
            >
              {updateShift.isPending ? 'Saving…' : 'Save Changes'}
            </button>
          </div>
        </form>
      </Modal>

      {/* ── Edit Plan Modal ── */}
      <Modal
        isOpen={!!editingPlan}
        onClose={() => setEditingPlan(null)}
        title="Edit Plan"
        subtitle="Update pricing, seat type, or assigned shift"
        icon={<CalendarClock className="h-5 w-5" />}
        maxWidth="md"
      >
        <form onSubmit={handleSaveEditPlan} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">Plan Name</label>
            <input
              type="text"
              value={editPlanName}
              onChange={(e) => setEditPlanName(e.target.value)}
              className="w-full rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 px-3.5 py-2 text-sm text-slate-900 dark:text-white"
              required
            />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <CustomSelect
                label="Seat Type"
                value={editPlanSeatType}
                onChange={(val) => setEditPlanSeatType(val as 'reserved' | 'non-reserved')}
                options={[
                  { value: 'reserved', label: 'Reserved' },
                  { value: 'non-reserved', label: 'Non-Reserved' },
                ]}
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">Monthly Fee (₹)</label>
              <input
                type="number"
                min="0"
                step="1"
                value={editPlanFeeRupees}
                onChange={(e) => setEditPlanFeeRupees(e.target.value)}
                className="w-full rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 px-3.5 py-2 text-sm text-slate-900 dark:text-white"
                required
              />
            </div>
          </div>
          <div>
            <CustomSelect
              label="Shift Assignment"
              value={editPlanShiftId}
              onChange={(val) => setEditPlanShiftId(val)}
              options={[
                { value: '', label: 'Any / Not Shift-Specific' },
                ...shifts.map((s) => ({
                  value: s._id,
                  label: `${s.name} (${formatTime12H(s.startTime)} – ${formatTime12H(s.endTime)})`,
                })),
              ]}
            />
          </div>
          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">Description (Optional)</label>
            <input
              type="text"
              value={editPlanDescription}
              onChange={(e) => setEditPlanDescription(e.target.value)}
              className="w-full rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 px-3.5 py-2 text-sm text-slate-900 dark:text-white"
            />
          </div>
          <div className="flex justify-end gap-3 pt-3 border-t border-slate-200 dark:border-slate-800">
            <button
              type="button"
              onClick={() => setEditingPlan(null)}
              className="rounded-xl px-4 py-2 text-xs font-semibold text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={updatePlan.isPending}
              className="rounded-xl bg-indigo-600 px-4 py-2 text-xs font-semibold !text-white hover:bg-indigo-500 disabled:opacity-50 shadow-sm"
            >
              {updatePlan.isPending ? 'Saving…' : 'Save Changes'}
            </button>
          </div>
        </form>
      </Modal>

      {/* Delete Confirmation Modal */}
      <ConfirmModal
        isOpen={!!deleteConfirm}
        onClose={() => setDeleteConfirm(null)}
        onConfirm={() => {
          if (!deleteConfirm) return;
          if (deleteConfirm.type === 'shift') {
            deleteShift.mutate(deleteConfirm.id, {
              onSuccess: () => setDeleteConfirm(null),
            });
          } else {
            deletePlan.mutate(deleteConfirm.id, {
              onSuccess: () => setDeleteConfirm(null),
            });
          }
        }}
        title={`Delete ${deleteConfirm?.type === 'shift' ? 'Shift' : 'Plan'} "${deleteConfirm?.name || ''}"`}
        description={`Are you sure you want to delete this ${deleteConfirm?.type === 'shift' ? 'study shift' : 'membership plan'}? This action cannot be undone.`}
        confirmLabel={`Delete ${deleteConfirm?.type === 'shift' ? 'Shift' : 'Plan'}`}
        variant="danger"
        isLoading={deleteShift.isPending || deletePlan.isPending}
      />
    </div>
  );
}
