import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useStudents, useCreateStudent } from '../hooks/useStudents';

export function StudentsPage() {
  const [search, setSearch] = useState('');
  const [showRegisterModal, setShowRegisterModal] = useState(false);

  // Form states
  const [name, setName] = useState('');
  const [mobile, setMobile] = useState('');
  const [email, setEmail] = useState('');
  const [address, setAddress] = useState('');
  const [membershipNumber, setMembershipNumber] = useState('');

  const { data: students = [], isLoading } = useStudents(search);
  const createStudent = useCreateStudent();

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
      },
      {
        onSuccess: () => {
          setShowRegisterModal(false);
          setName('');
          setMobile('');
          setEmail('');
          setAddress('');
          setMembershipNumber('');
        },
      },
    );
  };

  return (
    <div className="space-y-6 max-w-7xl">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white">Students & Members</h1>
          <p className="mt-1 text-sm text-slate-400">
            Directory of registered students, seat allocations, and active memberships.
          </p>
        </div>
        <button
          onClick={() => setShowRegisterModal(true)}
          className="rounded-lg bg-brand-600 px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-brand-500"
        >
          + Register New Student
        </button>
      </div>

      {/* Search Bar */}
      <div className="rounded-xl border border-surface-700 bg-surface-800 p-4">
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search by name, mobile number, or membership ID…"
          className="w-full rounded-lg border border-surface-600 bg-surface-700 px-4 py-2 text-sm text-white placeholder-slate-400 outline-none focus:border-brand-500"
        />
      </div>

      {/* Students Table */}
      <div className="overflow-hidden rounded-xl border border-surface-700 bg-surface-800 shadow-sm">
        <table className="w-full text-left text-sm text-slate-300">
          <thead className="bg-surface-700/60 text-xs font-semibold uppercase tracking-wider text-slate-400 border-b border-surface-700">
            <tr>
              <th className="px-6 py-3.5">Membership ID</th>
              <th className="px-6 py-3.5">Student Name</th>
              <th className="px-6 py-3.5">Mobile</th>
              <th className="px-6 py-3.5">Registered Date</th>
              <th className="px-6 py-3.5 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-surface-700">
            {isLoading ? (
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
                  <td className="px-6 py-4 font-mono font-medium text-brand-400">
                    {s.membershipNumber}
                  </td>
                  <td className="px-6 py-4 font-medium text-white">{s.name}</td>
                  <td className="px-6 py-4">{s.mobile}</td>
                  <td className="px-6 py-4 text-xs text-slate-400">
                    {new Date(s.createdAt).toLocaleDateString()}
                  </td>
                  <td className="px-6 py-4 text-right">
                    <Link
                      to={`/students/${s._id}`}
                      className="rounded bg-brand-600/20 px-3 py-1 text-xs font-medium text-brand-300 hover:bg-brand-600 hover:text-white transition"
                    >
                      View Profile →
                    </Link>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Registration Modal */}
      {showRegisterModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
          <div className="w-full max-w-md rounded-xl border border-surface-700 bg-surface-800 p-6 shadow-2xl">
            <h2 className="text-lg font-bold text-white mb-1">Register Student</h2>
            <p className="text-xs text-slate-400 mb-4">
              Create an administrative record for a new library member.
            </p>

            <form onSubmit={handleRegister} className="space-y-4">
              <div>
                <label className="block text-xs font-medium text-slate-300">Full Name *</label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="e.g. Ananya Patel"
                  className="mt-1 w-full rounded border border-surface-600 bg-surface-700 px-3 py-1.5 text-sm text-white"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-slate-300">Mobile Number *</label>
                  <input
                    type="tel"
                    value={mobile}
                    onChange={(e) => setMobile(e.target.value)}
                    placeholder="9876543210"
                    className="mt-1 w-full rounded border border-surface-600 bg-surface-700 px-3 py-1.5 text-sm text-white"
                    required
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-300">Email (Optional)</label>
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="student@example.com"
                    className="mt-1 w-full rounded border border-surface-600 bg-surface-700 px-3 py-1.5 text-sm text-white"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-300">Custom Member ID (Optional)</label>
                <input
                  type="text"
                  value={membershipNumber}
                  onChange={(e) => setMembershipNumber(e.target.value)}
                  placeholder="Leave empty for auto-generated (MEM-0001)"
                  className="mt-1 w-full rounded border border-surface-600 bg-surface-700 px-3 py-1.5 text-sm text-white"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-300">Address / City (Optional)</label>
                <input
                  type="text"
                  value={address}
                  onChange={(e) => setAddress(e.target.value)}
                  placeholder="e.g. Geeta Bhawan, Indore"
                  className="mt-1 w-full rounded border border-surface-600 bg-surface-700 px-3 py-1.5 text-sm text-white"
                />
              </div>

              <div className="flex justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setShowRegisterModal(false)}
                  className="rounded px-4 py-2 text-xs font-semibold text-slate-300 hover:bg-surface-700"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={createStudent.isPending}
                  className="rounded bg-brand-600 px-4 py-2 text-xs font-semibold text-white hover:bg-brand-500 disabled:opacity-50"
                >
                  {createStudent.isPending ? 'Registering…' : 'Register Student'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
