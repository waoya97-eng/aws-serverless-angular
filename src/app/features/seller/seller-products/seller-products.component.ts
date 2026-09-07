import { Component, OnInit, inject, signal, computed } from '@angular/core';
import { NgIf, NgFor, NgClass, DatePipe } from '@angular/common';
import { RouterLink } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { ApiService } from '../../../core/services/api.service';
import { AuthService } from '../../../core/services/auth.service';
import { Product } from '../../../core/models/product.model';

@Component({
  selector: 'app-seller-products',
  standalone: true,
  imports: [NgIf, NgFor, NgClass, RouterLink, FormsModule, DatePipe],
  template: `
    <div class="seller-page">
      <div class="breadcrumb">
        <a routerLink="/home">← ホームに戻る</a>
      </div>

      <div class="page-header">
        <div>
          <h1 class="page-title" style="margin-bottom:4px;">出品商品管理</h1>
          <p class="subtitle">出品商品の登録、情報編集、在庫管理、削除を行えます。</p>
        </div>
        <button type="button" class="btn btn-primary" (click)="openCreateModal()">
          ＋ 新規商品を登録
        </button>
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

      <!-- KPI サマリーカード -->
      <div class="stats-grid">
        <div class="card stat-card">
          <span class="stat-label">総出品数</span>
          <span class="stat-value">{{ totalCount() }} 点</span>
        </div>
        <div class="card stat-card">
          <span class="stat-label">在庫あり</span>
          <span class="stat-value in-stock">{{ inStockCount() }} 点</span>
        </div>
        <div class="card stat-card">
          <span class="stat-label">在庫切れ</span>
          <span class="stat-value out-stock">{{ outOfStockCount() }} 点</span>
        </div>
      </div>

      <!-- フィルター・検索バー -->
      <div class="card filter-card">
        <div class="filter-controls">
          <div class="search-box">
            <input
              type="text"
              placeholder="🔍 商品名・説明で検索..."
              [ngModel]="searchQuery()"
              (ngModelChange)="searchQuery.set($event)"
            />
          </div>
          <div class="select-group">
            <label>カテゴリー:</label>
            <select [ngModel]="selectedCategory()" (ngModelChange)="selectedCategory.set($event)">
              <option value="all">すべて</option>
              <option *ngFor="let cat of categories" [value]="cat">{{ cat }}</option>
            </select>
          </div>
          <div class="select-group">
            <label>在庫状態:</label>
            <select [ngModel]="selectedStockStatus()" (ngModelChange)="selectedStockStatus.set($event)">
              <option value="all">すべて</option>
              <option value="inStock">在庫あり</option>
              <option value="outOfStock">在庫切れ</option>
            </select>
          </div>
        </div>
      </div>

      <!-- ローディング -->
      <div *ngIf="loading()" class="loading">
        商品データを読み込み中...
      </div>

      <!-- 商品なし (空状態) -->
      <div *ngIf="!loading() && filteredProducts().length === 0" class="card empty-state">
        <div class="empty-icon">📦</div>
        <h2>商品が見つかりません</h2>
        <p *ngIf="products().length === 0">まだ商品を出品していません。「新規商品を登録」ボタンから商品を出品してみましょう。</p>
        <p *ngIf="products().length > 0">検索条件に一致する商品がありませんでした。</p>
        <button
          *ngIf="products().length === 0"
          type="button"
          class="btn btn-primary"
          style="margin-top: 16px;"
          (click)="openCreateModal()"
        >
          ＋ 新規商品を登録する
        </button>
        <button
          *ngIf="products().length > 0"
          type="button"
          class="btn btn-outline"
          style="margin-top: 16px;"
          (click)="resetFilters()"
        >
          フィルターを解除
        </button>
      </div>

      <!-- 商品テーブル -->
      <div *ngIf="!loading() && filteredProducts().length > 0" class="card table-card">
        <div class="table-responsive">
          <table class="product-table">
            <thead>
              <tr>
                <th style="width:60px;">画像</th>
                <th>商品名 / ID</th>
                <th>カテゴリー</th>
                <th>価格</th>
                <th>在庫</th>
                <th>登録日</th>
                <th>操作</th>
              </tr>
            </thead>
            <tbody>
              <tr *ngFor="let prod of filteredProducts()">
                <td>
                  <div class="img-thumb">
                    <img *ngIf="prod.imageUrl; else noImg" [src]="prod.imageUrl" [alt]="prod.name" />
                    <ng-template #noImg>No Img</ng-template>
                  </div>
                </td>
                <td>
                  <div class="name-text">{{ prod.name }}</div>
                  <div class="id-sub">ID: {{ prod.productId }}</div>
                </td>
                <td>
                  <span class="category-tag">{{ prod.category }}</span>
                </td>
                <td class="td-price">
                  ¥{{ prod.price.toLocaleString() }}
                </td>
                <td>
                  <span
                    class="stock-tag"
                    [class.in]="prod.stock > 0"
                    [class.out]="prod.stock === 0"
                  >
                    {{ prod.stock > 0 ? '在庫 ' + prod.stock : '在庫切れ' }}
                  </span>
                </td>
                <td style="color:#888; font-size:12px;">
                  {{ (prod.createdAt | date:'yyyy/MM/dd') || '---' }}
                </td>
                <td>
                  <div class="action-buttons">
                    <a
                      [routerLink]="['/products', prod.sellerId, prod.productId]"
                      class="btn btn-outline btn-sm"
                      title="詳細確認"
                    >
                      詳細
                    </a>
                    <button
                      type="button"
                      class="btn btn-outline btn-sm"
                      (click)="openEditModal(prod)"
                      title="編集"
                    >
                      編集
                    </button>
                    <button
                      type="button"
                      class="btn btn-danger btn-sm"
                      (click)="openDeleteConfirm(prod)"
                      title="削除"
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

      <!-- 登録・編集モーダル -->
      <div *ngIf="modalOpen()" class="modal-overlay" (click)="closeModal()">
        <div class="modal-card" (click)="$event.stopPropagation()">
          <div class="modal-header">
            <h2 class="modal-title">{{ editingProduct() ? '商品情報の編集' : '新規商品登録' }}</h2>
            <button type="button" class="modal-close" (click)="closeModal()">✕</button>
          </div>

          <form (ngSubmit)="onSaveProduct()">
            <div *ngIf="formError()" class="alert alert-error" style="margin-bottom:12px;">
              {{ formError() }}
            </div>

            <div class="form-group">
              <label for="pName">商品名 <span style="color:#e03131;">*</span></label>
              <input
                id="pName"
                type="text"
                [(ngModel)]="formName"
                name="formName"
                required
                placeholder="例: ノイズキャンセリング ヘッドホン"
              />
            </div>

            <div class="form-row">
              <div class="form-group col-half">
                <label for="pCategory">カテゴリー <span style="color:#e03131;">*</span></label>
                <select id="pCategory" [(ngModel)]="formCategory" name="formCategory">
                  <option *ngFor="let c of categories" [value]="c">{{ c }}</option>
                </select>
              </div>
              <div class="form-group col-half">
                <label for="pPrice">価格 (円) <span style="color:#e03131;">*</span></label>
                <input
                  id="pPrice"
                  type="number"
                  [(ngModel)]="formPrice"
                  name="formPrice"
                  min="1"
                  required
                  placeholder="例: 9800"
                />
              </div>
            </div>

            <div class="form-group">
              <label for="pStock">在庫数 <span style="color:#e03131;">*</span></label>
              <input
                id="pStock"
                type="number"
                [(ngModel)]="formStock"
                name="formStock"
                min="0"
                required
                placeholder="例: 20"
              />
            </div>

            <div class="form-group">
              <label for="pDesc">商品説明 <span style="color:#e03131;">*</span></label>
              <textarea
                id="pDesc"
                [(ngModel)]="formDescription"
                name="formDescription"
                rows="3"
                required
                placeholder="商品の特徴や状態を入力してください"
              ></textarea>
            </div>

            <div class="form-group">
              <label>商品画像</label>
              <div class="image-tabs">
                <button
                  type="button"
                  class="tab-btn"
                  [class.active]="imageUploadMode === 'url'"
                  (click)="imageUploadMode = 'url'"
                >画像URL</button>
                <button
                  type="button"
                  class="tab-btn"
                  [class.active]="imageUploadMode === 'file'"
                  (click)="imageUploadMode = 'file'"
                >ファイル選択</button>
              </div>

              <div *ngIf="imageUploadMode === 'url'">
                <input
                  type="url"
                  [(ngModel)]="formImageUrl"
                  name="formImageUrl"
                  placeholder="https://example.com/image.jpg"
                  (input)="onUrlInput()"
                />
              </div>

              <div *ngIf="imageUploadMode === 'file'">
                <input
                  type="file"
                  accept="image/*"
                  (change)="onFileSelected($event)"
                />
              </div>

              <div *ngIf="previewImageSrc()" class="img-preview-box">
                <img [src]="previewImageSrc()" alt="Preview" />
                <button type="button" class="btn-remove-img" (click)="clearImage()">画像解除</button>
              </div>
            </div>

            <div class="modal-footer">
              <button type="button" class="btn btn-outline" (click)="closeModal()" [disabled]="isSaving()">
                キャンセル
              </button>
              <button type="submit" class="btn btn-primary" [disabled]="isSaving()">
                {{ isSaving() ? '保存中...' : (editingProduct() ? '変更を保存' : '登録する') }}
              </button>
            </div>
          </form>
        </div>
      </div>

      <!-- 削除確認モーダル -->
      <div *ngIf="deleteConfirmProduct() as target" class="modal-overlay" (click)="cancelDelete()">
        <div class="modal-card modal-confirm" (click)="$event.stopPropagation()">
          <div class="confirm-icon">⚠️</div>
          <h2 style="font-size:18px;margin-bottom:8px;">商品を削除しますか？</h2>
          <p class="confirm-desc">
            「<strong>{{ target.name }}</strong>」を削除してもよろしいですか？<br />
            この操作を実行すると商品データが削除されます。
          </p>
          <div class="modal-footer" style="justify-content:center;margin-top:0;">
            <button type="button" class="btn btn-outline" (click)="cancelDelete()" [disabled]="isDeleting()">
              キャンセル
            </button>
            <button type="button" class="btn btn-danger" (click)="executeDelete()" [disabled]="isDeleting()">
              {{ isDeleting() ? '削除中...' : '削除する' }}
            </button>
          </div>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .seller-page { max-width: 1100px; margin: 0 auto; }
    .breadcrumb { margin-bottom: 16px; font-size: 14px; }
    .breadcrumb a { color: #555; }
    .page-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 20px; flex-wrap: wrap; gap: 12px; }
    .subtitle { color: #666; font-size: 14px; margin-bottom: 0; }
    .close-btn { background: none; border: none; font-size: 16px; cursor: pointer; color: inherit; }
    .stats-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(160px, 1fr)); gap: 16px; margin-bottom: 20px; }
    .stat-card { padding: 16px; }
    .stat-label { font-size: 12px; color: #666; display: block; }
    .stat-value { font-size: 24px; font-weight: 700; color: #333; }
    .stat-value.in-stock { color: #2b8a3e; }
    .stat-value.out-stock { color: #e03131; }
    .filter-card { padding: 12px 16px; margin-bottom: 16px; }
    .filter-controls { display: flex; align-items: center; gap: 12px; flex-wrap: wrap; }
    .search-box { flex: 1; min-width: 200px; }
    .search-box input { width: 100%; padding: 8px 12px; border: 1px solid #ddd; border-radius: 6px; }
    .select-group { display: flex; align-items: center; gap: 6px; font-size: 13px; color: #555; }
    .select-group select { padding: 6px 10px; border: 1px solid #ddd; border-radius: 6px; background: white; }
    .empty-icon { font-size: 40px; margin-bottom: 8px; }
    .table-card { padding: 0; overflow: hidden; }
    .table-responsive { overflow-x: auto; }
    .product-table { width: 100%; border-collapse: collapse; font-size: 14px; }
    .product-table th { background: #f8f9fa; padding: 10px 12px; border-bottom: 2px solid #dee2e6; font-size: 12px; color: #555; text-align: left; }
    .product-table td { padding: 10px 12px; border-bottom: 1px solid #eee; vertical-align: middle; }
    .img-thumb { width: 48px; height: 48px; border-radius: 4px; overflow: hidden; background: #eee; display: flex; align-items: center; justify-content: center; font-size: 10px; color: #999; }
    .img-thumb img { width: 100%; height: 100%; object-fit: cover; }
    .name-text { font-weight: 600; color: #222; }
    .id-sub { font-size: 11px; color: #888; font-family: monospace; }
    .category-tag { background: #e7f5ff; color: #1c7ed6; padding: 2px 8px; border-radius: 4px; font-size: 12px; }
    .td-price { font-weight: 700; color: #4263eb; }
    .stock-tag { padding: 2px 8px; border-radius: 10px; font-size: 12px; font-weight: 600; }
    .stock-tag.in { background: #e6fcf5; color: #0ca678; }
    .stock-tag.out { background: #fff5f5; color: #e03131; }
    .action-buttons { display: flex; gap: 6px; }
    .modal-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 16px; }
    .modal-title { font-size: 18px; font-weight: 700; margin: 0; }
    .modal-close { background: none; border: none; font-size: 18px; cursor: pointer; color: #888; }
    .form-row { display: flex; gap: 12px; }
    .col-half { flex: 1; }
    .image-tabs { display: flex; gap: 8px; margin-bottom: 8px; }
    .tab-btn { background: #f1f3f5; border: 1px solid #dee2e6; border-radius: 4px; padding: 4px 8px; font-size: 12px; cursor: pointer; }
    .tab-btn.active { background: #4263eb; color: white; border-color: #4263eb; }
    .img-preview-box { margin-top: 8px; display: flex; align-items: center; gap: 10px; }
    .img-preview-box img { width: 60px; height: 60px; object-fit: cover; border-radius: 4px; border: 1px solid #ddd; }
    .btn-remove-img { background: none; border: 1px solid #ffc9c9; color: #e03131; font-size: 11px; padding: 2px 6px; border-radius: 4px; cursor: pointer; }
    .modal-footer { display: flex; justify-content: flex-end; gap: 10px; margin-top: 20px; }
    .modal-confirm { text-align: center; max-width: 380px; }
    .confirm-icon { font-size: 36px; margin-bottom: 8px; }
    .confirm-desc { font-size: 14px; color: #666; margin-bottom: 16px; line-height: 1.5; }
  `],
})
export class SellerProductsComponent implements OnInit {
  private api = inject(ApiService);
  private auth = inject(AuthService);

