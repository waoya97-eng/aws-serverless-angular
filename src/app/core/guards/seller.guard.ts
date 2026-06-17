import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { AuthService } from '../services/auth.service';

/** seller グループ以外のユーザーを /products にリダイレクトするガード */
export const sellerGuard: CanActivateFn = () => {
  const auth = inject(AuthService);
  const router = inject(Router);

  if (auth.isSeller()) {
    return true;
  }
  return router.createUrlTree(['/products']);
};
