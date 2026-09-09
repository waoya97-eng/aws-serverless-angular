import { Component, OnInit, inject, signal } from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import { NgIf, NgFor } from '@angular/common';
import { CartService } from '../../../core/services/cart.service';
import { ApiService } from '../../../core/services/api.service';
import { AuthService } from '../../../core/services/auth.service';
import { OrderService } from '../../../core/services/order.service';
import { Order } from '../../../core/models/order.model';
import { CartItem } from '../../../core/models/cart.model';
import { environment } from '../../../../environments/environment';

@Component({
  selector: 'app-cart',
  standalone: true,
  imports: [NgIf, NgFor, RouterLink],
  template: `
    <div class="cart-page">
      <!-- 注文完了画面 -->
      <div *ngIf="completedOrder() as order" class="card order-complete-card">
        <div class="complete-header">
          <div class="success-icon">🎉</div>
          <h2>ご注文ありがとうございます！</h2>
          <p class="order-id">注文番号: <strong>{{ order.orderId }}</strong></p>
        </div>

        <div class="order-summary-details">
          <h3>注文内容の控え</h3>
          <div class="order-items-list">
            <div *ngFor="let item of order.items" class="order-item-row">
              <span class="order-item-name">{{ item.name }}</span>
              <span class="order-item-qty">× {{ item.quantity }}</span>
              <span class="order-item-price">¥{{ (item.price * item.quantity).toLocaleString() }}</span>
            </div>
          </div>
          <div class="order-total-row">
            <span>合計お支払い金額 (税込)</span>
            <strong class="total-price">¥{{ order.totalAmount.toLocaleString() }}</strong>
          </div>
        </div>

        <div class="complete-actions">
          <a routerLink="/orders" class="btn btn-primary">注文履歴を見る</a>
          <a routerLink="/products" class="btn btn-outline" style="margin-left: 10px;">商品一覧に戻る</a>
        </div>
      </div>

      <!-- カート本体 -->
      <div *ngIf="!completedOrder()">
        <!-- タイトル: 🛒 カート（3 点） -->
        <h1 class="cart-title">
          🛒 カート（{{ cart.totalCount() }} 点）
        </h1>

        <!-- 空カートメッセージ (アイテム 0 件のとき表示) -->
        <div *ngIf="cart.isEmpty() && !loading()" class="card empty-state">
          <div class="empty-icon">🛒</div>
          <h2 class="empty-title">カートは空です</h2>
          <p class="empty-desc">現在、カートに商品が入っていません。</p>
          <a routerLink="/products" class="btn btn-primary" style="margin-top: 16px;">商品を探す</a>
        </div>

        <!-- 画面表示時ローディング -->
        <div *ngIf="loading()" class="loading">カート情報を読み込み中...</div>

        <!-- カートアイテムリスト -->
        <div *ngIf="!cart.isEmpty()" class="cart-content">
          <div class="cart-list-card">
            <div *ngFor="let item of cart.items()" class="cart-item-row">
              <!-- 商品画像 📷 (CloudFront URL) -->
              <div class="item-thumb">
                <img
                  *ngIf="getItemImageUrl(item.imageUrl); else placeholderTpl"
                  [src]="getItemImageUrl(item.imageUrl)"
                  [alt]="item.name"
                  loading="lazy"
                />
                <ng-template #placeholderTpl>
                  <div class="thumb-placeholder">📷</div>
                </ng-template>
              </div>

              <!-- 商品情報 (名前・価格・数量) -->
              <div class="item-details">
                <a [routerLink]="['/products', item.sellerId, item.productId]" class="item-name">
                  {{ item.name }}
                </a>
                <div class="item-price">
                  ¥ {{ item.price.toLocaleString() }}
                </div>
                <div class="item-qty-row">
                  <span class="item-qty-text">× {{ item.quantity }}</span>
                  <div class="qty-pill">
                    <button
                      type="button"
                      class="qty-mini-btn"
                      [disabled]="item.quantity <= 1"
                      (click)="onDecreaseQuantity(item)"
                      aria-label="数量を減らす"
                    >−</button>
                    <button
                      type="button"
                      class="qty-mini-btn"
                      (click)="onIncreaseQuantity(item)"
                      aria-label="数量を増やす"
                    >＋</button>
                  </div>
                </div>
              </div>

              <!-- 削除ボタン 🗑 (確認なしで即削除: DELETE /cart/:productId) -->
              <div class="item-actions">
                <button
                  type="button"
                  class="btn-delete"
                  (click)="onRemoveItem(item.productId)"
                  aria-label="削除"
                  title="削除"
                >
                  🗑
                </button>
              </div>
            </div>
          </div>

          <!-- フッター / サマリーエリア -->
          <div class="cart-footer-card">
            <div class="subtotal-row">
              <span class="subtotal-label">小計:</span>
              <span class="subtotal-price">¥ {{ cart.totalAmount().toLocaleString() }}</span>
            </div>

            <div *ngIf="checkoutError()" class="error-message checkout-error">
              {{ checkoutError() }}
            </div>

            <!-- 注文確認へ進むボタン (カートが空の場合は非活性) -->
            <button
              type="button"
              class="btn btn-primary btn-checkout"
              [disabled]="cart.isEmpty()"
              (click)="onCheckout()"
            >
              注文確認へ進む →
            </button>
          </div>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .cart-page {
      max-width: 800px;
      margin: 0 auto;
      padding-bottom: 60px;
    }

    .cart-title {
      font-size: 22px;
      font-weight: 700;
      color: #212529;
      margin-bottom: 24px;
      display: flex;
      align-items: center;
      gap: 8px;
    }

    .cart-list-card {
      background: white;
      border-radius: 8px;
      border: 1px solid #eaeaea;
      padding: 0;
      overflow: hidden;
      box-shadow: 0 1px 4px rgba(0, 0, 0, 0.05);
    }

    .cart-item-row {
      display: flex;
      align-items: center;
      gap: 16px;
      padding: 18px 20px;
      border-bottom: 1px solid #f1f3f5;
      transition: background-color 0.15s;
    }

    .cart-item-row:last-child {
      border-bottom: none;
    }

    .item-thumb {
      width: 72px;
      height: 72px;
      border-radius: 6px;
      overflow: hidden;
      background: #f8f9fa;
      border: 1px solid #e9ecef;
      flex-shrink: 0;
      display: flex;
      align-items: center;
      justify-content: center;
    }

    .item-thumb img {
      width: 100%;
      height: 100%;
      object-fit: cover;
    }

    .thumb-placeholder {
      font-size: 26px;
      color: #adb5bd;
      user-select: none;
    }

    .item-details {
      flex: 1;
      min-width: 0;
      display: flex;
      flex-direction: column;
      gap: 4px;
    }

    .item-name {
      font-size: 16px;
      font-weight: 600;
      color: #212529;
      text-decoration: none;
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
    }

    .item-name:hover {
      color: #4263eb;
      text-decoration: underline;
    }

    .item-price {
      font-size: 16px;
      font-weight: 700;
      color: #1f2328;
    }

    .item-qty-row {
      display: flex;
      align-items: center;
      gap: 8px;
      margin-top: 2px;
    }

    .item-qty-text {
      font-size: 14px;
      font-weight: 600;
      color: #495057;
    }

    .qty-pill {
      display: inline-flex;
      align-items: center;
      border: 1px solid #dee2e6;
      border-radius: 4px;
      overflow: hidden;
      margin-left: 6px;
    }

    .qty-mini-btn {
      width: 24px;
      height: 24px;
      background: #f8f9fa;
      border: none;
      font-size: 13px;
      font-weight: 700;
      cursor: pointer;
      display: flex;
      align-items: center;
      justify-content: center;
      color: #495057;
      transition: background-color 0.15s;
    }

    .qty-mini-btn:hover:not(:disabled) {
      background: #e9ecef;
    }

    .qty-mini-btn:disabled {
      opacity: 0.3;
      cursor: not-allowed;
    }

    .btn-delete {
      background: none;
      border: none;
      font-size: 20px;
      cursor: pointer;
      padding: 8px;
      border-radius: 6px;
      transition: transform 0.15s, background-color 0.15s;
      color: #868e96;
    }

    .btn-delete:hover {
      background-color: #fff5f5;
      transform: scale(1.1);
    }

    .cart-footer-card {
      margin-top: 20px;
      background: white;
      border-radius: 8px;
      border: 1px solid #eaeaea;
      padding: 24px;
      display: flex;
      flex-direction: column;
      gap: 16px;
      box-shadow: 0 1px 4px rgba(0, 0, 0, 0.05);
    }

    .subtotal-row {
      display: flex;
      justify-content: flex-end;
      align-items: baseline;
      gap: 12px;
      font-size: 20px;
      font-weight: 700;
      color: #212529;
    }

    .subtotal-price {
      font-size: 24px;
      color: #4263eb;
    }

    .btn-checkout {
      width: 100%;
      padding: 14px;
      font-size: 16px;
      font-weight: 700;
      border-radius: 6px;
    }

    .btn-checkout:disabled {
      background: #e9ecef;
      color: #adb5bd;
      border-color: #e9ecef;
      cursor: not-allowed;
      opacity: 1;
    }

    .checkout-error {
      background: #fff5f5;
      border: 1px solid #ffc9c9;
      padding: 10px;
      border-radius: 6px;
      font-size: 13px;
      color: #e03131;
    }

    .empty-state {
      text-align: center;
      padding: 60px 20px;
    }

    .empty-icon {
      font-size: 48px;
      margin-bottom: 12px;
    }

    .empty-title {
      font-size: 20px;
      font-weight: 700;
      color: #212529;
      margin-bottom: 8px;
    }

    .empty-desc {
      font-size: 14px;
      color: #666;
    }

    .order-complete-card {
      max-width: 500px;
      margin: 24px auto;
      text-align: center;
    }

    .success-icon {
      font-size: 44px;
      margin-bottom: 6px;
    }

    .order-id {
      font-size: 13px;
      color: #666;
      margin: 6px 0 16px;
    }

    .order-summary-details {
      background: #f9f9f9;
      border-radius: 6px;
      padding: 14px;
      text-align: left;
      margin-bottom: 16px;
      font-size: 13px;
    }

    .order-item-row, .order-total-row {
      display: flex;
      justify-content: space-between;
      padding: 4px 0;
    }

    .order-total-row {
      font-weight: 700;
      border-top: 1px solid #ddd;
      padding-top: 8px;
      margin-top: 6px;
    }

    .total-price {
      color: #4263eb;
      font-size: 15px;
    }

    .complete-actions {
      display: flex;
      justify-content: center;
      gap: 12px;
    }
  `],
})
export class CartComponent implements OnInit {
  cart = inject(CartService);
  private api = inject(ApiService);
  auth = inject(AuthService);
  private orderService = inject(OrderService);
  private router = inject(Router);

