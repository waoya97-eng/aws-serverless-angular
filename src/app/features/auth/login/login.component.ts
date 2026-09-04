import { Component, OnInit, inject, signal } from '@angular/core';
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
        <h1 class="page-title">{{ isNewPasswordRequired() ? '新しいパスワードの設定' : 'ログイン' }}</h1>

        <!-- 通常ログインフォーム -->
        <form *ngIf="!isNewPasswordRequired()" (ngSubmit)="onSubmit()">
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

        <!-- 初回パスワード変更フォーム -->
        <form *ngIf="isNewPasswordRequired()" (ngSubmit)="onNewPasswordSubmit()">
          <p style="font-size: 13px; color: #666; margin-bottom: 16px;">
            初回ログインのため、新しいパスワードを設定してください。
          </p>
          <div class="form-group">
            <label for="newPassword">新しいパスワード</label>
            <input
              id="newPassword"
              type="password"
              [(ngModel)]="newPassword"
              name="newPassword"
              required
              placeholder="8文字以上（大文字・小文字・数字）"
            />
          </div>

          <p class="error-message" *ngIf="errorMessage()">{{ errorMessage() }}</p>

          <button type="submit" class="btn btn-primary" style="width:100%" [disabled]="loading()">
            {{ loading() ? '設定中...' : 'パスワードを設定してログイン' }}
          </button>
        </form>

        <p class="auth-link" *ngIf="!isNewPasswordRequired()">
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
export class LoginComponent implements OnInit {
  email = '';
  password = '';
  newPassword = '';
  isNewPasswordRequired = signal(false);
  loading = signal(false);
  errorMessage = signal('');

  private auth = inject(AuthService);
  private router = inject(Router);

  async ngOnInit(): Promise<void> {
    await this.auth.initialize();
    if (this.auth.isAuthenticated()) {
      this.router.navigate(['/home']);
    }
  }

  async onSubmit(): Promise<void> {
    if (!this.email || !this.password) return;
    this.loading.set(true);
    this.errorMessage.set('');

    try {
      const res = await this.auth.login(this.email, this.password);
      if (res.requiresNewPassword) {
        this.isNewPasswordRequired.set(true);
      } else {
        this.router.navigate(['/home']);
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'ログインに失敗しました';
      this.errorMessage.set(msg);
    } finally {
      this.loading.set(false);
    }
  }

  async onNewPasswordSubmit(): Promise<void> {
    if (!this.newPassword) return;
    this.loading.set(true);
    this.errorMessage.set('');

    try {
      await this.auth.confirmNewPassword(this.newPassword);
      this.router.navigate(['/home']);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'パスワードの設定に失敗しました';
      this.errorMessage.set(msg);
    } finally {
      this.loading.set(false);
    }
  }
}
