import { ChangeDetectionStrategy, Component, OnInit, inject } from '@angular/core';
import { Router } from '@angular/router';
import { AuthService } from '../../../../core/services/auth.service';

@Component({
  selector: 'app-splash-page',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './splash-page.component.html',
  styleUrl: './splash-page.component.scss',
})
export class SplashPageComponent implements OnInit {
  private readonly auth   = inject(AuthService);
  private readonly router = inject(Router);

  ngOnInit(): void {
    setTimeout(() => {
      const target = this.auth.isLoggedIn() ? '/dashboard' : '/auth/login';
      this.router.navigate([target], { replaceUrl: true });
    }, 1000);
  }
}
