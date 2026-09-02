import { Injectable, signal, computed } from '@angular/core';
import { Amplify } from 'aws-amplify';
import {
  signIn,
  signOut,
  confirmSignIn,
  getCurrentUser,
  fetchAuthSession,
} from 'aws-amplify/auth';
import { environment } from '../../../environments/environment';

Amplify.configure({
  Auth: {
    Cognito: {
      userPoolId: environment.cognito.userPoolId,
      userPoolClientId: environment.cognito.userPoolClientId,
    },
  },
});

@Injectable({ providedIn: 'root' })
export class AuthService {
  private _userId = signal<string>('');
  private _userGroup = signal<string>('');
  private _isLoading = signal<boolean>(true);

  readonly userId = this._userId.asReadonly();
  readonly userGroup = this._userGroup.asReadonly();
  readonly isLoading = this._isLoading.asReadonly();
  readonly isAuthenticated = computed(() => this._userId() !== '');
  readonly isSeller = computed(() => this._userGroup() === 'seller');

  async initialize(): Promise<void> {
    try {
      const user = await getCurrentUser();
      const session = await fetchAuthSession();
      const groups =
        (session.tokens?.idToken?.payload['cognito:groups'] as string[]) ?? [];
      this._userId.set(user.userId);
      this._userGroup.set(groups[0] ?? 'consumer');
    } catch {
      this._userId.set('');
      this._userGroup.set('');
    } finally {
      this._isLoading.set(false);
    }
  }

  async login(email: string, password: string): Promise<{ requiresNewPassword?: boolean }> {
    const res = await signIn({ username: email, password });
    if (!res.isSignedIn) {
      if (res.nextStep.signInStep === 'CONFIRM_SIGN_IN_WITH_NEW_PASSWORD_REQUIRED') {
        return { requiresNewPassword: true };
      }
      throw new Error(`ログインが完了していません: ${res.nextStep.signInStep}`);
    }
    await this.initialize();
    return { requiresNewPassword: false };
  }

  async confirmNewPassword(newPassword: string): Promise<void> {
    const res = await confirmSignIn({ challengeResponse: newPassword });
    if (!res.isSignedIn) {
      throw new Error(`パスワード設定後のログインに失敗しました: ${res.nextStep.signInStep}`);
    }
    await this.initialize();
  }

  async logout(): Promise<void> {
    await signOut();
    this._userId.set('');
    this._userGroup.set('');
  }

  async getToken(): Promise<string> {
    const session = await fetchAuthSession();
    return session.tokens?.idToken?.toString() ?? '';
  }

  // TODO: 新規登録・確認コードの実装
}
