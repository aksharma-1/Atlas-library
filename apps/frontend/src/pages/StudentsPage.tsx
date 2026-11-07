import { useState, useEffect } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { useStudents, useCreateStudent, useUpdateStudent, useDeleteStudent, useFilteredMemberships } from '../hooks/useStudents';
import type { StudentDTO } from '@atlas/shared';
import { Modal } from '../components/ui';
import { Bell, UserCheck, UserPlus } from 'lucide-react';

type TabType = 'all' | 'dues' | 'expiring_3' | 'expiring_7' | 'expired' | 'left';

export function StudentsPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const urlTab = searchParams.get('tab') as TabType | null;

  const [activeTab, setActiveTab] = useState<TabType>(urlTab && ['all', 'dues', 'expiring_3', 'expiring_7', 'expired', 'left'].includes(urlTab) ? urlTab : 'all');
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

  // Queries & Mutations
  const { data: students = [], isLoading: studentsLoading } = useStudents(search);
  const { data: filteredMemberships = [], isLoading: membershipsLoading } = useFilteredMemberships(activeTab);

  const createStudent = useCreateStudent();
  const updateStudent = useUpdateStudent();
  const deleteStudent = useDeleteStudent();

  // Helper for image upload -> Base64 Data URL
  const handlePhotoUpload = (e: React.ChangeEvent<HTMLInputElement>, isEdit = false) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 2 * 1024 * 1024) {
      alert('Photo must be less than 2MB');
      return;
    }

    const reader = new FileReader();
    reader.onload = (event) => {
      const dataUrl = event.target?.result as string;
      if (isEdit) {
        setEditPhotoUrl(dataUrl);
      } else {
        setPhotoUrl(dataUrl);
      }
    };
    reader.readAsDataURL(file);
  };

  const handleRegister = (e: React.FormEvent) => {
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
    if (!window.confirm(`Are you sure you want to delete / remove student "${sName}"? Any active memberships and seat reservations will be cancelled.`)) {
      return;
    }
    deleteStudent.mutate(id);
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
    { id: 'expiring_3', label: 'Expired In 1-3 Days', icon: '⚡' },
    { id: 'expiring_7', label: 'Expired In 1-7 Days', icon: '📅' },
    { id: 'expired', label: 'Expired Membership', icon: '⏳' },
    { id: 'left', label: 'Left Membership', icon: '🚪' },
  ];

  return (
    <div className="space-y-6 max-w-7xl">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white">Students & Members</h1>
          <p className="mt-1 text-sm text-slate-400">
            Directory of registered students, seat allocations, fees dues, and expiry management.
          </p>
        </div>
        <button
          onClick={() => setShowRegisterModal(true)}
          className="rounded-lg bg-brand-600 px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-brand-500"
        >
          + Register New Student
        </button>
      </div>

      {/* Tabs navigation */}
      <div className="flex flex-wrap gap-2 border-b border-surface-700 pb-3">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => handleSelectTab(tab.id)}
            className={`flex items-center gap-2 rounded-lg px-3.5 py-2 text-xs font-semibold transition ${
              activeTab === tab.id
                ? 'bg-brand-600 text-white shadow-sm'
                : 'bg-surface-800 text-slate-300 hover:bg-surface-700 hover:text-white'
            }`}
          >
            <span>{tab.icon}</span>
            <span>{tab.label}</span>
          </button>
        ))}
      </div>

      {/* Search Bar for All Members */}
      {activeTab === 'all' && (
        <div className="rounded-xl border border-surface-700 bg-surface-800 p-4">
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by name, mobile number, or membership ID…"
            className="w-full rounded-lg border border-surface-600 bg-surface-700 px-4 py-2 text-sm text-white placeholder-slate-400 outline-none focus:border-brand-500"
          />
        </div>
      )}

      {/* Tab 1: All Members Directory */}
      {activeTab === 'all' ? (
        <div className="overflow-hidden rounded-xl border border-surface-700 bg-surface-800 shadow-sm">
          <table className="w-full text-left text-sm text-slate-300">
            <thead className="bg-surface-700/60 text-xs font-semibold uppercase tracking-wider text-slate-400 border-b border-surface-700">
              <tr>
                <th className="px-6 py-3.5">Student / Photo</th>
                <th className="px-6 py-3.5">Membership ID</th>
                <th className="px-6 py-3.5">Mobile</th>
                <th className="px-6 py-3.5">Registered Date</th>
                <th className="px-6 py-3.5 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-surface-700">
              {studentsLoading ? (
                <tr>
                  <td colSpan={5} className="py-8 text-center text-slate-500">
                    Loading students directory…
                  </td>
                </tr>
              ) : students.length === 0 ? (
                <tr>
                  <td colSpan={5} className="py-8 text-center text-slate-400">
                    No students found. Register your first student above.
                  </td>
                </tr>
              ) : (
                students.map((s) => (
                  <tr key={s._id} className="hover:bg-surface-700/30 transition">
                    <td className="px-6 py-4 flex items-center gap-3">
                      {s.photoUrl ? (
                        <img
                          src={s.photoUrl}
                          alt={s.name}
                          className="h-10 w-10 rounded-full object-cover border border-surface-600"
                        />
                      ) : (
                        <div className="h-10 w-10 rounded-full bg-surface-700 flex items-center justify-center text-sm font-bold text-slate-300 border border-surface-600">
                          {s.name.charAt(0).toUpperCase()}
                        </div>
                      )}
                      <div>
                        <p className="font-semibold text-white">{s.name}</p>
                        {s.email && <p className="text-xs text-slate-400">{s.email}</p>}
                      </div>
                    </td>
                    <td className="px-6 py-4 font-mono font-medium text-brand-400">
                      {s.membershipNumber}
                    </td>
                    <td className="px-6 py-4">{s.mobile}</td>
                    <td className="px-6 py-4 text-xs text-slate-400">
                      {new Date(s.createdAt).toLocaleDateString()}
                    </td>
                    <td className="px-6 py-4 text-right space-x-2">
                      <Link
                        to={`/students/${s._id}`}
                        className="rounded bg-brand-600/20 px-2.5 py-1 text-xs font-medium text-brand-300 hover:bg-brand-600 hover:text-white transition"
                      >
                        Profile
                      </Link>
                      <button
                        onClick={() => handleStartEdit(s)}
                        className="rounded bg-surface-600 hover:bg-surface-500 px-2.5 py-1 text-xs text-slate-200"
                      >
                        Edit
                      </button>
                      <button
                        onClick={() => handleDelete(s._id, s.name)}
                        className="rounded bg-red-500/20 hover:bg-red-500/30 px-2.5 py-1 text-xs text-red-300"
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
      ) : (
        /* Tabs 2-6: Filtered Memberships (Dues, Expiring 1-3, Expiring 1-7, Expired, Left) */
        <div className="overflow-hidden rounded-xl border border-surface-700 bg-surface-800 shadow-sm">
          <div className="p-4 bg-surface-700/30 border-b border-surface-700 flex justify-between items-center">
            <h3 className="text-sm font-semibold text-white">
              {tabs.find((t) => t.id === activeTab)?.label} ({filteredMemberships.length})
            </h3>
            <span className="text-xs text-slate-400">
              Showing filtered records matching current status
            </span>
          </div>

          <table className="w-full text-left text-sm text-slate-300">
            <thead className="bg-surface-700/60 text-xs font-semibold uppercase tracking-wider text-slate-400 border-b border-surface-700">
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
            <tbody className="divide-y divide-surface-700">
              {membershipsLoading ? (
                <tr>
                  <td colSpan={6} className="py-8 text-center text-slate-500">
                    Loading records…
                  </td>
                </tr>
              ) : filteredMemberships.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-8 text-center text-slate-400">
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
                    <tr key={m._id} className="hover:bg-surface-700/30 transition">
                      <td className="px-5 py-3.5">
                        <div className="flex items-center gap-3">
                          {s.photoUrl ? (
                            <img
                              src={s.photoUrl}
                              alt={s.name}
                              className="h-8 w-8 rounded-full object-cover border border-surface-600"
                            />
                          ) : (
                            <div className="h-8 w-8 rounded-full bg-surface-700 flex items-center justify-center text-xs font-bold text-slate-300">
                              {(s.name || '?').charAt(0).toUpperCase()}
                            </div>
                          )}
                          <div>
                            <Link to={`/students/${s._id}`} className="font-semibold text-brand-300 hover:underline">
                              {s.name || 'Unknown Student'}
                            </Link>
                            <p className="text-[11px] font-mono text-slate-400">{s.membershipNumber}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-5 py-3.5">{s.mobile || '—'}</td>
                      <td className="px-5 py-3.5">
                        <span className="font-semibold text-white">Seat {seatNo}</span>
                        <p className="text-xs text-slate-400">{m.planId?.name}</p>
                      </td>
                      <td className="px-5 py-3.5 font-mono text-xs">
                        <span className={isExpired ? 'text-red-400 font-semibold' : 'text-slate-300'}>
                          {new Date(m.endDate).toLocaleDateString()}
                        </span>
                      </td>

                      {activeTab === 'dues' ? (
                        <td className="px-5 py-3.5 text-right font-mono font-bold text-amber-400">
                          ₹{(duePaise / 100).toFixed(0)}
                        </td>
                      ) : (
                        <td className="px-5 py-3.5 capitalize">
                          <span
                            className={`rounded px-2 py-0.5 text-[10px] font-semibold ${
                              m.status === 'active'
                                ? 'bg-emerald-500/20 text-emerald-300'
                                : m.status === 'left'
                                ? 'bg-purple-500/20 text-purple-300'
                                : 'bg-red-500/20 text-red-300'
                            }`}
                          >
                            {m.status}
                          </span>
                        </td>
                      )}

                      <td className="px-5 py-3.5 text-right space-x-2">
                        {/* WhatsApp Reminder Button */}
                        <button
                          onClick={() =>
                            setReminderModalData({
                              studentName: s.name,
                              seatNumber: seatNo,
                              mobile: s.mobile,
                            })
                          }
                          className="rounded bg-emerald-600/20 hover:bg-emerald-600 px-2.5 py-1 text-xs font-medium text-emerald-300 hover:text-white transition"
                          title="Send Renewal Reminder"
                        >
                          📲 Reminder
                        </button>
                        <Link
                          to={`/students/${s._id}`}
                          className="rounded bg-brand-600/20 hover:bg-brand-600 px-2.5 py-1 text-xs font-medium text-brand-300 hover:text-white transition"
                        >
                          View
                        </Link>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      )}

      {/* ── WhatsApp / SMS Reminder Modal ── */}
      <Modal
        isOpen={!!reminderModalData}
        onClose={() => setReminderModalData(null)}
        title="Expiry / Renewal Reminder"
        subtitle={reminderModalData ? `Send notification to ${reminderModalData.studentName} (Seat ${reminderModalData.seatNumber})` : ''}
        icon={<Bell className="h-5 w-5" />}
        maxWidth="lg"
      >
        {reminderModalData && (
          <div className="space-y-4">
            <div className="rounded-xl bg-slate-50 dark:bg-slate-800/60 p-4 border border-slate-200 dark:border-slate-700">
              <label className="block text-[11px] font-semibold text-indigo-600 dark:text-indigo-400 uppercase tracking-wider mb-2">
                Message Template Preview
              </label>
              <pre className="text-xs text-slate-800 dark:text-slate-200 whitespace-pre-wrap font-sans">
                {getReminderText(reminderModalData.studentName, reminderModalData.seatNumber)}
              </pre>
            </div>

            <div className="flex justify-end gap-3 pt-3 border-t border-slate-200 dark:border-slate-800">
              <button
                type="button"
                onClick={() => {
                  navigator.clipboard.writeText(getReminderText(reminderModalData.studentName, reminderModalData.seatNumber));
                  alert('Template copied to clipboard!');
                }}
                className="rounded-xl border border-slate-300 dark:border-slate-700 px-4 py-2 text-xs font-semibold text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800"
              >
                📋 Copy Text
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
                className="rounded-xl bg-emerald-600 px-4 py-2 text-xs font-semibold !text-white hover:bg-emerald-500 flex items-center gap-2 shadow-sm"
              >
                <span>💬</span> Open WhatsApp
              </button>
            </div>
          </div>
        )}
      </Modal>

      {/* ── Edit Student Modal ── */}
      <Modal
        isOpen={!!editingStudent}
        onClose={() => setEditingStudent(null)}
        title="Edit Student Details"
        subtitle={editingStudent ? `Update personal or registration information for ${editingStudent.name}` : ''}
        icon={<UserCheck className="h-5 w-5" />}
        maxWidth="md"
      >
        {editingStudent && (
          <form onSubmit={handleSaveEdit} className="space-y-4">
            {/* Photo Upload Preview */}
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
                  onChange={(e) => handlePhotoUpload(e, true)}
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
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">Member ID</label>
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

      {/* ── Registration Modal ── */}
      <Modal
        isOpen={showRegisterModal}
        onClose={() => setShowRegisterModal(false)}
        title="Register Student"
        subtitle="Create an administrative record for a new library member"
        icon={<UserPlus className="h-5 w-5" />}
        maxWidth="md"
      >
        <form onSubmit={handleRegister} className="space-y-4">
          {/* Photo Upload Input */}
          <div className="flex items-center gap-4">
            {photoUrl ? (
              <img
                src={photoUrl}
                alt="Preview"
                className="h-16 w-16 rounded-full object-cover border-2 border-indigo-500 shadow"
              />
            ) : (
              <div className="h-16 w-16 rounded-full bg-slate-100 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 flex items-center justify-center text-2xl text-slate-400">
                📷
              </div>
            )}
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">Member Photo (Optional)</label>
              <input
                type="file"
                accept="image/*"
                onChange={(e) => handlePhotoUpload(e, false)}
                className="block text-xs text-slate-500 file:mr-2 file:rounded-lg file:border-0 file:bg-slate-100 dark:file:bg-slate-800 file:px-2.5 file:py-1 file:text-xs file:font-semibold file:text-slate-700 dark:file:text-slate-300 hover:file:bg-slate-200"
              />
              {photoUrl && (
                <button
                  type="button"
                  onClick={() => setPhotoUrl('')}
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
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. Bharat Rawat"
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
                placeholder="9876543210"
                className="w-full rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 px-3.5 py-2 text-sm text-slate-900 dark:text-white"
                required
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">Email (Optional)</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="student@example.com"
                className="w-full rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 px-3.5 py-2 text-sm text-slate-900 dark:text-white"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">Custom Member ID (Optional)</label>
            <input
              type="text"
              value={membershipNumber}
              onChange={(e) => setMembershipNumber(e.target.value)}
              placeholder="Leave empty for auto-generated (MEM-0001)"
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
    </div>
  );
}
