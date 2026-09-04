import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { AuthService } from '../services/auth.service';

/** ログイン済みユーザーを /home にリダイレクトするガード（未ログインユーザー専用ルート用） */
export const guestGuard: CanActivateFn = async () => {
  const auth = inject(AuthService);
  const router = inject(Router);

  await auth.initialize();

  if (auth.isAuthenticated()) {
    return router.createUrlTree(['/home']);
  }
  return true;
};
