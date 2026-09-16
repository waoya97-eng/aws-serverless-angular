import { HttpInterceptorFn, HttpErrorResponse } from '@angular/common/http';
import { inject } from '@angular/core';
import { catchError, throwError } from 'rxjs';
import { ErrorService } from '../services/error.service';
import { AuthService } from '../services/auth.service';

/**
 * 共通エラーハンドリングインターセプター
 * エラー仕様:
 * - 401 / 未ログイン: — /login へリダイレクト
 * - 403 権限なし: ページ上部バナー（赤）「この操作を行う権限がありません」
 * - 500 サーバーエラー: ページ上部バナー（赤）「サーバーエラーが発生しました。しばらくしてから再試行してください」
 * - ネットワークエラー (status 0): ページ上部バナー（赤）「通信エラーが発生しました」
 */
export const errorInterceptor: HttpInterceptorFn = (req, next) => {
  const errorService = inject(ErrorService);
  const authService = inject(AuthService);

  return next(req).pipe(
    catchError((error: HttpErrorResponse) => {
      // 401 / 未ログイン: 画面表示なし、/login へリダイレクト
      if (error.status === 401) {
        authService.logout().finally(() => {
          errorService.handleUnauthorized();
        });
      }
      // 403 権限なし: ページ上部バナー（赤）「この操作を行う権限がありません」
      else if (error.status === 403) {
        // AWS API Gateway 未デプロイ時の 'Missing Authentication Token' による開発時の誤発火を防止
        const isApiGwMissingToken =
          error.error?.message === 'Missing Authentication Token' ||
          error.headers?.get('x-amzn-errortype')?.includes('MissingAuthenticationToken');

        if (!isApiGwMissingToken) {
          errorService.showForbidden();
        }
      }
      // 500 サーバーエラー: ページ上部バナー（赤）「サーバーエラーが発生しました。しばらくしてから再試行してください」
      else if (error.status >= 500 && error.status <= 599) {
        errorService.showServerError();
      }
      // ネットワークエラー (status 0): ページ上部バナー（赤）「通信エラーが発生しました」
      else if (error.status === 0) {
        // オフライン時、または明示的なネットワーク断
        if (!navigator.onLine) {
          errorService.showNetworkError();
        }
      }

      return throwError(() => error);
    })
  );
};
