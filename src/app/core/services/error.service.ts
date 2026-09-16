import { Injectable, signal, inject } from '@angular/core';
import { Router, NavigationStart } from '@angular/router';

@Injectable({ providedIn: 'root' })
export class ErrorService {
  private router = inject(Router);

  /** ページ上部バナー（赤）のメッセージ */
  private _bannerMessage = signal<string | null>(null);
  readonly bannerMessage = this._bannerMessage.asReadonly();

  private autoDismissTimer: any = null;

  constructor() {
    // ページ遷移時にバナーを自動クリア（オプション）
    this.router.events.subscribe(event => {
      if (event instanceof NavigationStart) {
        // 次の画面へ遷移した際に古いバナーをクリア
        this.clearBanner();
      }
    });

    // ブラウザのオフラインイベント監視（ネットワークエラー対応）
    if (typeof window !== 'undefined') {
      window.addEventListener('offline', () => {
        this.showNetworkError();
      });
      window.addEventListener('online', () => {
        if (this._bannerMessage() === '通信エラーが発生しました') {
          this.clearBanner();
        }
      });
    }
  }

  /**
   * ページ上部バナー（赤）を表示
   * @param message 表示するエラーメッセージ
   * @param durationMs 自動消去までの時間（ミリ秒、デフォルト6000ms、0で自動消去なし）
   */
  showBanner(message: string, durationMs: number = 6000): void {
    if (this.autoDismissTimer) {
      clearTimeout(this.autoDismissTimer);
      this.autoDismissTimer = null;
    }
    this._bannerMessage.set(message);

    if (durationMs > 0) {
      this.autoDismissTimer = setTimeout(() => {
        this.clearBanner();
      }, durationMs);
    }
  }

  /**
   * バナーを非表示
   */
  clearBanner(): void {
    if (this.autoDismissTimer) {
      clearTimeout(this.autoDismissTimer);
      this.autoDismissTimer = null;
    }
    this._bannerMessage.set(null);
  }

  /**
   * 401 / 未ログイン: — (画面表示なし) /login へリダイレクト
   */
  handleUnauthorized(): void {
    this.clearBanner();
    this.router.navigate(['/login']);
  }

  /**
   * 403 権限なし: ページ上部バナー（赤）「この操作を行う権限がありません」
   */
  showForbidden(): void {
    this.showBanner('この操作を行う権限がありません');
  }

  /**
   * 500 サーバーエラー: ページ上部バナー（赤）「サーバーエラーが発生しました。しばらくしてから再試行してください」
   */
  showServerError(): void {
    this.showBanner('サーバーエラーが発生しました。しばらくしてから再試行してください');
  }

  /**
   * ネットワークエラー: ページ上部バナー（赤）「通信エラーが発生しました」
   */
  showNetworkError(): void {
    this.showBanner('通信エラーが発生しました');
  }
}
