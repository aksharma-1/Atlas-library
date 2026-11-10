import { useState, useEffect } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { useStudents, useCreateStudent, useUpdateStudent, useDeleteStudent, useFilteredMemberships } from '../hooks/useStudents';
import { usePlans, useSeats, useShifts } from '../hooks/useLibrary';
import type { StudentDTO } from '@atlas/shared';
import { Modal, ConfirmModal, CustomSelect } from '../components/ui';
import { Bell, UserCheck, UserPlus, Search, Edit2, ArrowUpRight, MessageSquare, Armchair } from 'lucide-react';

type TabType = 'all' | 'dues' | 'expiring_3' | 'expiring_7' | 'expired' | 'left';

export function StudentsPage() {
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
  const [regPlanId, setRegPlanId] = useState('');
  const [regShiftId, setRegShiftId] = useState('');
  const [regSeatId, setRegSeatId] = useState('');
  const [regStartDate, setRegStartDate] = useState(() => new Date().toISOString().split('T')[0]);
  const [regEndDate, setRegEndDate] = useState(() =>
    new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
  );

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
  } | null>(null);

  // Delete Confirm Modal State
  const [deleteConfirm, setDeleteConfirm] = useState<{ id: string; name: string } | null>(null);

  // Queries & Mutations
  const { data: students = [], isLoading: studentsLoading } = useStudents(search);
  const { data: filteredMemberships = [], isLoading: membershipsLoading } = useFilteredMemberships(activeTab);
  const { data: plans = [] } = usePlans();
  const { data: seats = [] } = useSeats();
  const { data: shifts = [] } = useShifts();

  const chosenPlan = plans.find((p) => p._id === regPlanId);
  const availableSeats = seats.filter((s) => s.status === 'available');

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
    return `📚 Atlas Library Reminder\n\nDear ${sName}(${sSeat || 'Seat'}),\nAapki library seat renewal due hai. Kripya confirm karein ki aap seat renew karwa rahe hain ya seat chhod rahe hain.\nJaldi se bata dein, taaki seat ko accordingly update kiya ja sake.\nKeep reading, keep growing! 🌟`;
  };

  const handleOpenWhatsApp = (mobileNum: string, text: string) => {
    const cleanMobile = mobileNum.replace(/[^0-9]/g, '');
    const fullMobile = cleanMobile.length === 10 ? `91${cleanMobile}` : cleanMobile;
    const url = `https://wa.me/${fullMobile}?text=${encodeURIComponent(text)}`;
    window.open(url, '_blank');
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
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm text-slate-700 dark:text-slate-300">
              <thead className="bg-slate-50 dark:bg-slate-800/60 text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400 border-b border-slate-200 dark:border-slate-800">
                <tr>
                  <th className="px-6 py-3.5">Student</th>
                  <th className="px-6 py-3.5">Membership ID</th>
                  <th className="px-6 py-3.5">Mobile</th>
                  <th className="px-6 py-3.5">Registered Date</th>
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
                ) : students.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="py-12 text-center text-slate-400 text-sm">
                      No students found. Register your first student above.
                    </td>
                  </tr>
                ) : (
                  students.map((s) => (
                    <tr key={s._id} className="hover:bg-slate-50/80 dark:hover:bg-slate-800/30 transition">
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
                          <p className="font-semibold text-slate-900 dark:text-white">{s.name}</p>
                          {s.email && <p className="text-xs text-slate-400">{s.email}</p>}
                        </div>
                      </td>
                      <td className="px-6 py-4 font-mono font-medium text-indigo-600 dark:text-indigo-400">
                        {s.membershipNumber}
                      </td>
                      <td className="px-6 py-4 text-slate-600 dark:text-slate-300 font-mono text-xs">{s.mobile}</td>
                      <td className="px-6 py-4 text-xs text-slate-500 dark:text-slate-400">
                        {new Date(s.createdAt).toLocaleDateString()}
                      </td>
                      <td className="px-6 py-4 text-right space-x-2">
                        <Link
                          to={`/students/${s._id}`}
                          className="inline-flex items-center gap-1 rounded-lg bg-indigo-500 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 border border-indigo-200 dark:border-indigo-800 px-2.5 py-1 text-xs font-semibold hover:bg-indigo-600 hover:!text-white transition"
                        >
                          Profile <ArrowUpRight className="h-3 w-3" />
                        </Link>
                        <button
                          onClick={() => handleStartEdit(s)}
                          className="rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 px-2.5 py-1 text-xs font-medium text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-700 transition"
                        >
                          Edit
                        </button>
                        <button
                          onClick={() => handleDelete(s._id, s.name)}
                          className="rounded-lg border border-rose-200 dark:border-rose-900/50 bg-rose-50 dark:bg-rose-950/20 px-2.5 py-1 text-xs font-medium text-rose-600 dark:text-rose-400 hover:bg-rose-100 dark:hover:bg-rose-900/30 transition"
                        >
                          Delete
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      ) : (
        /* Tabs 2-6: Filtered Memberships (Dues, Expiring 1-3, Expiring 1-7, Expired, Left) */
        <div className="overflow-hidden rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-sm">
          <div className="p-4 bg-slate-50 dark:bg-slate-800/40 border-b border-slate-200 dark:border-slate-800 flex justify-between items-center">
            <h3 className="text-sm font-bold text-slate-900 dark:text-white">
              {tabs.find((t) => t.id === activeTab)?.label} ({filteredMemberships.length})
            </h3>
            <span className="text-xs text-slate-500 dark:text-slate-400">
              Showing filtered records matching current status
            </span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm text-slate-700 dark:text-slate-300">
              <thead className="bg-slate-50 dark:bg-slate-800/60 text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400 border-b border-slate-200 dark:border-slate-800">
                <tr>
                  <th className="px-5 py-3.5">Student / ID</th>
                  <th className="px-5 py-3.5">Mobile</th>
                  <th className="px-5 py-3.5">Seat / Plan</th>
                  <th className="px-5 py-3.5">Expiry Date</th>
                  {activeTab === 'dues' ? (
                    <th className="px-5 py-3.5 text-right">Due Amount</th>
                  ) : (
                    <th className="px-5 py-3.5">Status</th>
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
                ) : filteredMemberships.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="py-12 text-center text-slate-400 text-sm">
                      No records found in this section.
                    </td>
                  </tr>
                ) : (
                  filteredMemberships.map((m: any) => {
                    const s = m.studentId || {};
                    const duePaise = Math.max(0, (m.feePaise || 0) - (m.paidPaise || 0));
                    const isExpired = new Date(m.endDate) < new Date();
                    const seatNo = m.seatId?.seatNumber || 'Non-Reserved';

                    return (
                      <tr key={m._id} className="hover:bg-slate-50/80 dark:hover:bg-slate-800/30 transition">
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
                              <Link
                                to={`/students/${s._id}`}
                                className="font-semibold text-indigo-600 dark:text-indigo-400 hover:underline"
                              >
                                {s.name || 'Unknown Student'}
                              </Link>
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
                            {new Date(m.endDate).toLocaleDateString()}
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

                        <td className="px-5 py-3.5 text-right space-x-2">
                          <button
                            onClick={() =>
                              setReminderModalData({
                                studentName: s.name,
                                seatNumber: seatNo,
                                mobile: s.mobile,
                              })
                            }
                            className="inline-flex items-center gap-1 rounded-lg bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800 hover:bg-emerald-600 hover:!text-white px-2.5 py-1 text-xs font-semibold transition"
                            title="Send Renewal Reminder"
                          >
                            <MessageSquare className="h-3 w-3" /> Reminder
                          </button>
                          <Link
                            to={`/students/${s._id}`}
                            className="inline-flex items-center gap-1 rounded-lg bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 border border-indigo-200 dark:border-indigo-800 hover:bg-indigo-600 hover:!text-white px-2.5 py-1 text-xs font-semibold transition"
                          >
                            View <ArrowUpRight className="h-3 w-3" />
                          </Link>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ── WhatsApp Reminder Modal ── */}
      <Modal
        isOpen={!!reminderModalData}
        onClose={() => setReminderModalData(null)}
        title="Send WhatsApp Renewal Reminder"
        subtitle="Pre-drafted notification template for rapid dispatch"
        icon={<Bell className="h-5 w-5 text-indigo-500" />}
        maxWidth="md"
      >
        {reminderModalData && (
          <div className="space-y-4">
            <div className="p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/40 text-xs font-mono space-y-2 whitespace-pre-line text-slate-800 dark:text-slate-200">
              {getReminderText(reminderModalData.studentName, reminderModalData.seatNumber)}
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
                  handleOpenWhatsApp(
                    reminderModalData.mobile,
                    getReminderText(reminderModalData.studentName, reminderModalData.seatNumber),
                  );
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
        subtitle="Create student profile & generate membership ID"
        icon={<UserCheck className="h-5 w-5 text-indigo-500" />}
        maxWidth="md"
      >
        <form onSubmit={handleCreateStudent} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">Student Full Name *</label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. Rahul Sharma"
              className="w-full rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 px-3.5 py-2 text-sm text-slate-900 dark:text-white"
              required
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">Mobile Number *</label>
              <input
                type="tel"
                value={mobile}
                onChange={(e) => setMobile(e.target.value)}
                placeholder="10-digit number"
                className="w-full rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 px-3.5 py-2 text-sm text-slate-900 dark:text-white"
                required
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">Membership ID (Auto if blank)</label>
              <input
                type="text"
                value={membershipNumber}
                onChange={(e) => setMembershipNumber(e.target.value)}
                placeholder="e.g. ATL-0042"
                className="w-full rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 px-3.5 py-2 text-sm text-slate-900 dark:text-white"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">Email Address (Optional)</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="rahul@example.com"
              className="w-full rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 px-3.5 py-2 text-sm text-slate-900 dark:text-white"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">Photo URL (Optional)</label>
            <input
              type="url"
              value={photoUrl}
              onChange={(e) => setPhotoUrl(e.target.value)}
              placeholder="https://..."
              className="w-full rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 px-3.5 py-2 text-sm text-slate-900 dark:text-white"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">Address / City (Optional)</label>
            <input
              type="text"
              value={address}
              onChange={(e) => setAddress(e.target.value)}
              placeholder="e.g. Geeta Bhawan, Indore"
              className="w-full rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 px-3.5 py-2 text-sm text-slate-900 dark:text-white"
            />
          </div>

          {/* Instant Desk & Membership Allocation Section */}
          <div className="pt-3 border-t border-slate-200 dark:border-slate-800 space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Armchair className="h-4 w-4 text-indigo-500" />
                <span className="text-xs font-bold text-slate-800 dark:text-slate-200">
                  Assign Membership & Desk Now
                </span>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  checked={assignDeskOnRegister}
                  onChange={(e) => setAssignDeskOnRegister(e.target.checked)}
                  className="sr-only peer"
                />
                <div className="w-9 h-5 bg-slate-300 dark:bg-slate-700 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-indigo-600"></div>
              </label>
            </div>

            {assignDeskOnRegister && (
              <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-850/60 border border-slate-200 dark:border-slate-800 space-y-3 animate-fade-in">
                <div>
                  <CustomSelect
                    label="Select Plan *"
                    value={regPlanId}
                    onChange={(val) => setRegPlanId(val)}
                    options={[
                      { value: '', label: '-- Choose a Plan --' },
                      ...plans.map((p) => ({
                        value: p._id,
                        label: `${p.name} (${p.seatType}) — ₹${(p.feePaise / 100).toFixed(0)}/mo`,
                      })),
                    ]}
                  />
                </div>

                {chosenPlan?.seatType === 'reserved' && (
                  <div>
                    <CustomSelect
                      label="Assign Reserved Desk *"
                      value={regSeatId}
                      onChange={(val) => setRegSeatId(val)}
                      options={[
                        { value: '', label: '-- Select an Available Desk --' },
                        ...availableSeats.map((s) => ({
                          value: s._id,
                          label: `Desk ${s.seatNumber} (${s.section || 'Hall'})`,
                        })),
                      ]}
                    />
                  </div>
                )}

                <div>
                  <CustomSelect
                    label="Select Operational Shift"
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

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                      Start Date
                    </label>
                    <input
                      type="date"
                      value={regStartDate}
                      onChange={(e) => setRegStartDate(e.target.value)}
                      className="w-full rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 px-3.5 py-2 text-xs text-slate-900 dark:text-white"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                      End Date
                    </label>
                    <input
                      type="date"
                      value={regEndDate}
                      onChange={(e) => setRegEndDate(e.target.value)}
                      className="w-full rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 px-3.5 py-2 text-xs text-slate-900 dark:text-white"
                    />
                  </div>
                </div>
              </div>
            )}
          </div>

          <div className="flex justify-end gap-3 pt-3 border-t border-slate-200 dark:border-slate-800">
            <button
              type="button"
              onClick={() => setShowRegisterModal(false)}
              className="rounded-xl px-4 py-2 text-xs font-semibold text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={createStudent.isPending}
              className="rounded-xl bg-indigo-600 px-4 py-2 text-xs font-semibold !text-white hover:bg-indigo-500 disabled:opacity-50 shadow-sm"
            >
              {createStudent.isPending ? 'Registering…' : 'Register Student'}
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
