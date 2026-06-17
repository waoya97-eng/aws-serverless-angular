import { Component, OnInit, inject } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { NgIf } from '@angular/common';
import { AuthService } from './core/services/auth.service';
import { HeaderComponent } from './shared/components/header/header.component';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [RouterOutlet, HeaderComponent, NgIf],
  template: `
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

  ngOnInit(): void {
    this.auth.initialize();
  }
}