  products = signal<Product[]>([]);
  loading = signal<boolean>(true);
  isSaving = signal<boolean>(false);
  isDeleting = signal<boolean>(false);

  successMessage = signal<string>('');
  errorMessage = signal<string>('');

  // フィルター
  searchQuery = signal<string>('');
  selectedCategory = signal<string>('all');
  selectedStockStatus = signal<string>('all');

  categories = ['食品', 'ファッション', '家電・PC', '本・書籍', 'ホーム・キッチン', 'スポーツ・アウトドア', 'その他'];

  // モーダル
  modalOpen = signal<boolean>(false);
  editingProduct = signal<Product | null>(null);
  deleteConfirmProduct = signal<Product | null>(null);

  // フォームデータ
  formName = '';
  formCategory = '食品';
  formPrice: number | null = null;
  formStock: number | null = null;
  formDescription = '';
  formImageUrl = '';
  selectedFile: File | null = null;
  filePreviewDataUrl = '';
  imageUploadMode: 'url' | 'file' = 'url';
  formError = signal<string>('');

  previewImageSrc = computed(() => {
    if (this.imageUploadMode === 'file' && this.filePreviewDataUrl) {
      return this.filePreviewDataUrl;
    }
    return this.formImageUrl;
  });

  filteredProducts = computed(() => {
    const list = this.products();
    const q = this.searchQuery().trim().toLowerCase();
    const cat = this.selectedCategory();
    const stock = this.selectedStockStatus();

    return list.filter(p => {
      const matchQuery = !q || p.name.toLowerCase().includes(q) || (p.description && p.description.toLowerCase().includes(q));
      const matchCat = cat === 'all' || p.category === cat;
      const matchStock = stock === 'all' || (stock === 'inStock' ? p.stock > 0 : p.stock === 0);
      return matchQuery && matchCat && matchStock;
    });
  });

