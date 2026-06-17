import { Pipe, PipeTransform } from '@angular/core';

@Pipe({ name: 'currencyAr', standalone: true, pure: true })
export class CurrencyArPipe implements PipeTransform {
  transform(value: number | null | undefined): string {
    if (value == null) return '—';
    return `${Math.round(value).toLocaleString('ar-EG')} ج.م`;
  }
}
