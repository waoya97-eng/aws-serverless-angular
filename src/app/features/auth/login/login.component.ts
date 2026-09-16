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
              [class.is-invalid]="fieldErrors()['email']"
              (input)="clearFieldError('email')"
              placeholder="example@email.com"
            />
            <!-- 入力フィールド直下の赤字エラー -->
            <span class="field-error" *ngIf="fieldErrors()['email']">
              {{ fieldErrors()['email'] }}
            </span>
          </div>

          <div class="form-group">
            <label for="password">パスワード</label>
            <input
              id="password"
              type="password"
              [(ngModel)]="password"
              name="password"
              [class.is-invalid]="fieldErrors()['password']"
              (input)="clearFieldError('password')"
              placeholder="パスワード"
            />
            <!-- 入力フィールド直下の赤字エラー -->
            <span class="field-error" *ngIf="fieldErrors()['password']">
              {{ fieldErrors()['password'] }}
            </span>
          </div>

          <!-- 全体エラー（認証失敗等） -->
          <p class="error-message" *ngIf="errorMessage()">{{ errorMessage() }}</p>

          <!-- 送信ボタン: 送信中は非活性 + スピナー表示 -->
          <button type="submit" class="btn btn-primary btn-submit" [disabled]="loading()">
            <span *ngIf="loading()" class="btn-loading-content">
              <span class="spinner" aria-hidden="true"></span>
              <span>ログイン中...</span>
            </span>
            <span *ngIf="!loading()">ログイン</span>
          </button>
        </form>

        <!-- 初回パスワード変更フォーム -->
        <form *ngIf="isNewPasswordRequired()" (ngSubmit)="onNewPasswordSubmit()" novalidate>
          <p class="hint-text">
            初回ログインのため、新しいパスワードを設定してください。
          </p>
          <div class="form-group">
            <label for="newPassword">新しいパスワード</label>
            <input
              id="newPassword"
              type="password"
              [(ngModel)]="newPassword"
              name="newPassword"
              [class.is-invalid]="fieldErrors()['newPassword']"
              (input)="clearFieldError('newPassword')"
              placeholder="8文字以上（大文字・小文字・数字）"
            />
            <!-- 入力フィールド直下の赤字エラー -->
            <span class="field-error" *ngIf="fieldErrors()['newPassword']">
              {{ fieldErrors()['newPassword'] }}
            </span>
          </div>

          <p class="error-message" *ngIf="errorMessage()">{{ errorMessage() }}</p>

          <!-- 送信ボタン: 送信中は非活性 + スピナー表示 -->
          <button type="submit" class="btn btn-primary btn-submit" [disabled]="loading()">
            <span *ngIf="loading()" class="btn-loading-content">
              <span class="spinner" aria-hidden="true"></span>
              <span>設定中...</span>
            </span>
            <span *ngIf="!loading()">パスワードを設定してログイン</span>
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
    .hint-text { font-size: 13px; color: #666; margin-bottom: 16px; }
    .btn-submit { width: 100%; margin-top: 8px; }
  `],
})
export class LoginComponent implements OnInit {
  email = '';
  password = '';
  newPassword = '';
  isNewPasswordRequired = signal(false);
  loading = signal(false);
  errorMessage = signal('');
  fieldErrors = signal<Record<string, string>>({});

  private auth = inject(AuthService);
  private router = inject(Router);

  async ngOnInit(): Promise<void> {
    await this.auth.initialize();
    if (this.auth.isAuthenticated()) {
      this.navigateByRole();
    }
  }

  clearFieldError(field: string): void {
    const current = { ...this.fieldErrors() };
    if (current[field]) {
      delete current[field];
      this.fieldErrors.set(current);
    }
  }

  private validate(): boolean {
    const errors: Record<string, string> = {};
    const trimmedEmail = this.email.trim();

    if (!trimmedEmail) {
      errors['email'] = 'メールアドレスを入力してください';
    } else {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(trimmedEmail)) {
        errors['email'] = '有効なメールアドレスを入力してください';
      }
    }

    if (!this.password) {
      errors['password'] = 'パスワードを入力してください';
    } else if (this.password.length < 8) {
      errors['password'] = 'パスワードは8文字以上で入力してください';
    }

    this.fieldErrors.set(errors);
    return Object.keys(errors).length === 0;
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
    const errors: Record<string, string> = {};

    if (!this.newPassword) {
      errors['newPassword'] = '新しいパスワードを入力してください';
    } else if (this.newPassword.length < 8) {
      errors['newPassword'] = 'パスワードは8文字以上で入力してください';
    }

    this.fieldErrors.set(errors);
    if (Object.keys(errors).length > 0) return;

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
