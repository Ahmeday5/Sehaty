import { Injectable, inject, signal, computed } from '@angular/core';
import { StorageService } from './storage.service';
import { PharmacySession } from '../models/pharmacy-auth.model';

const TOKEN_KEY = 'sehaty_pharmacy_token';
const SESSION_KEY = 'sehaty_pharmacy_session';
const PHONE_KEY = 'sehaty_pharmacy_saved_phone';

/**
 * Fully isolated from AuthService (admin) — separate storage keys, separate
 * session signal — so a pharmacy-owner login never collides with an admin session.
 */
@Injectable({ providedIn: 'root' })
export class PharmacyAuthService {
  private readonly storage = inject(StorageService);

  private readonly _pharmacy = signal<PharmacySession | null>(this.loadSession());

  readonly currentPharmacy = this._pharmacy.asReadonly();
  readonly isLoggedIn = computed(() => !!this._pharmacy());

  login(session: PharmacySession, rememberMe = false): void {
    this._pharmacy.set(session);
    this.storage.setJson(SESSION_KEY, session);
    this.storage.set(TOKEN_KEY, session.token);
    if (rememberMe) {
      this.storage.set(PHONE_KEY, session.phone);
    } else {
      this.storage.remove(PHONE_KEY);
    }
  }

  /** Updates the cached session (e.g. after refetching /profile) without touching the token. */
  updateSession(session: PharmacySession): void {
    const token = this.getToken() ?? session.token;
    const merged = { ...session, token };
    this._pharmacy.set(merged);
    this.storage.setJson(SESSION_KEY, merged);
  }

  logout(): void {
    this._pharmacy.set(null);
    this.storage.remove(TOKEN_KEY);
    this.storage.remove(SESSION_KEY);
  }

  getToken(): string | null {
    return this.storage.get(TOKEN_KEY);
  }

  getSavedPhone(): string | null {
    return this.storage.get(PHONE_KEY);
  }

  private loadSession(): PharmacySession | null {
    const token = this.storage.get(TOKEN_KEY);
    if (!token) return null;
    const raw = this.storage.getJson<PharmacySession>(SESSION_KEY);
    if (!raw) return null;
    return { ...raw, token };
  }
}
