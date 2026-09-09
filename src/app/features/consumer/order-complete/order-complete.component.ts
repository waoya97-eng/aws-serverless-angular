import { Component, inject, OnInit, signal, computed } from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import { NgIf } from '@angular/common';
import { OrderService } from '../../../core/services/order.service';

@Component({
  selector: 'app-order-complete',
  standalone: true,
  imports: [NgIf, RouterLink],
  template: `
    <div class="complete-page">
      <div class="card complete-card" *ngIf="orderId()">
        <!-- チェックアイコン: ✅ -->
        <div class="success-icon" aria-hidden="true">✅</div>

        <!-- 完了メッセージ -->
        <h1 class="complete-title">ご注文ありがとうございました</h1>

        <!-- 注文番号表示（例: 注文番号: #9Z8Y7X6W） -->
        <p class="order-id">
          注文番号: <strong class="order-number">#{{ formattedOrderId() }}</strong>
        </p>

        <!-- アクションリンク -->
        <div class="actions">
          <a routerLink="/products" class="btn btn-outline btn-action">
            商品一覧へ戻る
          </a>
          <a routerLink="/orders" class="btn btn-primary btn-action">
            注文履歴を見る
          </a>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .complete-page {
      max-width: 480px;
      margin: 40px auto 60px;
      padding: 0 16px;
    }

    .complete-card {
      background: white;
      border-radius: 8px;
      border: 1px solid #eaeaea;
      padding: 44px 28px 36px;
      box-shadow: 0 1px 4px rgba(0, 0, 0, 0.05);
      text-align: center;
    }

    .success-icon {
      font-size: 52px;
      line-height: 1;
      margin-bottom: 20px;
    }

    .complete-title {
      font-size: 22px;
      font-weight: 700;
      color: #212529;
      margin: 0 0 12px;
      letter-spacing: -0.2px;
    }

    .order-id {
      font-size: 15px;
      color: #495057;
      margin: 0 0 32px;
    }

    .order-number {
      font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace;
      font-weight: 700;
      color: #212529;
    }

    .actions {
      display: flex;
      flex-direction: row;
      gap: 12px;
      justify-content: center;
      margin: 0 auto;
    }

    @media (max-width: 480px) {
      .actions {
        flex-direction: column;
        max-width: 280px;
      }
    }

    .btn-action {
      display: inline-flex;
      align-items: center;
      justify-content: center;
      padding: 12px 20px;
      font-size: 14px;
      font-weight: 600;
      border-radius: 6px;
      text-decoration: none;
      transition: opacity 0.2s, background-color 0.2s;
    }
  `],
})
export class OrderCompleteComponent implements OnInit {
  private router = inject(Router);
  private orderService = inject(OrderService);

  orderId = signal<string>('');

  formattedOrderId = computed(() => {
    const id = this.orderId();
    return id.startsWith('#') ? id.slice(1) : id;
  });

  ngOnInit(): void {
    // 注文IDの取得（S05からの遷移状態またはOrderServiceから取得）
    const navigation = this.router.getCurrentNavigation();
    const navStateId =
      navigation?.extras?.state?.['orderId'] ||
      navigation?.extras?.state?.['order']?.orderId;

    const stateOrderId =
      navStateId ||
      (typeof history !== 'undefined' && history.state?.orderId) ||
      (typeof history !== 'undefined' && history.state?.order?.orderId);

    const serviceOrderId = this.orderService.consumeCompletedOrderId();
    const id = (serviceOrderId || stateOrderId || '').trim();

    // 仕様: 直接 URL アクセス時は /products にリダイレクト
    if (!id) {
      this.router.navigate(['/products'], { replaceUrl: true });
      return;
    }

    this.orderId.set(id);

    // リロード時にも直接アクセスとみなして /products にリダイレクトさせるため history.state をクリア
    if (typeof history !== 'undefined' && history.replaceState) {
      history.replaceState({ ...history.state, orderId: null }, '');
    }
  }
}
