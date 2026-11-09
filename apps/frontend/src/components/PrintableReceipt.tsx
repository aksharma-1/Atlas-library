import type { PaymentDTO, StudentDTO } from '@atlas/shared';
import { Modal } from './ui/Modal';
import { Printer, Receipt, CheckCircle2 } from 'lucide-react';

export interface PrintableReceiptProps {
  isOpen: boolean;
  onClose: () => void;
  payment: PaymentDTO;
  student: StudentDTO;
  tenantName?: string;
}

export function PrintableReceipt({ isOpen, onClose, payment, student, tenantName = 'Atlas Library' }: PrintableReceiptProps) {
  const handlePrint = () => {
    window.print();
  };

  const amountRupees = (payment.amountPaise / 100).toFixed(2);

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Official Fee Receipt"
      subtitle={`Receipt #${payment.receiptNumber}`}
      icon={<Receipt className="h-5 w-5" />}
      maxWidth="md"
    >
      <div className="space-y-6">
        {/* Printable Area */}
        <div
          id="printable-receipt"
          className="rounded-2xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 p-6 shadow-sm text-slate-800 dark:text-slate-100 font-mono text-xs space-y-4"
        >
          {/* Header */}
          <div className="text-center border-b border-dashed border-slate-200 dark:border-slate-800 pb-3">
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

        {/* Modal Controls */}
        <div className="flex justify-between items-center pt-3 border-t border-slate-200 dark:border-slate-800">
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
            Print Receipt
          </button>
        </div>
      </div>
    </Modal>
  );
}
