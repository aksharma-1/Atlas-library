import type { StudentDTO, MembershipDTO } from '@atlas/shared';

interface Props {
  student: StudentDTO;
  membership?: MembershipDTO;
  tenantName?: string;
  onClose: () => void;
}

export function PrintableCard({ student, membership, tenantName = 'Atlas Library', onClose }: Props) {
  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4">
      <div className="w-full max-w-lg rounded-xl border border-surface-700 bg-surface-800 p-6 shadow-2xl space-y-4">
        <div className="flex items-center justify-between pb-2 border-b border-surface-700">
          <h2 className="text-base font-bold text-white">Student Membership Identity Card</h2>
          <button onClick={onClose} className="text-slate-400 hover:text-white text-xs">
            ✕ Close
          </button>
        </div>

        {/* Printable Card Area */}
        <div id="printable-card" className="border-2 border-brand-500/50 bg-gradient-to-br from-surface-900 to-surface-800 p-6 rounded-xl text-white space-y-4 shadow-lg">
          <div className="flex items-start justify-between border-b border-surface-700 pb-3">
            <div>
              <p className="text-lg font-black tracking-wider text-brand-400">{tenantName.toUpperCase()}</p>
              <p className="text-[10px] text-slate-400 uppercase tracking-widest">Self-Study & Reading Room</p>
            </div>
            <div className="text-right">
              <span className="rounded bg-brand-600/30 px-2 py-0.5 text-[11px] font-bold text-brand-300">
                {student.membershipNumber}
              </span>
            </div>
          </div>

          <div className="flex gap-4 items-center">
            {student.photoUrl ? (
              <img
                src={student.photoUrl}
                alt={student.name}
                className="h-20 w-20 rounded-lg object-cover border-2 border-brand-500/60 shrink-0 bg-surface-700 shadow"
              />
            ) : (
              <div className="h-20 w-20 rounded-lg bg-surface-700/80 border border-surface-600 flex items-center justify-center text-3xl shrink-0">
                👤
              </div>
            )}
            <div className="space-y-1">
              <p className="text-lg font-bold text-white">{student.name}</p>
              <p className="text-xs text-slate-300">📞 {student.mobile}</p>
              {student.address && <p className="text-[11px] text-slate-400">📍 {student.address}</p>}
            </div>
          </div>

          <div className="grid grid-cols-3 gap-2 bg-surface-700/30 p-2.5 rounded-lg border border-surface-700/60 text-center">
            <div>
              <p className="text-[10px] text-slate-400 uppercase">Assigned Seat</p>
              <p className="text-sm font-bold text-brand-300">
                {membership?.seatNumber || (membership?.seatType === 'reserved' ? 'Reserved' : 'General')}
              </p>
            </div>
            <div>
              <p className="text-[10px] text-slate-400 uppercase">Tier / Plan</p>
              <p className="text-xs font-semibold text-white truncate">
                {membership?.planName || 'Standard'}
              </p>
            </div>
            <div>
              <p className="text-[10px] text-slate-400 uppercase">Valid Thru</p>
              <p className="text-xs font-semibold text-emerald-400">
                {membership?.endDate ? new Date(membership.endDate).toLocaleDateString() : 'N/A'}
              </p>
            </div>
          </div>

          <p className="text-[9px] text-center text-slate-500 pt-1">
            Valid only with official library authorization. Non-transferable.
          </p>
        </div>

        <div className="flex justify-end gap-3 pt-2">
          <button
            onClick={onClose}
            className="rounded px-4 py-2 text-xs font-semibold text-slate-300 hover:bg-surface-700"
          >
            Cancel
          </button>
          <button
            onClick={handlePrint}
            className="rounded bg-brand-600 px-5 py-2 text-xs font-semibold text-white hover:bg-brand-500 shadow-sm"
          >
            🖨️ Print Membership Card
          </button>
        </div>
      </div>
    </div>
  );
}
