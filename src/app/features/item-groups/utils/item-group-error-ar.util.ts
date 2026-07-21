/**
 * The ItemGroup endpoints (addItemGroup/updateItemGroup/deleteItemGroup) are English-only,
 * so raw backend text must never reach a toast — known messages are mapped here to Arabic,
 * matching the pattern in pharmacy-portal/utils/api-error-ar.util.ts.
 */
const KNOWN_MESSAGES: Array<[RegExp, string]> = [
  [/code.*(already exists|already in use|duplicate|taken)/i, 'هذا الكود مستخدم بالفعل، من فضلك اختر كودًا آخر'],
  [/duplicate.*code|unique.*code/i, 'هذا الكود مستخدم بالفعل، من فضلك اختر كودًا آخر'],
  [/main section cannot have a parent/i, 'القسم الرئيسي لا يمكن أن يكون له مجموعة أب'],
  [/parent group not found/i, 'المجموعة الأب المحددة غير موجودة'],
  [/parent group must be exactly one level above/i, 'المجموعة الأب يجب أن تكون من المستوى الأعلى مباشرة'],
  [/parentid.*(required|is required)/i, 'يجب تحديد المجموعة الأب لهذا المستوى'],
  [/cannot delete.*(children|child groups)|has (child|children)/i, 'لا يمكن حذف مجموعة لديها عناصر تابعة'],
  [/cannot delete.*items|has.*items? (linked|associated)/i, 'لا يمكن حذف مجموعة مرتبطة بأصناف'],
];

/** Extracts a user-facing Arabic message from an HttpErrorResponse, never leaking raw English backend text. */
export function itemGroupErrorAr(err: unknown, fallback: string): string {
  const raw: string | undefined = (err as any)?.error?.message ?? (err as any)?.error ?? (err as any)?.message;
  if (!raw || typeof raw !== 'string') return fallback;

  for (const [pattern, arabic] of KNOWN_MESSAGES) {
    if (pattern.test(raw)) return arabic;
  }

  // Backend text already in Arabic (rare, but possible for custom validation messages) — keep as-is.
  if (/[؀-ۿ]/.test(raw)) return raw;

  return fallback;
}