  loading = signal(false);
  isSubmitting = signal(false);
  checkoutError = signal('');
  completedOrder = signal<Order | null>(null);

  ngOnInit(): void {
    // 画面表示時: GET /cart
    this.loading.set(true);
    this.api.getCart().subscribe({
      next: res => {
        if (res.items && Array.isArray(res.items) && res.items.length > 0) {
          this.cart.setItems(res.items);
        }
        this.loading.set(false);
      },
      error: err => {
        console.warn('GET /cart warning (local cart maintained):', err);
        this.loading.set(false);
      },
    });
  }

  getItemImageUrl(rawUrl?: string): string {
    if (!rawUrl) return '';
    const trimmed = rawUrl.trim();
    if (trimmed.startsWith('http://') || trimmed.startsWith('https://') || trimmed.startsWith('data:')) {
      return trimmed;
    }
    const cloudfront = (environment.cloudfrontUrl || '').replace(/^https?:\/?\/?/, 'https://').replace(/\/+$/, '');
    const cleanPath = trimmed.startsWith('/') ? trimmed : `/${trimmed}`;
    return `${cloudfront}${cleanPath}`;
  }

  onIncreaseQuantity(item: CartItem): void {
    this.cart.updateQuantity(item.productId, item.quantity + 1);
  }

  onDecreaseQuantity(item: CartItem): void {
    if (item.quantity > 1) {
      this.cart.updateQuantity(item.productId, item.quantity - 1);
    }
  }

  /**
   * 削除ボタン 🗑 押下時
   * 仕様: 確認なしで即削除, DELETE /cart/:productId
   */
  onRemoveItem(productId: string): void {
    this.cart.removeItem(productId);
  }

  onCheckout(): void {
    if (this.cart.isEmpty()) return;
    this.router.navigate(['/checkout']);
  }
}

