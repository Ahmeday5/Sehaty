import { Injectable, NgZone, inject, signal } from '@angular/core';

export type ConfirmType = 'danger' | 'warning' | 'info';

export interface ConfirmConfig {
  title?: string;
  message: string;
  confirmText?: string;
  cancelText?: string;
  type?: ConfirmType;
}

interface ConfirmState extends ConfirmConfig {
  resolve: (value: boolean) => void;
}

@Injectable({ providedIn: 'root' })
export class ConfirmService {
  readonly state = signal<ConfirmState | null>(null);
  private readonly zone = inject(NgZone);

  confirm(config: ConfirmConfig): Promise<boolean> {
    return new Promise<boolean>((resolve) => {
      // zone.run() ensures Angular CD fires immediately after state.set(),
      // even when called inside an async function that has a pending await.
      this.zone.run(() => {
        this.state.set({ ...config, resolve });
      });
    });
  }

  /** Called by the dialog component when the user clicks confirm or cancel. */
  respond(value: boolean): void {
    const s = this.state();
    if (s) {
      s.resolve(value);
      this.state.set(null);
    }
  }
}
