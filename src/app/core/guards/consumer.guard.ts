import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { AuthService } from '../services/auth.service';

/** seller グループのユーザーを /seller/products にリダイレクトするガード（Consumer のみ許可） */
export const consumerGuard: CanActivateFn = async () => {
  const auth = inject(AuthService);
  const router = inject(Router);

  await auth.initialize();

  if (!auth.isSeller()) {
    return true;
  }
  return router.createUrlTree(['/seller/products']);
};
