import { useState } from 'react';
import { useShifts, useCreateShift, usePlans, useCreatePlan } from '../hooks/useLibrary';

export function PlansPage() {
  const { data: shifts = [], isLoading: shiftsLoading } = useShifts();
  const { data: plans = [], isLoading: plansLoading } = usePlans();

  const createShift = useCreateShift();
  const createPlan = useCreatePlan();

  // Shift form
  const [shiftName, setShiftName] = useState('');
  const [startTime, setStartTime] = useState('07:00');
  const [endTime, setEndTime] = useState('15:00');

  // Plan form
  const [planName, setPlanName] = useState('');
  const [seatType, setSeatType] = useState<'reserved' | 'non-reserved'>('reserved');
  const [feeRupees, setFeeRupees] = useState('600');
  const [selectedShiftId, setSelectedShiftId] = useState('');
  const [description, setDescription] = useState('');

  const handleCreateShift = (e: React.FormEvent) => {
    e.preventDefault();
    if (!shiftName.trim()) return;
    createShift.mutate(
      { name: shiftName, startTime, endTime },
      {
        onSuccess: () => {
          setShiftName('');
        },
      },
    );
  };

  const handleCreatePlan = (e: React.FormEvent) => {
    e.preventDefault();
    if (!planName.trim()) return;
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
      },
    );
  };

  return (
    <div className="space-y-8 max-w-6xl">
      <div>
        <h1 className="text-2xl font-bold text-white">Plans & Shifts</h1>
        <p className="mt-1 text-sm text-slate-400">
          Configure operational study hours and membership plan offerings for your library.
        </p>
      </div>

      <div className="grid grid-cols-1 gap-8 lg:grid-cols-2">
        {/* ── Shifts Section ── */}
        <div className="rounded-xl border border-surface-700 bg-surface-800 p-6 space-y-6">
          <div>
            <h2 className="text-lg font-semibold text-white">Operational Shifts</h2>
            <p className="text-xs text-slate-400">Define library shifts and study periods.</p>
          </div>

          <form onSubmit={handleCreateShift} className="space-y-3 bg-surface-900/60 p-4 rounded-lg border border-surface-700">
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
                <label className="block text-xs font-medium text-slate-300">Start Time</label>
                <input
                  type="time"
                  value={startTime}
                  onChange={(e) => setStartTime(e.target.value)}
                  className="mt-1 w-full rounded border border-surface-600 bg-surface-700 px-3 py-1.5 text-sm text-white"
                  required
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-300">End Time</label>
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
                <div key={s._id} className="flex items-center justify-between rounded border border-surface-700 bg-surface-700/40 p-3">
                  <div>
                    <p className="text-sm font-medium text-white">{s.name}</p>
                    <p className="text-xs text-slate-400">
                      {s.startTime} – {s.endTime}
                    </p>
                  </div>
                  <span className="rounded bg-success/20 px-2 py-0.5 text-[10px] text-success">Active</span>
                </div>
              ))
            )}
          </div>
        </div>

        {/* ── Plans Section ── */}
        <div className="rounded-xl border border-surface-700 bg-surface-800 p-6 space-y-6">
          <div>
            <h2 className="text-lg font-semibold text-white">Membership Plans</h2>
            <p className="text-xs text-slate-400">Configure plans with pricing in rupees (stored as paise).</p>
          </div>

          <form onSubmit={handleCreatePlan} className="space-y-3 bg-surface-900/60 p-4 rounded-lg border border-surface-700">
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
                <label className="block text-xs font-medium text-slate-300">Seat Type</label>
                <select
                  value={seatType}
                  onChange={(e) => setSeatType(e.target.value as 'reserved' | 'non-reserved')}
                  className="mt-1 w-full rounded border border-surface-600 bg-surface-700 px-3 py-1.5 text-sm text-white"
                >
                  <option value="reserved">Reserved</option>
                  <option value="non-reserved">Non-Reserved</option>
                </select>
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-300">Monthly Fee (₹)</label>
                <input
                  type="number"
                  min="0"
                  step="1"
                  value={feeRupees}
                  onChange={(e) => setFeeRupees(e.target.value)}
                  className="mt-1 w-full rounded border border-surface-600 bg-surface-700 px-3 py-1.5 text-sm text-white"
                  required
                />
              </div>
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-300">Shift Assignment</label>
              <select
                value={selectedShiftId}
                onChange={(e) => setSelectedShiftId(e.target.value)}
                className="mt-1 w-full rounded border border-surface-600 bg-surface-700 px-3 py-1.5 text-sm text-white"
              >
                <option value="">Any / Not Shift-Specific</option>
                {shifts.map((s) => (
                  <option key={s._id} value={s._id}>
                    {s.name} ({s.startTime}–{s.endTime})
                  </option>
                ))}
              </select>
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
                <div key={p._id} className="flex items-center justify-between rounded border border-surface-700 bg-surface-700/40 p-3">
                  <div>
                    <div className="flex items-center gap-2">
                      <p className="text-sm font-medium text-white">{p.name}</p>
                      <span className="rounded bg-brand-500/20 px-1.5 py-0.5 text-[10px] text-brand-300 capitalize">
                        {p.seatType}
                      </span>
                    </div>
                    {p.description && <p className="text-xs text-slate-400 mt-0.5">{p.description}</p>}
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-bold text-white">₹{(p.feePaise / 100).toFixed(0)}</p>
                    <p className="text-[10px] text-slate-400">/ month</p>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
