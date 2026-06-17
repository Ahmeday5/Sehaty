import { Injectable, inject } from '@angular/core';
import { AuthService } from './auth.service';
import { environment } from '../../../environments/environment';

export interface PrintColumn<T> {
  readonly key:    keyof T | ((row: T) => unknown);
  readonly header: string;
  readonly align?: 'start' | 'center' | 'end';
  readonly width?: string;
  readonly format?:
    | 'currency' | 'date' | 'shortDate' | 'percent' | 'number'
    | ((value: unknown, row: T) => string);
  readonly bold?: boolean;
}

export interface PrintMetaItem {
  readonly label: string;
  readonly value: string;
}

export interface PrintTotals {
  readonly label?: string;
  readonly labelColSpan?: number;
  readonly cells: ReadonlyArray<string | null>;
}

export interface PrintConfig<T> {
  readonly title:        string;
  readonly subtitle?:    string;
  readonly columns:      ReadonlyArray<PrintColumn<T>>;
  readonly rows:         ReadonlyArray<T>;
  readonly meta?:        ReadonlyArray<PrintMetaItem>;
  readonly totals?:      PrintTotals;
  readonly orientation?: 'portrait' | 'landscape';
  readonly emptyMessage?: string;
  readonly showRowCount?: boolean;
}

@Injectable({ providedIn: 'root' })
export class PrintService {
  private readonly auth = inject(AuthService);
  private readonly months = [
    'يناير','فبراير','مارس','أبريل','مايو','يونيو',
    'يوليو','أغسطس','سبتمبر','أكتوبر','نوفمبر','ديسمبر',
  ];

  print<T>(config: PrintConfig<T>): void {
    const html        = this.buildDocument(config);
    const orientation = config.orientation ?? 'portrait';
    const widthMm     = orientation === 'landscape' ? 297 : 210;
    const heightMm    = orientation === 'landscape' ? 210 : 297;

    const iframe = document.createElement('iframe');
    iframe.setAttribute('aria-hidden', 'true');
    iframe.setAttribute('title', 'تجهيز الطباعة');
    iframe.style.cssText = [
      'position:fixed','left:-10000px','top:0',
      `width:${widthMm}mm`,`height:${heightMm}mm`,
      'border:0','opacity:0','pointer-events:none','z-index:-1',
    ].join(';');
    document.body.appendChild(iframe);

    let cleanedUp = false;
    const cleanup = () => {
      if (cleanedUp) return;
      cleanedUp = true;
      setTimeout(() => iframe.remove(), 0);
    };

    iframe.onload = () => {
      const win = iframe.contentWindow;
      const doc = iframe.contentDocument;
      if (!win || !doc) { cleanup(); return; }
      win.addEventListener('afterprint', cleanup, { once: true });

      const docWithFonts = doc as Document & { fonts?: { ready: Promise<unknown> } };
      Promise.resolve(docWithFonts.fonts?.ready ?? Promise.resolve()).then(() => {
        win.requestAnimationFrame(() => {
          void doc.body.offsetHeight;
          win.requestAnimationFrame(() => {
            try { win.focus(); win.print(); } catch { /* ignore */ }
            setTimeout(cleanup, 60_000);
          });
        });
      });
    };

    iframe.srcdoc = html;
  }