  totalCount = computed(() => this.products().length);
  inStockCount = computed(() => this.products().filter(p => p.stock > 0).length);
  outOfStockCount = computed(() => this.products().filter(p => p.stock === 0).length);

  ngOnInit(): void {
    this.loadProducts();
  }

  loadProducts(): void {
    this.loading.set(true);
    const sellerId = this.auth.userId() || undefined;

    this.api.getSellerProducts(sellerId).subscribe({
      next: res => {
        this.products.set(res.products);
        this.loading.set(false);
      },
      error: err => {
        console.warn('getSellerProducts failed, using fallback:', err);
        this.loading.set(false);
      },
    });
  }

  resetFilters(): void {
    this.searchQuery.set('');
    this.selectedCategory.set('all');
    this.selectedStockStatus.set('all');
  }

  openCreateModal(): void {
    this.editingProduct.set(null);
    this.formName = '';
    this.formCategory = '食品';
    this.formPrice = null;
    this.formStock = 10;
    this.formDescription = '';
    this.formImageUrl = '';
    this.selectedFile = null;
    this.filePreviewDataUrl = '';
    this.imageUploadMode = 'url';
    this.formError.set('');
    this.modalOpen.set(true);
  }

  openEditModal(product: Product): void {
    this.editingProduct.set(product);
    this.formName = product.name;
    this.formCategory = product.category;
    this.formPrice = product.price;
    this.formStock = product.stock;
    this.formDescription = product.description;
    this.formImageUrl = product.imageUrl || '';
    this.selectedFile = null;
    this.filePreviewDataUrl = '';
    this.imageUploadMode = 'url';
    this.formError.set('');
    this.modalOpen.set(true);
  }

