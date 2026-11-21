import { useState } from 'react';
import { useShifts, useCreateShift, useUpdateShift, useDeleteShift, usePlans, useCreatePlan, useUpdatePlan, useDeletePlan } from '../hooks/useLibrary';
import { formatTime12H } from '../utils/time';
import type { ShiftDTO, PlanDTO } from '@atlas/shared';
import { CustomSelect, Modal, ConfirmModal, Skeleton } from '../components/ui';
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
        <h1 className="text-2xl font-black text-[var(--text-primary)]">Plans & Shifts</h1>
        <p className="mt-1 text-sm text-[var(--text-secondary)]">
          Configure operational study hours and membership plan offerings for your library.
        </p>
      </div>

      {actionError && (
        <div className="rounded-xl border border-rose-300 dark:border-rose-500/30 bg-rose-50 dark:bg-rose-500/10 p-4 text-sm text-rose-700 dark:text-rose-300 flex items-center justify-between">
          <span>{actionError}</span>
          <button onClick={() => setActionError(null)} className="text-rose-500 hover:text-rose-700 dark:hover:text-rose-200 font-bold ml-2 cursor-pointer">✕</button>
        </div>
      )}

      <div className="grid grid-cols-1 gap-6 sm:gap-8 lg:grid-cols-2">
        {/* ── Shifts Section ── */}
        <div
          className="rounded-2xl border p-4 sm:p-6 space-y-5 sm:space-y-6 shadow-sm transition-all"
          style={{
            backgroundColor: 'var(--bg-surface)',
            borderColor: 'var(--border-subtle)',
          }}
        >
          <div>
            <h2 className="text-base sm:text-lg font-bold text-[var(--text-primary)]">Operational Shifts</h2>
            <p className="text-xs text-[var(--text-tertiary)]">Define library shifts and study periods in 12-hour format.</p>
          </div>

          <form
            onSubmit={handleCreateShift}
            className="space-y-3.5 p-4 rounded-xl border transition-all"
            style={{
              backgroundColor: 'var(--bg-surface-subtle)',
              borderColor: 'var(--border-subtle)',
            }}
          >
            <h3 className="text-xs font-bold uppercase tracking-wider text-indigo-600 dark:text-indigo-400">+ Add New Shift</h3>
            <div>
              <label className="block text-xs font-semibold text-[var(--text-secondary)] mb-1">Shift Name</label>
              <input
                type="text"
                value={shiftName}
                onChange={(e) => setShiftName(e.target.value)}
                placeholder="e.g. Morning Shift"
                className="w-full rounded-xl border px-3 py-2 text-sm text-[var(--text-primary)] focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
                style={{
                  backgroundColor: 'var(--bg-surface)',
                  borderColor: 'var(--border-medium)',
                }}
                required
              />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-semibold text-[var(--text-secondary)] mb-1">
                  Start Time <span className="text-[10px] text-indigo-600 dark:text-indigo-400 font-normal">({formatTime12H(startTime)})</span>
                </label>
                <input
                  type="time"
                  value={startTime}
                  onChange={(e) => setStartTime(e.target.value)}
                  className="w-full rounded-xl border px-3 py-2 text-sm text-[var(--text-primary)] focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
                  style={{
                    backgroundColor: 'var(--bg-surface)',
                    borderColor: 'var(--border-medium)',
                  }}
                  required
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-[var(--text-secondary)] mb-1">
                  End Time <span className="text-[10px] text-indigo-600 dark:text-indigo-400 font-normal">({formatTime12H(endTime)})</span>
                </label>
                <input
                  type="time"
                  value={endTime}
                  onChange={(e) => setEndTime(e.target.value)}
                  className="w-full rounded-xl border px-3 py-2 text-sm text-[var(--text-primary)] focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
                  style={{
                    backgroundColor: 'var(--bg-surface)',
                    borderColor: 'var(--border-medium)',
                  }}
                  required
                />
              </div>
            </div>
            <button
              type="submit"
              disabled={createShift.isPending}
              className="w-full rounded-xl bg-[#1E3A8A] hover:bg-[#172554] dark:bg-blue-600 dark:hover:bg-blue-500 px-4 py-2.5 text-xs font-bold !text-white shadow-md shadow-blue-950/20 hover:scale-[1.01] active:scale-[0.99] transition-all disabled:opacity-50 cursor-pointer"
            >
              {createShift.isPending ? 'Adding…' : 'Save Shift'}
            </button>
          </form>

          {/* Shifts list */}
          <div className="space-y-2.5">
            <h3 className="text-xs font-bold uppercase tracking-wider text-[var(--text-tertiary)]">Configured Shifts ({shifts.length})</h3>
            {shiftsLoading ? (
              <div className="space-y-2 animate-pulse">
                {[1, 2, 3].map((i) => (
                  <div
                    key={i}
                    className="flex items-center justify-between p-3.5 rounded-xl border"
                    style={{
                      backgroundColor: 'var(--bg-surface-subtle)',
                      borderColor: 'var(--border-subtle)',
                    }}
                  >
                    <div className="space-y-1.5 flex-1">
                      <Skeleton className="h-4 w-28" />
                      <Skeleton className="h-3 w-36" />
                    </div>
                  </div>
                ))}
              </div>
            ) : shifts.length === 0 ? (
              <p className="text-xs text-[var(--text-muted)] py-4 text-center">No shifts created yet. Add one above.</p>
            ) : (
              shifts.map((s) => (
                <div
                  key={s._id}
                  className="flex items-center justify-between rounded-xl border p-3.5 hover:shadow-xs transition-all"
                  style={{
                    backgroundColor: 'var(--bg-surface-subtle)',
                    borderColor: 'var(--border-subtle)',
                  }}
                >
                  <div>
                    <p className="text-sm font-bold text-[var(--text-primary)]">{s.name}</p>
                    <p className="text-xs text-indigo-600 dark:text-indigo-400 font-mono mt-0.5">
                      {formatTime12H(s.startTime)} – {formatTime12H(s.endTime)}
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => handleStartEditShift(s)}
                      className="rounded-lg border px-2.5 py-1 text-xs font-semibold text-[var(--text-secondary)] hover:text-indigo-600 hover:border-indigo-500 transition-all cursor-pointer"
                      style={{
                        backgroundColor: 'var(--bg-surface)',
                        borderColor: 'var(--border-medium)',
                      }}
                    >
                      Edit
                    </button>
                    <button
                      onClick={() => handleDeleteShift(s._id, s.name)}
                      className="rounded-lg border border-rose-200 dark:border-rose-500/30 bg-rose-50 dark:bg-rose-500/10 px-2.5 py-1 text-xs font-semibold text-rose-700 dark:text-rose-300 hover:bg-rose-100 dark:hover:bg-rose-500/20 transition-all cursor-pointer"
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
        <div
          className="rounded-2xl border p-4 sm:p-6 space-y-5 sm:space-y-6 shadow-sm transition-all"
          style={{
            backgroundColor: 'var(--bg-surface)',
            borderColor: 'var(--border-subtle)',
          }}
        >
          <div>
            <h2 className="text-base sm:text-lg font-bold text-[var(--text-primary)]">Membership Plans</h2>
            <p className="text-xs text-[var(--text-tertiary)]">Configure plans with pricing in rupees (unlimited capacity).</p>
          </div>

          <form
            onSubmit={handleCreatePlan}
            className="space-y-3.5 p-4 rounded-xl border transition-all"
            style={{
              backgroundColor: 'var(--bg-surface-subtle)',
              borderColor: 'var(--border-subtle)',
            }}
          >
            <h3 className="text-xs font-bold uppercase tracking-wider text-indigo-600 dark:text-indigo-400">+ Add New Plan</h3>
            <div>
              <label className="block text-xs font-semibold text-[var(--text-secondary)] mb-1">Plan Name</label>
              <input
                type="text"
                value={planName}
                onChange={(e) => setPlanName(e.target.value)}
                placeholder="e.g. Full Day Reserved"
                className="w-full rounded-xl border px-3 py-2 text-sm text-[var(--text-primary)] focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
                style={{
                  backgroundColor: 'var(--bg-surface)',
                  borderColor: 'var(--border-medium)',
                }}
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
                <label className="block text-xs font-semibold text-[var(--text-secondary)] mb-1">Monthly Fee (₹)</label>
                <input
                  type="number"
                  min="0"
                  step="1"
                  value={feeRupees}
                  onChange={(e) => setFeeRupees(e.target.value)}
                  className="w-full rounded-xl border px-3 py-2 text-sm text-[var(--text-primary)] focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
                  style={{
                    backgroundColor: 'var(--bg-surface)',
                    borderColor: 'var(--border-medium)',
                  }}
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
              <label className="block text-xs font-semibold text-[var(--text-secondary)] mb-1">Description (Optional)</label>
              <input
                type="text"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="e.g. Dedicated desk, Locker access"
                className="w-full rounded-xl border px-3 py-2 text-sm text-[var(--text-primary)] focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
                style={{
                  backgroundColor: 'var(--bg-surface)',
                  borderColor: 'var(--border-medium)',
                }}
              />
            </div>
            <button
              type="submit"
              disabled={createPlan.isPending}
              className="w-full rounded-xl bg-[#1E3A8A] hover:bg-[#172554] dark:bg-blue-600 dark:hover:bg-blue-500 px-4 py-2.5 text-xs font-bold !text-white shadow-md shadow-blue-950/20 hover:scale-[1.01] active:scale-[0.99] transition-all disabled:opacity-50 cursor-pointer"
            >
              {createPlan.isPending ? 'Adding…' : 'Save Plan'}
            </button>
          </form>

          {/* Plans list */}
          <div className="space-y-2.5">
            <h3 className="text-xs font-bold uppercase tracking-wider text-[var(--text-tertiary)]">Configured Plans ({plans.length})</h3>
            {plansLoading ? (
              <div className="space-y-2 animate-pulse">
                {[1, 2, 3].map((i) => (
                  <div
                    key={i}
                    className="flex items-center justify-between p-3.5 rounded-xl border"
                    style={{
                      backgroundColor: 'var(--bg-surface-subtle)',
                      borderColor: 'var(--border-subtle)',
                    }}
                  >
                    <div className="space-y-1.5 flex-1">
                      <Skeleton className="h-4 w-32" />
                      <Skeleton className="h-3 w-44" />
                    </div>
                  </div>
                ))}
              </div>
            ) : plans.length === 0 ? (
              <p className="text-xs text-[var(--text-muted)] py-4 text-center">No plans configured yet. Add one above.</p>
            ) : (
              plans.map((p) => (
                <div
                  key={p._id}
                  className="flex items-center justify-between rounded-xl border p-3.5 hover:shadow-xs transition-all"
                  style={{
                    backgroundColor: 'var(--bg-surface-subtle)',
                    borderColor: 'var(--border-subtle)',
                  }}
                >
                  <div>
                    <div className="flex items-center gap-2">
                      <p className="text-sm font-bold text-[var(--text-primary)]">{p.name}</p>
                      <span
                        className={`text-[10px] font-bold px-2 py-0.5 rounded-md border ${
                          p.seatType === 'reserved'
                            ? 'bg-[#EEF2FF] text-[#1E3A8A] border-[#C7D2FE] dark:bg-blue-950/40 dark:text-blue-300 dark:border-blue-800'
                            : 'bg-amber-50 dark:bg-amber-500/10 text-amber-700 dark:text-amber-300 border-amber-200 dark:border-amber-500/30'
                        }`}
                      >
                        {p.seatType}
                      </span>
                    </div>
                    {p.description && <p className="text-xs text-[var(--text-secondary)] mt-0.5">{p.description}</p>}
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="text-right">
                      <p className="text-sm font-black text-emerald-700 dark:text-emerald-400">₹{((p.feePaise || (p as any).feePence || 0) / 100).toFixed(0)}</p>
                      <p className="text-[10px] text-[var(--text-muted)]">/ month</p>
                    </div>
                    <button
                      onClick={() => handleStartEditPlan(p)}
                      className="rounded-lg border px-2.5 py-1 text-xs font-semibold text-[var(--text-secondary)] hover:text-indigo-600 hover:border-indigo-500 transition-all cursor-pointer"
                      style={{
                        backgroundColor: 'var(--bg-surface)',
                        borderColor: 'var(--border-medium)',
                      }}
                    >
                      Edit
                    </button>
                    <button
                      onClick={() => handleDeletePlan(p._id, p.name)}
                      className="rounded-lg border border-rose-200 dark:border-rose-500/30 bg-rose-50 dark:bg-rose-500/10 px-2.5 py-1 text-xs font-semibold text-rose-700 dark:text-rose-300 hover:bg-rose-100 dark:hover:bg-rose-500/20 transition-all cursor-pointer"
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
              className="rounded-xl bg-[#1E3A8A] hover:bg-[#172554] dark:bg-blue-600 dark:hover:bg-blue-500 px-4 py-2 text-xs font-bold !text-white disabled:opacity-50 shadow-sm cursor-pointer"
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
              className="rounded-xl bg-[#1E3A8A] hover:bg-[#172554] dark:bg-blue-600 dark:hover:bg-blue-500 px-4 py-2 text-xs font-bold !text-white disabled:opacity-50 shadow-sm cursor-pointer"
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