  private buildDocument<T>(config: PrintConfig<T>): string {
    const {
      title, subtitle, columns, rows, meta, totals,
      orientation = 'portrait',
      emptyMessage = 'لا توجد بيانات للطباعة.',
      showRowCount = true,
    } = config;

    const user        = this.auth.currentUser();
    const generatedAt = this.formatDateTime(new Date());

    const headerBlock = `
      <header class="rpt-header">
        <div class="rpt-brand">
          <div class="rpt-brand-name">${esc(environment.appName)}</div>
          <div class="rpt-brand-version">${esc('إصدار ' + environment.appVersion)}</div>
        </div>
        <div class="rpt-title-block">
          <h1 class="rpt-title">${esc(title)}</h1>
          ${subtitle ? `<p class="rpt-subtitle">${esc(subtitle)}</p>` : ''}
        </div>
      </header>`;

    const metaItems: PrintMetaItem[] = [
      { label: 'تاريخ الطباعة', value: generatedAt },
      ...(user ? [{ label: 'المستخدم', value: user.name }] : []),
      ...(showRowCount ? [{ label: 'إجمالي السجلات', value: String(rows.length) }] : []),
      ...(meta ?? []),
    ];

    const metaBlock = metaItems.length > 0
      ? `<section class="rpt-meta">${metaItems.map((m) =>
          `<div class="rpt-meta-item"><span class="rpt-meta-label">${esc(m.label)}</span><span class="rpt-meta-value">${esc(m.value)}</span></div>`
        ).join('')}</section>`
      : '';

    const tableBlock = rows.length === 0
      ? `<div class="rpt-empty">${esc(emptyMessage)}</div>`
      : this.buildTable(columns, rows, totals);

    return `<!doctype html>
<html dir="rtl" lang="ar">
<head>
  <meta charset="utf-8">
  <title>${esc(title)}</title>
  <style>${this.styles(orientation)}</style>
</head>
<body>
  <main class="rpt">
    ${headerBlock}
    ${metaBlock}
    ${tableBlock}
    <footer class="rpt-footer">
      <span>${esc(environment.appName)} — ${esc(title)}</span>
      <span>${esc(generatedAt)}</span>
    </footer>
  </main>
</body>
</html>`;
  }

  private buildTable<T>(
    columns: ReadonlyArray<PrintColumn<T>>,
    rows: ReadonlyArray<T>,
    totals: PrintTotals | undefined,
  ): string {
    const head = `<thead><tr>${columns.map((c) =>
      `<th class="ta-${c.align ?? 'start'}"${c.width ? ` style="width:${esc(c.width)}"` : ''}>${esc(c.header)}</th>`
    ).join('')}</tr></thead>`;

    const body = `<tbody>${rows.map((row) =>
      `<tr>${columns.map((c) => {
        const raw  = this.resolveValue(c, row);
        const text = this.formatValue(c, raw, row);
        return `<td class="ta-${c.align ?? 'start'}${c.bold ? ' td-bold' : ''}">${esc(text)}</td>`;
      }).join('')}</tr>`
    ).join('')}</tbody>`;

    const foot = totals ? this.buildTotalsRow(columns.length, totals) : '';
    return `<table class="rpt-table">${head}${body}${foot}</table>`;
  }

  private buildTotalsRow(columnCount: number, totals: PrintTotals): string {
    const labelSpan = Math.max(1, totals.labelColSpan ?? 1);
    const remaining = columnCount - labelSpan;
    const cells     = totals.cells.slice(0, remaining);
    const padding   = Array.from({ length: Math.max(0, remaining - cells.length) }, () => '');
    const allCells  = [...cells, ...padding].map((v) =>
      `<td class="ta-end td-bold">${esc(v ?? '')}</td>`
    ).join('');
    return `<tfoot><tr class="rpt-totals"><td class="td-bold" colspan="${labelSpan}">${esc(totals.label ?? 'الإجمالي')}</td>${allCells}</tr></tfoot>`;
  }

  private resolveValue<T>(col: PrintColumn<T>, row: T): unknown {
    return typeof col.key === 'function'
      ? col.key(row)
      : (row as Record<string, unknown>)[col.key as string];
  }

  private formatValue<T>(col: PrintColumn<T>, raw: unknown, row: T): string {
    if (typeof col.format === 'function') return col.format(raw, row);
    if (raw === null || raw === undefined || raw === '') return '—';
    switch (col.format) {
      case 'currency':  return this.formatCurrency(raw);
      case 'date':      return this.formatDate(raw, 'long');
      case 'shortDate': return this.formatDate(raw, 'short');
      case 'percent':   return `${Number(raw)}%`;
      case 'number':    return Number.isFinite(Number(raw)) ? Number(raw).toLocaleString('ar-EG') : '—';
      default:          return String(raw);
    }
  }

