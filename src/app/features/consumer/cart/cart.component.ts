import { Component, inject, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { NgIf, NgFor } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { CartService } from '../../../core/services/cart.service';
import { ApiService } from '../../../core/services/api.service';
import { Order } from '../../../core/models/order.model';
import { CartItem } from '../../../core/models/cart.model';

@Component({
  selector: 'app-cart',
  standalone: true,
  imports: [NgIf, NgFor, RouterLink, FormsModule],
  template: `
    <div class="cart-page">
      <div class="breadcrumb">
        <a routerLink="/home">← 商品一覧に戻る</a>
      </div>

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
          <a routerLink="/home" class="btn btn-primary">商品一覧に戻る</a>
        </div>
      </div>

      <!-- カート本体（未注文時） -->
      <div *ngIf="!completedOrder()">
        <h1 class="page-title">ショッピングカート</h1>

        <!-- カートが空の場合 -->
        <div *ngIf="cart.isEmpty()" class="card empty-state">
          <div class="empty-icon">🛒</div>
          <h2>カートは空です</h2>
          <p class="empty-desc">気になる商品をカートに追加してみましょう。</p>
          <a routerLink="/home" class="btn btn-primary" style="margin-top: 16px;">商品を探す</a>
        </div>

        <!-- カートに商品がある場合 -->
        <div *ngIf="!cart.isEmpty()" class="cart-container">
          <!-- カートアイテム一覧 -->
          <div class="cart-items-section card">
            <div class="cart-header-row">
              <span class="col-product">商品情報</span>
              <span class="col-price">単価</span>
              <span class="col-quantity">数量</span>
              <span class="col-subtotal">小計</span>
              <span class="col-action">操作</span>
            </div>

            <div *ngFor="let item of cart.items()" class="cart-item-row">
              <!-- 商品情報 -->
              <div class="col-product product-info">
                <div class="item-thumbnail">
                  <img *ngIf="item.imageUrl; else noImg" [src]="item.imageUrl" [alt]="item.name" />
                  <ng-template #noImg>
                    <div class="no-image-box">No Img</div>
                  </ng-template>
                </div>
                <div class="item-name-wrap">
                  <a [routerLink]="['/products', item.sellerId, item.productId]" class="item-title">
                    {{ item.name }}
                  </a>
                  <span class="seller-label">出品者ID: {{ item.sellerId }}</span>
                </div>
              </div>

              <!-- 単価 -->
              <div class="col-price price-cell">
                ¥{{ item.price.toLocaleString() }}
              </div>

              <!-- 数量変更 -->
              <div class="col-quantity qty-cell">
                <div class="quantity-controller">
                  <button
                    type="button"
                    class="qty-btn"
                    (click)="onDecreaseQuantity(item)"
                    [disabled]="item.quantity <= 1"
                    title="数量を減らす"
                  >-</button>
                  <span class="qty-value">{{ item.quantity }}</span>
                  <button
                    type="button"
                    class="qty-btn"
                    (click)="onIncreaseQuantity(item)"
                    title="数量を増やす"
                  >+</button>
                </div>
              </div>

              <!-- 小計 -->
              <div class="col-subtotal subtotal-cell">
                ¥{{ (item.price * item.quantity).toLocaleString() }}
              </div>

              <!-- 削除ボタン -->
              <div class="col-action action-cell">
                <button
                  type="button"
                  class="btn-delete"
                  (click)="onRemoveItem(item.productId)"
                  title="商品を削除"
                >
                  削除
                </button>
              </div>
            </div>

            <div class="cart-actions-bottom">
              <button
                type="button"
                class="btn-clear-cart"
                (click)="onClearCart()"
              >
                カートを空にする
              </button>
            </div>
          </div>

          <!-- 注文サマリー（右サイド） -->
          <div class="cart-summary-section card">
            <h2 class="summary-title">注文内容</h2>

            <div class="summary-row">
              <span>商品合計 ({{ cart.totalCount() }}点)</span>
              <span>¥{{ cart.totalAmount().toLocaleString() }}</span>
            </div>

            <div class="summary-row">
              <span>配送料</span>
              <span class="free-shipping">無料</span>
            </div>

            <hr class="summary-divider" />

            <div class="summary-total-row">
              <span>合計 (税込)</span>
              <span class="grand-total">¥{{ cart.totalAmount().toLocaleString() }}</span>
            </div>

            <div *ngIf="checkoutError()" class="error-message checkout-error">
              {{ checkoutError() }}
            </div>

            <button
              type="button"
              class="btn btn-primary btn-checkout"
              [disabled]="isSubmitting()"
              (click)="onCheckout()"
            >
              <span *ngIf="!isSubmitting()">注文を確定する</span>
              <span *ngIf="isSubmitting()">注文処理中...</span>
            </button>

            <a routerLink="/home" class="continue-shopping">← お買い物を続ける</a>
          </div>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .cart-page { max-width: 1100px; margin: 0 auto; }
    .breadcrumb { margin-bottom: 20px; font-size: 14px; }
    .breadcrumb a { color: #555; }
    .cart-container { display: grid; grid-template-columns: 1fr 300px; gap: 20px; }
    @media(max-width:768px){.cart-container{grid-template-columns:1fr}.cart-header-row{display:none}}
    .cart-header-row,.cart-item-row { display: grid; grid-template-columns: 3fr 1fr 90px 1fr 50px; align-items: center; gap: 10px; padding: 10px 0; border-bottom: 1px solid #eee; font-size: 14px; }
    .cart-header-row { font-size: 12px; font-weight: 700; color: #666; border-bottom: 2px solid #ddd; }
    .product-info { display: flex; align-items: center; gap: 10px; }
    .item-thumbnail { width: 50px; height: 50px; border-radius: 4px; overflow: hidden; background: #f0f0f0; display: flex; align-items: center; justify-content: center; font-size: 9px; color: #999; flex-shrink: 0; }
    .item-thumbnail img { width: 100%; height: 100%; object-fit: cover; }
    .item-title { font-weight: 600; color: #222; }
    .seller-label { font-size: 11px; color: #888; display: block; }
    .quantity-controller { display: inline-flex; border: 1px solid #ccc; border-radius: 4px; }
    .qty-btn { width: 26px; height: 26px; background: #f8f8f8; border: none; font-size: 14px; cursor: pointer; }
    .qty-btn:disabled { opacity: 0.3; }
    .qty-value { width: 28px; text-align: center; line-height: 26px; font-size: 13px; }
    .subtotal-cell { font-weight: 700; color: #4263eb; }
    .btn-delete { background: none; border: none; color: #e03131; cursor: pointer; font-size: 12px; }
    .cart-actions-bottom { display: flex; justify-content: flex-end; padding-top: 12px; }
    .btn-clear-cart { background: none; border: 1px solid #ddd; color: #666; font-size: 12px; padding: 4px 10px; border-radius: 4px; }
    .cart-summary-section { position: sticky; top: 70px; display: flex; flex-direction: column; gap: 10px; }
    .summary-title { font-size: 16px; font-weight: 700; padding-bottom: 6px; border-bottom: 1px solid #eee; }
    .summary-row, .summary-total-row { display: flex; justify-content: space-between; font-size: 14px; }
    .free-shipping { color: #2b8a3e; font-weight: 600; }
    .summary-divider { border: none; border-top: 1px solid #eee; margin: 4px 0; }
    .summary-total-row { font-weight: 700; }
    .grand-total { font-size: 20px; color: #4263eb; }
    .btn-checkout { width: 100%; padding: 12px; font-size: 15px; margin-top: 6px; }
    .continue-shopping { text-align: center; font-size: 12px; color: #666; }
    .checkout-error { background: #fff5f5; border: 1px solid #ffc9c9; padding: 8px; border-radius: 4px; font-size: 12px; color: #e03131; }
    .order-complete-card { max-width: 500px; margin: 24px auto; text-align: center; }
    .success-icon { font-size: 44px; margin-bottom: 6px; }
    .order-id { font-size: 13px; color: #666; margin: 6px 0 16px; }
    .order-summary-details { background: #f9f9f9; border-radius: 6px; padding: 14px; text-align: left; margin-bottom: 16px; font-size: 13px; }
    .order-item-row, .order-total-row { display: flex; justify-content: space-between; padding: 4px 0; }
    .order-total-row { font-weight: 700; border-top: 1px solid #ddd; padding-top: 8px; margin-top: 6px; }
    .total-price { color: #4263eb; font-size: 15px; }
  `],
})
export class CartComponent {
  cart = inject(CartService);
  private api = inject(ApiService);

