import { Injectable, inject, signal, computed } from '@angular/core';
import { StorageService } from './storage.service';
import { User, UserRole } from '../models/auth.model';

const TOKEN_KEY = 'sehaty_token';
const USER_KEY  = 'sehaty_user';
const EMAIL_KEY = 'sehaty_saved_email';

@Injectable({ providedIn: 'root' })
export class AuthService {
  private readonly storage = inject(StorageService);

  private readonly _user = signal<User | null>(this.loadUser());

  readonly currentUser  = this._user.asReadonly();
  readonly isLoggedIn   = computed(() => !!this._user());

  readonly permissionSet = computed<Set<UserRole>>(() => {
    const u = this._user();
    return u ? new Set(u.roles) : new Set<UserRole>();
  });

  // ── Auth actions ──────────────────────────────────────────────

  login(response: Omit<User, 'name' | 'role'>): void {
    const user = this.toUser(response);
    this._user.set(user);
    this.storage.setJson(USER_KEY, user);
    this.storage.set(TOKEN_KEY, user.token);
    if (response.rememberMe) {
      this.storage.set(EMAIL_KEY, user.email);
    } else {
      this.storage.remove(EMAIL_KEY);
    }
  }

  logout(): void {
    this._user.set(null);
    this.storage.remove(TOKEN_KEY);
    this.storage.remove(USER_KEY);
  }

  // ── Token / session ───────────────────────────────────────────

  getToken(): string | null { return this.storage.get(TOKEN_KEY); }
  getSavedEmail(): string | null { return this.storage.get(EMAIL_KEY); }

  // ── Role checks ───────────────────────────────────────────────

  primaryRole(): UserRole | null {
    return this._user()?.roles?.[0] ?? null;
  }

  /** Returns true if the user has ALL of the provided roles. */
  hasRole(...roles: UserRole[]): boolean {
    const u = this._user();
    if (!u) return false;
    return roles.every((r) => u.roles.includes(r));
  }

  /** Returns true if the user has AT LEAST ONE of the provided roles. */
  hasAnyRole(...roles: UserRole[]): boolean {
    const u = this._user();
    if (!u) return false;
    return roles.some((r) => u.roles.includes(r));
  }

  /** Returns true if the user's role set contains the given role string. */
  hasPermission(role: UserRole): boolean {
    return this.permissionSet().has(role);
  }

  /** Returns true if the user's role set contains any of the given role strings. */
  hasAnyPermission(roles: UserRole[]): boolean {
    const set = this.permissionSet();
    return roles.some((r) => set.has(r));
  }

  // ── Internals ─────────────────────────────────────────────────

  private loadUser(): User | null {
    const token = this.storage.get(TOKEN_KEY);
    if (!token) return null;
    const raw = this.storage.getJson<Omit<User, 'name' | 'role'>>(USER_KEY);
    if (!raw) return null;
    try { return this.toUser(raw); } catch { return null; }
  }

  private toUser(raw: Omit<User, 'name' | 'role'>): User {
    return {
      ...raw,
      role: raw.roles?.[0],
      name: `${raw.firstName} ${raw.lastName}`.trim(),
    };
  }
}