  closeModal(): void {
    this.modalOpen.set(false);
    this.editingProduct.set(null);
    this.formError.set('');
  }

  onFileSelected(event: Event): void {
    const input = event.target as HTMLInputElement;
    if (input.files && input.files[0]) {
      const file = input.files[0];
      this.selectedFile = file;

      const reader = new FileReader();
      reader.onload = () => {
        this.filePreviewDataUrl = reader.result as string;
      };
      reader.readAsDataURL(file);
    }
  }

  onUrlInput(): void {
    this.filePreviewDataUrl = '';
  }

  clearImage(): void {
    this.formImageUrl = '';
    this.selectedFile = null;
    this.filePreviewDataUrl = '';
  }

  async onSaveProduct(): Promise<void> {
    if (!this.formName.trim()) {
      this.formError.set('商品名を入力してください。');
      return;
    }
    if (this.formPrice === null || this.formPrice <= 0) {
      this.formError.set('有効な価格（1円以上）を入力してください。');
      return;
    }
    if (this.formStock === null || this.formStock < 0) {
      this.formError.set('有効な在庫数（0以上）を入力してください。');
      return;
    }
    if (!this.formDescription.trim()) {
      this.formError.set('商品説明を入力してください。');
      return;
    }

    this.isSaving.set(true);
    this.formError.set('');

    const currentSellerId = this.auth.userId() || 'seller001';
    const editing = this.editingProduct();
    const productId = editing?.productId || 'prod_' + Date.now().toString(36);

    let finalImageUrl = this.formImageUrl.trim();

    // ファイルアップロードが選択されている場合
    if (this.imageUploadMode === 'file' && this.selectedFile) {
      try {
        const uploadInfo = await new Promise<{ uploadUrl: string; imageUrl: string }>((resolve, reject) => {
          this.api.getUploadUrl(productId, this.selectedFile!.type).subscribe({
            next: res => resolve(res),
            error: err => reject(err),
          });
        });

        if (uploadInfo?.uploadUrl) {
          await this.api.uploadImage(uploadInfo.uploadUrl, this.selectedFile);
          finalImageUrl = uploadInfo.imageUrl;
        }
      } catch (err) {
        console.warn('Image S3 upload failed, falling back to data URL preview:', err);
        finalImageUrl = this.filePreviewDataUrl;
      }
    } else if (this.imageUploadMode === 'file' && this.filePreviewDataUrl) {
      finalImageUrl = this.filePreviewDataUrl;
    }

    const payload: Partial<Product> = {
      name: this.formName.trim(),
      category: this.formCategory,
      price: Number(this.formPrice),
      stock: Number(this.formStock),
      description: this.formDescription.trim(),
      imageUrl: finalImageUrl || undefined,
    };

    if (editing) {
      this.api.updateProduct(editing.sellerId, editing.productId, payload).subscribe({
        next: updated => {
          this.products.update(list =>
            list.map(p => (p.productId === updated.productId ? updated : p))
          );
          this.isSaving.set(false);
          this.closeModal();
          this.showSuccess(`商品「${updated.name}」の情報を更新しました。`);
        },
        error: err => {
          this.isSaving.set(false);
          this.formError.set('商品の更新に失敗しました: ' + (err?.message || 'エラーが発生しました'));
        },
      });
    } else {
      const newProductData: Partial<Product> = {
        ...payload,
        sellerId: currentSellerId,
        productId,
        createdAt: new Date().toISOString(),
      };

      this.api.createProduct(newProductData).subscribe({
        next: created => {
          this.products.update(list => [created, ...list]);
          this.isSaving.set(false);
          this.closeModal();
          this.showSuccess(`商品「${created.name}」を登録しました。`);
        },
        error: err => {
          this.isSaving.set(false);
          this.formError.set('商品の登録に失敗しました: ' + (err?.message || 'エラーが発生しました'));
        },
      });
    }
  }

  openDeleteConfirm(product: Product): void {
    this.deleteConfirmProduct.set(product);
  }

  cancelDelete(): void {
    this.deleteConfirmProduct.set(null);
  }

  executeDelete(): void {
    const target = this.deleteConfirmProduct();
    if (!target) return;

    this.isDeleting.set(true);

    this.api.deleteProduct(target.sellerId, target.productId).subscribe({
      next: () => {
        this.products.update(list => list.filter(p => p.productId !== target.productId));
        this.isDeleting.set(false);
        this.deleteConfirmProduct.set(null);
        this.showSuccess(`商品「${target.name}」を削除しました。`);
      },
      error: err => {
        this.isDeleting.set(false);
        this.deleteConfirmProduct.set(null);
        this.errorMessage.set('商品の削除に失敗しました: ' + (err?.message || ''));
      },
    });
  }

  private showSuccess(msg: string): void {
    this.successMessage.set(msg);
    setTimeout(() => {
      if (this.successMessage() === msg) {
        this.successMessage.set('');
      }
    }, 4000);
  }
}
