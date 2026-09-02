import { Component, OnInit, inject, signal } from '@angular/core';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { NgIf, NgFor } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ApiService } from '../../../core/services/api.service';
import { Product } from '../../../core/models/product.model';

@Component({
  selector: 'app-product-detail',
  standalone: true,
  imports: [NgIf, NgFor, RouterLink, FormsModule],
  template: `
    <div class="back-link">
      <a routerLink="/home">← 商品一覧に戻る</a>
    </div>

    <div *ngIf="loading()" class="loading">商品を読み込み中...</div>

    <div *ngIf="errorMessage()" class="error-state card">
      <p class="error-message">{{ errorMessage() }}</p>
      <a routerLink="/home" class="btn btn-outline btn-sm" style="margin-top: 12px;">商品一覧へ</a>
    </div>

    <div *ngIf="!loading() && product()" class="detail-container">
      <div class="image-section card">
        <img
          *ngIf="product()?.imageUrl; else placeholder"
          [src]="product()?.imageUrl"
          [alt]="product()?.name"
          class="product-image"
        />
        <ng-template #placeholder>
          <div class="image-placeholder">No Image</div>
        </ng-template>
      </div>

      <div class="info-section card">
        <span class="category-badge">{{ product()?.category }}</span>
        <h1 class="product-title">{{ product()?.name }}</h1>
        <p class="price">¥{{ product()?.price?.toLocaleString() }}</p>

        <div class="stock-status">
          <span [class.in-stock]="(product()?.stock ?? 0) > 0" [class.out-of-stock]="(product()?.stock ?? 0) === 0">
            {{ (product()?.stock ?? 0) > 0 ? '在庫あり (' + product()?.stock + '点)' : '在庫切れ' }}
          </span>
        </div>

        <div class="description">
          <h3>商品の説明</h3>
          <p>{{ product()?.description || '説明はありません。' }}</p>
        </div>

        <div class="cart-action" *ngIf="(product()?.stock ?? 0) > 0">
          <div class="quantity-select">
            <label for="quantity">数量:</label>
            <select id="quantity" [(ngModel)]="quantity">
              <option *ngFor="let q of quantityOptions" [value]="q">{{ q }}</option>
            </select>
          </div>

          <button
            class="btn btn-primary btn-add-cart"
            (click)="onAddToCart()"
          >
            🛒 カートに追加
          </button>
        </div>

        <div *ngIf="cartSuccessMessage()" class="cart-success">
          {{ cartSuccessMessage() }}
        </div>
      </div>
    </div>
  `,
  styles: [`
    .back-link { margin-bottom: 20px; }
    .back-link a { font-size: 14px; color: #555; }
    .back-link a:hover { color: #4263eb; }

    .detail-container {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 32px;
      align-items: start;
    }

    @media (max-width: 768px) {
      .detail-container { grid-template-columns: 1fr; }
    }

    .image-section {
      display: flex;
      justify-content: center;
      align-items: center;
      min-height: 360px;
      overflow: hidden;
    }

    .product-image {
      max-width: 100%;
      max-height: 400px;
      object-fit: contain;
      border-radius: 6px;
    }

    .image-placeholder {
      display: flex;
      justify-content: center;
      align-items: center;
      width: 100%;
      height: 300px;
      background: #e9ecef;
      color: #868e96;
      font-size: 18px;
      border-radius: 6px;
    }

    .info-section {
      display: flex;
      flex-direction: column;
      gap: 16px;
    }

    .category-badge {
      display: inline-block;
      align-self: flex-start;
      background: #e7f5ff;
      color: #1c7ed6;
      padding: 4px 10px;
      border-radius: 4px;
      font-size: 12px;
      font-weight: 600;
    }

    .product-title {
      font-size: 24px;
      font-weight: 700;
      color: #222;
      line-height: 1.3;
    }

    .price {
      font-size: 28px;
      font-weight: 700;
      color: #4263eb;
    }

    .stock-status {
      font-size: 14px;
      font-weight: 600;
    }

    .in-stock { color: #2b8a3e; }
    .out-of-stock { color: #e03131; }

    .description {
      border-top: 1px solid #eee;
      border-bottom: 1px solid #eee;
      padding: 16px 0;
    }

    .description h3 {
      font-size: 14px;
      color: #868e96;
      margin-bottom: 8px;
    }

    .description p {
      font-size: 15px;
      line-height: 1.6;
      color: #444;
      white-space: pre-wrap;
    }

    .cart-action {
      display: flex;
      gap: 16px;
      align-items: center;
      margin-top: 8px;
    }

    .quantity-select {
      display: flex;
      align-items: center;
      gap: 8px;
      font-size: 14px;
      font-weight: 600;
    }

    .quantity-select select {
      padding: 8px 12px;
      border: 1px solid #ced4da;
      border-radius: 6px;
      font-size: 15px;
    }

    .btn-add-cart {
      flex: 1;
      padding: 12px 24px;
      font-size: 16px;
    }

    .cart-success {
      background: #e7f5ff;
      color: #1c7ed6;
      padding: 12px 16px;
      border-radius: 6px;
      font-size: 14px;
    }

    .error-state {
      text-align: center;
      padding: 40px;
    }
  `],
})
export class ProductDetailComponent implements OnInit {
  private route = inject(ActivatedRoute);
  private api = inject(ApiService);

  product = signal<Product | null>(null);
  loading = signal(true);
  errorMessage = signal('');
  cartSuccessMessage = signal('');
  quantity = 1;

  get quantityOptions(): number[] {
    const stock = this.product()?.stock ?? 1;
    const max = Math.min(stock, 10);
    return Array.from({ length: max }, (_, i) => i + 1);
  }

  ngOnInit(): void {
    // 1. 一覧画面（routerLink state）から渡された商品データがあれば即時表示
    const stateProduct = history.state?.product as Product | undefined;
    if (stateProduct && stateProduct.productId) {
      this.product.set(stateProduct);
      this.loading.set(false);
      return;
    }

    // 2. 直接URLでアクセスされた場合は API から取得
    const sellerId = this.route.snapshot.paramMap.get('sellerId');
    const productId = this.route.snapshot.paramMap.get('productId');

    if (!sellerId || !productId) {
      this.errorMessage.set('商品IDが不正です。');
      this.loading.set(false);
      return;
    }

    this.api.getProduct(sellerId, productId).subscribe({
      next: res => {
        this.product.set(res);
        this.loading.set(false);
      },
      error: () => {
        this.errorMessage.set('商品の取得に失敗しました。');
        this.loading.set(false);
      },
    });
  }

  onAddToCart(): void {
    const prod = this.product();
    if (!prod) return;

    this.cartSuccessMessage.set(`「${prod.name}」(${this.quantity}点) を選択しました`);
  }
}
