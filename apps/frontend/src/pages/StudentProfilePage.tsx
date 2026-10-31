import { useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useStudentProfile, useCreateMembership, useRecordPayment } from '../hooks/useStudents';
import { usePlans, useSeats, useShifts } from '../hooks/useLibrary';
import { useAuth } from '../hooks/useAuth';
import { PrintableCard } from '../components/PrintableCard';
import { PrintableReceipt } from '../components/PrintableReceipt';
import type { PaymentDTO } from '@atlas/shared';

export function StudentProfilePage() {
  const { id } = useParams<{ id: string }>();
  const { user } = useAuth();

  const { data: profile, isLoading } = useStudentProfile(id);
  const { data: plans = [] } = usePlans();
  const { data: seats = [] } = useSeats();
  const { data: shifts = [] } = useShifts();

  const createMembership = useCreateMembership();
  const recordPayment = useRecordPayment();

  // Modals state
  const [showAssignModal, setShowAssignModal] = useState(false);
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [showCardModal, setShowCardModal] = useState(false);
  const [receiptPayment, setReceiptPayment] = useState<PaymentDTO | null>(null);

  // Membership form
  const [selectedPlanId, setSelectedPlanId] = useState('');
  const [selectedShiftId, setSelectedShiftId] = useState('');
  const [selectedSeatId, setSelectedSeatId] = useState('');
  const [startDate, setStartDate] = useState(() => new Date().toISOString().split('T')[0]);
  const [endDate, setEndDate] = useState(() =>
    new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
  );

  // Payment form
  const [paymentAmountRupees, setPaymentAmountRupees] = useState('');
  const [paymentMethod, setPaymentMethod] = useState<'cash' | 'upi' | 'card' | 'bank_transfer'>('upi');
  const [transactionRef, setTransactionRef] = useState('');
  const [notes, setNotes] = useState('');

  if (isLoading || !profile) {
    return <div className="p-8 text-center text-slate-400">Loading student profile…</div>;
  }

  const { student, activeMembership, payments } = profile;

  // Selected plan details
  const chosenPlan = plans.find((p) => p._id === selectedPlanId);
  const availableSeats = seats.filter((s) => s.status === 'available');

  const handleAssignMembership = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedPlanId || !id) return;

    createMembership.mutate(
      {
        studentId: id,
        planId: selectedPlanId,
        shiftId: selectedShiftId || undefined,
        seatId: chosenPlan?.seatType === 'reserved' ? selectedSeatId : undefined,
        startDate,
        endDate,
      },
      {
        onSuccess: () => {
          setShowAssignModal(false);
        },
      },
    );
  };

  const handleRecordPayment = (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeMembership || !paymentAmountRupees) return;

    const amountPaise = Math.round(parseFloat(paymentAmountRupees) * 100);
    const idempotencyKey = `PAY-${Date.now()}-${Math.random().toString(36).substring(7)}`;

    recordPayment.mutate(
      {
        membershipId: activeMembership._id,
        amountPaise,
        paymentMethod,
        transactionRef: transactionRef || undefined,
        idempotencyKey,
        notes: notes || undefined,
      },
      {
        onSuccess: (data) => {
          setShowPaymentModal(false);
          setPaymentAmountRupees('');
          setTransactionRef('');
          setNotes('');
          // Open receipt immediately
          setReceiptPayment(data.payment);
        },
      },
    );
  };

  const duesRemainingPaise = activeMembership
    ? Math.max(0, activeMembership.feePaise - activeMembership.paidPaise)
    : 0;

  return (
    <div className="space-y-8 max-w-6xl">
      {/* Navigation & Header */}
      <div>
        <Link to="/students" className="text-xs text-brand-400 hover:text-brand-300 font-medium">
          ← Back to Students Directory
        </Link>
        <div className="mt-2 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <div className="flex items-center gap-3">
              <h1 className="text-2xl font-bold text-white">{student.name}</h1>
              <span className="rounded bg-brand-600/30 px-2 py-0.5 text-xs font-mono font-bold text-brand-300">
                {student.membershipNumber}
              </span>
            </div>
            <p className="mt-1 text-sm text-slate-400">
              📞 {student.mobile} {student.email ? `· ✉️ ${student.email}` : ''} {student.address ? `· 📍 ${student.address}` : ''}
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            <button
              onClick={() => setShowCardModal(true)}
              className="rounded-lg border border-surface-600 bg-surface-700 px-3 py-1.5 text-xs font-semibold text-slate-200 hover:bg-surface-600 hover:text-white"
            >
              🪪 View ID Card
            </button>
            <button
              onClick={() => setShowAssignModal(true)}
              className="rounded-lg bg-brand-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-brand-500"
            >
              {activeMembership ? '↻ Change / Renew Plan' : '+ Assign Membership'}
            </button>
          </div>
        </div>
      </div>

      {/* ── Active Membership Banner ── */}
      <div className="rounded-xl border border-surface-700 bg-surface-800 p-6 space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-base font-semibold text-white">Current Active Membership</h2>
          {activeMembership && (
            <span className="rounded bg-emerald-500/20 px-2.5 py-0.5 text-xs font-medium text-emerald-400 capitalize">
              ● Active
            </span>
          )}
        </div>

        {!activeMembership ? (
          <div className="p-4 text-center border border-dashed border-surface-700 rounded-lg">
            <p className="text-sm text-slate-400">No active membership assigned.</p>
            <button
              onClick={() => setShowAssignModal(true)}
              className="mt-2 text-xs text-brand-400 underline hover:text-brand-300"
            >
              Assign a plan & seat now
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="bg-surface-900/60 p-3.5 rounded-lg border border-surface-700">
              <p className="text-xs text-slate-400">Plan & Seat Type</p>
              <p className="text-sm font-bold text-white mt-0.5 capitalize">
                {activeMembership.seatType} Membership
              </p>
            </div>
            <div className="bg-surface-900/60 p-3.5 rounded-lg border border-surface-700">
              <p className="text-xs text-slate-400">Assigned Seat</p>
              <p className="text-sm font-bold text-brand-400 mt-0.5">
                {activeMembership.seatType === 'reserved'
                  ? `Seat #${activeMembership.seatNumber || 'Reserved'}`
                  : 'Floating Desk'}
              </p>
            </div>
            <div className="bg-surface-900/60 p-3.5 rounded-lg border border-surface-700">
              <p className="text-xs text-slate-400">Validity Period</p>
              <p className="text-xs font-semibold text-white mt-1">
                {new Date(activeMembership.startDate).toLocaleDateString()} – {new Date(activeMembership.endDate).toLocaleDateString()}
              </p>
            </div>
            <div className="bg-surface-900/60 p-3.5 rounded-lg border border-surface-700 flex items-center justify-between">
              <div>
                <p className="text-xs text-slate-400">Payment Status</p>
                <p className="text-sm font-bold text-white mt-0.5 capitalize">
                  {activeMembership.paymentStatus} (₹{(activeMembership.paidPaise / 100).toFixed(0)} / ₹{(activeMembership.feePaise / 100).toFixed(0)})
                </p>
              </div>
              {duesRemainingPaise > 0 && (
                <button
                  onClick={() => {
                    setPaymentAmountRupees((duesRemainingPaise / 100).toString());
                    setShowPaymentModal(true);
                  }}
                  className="rounded bg-brand-600 px-3 py-1 text-xs font-semibold text-white hover:bg-brand-500 shrink-0 ml-2"
                >
                  Pay Due
                </button>
              )}
            </div>
          </div>
        )}
      </div>

      {/* ── Payments Ledger ── */}
      <div className="rounded-xl border border-surface-700 bg-surface-800 p-6 space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-base font-semibold text-white">Payment Ledger ({payments.length})</h2>
          {activeMembership && duesRemainingPaise > 0 && (
            <button
              onClick={() => {
                setPaymentAmountRupees((duesRemainingPaise / 100).toString());
                setShowPaymentModal(true);
              }}
              className="text-xs text-brand-400 hover:text-brand-300 font-semibold"
            >
              + Record Fee Payment
            </button>
          )}
        </div>

        {payments.length === 0 ? (
          <p className="text-xs text-slate-500 py-3 text-center">No payment transactions recorded.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-slate-300">
              <thead className="bg-surface-700/60 font-semibold uppercase text-slate-400">
                <tr>
                  <th className="px-4 py-2.5">Receipt #</th>
                  <th className="px-4 py-2.5">Date</th>
                  <th className="px-4 py-2.5">Method</th>
                  <th className="px-4 py-2.5">Txn Ref</th>
                  <th className="px-4 py-2.5">Amount</th>
                  <th className="px-4 py-2.5 text-right">Receipt</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-surface-700">
                {payments.map((p) => (
                  <tr key={p._id}>
                    <td className="px-4 py-3 font-mono font-bold text-white">{p.receiptNumber}</td>
                    <td className="px-4 py-3 text-slate-400">{new Date(p.createdAt).toLocaleDateString()}</td>
                    <td className="px-4 py-3 uppercase">{p.paymentMethod}</td>
                    <td className="px-4 py-3 text-slate-400">{p.transactionRef || '—'}</td>
                    <td className="px-4 py-3 font-bold text-emerald-400">₹{(p.amountPaise / 100).toFixed(2)}</td>
                    <td className="px-4 py-3 text-right">
                      <button
                        onClick={() => setReceiptPayment(p)}
                        className="rounded bg-surface-700 px-2.5 py-1 text-[11px] text-slate-200 hover:bg-brand-600 hover:text-white"
                      >
                        🖨️ Receipt
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* ── Assign Membership Modal ── */}
      {showAssignModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
          <div className="w-full max-w-md rounded-xl border border-surface-700 bg-surface-800 p-6 shadow-2xl space-y-4">
            <h2 className="text-lg font-bold text-white">Assign Membership</h2>

            <form onSubmit={handleAssignMembership} className="space-y-4">
              <div>
                <label className="block text-xs font-medium text-slate-300">Select Plan *</label>
                <select
                  value={selectedPlanId}
                  onChange={(e) => setSelectedPlanId(e.target.value)}
                  className="mt-1 w-full rounded border border-surface-600 bg-surface-700 px-3 py-1.5 text-sm text-white"
                  required
                >
                  <option value="">-- Choose a Plan --</option>
                  {plans.map((p) => (
                    <option key={p._id} value={p._id}>
                      {p.name} ({p.seatType}) — ₹{(p.feePaise / 100).toFixed(0)}/mo
                    </option>
                  ))}
                </select>
              </div>

              {chosenPlan?.seatType === 'reserved' && (
                <div>
                  <label className="block text-xs font-medium text-slate-300">Assign Reserved Desk *</label>
                  <select
                    value={selectedSeatId}
                    onChange={(e) => setSelectedSeatId(e.target.value)}
                    className="mt-1 w-full rounded border border-surface-600 bg-surface-700 px-3 py-1.5 text-sm text-white"
                    required
                  >
                    <option value="">-- Select an Available Seat --</option>
                    {availableSeats.map((s) => (
                      <option key={s._id} value={s._id}>
                        Seat #{s.seatNumber} ({s.section})
                      </option>
                    ))}
                  </select>
                </div>
              )}

              <div>
                <label className="block text-xs font-medium text-slate-300">Assigned Shift (Optional)</label>
                <select
                  value={selectedShiftId}
                  onChange={(e) => setSelectedShiftId(e.target.value)}
                  className="mt-1 w-full rounded border border-surface-600 bg-surface-700 px-3 py-1.5 text-sm text-white"
                >
                  <option value="">-- Flexible / Any Shift --</option>
                  {shifts.map((s) => (
                    <option key={s._id} value={s._id}>
                      {s.name} ({s.startTime}–{s.endTime})
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-slate-300">Start Date</label>
                  <input
                    type="date"
                    value={startDate}
                    onChange={(e) => setStartDate(e.target.value)}
                    className="mt-1 w-full rounded border border-surface-600 bg-surface-700 px-3 py-1.5 text-sm text-white"
                    required
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-300">End Date</label>
                  <input
                    type="date"
                    value={endDate}
                    onChange={(e) => setEndDate(e.target.value)}
                    className="mt-1 w-full rounded border border-surface-600 bg-surface-700 px-3 py-1.5 text-sm text-white"
                    required
                  />
                </div>
              </div>

              {createMembership.isError && (
                <p className="text-xs text-red-400">
                  Failed to assign: {(createMembership.error as { response?: { data?: { error?: string } } })?.response?.data?.error || 'Conflict or server error'}
                </p>
              )}

              <div className="flex justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setShowAssignModal(false)}
                  className="rounded px-4 py-2 text-xs font-semibold text-slate-300 hover:bg-surface-700"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={createMembership.isPending}
                  className="rounded bg-brand-600 px-4 py-2 text-xs font-semibold text-white hover:bg-brand-500 disabled:opacity-50"
                >
                  {createMembership.isPending ? 'Saving…' : 'Confirm Assignment'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ── Record Payment Modal ── */}
      {showPaymentModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
          <div className="w-full max-w-md rounded-xl border border-surface-700 bg-surface-800 p-6 shadow-2xl space-y-4">
            <h2 className="text-lg font-bold text-white">Record Fee Collection</h2>

            <form onSubmit={handleRecordPayment} className="space-y-4">
              <div>
                <label className="block text-xs font-medium text-slate-300">Amount (₹) *</label>
                <input
                  type="number"
                  step="0.01"
                  min="1"
                  value={paymentAmountRupees}
                  onChange={(e) => setPaymentAmountRupees(e.target.value)}
                  className="mt-1 w-full rounded border border-surface-600 bg-surface-700 px-3 py-1.5 text-sm text-white"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-slate-300">Payment Mode</label>
                  <select
                    value={paymentMethod}
                    onChange={(e) => setPaymentMethod(e.target.value as 'cash' | 'upi' | 'card' | 'bank_transfer')}
                    className="mt-1 w-full rounded border border-surface-600 bg-surface-700 px-3 py-1.5 text-sm text-white"
                  >
                    <option value="upi">UPI (GPay/PhonePe)</option>
                    <option value="cash">Cash</option>
                    <option value="card">Debit / Credit Card</option>
                    <option value="bank_transfer">Bank Transfer / NEFT</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-300">Transaction Reference</label>
                  <input
                    type="text"
                    value={transactionRef}
                    onChange={(e) => setTransactionRef(e.target.value)}
                    placeholder="e.g. UTR / UPI Ref"
                    className="mt-1 w-full rounded border border-surface-600 bg-surface-700 px-3 py-1.5 text-sm text-white"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-300">Notes / Remarks</label>
                <input
                  type="text"
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="Optional note"
                  className="mt-1 w-full rounded border border-surface-600 bg-surface-700 px-3 py-1.5 text-sm text-white"
                />
              </div>

              <div className="flex justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setShowPaymentModal(false)}
                  className="rounded px-4 py-2 text-xs font-semibold text-slate-300 hover:bg-surface-700"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={recordPayment.isPending}
                  className="rounded bg-brand-600 px-4 py-2 text-xs font-semibold text-white hover:bg-brand-500 disabled:opacity-50"
                >
                  {recordPayment.isPending ? 'Processing…' : 'Record & Generate Receipt'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ── Printable ID Card Modal ── */}
      {showCardModal && (
        <PrintableCard
          student={student}
          membership={activeMembership}
          tenantName={user?.tenantName}
          onClose={() => setShowCardModal(false)}
        />
      )}

      {/* ── Printable Receipt Modal ── */}
      {receiptPayment && (
        <PrintableReceipt
          payment={receiptPayment}
          student={student}
          tenantName={user?.tenantName}
          onClose={() => setReceiptPayment(null)}
        />
      )}
    </div>
  );
}
