import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { AuthService } from '../services/auth.service';
import { ErrorService } from '../services/error.service';

/** seller グループ以外のユーザーを /products にリダイレクトし、403 バナーを表示するガード */
export const sellerGuard: CanActivateFn = async () => {
  const auth = inject(AuthService);
  const router = inject(Router);
  const errorService = inject(ErrorService);

  await auth.initialize();

  if (auth.isSeller()) {
    return true;
  }

  // 403 権限なし: ページ上部バナー（赤）
  errorService.showForbidden();
  return router.createUrlTree(['/products']);
};
