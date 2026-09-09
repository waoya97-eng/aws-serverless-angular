import { Component, OnInit, inject, signal } from '@angular/core';
import { NgIf, NgFor } from '@angular/common';
import { RouterLink } from '@angular/router';
import { ApiService } from '../../../core/services/api.service';
import { AuthService } from '../../../core/services/auth.service';
import { CartService } from '../../../core/services/cart.service';
import { OrderService } from '../../../core/services/order.service';
import { Product } from '../../../core/models/product.model';
import { ProductCardComponent } from '../../../shared/components/product-card/product-card.component';

@Component({
  selector: 'app-product-list',
  standalone: true,
  imports: [NgIf, NgFor, RouterLink, ProductCardComponent],
  template: `
    <div class="product-list-page">
      <!-- ページヘッダー -->
      <div class="page-header">
        <div>
          <h1 class="page-title">商品一覧</h1>
          <p class="subtitle">厳選されたマーケットプレイスの商品をお届けします。</p>
        </div>
      </div>

      <!-- カート追加完了トースト通知 -->
      <div *ngIf="toastMessage()" class="toast-notification">
        <span>{{ toastMessage() }}</span>
        <a routerLink="/cart" class="toast-link">カートを見る →</a>
      </div>

      <!-- カテゴリフィルター（選択で即時再取得） -->
      <div class="category-filter-bar">
        <span class="filter-label">カテゴリ:</span>
        <div class="category-pill-group">
          <button
            type="button"
            *ngFor="let cat of categories"
            class="category-pill"
            [class.active]="selectedCategory() === cat"
            (click)="onSelectCategory(cat)"
          >
            {{ cat }}
          </button>
        </div>
      </div>

      <!-- ローディング: スケルトン表示（12件） -->
      <div *ngIf="loading()" class="product-grid skeleton-grid">
        <div *ngFor="let item of skeletonItems" class="card skeleton-card">
          <div class="skeleton-image skeleton-shimmer"></div>
          <div class="skeleton-content">
            <div class="skeleton-line skeleton-category skeleton-shimmer"></div>
            <div class="skeleton-line skeleton-title skeleton-shimmer"></div>
            <div class="skeleton-line skeleton-title-short skeleton-shimmer"></div>
            <div class="skeleton-row">
              <div class="skeleton-line skeleton-price skeleton-shimmer"></div>
              <div class="skeleton-line skeleton-stock skeleton-shimmer"></div>
            </div>
            <div class="skeleton-line skeleton-button skeleton-shimmer" *ngIf="!auth.isSeller()"></div>
          </div>
        </div>
      </div>

      <!-- 商品一覧グリッド -->
      <div *ngIf="!loading() && products().length > 0">
        <div class="product-grid">
          <app-product-card
            *ngFor="let product of products()"
            [product]="product"
            (addToCart)="handleAddToCart($event)"
          ></app-product-card>
        </div>

        <!-- ページネーション (lastKey ベースのカーソル方式) -->
        <div class="pagination-bar">
          <button
            type="button"
            class="btn btn-outline pagination-btn"
            [disabled]="keyHistory().length === 0 || loading()"
            (click)="onPrevPage()"
          >
            ← 前のページ
          </button>

          <span class="page-indicator">
            ページ {{ currentPage() }}
          </span>

          <button
            type="button"
            class="btn btn-outline pagination-btn"
            [disabled]="!nextLastKey() || loading()"
            (click)="onNextPage()"
          >
            次のページ →
          </button>
        </div>
      </div>

      <!-- 商品なし (Empty State) -->
      <div *ngIf="!loading() && products().length === 0" class="card empty-state">
        <div class="empty-icon">🔍</div>
        <h2>該当する商品がありません</h2>
        <p>「{{ selectedCategory() }}」カテゴリには現在登録されている商品がありません。</p>
        <button
          *ngIf="selectedCategory() !== 'すべて'"
          type="button"
          class="btn btn-primary"
          style="margin-top: 16px;"
          (click)="onSelectCategory('すべて')"
        >
          すべての商品を表示
        </button>
      </div>
    </div>
  `,
  styles: [`
    .product-list-page {
      max-width: 1200px;
      margin: 0 auto;
      padding-bottom: 60px;
    }

    .page-header {
      margin-bottom: 24px;
    }

    .subtitle {
      font-size: 14px;
      color: #666;
      margin-top: -16px;
      margin-bottom: 20px;
    }

    /* トースト通知 */
    .toast-notification {
      position: sticky;
      top: 66px;
      z-index: 90;
      background: #1c7ed6;
      color: white;
      padding: 12px 20px;
      border-radius: 8px;
      box-shadow: 0 4px 12px rgba(28, 126, 214, 0.3);
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 20px;
      animation: slideDown 0.3s ease;
    }

    .toast-link {
      color: white;
      font-weight: 700;
      text-decoration: underline;
      margin-left: 16px;
    }

    @keyframes slideDown {
      from { transform: translateY(-10px); opacity: 0; }
      to { transform: translateY(0); opacity: 1; }
    }

    /* カテゴリフィルター */
    .category-filter-bar {
      display: flex;
      align-items: center;
      gap: 12px;
      margin-bottom: 28px;
      overflow-x: auto;
      padding-bottom: 8px;
    }

    .filter-label {
      font-size: 14px;
      font-weight: 600;
      color: #495057;
      white-space: nowrap;
    }

    .category-pill-group {
      display: flex;
      gap: 8px;
      flex-wrap: nowrap;
    }

    .category-pill {
      background: white;
      border: 1px solid #dee2e6;
      border-radius: 20px;
      padding: 6px 16px;
      font-size: 13px;
      font-weight: 500;
      color: #495057;
      cursor: pointer;
      white-space: nowrap;
      transition: all 0.2s;
    }

    .category-pill:hover {
      background: #f1f3f5;
      border-color: #ced4da;
    }

    .category-pill.active {
      background: #4263eb;
      color: white;
      border-color: #4263eb;
      font-weight: 600;
      box-shadow: 0 2px 6px rgba(66, 99, 235, 0.3);
    }

    /* 商品グリッド */
    .product-grid {
      display: grid;
      grid-template-columns: repeat(auto-fill, minmax(240px, 1fr));
      gap: 20px;
      margin-bottom: 36px;
    }

    @media (max-width: 576px) {
      .product-grid {
        grid-template-columns: repeat(auto-fill, minmax(160px, 1fr));
        gap: 12px;
      }
    }

    /* スケルトンローディング */
    .skeleton-card {
      padding: 0;
      overflow: hidden;
      border: 1px solid #eaeaea;
      height: 350px;
      display: flex;
      flex-direction: column;
    }

    .skeleton-image {
      width: 100%;
      aspect-ratio: 4 / 3;
      background-color: #e9ecef;
    }

    .skeleton-content {
      padding: 14px;
      display: flex;
      flex-direction: column;
      gap: 12px;
      flex: 1;
    }

    .skeleton-line {
      height: 12px;
      background: #e9ecef;
      border-radius: 4px;
    }

    .skeleton-category { width: 35%; height: 10px; }
    .skeleton-title { width: 90%; height: 14px; }
    .skeleton-title-short { width: 60%; height: 14px; }
    .skeleton-row {
      display: flex;
      justify-content: space-between;
      margin-top: auto;
      gap: 8px;
    }
    .skeleton-price { width: 40%; height: 18px; }
    .skeleton-stock { width: 25%; height: 14px; }
    .skeleton-button { width: 100%; height: 34px; border-radius: 6px; }

    .skeleton-shimmer {
      background: linear-gradient(90deg, #f0f0f0 25%, #e0e0e0 50%, #f0f0f0 75%);
      background-size: 200% 100%;
      animation: shimmer 1.5s infinite;
    }

    @keyframes shimmer {
      0% { background-position: 200% 0; }
      100% { background-position: -200% 0; }
    }

    /* ページネーション */
    .pagination-bar {
      display: flex;
      justify-content: center;
      align-items: center;
      gap: 16px;
      margin-top: 40px;
      padding-top: 20px;
      border-top: 1px solid #eee;
    }

    .pagination-btn {
      min-width: 130px;
      font-weight: 600;
    }

    .page-indicator {
      font-size: 14px;
      font-weight: 600;
      color: #495057;
      padding: 0 8px;
    }

    /* 空状態 */
    .empty-state {
      text-align: center;
      padding: 60px 20px;
      color: #666;
    }

    .empty-icon {
      font-size: 48px;
      margin-bottom: 12px;
    }
  `],
})
export class ProductListComponent implements OnInit {
  api = inject(ApiService);
  auth = inject(AuthService);
  cart = inject(CartService);
  private orderService = inject(OrderService);

