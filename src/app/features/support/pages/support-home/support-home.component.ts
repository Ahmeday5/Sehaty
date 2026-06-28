import {
  ChangeDetectionStrategy,
  Component,
  ElementRef,
  OnInit,
  ViewChild,
  computed,
  inject,
  signal,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { SupportService } from '../../services/support.service';
import { ToastService } from '../../../../core/services/toast.service';
import { KpiStripComponent } from '../../../../shared/components/kpi-strip/kpi-strip.component';
import { KpiItem } from '../../../../shared/components/kpi-strip/kpi-strip.model';
import {
  SupportKpiSummary,
  SupportTicket,
  TicketDetail,
  TicketFilter,
  TicketPriority,
  TicketStatus,
  TicketPartyType,
} from '../../models/support.model';

@Component({
  selector: 'app-support-home',
  standalone: true,
  imports: [CommonModule, FormsModule, KpiStripComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './support-home.component.html',
  styleUrl: './support-home.component.scss',
})
export class SupportHomeComponent implements OnInit {
  private readonly svc   = inject(SupportService);
  private readonly toast = inject(ToastService);

  @ViewChild('messagesEnd') messagesEnd!: ElementRef<HTMLDivElement>;

  // ── Loading ──────────────────────────────────────────────────────────────────
  protected readonly loadingKpi     = signal(true);
  protected readonly loadingTickets = signal(true);
  protected readonly loadingDetail  = signal(false);
  protected readonly sendingReply   = signal(false);
  protected readonly closingTicket  = signal(false);

  // ── Data ─────────────────────────────────────────────────────────────────────
  protected readonly kpiSummary    = signal<SupportKpiSummary | null>(null);
  protected readonly activeTicket  = signal<TicketDetail | null>(null);
  protected readonly lastUpdate    = signal<Date | null>(null);
  protected replyText = '';

  private allTickets: SupportTicket[] = [];

  // ── Filter ───────────────────────────────────────────────────────────────────
  protected readonly filter = signal<TicketFilter>({
    partyType: 'all',
    priority:  'all',
    search:    '',
  });
  protected readonly filtered = signal<SupportTicket[]>([]);

  // ── KPI strip ────────────────────────────────────────────────────────────────
  protected readonly kpiItems = computed<KpiItem[]>(() => {
    const s = this.kpiSummary();
    return [
      { icon: 'fa-circle-exclamation', value: s ? String(s.urgentCount)       : '—', label: 'عاجلة',                variant: 'red'     },
      { icon: 'fa-clock',              value: s ? String(s.openCount)          : '—', label: 'مفتوحة',              variant: 'amber'   },
      { icon: 'fa-comment-dots',       value: s ? String(s.inProgressCount)    : '—', label: 'قيد الرد',            variant: 'primary' },
      { icon: 'fa-circle-check',       value: s ? String(s.resolvedThisMonth)  : '—', label: 'محلولة هذا الشهر',   variant: 'green'   },
    ];
  });

  ngOnInit(): void {
    this.loadKpi();
    this.loadTickets();
  }

  // ── Select ticket ─────────────────────────────────────────────────────────
  protected selectTicket(ticket: SupportTicket): void {
    if (this.activeTicket()?.id === ticket.id) return;
    this.loadingDetail.set(true);
    this.replyText = '';
    this.svc.getTicketDetail(ticket.id).subscribe({
      next: (detail) => {
        this.activeTicket.set(detail);
        this.loadingDetail.set(false);
        setTimeout(() => this.scrollToBottom(), 50);
      },
      error: () => this.loadingDetail.set(false),
    });
  }

  // ── Send reply ────────────────────────────────────────────────────────────
  protected sendReply(): void {
    const body = this.replyText.trim();
    const ticket = this.activeTicket();
    if (!body || !ticket) return;

    this.sendingReply.set(true);
    this.svc.sendReply(ticket.id, body).subscribe({
      next: (msg) => {
        this.toast.success(msg);
        this.activeTicket.update((t) => t ? {
          ...t,
          messages: [
            ...t.messages,
            { id: Date.now(), sender: 'فريق الدعم', senderType: 'support', body, time: 'الآن' },
          ],
        } : t);
        this.replyText = '';
        this.sendingReply.set(false);
        setTimeout(() => this.scrollToBottom(), 50);
      },
      error: () => {
        this.toast.error('فشل إرسال الرد');
        this.sendingReply.set(false);
      },
    });
  }

  // ── Close ticket ──────────────────────────────────────────────────────────
  protected closeTicket(): void {
    const ticket = this.activeTicket();
    if (!ticket) return;

    this.closingTicket.set(true);
    this.svc.closeTicket(ticket.id).subscribe({
      next: (msg) => {
        this.toast.success(msg);
        this.activeTicket.update((t) => t ? { ...t, status: 'closed' } : t);
        this.filtered.update((list) => list.filter((tk) => tk.id !== ticket.id));
        this.closingTicket.set(false);
        this.reloadKpi();
      },
      error: () => {
        this.toast.error('فشل إغلاق التذكرة');
        this.closingTicket.set(false);
      },
    });
  }

  // ── Filters ───────────────────────────────────────────────────────────────
  protected onPartyFilter(val: string): void {
    this.filter.update((f) => ({ ...f, partyType: val as TicketFilter['partyType'] }));
    this.applyFilter();
  }

  protected onPriorityFilter(val: string): void {
    this.filter.update((f) => ({ ...f, priority: val as TicketFilter['priority'] }));
    this.applyFilter();
  }

  protected onSearch(q: string): void {
    this.filter.update((f) => ({ ...f, search: q }));
    this.applyFilter();
  }

  // ── Refresh ───────────────────────────────────────────────────────────────
  protected refresh(): void { this.loadKpi(); this.loadTickets(); }

  // ── Helpers ───────────────────────────────────────────────────────────────
  protected isActive(ticket: SupportTicket): boolean {
    return this.activeTicket()?.id === ticket.id;
  }

  protected priorityLabel(p: TicketPriority): string {
    return p === 'urgent' ? 'عاجل' : p === 'normal' ? 'عادي' : 'منخفض';
  }

  protected priorityClass(p: TicketPriority): string {
    return p === 'urgent' ? 'spt-priority--urgent' : p === 'normal' ? 'spt-priority--normal' : 'spt-priority--low';
  }

  protected statusLabel(s: TicketStatus): string {
    return s === 'open' ? 'مفتوحة' : s === 'in_progress' ? 'قيد الرد' : s === 'resolved' ? 'محلولة' : 'مغلقة';
  }

  protected statusClass(s: TicketStatus): string {
    return s === 'open' ? 'spt-status--open' : s === 'in_progress' ? 'spt-status--progress' : s === 'resolved' ? 'spt-status--resolved' : 'spt-status--closed';
  }

  protected partyBadgeClass(p: TicketPartyType): string {
    return p === 'patient' ? 'badge-blue' : p === 'doctor' ? 'badge-teal' : 'badge-purple';
  }

  protected partyLabel(p: TicketPartyType): string {
    return p === 'patient' ? 'مريض' : p === 'doctor' ? 'طبيب' : 'صيدلية';
  }

  protected ticketBorderClass(ticket: SupportTicket): string {
    return ticket.priority === 'urgent' ? 'spt-ticket--urgent' : '';
  }

  protected isTicketClosed(): boolean {
    const t = this.activeTicket();
    return t?.status === 'closed' || t?.status === 'resolved';
  }

  protected onReplyKey(event: KeyboardEvent): void {
    if (event.key === 'Enter' && (event.ctrlKey || event.metaKey)) {
      this.sendReply();
    }
  }

  // ── Private ───────────────────────────────────────────────────────────────
  private loadKpi(): void {
    this.loadingKpi.set(true);
    this.svc.getKpiSummary().subscribe({
      next: (data) => { this.kpiSummary.set(data); this.loadingKpi.set(false); this.lastUpdate.set(new Date()); },
      error: () => this.loadingKpi.set(false),
    });
  }

  private reloadKpi(): void { this.loadKpi(); }

  private loadTickets(): void {
    this.loadingTickets.set(true);
    this.svc.getTickets().subscribe({
      next: (data) => {
        this.allTickets = data;
        this.applyFilter();
        this.loadingTickets.set(false);
      },
      error: () => this.loadingTickets.set(false),
    });
  }

  private applyFilter(): void {
    const { partyType, priority, search } = this.filter();
    let result = [...this.allTickets];

    if (partyType !== 'all') result = result.filter((t) => t.partyType === partyType);
    if (priority  !== 'all') result = result.filter((t) => t.priority  === priority);
    if (search.trim()) {
      const q = search.trim().toLowerCase();
      result = result.filter(
        (t) => t.title.toLowerCase().includes(q) || t.partyName.toLowerCase().includes(q),
      );
    }

    this.filtered.set(result);
  }

  private scrollToBottom(): void {
    this.messagesEnd?.nativeElement?.scrollIntoView({ behavior: 'smooth' });
  }
}
