import { useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useStudentProfile, useCreateMembership, useRecordPayment, useMarkMembershipLeft, useAddGiftDays, useUpdateStudent } from '../hooks/useStudents';
import { usePlans, useSeats, useShifts } from '../hooks/useLibrary';
import { useAuth } from '../hooks/useAuth';
import { PrintableCard } from '../components/PrintableCard';
import { PrintableReceipt } from '../components/PrintableReceipt';
import type { PaymentDTO } from '@atlas/shared';
import { CustomSelect, Modal } from '../components/ui';
import { UserCheck, CreditCard, Gift, UserCog, Bell } from 'lucide-react';

export function StudentProfilePage() {
  const { id } = useParams<{ id: string }>();
  const { user } = useAuth();

  const { data: profile, isLoading } = useStudentProfile(id);
  const { data: plans = [] } = usePlans();
  const { data: seats = [] } = useSeats();
  const { data: shifts = [] } = useShifts();

  const createMembership = useCreateMembership();
  const recordPayment = useRecordPayment();
  const markMembershipLeft = useMarkMembershipLeft();
  const addGiftDays = useAddGiftDays();
  const updateStudent = useUpdateStudent();

  // Modals state
  const [showAssignModal, setShowAssignModal] = useState(false);
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [showCardModal, setShowCardModal] = useState(false);
  const [showGiftDaysModal, setShowGiftDaysModal] = useState(false);
  const [showEditStudentModal, setShowEditStudentModal] = useState(false);
  const [showReminderModal, setShowReminderModal] = useState(false);
  const [giftDaysCount, setGiftDaysCount] = useState('3');
  const [giftReason, setGiftReason] = useState('Festive bonus');
  const [receiptPayment, setReceiptPayment] = useState<PaymentDTO | null>(null);

  // Student Edit fields
  const [editName, setEditName] = useState('');
  const [editMobile, setEditMobile] = useState('');
  const [editEmail, setEditEmail] = useState('');
  const [editAddress, setEditAddress] = useState('');
  const [editMembershipNumber, setEditMembershipNumber] = useState('');
  const [editPhotoUrl, setEditPhotoUrl] = useState('');

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
          <div className="flex items-center gap-4">
            {student.photoUrl ? (
              <img
                src={student.photoUrl}
                alt={student.name}
                className="h-16 w-16 rounded-full object-cover border-2 border-brand-500 shadow-md shrink-0"
              />
            ) : (
              <div className="h-16 w-16 rounded-full bg-surface-700 border border-surface-600 flex items-center justify-center text-2xl font-bold text-white shrink-0">
                {student.name.charAt(0).toUpperCase()}
              </div>
            )}
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
          </div>
          <div className="flex flex-wrap gap-2">
            <button
              onClick={() => {
                setEditName(student.name);
                setEditMobile(student.mobile);
                setEditEmail(student.email || '');
                setEditAddress(student.address || '');
                setEditMembershipNumber(student.membershipNumber);
                setEditPhotoUrl(student.photoUrl || '');
                setShowEditStudentModal(true);
              }}
              className="rounded-lg border border-surface-600 bg-surface-700 px-3 py-1.5 text-xs font-semibold text-slate-200 hover:bg-surface-600 hover:text-white"
            >
              ✏️ Edit Member
            </button>
            <button
              onClick={() => setShowCardModal(true)}
              className="rounded-lg border border-surface-600 bg-surface-700 px-3 py-1.5 text-xs font-semibold text-slate-200 hover:bg-surface-600 hover:text-white"
            >
              🪪 View ID Card
            </button>
            <button
              onClick={() => setShowReminderModal(true)}
              className="rounded-lg bg-emerald-600/20 border border-emerald-500/30 px-3 py-1.5 text-xs font-semibold text-emerald-300 hover:bg-emerald-600 hover:text-white transition"
            >
              📲 Renewal Reminder
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
            <div className="flex items-center gap-2">
              <button
                onClick={() => setShowGiftDaysModal(true)}
                className="rounded bg-indigo-600/20 hover:bg-indigo-600 px-2.5 py-1 text-xs font-semibold text-indigo-300 hover:text-white transition"
              >
                🎁 Add Gift Days
              </button>
              <button
                onClick={() => {
                  if (window.confirm(`Are you sure you want to mark this student as Left? Seat #${activeMembership.seatNumber || ''} will be freed immediately.`)) {
                    markMembershipLeft.mutate({
                      membershipId: activeMembership._id,
                      studentId: student._id,
                    });
                  }
                }}
                className="rounded bg-red-500/20 hover:bg-red-500 px-2.5 py-1 text-xs font-semibold text-red-300 hover:text-white transition"
              >
                🚪 Mark as Left
              </button>
              <span className="rounded bg-emerald-500/20 px-2.5 py-0.5 text-xs font-medium text-emerald-400 capitalize">
                ● Active
              </span>
            </div>
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
      <Modal
        isOpen={showAssignModal}
        onClose={() => setShowAssignModal(false)}
        title="Assign Membership"
        subtitle="Enroll student in a membership plan, desk & study shift"
        icon={<UserCheck className="h-5 w-5" />}
        maxWidth="md"
      >
        <form onSubmit={handleAssignMembership} className="space-y-4">
          <div>
            <CustomSelect
              label="Select Plan *"
              value={selectedPlanId}
              onChange={(val) => setSelectedPlanId(val)}
              options={[
                { value: '', label: '-- Choose a Plan --' },
                ...plans.map((p) => ({
                  value: p._id,
                  label: `${p.name} (${p.seatType}) — ₹${(p.feePaise / 100).toFixed(0)}/mo`,
                })),
              ]}
              required
            />
          </div>

          {chosenPlan?.seatType === 'reserved' && (
            <div>
              <CustomSelect
                label="Assign Reserved Desk *"
                value={selectedSeatId}
                onChange={(val) => setSelectedSeatId(val)}
                options={[
                  { value: '', label: '-- Select an Available Seat --' },
                  ...availableSeats.map((s) => ({
                    value: s._id,
                    label: `Seat #${s.seatNumber} (${s.section})`,
                  })),
                ]}
                required
              />
            </div>
          )}

          <div>
            <CustomSelect
              label="Assigned Shift (Optional)"
              value={selectedShiftId}
              onChange={(val) => setSelectedShiftId(val)}
              options={[
                { value: '', label: '-- Flexible / Any Shift --' },
                ...shifts.map((s) => ({
                  value: s._id,
                  label: `${s.name} (${s.startTime}–${s.endTime})`,
                })),
              ]}
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">Start Date</label>
              <input
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className="w-full rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 px-3.5 py-2 text-sm text-slate-900 dark:text-white"
                required
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">End Date</label>
              <input
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                className="w-full rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 px-3.5 py-2 text-sm text-slate-900 dark:text-white"
                required
              />
            </div>
          </div>

          {createMembership.isError && (
            <p className="text-xs text-rose-500 font-medium">
              Failed to assign: {(createMembership.error as { response?: { data?: { error?: string } } })?.response?.data?.error || 'Conflict or server error'}
            </p>
          )}

          <div className="flex justify-end gap-3 pt-3 border-t border-slate-200 dark:border-slate-800">
            <button
              type="button"
              onClick={() => setShowAssignModal(false)}
              className="rounded-xl px-4 py-2 text-xs font-semibold text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={createMembership.isPending}
              className="rounded-xl bg-indigo-600 px-4 py-2 text-xs font-semibold !text-white hover:bg-indigo-500 disabled:opacity-50 shadow-sm"
            >
              {createMembership.isPending ? 'Saving…' : 'Confirm Assignment'}
            </button>
          </div>
        </form>
      </Modal>

      {/* ── Record Payment Modal ── */}
      <Modal
        isOpen={showPaymentModal}
        onClose={() => setShowPaymentModal(false)}
        title="Record Fee Collection"
        subtitle="Log student fee payment and generate printable receipt"
        icon={<CreditCard className="h-5 w-5" />}
        maxWidth="md"
      >
        <form onSubmit={handleRecordPayment} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">Amount (₹) *</label>
            <input
              type="number"
              step="0.01"
              min="1"
              value={paymentAmountRupees}
              onChange={(e) => setPaymentAmountRupees(e.target.value)}
              className="w-full rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 px-3.5 py-2 text-sm text-slate-900 dark:text-white"
              required
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <CustomSelect
                label="Payment Mode"
                value={paymentMethod}
                onChange={(val) => setPaymentMethod(val as 'cash' | 'upi' | 'card' | 'bank_transfer')}
                options={[
                  { value: 'upi', label: 'UPI (GPay/PhonePe)' },
                  { value: 'cash', label: 'Cash' },
                  { value: 'card', label: 'Debit / Credit Card' },
                  { value: 'bank_transfer', label: 'Bank Transfer / NEFT' },
                ]}
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">Transaction Reference</label>
              <input
                type="text"
                value={transactionRef}
                onChange={(e) => setTransactionRef(e.target.value)}
                placeholder="e.g. UTR / UPI Ref"
                className="w-full rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 px-3.5 py-2 text-sm text-slate-900 dark:text-white"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">Notes / Remarks</label>
            <input
              type="text"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Optional note"
              className="w-full rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 px-3.5 py-2 text-sm text-slate-900 dark:text-white"
            />
          </div>

          <div className="flex justify-end gap-3 pt-3 border-t border-slate-200 dark:border-slate-800">
            <button
              type="button"
              onClick={() => setShowPaymentModal(false)}
              className="rounded-xl px-4 py-2 text-xs font-semibold text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={recordPayment.isPending}
              className="rounded-xl bg-indigo-600 px-4 py-2 text-xs font-semibold !text-white hover:bg-indigo-500 disabled:opacity-50 shadow-sm"
            >
              {recordPayment.isPending ? 'Processing…' : 'Record & Generate Receipt'}
            </button>
          </div>
        </form>
      </Modal>

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

      {/* ── Add Gift Days Modal ── */}
      <Modal
        isOpen={showGiftDaysModal && !!activeMembership}
        onClose={() => setShowGiftDaysModal(false)}
        title="Add Gift Days"
        subtitle="Extend membership validity without creating any additional fee charges"
        icon={<Gift className="h-5 w-5" />}
        maxWidth="sm"
      >
        <form
          onSubmit={(e) => {
            e.preventDefault();
            if (!activeMembership) return;
            const days = parseInt(giftDaysCount, 10);
            if (isNaN(days) || days < 1) return;
            addGiftDays.mutate(
              {
                membershipId: activeMembership._id,
                studentId: student._id,
                days,
                reason: giftReason,
              },
              {
                onSuccess: () => {
                  setShowGiftDaysModal(false);
                },
              },
            );
          }}
          className="space-y-4"
        >
          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">Number of Days *</label>
            <input
              type="number"
              min="1"
              max="365"
              value={giftDaysCount}
              onChange={(e) => setGiftDaysCount(e.target.value)}
              className="w-full rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 px-3.5 py-2 text-sm text-slate-900 dark:text-white"
              required
            />
          </div>
          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">Reason / Promotion</label>
            <input
              type="text"
              value={giftReason}
              onChange={(e) => setGiftReason(e.target.value)}
              placeholder="e.g. Diwali bonus, compensatory days"
              className="w-full rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 px-3.5 py-2 text-sm text-slate-900 dark:text-white"
            />
          </div>
          <div className="flex justify-end gap-3 pt-3 border-t border-slate-200 dark:border-slate-800">
            <button
              type="button"
              onClick={() => setShowGiftDaysModal(false)}
              className="rounded-xl px-4 py-2 text-xs font-semibold text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={addGiftDays.isPending}
              className="rounded-xl bg-indigo-600 px-4 py-2 text-xs font-semibold !text-white hover:bg-indigo-500 disabled:opacity-50 shadow-sm"
            >
              {addGiftDays.isPending ? 'Extending…' : 'Extend Validity'}
            </button>
          </div>
        </form>
      </Modal>

      {/* ── Edit Member Modal ── */}
      <Modal
        isOpen={showEditStudentModal}
        onClose={() => setShowEditStudentModal(false)}
        title="Edit Student Profile"
        subtitle={`Update contact details or membership ID for ${student.name}`}
        icon={<UserCog className="h-5 w-5" />}
        maxWidth="md"
      >
        <form
          onSubmit={(e) => {
            e.preventDefault();
            if (!editName.trim() || !editMobile.trim()) return;
            updateStudent.mutate(
              {
                id: student._id,
                name: editName,
                mobile: editMobile,
                email: editEmail,
                address: editAddress,
                membershipNumber: editMembershipNumber,
                photoUrl: editPhotoUrl || undefined,
              },
              {
                onSuccess: () => {
                  setShowEditStudentModal(false);
                },
              },
            );
          }}
          className="space-y-4"
        >
          {/* Photo Upload in Profile Modal */}
          <div className="flex items-center gap-4">
            {editPhotoUrl ? (
              <img
                src={editPhotoUrl}
                alt="Preview"
                className="h-16 w-16 rounded-full object-cover border-2 border-indigo-500 shadow"
              />
            ) : (
              <div className="h-16 w-16 rounded-full bg-slate-100 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 flex items-center justify-center text-2xl text-slate-400">
                📷
              </div>
            )}
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">Upload Photo</label>
              <input
                type="file"
                accept="image/*"
                onChange={(e) => {
                  const file = e.target.files?.[0];
                  if (!file) return;
                  if (file.size > 2 * 1024 * 1024) {
                    alert('Photo must be less than 2MB');
                    return;
                  }
                  const reader = new FileReader();
                  reader.onload = (event) => {
                    setEditPhotoUrl(event.target?.result as string);
                  };
                  reader.readAsDataURL(file);
                }}
                className="block text-xs text-slate-500 file:mr-2 file:rounded-lg file:border-0 file:bg-slate-100 dark:file:bg-slate-800 file:px-2.5 file:py-1 file:text-xs file:font-semibold file:text-slate-700 dark:file:text-slate-300 hover:file:bg-slate-200"
              />
              {editPhotoUrl && (
                <button
                  type="button"
                  onClick={() => setEditPhotoUrl('')}
                  className="mt-1 text-[11px] text-rose-500 hover:underline"
                >
                  Remove Photo
                </button>
              )}
            </div>
          </div>
          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">Full Name *</label>
            <input
              type="text"
              value={editName}
              onChange={(e) => setEditName(e.target.value)}
              className="w-full rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 px-3.5 py-2 text-sm text-slate-900 dark:text-white"
              required
            />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">Mobile Number *</label>
              <input
                type="tel"
                value={editMobile}
                onChange={(e) => setEditMobile(e.target.value)}
                className="w-full rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 px-3.5 py-2 text-sm text-slate-900 dark:text-white"
                required
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">Email</label>
              <input
                type="email"
                value={editEmail}
                onChange={(e) => setEditEmail(e.target.value)}
                className="w-full rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 px-3.5 py-2 text-sm text-slate-900 dark:text-white"
              />
            </div>
          </div>
          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">Membership Number</label>
            <input
              type="text"
              value={editMembershipNumber}
              onChange={(e) => setEditMembershipNumber(e.target.value)}
              className="w-full rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 px-3.5 py-2 text-sm text-slate-900 dark:text-white"
            />
          </div>
          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">Address / City</label>
            <input
              type="text"
              value={editAddress}
              onChange={(e) => setEditAddress(e.target.value)}
              className="w-full rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 px-3.5 py-2 text-sm text-slate-900 dark:text-white"
            />
          </div>
          <div className="flex justify-end gap-3 pt-3 border-t border-slate-200 dark:border-slate-800">
            <button
              type="button"
              onClick={() => setShowEditStudentModal(false)}
              className="rounded-xl px-4 py-2 text-xs font-semibold text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={updateStudent.isPending}
              className="rounded-xl bg-indigo-600 px-4 py-2 text-xs font-semibold !text-white hover:bg-indigo-500 disabled:opacity-50 shadow-sm"
            >
              {updateStudent.isPending ? 'Saving…' : 'Save Changes'}
            </button>
          </div>
        </form>
      </Modal>

      {/* ── Expiry / Renewal Reminder Modal ── */}
      <Modal
        isOpen={showReminderModal}
        onClose={() => setShowReminderModal(false)}
        title="Library Renewal Reminder"
        subtitle={`Official notification for ${student.name}`}
        icon={<Bell className="h-5 w-5" />}
        maxWidth="lg"
      >
        <div className="space-y-4">
          <div className="rounded-xl bg-slate-50 dark:bg-slate-800/60 p-4 border border-slate-200 dark:border-slate-700">
            <pre className="text-xs text-slate-800 dark:text-slate-200 whitespace-pre-wrap font-sans">
{`📚 Atlas Library Reminder

Dear ${student.name}(${activeMembership?.seatNumber || '86'}),
Aapki library seat renewal due hai. Kripya confirm karein ki aap seat renew karwa rahe hain ya seat chhod rahe hain.
Jaldi se bata dein, taaki seat ko accordingly update kiya ja sake.
Keep reading, keep growing! 🌟`}
            </pre>
          </div>

          <div className="flex justify-end gap-3 pt-3 border-t border-slate-200 dark:border-slate-800">
            <button
              type="button"
              onClick={() => {
                const reminderText = `📚 Atlas Library Reminder\n\nDear ${student.name}(${activeMembership?.seatNumber || '86'}),\nAapki library seat renewal due hai. Kripya confirm karein ki aap seat renew karwa rahe hain ya seat chhod rahe hain.\nJaldi se bata dein, taaki seat ko accordingly update kiya ja sake.\nKeep reading, keep growing! 🌟`;
                navigator.clipboard.writeText(reminderText);
                alert('Template copied to clipboard!');
              }}
              className="rounded-xl border border-slate-300 dark:border-slate-700 px-4 py-2 text-xs font-semibold text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800"
            >
              📋 Copy Text
            </button>
            <button
              type="button"
              onClick={() => {
                const reminderText = `📚 Atlas Library Reminder\n\nDear ${student.name}(${activeMembership?.seatNumber || '86'}),\nAapki library seat renewal due hai. Kripya confirm karein ki aap seat renew karwa rahe hain ya seat chhod rahe hain.\nJaldi se bata dein, taaki seat ko accordingly update kiya ja sake.\nKeep reading, keep growing! 🌟`;
                const cleanMobile = student.mobile.replace(/[^0-9]/g, '');
                const fullMobile = cleanMobile.length === 10 ? `91${cleanMobile}` : cleanMobile;
                window.open(`https://wa.me/${fullMobile}?text=${encodeURIComponent(reminderText)}`, '_blank');
                setShowReminderModal(false);
              }}
              className="rounded-xl bg-emerald-600 px-4 py-2 text-xs font-semibold !text-white hover:bg-emerald-500 flex items-center gap-2 shadow-sm"
            >
              <span>💬</span> Open WhatsApp
            </button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
