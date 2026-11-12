import { useState, useEffect, useMemo } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useStudents, useCreateStudent, useUpdateStudent, useDeleteStudent, useFilteredMemberships } from '../hooks/useStudents';
import { usePlans, useSeats, useShifts } from '../hooks/useLibrary';
import { useAuth } from '../hooks/useAuth';
import type { StudentDTO } from '@atlas/shared';
import { Modal, ConfirmModal, CustomSelect, Pagination, Switch } from '../components/ui';
import { Bell, UserCheck, UserPlus, Search, Edit2, Trash2, MessageSquare, Armchair, IndianRupee, ChevronDown, ChevronUp, User, ArrowUpDown, ArrowUp, ArrowDown } from 'lucide-react';
import { formatDate } from '../utils/date';
import { renderWhatsAppReminder, openWhatsAppChat } from '../utils/whatsapp';
import {
  DateRangeDurationSelector,
  calculateEndDateFromDays,
  getTodayDateString,
  type DurationOption,
} from '../components/DateRangeDurationSelector';

type TabType = 'all' | 'dues' | 'expiring_3' | 'expiring_7' | 'expired' | 'left';

export function StudentsPage() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [searchParams, setSearchParams] = useSearchParams();
  const urlTab = searchParams.get('tab') as TabType | null;

  const [activeTab, setActiveTab] = useState<TabType>(
    urlTab && ['all', 'dues', 'expiring_3', 'expiring_7', 'expired', 'left'].includes(urlTab) ? urlTab : 'all',
  );
  const [search, setSearch] = useState('');
  const [showRegisterModal, setShowRegisterModal] = useState(false);

  // Synchronize URL query parameter with active tab
  useEffect(() => {
    if (urlTab && ['all', 'dues', 'expiring_3', 'expiring_7', 'expired', 'left'].includes(urlTab)) {
      setActiveTab(urlTab);
    }
  }, [urlTab]);

  const handleSelectTab = (tab: TabType) => {
    setActiveTab(tab);
    if (tab === 'all') {
      setSearchParams({});
    } else {
      setSearchParams({ tab });
    }
  };

  // Form states for Create
  const [name, setName] = useState('');
  const [mobile, setMobile] = useState('');
  const [email, setEmail] = useState('');
  const [address, setAddress] = useState('');
  const [membershipNumber, setMembershipNumber] = useState('');
  const [photoUrl, setPhotoUrl] = useState('');

  // Instant Membership & Desk Assignment on Registration
  const [assignDeskOnRegister, setAssignDeskOnRegister] = useState(true);
  const [showOptionalStudentDetails, setShowOptionalStudentDetails] = useState(false);
  const [regPlanId, setRegPlanId] = useState('');
  const [regShiftId, setRegShiftId] = useState('');
  const [regSeatId, setRegSeatId] = useState('');
  const [regDurationOption, setRegDurationOption] = useState<DurationOption>('30d');
  const [regStartDate, setRegStartDate] = useState(() => getTodayDateString());
  const [regEndDate, setRegEndDate] = useState(() => calculateEndDateFromDays(getTodayDateString(), 30));

  // Instant Fee Collection on Registration
  const [collectPaymentOnRegister, setCollectPaymentOnRegister] = useState(true);
  const [regPaymentAmountRupees, setRegPaymentAmountRupees] = useState('');
  const [regDiscountRupees, setRegDiscountRupees] = useState('0');
  const [regDiscountReason, setRegDiscountReason] = useState('');
  const [regPaymentMethod, setRegPaymentMethod] = useState<'cash' | 'upi' | 'card' | 'bank_transfer'>('cash');
  const [regPaymentRef, setRegPaymentRef] = useState('');

  // Edit Student state
  const [editingStudent, setEditingStudent] = useState<StudentDTO | null>(null);
  const [editName, setEditName] = useState('');
  const [editMobile, setEditMobile] = useState('');
  const [editEmail, setEditEmail] = useState('');
  const [editAddress, setEditAddress] = useState('');
  const [editMembershipNumber, setEditMembershipNumber] = useState('');
  const [editPhotoUrl, setEditPhotoUrl] = useState('');

  // Reminder Modal State
  const [reminderModalData, setReminderModalData] = useState<{
    studentName: string;
    seatNumber: string;
    mobile: string;
    messageText: string;
  } | null>(null);

  // Delete Confirm Modal State
  const [deleteConfirm, setDeleteConfirm] = useState<{ id: string; name: string } | null>(null);

  // Queries & Mutations
  const { data: students = [], isLoading: studentsLoading } = useStudents(search);
  const { data: filteredMemberships = [], isLoading: membershipsLoading } = useFilteredMemberships(activeTab);
  const { data: plans = [] } = usePlans();
  const { data: seats = [] } = useSeats();
  const { data: shifts = [] } = useShifts();

  // Pagination States
  const [studentsPage, setStudentsPage] = useState(1);
  const [studentsPageSize, setStudentsPageSize] = useState(10);
  const [filterPage, setFilterPage] = useState(1);
  const [filterPageSize, setFilterPageSize] = useState(10);

  // Sorting States
  type StudentSortField = 'name' | 'membershipNumber' | 'createdAt';
  const [studentSortField, setStudentSortField] = useState<StudentSortField>('createdAt');
  const [studentSortOrder, setStudentSortOrder] = useState<'asc' | 'desc'>('desc');

  type MembershipSortField = 'name' | 'seat' | 'endDate' | 'due' | 'status';
  const [memSortField, setMemSortField] = useState<MembershipSortField>('endDate');
  const [memSortOrder, setMemSortOrder] = useState<'asc' | 'desc'>('asc');

  const toggleStudentSort = (field: StudentSortField) => {
    if (studentSortField === field) {
      setStudentSortOrder((prev) => (prev === 'asc' ? 'desc' : 'asc'));
    } else {
      setStudentSortField(field);
      setStudentSortOrder('asc');
    }
  };

  const toggleMemSort = (field: MembershipSortField) => {
    if (memSortField === field) {
      setMemSortOrder((prev) => (prev === 'asc' ? 'desc' : 'asc'));
    } else {
      setMemSortField(field);
      setMemSortOrder(field === 'endDate' || field === 'due' ? 'desc' : 'asc');
    }
  };

  // Reset to page 1 on search or tab change
  useEffect(() => {
    setStudentsPage(1);
  }, [search]);

  useEffect(() => {
    setFilterPage(1);
  }, [activeTab]);

  // Sorted & Paginated Students
  const sortedStudents = useMemo(() => {
    const list = [...students];
    list.sort((a, b) => {
      let comparison = 0;
      if (studentSortField === 'name') {
        comparison = (a.name || '').localeCompare(b.name || '');
      } else if (studentSortField === 'membershipNumber') {
        comparison = (a.membershipNumber || '').localeCompare(b.membershipNumber || '');
      } else if (studentSortField === 'createdAt') {
        comparison = new Date(a.createdAt || 0).getTime() - new Date(b.createdAt || 0).getTime();
      }
      return studentSortOrder === 'asc' ? comparison : -comparison;
    });
    return list;
  }, [students, studentSortField, studentSortOrder]);

  const paginatedStudents = useMemo(() => {
    const start = (studentsPage - 1) * studentsPageSize;
    return sortedStudents.slice(start, start + studentsPageSize);
  }, [sortedStudents, studentsPage, studentsPageSize]);

  // Sorted & Paginated Filtered Memberships
  const sortedFilteredMemberships = useMemo(() => {
    const list = [...filteredMemberships];
    list.sort((a: any, b: any) => {
      let comparison = 0;
      if (memSortField === 'name') {
        const nameA = a.studentId?.name || '';
        const nameB = b.studentId?.name || '';
        comparison = nameA.localeCompare(nameB);
      } else if (memSortField === 'seat') {
        const seatA = Number(a.seatId?.seatNumber) || 999999;
        const seatB = Number(b.seatId?.seatNumber) || 999999;
        comparison = seatA - seatB;
      } else if (memSortField === 'endDate') {
        comparison = new Date(a.endDate || 0).getTime() - new Date(b.endDate || 0).getTime();
      } else if (memSortField === 'due') {
        const dueA = Math.max(0, (a.feePaise || 0) - (a.paidPaise || 0));
        const dueB = Math.max(0, (b.feePaise || 0) - (b.paidPaise || 0));
        comparison = dueA - dueB;
      } else if (memSortField === 'status') {
        comparison = (a.status || '').localeCompare(b.status || '');
      }
      return memSortOrder === 'asc' ? comparison : -comparison;
    });
    return list;
  }, [filteredMemberships, memSortField, memSortOrder]);

  const paginatedFilteredMemberships = useMemo(() => {
    const start = (filterPage - 1) * filterPageSize;
    return sortedFilteredMemberships.slice(start, start + filterPageSize);
  }, [sortedFilteredMemberships, filterPage, filterPageSize]);

  const chosenPlan = plans.find((p) => p._id === regPlanId);

  // Auto-fill payment amount when plan is selected or discount changes
  useEffect(() => {
    if (chosenPlan) {
      const discount = Math.max(0, parseFloat(regDiscountRupees || '0'));
      const netPayable = Math.max(0, Math.round(chosenPlan.feePaise / 100 - discount));
      setRegPaymentAmountRupees(netPayable.toString());
    }
  }, [chosenPlan, regDiscountRupees]);

  // Shift-aware available desks
  const availableSeats = useMemo(() => {
    return seats.filter((s) => {
      if (s.status === 'maintenance' || s.status === 'blocked') return false;
      if (regShiftId) {
        if (!s.shiftOccupants || s.shiftOccupants.length === 0) return true;
        const occupied = s.shiftOccupants.some(
          (so) => so.shiftId === regShiftId || so.shiftId === 'all',
        );
        return !occupied;
      }
      return s.status === 'available';
    });
  }, [seats, regShiftId]);

  const createStudent = useCreateStudent();
  const updateStudent = useUpdateStudent();
  const deleteStudent = useDeleteStudent();

  const handleCreateStudent = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !mobile.trim()) return;

    createStudent.mutate(
      {
        name,
        mobile,
        email: email || undefined,
        address: address || undefined,
        membershipNumber: membershipNumber || undefined,
        photoUrl: photoUrl || undefined,
        planId: assignDeskOnRegister && regPlanId ? regPlanId : undefined,
        shiftId: assignDeskOnRegister && regShiftId ? regShiftId : undefined,
        seatId: assignDeskOnRegister && chosenPlan?.seatType === 'reserved' && regSeatId ? regSeatId : undefined,
        startDate: assignDeskOnRegister && regPlanId ? regStartDate : undefined,
        endDate: assignDeskOnRegister && regPlanId ? regEndDate : undefined,
        discountPaise:
          assignDeskOnRegister && parseFloat(regDiscountRupees || '0') > 0
            ? Math.round(parseFloat(regDiscountRupees) * 100)
            : undefined,
        discountReason:
          assignDeskOnRegister && parseFloat(regDiscountRupees || '0') > 0
            ? regDiscountReason.trim() || 'Discount'
            : undefined,
        // Optional instant payment
        initialPaymentAmountPaise:
          assignDeskOnRegister && collectPaymentOnRegister && regPaymentAmountRupees
            ? Math.round(parseFloat(regPaymentAmountRupees) * 100)
            : undefined,
        paymentMethod: assignDeskOnRegister && collectPaymentOnRegister ? regPaymentMethod : undefined,
        transactionRef: assignDeskOnRegister && collectPaymentOnRegister && regPaymentRef ? regPaymentRef : undefined,
      },
      {
        onSuccess: () => {
          setShowRegisterModal(false);
          setName('');
          setMobile('');
          setEmail('');
          setAddress('');
          setMembershipNumber('');
          setPhotoUrl('');
          setRegPlanId('');
          setRegShiftId('');
          setRegSeatId('');
          setRegDiscountRupees('0');
          setRegDiscountReason('');
          setRegPaymentAmountRupees('');
          setRegPaymentRef('');
          setRegDurationOption('30d');
          const today = getTodayDateString();
          setRegStartDate(today);
          setRegEndDate(calculateEndDateFromDays(today, 30));
        },
      },
    );
  };

  const handleStartEdit = (s: StudentDTO) => {
    setEditingStudent(s);
    setEditName(s.name);
    setEditMobile(s.mobile);
    setEditEmail(s.email || '');
    setEditAddress(s.address || '');
    setEditMembershipNumber(s.membershipNumber);
    setEditPhotoUrl(s.photoUrl || '');
  };

  const handleSaveEdit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingStudent || !editName.trim() || !editMobile.trim()) return;

    updateStudent.mutate(
      {
        id: editingStudent._id,
        name: editName,
        mobile: editMobile,
        email: editEmail,
        address: editAddress,
        membershipNumber: editMembershipNumber,
        photoUrl: editPhotoUrl || undefined,
      },
      {
        onSuccess: () => {
          setEditingStudent(null);
        },
      },
    );
  };

  const handleDelete = (id: string, sName: string) => {
    setDeleteConfirm({ id, name: sName });
  };

  const getReminderText = (sName: string, sSeat: string) => {
    return renderWhatsAppReminder(user?.whatsappReminderTemplate, {
      studentName: sName,
      seatNumber: sSeat,
      libraryName: user?.tenantName || 'StudySpace Library',
      phone: user?.phone || '',
    });
  };

  const handleOpenReminderModal = (sName: string, sSeat: string, sMobile: string) => {
    const text = getReminderText(sName, sSeat);
    setReminderModalData({
      studentName: sName,
      seatNumber: sSeat,
      mobile: sMobile,
      messageText: text,
    });
  };

  const tabs: { id: TabType; label: string; icon: string }[] = [
    { id: 'all', label: 'All Members', icon: '👥' },
    { id: 'dues', label: 'Fees Due', icon: '💰' },
    { id: 'expiring_3', label: 'Expiring in 3 Days', icon: '⚠️' },
    { id: 'expiring_7', label: 'Expiring in 7 Days', icon: '📅' },
    { id: 'expired', label: 'Expired Membership', icon: '⏳' },
    { id: 'left', label: 'Left Membership', icon: '🚪' },
  ];

  return (
    <div className="space-y-6 max-w-7xl pb-12">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white">Students & Members</h1>
          <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
            Directory of registered students, seat allocations, fees dues, and expiry management.
          </p>
        </div>
        <button
          onClick={() => setShowRegisterModal(true)}
          className="flex items-center gap-2 rounded-xl bg-indigo-600 px-4 py-2.5 text-xs font-semibold !text-white shadow hover:bg-indigo-500 transition"
        >
          <UserPlus className="h-4 w-4" />
          Register New Student
        </button>
      </div>

      {/* Tabs navigation */}
      <div className="flex flex-wrap gap-2 border-b border-slate-200 dark:border-slate-800 pb-3">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => handleSelectTab(tab.id)}
            className={`flex items-center gap-2 rounded-xl px-3.5 py-2 text-xs font-semibold transition ${
              activeTab === tab.id
                ? 'bg-indigo-600 !text-white shadow-sm'
                : 'bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800'
            }`}
          >
            <span>{tab.icon}</span>
            <span>{tab.label}</span>
          </button>
        ))}
      </div>

      {/* Search Bar for All Members */}
      {activeTab === 'all' && (
        <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-4 shadow-sm">
          <div className="relative">
            <Search className="absolute left-3.5 top-3 h-4 w-4 text-slate-400" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search by student name, mobile number, or membership ID…"
              className="w-full rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/60 pl-10 pr-4 py-2.5 text-sm text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
            />
          </div>
        </div>
      )}

      {/* Tab 1: All Members Directory */}
      {activeTab === 'all' ? (
        <div className="overflow-hidden rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-sm">
          {/* Mobile Card List (< md) */}
          <div className="md:hidden divide-y divide-slate-100 dark:divide-slate-800/60">
            {studentsLoading ? (
              <div className="py-12 text-center text-slate-400 text-sm">
                <div className="h-6 w-6 animate-spin rounded-full border-2 border-indigo-600 border-t-transparent mx-auto mb-2" />
                Loading students directory…
              </div>
            ) : paginatedStudents.length === 0 ? (
              <div className="py-12 text-center text-slate-400 text-sm px-4">
                No students found. Register your first student above.
              </div>
            ) : (
              paginatedStudents.map((s) => (
                <div
                  key={s._id}
                  onClick={() => navigate(`/students/${s._id}`)}
                  className="p-4 hover:bg-slate-50/80 dark:hover:bg-slate-800/50 transition cursor-pointer flex items-center justify-between gap-3"
                >
                  <div className="flex items-center gap-3 min-w-0">
                    {s.photoUrl ? (
                      <img
                        src={s.photoUrl}
                        alt={s.name}
                        className="h-11 w-11 rounded-full object-cover border border-slate-200 dark:border-slate-700 shrink-0"
                      />
                    ) : (
                      <div className="h-11 w-11 rounded-full bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 flex items-center justify-center text-sm font-bold border border-indigo-200 dark:border-indigo-800 shrink-0">
                        {s.name.charAt(0).toUpperCase()}
                      </div>
                    )}
                    <div className="min-w-0">
                      <p className="font-bold text-slate-900 dark:text-white truncate">{s.name}</p>
                      <p className="text-xs text-slate-500 dark:text-slate-400 font-mono">{s.mobile || 'No mobile'}</p>
                      <div className="flex items-center gap-2 mt-0.5">
                        <span className="text-[10px] font-mono px-1.5 py-0.2 rounded bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 border border-indigo-200 dark:border-indigo-800">
                          {s.membershipNumber || 'ID N/A'}
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-1.5 shrink-0" onClick={(e) => e.stopPropagation()}>
                    <button
                      type="button"
                      onClick={() => handleStartEdit(s)}
                      title="Edit Student"
                      className="p-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:text-indigo-600 dark:hover:text-indigo-400 shadow-xs"
                    >
                      <Edit2 className="h-4 w-4" />
                    </button>
                    <button
                      type="button"
                      onClick={() => handleDelete(s._id, s.name)}
                      title="Delete Student"
                      className="p-2 rounded-xl border border-rose-200 dark:border-rose-900/50 bg-rose-50 dark:bg-rose-950/20 text-rose-600 dark:text-rose-400 shadow-xs"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>

          {/* Desktop Table (>= md) */}
          <div className="hidden md:block overflow-x-auto">
            <table className="w-full text-left text-sm text-slate-700 dark:text-slate-300">
              <thead className="bg-slate-50 dark:bg-slate-800/60 text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400 border-b border-slate-200 dark:border-slate-800 select-none">
                <tr>
                  <th
                    onClick={() => toggleStudentSort('name')}
                    className="px-6 py-3.5 cursor-pointer hover:bg-slate-100 dark:hover:bg-slate-800/80 transition-colors"
                  >
                    <div className="flex items-center gap-1.5">
                      <span>Student</span>
                      {studentSortField === 'name' ? (
                        studentSortOrder === 'asc' ? <ArrowUp className="h-3.5 w-3.5 text-indigo-500" /> : <ArrowDown className="h-3.5 w-3.5 text-indigo-500" />
                      ) : (
                        <ArrowUpDown className="h-3 w-3 text-slate-400 opacity-60" />
                      )}
                    </div>
                  </th>
                  <th
                    onClick={() => toggleStudentSort('membershipNumber')}
                    className="px-6 py-3.5 cursor-pointer hover:bg-slate-100 dark:hover:bg-slate-800/80 transition-colors"
                  >
                    <div className="flex items-center gap-1.5">
                      <span>Membership ID</span>
                      {studentSortField === 'membershipNumber' ? (
                        studentSortOrder === 'asc' ? <ArrowUp className="h-3.5 w-3.5 text-indigo-500" /> : <ArrowDown className="h-3.5 w-3.5 text-indigo-500" />
                      ) : (
                        <ArrowUpDown className="h-3 w-3 text-slate-400 opacity-60" />
                      )}
                    </div>
                  </th>
                  <th className="px-6 py-3.5">Mobile</th>
                  <th
                    onClick={() => toggleStudentSort('createdAt')}
                    className="px-6 py-3.5 cursor-pointer hover:bg-slate-100 dark:hover:bg-slate-800/80 transition-colors"
                  >
                    <div className="flex items-center gap-1.5">
                      <span>Registered Date</span>
                      {studentSortField === 'createdAt' ? (
                        studentSortOrder === 'asc' ? <ArrowUp className="h-3.5 w-3.5 text-indigo-500" /> : <ArrowDown className="h-3.5 w-3.5 text-indigo-500" />
                      ) : (
                        <ArrowUpDown className="h-3 w-3 text-slate-400 opacity-60" />
                      )}
                    </div>
                  </th>
                  <th className="px-6 py-3.5 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60">
                {studentsLoading ? (
                  <tr>
                    <td colSpan={5} className="py-12 text-center text-slate-400 text-sm">
                      <div className="h-6 w-6 animate-spin rounded-full border-2 border-indigo-600 border-t-transparent mx-auto mb-2" />
                      Loading students directory…
                    </td>
                  </tr>
                ) : paginatedStudents.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="py-12 text-center text-slate-400 text-sm">
                      No students found. Register your first student above.
                    </td>
                  </tr>
                ) : (
                  paginatedStudents.map((s) => (
                    <tr
                      key={s._id}
                      onClick={() => navigate(`/students/${s._id}`)}
                      className="hover:bg-slate-50/80 dark:hover:bg-slate-800/50 transition cursor-pointer group"
                    >
                      <td className="px-6 py-4 flex items-center gap-3">
                        {s.photoUrl ? (
                          <img
                            src={s.photoUrl}
                            alt={s.name}
                            className="h-10 w-10 rounded-full object-cover border border-slate-200 dark:border-slate-700"
                          />
                        ) : (
                          <div className="h-10 w-10 rounded-full bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 flex items-center justify-center text-sm font-bold border border-indigo-200 dark:border-indigo-800">
                            {s.name.charAt(0).toUpperCase()}
                          </div>
                        )}
                        <div>
                          <p className="font-semibold text-slate-900 dark:text-white group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors">
                            {s.name}
                          </p>
                          {s.email && <p className="text-xs text-slate-400">{s.email}</p>}
                        </div>
                      </td>
                      <td className="px-6 py-4 font-mono font-medium text-indigo-600 dark:text-indigo-400">
                        {s.membershipNumber}
                      </td>
                      <td className="px-6 py-4 text-slate-600 dark:text-slate-300 font-mono text-xs">{s.mobile}</td>
                      <td className="px-6 py-4 text-xs text-slate-500 dark:text-slate-400">
                        {formatDate(s.createdAt)}
                      </td>
                      <td className="px-6 py-4 text-right space-x-1.5" onClick={(e) => e.stopPropagation()}>
                        <button
                          type="button"
                          onClick={() => handleStartEdit(s)}
                          title="Edit Student"
                          className="inline-flex items-center justify-center h-8 w-8 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:text-indigo-600 dark:hover:text-indigo-400 hover:bg-slate-50 dark:hover:bg-slate-700 transition shadow-sm"
                        >
                          <Edit2 className="h-3.5 w-3.5" />
                        </button>
                        <button
                          type="button"
                          onClick={() => handleDelete(s._id, s.name)}
                          title="Delete Student"
                          className="inline-flex items-center justify-center h-8 w-8 rounded-lg border border-rose-200 dark:border-rose-900/50 bg-rose-50 dark:bg-rose-950/20 text-rose-600 dark:text-rose-400 hover:bg-rose-100 dark:hover:bg-rose-900/40 transition shadow-sm"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          {/* Students Directory Pagination */}
          <Pagination
            currentPage={studentsPage}
            totalItems={students.length}
            pageSize={studentsPageSize}
            onPageChange={setStudentsPage}
            onPageSizeChange={(newSize) => {
              setStudentsPageSize(newSize);
              setStudentsPage(1);
            }}
          />
        </div>
      ) : (
        /* Tabs 2-6: Filtered Memberships (Dues, Expiring 1-3, Expiring 1-7, Expired, Left) */
        <div className="overflow-hidden rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-sm">
          <div className="p-3.5 sm:p-4 bg-slate-50 dark:bg-slate-800/40 border-b border-slate-200 dark:border-slate-800 flex justify-between items-center">
            <h3 className="text-xs sm:text-sm font-bold text-slate-900 dark:text-white">
              {tabs.find((t) => t.id === activeTab)?.label} ({filteredMemberships.length})
            </h3>
            <span className="text-[11px] sm:text-xs text-slate-500 dark:text-slate-400 hidden sm:inline">
              Showing filtered records
            </span>
          </div>

          {/* Mobile Filtered Cards (< md) */}
          <div className="md:hidden divide-y divide-slate-100 dark:divide-slate-800/60">
            {membershipsLoading ? (
              <div className="py-12 text-center text-slate-400 text-sm">
                <div className="h-6 w-6 animate-spin rounded-full border-2 border-indigo-600 border-t-transparent mx-auto mb-2" />
                Loading records…
              </div>
            ) : paginatedFilteredMemberships.length === 0 ? (
              <div className="py-12 text-center text-slate-400 text-sm px-4">
                No records found in this section.
              </div>
            ) : (
              paginatedFilteredMemberships.map((m: any) => {
                const s = m.studentId || {};
                const duePaise = Math.max(0, (m.feePaise || 0) - (m.paidPaise || 0));
                const isExpired = new Date(m.endDate) < new Date();
                const seatNo = m.seatId?.seatNumber || 'Non-Reserved';

                return (
                  <div
                    key={m._id}
                    onClick={() => s._id && navigate(`/students/${s._id}`)}
                    className="p-4 hover:bg-slate-50/80 dark:hover:bg-slate-800/50 transition cursor-pointer flex flex-col gap-2.5"
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3 min-w-0">
                        {s.photoUrl ? (
                          <img
                            src={s.photoUrl}
                            alt={s.name}
                            className="h-10 w-10 rounded-full object-cover border border-slate-200 dark:border-slate-700 shrink-0"
                          />
                        ) : (
                          <div className="h-10 w-10 rounded-full bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 flex items-center justify-center text-xs font-bold border border-indigo-200 dark:border-indigo-800 shrink-0">
                            {(s.name || '?').charAt(0).toUpperCase()}
                          </div>
                        )}
                        <div className="min-w-0">
                          <p className="font-bold text-slate-900 dark:text-white truncate">{s.name || 'Unknown Student'}</p>
                          <p className="text-xs text-slate-500 dark:text-slate-400 font-mono">{s.mobile || '—'}</p>
                        </div>
                      </div>

                      <span className="rounded-lg px-2.5 py-1 text-xs font-bold bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 border border-indigo-200 dark:border-indigo-800">
                        Seat {seatNo}
                      </span>
                    </div>

                    <div className="flex items-center justify-between text-xs pt-1 border-t border-slate-100 dark:border-slate-800/60">
                      <div>
                        <span className="text-slate-400 block text-[10px]">Expiry</span>
                        <span className={`font-mono ${isExpired ? 'text-rose-600 dark:text-rose-400 font-bold' : 'text-slate-700 dark:text-slate-300'}`}>
                          {formatDate(m.endDate)}
                        </span>
                      </div>

                      {activeTab === 'dues' ? (
                        <div className="text-right">
                          <span className="text-slate-400 block text-[10px]">Due Amount</span>
                          <span className="font-mono font-bold text-rose-600 dark:text-rose-400 text-sm">
                            ₹{(duePaise / 100).toFixed(0)}
                          </span>
                        </div>
                      ) : (
                        <div className="text-right">
                          <span className="text-slate-400 block text-[10px]">Status</span>
                          <span
                            className={`rounded-md px-2 py-0.5 text-[10px] font-semibold capitalize ${
                              m.status === 'active'
                                ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400'
                                : m.status === 'left'
                                ? 'bg-purple-500/10 text-purple-600 dark:text-purple-400'
                                : 'bg-rose-500/10 text-rose-600 dark:text-rose-400'
                            }`}
                          >
                            {m.status}
                          </span>
                        </div>
                      )}

                      <div onClick={(e) => e.stopPropagation()}>
                        <button
                          type="button"
                          onClick={() => handleOpenReminderModal(s.name, seatNo, s.mobile)}
                          className="inline-flex items-center gap-1 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white px-2.5 py-1 text-xs font-semibold shadow-xs transition"
                        >
                          <MessageSquare className="h-3.5 w-3.5" /> Alert
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })
            )}
          </div>

          {/* Desktop Table (>= md) */}
          <div className="hidden md:block overflow-x-auto">
            <table className="w-full text-left text-sm text-slate-700 dark:text-slate-300">
              <thead className="bg-slate-50 dark:bg-slate-800/60 text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400 border-b border-slate-200 dark:border-slate-800 select-none">
                <tr>
                  <th
                    onClick={() => toggleMemSort('name')}
                    className="px-5 py-3.5 cursor-pointer hover:bg-slate-100 dark:hover:bg-slate-800/80 transition-colors"
                  >
                    <div className="flex items-center gap-1.5">
                      <span>Student / ID</span>
                      {memSortField === 'name' ? (
                        memSortOrder === 'asc' ? <ArrowUp className="h-3.5 w-3.5 text-indigo-500" /> : <ArrowDown className="h-3.5 w-3.5 text-indigo-500" />
                      ) : (
                        <ArrowUpDown className="h-3 w-3 text-slate-400 opacity-60" />
                      )}
                    </div>
                  </th>
                  <th className="px-5 py-3.5">Mobile</th>
                  <th
                    onClick={() => toggleMemSort('seat')}
                    className="px-5 py-3.5 cursor-pointer hover:bg-slate-100 dark:hover:bg-slate-800/80 transition-colors"
                  >
                    <div className="flex items-center gap-1.5">
                      <span>Seat / Plan</span>
                      {memSortField === 'seat' ? (
                        memSortOrder === 'asc' ? <ArrowUp className="h-3.5 w-3.5 text-indigo-500" /> : <ArrowDown className="h-3.5 w-3.5 text-indigo-500" />
                      ) : (
                        <ArrowUpDown className="h-3 w-3 text-slate-400 opacity-60" />
                      )}
                    </div>
                  </th>
                  <th
                    onClick={() => toggleMemSort('endDate')}
                    className="px-5 py-3.5 cursor-pointer hover:bg-slate-100 dark:hover:bg-slate-800/80 transition-colors"
                  >
                    <div className="flex items-center gap-1.5">
                      <span>Expiry Date</span>
                      {memSortField === 'endDate' ? (
                        memSortOrder === 'asc' ? <ArrowUp className="h-3.5 w-3.5 text-indigo-500" /> : <ArrowDown className="h-3.5 w-3.5 text-indigo-500" />
                      ) : (
                        <ArrowUpDown className="h-3 w-3 text-slate-400 opacity-60" />
                      )}
                    </div>
                  </th>
                  {activeTab === 'dues' ? (
                    <th
                      onClick={() => toggleMemSort('due')}
                      className="px-5 py-3.5 text-right cursor-pointer hover:bg-slate-100 dark:hover:bg-slate-800/80 transition-colors"
                    >
                      <div className="flex items-center justify-end gap-1.5">
                        <span>Due Amount</span>
                        {memSortField === 'due' ? (
                          memSortOrder === 'asc' ? <ArrowUp className="h-3.5 w-3.5 text-indigo-500" /> : <ArrowDown className="h-3.5 w-3.5 text-indigo-500" />
                        ) : (
                          <ArrowUpDown className="h-3 w-3 text-slate-400 opacity-60" />
                        )}
                      </div>
                    </th>
                  ) : (
                    <th
                      onClick={() => toggleMemSort('status')}
                      className="px-5 py-3.5 cursor-pointer hover:bg-slate-100 dark:hover:bg-slate-800/80 transition-colors"
                    >
                      <div className="flex items-center gap-1.5">
                        <span>Status</span>
                        {memSortField === 'status' ? (
                          memSortOrder === 'asc' ? <ArrowUp className="h-3.5 w-3.5 text-indigo-500" /> : <ArrowDown className="h-3.5 w-3.5 text-indigo-500" />
                        ) : (
                          <ArrowUpDown className="h-3 w-3 text-slate-400 opacity-60" />
                        )}
                      </div>
                    </th>
                  )}
                  <th className="px-5 py-3.5 text-right">Quick Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60">
                {membershipsLoading ? (
                  <tr>
                    <td colSpan={6} className="py-12 text-center text-slate-400 text-sm">
                      <div className="h-6 w-6 animate-spin rounded-full border-2 border-indigo-600 border-t-transparent mx-auto mb-2" />
                      Loading records…
                    </td>
                  </tr>
                ) : paginatedFilteredMemberships.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="py-12 text-center text-slate-400 text-sm">
                      No records found in this section.
                    </td>
                  </tr>
                ) : (
                  paginatedFilteredMemberships.map((m: any) => {
                    const s = m.studentId || {};
                    const duePaise = Math.max(0, (m.feePaise || 0) - (m.paidPaise || 0));
                    const isExpired = new Date(m.endDate) < new Date();
                    const seatNo = m.seatId?.seatNumber || 'Non-Reserved';

                    return (
                      <tr
                        key={m._id}
                        onClick={() => s._id && navigate(`/students/${s._id}`)}
                        className="hover:bg-slate-50/80 dark:hover:bg-slate-800/50 transition cursor-pointer group"
                      >
                        <td className="px-5 py-3.5">
                          <div className="flex items-center gap-3">
                            {s.photoUrl ? (
                              <img
                                src={s.photoUrl}
                                alt={s.name}
                                className="h-8 w-8 rounded-full object-cover border border-slate-200 dark:border-slate-700"
                              />
                            ) : (
                              <div className="h-8 w-8 rounded-full bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 flex items-center justify-center text-xs font-bold border border-indigo-200 dark:border-indigo-800">
                                {(s.name || '?').charAt(0).toUpperCase()}
                              </div>
                            )}
                            <div>
                              <p className="font-semibold text-slate-900 dark:text-white group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors">
                                {s.name || 'Unknown Student'}
                              </p>
                              <p className="text-[11px] font-mono text-slate-400">{s.membershipNumber}</p>
                            </div>
                          </div>
                        </td>
                        <td className="px-5 py-3.5 text-slate-600 dark:text-slate-300 font-mono text-xs">{s.mobile || '—'}</td>
                        <td className="px-5 py-3.5">
                          <span className="font-semibold text-slate-900 dark:text-white">Seat {seatNo}</span>
                          <p className="text-xs text-slate-400">{m.planId?.name}</p>
                        </td>
                        <td className="px-5 py-3.5 font-mono text-xs">
                          <span className={isExpired ? 'text-rose-600 dark:text-rose-400 font-semibold' : 'text-slate-600 dark:text-slate-300'}>
                            {formatDate(m.endDate)}
                          </span>
                        </td>

                        {activeTab === 'dues' ? (
                          <td className="px-5 py-3.5 text-right font-mono font-bold text-rose-600 dark:text-rose-400">
                            ₹{(duePaise / 100).toFixed(0)}
                          </td>
                        ) : (
                          <td className="px-5 py-3.5 capitalize">
                            <span
                              className={`rounded-md px-2 py-0.5 text-[10px] font-semibold ${
                                m.status === 'active'
                                  ? 'bg-emerald-500/10 text-emerald-600 dark:bg-emerald-500/20 dark:text-emerald-400 border border-emerald-500/30'
                                  : m.status === 'left'
                                  ? 'bg-purple-500/10 text-purple-600 dark:bg-purple-500/20 dark:text-purple-400 border border-purple-500/30'
                                  : 'bg-rose-500/10 text-rose-600 dark:bg-rose-500/20 dark:text-rose-400 border border-rose-500/30'
                              }`}
                            >
                              {m.status}
                            </span>
                          </td>
                        )}

                        <td className="px-5 py-3.5 text-right" onClick={(e) => e.stopPropagation()}>
                          <button
                            type="button"
                            onClick={() => handleOpenReminderModal(s.name, seatNo, s.mobile)}
                            className="inline-flex items-center gap-1.5 rounded-lg bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800 hover:bg-emerald-600 hover:!text-white px-2.5 py-1 text-xs font-semibold transition shadow-sm"
                            title="Send Renewal Reminder"
                          >
                            <MessageSquare className="h-3.5 w-3.5" /> Reminder
                          </button>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>

          {/* Filtered Memberships Pagination */}
          <Pagination
            currentPage={filterPage}
            totalItems={filteredMemberships.length}
            pageSize={filterPageSize}
            onPageChange={setFilterPage}
            onPageSizeChange={(newSize) => {
              setFilterPageSize(newSize);
              setFilterPage(1);
            }}
          />
        </div>
      )}

      {/* ── WhatsApp Reminder Modal ── */}
      <Modal
        isOpen={!!reminderModalData}
        onClose={() => setReminderModalData(null)}
        title="Send WhatsApp Renewal Reminder"
        subtitle={`Send instant renewal alert to ${reminderModalData?.studentName || 'student'}`}
        icon={<Bell className="h-5 w-5 text-indigo-500" />}
        maxWidth="md"
      >
        {reminderModalData && (
          <div className="space-y-4">
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300">
                  Message Preview (Editable before sending)
                </label>
                <button
                  type="button"
                  onClick={() =>
                    setReminderModalData((prev) =>
                      prev
                        ? {
                            ...prev,
                            messageText: getReminderText(prev.studentName, prev.seatNumber),
                          }
                        : null,
                    )
                  }
                  className="text-[11px] font-semibold text-indigo-500 hover:text-indigo-400"
                >
                  ↻ Reset to Template
                </button>
              </div>
              <textarea
                rows={8}
                value={reminderModalData.messageText}
                onChange={(e) =>
                  setReminderModalData((prev) => (prev ? { ...prev, messageText: e.target.value } : null))
                }
                className="w-full rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 p-3 text-xs font-mono leading-relaxed text-slate-900 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-emerald-500"
              />
            </div>

            <div className="flex justify-end gap-3 pt-3 border-t border-slate-200 dark:border-slate-800">
              <button
                type="button"
                onClick={() => setReminderModalData(null)}
                className="rounded-xl px-4 py-2 text-xs font-semibold text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 transition"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={() => {
                  openWhatsAppChat(reminderModalData.mobile, reminderModalData.messageText);
                  setReminderModalData(null);
                }}
                className="rounded-xl bg-emerald-600 px-4 py-2 text-xs font-semibold !text-white hover:bg-emerald-500 flex items-center gap-2 shadow-sm transition"
              >
                <span>💬</span> Open WhatsApp Chat
              </button>
            </div>
          </div>
        )}
      </Modal>

      {/* ── Edit Student Modal ── */}
      <Modal
        isOpen={!!editingStudent}
        onClose={() => setEditingStudent(null)}
        title="Edit Student Profile"
        subtitle={`Update details for ${editingStudent?.name}`}
        icon={<Edit2 className="h-5 w-5 text-indigo-500" />}
        maxWidth="md"
      >
        {editingStudent && (
          <form onSubmit={handleSaveEdit} className="space-y-4">
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
                onClick={() => setEditingStudent(null)}
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
        )}
      </Modal>

      {/* ── Register New Student Modal ── */}
      <Modal
        isOpen={showRegisterModal}
        onClose={() => setShowRegisterModal(false)}
        title="Register New Student"
        subtitle="Quick student intake, desk allocation & fee collection"
        icon={<UserCheck className="h-5 w-5 text-indigo-500" />}
        maxWidth="lg"
      >
        <form onSubmit={handleCreateStudent} className="space-y-4">
          {/* Card 1: Core Details */}
          <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/60 p-4 space-y-3">
            <div className="flex items-center gap-2 pb-2 border-b border-slate-100 dark:border-slate-800 text-xs font-bold text-slate-900 dark:text-white uppercase tracking-wider">
              <User className="h-3.5 w-3.5 text-indigo-500" />
              <span>Basic Information</span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Full Name <span className="text-rose-500">*</span>
                </label>
                <div className="relative">
                  <input
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="e.g. Rahul Sharma"
                    className="w-full rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-900 px-3.5 py-2 text-sm text-slate-900 dark:text-white focus:bg-white dark:focus:bg-slate-950 focus:ring-2 focus:ring-indigo-500 outline-none transition"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Mobile Number <span className="text-rose-500">*</span>
                </label>
                <div className="relative">
                  <input
                    type="tel"
                    maxLength={10}
                    value={mobile}
                    onChange={(e) => setMobile(e.target.value.replace(/\D/g, ''))}
                    placeholder="10-digit mobile number"
                    className="w-full rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-900 px-3.5 py-2 text-sm text-slate-900 dark:text-white focus:bg-white dark:focus:bg-slate-950 focus:ring-2 focus:ring-indigo-500 outline-none font-mono transition"
                    required
                  />
                </div>
              </div>
            </div>

            {/* Collapsible Additional Details */}
            <div className="pt-1">
              <button
                type="button"
                onClick={() => setShowOptionalStudentDetails(!showOptionalStudentDetails)}
                className="inline-flex items-center gap-1.5 text-xs font-semibold text-indigo-600 dark:text-indigo-400 hover:underline"
              >
                {showOptionalStudentDetails ? <ChevronUp className="h-3.5 w-3.5" /> : <ChevronDown className="h-3.5 w-3.5" />}
                {showOptionalStudentDetails ? 'Hide additional info' : '+ Add Address, Email, Custom ID & Photo'}
              </button>

              {showOptionalStudentDetails && (
                <div className="mt-3 pt-3 border-t border-slate-100 dark:border-slate-800 space-y-3 animate-fade-in">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="block text-[11px] font-semibold text-slate-600 dark:text-slate-400 mb-1">
                        Membership / Roll # (Auto if blank)
                      </label>
                      <input
                        type="text"
                        value={membershipNumber}
                        onChange={(e) => setMembershipNumber(e.target.value)}
                        placeholder="e.g. ATL-0042"
                        className="w-full rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 px-3 py-1.5 text-xs text-slate-900 dark:text-white font-mono"
                      />
                    </div>
                    <div>
                      <label className="block text-[11px] font-semibold text-slate-600 dark:text-slate-400 mb-1">
                        Email Address (Optional)
                      </label>
                      <input
                        type="email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        placeholder="rahul@example.com"
                        className="w-full rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 px-3 py-1.5 text-xs text-slate-900 dark:text-white"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="block text-[11px] font-semibold text-slate-600 dark:text-slate-400 mb-1">
                        Address / City (Optional)
                      </label>
                      <input
                        type="text"
                        value={address}
                        onChange={(e) => setAddress(e.target.value)}
                        placeholder="e.g. Geeta Bhawan, Indore"
                        className="w-full rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 px-3 py-1.5 text-xs text-slate-900 dark:text-white"
                      />
                    </div>
                    <div>
                      <label className="block text-[11px] font-semibold text-slate-600 dark:text-slate-400 mb-1">
                        Photo URL (Optional)
                      </label>
                      <input
                        type="url"
                        value={photoUrl}
                        onChange={(e) => setPhotoUrl(e.target.value)}
                        placeholder="https://..."
                        className="w-full rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 px-3 py-1.5 text-xs text-slate-900 dark:text-white"
                      />
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Card 2: Instant Desk & Membership Allocation Section */}
          <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/60 p-4 space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Armchair className="h-4 w-4 text-indigo-500" />
                <div>
                  <h4 className="text-xs font-bold text-slate-900 dark:text-white uppercase tracking-wider">
                    Plan & Desk Reservation
                  </h4>
                  <p className="text-[11px] text-slate-500 dark:text-slate-400">
                    Allocate seat & plan right away
                  </p>
                </div>
              </div>
              <Switch
                checked={assignDeskOnRegister}
                onChange={setAssignDeskOnRegister}
                activeColor="indigo"
              />
            </div>

            {assignDeskOnRegister && (
              <div className="space-y-3.5 pt-2 border-t border-slate-100 dark:border-slate-800 animate-fade-in">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <CustomSelect
                      label="Select Plan *"
                      value={regPlanId}
                      onChange={(val) => setRegPlanId(val)}
                      options={[
                        { value: '', label: '-- Choose a Plan --' },
                        ...plans.map((p) => ({
                          value: p._id,
                          label: `${p.name} (${p.seatType}) — ₹${(p.feePaise / 100).toFixed(0)}`,
                        })),
                      ]}
                      required={assignDeskOnRegister}
                    />
                  </div>

                  <div>
                    <CustomSelect
                      label="Select Shift"
                      value={regShiftId}
                      onChange={(val) => setRegShiftId(val)}
                      options={[
                        { value: '', label: 'General / Full Day' },
                        ...shifts.map((sh) => ({
                          value: sh._id,
                          label: `${sh.name} (${sh.startTime} - ${sh.endTime})`,
                        })),
                      ]}
                    />
                  </div>
                </div>

                {chosenPlan?.seatType === 'reserved' && (
                  <div>
                    <CustomSelect
                      label="Assign Reserved Desk *"
                      value={regSeatId}
                      onChange={(val) => setRegSeatId(val)}
                      options={[
                        { value: '', label: `-- Choose an Available Desk (${availableSeats.length} vacant) --` },
                        ...availableSeats.map((s) => ({
                          value: s._id,
                          label: `Desk #${s.seatNumber} (${s.section || 'Hall'})`,
                        })),
                      ]}
                      required
                    />
                  </div>
                )}

                <DateRangeDurationSelector
                  startDate={regStartDate}
                  endDate={regEndDate}
                  onChangeStartDate={setRegStartDate}
                  onChangeEndDate={setRegEndDate}
                  durationOption={regDurationOption}
                  onChangeDurationOption={setRegDurationOption}
                  label="Membership Validity & Duration"
                />

                {/* Discount & Negotiated Pricing */}
                {chosenPlan && (
                  <div className="rounded-xl border border-amber-200 dark:border-amber-900/40 bg-amber-50/50 dark:bg-amber-950/20 p-3 space-y-2">
                    <div className="flex items-center justify-between text-xs">
                      <span className="font-semibold text-slate-700 dark:text-slate-300">Standard Plan Price:</span>
                      <span className="font-mono font-bold text-slate-900 dark:text-white">₹{(chosenPlan.feePaise / 100).toFixed(0)}</span>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                      <div>
                        <label className="block text-[11px] font-semibold text-slate-700 dark:text-slate-300 mb-1">
                          Discount / Concession (₹)
                        </label>
                        <input
                          type="number"
                          min="0"
                          max={chosenPlan.feePaise / 100}
                          value={regDiscountRupees}
                          onChange={(e) => setRegDiscountRupees(e.target.value)}
                          placeholder="0"
                          className="w-full rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 px-3 py-1.5 text-xs text-slate-900 dark:text-white font-mono"
                        />
                      </div>
                      <div>
                        <label className="block text-[11px] font-semibold text-slate-700 dark:text-slate-300 mb-1">
                          Discount Reason (Optional)
                        </label>
                        <input
                          type="text"
                          value={regDiscountReason}
                          onChange={(e) => setRegDiscountReason(e.target.value)}
                          placeholder="e.g. Friend / Early bird"
                          className="w-full rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 px-3 py-1.5 text-xs text-slate-900 dark:text-white"
                        />
                      </div>
                    </div>

                    <div className="flex items-center justify-between pt-1.5 border-t border-amber-200/60 dark:border-amber-900/30 text-xs">
                      <span className="font-bold text-slate-800 dark:text-slate-200">Net Payable Membership Fee:</span>
                      <span className="font-mono font-extrabold text-emerald-600 dark:text-emerald-400 text-sm">
                        ₹{Math.max(0, Math.round(chosenPlan.feePaise / 100 - parseFloat(regDiscountRupees || '0')))}
                      </span>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Card 3: Instant Fee Collection */}
          {assignDeskOnRegister && (
            <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/60 p-4 space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <IndianRupee className="h-4 w-4 text-emerald-500" />
                  <div>
                    <h4 className="text-xs font-bold text-slate-900 dark:text-white uppercase tracking-wider">
                      Collect Fee & Issue Receipt
                    </h4>
                    <p className="text-[11px] text-slate-500 dark:text-slate-400">
                      Record payment upfront or collect later
                    </p>
                  </div>
                </div>
                <Switch
                  checked={collectPaymentOnRegister}
                  onChange={setCollectPaymentOnRegister}
                  activeColor="emerald"
                />
              </div>

              {collectPaymentOnRegister && (
                <div className="space-y-3 pt-2 border-t border-slate-100 dark:border-slate-800 animate-fade-in">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <div className="flex items-center justify-between mb-1">
                        <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300">
                          Amount Paid (₹) <span className="text-rose-500">*</span>
                        </label>
                        {chosenPlan && (
                          <span className="text-[10px] text-slate-400">
                            Max: ₹{Math.max(0, Math.round(chosenPlan.feePaise / 100 - parseFloat(regDiscountRupees || '0')))}
                          </span>
                        )}
                      </div>
                      <input
                        type="number"
                        value={regPaymentAmountRupees}
                        max={chosenPlan ? Math.max(0, Math.round(chosenPlan.feePaise / 100 - parseFloat(regDiscountRupees || '0'))) : undefined}
                        min={1}
                        onChange={(e) => setRegPaymentAmountRupees(e.target.value)}
                        placeholder="e.g. 500"
                        className="w-full rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-900 px-3.5 py-2 text-sm text-slate-900 dark:text-white font-mono focus:bg-white dark:focus:bg-slate-950 focus:ring-2 focus:ring-emerald-500 outline-none transition"
                        required={collectPaymentOnRegister}
                      />
                    </div>

                    <div>
                      <CustomSelect
                        label="Payment Mode"
                        value={regPaymentMethod}
                        onChange={(val) => setRegPaymentMethod(val as any)}
                        options={[
                          { value: 'upi', label: 'UPI (GPay / PhonePe / Paytm)', description: 'Fast QR & online transfer' },
                          { value: 'cash', label: 'Cash in Hand', description: 'Direct physical cash' },
                          { value: 'card', label: 'Debit / Credit Card', description: 'POS card swipe' },
                          { value: 'bank_transfer', label: 'Bank Transfer / NEFT', description: 'IMPS/RTGS bank deposit' },
                        ]}
                      />
                    </div>
                  </div>

                  {regPaymentMethod === 'upi' && (
                    <div>
                      <label className="block text-[11px] font-semibold text-slate-700 dark:text-slate-300 mb-1">
                        UPI Transaction Ref / UTR (Optional)
                      </label>
                      <input
                        type="text"
                        value={regPaymentRef}
                        onChange={(e) => setRegPaymentRef(e.target.value)}
                        placeholder="e.g. 412389102847"
                        className="w-full rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 px-3 py-1.5 text-xs text-slate-900 dark:text-white font-mono"
                      />
                    </div>
                  )}
                </div>
              )}
            </div>
          )}

          <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-200 dark:border-slate-800">
            <button
              type="button"
              onClick={() => setShowRegisterModal(false)}
              className="rounded-xl px-4 py-2.5 text-xs font-semibold text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 transition"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={
                createStudent.isPending ||
                (collectPaymentOnRegister &&
                  chosenPlan &&
                  parseFloat(regPaymentAmountRupees || '0') >
                    Math.max(0, Math.round(chosenPlan.feePaise / 100 - parseFloat(regDiscountRupees || '0'))))
              }
              className="rounded-xl bg-indigo-600 hover:bg-indigo-500 px-5 py-2.5 text-xs font-bold !text-white disabled:opacity-50 shadow-md transition"
            >
              {createStudent.isPending ? 'Registering…' : '✓ Register & Complete'}
            </button>
          </div>
        </form>
      </Modal>

      {/* Delete Student Confirmation Modal */}
      <ConfirmModal
        isOpen={!!deleteConfirm}
        onClose={() => setDeleteConfirm(null)}
        onConfirm={() => {
          if (deleteConfirm) {
            deleteStudent.mutate(deleteConfirm.id, {
              onSuccess: () => setDeleteConfirm(null),
            });
          }
        }}
        title={`Delete Student "${deleteConfirm?.name || ''}"`}
        description={`Are you sure you want to remove student "${deleteConfirm?.name || ''}"? Any active memberships and assigned seats will be cancelled and freed immediately.`}
        confirmLabel="Delete Student"
        variant="danger"
        isLoading={deleteStudent.isPending}
      />
    </div>
  );
}
