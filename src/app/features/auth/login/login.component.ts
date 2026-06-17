import { Component, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { NgIf } from '@angular/common';
import { AuthService } from '../../../core/services/auth.service';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [FormsModule, RouterLink, NgIf],
  template: `
    <div class="auth-wrap">
      <div class="card auth-card">
        <h1 class="page-title">ログイン</h1>

        <form (ngSubmit)="onSubmit()">
          <div class="form-group">
            <label for="email">メールアドレス</label>
            <input
              id="email"
              type="email"
              [(ngModel)]="email"
              name="email"
              required
              placeholder="example@email.com"
            />
          </div>

          <div class="form-group">
            <label for="password">パスワード</label>
            <input
              id="password"
              type="password"
              [(ngModel)]="password"
              name="password"
              required
              placeholder="パスワード"
            />
          </div>

          <p class="error-message" *ngIf="errorMessage()">{{ errorMessage() }}</p>

          <button type="submit" class="btn btn-primary" style="width:100%" [disabled]="loading()">
            {{ loading() ? 'ログイン中...' : 'ログイン' }}
          </button>
        </form>

        <p class="auth-link">
          アカウントをお持ちでない方は <a routerLink="/register">新規登録</a>
        </p>
      </div>
    </div>
  `,
  styles: [`
    .auth-wrap { display: flex; justify-content: center; padding: 60px 20px; }
    .auth-card { width: 100%; max-width: 420px; }
    .auth-link { margin-top: 20px; text-align: center; font-size: 13px; color: #868e96; }
  `],
})
export class LoginComponent {
  email = '';
  password = '';
  loading = signal(false);
  errorMessage = signal('');

  private auth = inject(AuthService);
  private router = inject(Router);

  async onSubmit(): Promise<void> {
    if (!this.email || !this.password) return;
    this.loading.set(true);
    this.errorMessage.set('');

    try {
      await this.auth.login(this.email, this.password);
      this.router.navigate(['/products']);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'ログインに失敗しました';
      this.errorMessage.set(msg);
    } finally {
      this.loading.set(false);
    }
  }
}
