import { useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useStudentProfile, useCreateMembership, useRecordPayment, useMarkMembershipLeft, useAddGiftDays, useUpdateStudent } from '../hooks/useStudents';
import { usePlans, useSeats, useShifts } from '../hooks/useLibrary';
import { useAuth } from '../hooks/useAuth';
import { PrintableCard } from '../components/PrintableCard';
import { PrintableReceipt } from '../components/PrintableReceipt';
import type { PaymentDTO } from '@atlas/shared';
import { CustomSelect, Modal, ConfirmModal } from '../components/ui';
import { UserCheck, CreditCard, Gift, UserCog, Bell, ArrowLeft } from 'lucide-react';
import {
  DateRangeDurationSelector,
  calculateEndDateFromDays,
  getTodayDateString,
  type DurationOption,
} from '../components/DateRangeDurationSelector';

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
  const [showMarkLeftConfirm, setShowMarkLeftConfirm] = useState(false);
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
  const [durationOption, setDurationOption] = useState<DurationOption>('30d');
  const [startDate, setStartDate] = useState(() => getTodayDateString());
  const [endDate, setEndDate] = useState(() => calculateEndDateFromDays(getTodayDateString(), 30));

  // Payment form
  const [paymentAmountRupees, setPaymentAmountRupees] = useState('');
  const [paymentMethod, setPaymentMethod] = useState<'cash' | 'upi' | 'card' | 'bank_transfer'>('upi');
  const [transactionRef, setTransactionRef] = useState('');
  const [notes, setNotes] = useState('');

  if (isLoading || !profile) {
    return (
      <div className="flex h-64 flex-col items-center justify-center text-slate-400 text-sm gap-2">
        <div className="h-6 w-6 animate-spin rounded-full border-2 border-indigo-600 border-t-transparent" />
        <span>Loading student profile…</span>
      </div>
    );
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
          setSelectedPlanId('');
          setSelectedShiftId('');
          setSelectedSeatId('');
          setDurationOption('30d');
          const today = getTodayDateString();
          setStartDate(today);
          setEndDate(calculateEndDateFromDays(today, 30));
        },
      },
    );
  };

  const handleRecordPayment = (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeMembership) return;
    const amountPaise = Math.round(parseFloat(paymentAmountRupees || '0') * 100);
    if (amountPaise <= 0) return;

    recordPayment.mutate(
      {
        membershipId: activeMembership._id,
        amountPaise,
        paymentMethod,
        transactionRef: transactionRef || undefined,
        notes: notes || undefined,
      },
      {
        onSuccess: (data) => {
          setShowPaymentModal(false);
          setPaymentAmountRupees('');
          setTransactionRef('');
          setNotes('');
          setReceiptPayment(data.payment);
        },
      },
    );
  };

  const handleAddGiftDays = (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeMembership || !id) return;
    const days = parseInt(giftDaysCount, 10);
    if (isNaN(days) || days <= 0) return;

    addGiftDays.mutate(
      {
        membershipId: activeMembership._id,
        studentId: id,
        days,
        reason: giftReason,
      },
      {
        onSuccess: () => {
          setShowGiftDaysModal(false);
        },
      },
    );
  };

  const handleSaveStudentEdit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!id || !editName.trim() || !editMobile.trim()) return;

    updateStudent.mutate(
      {
        id,
        name: editName.trim(),
        mobile: editMobile.trim(),
        email: editEmail.trim() || undefined,
        address: editAddress.trim() || undefined,
        membershipNumber: editMembershipNumber.trim() || undefined,
        photoUrl: editPhotoUrl.trim() || undefined,
      },
      {
        onSuccess: () => {
          setShowEditStudentModal(false);
        },
      },
    );
  };

  const duesRemainingPaise = activeMembership
    ? Math.max(0, activeMembership.feePaise - activeMembership.paidPaise)
    : 0;

  return (
    <div className="space-y-4 sm:space-y-6 max-w-6xl pb-12">
      {/* ── Student Profile Header ── */}
      <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-4 sm:p-6 shadow-sm">
        <Link
          to="/students"
          className="inline-flex items-center gap-1 text-xs text-indigo-600 dark:text-indigo-400 hover:underline font-semibold mb-3 sm:mb-4"
        >
          <ArrowLeft className="h-3.5 w-3.5" /> Back to Students Directory
        </Link>

        <div className="flex flex-col gap-4">
          <div className="flex items-center gap-3.5 sm:gap-4">
            {student.photoUrl ? (
              <img
                src={student.photoUrl}
                alt={student.name}
                className="h-14 w-14 sm:h-16 sm:w-16 rounded-full object-cover border-2 border-indigo-500 shadow-md shrink-0"
              />
            ) : (
              <div className="h-14 w-14 sm:h-16 sm:w-16 rounded-full bg-indigo-50 dark:bg-indigo-950/60 border border-indigo-200 dark:border-indigo-800 flex items-center justify-center text-xl sm:text-2xl font-bold text-indigo-600 dark:text-indigo-400 shrink-0">
                {student.name.charAt(0).toUpperCase()}
              </div>
            )}
            <div className="min-w-0">
              <div className="flex flex-wrap items-center gap-2">
                <h1 className="text-xl sm:text-2xl font-bold text-slate-900 dark:text-white truncate">{student.name}</h1>
                <span className="rounded-md bg-indigo-50 dark:bg-indigo-950/60 border border-indigo-200 dark:border-indigo-800 px-2 py-0.5 text-xs font-mono font-bold text-indigo-600 dark:text-indigo-400">
                  {student.membershipNumber}
                </span>
              </div>
              <p className="mt-1 text-xs sm:text-sm text-slate-500 dark:text-slate-400 truncate">
                📞 {student.mobile} {student.email ? `· ✉️ ${student.email}` : ''} {student.address ? `· 📍 ${student.address}` : ''}
              </p>
            </div>
          </div>

          <div className="grid grid-cols-2 sm:flex sm:flex-wrap gap-2 pt-1 border-t border-slate-100 dark:border-slate-800">
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
              className="rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 px-3 py-2 text-xs font-semibold text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-700 shadow-xs transition text-center justify-center"
            >
              ✏️ Edit Member
            </button>
            <button
              onClick={() => setShowCardModal(true)}
              className="rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 px-3 py-2 text-xs font-semibold text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-700 shadow-xs transition text-center justify-center"
            >
              🪪 View ID Card
            </button>
            <button
              onClick={() => setShowReminderModal(true)}
              className="rounded-xl bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-200 dark:border-emerald-800 px-3 py-2 text-xs font-semibold text-emerald-600 dark:text-emerald-400 hover:bg-emerald-600 hover:!text-white transition text-center justify-center"
            >
              📲 Reminder
            </button>
            <button
              onClick={() => setShowAssignModal(true)}
              className="rounded-xl bg-indigo-600 px-3 py-2 text-xs font-semibold !text-white hover:bg-indigo-500 shadow-xs transition text-center justify-center"
            >
              {activeMembership ? '↻ Renew Plan' : '+ Assign Plan'}
            </button>
          </div>
        </div>
      </div>

      {/* ── Active Membership Banner ── */}
      <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-6 space-y-4 shadow-sm">
        <div className="flex items-center justify-between">
          <h2 className="text-base font-bold text-slate-900 dark:text-white">Current Active Membership</h2>
          {activeMembership && (
            <div className="flex items-center gap-2">
              <button
                onClick={() => setShowGiftDaysModal(true)}
                className="rounded-lg bg-indigo-50 dark:bg-indigo-950/60 border border-indigo-200 dark:border-indigo-800 px-2.5 py-1 text-xs font-semibold text-indigo-600 dark:text-indigo-400 hover:bg-indigo-600 hover:!text-white transition"
              >
                🎁 Add Gift Days
              </button>
              <button
                onClick={() => setShowMarkLeftConfirm(true)}
                className="rounded-lg bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900/50 px-2.5 py-1 text-xs font-semibold text-rose-600 dark:text-rose-400 hover:bg-rose-600 hover:!text-white transition"
              >
                🚪 Mark as Left
              </button>
              <span className="rounded-md bg-emerald-500/10 text-emerald-600 dark:bg-emerald-500/20 dark:text-emerald-400 border border-emerald-500/30 px-2.5 py-0.5 text-xs font-semibold capitalize">
                ● Active
              </span>
            </div>
          )}
        </div>

        {!activeMembership ? (
          <div className="p-6 text-center border border-dashed border-slate-300 dark:border-slate-700 rounded-xl">
            <p className="text-sm text-slate-500 dark:text-slate-400">No active membership assigned.</p>
            <button
              onClick={() => setShowAssignModal(true)}
              className="mt-2 text-xs font-semibold text-indigo-600 dark:text-indigo-400 hover:underline"
            >
              Assign a plan & seat now
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-2.5 sm:gap-4">
            <div className="bg-slate-50 dark:bg-slate-800/40 p-3 sm:p-4 rounded-xl border border-slate-200 dark:border-slate-800">
              <p className="text-[11px] sm:text-xs text-slate-500 dark:text-slate-400">Plan & Seat Type</p>
              <p className="text-xs sm:text-sm font-bold text-slate-900 dark:text-white mt-0.5 capitalize">
                {activeMembership.seatType}
              </p>
            </div>
            <div className="bg-slate-50 dark:bg-slate-800/40 p-3 sm:p-4 rounded-xl border border-slate-200 dark:border-slate-800">
              <p className="text-[11px] sm:text-xs text-slate-500 dark:text-slate-400">Assigned Seat</p>
              <div className="mt-0.5">
                {activeMembership.seatType === 'reserved' ? (
                  (activeMembership.seatNumber || (activeMembership.seatId as any)?.seatNumber) ? (
                    <span className="text-xs sm:text-sm font-bold text-indigo-600 dark:text-indigo-400">
                      Seat #{activeMembership.seatNumber || (activeMembership.seatId as any)?.seatNumber}
                    </span>
                  ) : (
                    <button
                      onClick={() => setShowAssignModal(true)}
                      className="text-xs font-bold text-amber-500 hover:underline flex items-center gap-1 cursor-pointer"
                    >
                      ⚠️ Assign Desk
                    </button>
                  )
                ) : (
                  <span className="text-xs sm:text-sm font-bold text-indigo-600 dark:text-indigo-400">
                    Floating Desk
                  </span>
                )}
              </div>
            </div>
            <div className="bg-slate-50 dark:bg-slate-800/40 p-3 sm:p-4 rounded-xl border border-slate-200 dark:border-slate-800">
              <p className="text-[11px] sm:text-xs text-slate-500 dark:text-slate-400">Validity Period</p>
              <p className="text-[11px] sm:text-xs font-semibold text-slate-900 dark:text-white mt-1">
                {new Date(activeMembership.startDate).toLocaleDateString()} – {new Date(activeMembership.endDate).toLocaleDateString()}
              </p>
            </div>
            <div className="bg-slate-50 dark:bg-slate-800/40 p-3 sm:p-4 rounded-xl border border-slate-200 dark:border-slate-800 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2">
              <div>
                <p className="text-[11px] sm:text-xs text-slate-500 dark:text-slate-400">Payment Status</p>
                <p className="text-xs sm:text-sm font-bold text-slate-900 dark:text-white mt-0.5 capitalize">
                  {activeMembership.paymentStatus} (₹{(activeMembership.paidPaise / 100).toFixed(0)} / ₹{(activeMembership.feePaise / 100).toFixed(0)})
                </p>
              </div>
              {duesRemainingPaise > 0 && (
                <button
                  onClick={() => {
                    setPaymentAmountRupees((duesRemainingPaise / 100).toString());
                    setShowPaymentModal(true);
                  }}
                  className="rounded-lg bg-indigo-600 px-3 py-1 text-xs font-semibold !text-white hover:bg-indigo-500 shadow shrink-0"
                >
                  Pay Due
                </button>
              )}
            </div>
          </div>
        )}
      </div>

      {/* ── Payments Ledger ── */}
      <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-6 space-y-4 shadow-sm">
        <div className="flex items-center justify-between">
          <h2 className="text-base font-bold text-slate-900 dark:text-white">Payment Ledger ({payments.length})</h2>
          {activeMembership && duesRemainingPaise > 0 && (
            <button
              onClick={() => {
                setPaymentAmountRupees((duesRemainingPaise / 100).toString());
                setShowPaymentModal(true);
              }}
              className="text-xs text-indigo-600 dark:text-indigo-400 hover:underline font-semibold"
            >
              + Record Fee Payment
            </button>
          )}
        </div>

        {payments.length === 0 ? (
          <p className="text-xs text-slate-400 py-4 text-center">No payment transactions recorded.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-slate-700 dark:text-slate-300">
              <thead className="bg-slate-50 dark:bg-slate-800/60 font-semibold uppercase text-slate-500 dark:text-slate-400 border-b border-slate-200 dark:border-slate-800">
                <tr>
                  <th className="px-4 py-2.5">Receipt #</th>
                  <th className="px-4 py-2.5">Date</th>
                  <th className="px-4 py-2.5">Method</th>
                  <th className="px-4 py-2.5">Txn Ref</th>
                  <th className="px-4 py-2.5">Amount</th>
                  <th className="px-4 py-2.5 text-right">Receipt</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60">
                {payments.map((p) => (
                  <tr key={p._id} className="hover:bg-slate-50/80 dark:hover:bg-slate-800/30 transition">
                    <td className="px-4 py-3 font-mono font-bold text-slate-900 dark:text-white">{p.receiptNumber}</td>
                    <td className="px-4 py-3 text-slate-500 dark:text-slate-400">{new Date(p.createdAt).toLocaleDateString()}</td>
                    <td className="px-4 py-3 uppercase font-semibold text-slate-700 dark:text-slate-300">{p.paymentMethod}</td>
                    <td className="px-4 py-3 text-slate-500 dark:text-slate-400">{p.transactionRef || '—'}</td>
                    <td className="px-4 py-3 font-bold text-emerald-600 dark:text-emerald-400">₹{(p.amountPaise / 100).toFixed(2)}</td>
                    <td className="px-4 py-3 text-right">
                      <button
                        onClick={() => setReceiptPayment(p)}
                        className="rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 px-2.5 py-1 text-[11px] font-semibold text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-700 transition"
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
        icon={<UserCheck className="h-5 w-5 text-indigo-500" />}
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
              label="Select Operational Shift"
              value={selectedShiftId}
              onChange={(val) => setSelectedShiftId(val)}
              options={[
                { value: '', label: 'General / Full Day' },
                ...shifts.map((sh) => ({
                  value: sh._id,
                  label: `${sh.name} (${sh.startTime} - ${sh.endTime})`,
                })),
              ]}
            />
          </div>

          <DateRangeDurationSelector
            startDate={startDate}
            endDate={endDate}
            onChangeStartDate={setStartDate}
            onChangeEndDate={setEndDate}
            durationOption={durationOption}
            onChangeDurationOption={setDurationOption}
            label="Membership Validity & Duration"
          />

          {createMembership.isError && (
            <div className="p-3 bg-red-500/10 border border-red-500/30 rounded-xl text-red-500 text-xs">
              Failed to assign: {(createMembership.error as { response?: { data?: { error?: string } } })?.response?.data?.error || 'Conflict or server error'}
            </div>
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
        title="Record Fee Payment"
        subtitle={`Collect dues for ${student.name}`}
        icon={<CreditCard className="h-5 w-5 text-indigo-500" />}
        maxWidth="md"
      >
        <form onSubmit={handleRecordPayment} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">Amount (₹) *</label>
            <input
              type="number"
              step="1"
              min="1"
              value={paymentAmountRupees}
              onChange={(e) => setPaymentAmountRupees(e.target.value)}
              className="w-full rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 px-3.5 py-2 text-sm text-slate-900 dark:text-white"
              required
            />
          </div>

          <div>
            <CustomSelect
              label="Payment Mode *"
              value={paymentMethod}
              onChange={(val) => setPaymentMethod(val as any)}
              options={[
                { value: 'upi', label: 'UPI (GPay / PhonePe / Paytm)' },
                { value: 'cash', label: 'Cash' },
                { value: 'card', label: 'Debit / Credit Card' },
                { value: 'bank_transfer', label: 'Bank Transfer / NEFT' },
              ]}
              required
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">Transaction Ref / UTR (Optional)</label>
            <input
              type="text"
              value={transactionRef}
              onChange={(e) => setTransactionRef(e.target.value)}
              placeholder="e.g. UPI Ref / Receipt No"
              className="w-full rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 px-3.5 py-2 text-sm text-slate-900 dark:text-white"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">Notes (Optional)</label>
            <input
              type="text"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="e.g. 50% advance for November"
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
      <PrintableCard
        isOpen={showCardModal}
        onClose={() => setShowCardModal(false)}
        student={student}
        membership={activeMembership}
        tenantName={user?.tenantName}
      />

      {/* ── Printable Receipt Modal ── */}
      {receiptPayment && (
        <PrintableReceipt
          isOpen={!!receiptPayment}
          onClose={() => setReceiptPayment(null)}
          payment={receiptPayment}
          student={student}
          tenantName={user?.tenantName}
        />
      )}

      {/* ── Add Gift Days Modal ── */}
      <Modal
        isOpen={showGiftDaysModal && !!activeMembership}
        onClose={() => setShowGiftDaysModal(false)}
        title="Add Gift Days"
        subtitle={`Extend validity for ${student.name}`}
        icon={<Gift className="h-5 w-5 text-indigo-500" />}
        maxWidth="md"
      >
        <form onSubmit={handleAddGiftDays} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
              Days to add (e.g. 3, 5, 7) *
            </label>
            <input
              type="number"
              min="1"
              value={giftDaysCount}
              onChange={(e) => setGiftDaysCount(e.target.value)}
              className="w-full rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 px-3.5 py-2 text-sm text-slate-900 dark:text-white"
              required
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">Reason / Event *</label>
            <input
              type="text"
              value={giftReason}
              onChange={(e) => setGiftReason(e.target.value)}
              placeholder="e.g. Diwali festive bonus / Exam week extension"
              className="w-full rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 px-3.5 py-2 text-sm text-slate-900 dark:text-white"
              required
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
              {addGiftDays.isPending ? 'Extending…' : 'Add Days'}
            </button>
          </div>
        </form>
      </Modal>

      {/* ── Edit Student Modal ── */}
      <Modal
        isOpen={showEditStudentModal}
        onClose={() => setShowEditStudentModal(false)}
        title="Edit Student Profile"
        subtitle={`Update details for ${student.name}`}
        icon={<UserCog className="h-5 w-5 text-indigo-500" />}
        maxWidth="md"
      >
        <form onSubmit={handleSaveStudentEdit} className="space-y-4">
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
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">Mobile *</label>
              <input
                type="tel"
                value={editMobile}
                onChange={(e) => setEditMobile(e.target.value)}
                className="w-full rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 px-3.5 py-2 text-sm text-slate-900 dark:text-white"
                required
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">Membership ID</label>
              <input
                type="text"
                value={editMembershipNumber}
                onChange={(e) => setEditMembershipNumber(e.target.value)}
                className="w-full rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 px-3.5 py-2 text-sm text-slate-900 dark:text-white"
              />
            </div>
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

          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">Address / City</label>
            <input
              type="text"
              value={editAddress}
              onChange={(e) => setEditAddress(e.target.value)}
              className="w-full rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 px-3.5 py-2 text-sm text-slate-900 dark:text-white"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">Photo URL (Optional)</label>
            <input
              type="url"
              value={editPhotoUrl}
              onChange={(e) => setEditPhotoUrl(e.target.value)}
              placeholder="https://..."
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

      {/* ── WhatsApp Reminder Modal ── */}
      <Modal
        isOpen={showReminderModal}
        onClose={() => setShowReminderModal(false)}
        title="Send WhatsApp Renewal Reminder"
        subtitle="Pre-drafted notification template for rapid dispatch"
        icon={<Bell className="h-5 w-5 text-indigo-500" />}
        maxWidth="md"
      >
        <div className="space-y-4">
          <div className="p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/40 text-xs font-mono space-y-2 whitespace-pre-line text-slate-800 dark:text-slate-200">
            {`📚 ${user?.tenantName || 'StudySpace Library'} Reminder\n\nDear ${student.name}(${activeMembership?.seatNumber || 'Seat'}),\nAapki library seat renewal due hai. Kripya confirm karein ki aap seat renew karwa rahe hain ya seat chhod rahe hain.\nJaldi se bata dein, taaki seat ko accordingly update kiya ja sake.\nKeep reading, keep growing! 🌟`}
          </div>

          <div className="flex justify-end gap-3 pt-3 border-t border-slate-200 dark:border-slate-800">
            <button
              type="button"
              onClick={() => {
                const reminderText = `📚 ${user?.tenantName || 'StudySpace Library'} Reminder\n\nDear ${student.name}(${activeMembership?.seatNumber || 'Seat'}),\nAapki library seat renewal due hai. Kripya confirm karein ki aap seat renew karwa rahe hain ya seat chhod rahe hain.\nJaldi se bata dein, taaki seat ko accordingly update kiya ja sake.\nKeep reading, keep growing! 🌟`;
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
                const reminderText = `📚 ${user?.tenantName || 'StudySpace Library'} Reminder\n\nDear ${student.name}(${activeMembership?.seatNumber || 'Seat'}),\nAapki library seat renewal due hai. Kripya confirm karein ki aap seat renew karwa rahe hain ya seat chhod rahe hain.\nJaldi se bata dein, taaki seat ko accordingly update kiya ja sake.\nKeep reading, keep growing! 🌟`;
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

      {/* Mark Left Confirmation Modal */}
      {activeMembership && (
        <ConfirmModal
          isOpen={showMarkLeftConfirm}
          onClose={() => setShowMarkLeftConfirm(false)}
          onConfirm={() => {
            markMembershipLeft.mutate(
              {
                membershipId: activeMembership._id,
                studentId: student._id,
              },
              {
                onSuccess: () => setShowMarkLeftConfirm(false),
              },
            );
          }}
          title="Mark Student as Left"
          description={`Are you sure you want to mark ${student.name} as Left? Desk #${activeMembership.seatNumber || ''} will be freed immediately.`}
          confirmLabel="Mark as Left"
          variant="danger"
          isLoading={markMembershipLeft.isPending}
        />
      )}
    </div>
  );
}
