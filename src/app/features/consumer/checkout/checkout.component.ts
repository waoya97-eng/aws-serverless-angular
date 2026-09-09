import { Component, inject, signal } from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import { NgIf, NgFor } from '@angular/common';
import { CartService } from '../../../core/services/cart.service';
import { ApiService } from '../../../core/services/api.service';
import { OrderService } from '../../../core/services/order.service';
import { Order } from '../../../core/models/order.model';

@Component({
  selector: 'app-checkout',
  standalone: true,
  imports: [NgIf, NgFor, RouterLink],
  template: `
    <div class="checkout-page">
      <div class="card checkout-card">
        <!-- 画面タイトル: 📋 注文確認 -->
        <h1 class="checkout-title">
          <span class="title-icon">📋</span>
          <span>注文確認</span>
        </h1>

        <!-- カートが空の場合 -->
        <div *ngIf="cart.isEmpty()" class="empty-cart-state">
          <p class="empty-text">カートに商品が入っていません。</p>
          <a routerLink="/cart" class="btn btn-outline btn-back-to-cart">← カートに戻る</a>
        </div>

        <!-- 注文確認コンテンツ -->
        <div *ngIf="!cart.isEmpty()">
          <!-- 注文内容リスト（読み取り専用・変更不可） -->
          <div class="order-items-list">
            <div *ngFor="let item of cart.items()" class="order-item-row">
              <div class="item-main">
                <span class="item-name">{{ item.name }}</span>
                <span class="item-qty">× {{ item.quantity }}</span>
              </div>
              <div class="item-price">
                ¥ {{ (item.price * item.quantity).toLocaleString() }}
              </div>
            </div>
          </div>

          <!-- 合計金額（税込み合計・大きめ表示） -->
          <div class="total-container">
            <span class="total-label">合計</span>
            <span class="total-amount">¥ {{ cart.totalAmount().toLocaleString() }}</span>
          </div>

          <!-- 注意書き -->
          <p class="cancel-notice">※ 注文確定後のキャンセルはできません。</p>

          <!-- エラーメッセージ（在庫不足 409 等のエラー時に赤表示） -->
          <div *ngIf="errorMessage()" class="error-box" role="alert">
            <span class="error-icon">⚠️</span>
            <span class="error-text">{{ errorMessage() }}</span>
          </div>

          <!-- アクションボタン -->
          <div class="actions-row">
            <a routerLink="/cart" class="btn btn-outline btn-back">
              ← カートに戻る
            </a>

            <!-- 注文確定ボタン（送信中はローディング・非活性） -->
            <button
              type="button"
              class="btn btn-primary btn-confirm"
              [disabled]="isSubmitting() || cart.isEmpty()"
              (click)="onConfirmOrder()"
            >
              <span *ngIf="!isSubmitting()">✓ 注文を確定する</span>
              <span *ngIf="isSubmitting()" class="loading-state">
                <span class="spinner" aria-hidden="true"></span>
                注文処理中...
              </span>
            </button>
          </div>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .checkout-page {
      max-width: 560px;
      margin: 20px auto 60px;
      padding: 0 16px;
    }

    .checkout-card {
      background: white;
      border-radius: 8px;
      border: 1px solid #eaeaea;
      padding: 28px 24px;
      box-shadow: 0 1px 4px rgba(0, 0, 0, 0.05);
    }

    .checkout-title {
      font-size: 20px;
      font-weight: 700;
      color: #212529;
      margin: 0 0 24px;
      padding-bottom: 16px;
      border-bottom: 2px solid #f1f3f5;
      display: flex;
      align-items: center;
      gap: 8px;
    }

    .title-icon {
      font-size: 22px;
    }

    .empty-cart-state {
      text-align: center;
      padding: 40px 10px;
    }

    .empty-text {
      color: #666;
      font-size: 15px;
      margin-bottom: 20px;
    }

    .btn-back-to-cart {
      padding: 10px 24px;
    }

    .order-items-list {
      display: flex;
      flex-direction: column;
      border-bottom: 1px solid #e9ecef;
    }

    .order-item-row {
      padding: 14px 0;
      border-bottom: 1px solid #f8f9fa;
      display: flex;
      flex-direction: column;
      gap: 4px;
    }

    .order-item-row:last-child {
      border-bottom: none;
    }

    .item-main {
      display: flex;
      align-items: baseline;
      gap: 8px;
      font-size: 15px;
      font-weight: 600;
      color: #212529;
      word-break: break-word;
    }

    .item-name {
      flex: 1;
      line-height: 1.4;
    }

    .item-qty {
      color: #495057;
      font-weight: 600;
      white-space: nowrap;
    }

    .item-price {
      font-size: 15px;
      font-weight: 700;
      color: #1f2328;
    }

    .total-container {
      display: flex;
      justify-content: space-between;
      align-items: baseline;
      padding: 20px 0 16px;
      border-bottom: 1px solid #e9ecef;
      margin-bottom: 16px;
    }

    .total-label {
      font-size: 18px;
      font-weight: 700;
      color: #212529;
    }

    .total-amount {
      font-size: 26px;
      font-weight: 700;
      color: #4263eb;
    }

    .cancel-notice {
      font-size: 13px;
      color: #868e96;
      margin: 0 0 20px;
      line-height: 1.5;
    }

    .error-box {
      background: #fff5f5;
      border: 1px solid #ffc9c9;
      color: #e03131;
      padding: 12px 16px;
      border-radius: 6px;
      font-size: 14px;
      font-weight: 600;
      margin-bottom: 20px;
      display: flex;
      align-items: center;
      gap: 8px;
      line-height: 1.4;
    }

    .error-icon {
      font-size: 16px;
      flex-shrink: 0;
    }

    .actions-row {
      display: flex;
      gap: 12px;
      align-items: center;
    }

    .btn-back {
      flex: 1;
      text-align: center;
      padding: 12px 16px;
      font-size: 14px;
      font-weight: 600;
      text-decoration: none;
      display: inline-flex;
      align-items: center;
      justify-content: center;
    }

    .btn-confirm {
      flex: 1.4;
      padding: 12px 16px;
      font-size: 15px;
      font-weight: 700;
      display: inline-flex;
      align-items: center;
      justify-content: center;
      gap: 8px;
    }

    .btn-confirm:disabled {
      background: #e9ecef;
      color: #adb5bd;
      border-color: #e9ecef;
      cursor: not-allowed;
      opacity: 1;
    }

    .loading-state {
      display: inline-flex;
      align-items: center;
      gap: 8px;
    }

    .spinner {
      width: 14px;
      height: 14px;
      border: 2px solid #adb5bd;
      border-top-color: transparent;
      border-radius: 50%;
      animation: spin 0.8s linear infinite;
    }

    @keyframes spin {
      to {
        transform: rotate(360deg);
      }
    }

    @media (max-width: 480px) {
      .actions-row {
        flex-direction: column-reverse;
      }
      .btn-back,
      .btn-confirm {
        width: 100%;
        flex: auto;
      }
    }
  `],
})
export class CheckoutComponent {
  cart = inject(CartService);
  private api = inject(ApiService);
  private orderService = inject(OrderService);
  private router = inject(Router);

  isSubmitting = signal(false);
  errorMessage = signal('');

  onConfirmOrder(): void {
    const items = this.cart.items();
    if (items.length === 0 || this.isSubmitting()) {
      return;
    }

    this.isSubmitting.set(true);
    this.errorMessage.set('');

    this.api.createOrder(items).subscribe({
      next: (order: Order) => {
        this.isSubmitting.set(false);
        this.orderService.recordOrder(order);
        this.cart.clearCart();
        // 成功 → S06（注文完了画面）へ遷移
        this.router.navigate(['/order-complete'], { state: { order } });
      },
      error: (err: any) => {
        this.isSubmitting.set(false);
        if (err?.status === 409) {
          const detail = err.error?.message || err.error?.error || err.error;
          this.errorMessage.set(
            typeof detail === 'string' && detail.trim().length > 0
              ? detail
              : '在庫不足のため注文を確定できませんでした。'
          );
        } else {
          const detail = err.error?.message || err.error?.error || err.error;
          this.errorMessage.set(
            typeof detail === 'string' && detail.trim().length > 0
              ? detail
              : '注文処理中にエラーが発生しました。もう一度お試しください。'
          );
        }
      },
    });
  }
}
