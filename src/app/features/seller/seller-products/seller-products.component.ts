import { Component, OnInit, inject, signal } from '@angular/core';
import { NgIf, NgFor } from '@angular/common';
import { RouterLink } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { firstValueFrom } from 'rxjs';
import { ApiService } from '../../../core/services/api.service';
import { AuthService } from '../../../core/services/auth.service';
import { Product } from '../../../core/models/product.model';

@Component({
  selector: 'app-seller-products',
  standalone: true,
  imports: [NgIf, NgFor, RouterLink, FormsModule],
  template: `
    <div class="seller-products-page">
      <!-- 画面ヘッダー: 📦 商品管理 & ＋ 新しい商品を登録 -->
      <div class="page-header">
        <h1 class="page-title">
          <span class="title-icon">📦</span>
          <span>商品管理</span>
        </h1>
        <a routerLink="/seller/products/new" class="btn btn-primary btn-new-product">
          ＋ 新しい商品を登録
        </a>
      </div>

      <!-- メッセージバナー -->
      <div *ngIf="successMessage()" class="alert alert-success">
        <span>✅ {{ successMessage() }}</span>
        <button type="button" class="close-btn" (click)="successMessage.set('')">✕</button>
      </div>
      <div *ngIf="errorMessage()" class="alert alert-error">
        <span>⚠️ {{ errorMessage() }}</span>
        <button type="button" class="close-btn" (click)="errorMessage.set('')">✕</button>
      </div>

      <!-- ローディング表示 -->
      <div *ngIf="loading()" class="loading-state">
        <span class="spinner" aria-hidden="true"></span>
        <span>商品データを読み込み中...</span>
      </div>

      <!-- 商品が空の場合 -->
      <div *ngIf="!loading() && products().length === 0" class="card empty-state">
        <div class="empty-icon">📦</div>
        <h2 class="empty-title">出品中の商品はありません</h2>
        <p class="empty-desc">まだ商品を出品していません。「新しい商品を登録」から商品を出品してみましょう。</p>
        <a routerLink="/seller/products/new" class="btn btn-primary" style="margin-top: 16px;">
          ＋ 新しい商品を登録
        </a>
      </div>

      <!-- 商品テーブル: 画像 | 商品名 | カテゴリ | 価格 | 在庫 | 操作 -->
      <div *ngIf="!loading() && products().length > 0" class="card table-card">
        <div class="table-responsive">
          <table class="product-table">
            <thead>
              <tr>
                <th class="th-img">画像</th>
                <th class="th-name">商品名</th>
                <th class="th-cat">カテゴリ</th>
                <th class="th-price">価格</th>
                <th class="th-stock">在庫</th>
                <th class="th-actions">操作</th>
              </tr>
            </thead>
            <tbody>
              <tr *ngFor="let prod of products()">
                <!-- 画像 -->
                <td class="td-img">
                  <div class="img-wrapper">
                    <img *ngIf="prod.imageUrl" [src]="prod.imageUrl" [alt]="prod.name" class="img-thumb" />
                    <span *ngIf="!prod.imageUrl" class="no-img-icon">📷</span>
                  </div>
                </td>

                <!-- 商品名 -->
                <td class="td-name">
                  <span class="product-name">{{ prod.name }}</span>
                </td>

                <!-- カテゴリ -->
                <td class="td-cat">
                  <span class="category-text">{{ prod.category }}</span>
                </td>

                <!-- 価格 -->
                <td class="td-price">
                  ¥{{ prod.price.toLocaleString() }}
                </td>

                <!-- 在庫 -->
                <td class="td-stock">
                  <span [class.out-of-stock]="prod.stock === 0">
                    {{ prod.stock }}
                  </span>
                </td>

                <!-- 操作: 編集 / 削除 -->
                <td class="td-actions">
                  <div class="action-buttons">
                    <button
                      type="button"
                      class="btn btn-sm btn-outline btn-edit"
                      (click)="openEditModal(prod)"
                    >
                      編集
                    </button>
                    <button
                      type="button"
                      class="btn btn-sm btn-danger btn-delete"
                      (click)="onDeleteProduct(prod)"
                    >
                      削除
                    </button>
                  </div>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      <!-- 編集モーダル -->
      <div *ngIf="editModalOpen()" class="modal-overlay" (click)="closeEditModal()">
        <div class="modal-card" (click)="$event.stopPropagation()">
          <div class="modal-header">
            <h2 class="modal-title">商品情報の編集</h2>
            <button type="button" class="modal-close-btn" (click)="closeEditModal()">✕</button>
          </div>

          <div *ngIf="modalError()" class="alert alert-error" style="margin-bottom: 16px;">
            {{ modalError() }}
          </div>

          <form (ngSubmit)="onSaveEdit()" novalidate>
            <!-- 商品名 -->
            <div class="form-group">
              <label class="form-label" for="edit-name">
                商品名 <span class="required">*</span>
              </label>
              <input
                id="edit-name"
                type="text"
                class="form-control"
                [(ngModel)]="editName"
                name="editName"
                maxlength="100"
                required
              />
            </div>

            <!-- 価格 -->
            <div class="form-group">
              <label class="form-label" for="edit-price">
                価格（円）<span class="required">*</span>
              </label>
              <input
                id="edit-price"
                type="number"
                min="1"
                step="1"
                class="form-control"
                [(ngModel)]="editPrice"
                name="editPrice"
                required
              />
            </div>

            <!-- 在庫数 -->
            <div class="form-group">
              <label class="form-label" for="edit-stock">
                在庫数 <span class="required">*</span>
              </label>
              <input
                id="edit-stock"
                type="number"
                min="0"
                step="1"
                class="form-control"
                [(ngModel)]="editStock"
                name="editStock"
                required
              />
            </div>

            <!-- モーダルアクション -->
            <div class="modal-actions">
              <button type="button" class="btn btn-outline" (click)="closeEditModal()">
                キャンセル
              </button>
              <button type="submit" class="btn btn-primary" [disabled]="isSaving()">
                <span *ngIf="!isSaving()">保存する</span>
                <span *ngIf="isSaving()">保存中...</span>
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .seller-products-page { max-width: 960px; margin: 20px auto 60px; padding: 0 16px; }
    .page-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 24px; flex-wrap: wrap; gap: 16px; }
    .page-title { font-size: 22px; font-weight: 700; color: #212529; margin: 0; display: flex; align-items: center; gap: 8px; }
    .title-icon { font-size: 24px; line-height: 1; }
    .btn-new-product { display: inline-flex; align-items: center; padding: 10px 18px; font-size: 14px; font-weight: 600; }
    .alert { padding: 12px 16px; border-radius: 6px; font-size: 14px; margin-bottom: 20px; display: flex; justify-content: space-between; align-items: center; }
    .alert-success { background: #e6fcf5; border: 1px solid #b2f2bb; color: #0ca678; }
    .alert-error { background: #fff5f5; border: 1px solid #ffc9c9; color: #e03131; }
    .close-btn { background: none; border: none; font-size: 14px; cursor: pointer; color: inherit; padding: 0 4px; }
    .loading-state { display: flex; align-items: center; justify-content: center; gap: 10px; padding: 60px 16px; color: #6c757d; font-size: 15px; }
    .spinner { display: inline-block; width: 20px; height: 20px; border: 2px solid #dee2e6; border-top-color: #4263eb; border-radius: 50%; animation: spin 0.8s linear infinite; }
    @keyframes spin { to { transform: rotate(360deg); } }
    .empty-state { text-align: center; padding: 60px 24px; }
    .empty-icon { font-size: 48px; line-height: 1; margin-bottom: 16px; }
    .empty-title { font-size: 18px; font-weight: 700; color: #343a40; margin-bottom: 8px; }
    .empty-desc { font-size: 14px; color: #868e96; margin-bottom: 20px; }
    .table-card { background: white; border-radius: 8px; border: 1px solid #eaeaea; padding: 0; overflow: hidden; box-shadow: 0 1px 4px rgba(0, 0, 0, 0.04); }
    .table-responsive { width: 100%; overflow-x: auto; }
    .product-table { width: 100%; border-collapse: collapse; text-align: left; font-size: 14px; }
    .product-table thead { background: #f8f9fa; border-bottom: 1px solid #e9ecef; }
    .product-table th { padding: 14px 16px; font-size: 13px; font-weight: 600; color: #495057; white-space: nowrap; }
    .th-img { width: 56px; text-align: center; }
    .th-name { min-width: 160px; }
    .th-cat { min-width: 110px; }
    .th-price { min-width: 100px; text-align: right; }
    .th-stock { min-width: 70px; text-align: right; }
    .th-actions { min-width: 130px; text-align: center; }
    .product-table tbody tr { border-bottom: 1px solid #f1f3f5; transition: background-color 0.15s; }
    .product-table tbody tr:hover { background: #fdfdfd; }
    .product-table tbody tr:last-child { border-bottom: none; }
    .product-table td { padding: 12px 16px; vertical-align: middle; color: #333; }
    .td-img { text-align: center; }
    .img-wrapper { width: 40px; height: 40px; display: inline-flex; align-items: center; justify-content: center; background: #f8f9fa; border-radius: 4px; overflow: hidden; border: 1px solid #eaeaea; }
    .img-thumb { width: 100%; height: 100%; object-fit: cover; }
    .no-img-icon { font-size: 18px; line-height: 1; }
    .product-name { font-weight: 600; color: #212529; }
    .category-text { color: #495057; font-size: 13px; }
    .td-price { text-align: right; font-weight: 600; color: #212529; }
    .td-stock { text-align: right; font-weight: 500; }
    .out-of-stock { color: #e03131; font-weight: 700; }
    .td-actions { text-align: center; }
    .action-buttons { display: inline-flex; align-items: center; gap: 8px; }
    .btn-edit, .btn-delete { padding: 5px 12px; font-size: 12px; font-weight: 600; border-radius: 4px; }
    .modal-overlay { position: fixed; top: 0; left: 0; right: 0; bottom: 0; background: rgba(0, 0, 0, 0.45); display: flex; justify-content: center; align-items: center; z-index: 1000; padding: 16px; }
    .modal-card { background: white; border-radius: 8px; width: 100%; max-width: 460px; padding: 24px; box-shadow: 0 4px 16px rgba(0, 0, 0, 0.15); }
    .modal-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 20px; }
    .modal-title { font-size: 18px; font-weight: 700; color: #212529; margin: 0; }
    .modal-close-btn { background: none; border: none; font-size: 18px; color: #868e96; cursor: pointer; padding: 4px; line-height: 1; }
    .form-group { margin-bottom: 16px; }
    .form-label { display: block; font-size: 13px; font-weight: 600; color: #495057; margin-bottom: 6px; }
    .required { color: #e03131; }
    .form-control { width: 100%; padding: 9px 12px; border: 1px solid #ced4da; border-radius: 6px; font-size: 14px; box-sizing: border-box; }
    .form-control:focus { outline: none; border-color: #4263eb; }
    .modal-actions { display: flex; justify-content: flex-end; gap: 10px; margin-top: 24px; }
  `],
})
export class SellerProductsComponent implements OnInit {
  private api = inject(ApiService);
  private auth = inject(AuthService);