  private formatCurrency(raw: unknown): string {
    const n = Number(raw);
    return Number.isFinite(n)
      ? `${Math.round(n).toLocaleString('ar-EG')} ${environment.currency}`
      : '—';
  }

  private formatDate(raw: unknown, kind: 'short' | 'long'): string {
    const date = raw instanceof Date ? raw : new Date(String(raw));
    if (isNaN(date.getTime())) return '—';
    const d = date.getDate(), m = this.months[date.getMonth()], y = date.getFullYear();
    return kind === 'short' ? `${d}/${date.getMonth() + 1}/${y}` : `${d} ${m} ${y}`;
  }

  private formatDateTime(date: Date): string {
    const d  = this.formatDate(date, 'short');
    const hh = String(date.getHours()).padStart(2, '0');
    const mm = String(date.getMinutes()).padStart(2, '0');
    return `${d} — ${hh}:${mm}`;
  }

  private styles(orientation: 'portrait' | 'landscape'): string {
    return `
      @page { size: A4 ${orientation}; margin: 14mm 12mm 16mm 12mm; }
      *, *::before, *::after { box-sizing: border-box; }
      html, body { margin:0; padding:0; background:#fff; color:#111827;
        font-family:"Segoe UI",Tahoma,Cairo,"Noto Sans Arabic",Arial,sans-serif;
        font-size:11pt; line-height:1.45;
        -webkit-print-color-adjust:exact; print-color-adjust:exact; }
      .rpt-header { display:flex; justify-content:space-between; align-items:flex-start;
        gap:16px; border-bottom:2px solid #0f3a6b; padding-bottom:10px; margin-bottom:12px; }
      .rpt-brand { color:#0f3a6b; }
      .rpt-brand-name { font-size:16pt; font-weight:800; }
      .rpt-brand-version { font-size:8.5pt; color:#6b7280; margin-top:2px; }
      .rpt-title-block { text-align:end; }
      .rpt-title { margin:0; font-size:15pt; font-weight:700; }
      .rpt-subtitle { margin:4px 0 0; font-size:9.5pt; color:#6b7280; }
      .rpt-meta { display:flex; flex-wrap:wrap; gap:6px 18px; padding:8px 12px;
        background:#f4f6fa; border:1px solid #e5e7eb; border-radius:6px;
        margin-bottom:14px; font-size:9pt; }
      .rpt-meta-item { display:inline-flex; gap:6px; }
      .rpt-meta-label { color:#6b7280; font-weight:600; }
      .rpt-meta-value { color:#111827; font-weight:700; }
      .rpt-table { width:100%; border-collapse:collapse; table-layout:auto; font-size:9.5pt; }
      .rpt-table thead { display:table-header-group; }
      .rpt-table tfoot { display:table-footer-group; }
      .rpt-table th, .rpt-table td { border:1px solid #d1d5db; padding:6px 8px; vertical-align:middle; word-wrap:break-word; }
      .rpt-table th { background:#0f3a6b; color:#fff; font-weight:700; font-size:9pt; }
      .rpt-table tbody tr { page-break-inside:avoid; break-inside:avoid; }
      .rpt-table tbody tr:nth-child(even) td { background:#fafbfc; }
      .rpt-totals td { background:#eef2f7 !important; border-top:2px solid #0f3a6b; font-weight:700; }
      .td-bold { font-weight:700; }
      .ta-start { text-align:start; } .ta-center { text-align:center; } .ta-end { text-align:end; }
      .rpt-empty { padding:40px 12px; text-align:center; color:#6b7280; border:1px dashed #d1d5db; border-radius:6px; }
      .rpt-footer { margin-top:16px; padding-top:8px; border-top:1px solid #e5e7eb;
        display:flex; justify-content:space-between; font-size:8.5pt; color:#6b7280; }
    `;
  }
}

function esc(value: unknown): string {
  if (value === null || value === undefined) return '';
  return String(value)
    .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;').replace(/'/g, '&#39;');
}
