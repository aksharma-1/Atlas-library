import type { PaymentDTO, StudentDTO } from '@atlas/shared';

interface Props {
  payment: PaymentDTO;
  student: StudentDTO;
  tenantName?: string;
  onClose: () => void;
}

export function PrintableReceipt({ payment, student, tenantName = 'Atlas Library', onClose }: Props) {
  const handlePrint = () => {
    window.print();
  };

  const amountRupees = (payment.amountPaise / 100).toFixed(2);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4">
      <div className="w-full max-w-md rounded-xl border border-surface-700 bg-surface-800 p-6 shadow-2xl space-y-4">
        <div className="flex items-center justify-between pb-2 border-b border-surface-700">
          <h2 className="text-base font-bold text-white">Payment Receipt</h2>
          <button onClick={onClose} className="text-slate-400 hover:text-white text-xs">
            ✕ Close
          </button>
        </div>

        {/* Printable Receipt Area */}
        <div id="printable-receipt" className="border border-surface-600 bg-surface-900 p-6 rounded-lg text-white space-y-4 font-mono text-xs">
          <div className="text-center border-b border-dashed border-surface-700 pb-3">
            <p className="text-base font-black text-brand-400">{tenantName}</p>
            <p className="text-[10px] text-slate-400">Official Fee Receipt</p>
            <p className="mt-2 text-xs text-white font-bold">{payment.receiptNumber}</p>
            <p className="text-[10px] text-slate-400">{new Date(payment.createdAt).toLocaleString()}</p>
          </div>

          <div className="space-y-1 py-1 border-b border-dashed border-surface-700 pb-3">
            <div className="flex justify-between">
              <span className="text-slate-400">Student Name:</span>
              <span className="font-bold">{student.name}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-400">Membership No:</span>
              <span>{student.membershipNumber}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-400">Mobile:</span>
              <span>{student.mobile}</span>
            </div>
          </div>

          <div className="space-y-1 py-1 border-b border-dashed border-surface-700 pb-3">
            <div className="flex justify-between">
              <span className="text-slate-400">Payment Mode:</span>
              <span className="uppercase font-semibold">{payment.paymentMethod}</span>
            </div>
            {payment.transactionRef && (
              <div className="flex justify-between">
                <span className="text-slate-400">Txn Ref:</span>
                <span>{payment.transactionRef}</span>
              </div>
            )}
            <div className="flex justify-between items-baseline pt-2">
              <span className="text-sm font-bold text-white">Amount Paid:</span>
              <span className="text-base font-black text-emerald-400">₹{amountRupees}</span>
            </div>
          </div>

          <p className="text-[9px] text-center text-slate-500 pt-2">
            Thank you for studying with {tenantName}. This is an electronically generated receipt.
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
            🖨️ Print Receipt
          </button>
        </div>
      </div>
    </div>
  );
}