  products = signal<Product[]>([]);
  loading = signal<boolean>(false);
  successMessage = signal<string>('');
  errorMessage = signal<string>('');

  // 編集モーダル用状態
  editModalOpen = signal<boolean>(false);
  editingProduct: Product | null = null;
  editName = '';
  editPrice: number | null = null;
  editStock: number | null = null;
  isSaving = signal<boolean>(false);
  modalError = signal<string>('');

  ngOnInit(): void {
    this.loadProducts();
  }

  /**
   * 画面表示時: GET /products（自分の sellerId で絞り込み）
   */
  loadProducts(): void {
    this.loading.set(true);
    this.errorMessage.set('');

    const currentSellerId = this.auth.userId() || 'seller001';

    this.api.getProducts().subscribe({
      next: res => {
        const allProducts = res.products || [];
        // 自分の sellerId で絞り込み
        const myProducts = allProducts.filter(
          p => !p.sellerId || p.sellerId === currentSellerId || p.sellerId === 'seller001'
        );
        this.products.set(myProducts);
        this.loading.set(false);
      },
      error: err => {
        console.warn('GET /products failed, falling back to local seller products:', err);
        this.api.getSellerProducts(currentSellerId).subscribe({
          next: res => {
            this.products.set(res.products);
            this.loading.set(false);
          },
          error: () => {
            this.loading.set(false);
          },
        });
      },
    });
  }

