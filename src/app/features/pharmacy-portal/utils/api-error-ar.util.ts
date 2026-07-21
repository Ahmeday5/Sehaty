/**
 * Backend messages (prescriptions/orders APIs) are English-only. The UI is fully Arabic,
 * so raw backend text must never reach a toast — known messages are mapped here, and
 * anything unrecognized falls back to a generic Arabic message rather than leaking English.
 */
const KNOWN_MESSAGES: Array<[RegExp, string]> = [
  [
    /only accepted prescriptions can be turned into an order/i,
    'لا يمكن إنشاء طلب إلا من روشتة مقبولة',
  ],
  [/prescription.*(not found|does not exist)/i, 'الروشتة غير موجودة'],
  [/order.*already.*(created|exists)/i, 'تم إنشاء طلب من هذه الروشتة بالفعل'],
  [
    /status.*!=.*pending|already.*reviewed|cannot review/i,
    'لا يمكن مراجعة روشتة تمت مراجعتها من قبل',
  ],
  [/rejectionreason.*(required|is required)/i, 'سبب الرفض مطلوب'],
  [/cancellationreason.*(required|is required)/i, 'سبب الإلغاء مطلوب'],
  [/deliveryfee.*(required|is required)/i, 'رسوم التوصيل مطلوبة'],
  [
    /not.*(available|in stock)|isavailable.*false/i,
    'أحد الأصناف المختارة غير متاح حاليًا',
  ],
  [
    /not found in your pharmacy|not in.*pharmacy.*stock/i,
    'أحد الأصناف المختارة غير موجود في مخزون صيدليتك',
  ],
  [
    /invalid.*transition|not allowed.*status/i,
    'لا يمكن تنفيذ هذا الإجراء في حالة الطلب الحالية',
  ],
];

/** Extracts a user-facing Arabic message from an HttpErrorResponse, never leaking raw English backend text. */
export function apiErrorMessageAr(err: unknown, fallback: string): string {
  const raw: string | undefined =
    (err as any)?.error?.message ?? (err as any)?.message;
  if (!raw || typeof raw !== 'string') return fallback;

  for (const [pattern, arabic] of KNOWN_MESSAGES) {
    if (pattern.test(raw)) return arabic;
  }

  // Backend text already in Arabic (rare, but possible for custom validation messages) — keep as-is.
  if (/[؀-ۿ]/.test(raw)) return raw;

  return fallback;
}