  products = signal<Product[]>([]);
  loading = signal<boolean>(true);

  // カテゴリ一覧
  categories = [
    'すべて',
    '食品',
    'ファッション',
    '家電・PC',
    '本・書籍',
    'ホーム・キッチン',
    'スポーツ・アウトドア',
    'その他',
  ];
  selectedCategory = signal<string>('すべて');

  // lastKey ベースのカーソル方式ページネーション
  currentPage = signal<number>(1);
  currentLastKey = signal<string | undefined>(undefined);
  nextLastKey = signal<string | undefined>(undefined);
  keyHistory = signal<string[]>([]); // 過去のキー履歴スタック（前ページに戻る用）

  // ローディング時のスケルトン用（12件）
  skeletonItems = Array.from({ length: 12 }, (_, i) => i);

  // トースト通知
  toastMessage = signal<string>('');
  private toastTimer: any;

  ngOnInit(): void {
    this.orderService.resetJustCompleted();
    this.fetchProducts();
  }

  /**
   * 商品データを取得
   */
  fetchProducts(lastKey?: string): void {
    this.loading.set(true);

    const category = this.selectedCategory() === 'すべて' ? undefined : this.selectedCategory();

    this.api.getProducts({
      category,
      limit: 12,
      lastKey,
    }).subscribe({
      next: res => {
        this.products.set(res.products ?? []);
        this.nextLastKey.set(res.lastEvaluatedKey as string | undefined);
        this.loading.set(false);
      },
      error: err => {
        console.error('Failed to fetch products:', err);
        this.products.set([]);
        this.nextLastKey.set(undefined);
        this.loading.set(false);
      },
    });
  }

