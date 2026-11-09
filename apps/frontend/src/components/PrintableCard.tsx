import type { StudentDTO, MembershipDTO } from '@atlas/shared';
import { QRCodeSVG } from 'qrcode.react';
import { Modal } from './ui/Modal';
import { Printer, ShieldCheck, MapPin, Phone, Calendar, Clock, BookOpen } from 'lucide-react';

export interface PrintableCardProps {
  isOpen: boolean;
  onClose: () => void;
  student: StudentDTO;
  membership?: MembershipDTO;
  tenantName?: string;
}

export function PrintableCard({ isOpen, onClose, student, membership, tenantName = 'Atlas Library' }: PrintableCardProps) {
  const handlePrint = () => {
    window.print();
  };

  const isReserved = membership?.seatType === 'reserved';
  const seatDisplay = membership?.seatNumber ? `Desk ${membership.seatNumber}` : isReserved ? 'Reserved Desk' : 'General / Floating';
  const planDisplay = membership?.planName || 'Standard Study Pass';
  const shiftDisplay = membership?.shiftName || 'Full Day';
  const validUntil = membership?.endDate
    ? new Date(membership.endDate).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })
    : 'N/A';
  const validFrom = membership?.startDate
    ? new Date(membership.startDate).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })
    : 'N/A';

  // Digital verification QR data
  const qrData = JSON.stringify({
    lib: tenantName,
    id: student.membershipNumber,
    name: student.name,
    seat: membership?.seatNumber || 'General',
    valid: membership?.endDate || '',
  });

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Student Membership Identity Card"
      subtitle="Standard landscape printable format for student identification"
      icon={<ShieldCheck className="h-5 w-5" />}
      maxWidth="xl"
    >
      <div className="space-y-6">
        {/* ── PRINTABLE ID CARD CONTAINER ─────────────────────────────────── */}
        <div className="flex justify-center py-1">
          <div
            id="printable-card"
            className="w-[450px] rounded-2xl overflow-hidden border border-slate-300 dark:border-slate-700 bg-white dark:bg-gradient-to-br dark:from-slate-900 dark:via-indigo-950/40 dark:to-slate-900 shadow-xl text-slate-900 dark:text-white relative select-none"
            style={{ width: '450px' }}
          >
            {/* Header Banner */}
            <div className="bg-gradient-to-r from-indigo-600 via-indigo-500 to-indigo-700 px-5 py-3 flex items-center justify-between text-white shadow-sm">
              <div className="flex items-center gap-2">
                <BookOpen className="h-5 w-5 text-indigo-100" />
                <div>
                  <h3 className="text-sm font-black tracking-wider uppercase leading-none drop-shadow-sm">
                    {tenantName}
                  </h3>
                  <span className="text-[9px] font-medium text-indigo-100 tracking-widest uppercase opacity-90 block mt-0.5">
                    Premium Study Space & Library
                  </span>
                </div>
              </div>
              <div className="text-right">
                <span className="rounded-md bg-white/20 border border-white/30 px-2 py-0.5 text-[11px] font-mono font-bold tracking-wider">
                  {student.membershipNumber}
                </span>
              </div>
            </div>

            {/* Card Body */}
            <div className="p-5 space-y-4">
              <div className="flex items-start gap-4">
                {/* Photo / Avatar */}
                <div className="shrink-0">
                  {student.photoUrl ? (
                    <img
                      src={student.photoUrl}
                      alt={student.name}
                      className="h-24 w-24 rounded-xl object-cover border-2 border-indigo-400/80 shadow-md bg-slate-100 dark:bg-slate-800"
                    />
                  ) : (
                    <div className="h-24 w-24 rounded-xl bg-slate-100 dark:bg-slate-800 border-2 border-indigo-300 dark:border-indigo-500/50 flex flex-col items-center justify-center text-indigo-600 dark:text-indigo-300 font-bold text-2xl shadow-inner">
                      <span>{student.name.slice(0, 2).toUpperCase()}</span>
                      <span className="text-[8px] uppercase tracking-wider text-slate-500 dark:text-slate-400 mt-1 font-normal">
                        Student
                      </span>
                    </div>
                  )}
                </div>

                {/* Details Column */}
                <div className="space-y-1.5 flex-1 min-w-0">
                  <h4 className="text-base font-bold text-slate-900 dark:text-white tracking-wide truncate">
                    {student.name}
                  </h4>

                  <div className="flex items-center gap-1.5 text-xs text-slate-600 dark:text-slate-300">
                    <Phone className="h-3 w-3 text-indigo-500 dark:text-indigo-400 shrink-0" />
                    <span className="font-mono">{student.mobile}</span>
                  </div>

                  {student.address && (
                    <div className="flex items-start gap-1.5 text-[11px] text-slate-500 dark:text-slate-400">
                      <MapPin className="h-3 w-3 text-indigo-500 dark:text-indigo-400 shrink-0 mt-0.5" />
                      <span className="truncate">{student.address}</span>
                    </div>
                  )}

                  <div className="pt-1 flex items-center gap-2">
                    <span className="rounded-md bg-emerald-500/10 dark:bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30 text-[10px] font-semibold px-2 py-0.5 capitalize">
                      ● Active Member
                    </span>
                    <span className="rounded-md bg-indigo-500/10 dark:bg-indigo-500/20 text-indigo-600 dark:text-indigo-300 border border-indigo-500/30 text-[10px] font-semibold px-2 py-0.5">
                      {isReserved ? 'Reserved' : 'General'}
                    </span>
                  </div>
                </div>

                {/* Digital Verification QR Code */}
                <div className="shrink-0 flex flex-col items-center justify-center bg-white p-1.5 rounded-xl border border-slate-200 dark:border-slate-600 shadow-sm">
                  <QRCodeSVG value={qrData} size={64} level="M" />
                  <span className="text-[7px] text-slate-800 font-mono font-bold mt-1 uppercase tracking-tighter">
                    Verified
                  </span>
                </div>
              </div>

              {/* Membership Specs Grid */}
              <div className="grid grid-cols-3 gap-2 bg-slate-50 dark:bg-slate-800/80 p-3 rounded-xl border border-slate-200 dark:border-slate-700/80 text-center">
                <div>
                  <span className="text-[9px] uppercase tracking-wider text-slate-500 dark:text-slate-400 block font-semibold">
                    Seat Number
                  </span>
                  <span className="text-xs font-bold text-indigo-600 dark:text-indigo-300 mt-0.5 block truncate">
                    {seatDisplay}
                  </span>
                  <span className="text-[9px] text-slate-500 dark:text-slate-400 block truncate">{planDisplay}</span>
                </div>
                <div>
                  <span className="text-[9px] uppercase tracking-wider text-slate-500 dark:text-slate-400 block font-semibold">
                    Shift Timing
                  </span>
                  <span className="text-xs font-bold text-slate-700 dark:text-slate-200 mt-0.5 block truncate flex items-center justify-center gap-1">
                    <Clock className="h-3 w-3 text-indigo-500 dark:text-indigo-400" />
                    {shiftDisplay}
                  </span>
                </div>
                <div>
                  <span className="text-[9px] uppercase tracking-wider text-slate-500 dark:text-slate-400 block font-semibold">
                    Valid Thru
                  </span>
                  <span className="text-xs font-bold text-emerald-600 dark:text-emerald-400 mt-0.5 block truncate flex items-center justify-center gap-1">
                    <Calendar className="h-3 w-3 text-emerald-500 dark:text-emerald-400" />
                    {validUntil}
                  </span>
                </div>
              </div>

              {/* Footer info & Rules */}
              <div className="flex items-center justify-between text-[9px] text-slate-400 dark:text-slate-500 pt-1 border-t border-slate-100 dark:border-slate-800">
                <span>Issued: {validFrom}</span>
                <span className="italic">Authorized Signatory • Non-transferable</span>
              </div>
            </div>
          </div>
        </div>

        {/* Modal Controls */}
        <div className="flex justify-between items-center pt-3 border-t border-slate-200 dark:border-slate-800">
          <p className="text-xs text-slate-500 dark:text-slate-400">
            Print as a physical card or save as PDF.
          </p>
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={onClose}
              className="rounded-xl px-4 py-2 text-xs font-semibold text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 transition"
            >
              Close
            </button>
            <button
              type="button"
              onClick={handlePrint}
              className="flex items-center gap-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 px-5 py-2 text-xs font-semibold !text-white shadow-lg transition"
            >
              <Printer className="h-4 w-4" />
              Print Identity Card
            </button>
          </div>
        </div>
      </div>
    </Modal>
  );
}
