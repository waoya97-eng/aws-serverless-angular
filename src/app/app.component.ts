import { Component, OnInit, inject } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { NgIf } from '@angular/common';
import { AuthService } from './core/services/auth.service';
import { ErrorService } from './core/services/error.service';
import { HeaderComponent } from './shared/components/header/header.component';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [RouterOutlet, HeaderComponent, NgIf],
  template: `
    <!-- ページ上部バナー（赤）: 403, 500, ネットワークエラー等 -->
    <div *ngIf="errorService.bannerMessage()" class="top-error-banner" role="alert">
      <div class="banner-content">
        <span class="banner-icon">⚠️</span>
        <span class="banner-text">{{ errorService.bannerMessage() }}</span>
      </div>
      <button
        type="button"
        class="btn-close-banner"
        (click)="errorService.clearBanner()"
        aria-label="閉じる"
      >
        ✕
      </button>
    </div>

    <ng-container *ngIf="!auth.isLoading(); else loading">
      <app-header />
      <main class="main-content">
        <router-outlet />
      </main>
    </ng-container>
    <ng-template #loading>
      <div class="loading">読み込み中...</div>
    </ng-template>
  `,
  styles: [`
    .main-content { max-width: 1200px; margin: 0 auto; padding: 24px 20px; }
    .loading { display: flex; justify-content: center; align-items: center; height: 100vh; font-size: 18px; color: #888; }
  `],
})
export class AppComponent implements OnInit {
  auth = inject(AuthService);
  errorService = inject(ErrorService);

  ngOnInit(): void {
    this.auth.initialize();
  }
}