  /**
   * カテゴリ選択時（即時再取得 & ページネーションリセット）
   */
  onSelectCategory(category: string): void {
    if (this.selectedCategory() === category) return;

    this.selectedCategory.set(category);
    this.currentPage.set(1);
    this.currentLastKey.set(undefined);
    this.nextLastKey.set(undefined);
    this.keyHistory.set([]);

    this.fetchProducts();
  }

  /**
   * 次ページ押下（GET /products lastKey=カーソル）
   */
  onNextPage(): void {
    const nextKey = this.nextLastKey();
    if (!nextKey || this.loading()) return;

    // 現在のキーを履歴スタックにプッシュ
    this.keyHistory.update(hist => [...hist, this.currentLastKey() ?? '']);
    this.currentPage.update(p => p + 1);
    this.currentLastKey.set(nextKey);

    this.fetchProducts(nextKey);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  /**
   * 前ページ押下
   */
  onPrevPage(): void {
    const hist = this.keyHistory();
    if (hist.length === 0 || this.loading()) return;

    const prevKey = hist[hist.length - 1];
    this.keyHistory.update(h => h.slice(0, -1));
    this.currentPage.update(p => p - 1);
    this.currentLastKey.set(prevKey || undefined);

    this.fetchProducts(prevKey || undefined);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  /**
   * カートへ追加
   */
  handleAddToCart({ product }: { product: Product; event: Event }): void {
    this.cart.addItem(product, 1);

    if (this.toastTimer) {
      clearTimeout(this.toastTimer);
    }
    this.toastMessage.set(`🛒「${product.name}」をカートに追加しました！`);
    this.toastTimer = setTimeout(() => {
      this.toastMessage.set('');
    }, 4000);
  }
}
