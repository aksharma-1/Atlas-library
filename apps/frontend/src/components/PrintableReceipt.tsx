import { useState } from 'react';
import type { PaymentDTO, StudentDTO, MembershipDTO } from '@atlas/shared';
import { Modal } from './ui/Modal';
import { Printer, Receipt, CheckCircle2, Download, Share2 } from 'lucide-react';
import { toPng } from 'html-to-image';
import toast from 'react-hot-toast';
import { useAuth } from '../hooks/useAuth';

export interface PrintableReceiptProps {
  isOpen: boolean;
  onClose: () => void;
  payment: PaymentDTO;
  student: StudentDTO;
  membership?: MembershipDTO;
  tenantName?: string;
  logoUrl?: string;
}

export function PrintableReceipt({
  isOpen,
  onClose,
  payment,
  student,
  membership,
  tenantName = 'StudySpace Library',
  logoUrl: propLogoUrl,
}: PrintableReceiptProps) {
  const { user } = useAuth();
  const effectiveLogoUrl = propLogoUrl || user?.logoUrl;
  const [isGenerating, setIsGenerating] = useState(false);

  const handlePrint = () => {
    window.print();
  };

  const amountRupees = (payment.amountPaise / 100).toFixed(2);

  // Extract membership details from prop or from populated payment.membershipId
  const populatedMembership = typeof payment.membershipId === 'object' && payment.membershipId !== null
    ? (payment.membershipId as unknown as Record<string, any>)
    : null;

  // Plan name
  const planName =
    membership?.planName ||
    (typeof membership?.planId === 'object' && (membership.planId as any)?.name) ||
    populatedMembership?.planId?.name ||
    populatedMembership?.planName ||
    'Standard Study Plan';

  // Desk / Seat
  const rawSeat =
    membership?.seatNumber ||
    (typeof membership?.seatId === 'object' && (membership.seatId as any)?.seatNumber) ||
    populatedMembership?.seatId?.seatNumber ||
    populatedMembership?.seatNumber;

  const seatType = membership?.seatType || populatedMembership?.seatType;
  const deskDisplay = rawSeat
    ? `Desk #${rawSeat}`
    : seatType === 'non-reserved'
    ? 'General / Floating (No Fixed Desk)'
    : 'Not Assigned';

  // Shift
  const shiftName =
    membership?.shiftName ||
    (typeof membership?.shiftId === 'object' && (membership.shiftId as any)?.name) ||
    populatedMembership?.shiftId?.name ||
    populatedMembership?.shiftName;

  const shiftTimes =
    membership?.shiftStartTime && membership?.shiftEndTime
      ? `(${membership.shiftStartTime} - ${membership.shiftEndTime})`
      : populatedMembership?.shiftId?.startTime && populatedMembership?.shiftId?.endTime
      ? `(${populatedMembership.shiftId.startTime} - ${populatedMembership.shiftId.endTime})`
      : '';

  const shiftDisplay = shiftName ? `${shiftName} ${shiftTimes}`.trim() : 'Full Day / General';

  // Validity Period
  const startDateRaw = membership?.startDate || populatedMembership?.startDate;
  const endDateRaw = membership?.endDate || populatedMembership?.endDate;
  const validityDisplay = startDateRaw && endDateRaw
    ? `${new Date(startDateRaw).toLocaleDateString('en-IN')} to ${new Date(endDateRaw).toLocaleDateString('en-IN')}`
    : null;

  /**
   * Generates high-resolution PNG image of the fee receipt and shares directly
   * via Web Share API (mobile WhatsApp) or opens WhatsApp Web with auto-downloaded image.
   */
  const handleShareWhatsApp = async () => {
    const receiptEl = document.getElementById('printable-receipt');
    if (!receiptEl) return;

    try {
      setIsGenerating(true);
      const dataUrl = await toPng(receiptEl, {
        cacheBust: true,
        pixelRatio: 3, // crisp high-definition receipt image
      });

      // Convert data URL to Blob & File
      const res = await fetch(dataUrl);
      const blob = await res.blob();
      const fileName = `${student.name.replace(/\s+/g, '_')}_Receipt_${payment.receiptNumber}.png`;
      const file = new File([blob], fileName, { type: 'image/png' });

      const shareText = `Hello ${student.name},\nHere is your official fee payment receipt for ${payment.receiptNumber} (${tenantName}).\nAmount Paid: ₹${amountRupees}\nPlan: ${planName}\nDesk: ${deskDisplay}\nThank you! 🧾✨`;

      // If browser supports native Web Share with files (Chrome Android / Safari iOS)
      if (navigator.canShare && navigator.canShare({ files: [file] })) {
        await navigator.share({
          files: [file],
          title: `${student.name} - Fee Receipt ${payment.receiptNumber}`,
          text: shareText,
        });
        toast.success('Receipt shared successfully!');
      } else {
        // Fallback for Desktop: trigger download and open WhatsApp chat
        const link = document.createElement('a');
        link.download = fileName;
        link.href = dataUrl;
        link.click();

        const cleanMobile = student.mobile.replace(/[^0-9]/g, '');
        const fullMobile = cleanMobile.length === 10 ? `91${cleanMobile}` : cleanMobile;
        const msg = encodeURIComponent(
          `${shareText}\n\n(Receipt image downloaded - please attach to this chat)`,
        );
        window.open(`https://wa.me/${fullMobile}?text=${msg}`, '_blank');
        toast.success('Receipt image downloaded! Attach to WhatsApp chat.');
      }
    } catch (err) {
      console.error('Error generating receipt image:', err);
      toast.error('Failed to generate receipt image');
    } finally {
      setIsGenerating(false);
    }
  };

  /**
   * Direct download as PNG image
   */
  const handleDownloadImage = async () => {
    const receiptEl = document.getElementById('printable-receipt');
    if (!receiptEl) return;

    try {
      setIsGenerating(true);
      const dataUrl = await toPng(receiptEl, {
        cacheBust: true,
        pixelRatio: 3,
      });
      const link = document.createElement('a');
      link.download = `${student.name.replace(/\s+/g, '_')}_Receipt_${payment.receiptNumber}.png`;
      link.href = dataUrl;
      link.click();
      toast.success('Receipt image saved!');
    } catch (err) {
      console.error('Error downloading receipt image:', err);
      toast.error('Failed to download receipt image');
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Official Fee Receipt"
      subtitle={`Receipt #${payment.receiptNumber}`}
      icon={<Receipt className="h-5 w-5" />}
      maxWidth="lg"
    >
      <div className="space-y-6">
        {/* Printable Area */}
        <div className="flex justify-center">
          <div
            id="printable-receipt"
            className="w-full max-w-md rounded-2xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 p-6 shadow-sm text-slate-800 dark:text-slate-100 font-mono text-xs space-y-4"
          >
          {/* Header */}
          <div className="text-center border-b border-dashed border-slate-200 dark:border-slate-800 pb-3">
            {effectiveLogoUrl && (
              <div className="flex justify-center mb-2">
                <img
                  src={effectiveLogoUrl}
                  alt={tenantName}
                  className="h-10 w-10 object-contain rounded-lg border border-slate-200 dark:border-slate-700 p-0.5 bg-white"
                />
              </div>
            )}
            <p className="text-base font-black tracking-wide text-indigo-600 dark:text-indigo-400 uppercase">
              {tenantName}
            </p>
            <p className="text-[10px] text-slate-500 dark:text-slate-400 uppercase tracking-wider">
              Official Library Fee Receipt
            </p>
            <p className="mt-2 text-xs font-bold text-slate-900 dark:text-white">
              {payment.receiptNumber}
            </p>
            <p className="text-[10px] text-slate-500 dark:text-slate-400">
              {new Date(payment.createdAt).toLocaleString('en-IN')}
            </p>
          </div>

          {/* Student Info */}
          <div className="space-y-1.5 py-1 border-b border-dashed border-slate-200 dark:border-slate-800 pb-3">
            <div className="flex justify-between">
              <span className="text-slate-500 dark:text-slate-400">Student Name:</span>
              <span className="font-bold text-slate-900 dark:text-white">{student.name}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-500 dark:text-slate-400">Membership No:</span>
              <span className="font-semibold text-slate-700 dark:text-slate-200">{student.membershipNumber}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-500 dark:text-slate-400">Mobile:</span>
              <span>{student.mobile}</span>
            </div>
          </div>

          {/* Membership & Allocation Details */}
          <div className="space-y-1.5 py-1 border-b border-dashed border-slate-200 dark:border-slate-800 pb-3">
            <div className="flex justify-between">
              <span className="text-slate-500 dark:text-slate-400">Enrolled Plan:</span>
              <span className="font-bold text-indigo-600 dark:text-indigo-400">{planName}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-500 dark:text-slate-400">Assigned Desk:</span>
              <span className="font-bold text-slate-900 dark:text-white">{deskDisplay}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-500 dark:text-slate-400">Shift / Timing:</span>
              <span className="font-semibold text-slate-700 dark:text-slate-300">{shiftDisplay}</span>
            </div>
            {validityDisplay && (
              <div className="flex justify-between">
                <span className="text-slate-500 dark:text-slate-400">Plan Validity:</span>
                <span className="font-semibold text-slate-700 dark:text-slate-300">{validityDisplay}</span>
              </div>
            )}
          </div>

          {/* Payment Info */}
          <div className="space-y-1.5 py-1 border-b border-dashed border-slate-200 dark:border-slate-800 pb-3">
            <div className="flex justify-between">
              <span className="text-slate-500 dark:text-slate-400">Payment Mode:</span>
              <span className="uppercase font-semibold text-slate-700 dark:text-slate-300">
                {payment.paymentMethod}
              </span>
            </div>
            {payment.transactionRef && (
              <div className="flex justify-between">
                <span className="text-slate-500 dark:text-slate-400">Txn Reference:</span>
                <span className="font-semibold">{payment.transactionRef}</span>
              </div>
            )}
            <div className="flex justify-between items-baseline pt-2">
              <span className="text-sm font-bold text-slate-900 dark:text-white">Amount Paid:</span>
              <span className="text-base font-black text-emerald-600 dark:text-emerald-400">₹{amountRupees}</span>
            </div>
          </div>

          <div className="flex items-center justify-center gap-1.5 text-emerald-600 dark:text-emerald-400 text-xs font-semibold pt-1">
            <CheckCircle2 className="h-4 w-4" /> Payment Verified
          </div>

          <p className="text-[9px] text-center text-slate-400 dark:text-slate-500 pt-1">
            Thank you for choosing {tenantName}. This is an electronically generated valid receipt.
          </p>
          </div>
        </div>

        {/* Modal Controls */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 pt-3 border-t border-slate-200 dark:border-slate-800">
          <p className="text-xs text-slate-500 dark:text-slate-400 text-center sm:text-left">
            Save as image, share on WhatsApp or print physical receipt.
          </p>
          <div className="flex items-center justify-center sm:justify-end gap-2 flex-wrap sm:flex-nowrap">
            <button
              type="button"
              onClick={handleDownloadImage}
              disabled={isGenerating}
              className="flex items-center gap-1.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 px-3 py-2 text-xs font-semibold text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-700 transition"
              title="Download Receipt PNG"
            >
              <Download className="h-3.5 w-3.5 text-indigo-500" />
              <span>Image</span>
            </button>
            <button
              type="button"
              onClick={handleShareWhatsApp}
              disabled={isGenerating}
              className="flex items-center gap-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 px-3.5 py-2 text-xs font-semibold !text-white shadow-sm transition disabled:opacity-50 whitespace-nowrap"
              title="Send to student's WhatsApp"
            >
              <Share2 className="h-3.5 w-3.5" />
              <span>{isGenerating ? 'Generating…' : 'Share on WhatsApp'}</span>
            </button>
            <button
              type="button"
              onClick={handlePrint}
              className="flex items-center gap-1.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 px-4 py-2 text-xs font-semibold !text-white shadow-sm transition whitespace-nowrap"
            >
              <Printer className="h-3.5 w-3.5" />
              <span>Print</span>
            </button>
          </div>
        </div>
      </div>
    </Modal>
  );
}
