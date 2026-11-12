/**
 * Formats a WhatsApp reminder template with actual dynamic values.
 * Supported variables:
 * - {student_name}
 * - {seat_number}
 * - {library_name}
 * - {phone}
 * - {expiry_date}
 */
export const DEFAULT_WHATSAPP_REMINDER_TEMPLATE = `Dear {student_name}({seat_number}),
Aapki library seat renewal due hai. Kripya confirm karein ki aap seat renew karwa rahe hain ya seat chhod rahe hain.
Jaldi se bata dein, taaki seat ko accordingly update kiya ja sake.
Keep reading, keep growing! 🌟

Warm regards,
{library_name}
{phone}`;

export function renderWhatsAppReminder(
  template: string | undefined | null,
  values: {
    studentName?: string;
    seatNumber?: string;
    libraryName?: string;
    phone?: string;
    expiryDate?: string;
  },
): string {
  const base = (template && template.trim().length > 0) ? template : DEFAULT_WHATSAPP_REMINDER_TEMPLATE;
  return base
    .replace(/\{student_name\}/gi, values.studentName || 'Student')
    .replace(/\{seat_number\}/gi, values.seatNumber || 'Seat')
    .replace(/\{library_name\}/gi, values.libraryName || 'Library')
    .replace(/\{phone\}/gi, values.phone || '')
    .replace(/\{expiry_date\}/gi, values.expiryDate || '');
}

export function openWhatsAppChat(mobileNum: string, text: string): void {
  const cleanMobile = mobileNum.replace(/[^0-9]/g, '');
  const fullMobile = cleanMobile.length === 10 ? `91${cleanMobile}` : cleanMobile;
  const url = `https://wa.me/${fullMobile}?text=${encodeURIComponent(text)}`;
  window.open(url, '_blank');
}
