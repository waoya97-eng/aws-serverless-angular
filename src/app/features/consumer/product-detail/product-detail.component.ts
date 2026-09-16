import { Component, OnInit, inject, signal } from '@angular/core';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { NgIf, Location } from '@angular/common';
import { ApiService } from '../../../core/services/api.service';
import { AuthService } from '../../../core/services/auth.service';
import { CartService } from '../../../core/services/cart.service';
import { Product } from '../../../core/models/product.model';
import { environment } from '../../../../environments/environment';

@Component({
  selector: 'app-product-detail',
  standalone: true,
  imports: [NgIf, RouterLink],
  template: `
    <div class="product-detail-page">
      <!-- 戻るリンク: ブラウザ履歴 or /products へ -->
      <div class="back-link-wrapper">
        <a routerLink="/products" (click)="goBack($event)" class="back-link">
          ← 商品一覧に戻る
        </a>
      </div>

      <!-- 画面表示時ローディング -->
      <div *ngIf="loading() && !product()" class="loading">商品を読み込み中...</div>

      <!-- エラー表示 -->
      <div *ngIf="errorMessage()" class="error-state card">
        <p class="error-message">{{ errorMessage() }}</p>
        <button type="button" (click)="goBack()" class="btn btn-outline btn-sm" style="margin-top: 12px;">
          商品一覧へ戻る
        </button>
      </div>

      <!-- 商品詳細メインエリア -->
      <div *ngIf="product()" class="detail-container">
        <!-- 商品画像 (CloudFront URL、最大 400×400px) -->
        <div class="image-column">
          <div class="image-wrapper card">
            <img
              *ngIf="displayImageUrl && !imageError(); else placeholderTpl"
              [src]="displayImageUrl"
              [alt]="product()?.name || '商品画像'"
              (error)="onImageError()"
              class="product-image"
            />
            <ng-template #placeholderTpl>
              <div class="image-placeholder">
                <span class="placeholder-icon">📷</span>
                <span class="placeholder-title">商品画像</span>
                <span class="placeholder-dim">400 × 400px</span>
              </div>
            </ng-template>
          </div>
        </div>

        <!-- 商品情報 -->
        <div class="info-column card">
          <h1 class="product-title">{{ product()?.name }}</h1>

          <div class="price-display">
            ¥ {{ product()?.price?.toLocaleString() }}
          </div>

          <div class="meta-row">
            <span class="meta-label">カテゴリ:</span>
            <span class="meta-value">{{ product()?.category }}</span>
          </div>

          <div class="meta-row">
            <span class="meta-label">在庫:</span>
            <span
              class="stock-badge"
              [class.in-stock]="(product()?.stock ?? 0) > 0"
              [class.out-of-stock]="(product()?.stock ?? 0) === 0"
            >
              {{ (product()?.stock ?? 0) > 0 ? (product()?.stock + ' 個') : '在庫なし' }}
            </span>
          </div>

          <!-- 数量入力カウンター（− / ＋）最小 1、最大 在庫数 -->
          <div class="quantity-section">
            <span class="quantity-label">数量:</span>
            <div class="counter-box">
              <button
                type="button"
                class="counter-btn"
                [disabled]="quantity() <= 1 || (product()?.stock ?? 0) === 0"
                (click)="decrementQuantity()"
                aria-label="数量を減らす"
              >
                −
              </button>
              <span class="counter-value">
                {{ (product()?.stock ?? 0) === 0 ? 0 : quantity() }}
              </span>
              <button
                type="button"
                class="counter-btn"
                [disabled]="quantity() >= (product()?.stock ?? 0) || (product()?.stock ?? 0) === 0"
                (click)="incrementQuantity()"
                aria-label="数量を増やす"
              >
                ＋
              </button>
            </div>
          </div>

          <!-- カートに追加ボタン: Consumer のみ表示、在庫 0 で非活性 -->
          <div class="action-section" *ngIf="!auth.isSeller()">
            <button
              type="button"
              class="btn btn-primary btn-add-cart"
              [disabled]="(product()?.stock ?? 0) === 0 || isAdding()"
              (click)="onAddToCart()"
            >
              <ng-container *ngIf="(product()?.stock ?? 0) > 0">
                🛒 カートに追加
              </ng-container>
              <ng-container *ngIf="(product()?.stock ?? 0) === 0">
                在庫なし
              </ng-container>
            </button>
          </div>

          <!-- 出品者の場合の説明 -->
          <div class="seller-notice" *ngIf="auth.isSeller()">
            ※ 出品者アカウントのためカート追加ボタンは非表示です
          </div>

          <!-- カート追加成功メッセージ -->
          <div *ngIf="cartSuccessMessage()" class="cart-success">
            <p>{{ cartSuccessMessage() }}</p>
            <a routerLink="/cart" class="btn btn-outline btn-sm" style="margin-top: 8px;">
              🛒 カートを確認する →
            </a>
          </div>

          <!-- 商品説明 -->
          <div class="description-section" *ngIf="product()?.description">
            <h2 class="description-title">商品の説明</h2>
            <p class="description-text">{{ product()?.description }}</p>
          </div>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .product-detail-page {
      max-width: 960px;
      margin: 0 auto;
      padding-bottom: 40px;
    }

    .back-link-wrapper {
      margin-bottom: 20px;
    }

    .back-link {
      font-size: 14px;
      color: #495057;
      display: inline-flex;
      align-items: center;
      gap: 6px;
      cursor: pointer;
      text-decoration: none;
      font-weight: 500;
      transition: color 0.2s;
    }

    .back-link:hover {
      color: #4263eb;
      text-decoration: underline;
    }

    .detail-container {
      display: grid;
      grid-template-columns: 400px 1fr;
      gap: 32px;
      align-items: start;
    }

    @media (max-width: 860px) {
      .detail-container {
        grid-template-columns: 1fr;
        gap: 24px;
      }
    }

    .image-column {
      display: flex;
      justify-content: center;
    }

    .image-wrapper {
      width: 100%;
      max-width: 400px;
      height: 400px;
      max-height: 400px;
      padding: 0;
      overflow: hidden;
      display: flex;
      align-items: center;
      justify-content: center;
      background: #f8f9fa;
      border: 1px solid #dee2e6;
      border-radius: 8px;
    }

    .product-image {
      width: 100%;
      height: 100%;
      max-width: 400px;
      max-height: 400px;
      object-fit: contain;
    }

    .image-placeholder {
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      gap: 8px;
      color: #868e96;
      user-select: none;
    }

    .placeholder-icon {
      font-size: 40px;
    }

    .placeholder-title {
      font-size: 16px;
      font-weight: 600;
    }

    .placeholder-dim {
      font-size: 13px;
      color: #adb5bd;
    }

    .info-column {
      display: flex;
      flex-direction: column;
      gap: 16px;
      padding: 24px;
    }

    .product-title {
      font-size: 24px;
      font-weight: 700;
      color: #212529;
      line-height: 1.35;
      margin: 0;
    }

    .price-display {
      font-size: 28px;
      font-weight: 700;
      color: #1f2328;
    }

    .meta-row {
      display: flex;
      align-items: center;
      gap: 8px;
      font-size: 15px;
    }

    .meta-label {
      color: #495057;
      font-weight: 500;
    }

    .meta-value {
      color: #212529;
      font-weight: 600;
    }

    .stock-badge {
      font-weight: 600;
    }

    .stock-badge.in-stock {
      color: #2b8a3e;
    }

    .stock-badge.out-of-stock {
      color: #e03131;
    }

    /* 数量カウンター */
    .quantity-section {
      display: flex;
      align-items: center;
      gap: 16px;
      margin-top: 4px;
    }

    .quantity-label {
      font-size: 15px;
      font-weight: 600;
      color: #495057;
    }

    .counter-box {
      display: inline-flex;
      align-items: center;
      border: 1px solid #ced4da;
      border-radius: 6px;
      background: white;
      overflow: hidden;
    }

    .counter-btn {
      width: 38px;
      height: 38px;
      background: #f8f9fa;
      border: none;
      font-size: 18px;
      font-weight: 700;
      color: #333;
      display: flex;
      align-items: center;
      justify-content: center;
      transition: background-color 0.15s;
    }

    .counter-btn:hover:not(:disabled) {
      background: #e9ecef;
    }

    .counter-btn:disabled {
      color: #adb5bd;
      cursor: not-allowed;
      background: #f1f3f5;
    }

    .counter-value {
      min-width: 48px;
      text-align: center;
      font-size: 16px;
      font-weight: 600;
      color: #212529;
      user-select: none;
    }

    .action-section {
      margin-top: 8px;
    }

    .btn-add-cart {
      width: 100%;
      padding: 12px 24px;
      font-size: 16px;
      font-weight: 600;
      border-radius: 6px;
    }

    .btn-add-cart:disabled {
      background: #e9ecef;
      color: #adb5bd;
      border-color: #e9ecef;
      cursor: not-allowed;
      opacity: 1;
    }

    .seller-notice {
      font-size: 13px;
      color: #868e96;
      background: #f8f9fa;
      padding: 10px 14px;
      border-radius: 6px;
      border: 1px solid #e9ecef;
    }

    .cart-success {
      background: #e7f5ff;
      color: #1c7ed6;
      padding: 12px 16px;
      border-radius: 6px;
      font-size: 14px;
      border: 1px solid #d0ebff;
    }

    .description-section {
      border-top: 1px solid #eee;
      padding-top: 16px;
      margin-top: 8px;
    }

    .description-title {
      font-size: 14px;
      font-weight: 600;
      color: #868e96;
      margin-bottom: 8px;
    }

    .description-text {
      font-size: 14px;
      line-height: 1.6;
      color: #495057;
      white-space: pre-wrap;
      margin: 0;
    }

    .error-state {
      text-align: center;
      padding: 40px;
    }
  `],
})
export class ProductDetailComponent implements OnInit {
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private location = inject(Location);
  private api = inject(ApiService);
  auth = inject(AuthService);
  private cartService = inject(CartService);

