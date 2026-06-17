import { Injectable, signal } from '@angular/core';
import { generateUUID } from '../utils/uuid.util';

export type ToastType     = 'success' | 'error' | 'warning' | 'info';
export type ToastPosition = 'top-right' | 'top-left' | 'top-center' | 'bottom-right' | 'bottom-left' | 'bottom-center';

export interface ToastAction {
  label: string;
  handler: () => void;
}

export interface Toast {
  id: string;
  type: ToastType;
  title?: string;
  message: string;
  duration: number;
  closable: boolean;
  action?: ToastAction;
  createdAt: number;
  pausedAt: number | null;
  pausedFor: number;
  timerId: ReturnType<typeof setTimeout> | null;
}

export interface ToastOptions {
  title?: string;
  duration?: number;
  closable?: boolean;
  action?: ToastAction;
}

const DEFAULT_DURATION: Record<ToastType, number> = {
  success: 3500,
  info:    3500,
  warning: 5000,
  error:   6000,
};

const MAX_VISIBLE = 5;

@Injectable({ providedIn: 'root' })
export class ToastService {
  private readonly toastsSignal = signal<Toast[]>([]);
  readonly toasts = this.toastsSignal.asReadonly();
  readonly position = signal<ToastPosition>('top-left');

  success(message: string, options?: ToastOptions): string { return this.show('success', message, options); }
  error  (message: string, options?: ToastOptions): string { return this.show('error',   message, options); }
  warning(message: string, options?: ToastOptions): string { return this.show('warning', message, options); }
  info   (message: string, options?: ToastOptions): string { return this.show('info',    message, options); }

  dismiss(id: string): void {
    const list = this.toastsSignal();
    const target = list.find((t) => t.id === id);
    if (target?.timerId) clearTimeout(target.timerId);
    this.toastsSignal.set(list.filter((t) => t.id !== id));
  }

  clear(): void {
    for (const t of this.toastsSignal()) {
      if (t.timerId) clearTimeout(t.timerId);
    }
    this.toastsSignal.set([]);
  }

  pause(id: string): void {
    this.toastsSignal.update((list) =>
      list.map((t) => {
        if (t.id !== id || t.pausedAt !== null || t.duration === 0) return t;
        if (t.timerId) clearTimeout(t.timerId);
        return { ...t, timerId: null, pausedAt: Date.now() };
      }),
    );
  }

  resume(id: string): void {
    this.toastsSignal.update((list) =>
      list.map((t) => {
        if (t.id !== id || t.pausedAt === null) return t;
        const pauseDuration = Date.now() - t.pausedAt;
        const elapsed       = t.pausedAt - t.createdAt - t.pausedFor;
        const remaining     = Math.max(200, t.duration - elapsed);
        const timerId       = setTimeout(() => this.dismiss(id), remaining);
        return { ...t, timerId, pausedAt: null, pausedFor: t.pausedFor + pauseDuration };
      }),
    );
  }

  private show(type: ToastType, message: string, options?: ToastOptions): string {
    const dup = this.toastsSignal().find((t) => t.type === type && t.message === message);
    if (dup) return dup.id;

    const id       = generateUUID();
    const duration = options?.duration ?? DEFAULT_DURATION[type];
    const toast: Toast = {
      id, type, message,
      title:    options?.title,
      duration,
      closable:  options?.closable ?? true,
      action:    options?.action,
      createdAt: Date.now(),
      pausedAt:  null,
      pausedFor: 0,
      timerId:   duration > 0 ? setTimeout(() => this.dismiss(id), duration) : null,
    };

    this.toastsSignal.update((list) => {
      const next = [...list, toast];
      if (next.length > MAX_VISIBLE) {
        const dropped = next.shift();
        if (dropped?.timerId) clearTimeout(dropped.timerId);
      }
      return next;
    });

    return id;
  }
}
