import { Component, Input, Output, EventEmitter, inject, signal } from '@angular/core';
import { NgIf } from '@angular/common';
import { RouterLink } from '@angular/router';
import { Product } from '../../../core/models/product.model';
import { AuthService } from '../../../core/services/auth.service';
import { environment } from '../../../../environments/environment';

@Component({
  selector: 'app-product-card',
  standalone: true,
  imports: [NgIf, RouterLink],
  template: `
    <div
      class="product-card card"
      [routerLink]="['/products', product.sellerId, product.productId]"
      [state]="{ product: product }"
    >
      <!-- 商品画像 -->
      <div class="image-wrapper">
        <img
          *ngIf="displayImageUrl && !imageError; else placeholderTpl"
          [src]="displayImageUrl"
          [alt]="product.name"
          loading="lazy"
          (error)="onImageError()"
          class="product-image"
        />
        <ng-template #placeholderTpl>
          <div class="image-placeholder">
            <span class="placeholder-icon">📦</span>
            <span class="placeholder-text">No Image</span>
          </div>
        </ng-template>

        <!-- カテゴリバッジ -->
        <span class="category-badge">{{ product.category }}</span>

        <!-- 在庫なしバッジ（画像上にも重ねて表示） -->
        <span *ngIf="product.stock === 0" class="out-of-stock-overlay">在庫なし</span>
      </div>

      <!-- 商品情報 -->
      <div class="card-content">
        <h3 class="product-name" [title]="product.name">{{ product.name }}</h3>

        <div class="price-row">
          <span class="price">¥{{ product.price.toLocaleString() }}</span>

          <!-- 在庫表示 -->
          <span
            class="stock-status"
            [class.in-stock]="product.stock > 0"
            [class.out-of-stock]="product.stock === 0"
          >
            {{ product.stock > 0 ? '在庫 ' + product.stock + '点' : '在庫なし' }}
          </span>
        </div>

        <!-- カートへ追加ボタン: Consumer のみ表示 (Seller には非表示) -->
        <div class="card-action" *ngIf="!auth.isSeller()">
          <button
            type="button"
            class="btn btn-primary btn-add-cart"
            [class.btn-success]="addedMessage()"
            [disabled]="product.stock === 0 || isAdding()"
            (click)="onAddToCartClick($event)"
          >
            <ng-container *ngIf="addedMessage()">✓ カートに追加済</ng-container>
            <ng-container *ngIf="!addedMessage() && product.stock > 0">🛒 カートへ追加</ng-container>
            <ng-container *ngIf="!addedMessage() && product.stock === 0">在庫なし</ng-container>
          </button>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .product-card {
      display: flex;
      flex-direction: column;
      height: 100%;
      padding: 0;
      overflow: hidden;
      text-decoration: none;
      color: inherit;
      cursor: pointer;
      border: 1px solid #eaeaea;
      border-radius: 8px;
      background: white;
      transition: transform 0.2s cubic-bezier(0.16, 1, 0.3, 1), box-shadow 0.2s cubic-bezier(0.16, 1, 0.3, 1);
    }

    .product-card:hover {
      transform: translateY(-3px);
      box-shadow: 0 8px 20px rgba(0, 0, 0, 0.08);
      border-color: #d0d7de;
    }

    .image-wrapper {
      position: relative;
      width: 100%;
      aspect-ratio: 4 / 3;
      background-color: #f6f8fa;
      overflow: hidden;
      display: flex;
      align-items: center;
      justify-content: center;
    }

    .product-image {
      width: 100%;
      height: 100%;
      object-fit: cover;
      transition: transform 0.25s ease;
    }

    .product-card:hover .product-image {
      transform: scale(1.03);
    }

    .image-placeholder {
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      gap: 6px;
      color: #8c959f;
      font-size: 13px;
    }

    .placeholder-icon {
      font-size: 28px;
    }

    .category-badge {
      position: absolute;
      top: 10px;
      left: 10px;
      background: rgba(255, 255, 255, 0.92);
      backdrop-filter: blur(4px);
      color: #4263eb;
      font-size: 11px;
      font-weight: 700;
      padding: 3px 8px;
      border-radius: 4px;
      box-shadow: 0 1px 4px rgba(0, 0, 0, 0.1);
    }

    .out-of-stock-overlay {
      position: absolute;
      bottom: 8px;
      right: 8px;
      background: rgba(224, 49, 49, 0.9);
      color: white;
      font-size: 11px;
      font-weight: 700;
      padding: 3px 8px;
      border-radius: 4px;
    }

    .card-content {
      padding: 14px;
      display: flex;
      flex-direction: column;
      flex: 1;
      gap: 10px;
    }

    .product-name {
      font-size: 15px;
      font-weight: 600;
      color: #1f2328;
      margin: 0;
      line-height: 1.4;
      display: -webkit-box;
      -webkit-line-clamp: 2;
      -webkit-box-orient: vertical;
      overflow: hidden;
      min-height: 42px;
    }

    .price-row {
      display: flex;
      justify-content: space-between;
      align-items: baseline;
      margin-top: auto;
    }

    .price {
      font-size: 18px;
      font-weight: 700;
      color: #4263eb;
    }

    .stock-status {
      font-size: 12px;
      font-weight: 600;
    }

    .stock-status.in-stock {
      color: #2b8a3e;
    }

    .stock-status.out-of-stock {
      color: #e03131;
    }

    .card-action {
      margin-top: 4px;
    }

    .btn-add-cart {
      width: 100%;
      padding: 8px 12px;
      font-size: 13px;
      font-weight: 600;
      border-radius: 6px;
      transition: background-color 0.2s, opacity 0.2s;
    }

    .btn-add-cart.btn-success {
      background-color: #2b8a3e;
      border-color: #2b8a3e;
      color: white;
    }

    .btn-add-cart:disabled {
      background-color: #e9ecef;
      color: #adb5bd;
      border-color: #e9ecef;
      cursor: not-allowed;
      opacity: 1;
    }
  `],
})
export class ProductCardComponent {
  @Input({ required: true }) product!: Product;
  @Output() addToCart = new EventEmitter<{ product: Product; event: Event }>();

  auth = inject(AuthService);

  imageError = false;
  isAdding = signal(false);
  addedMessage = signal(false);

  get displayImageUrl(): string {
    const rawUrl = this.product?.imageUrl?.trim();
    if (!rawUrl) return '';

    if (rawUrl.startsWith('http://') || rawUrl.startsWith('https://') || rawUrl.startsWith('data:')) {
      return rawUrl;
    }

    // CloudFront ドメインとの安全な結合
    const cloudfront = (environment.cloudfrontUrl || '').replace(/^https?:\/?\/?/, 'https://').replace(/\/+$/, '');
    const cleanPath = rawUrl.startsWith('/') ? rawUrl : `/${rawUrl}`;
    return `${cloudfront}${cleanPath}`;
  }

  onImageError(): void {
    this.imageError = true;
  }

  onAddToCartClick(event: Event): void {
    // S03詳細画面への遷移（カードのクリック）を阻止
    event.stopPropagation();
    event.preventDefault();

    if (this.product.stock === 0 || this.isAdding()) return;

    this.isAdding.set(true);
    this.addToCart.emit({ product: this.product, event });

    // 一時的な成功表示
    this.addedMessage.set(true);
    setTimeout(() => {
      this.addedMessage.set(false);
      this.isAdding.set(false);
    }, 1500);
  }
}