  product = signal<Product | null>(null);
  loading = signal(true);
  errorMessage = signal('');
  cartSuccessMessage = signal('');
  quantity = signal(1);
  imageError = signal(false);
  isAdding = signal(false);

  get displayImageUrl(): string {
    const rawUrl = this.product()?.imageUrl?.trim();
    if (!rawUrl) return '';

    if (rawUrl.startsWith('http://') || rawUrl.startsWith('https://') || rawUrl.startsWith('data:')) {
      return rawUrl;
    }

    const cloudfront = (environment.cloudfrontUrl || '').replace(/^https?:\/?\/?/, 'https://').replace(/\/+$/, '');
    const cleanPath = rawUrl.startsWith('/') ? rawUrl : `/${rawUrl}`;
    return `${cloudfront}${cleanPath}`;
  }

  ngOnInit(): void {
    const sellerId = this.route.snapshot.paramMap.get('sellerId');
    const productId = this.route.snapshot.paramMap.get('productId');

    if (!sellerId || !productId) {
      this.errorMessage.set('商品IDが不正です。');
      this.loading.set(false);
      return;
    }

    // 1. routerLink の state があれば即時表示（画面遷移時のチラつき抑制）
    const stateProduct = history.state?.product as Product | undefined;
    if (stateProduct && stateProduct.productId === productId) {
      this.product.set(stateProduct);
      this.updateQuantityForStock(stateProduct.stock);
      this.loading.set(false);
    } else {
      this.loading.set(true);
    }

    // 2. 画面表示時: GET /products/:sellerId/:productId から最新情報を取得
    this.api.getProduct(sellerId, productId).subscribe({
      next: res => {
        this.product.set(res);
        this.imageError.set(false);
        this.updateQuantityForStock(res.stock);
        this.loading.set(false);
      },
      error: err => {
        console.error('Failed to get product detail:', err);
        if (!this.product()) {
          this.errorMessage.set('商品の取得に失敗しました。');
        }
        this.loading.set(false);
      },
    });
  }

