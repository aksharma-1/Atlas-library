import { useState, useMemo, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useStudentProfile, useCreateMembership, useRecordPayment, useDeletePayment, useMarkMembershipLeft, useAddGiftDays, useUpdateStudent } from '../hooks/useStudents';
import { usePlans, useSeats, useShifts } from '../hooks/useLibrary';
import { formatDate, formatDateTime } from '../utils/date';
import { renderWhatsAppReminder, openWhatsAppChat } from '../utils/whatsapp';
import { useAuth } from '../hooks/useAuth';
import { PrintableCard } from '../components/PrintableCard';
import { PrintableReceipt } from '../components/PrintableReceipt';
import type { PaymentDTO } from '@atlas/shared';
import { CustomSelect, Modal, ConfirmModal, Switch } from '../components/ui';
import { UserCheck, CreditCard, Gift, UserCog, Bell, ArrowLeft, Trash2, Clock, Calendar, Armchair, IndianRupee } from 'lucide-react';
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
  const deletePayment = useDeletePayment();
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
  const [reminderMessageText, setReminderMessageText] = useState('');
  const [giftDaysCount, setGiftDaysCount] = useState('3');
  const [giftReason, setGiftReason] = useState('Festive bonus');
  const [receiptPayment, setReceiptPayment] = useState<PaymentDTO | null>(null);
  const [paymentToDelete, setPaymentToDelete] = useState<PaymentDTO | null>(null);

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
  const [membershipDiscountRupees, setMembershipDiscountRupees] = useState('0');
  const [membershipDiscountReason, setMembershipDiscountReason] = useState('');

  // Renewal Instant Payment collection states
  const [collectPaymentOnRenewal, setCollectPaymentOnRenewal] = useState(true);
  const [renewalPaymentAmountRupees, setRenewalPaymentAmountRupees] = useState('');
  const [renewalPaymentDate, setRenewalPaymentDate] = useState(() => getTodayDateString());
  const [renewalPaymentMethod, setRenewalPaymentMethod] = useState<'cash' | 'upi' | 'card' | 'bank_transfer'>('cash');
  const [renewalPaymentRef, setRenewalPaymentRef] = useState('');

  // Payment form (Record Payment Modal)
  const [paymentAmountRupees, setPaymentAmountRupees] = useState('');
  const [paymentDate, setPaymentDate] = useState(() => getTodayDateString());
  const [paymentMethod, setPaymentMethod] = useState<'cash' | 'upi' | 'card' | 'bank_transfer'>('upi');
  const [transactionRef, setTransactionRef] = useState('');
  const [notes, setNotes] = useState('');

  // Seat dropdown options: include seats that are vacant in this shift OR the student's own current seat
  const availableSeats = useMemo(() => {
    return seats.filter((s) => {
      // Always allow student's currently assigned seat
      if (profile?.activeMembership?.seatId && (s._id === profile.activeMembership.seatId || s._id === (profile.activeMembership.seatId as any)?._id)) {
        return true;
      }
      // If seat is under maintenance or blocked, exclude
      if (s.status === 'maintenance' || s.status === 'blocked') {
        return false;
      }
      // If a shift is selected, check if this seat is free during this shift
      if (selectedShiftId) {
        if (!s.shiftOccupants || s.shiftOccupants.length === 0) return true;
        // Occupied if someone has this shift or all day ('all')
        const occupiedInShift = s.shiftOccupants.some(
          (so) => so.shiftId === selectedShiftId || so.shiftId === 'all',
        );
        return !occupiedInShift;
      }
      return s.status === 'available';
    });
  }, [seats, profile?.activeMembership, selectedShiftId]);

  // Selected plan details
  const chosenPlan = plans.find((p) => p._id === selectedPlanId);
  const durationMultiplier = durationOption === '60d' ? 2 : durationOption === '90d' ? 3 : 1;
  const standardFeeRupees = chosenPlan ? (chosenPlan.feePaise / 100) * durationMultiplier : 0;
  const finalPayableFeeRupees = Math.max(0, Math.round(standardFeeRupees - parseFloat(membershipDiscountRupees || '0')));

  // Auto-fill renewal payment amount when plan, duration, or discount changes
  useEffect(() => {
    if (chosenPlan) {
      setRenewalPaymentAmountRupees(finalPayableFeeRupees.toString());
    }
  }, [chosenPlan, durationOption, membershipDiscountRupees, finalPayableFeeRupees]);

  if (isLoading || !profile) {
    return (
      <div className="flex h-64 flex-col items-center justify-center text-slate-400 text-sm gap-2">
        <div className="h-6 w-6 animate-spin rounded-full border-2 border-indigo-600 border-t-transparent" />
        <span>Loading student profile…</span>
      </div>
    );
  }

  const { student, activeMembership, payments } = profile;

  const handleAssignMembership = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedPlanId || !id) return;

    const discountPaise = Math.round(parseFloat(membershipDiscountRupees || '0') * 100);

    createMembership.mutate(
      {
        studentId: id,
        planId: selectedPlanId,
        shiftId: selectedShiftId || undefined,
        seatId: chosenPlan?.seatType === 'reserved' ? selectedSeatId : undefined,
        startDate,
        endDate,
        customFeePaise: durationMultiplier > 1 ? Math.round(standardFeeRupees * 100) : undefined,
        discountPaise: discountPaise > 0 ? discountPaise : undefined,
        discountReason: discountPaise > 0 ? membershipDiscountReason.trim() : undefined,
        // Optional instant payment collection at renewal
        initialPaymentAmountPaise:
          collectPaymentOnRenewal && renewalPaymentAmountRupees
            ? Math.round(parseFloat(renewalPaymentAmountRupees) * 100)
            : undefined,
        paymentMethod: collectPaymentOnRenewal ? renewalPaymentMethod : undefined,
        paymentDate: collectPaymentOnRenewal && renewalPaymentDate ? renewalPaymentDate : undefined,
        transactionRef: collectPaymentOnRenewal && renewalPaymentRef ? renewalPaymentRef : undefined,
      },
      {
        onSuccess: () => {
          setShowAssignModal(false);
          setSelectedPlanId('');
          setSelectedShiftId('');
          setSelectedSeatId('');
          setMembershipDiscountRupees('0');
          setMembershipDiscountReason('');
          setRenewalPaymentAmountRupees('');
          setRenewalPaymentRef('');
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

    if (amountPaise > duesRemainingPaise) {
      alert(`Entered amount (₹${(amountPaise / 100).toFixed(0)}) cannot exceed the pending due of ₹${(duesRemainingPaise / 100).toFixed(0)}.`);
      return;
    }

    recordPayment.mutate(
      {
        membershipId: activeMembership._id,
        amountPaise,
        paymentMethod,
        paymentDate: paymentDate || undefined,
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
    <div className="space-y-6 sm:space-y-8 max-w-7xl mx-auto pb-12">
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
              onClick={() => {
                const text = renderWhatsAppReminder(user?.whatsappReminderTemplate, {
                  studentName: student.name,
                  seatNumber: (activeMembership?.seatId as any)?.seatNumber || activeMembership?.seatNumber || 'Seat',
                  libraryName: user?.tenantName || 'StudySpace Library',
                  phone: user?.phone || '',
                });
                setReminderMessageText(text);
                setShowReminderModal(true);
              }}
              className="rounded-xl bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-200 dark:border-emerald-800 px-3 py-2 text-xs font-semibold text-emerald-600 dark:text-emerald-400 hover:bg-emerald-600 hover:!text-white transition text-center justify-center"
            >
              📲 Reminder
            </button>
            <button
              onClick={() => {
                if (activeMembership) {
                  // Pre-fill renewal data
                  const mem = activeMembership as any;
                  const pId = mem.planId?._id || mem.planId;
                  const shId = mem.shiftId?._id || mem.shiftId;
                  const stId = mem.seatId?._id || mem.seatId;
                  setSelectedPlanId(typeof pId === 'string' ? pId : pId?._id || '');
                  setSelectedShiftId(typeof shId === 'string' ? shId : shId?._id || '');
                  setSelectedSeatId(typeof stId === 'string' ? stId : stId?._id || '');

                  // Pre-fill dates: start from current endDate (or today if expired)
                  const currentEnd = new Date(activeMembership.endDate);
                  const isPast = currentEnd < new Date();
                  const nextStart = isPast
                    ? getTodayDateString()
                    : currentEnd.toISOString().split('T')[0];
                  setStartDate(nextStart);
                  setEndDate(calculateEndDateFromDays(nextStart, 30));
                  setDurationOption('30d');
                }
                setShowAssignModal(true);
              }}
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
          <div className="space-y-4">
            {/* ── Highlighted Plan, Shift & Desk Banner ── */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 p-3.5 sm:p-4 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700/80 shadow-sm">
              {/* Plan Details */}
              <div className="flex items-start gap-3 p-2 rounded-lg bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800">
                <div className="p-2.5 rounded-lg bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 border border-indigo-200 dark:border-indigo-800 shrink-0">
                  <UserCheck className="h-5 w-5" />
                </div>
                <div className="min-w-0">
                  <p className="text-[11px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                    Enrolled Plan
                  </p>
                  <p className="text-sm font-extrabold text-slate-900 dark:text-white truncate mt-0.5">
                    {activeMembership.planName || 'Standard Membership'}
                  </p>
                  <p className="text-xs text-indigo-600 dark:text-indigo-400 font-semibold capitalize mt-0.5">
                    {activeMembership.seatType === 'reserved' ? 'Reserved Desk Plan' : 'Floating / Non-Reserved Plan'}
                  </p>
                </div>
              </div>

              {/* Shift Details */}
              <div className="flex items-start gap-3 p-2 rounded-lg bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800">
                <div className="p-2.5 rounded-lg bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800 shrink-0">
                  <Clock className="h-5 w-5" />
                </div>
                <div className="min-w-0">
                  <p className="text-[11px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                    Operational Shift
                  </p>
                  <p className="text-sm font-extrabold text-slate-900 dark:text-white truncate mt-0.5">
                    {activeMembership.shiftName || 'General / Full Day'}
                  </p>
                  <p className="text-xs text-emerald-700 dark:text-emerald-400 font-mono font-bold mt-0.5">
                    {activeMembership.shiftStartTime && activeMembership.shiftEndTime
                      ? `${activeMembership.shiftStartTime} – ${activeMembership.shiftEndTime}`
                      : 'All Day Access'}
                  </p>
                </div>
              </div>

              {/* Desk & Space Allocation */}
              <div className="flex items-start gap-3 p-2 rounded-lg bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800">
                <div className="p-2.5 rounded-lg bg-purple-50 dark:bg-purple-950/60 text-purple-600 dark:text-purple-400 border border-purple-200 dark:border-purple-800 shrink-0">
                  <Armchair className="h-5 w-5" />
                </div>
                <div className="min-w-0">
                  <p className="text-[11px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                    Desk Allocation
                  </p>
                  {activeMembership.seatType === 'reserved' ? (
                    (activeMembership.seatNumber || (activeMembership.seatId as any)?.seatNumber) ? (
                      <div className="mt-0.5">
                        <p className="text-sm font-extrabold text-purple-700 dark:text-purple-400">
                          Desk #{activeMembership.seatNumber || (activeMembership.seatId as any)?.seatNumber}
                        </p>
                        <p className="text-xs text-slate-600 dark:text-slate-400 font-medium">Reserved Dedicated Seat</p>
                      </div>
                    ) : (
                      <button
                        onClick={() => setShowAssignModal(true)}
                        className="text-xs font-bold text-amber-600 dark:text-amber-400 hover:underline flex items-center gap-1 cursor-pointer mt-1"
                      >
                        ⚠️ Assign Desk
                      </button>
                    )
                  ) : (
                    <div className="mt-0.5">
                      <p className="text-sm font-extrabold text-slate-800 dark:text-slate-200">Floating Desk</p>
                      <p className="text-xs text-slate-600 dark:text-slate-400 font-medium">First-come First-served</p>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* ── Key Metrics & Fee Breakdown Grid ── */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-2.5 sm:gap-4">
              <div className="bg-slate-50 dark:bg-slate-800/40 p-3 sm:p-4 rounded-xl border border-slate-200 dark:border-slate-800">
                <p className="text-[11px] sm:text-xs text-slate-500 dark:text-slate-400">Validity Period</p>
                <div className="flex items-center gap-1.5 mt-1">
                  <Calendar className="h-3.5 w-3.5 text-indigo-500" />
                  <p className="text-[11px] sm:text-xs font-semibold text-slate-900 dark:text-white">
                    {formatDate(activeMembership.startDate)} – {formatDate(activeMembership.endDate)}
                  </p>
                </div>
              </div>

              <div className="bg-slate-50 dark:bg-slate-800/40 p-3 sm:p-4 rounded-xl border border-slate-200 dark:border-slate-800">
                <p className="text-[11px] sm:text-xs text-slate-500 dark:text-slate-400">Total Agreed Fee</p>
                <div className="flex items-center gap-1.5 mt-0.5">
                  <p className="text-xs sm:text-sm font-mono font-bold text-slate-900 dark:text-white">
                    ₹{(activeMembership.feePaise / 100).toFixed(0)}
                  </p>
                  {(activeMembership.discountPaise || 0) > 0 && (
                    <span
                      title={activeMembership.discountReason || 'Discount Applied'}
                      className="inline-flex items-center gap-0.5 rounded-md bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/30 px-1.5 py-0.2 text-[10px] font-bold"
                    >
                      -₹{((activeMembership.discountPaise || 0) / 100).toFixed(0)}
                    </span>
                  )}
                </div>
              </div>

              <div className="bg-slate-50 dark:bg-slate-800/40 p-3 sm:p-4 rounded-xl border border-slate-200 dark:border-slate-800">
                <p className="text-[11px] sm:text-xs text-slate-500 dark:text-slate-400">Paid Amount</p>
                <p className="text-xs sm:text-sm font-mono font-bold text-emerald-600 dark:text-emerald-400 mt-0.5">
                  ₹{(activeMembership.paidPaise / 100).toFixed(0)}
                </p>
              </div>

              <div className="bg-slate-50 dark:bg-slate-800/40 p-3 sm:p-4 rounded-xl border border-slate-200 dark:border-slate-800 flex items-center justify-between gap-2">
                <div>
                  <p className="text-[11px] sm:text-xs text-slate-500 dark:text-slate-400">Pending Dues</p>
                  <p
                    className={`text-xs sm:text-sm font-mono font-bold mt-0.5 ${
                      duesRemainingPaise > 0 ? 'text-rose-600 dark:text-rose-400' : 'text-slate-400'
                    }`}
                  >
                    ₹{(duesRemainingPaise / 100).toFixed(0)}
                  </p>
                </div>
                {duesRemainingPaise > 0 && (
                  <button
                    onClick={() => {
                      setPaymentAmountRupees((duesRemainingPaise / 100).toString());
                      setShowPaymentModal(true);
                    }}
                    className="rounded-lg bg-indigo-600 px-3 py-1.5 text-xs font-semibold !text-white hover:bg-indigo-500 shadow shrink-0"
                  >
                    Pay Due
                  </button>
                )}
              </div>
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
                  <th className="px-4 py-2.5 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60">
                {payments.map((p) => (
                  <tr key={p._id} className="hover:bg-slate-50/80 dark:hover:bg-slate-800/30 transition">
                    <td className="px-4 py-3 font-mono font-bold text-slate-900 dark:text-white">{p.receiptNumber}</td>
                    <td className="px-4 py-3 text-slate-500 dark:text-slate-400">{formatDateTime(p.createdAt)}</td>
                    <td className="px-4 py-3 uppercase font-semibold text-slate-700 dark:text-slate-300">{p.paymentMethod}</td>
                    <td className="px-4 py-3 text-slate-500 dark:text-slate-400">{p.transactionRef || '—'}</td>
                    <td className="px-4 py-3 font-bold text-emerald-600 dark:text-emerald-400">₹{(p.amountPaise / 100).toFixed(2)}</td>
                    <td className="px-4 py-3 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        <button
                          onClick={() => setReceiptPayment(p)}
                          className="rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 px-2.5 py-1 text-[11px] font-semibold text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-700 transition"
                        >
                          🖨️ Receipt
                        </button>
                        <button
                          onClick={() => setPaymentToDelete(p)}
                          className="p-1 rounded-lg border border-rose-200 dark:border-rose-900/50 text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/30 transition"
                          title="Delete / Reverse Payment"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </button>
                      </div>
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
              title={activeMembership ? "Renew Plan & Desk" : "Assign Membership"}
              subtitle={activeMembership ? "Extend membership dates, desk reservation & collect renewal fees" : "Enroll student in a membership plan, desk & study shift"}
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
                  ...availableSeats.map((s: any) => ({
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

          {/* Discount / Negotiation Section */}
          {chosenPlan && (
            <div className="rounded-xl border border-amber-200 dark:border-amber-900/40 bg-amber-50/50 dark:bg-amber-950/20 p-3 space-y-2">
              <div className="flex items-center justify-between text-xs">
                <span className="font-semibold text-slate-700 dark:text-slate-300">
                  Plan Standard Fee {durationMultiplier > 1 ? `(${durationMultiplier} months)` : ''}:
                </span>
                <span className="font-mono font-bold text-slate-900 dark:text-white">₹{standardFeeRupees.toFixed(0)}</span>
              </div>
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-[11px] font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Discount / Concession (₹)
                  </label>
                  <input
                    type="number"
                    min="0"
                    max={standardFeeRupees}
                    value={membershipDiscountRupees}
                    onChange={(e) => setMembershipDiscountRupees(e.target.value)}
                    placeholder="0"
                    className="w-full rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 px-2.5 py-1.5 text-xs text-slate-900 dark:text-white"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Reason / Note
                  </label>
                  <input
                    type="text"
                    value={membershipDiscountReason}
                    onChange={(e) => setMembershipDiscountReason(e.target.value)}
                    placeholder="e.g. Friend / Early bird"
                    className="w-full rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 px-2.5 py-1.5 text-xs text-slate-900 dark:text-white"
                  />
                </div>
              </div>
              <div className="flex items-center justify-between pt-1 border-t border-amber-200/60 dark:border-amber-900/30 text-xs">
                <span className="font-bold text-slate-800 dark:text-slate-200">Final Payable Fee:</span>
                <span className="font-mono font-bold text-emerald-600 dark:text-emerald-400 text-sm">
                  ₹{finalPayableFeeRupees}
                </span>
              </div>
            </div>
          )}

          {/* Instant Fee Collection & Receipt Section */}
          {chosenPlan && (
            <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-3.5 space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="p-1.5 rounded-lg bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400">
                    <IndianRupee className="h-4 w-4" />
                  </div>
                  <div>
                    <h4 className="text-xs font-bold text-slate-900 dark:text-white">Collect Fee & Issue Receipt</h4>
                    <p className="text-[11px] text-slate-400">Record payment upfront or collect later</p>
                  </div>
                </div>
                <Switch
                  checked={collectPaymentOnRenewal}
                  onChange={(val) => setCollectPaymentOnRenewal(val)}
                  activeColor="emerald"
                />
              </div>

              {collectPaymentOnRenewal && (
                <div className="pt-2 border-t border-slate-100 dark:border-slate-800 space-y-3">
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    <div>
                      <div className="flex items-center justify-between mb-1">
                        <label className="block text-[11px] font-semibold text-slate-700 dark:text-slate-300">
                          Amount Paid (₹) *
                        </label>
                        <span className="text-[10px] text-slate-400">
                          Max: ₹{finalPayableFeeRupees}
                        </span>
                      </div>
                      <input
                        type="number"
                        min="0"
                        max={finalPayableFeeRupees}
                        value={renewalPaymentAmountRupees}
                        onChange={(e) => setRenewalPaymentAmountRupees(e.target.value)}
                        placeholder={finalPayableFeeRupees.toString()}
                        className="w-full rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 px-3 py-1.5 text-xs text-slate-900 dark:text-white font-mono"
                      />
                    </div>

                    <div>
                      <label className="block text-[11px] font-semibold text-slate-700 dark:text-slate-300 mb-1">
                        Payment / Collection Date
                      </label>
                      <input
                        type="date"
                        value={renewalPaymentDate}
                        onChange={(e) => setRenewalPaymentDate(e.target.value)}
                        className="w-full rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 px-3 py-1.5 text-xs text-slate-900 dark:text-white font-mono"
                      />
                    </div>

                    <div>
                      <CustomSelect
                        label="Payment Mode"
                        value={renewalPaymentMethod}
                        onChange={(val) => setRenewalPaymentMethod(val as any)}
                        options={[
                          { value: 'cash', label: 'Cash In Hand' },
                          { value: 'upi', label: 'UPI / QR Code' },
                          { value: 'card', label: 'Debit / Credit Card' },
                          { value: 'bank_transfer', label: 'Bank Transfer (NEFT/IMPS)' },
                        ]}
                      />
                    </div>
                  </div>

                  {renewalPaymentMethod !== 'cash' && (
                    <div>
                      <label className="block text-[11px] font-semibold text-slate-700 dark:text-slate-300 mb-1">
                        Transaction Ref / UTR / Note (Optional)
                      </label>
                      <input
                        type="text"
                        value={renewalPaymentRef}
                        onChange={(e) => setRenewalPaymentRef(e.target.value)}
                        placeholder="e.g. UPI Ref #412389102847"
                        className="w-full rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 px-3 py-1.5 text-xs text-slate-900 dark:text-white font-mono"
                      />
                    </div>
                  )}
                </div>
              )}
            </div>
          )}

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
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300">Amount (₹) *</label>
                <span className="text-[11px] font-medium text-slate-500 dark:text-slate-400">
                  Due: <strong className="text-amber-600 dark:text-amber-400">₹{(duesRemainingPaise / 100).toFixed(0)}</strong>
                </span>
              </div>
              <input
                type="number"
                step="1"
                min="1"
                max={Math.max(1, Math.round(duesRemainingPaise / 100))}
                value={paymentAmountRupees}
                onChange={(e) => setPaymentAmountRupees(e.target.value)}
                className="w-full rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 px-3.5 py-2 text-sm text-slate-900 dark:text-white font-mono"
                required
              />
              {parseFloat(paymentAmountRupees || '0') > duesRemainingPaise / 100 && (
                <p className="mt-1 text-xs text-rose-500 font-medium">
                  Amount cannot exceed remaining due of ₹{(duesRemainingPaise / 100).toFixed(0)}
                </p>
              )}
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Payment Date *
              </label>
              <input
                type="date"
                value={paymentDate}
                onChange={(e) => setPaymentDate(e.target.value)}
                className="w-full rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 px-3.5 py-2 text-sm text-slate-900 dark:text-white font-mono"
                required
              />
            </div>
          </div>

          <div>
            <CustomSelect
              label="Payment Mode *"
              value={paymentMethod}
              onChange={(val) => setPaymentMethod(val as any)}
              options={[
                { value: 'upi', label: 'UPI (GPay / PhonePe / Paytm)', description: 'Fast QR & online transfer' },
                { value: 'cash', label: 'Cash in Hand', description: 'Direct physical cash' },
                { value: 'card', label: 'Debit / Credit Card', description: 'POS card swipe' },
                { value: 'bank_transfer', label: 'Bank Transfer / NEFT', description: 'IMPS/RTGS bank deposit' },
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
              disabled={recordPayment.isPending || parseFloat(paymentAmountRupees || '0') > duesRemainingPaise / 100 || parseFloat(paymentAmountRupees || '0') <= 0}
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
        subtitle={`Send instant renewal alert to ${student.name}`}
        icon={<Bell className="h-5 w-5 text-indigo-500" />}
        maxWidth="md"
      >
        <div className="space-y-4">
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300">
                Message Preview (Editable before sending)
              </label>
              <button
                type="button"
                onClick={() => {
                  const text = renderWhatsAppReminder(user?.whatsappReminderTemplate, {
                    studentName: student.name,
                    seatNumber: (activeMembership?.seatId as any)?.seatNumber || activeMembership?.seatNumber || 'Seat',
                    libraryName: user?.tenantName || 'StudySpace Library',
                    phone: user?.phone || '',
                  });
                  setReminderMessageText(text);
                }}
                className="text-[11px] font-semibold text-indigo-500 hover:text-indigo-400"
              >
                ↻ Reset to Template
              </button>
            </div>
            <textarea
              rows={8}
              value={reminderMessageText}
              onChange={(e) => setReminderMessageText(e.target.value)}
              className="w-full rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 p-3 text-xs font-mono leading-relaxed text-slate-900 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-emerald-500"
            />
          </div>

          <div className="flex justify-end gap-3 pt-3 border-t border-slate-200 dark:border-slate-800">
            <button
              type="button"
              onClick={() => {
                navigator.clipboard.writeText(reminderMessageText);
                alert('Template copied to clipboard!');
              }}
              className="rounded-xl border border-slate-300 dark:border-slate-700 px-4 py-2 text-xs font-semibold text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800"
            >
              📋 Copy Text
            </button>
            <button
              type="button"
              onClick={() => {
                openWhatsAppChat(student.mobile, reminderMessageText);
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

      {/* Delete / Reverse Payment Confirmation Modal */}
      <ConfirmModal
        isOpen={!!paymentToDelete}
        onClose={() => setPaymentToDelete(null)}
        onConfirm={() => {
          if (paymentToDelete) {
            deletePayment.mutate(paymentToDelete._id, {
              onSuccess: () => setPaymentToDelete(null),
            });
          }
        }}
        title="Reverse Payment Entry"
        description={`Are you sure you want to delete receipt ${paymentToDelete?.receiptNumber} of ₹${paymentToDelete ? (paymentToDelete.amountPaise / 100).toFixed(0) : ''}? This will immediately deduct this amount from the student's paid total and restore any remaining dues.`}
        confirmLabel="Delete / Reverse"
        variant="danger"
        isLoading={deletePayment.isPending}
      />
    </div>
  );
}
