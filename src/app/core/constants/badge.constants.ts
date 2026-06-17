export type BadgeType = 'red' | 'amber' | 'green' | 'whatsapp';

export const BADGE_CLASS_MAP: Record<BadgeType, string> = {
  red:      'sbb',
  amber:    'sbb sbb-am',
  green:    'sbb sbb-gr',
  whatsapp: 'sbb sbb-wa',
};

export function getBadgeClass(type?: BadgeType): string {
  return BADGE_CLASS_MAP[type ?? 'red'] ?? BADGE_CLASS_MAP.red;
}