  private updateQuantityForStock(stock: number | undefined): void {
    const currentStock = stock ?? 0;
    if (currentStock === 0) {
      this.quantity.set(0);
    } else if (this.quantity() === 0 || this.quantity() > currentStock) {
      this.quantity.set(1);
    }
  }

  decrementQuantity(): void {
    const stock = this.product()?.stock ?? 0;
    if (stock === 0) return;
    if (this.quantity() > 1) {
      this.quantity.update(q => q - 1);
    }
  }

  incrementQuantity(): void {
    const stock = this.product()?.stock ?? 0;
    if (stock === 0) return;
    if (this.quantity() < stock) {
      this.quantity.update(q => q + 1);
    }
  }

  onImageError(): void {
    this.imageError.set(true);
  }

  goBack(event?: Event): void {
    if (event) {
      event.preventDefault();
    }
    if (window.history.length > 1) {
      this.location.back();
    } else {
      this.router.navigate(['/products']);
    }
  }

  onAddToCart(): void {
    const prod = this.product();
    if (!prod) return;

    const stock = prod.stock ?? 0;
    if (stock === 0 || this.isAdding()) return;

    this.isAdding.set(true);
    const qty = this.quantity();
    this.cartService.addItem(prod, qty);
    this.cartSuccessMessage.set(`「${prod.name}」(${qty}個) をカートに追加しました！`);

    setTimeout(() => {
      this.isAdding.set(false);
    }, 1000);
  }
}
