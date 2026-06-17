import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { Location } from '@angular/common';
import { RouterLink } from '@angular/router';
import { AuthService } from '../../../../core/services/auth.service';

@Component({
  selector: 'app-access-denied-page',
  standalone: true,
  imports: [RouterLink],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './access-denied-page.component.html',
  styleUrl: './access-denied-page.component.scss',
})
export class AccessDeniedPageComponent {
  protected readonly auth     = inject(AuthService);
  private  readonly location  = inject(Location);

  goBack(): void { this.location.back(); }
}
