import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { LoaderService } from '../../../core/services/loader.service';

@Component({
  selector: 'app-loader',
  standalone: true,
  imports: [CommonModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    @if (loader.isLoading()) {
      <div class="loader-overlay" role="status" aria-label="جاري التحميل">
        <div class="loader-spinner">
          <div class="spinner-ring"></div>
          <div class="spinner-ring"></div>
          <div class="spinner-ring"></div>
        </div>
      </div>
    }
  `,
  styles: [`
    .loader-overlay {
      position: fixed;
      inset: 0;
      z-index: 9999;
      display: flex;
      align-items: center;
      justify-content: center;
      background: rgba(0, 0, 0, 0.18);
      backdrop-filter: blur(2px);
      animation: fade-in 0.15s ease;
    }
    .loader-spinner {
      position: relative;
      width: 48px;
      height: 48px;
    }
    .spinner-ring {
      position: absolute;
      inset: 0;
      border: 3px solid transparent;
      border-top-color: var(--main-color, #14c8c7);
      border-radius: 50%;
      animation: spin 0.9s linear infinite;
    }
    .spinner-ring:nth-child(2) {
      inset: 8px;
      border-top-color: var(--second-color, #1a9e6e);
      animation-duration: 1.1s;
    }
    .spinner-ring:nth-child(3) {
      inset: 16px;
      border-top-color: var(--main-color, #14c8c7);
      animation-duration: 1.4s;
    }
    @keyframes spin    { to { transform: rotate(360deg); } }
    @keyframes fade-in { from { opacity: 0; } to { opacity: 1; } }
  `],
})
export class LoaderComponent {
  protected readonly loader = inject(LoaderService);
}
