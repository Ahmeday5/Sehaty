/**
 * The Item endpoints (addItem/updateItem/deleteItem) are English-only, and since add/update
 * use the plain-text response helpers (postText/putText), an error body can be raw text
 * rather than JSON — both shapes are checked here. Matches the pattern in
 * item-groups/utils/item-group-error-ar.util.ts.
 */
const KNOWN_MESSAGES: Array<[RegExp, string]> = [
  [/code.*(already exists|already in use|duplicate|taken)/i, 'هذا الكود مستخدم بالفعل، من فضلك اختر كودًا آخر'],
  [/barcode.*(already exists|already in use|duplicate|taken)/i, 'هذا الباركود مستخدم بالفعل، من فضلك اختر باركود آخر'],
  [/duplicate.*code|unique.*code/i, 'هذا الكود مستخدم بالفعل، من فضلك اختر كودًا آخر'],
  [/duplicate.*barcode|unique.*barcode/i, 'هذا الباركود مستخدم بالفعل، من فضلك اختر باركود آخر'],
  [/itemgroup.*(not found|does not exist|invalid)/i, 'المجموعة الفرعية المحددة غير موجودة'],
  [/only.*subgroup|group.*must be.*subgroup/i, 'يجب اختيار مجموعة فرعية فقط لربط الصنف بها'],
];

/** Extracts a user-facing Arabic message from an HttpErrorResponse, never leaking raw English backend text. */
export function itemErrorAr(err: unknown, fallback: string): string {
  const raw: string | undefined =
    (err as any)?.error?.message ?? (typeof (err as any)?.error === 'string' ? (err as any).error : undefined) ?? (err as any)?.message;
  if (!raw || typeof raw !== 'string') return fallback;

  for (const [pattern, arabic] of KNOWN_MESSAGES) {
    if (pattern.test(raw)) return arabic;
  }

  // Backend text already in Arabic (rare, but possible for custom validation messages) — keep as-is.
  if (/[؀-ۿ]/.test(raw)) return raw;

  return fallback;
}
