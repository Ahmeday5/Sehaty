import {
  Directive, Input, OnInit, TemplateRef, ViewContainerRef, inject,
} from '@angular/core';
import { AuthService } from '../../core/services/auth.service';
import { UserRole } from '../../core/models/auth.model';

/**
 * Structural directive that renders its host element only when the
 * current user has at least one of the specified roles.
 *
 * Usage:
 *   <button *appHasRole="'Admin'">...</button>
 *   <button *appHasRole="['Admin', 'Editor']">...</button>
 */
@Directive({ selector: '[appHasRole]', standalone: true })
export class HasRoleDirective implements OnInit {
  @Input({ required: true, alias: 'appHasRole' })
  roles!: UserRole | UserRole[];

  private readonly auth = inject(AuthService);
  private readonly tmpl = inject(TemplateRef<unknown>);
  private readonly vcr  = inject(ViewContainerRef);

  ngOnInit(): void {
    const allowed = Array.isArray(this.roles) ? this.roles : [this.roles];
    if (this.auth.hasRole(...allowed)) {
      this.vcr.createEmbeddedView(this.tmpl);
    }
  }
}
