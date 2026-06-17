import { Pipe, PipeTransform } from '@angular/core';

const AR_MONTHS = [
  'يناير', 'فبراير', 'مارس', 'أبريل', 'مايو', 'يونيو',
  'يوليو', 'أغسطس', 'سبتمبر', 'أكتوبر', 'نوفمبر', 'ديسمبر',
];

@Pipe({ name: 'dateAr', standalone: true, pure: true })
export class DateArPipe implements PipeTransform {
  transform(
    value: string | Date | null | undefined,
    format: 'full' | 'date' | 'time' = 'full',
  ): string {
    if (!value) return '—';
    const d = typeof value === 'string' ? new Date(value) : value;
    if (isNaN(d.getTime())) return '—';

    const day   = d.getDate();
    const month = AR_MONTHS[d.getMonth()];
    const year  = d.getFullYear();
    const hours = String(d.getHours()).padStart(2, '0');
    const mins  = String(d.getMinutes()).padStart(2, '0');

    if (format === 'date') return `${day} ${month} ${year}`;
    if (format === 'time') return `${hours}:${mins}`;
    return `${day} ${month} ${year} — ${hours}:${mins}`;
  }
}