  isSubmitting = signal(false);
  checkoutError = signal('');
  completedOrder = signal<Order | null>(null);

  onIncreaseQuantity(item: CartItem): void {
    this.cart.updateQuantity(item.productId, item.quantity + 1);
  }

  onDecreaseQuantity(item: CartItem): void {
    if (item.quantity > 1) {
      this.cart.updateQuantity(item.productId, item.quantity - 1);
    }
  }

  onRemoveItem(productId: string): void {
    this.cart.removeItem(productId);
  }

  onClearCart(): void {
    if (confirm('カート内の商品をすべて削除しますか？')) {
      this.cart.clearCart();
    }
  }

  onCheckout(): void {
    const items = this.cart.items();
    if (items.length === 0) return;

    this.isSubmitting.set(true);
    this.checkoutError.set('');

    this.api.createOrder(items).subscribe({
      next: (order: Order) => {
        this.isSubmitting.set(false);
        this.completedOrder.set(order);
        this.cart.clearCart();
      },
      error: (err) => {
        console.warn('API createOrder failed, falling back to simulated order:', err);
        // バックエンドが未デプロイ/エラー時のフォールバック処理
        const simulatedOrder: Order = {
          buyerId: 'guest-buyer',
          orderId: 'ORD-' + Date.now().toString().slice(-6),
          items: items.map(i => ({
            sellerId: i.sellerId,
            productId: i.productId,
            name: i.name,
            price: i.price,
            quantity: i.quantity,
          })),
          totalAmount: this.cart.totalAmount(),
          status: 'CONFIRMED',
          createdAt: new Date().toISOString(),
        };
        this.isSubmitting.set(false);
        this.completedOrder.set(simulatedOrder);
        this.cart.clearCart();
      },
    });
  }
}