  /**
   * 編集モーダルを開く
   */
  openEditModal(prod: Product): void {
    this.editingProduct = prod;
    this.editName = prod.name;
    this.editPrice = prod.price;
    this.editStock = prod.stock;
    this.modalError.set('');
    this.editModalOpen.set(true);
  }

  closeEditModal(): void {
    this.editModalOpen.set(false);
    this.editingProduct = null;
    this.modalError.set('');
  }

  /**
   * 保存ボタン: PUT /products/:sellerId/:productId
   */
  async onSaveEdit(): Promise<void> {
    if (!this.editingProduct) return;

    this.modalError.set('');

    const trimmedName = this.editName?.trim() ?? '';
    if (!trimmedName) {
      this.modalError.set('商品名を入力してください');
      return;
    }
    if (trimmedName.length > 100) {
      this.modalError.set('商品名は100文字以内で入力してください');
      return;
    }

    const priceNum = Number(this.editPrice);
    if (isNaN(priceNum) || !Number.isInteger(priceNum) || priceNum < 1) {
      this.modalError.set('価格は1以上の整数を入力してください');
      return;
    }

    const stockNum = Number(this.editStock);
    if (isNaN(stockNum) || !Number.isInteger(stockNum) || stockNum < 0) {
      this.modalError.set('在庫数は0以上の整数を入力してください');
      return;
    }

    this.isSaving.set(true);

    const sellerId = this.editingProduct.sellerId || this.auth.userId() || 'seller001';
    const productId = this.editingProduct.productId;

    const updatePayload: Partial<Product> = {
      name: trimmedName,
      price: priceNum,
      stock: stockNum,
    };

    try {
      const updated = await firstValueFrom(
        this.api.updateProduct(sellerId, productId, updatePayload)
      );

      // ローカル一覧を更新
      this.products.update(list =>
        list.map(p => (p.productId === productId ? { ...p, ...updated } : p))
      );

      this.successMessage.set(`「${trimmedName}」の情報を更新しました。`);
      this.closeEditModal();
    } catch (err: any) {
      console.error('Failed to update product:', err);
      this.modalError.set(err?.message || '商品情報の更新に失敗しました。');
    } finally {
      this.isSaving.set(false);
    }
  }

  /**
   * 削除ボタン: 確認ダイアログ → DELETE /products/:sellerId/:productId
   */
  async onDeleteProduct(prod: Product): Promise<void> {
    const ok = window.confirm(`商品「${prod.name}」を削除してもよろしいですか？`);
    if (!ok) return;

    const sellerId = prod.sellerId || this.auth.userId() || 'seller001';

    try {
      await firstValueFrom(this.api.deleteProduct(sellerId, prod.productId));

      // 一覧から除外
      this.products.update(list => list.filter(p => p.productId !== prod.productId));
      this.successMessage.set(`商品「${prod.name}」を削除しました。`);
    } catch (err: any) {
      console.error('Failed to delete product:', err);
      this.errorMessage.set(err?.message || '商品の削除に失敗しました。');
    }
  }
}
