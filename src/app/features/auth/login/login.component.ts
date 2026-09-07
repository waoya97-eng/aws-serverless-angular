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
        <form *ngIf="!isNewPasswordRequired()" (ngSubmit)="onSubmit()" novalidate>
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
              minlength="8"
              placeholder="パスワード"
            />
          </div>

          <p class="error-message" *ngIf="errorMessage()">{{ errorMessage() }}</p>

          <button type="submit" class="btn btn-primary" style="width:100%" [disabled]="loading()">
            {{ loading() ? 'ログイン中...' : 'ログイン' }}
          </button>
        </form>

        <!-- 初回パスワード変更フォーム -->
        <form *ngIf="isNewPasswordRequired()" (ngSubmit)="onNewPasswordSubmit()" novalidate>
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
              minlength="8"
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
      this.navigateByRole();
    }
  }

  private validate(): boolean {
    const trimmedEmail = this.email.trim();
    if (!trimmedEmail) {
      this.errorMessage.set('メールアドレスを入力してください');
      return false;
    }
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(trimmedEmail)) {
      this.errorMessage.set('有効なメールアドレスを入力してください');
      return false;
    }
    if (!this.password) {
      this.errorMessage.set('パスワードを入力してください');
      return false;
    }
    if (this.password.length < 8) {
      this.errorMessage.set('パスワードは8文字以上で入力してください');
      return false;
    }
    return true;
  }

  private navigateByRole(): void {
    if (this.auth.isSeller()) {
      this.router.navigate(['/seller/products']);
    } else {
      this.router.navigate(['/products']);
    }
  }

  async onSubmit(): Promise<void> {
    this.errorMessage.set('');
    if (!this.validate()) return;

    this.loading.set(true);

    try {
      const res = await this.auth.login(this.email.trim(), this.password);
      if (res.requiresNewPassword) {
        this.isNewPasswordRequired.set(true);
      } else {
        this.navigateByRole();
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'ログインに失敗しました';
      this.errorMessage.set(msg);
    } finally {
      this.loading.set(false);
    }
  }

  async onNewPasswordSubmit(): Promise<void> {
    this.errorMessage.set('');
    if (!this.newPassword) {
      this.errorMessage.set('新しいパスワードを入力してください');
      return;
    }
    if (this.newPassword.length < 8) {
      this.errorMessage.set('パスワードは8文字以上で入力してください');
      return;
    }

    this.loading.set(true);

    try {
      await this.auth.confirmNewPassword(this.newPassword);
      this.navigateByRole();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'パスワードの設定に失敗しました';
      this.errorMessage.set(msg);
    } finally {
      this.loading.set(false);
    }
  }
}
