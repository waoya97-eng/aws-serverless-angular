import { Component, inject, signal } from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import { NgIf, NgFor } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { firstValueFrom } from 'rxjs';
import { ApiService } from '../../../core/services/api.service';
import { AuthService } from '../../../core/services/auth.service';

@Component({
  selector: 'app-product-new',
  standalone: true,
  imports: [NgIf, NgFor, RouterLink, FormsModule],
  template: `
    <div class="product-new-page">
      <!-- ナビゲーション: ← 商品管理に戻る -->
      <div class="breadcrumb">
        <a routerLink="/seller/products" class="back-link">← 商品管理に戻る</a>
      </div>

      <!-- 画面カード -->
      <div class="card form-card">
        <!-- 画面タイトル: ＋ 商品登録 -->
        <h1 class="page-title">
          <span class="title-icon">＋</span>
          <span>商品登録</span>
        </h1>

        <!-- エラーメッセージ（API失敗時） -->
        <div *ngIf="generalError()" class="alert alert-error" role="alert">
          <span class="alert-icon">⚠️</span>
          <span>{{ generalError() }}</span>
        </div>

        <form (ngSubmit)="onSubmit()" novalidate>
          <!-- 商品名 * -->
          <div class="form-group">
            <label for="product-name" class="form-label">
              商品名 <span class="required">*</span>
            </label>
            <input
              id="product-name"
              type="text"
              class="form-control"
              [class.is-invalid]="formErrors()['name']"
              placeholder="ワイヤレスイヤホン Pro"
              [(ngModel)]="name"
              name="name"
              maxlength="100"
              (input)="clearFieldError('name')"
            />
            <div *ngIf="formErrors()['name']" class="field-error">
              {{ formErrors()['name'] }}
            </div>
          </div>

          <!-- カテゴリ * -->
          <div class="form-group">
            <label for="product-category" class="form-label">
              カテゴリ <span class="required">*</span>
            </label>
            <div class="select-wrapper">
              <select
                id="product-category"
                class="form-control"
                [class.is-invalid]="formErrors()['category']"
                [(ngModel)]="category"
                name="category"
                (change)="clearFieldError('category')"
              >
                <option value="" disabled>選択してください</option>
                <option *ngFor="let cat of categories" [value]="cat.value">
                  {{ cat.label }}
                </option>
              </select>
            </div>
            <div *ngIf="formErrors()['category']" class="field-error">
              {{ formErrors()['category'] }}
            </div>
          </div>

          <!-- 価格（円）* -->
          <div class="form-group">
            <label for="product-price" class="form-label">
              価格（円）<span class="required">*</span>
            </label>
            <input
              id="product-price"
              type="number"
              min="1"
              step="1"
              class="form-control"
              [class.is-invalid]="formErrors()['price']"
              placeholder="4980"
              [(ngModel)]="price"
              name="price"
              (input)="clearFieldError('price')"
            />
            <div *ngIf="formErrors()['price']" class="field-error">
              {{ formErrors()['price'] }}
            </div>
          </div>

          <!-- 在庫数 * -->
          <div class="form-group">
            <label for="product-stock" class="form-label">
              在庫数 <span class="required">*</span>
            </label>
            <input
              id="product-stock"
              type="number"
              min="0"
              step="1"
              class="form-control"
              [class.is-invalid]="formErrors()['stock']"
              placeholder="25"
              [(ngModel)]="stock"
              name="stock"
              (input)="clearFieldError('stock')"
            />
            <div *ngIf="formErrors()['stock']" class="field-error">
              {{ formErrors()['stock'] }}
            </div>
          </div>

          <!-- 商品画像 -->
          <div class="form-group">
            <label class="form-label">商品画像</label>
            <div class="file-upload-area">
              <label class="file-select-btn">
                <span>📁 ファイルを選択</span>
                <input
                  #fileInput
                  type="file"
                  accept="image/jpeg,image/png"
                  class="file-input-hidden"
                  (change)="onFileSelected($event)"
                />
              </label>
              <span class="file-hint">JPEG / PNG、最大 5MB</span>
            </div>

            <!-- 画像エラー表示 -->
            <div *ngIf="fileError()" class="field-error">
              {{ fileError() }}
            </div>

            <!-- 画像プレビュー (img, FileReader) -->
            <div *ngIf="previewUrl()" class="preview-wrapper">
              <div class="preview-box">
                <img [src]="previewUrl()" alt="画像プレビュー" class="preview-image" />
                <button
                  type="button"
                  class="btn-remove-image"
                  (click)="clearSelectedImage(fileInput)"
                  title="画像を削除"
                >
                  ✕ 削除
                </button>
              </div>
            </div>
          </div>

          <!-- 登録ボタン: 送信中は非活性・ローディング表示 -->
          <div class="form-actions">
            <button
              type="submit"
              class="btn btn-primary btn-submit"
              [disabled]="isSubmitting()"
            >
              <span *ngIf="!isSubmitting()">商品を登録する</span>
              <span *ngIf="isSubmitting()" class="loading-inline">
                <span class="spinner" aria-hidden="true"></span>
                登録中...
              </span>
            </button>
          </div>
        </form>
      </div>
    </div>
  `,
  styles: [`
    .product-new-page {
      max-width: 540px;
      margin: 16px auto 60px;
      padding: 0 16px;
    }

    .breadcrumb {
      margin-bottom: 16px;
      font-size: 14px;
    }

    .back-link {
      color: #495057;
      text-decoration: none;
      display: inline-flex;
      align-items: center;
      gap: 4px;
      transition: color 0.15s;
    }

    .back-link:hover {
      color: #4263eb;
      text-decoration: underline;
    }

    .form-card {
      background: white;
      border-radius: 8px;
      border: 1px solid #eaeaea;
      padding: 28px 24px;
      box-shadow: 0 1px 4px rgba(0, 0, 0, 0.05);
    }

    .page-title {
      font-size: 22px;
      font-weight: 700;
      color: #212529;
      margin: 0 0 24px;
      display: flex;
      align-items: center;
      gap: 8px;
    }

    .title-icon {
      font-size: 20px;
      font-weight: 700;
      line-height: 1;
      color: #4263eb;
    }

    .alert-error {
      background: #fff5f5;
      border: 1px solid #ffc9c9;
      color: #e03131;
      padding: 12px 16px;
      border-radius: 6px;
      font-size: 14px;
      margin-bottom: 20px;
      display: flex;
      align-items: center;
      gap: 8px;
    }

    .form-group {
      margin-bottom: 20px;
    }

    .form-label {
      display: block;
      font-size: 14px;
      font-weight: 600;
      color: #343a40;
      margin-bottom: 6px;
    }

    .required {
      color: #e03131;
      margin-left: 2px;
    }

    .form-control {
      width: 100%;
      padding: 10px 14px;
      border: 1px solid #ced4da;
      border-radius: 6px;
      font-size: 15px;
      color: #212529;
      background: white;
      box-sizing: border-box;
      transition: border-color 0.15s, box-shadow 0.15s;
    }

    .form-control:focus {
      outline: none;
      border-color: #4263eb;
      box-shadow: 0 0 0 3px rgba(66, 99, 235, 0.12);
    }

    .form-control.is-invalid {
      border-color: #e03131;
    }

    .form-control.is-invalid:focus {
      box-shadow: 0 0 0 3px rgba(224, 49, 49, 0.12);
    }

    .select-wrapper {
      position: relative;
    }

    .field-error {
      color: #e03131;
      font-size: 13px;
      margin-top: 6px;
    }

    .file-upload-area {
      display: flex;
      flex-direction: column;
      align-items: flex-start;
      gap: 6px;
    }

    .file-select-btn {
      display: inline-flex;
      align-items: center;
      padding: 8px 16px;
      background: #f8f9fa;
      border: 1px solid #ced4da;
      border-radius: 6px;
      font-size: 14px;
      color: #343a40;
      cursor: pointer;
      font-weight: 500;
      transition: background 0.15s, border-color 0.15s;
    }

    .file-select-btn:hover {
      background: #e9ecef;
      border-color: #adb5bd;
    }

    .file-input-hidden {
      display: none;
    }

    .file-hint {
      font-size: 13px;
      color: #6c757d;
    }

    .preview-wrapper {
      margin-top: 14px;
    }

    .preview-box {
      display: inline-flex;
      flex-direction: column;
      align-items: flex-start;
      gap: 8px;
      background: #f8f9fa;
      padding: 10px;
      border-radius: 6px;
      border: 1px solid #dee2e6;
    }

    .preview-image {
      max-width: 220px;
      max-height: 180px;
      object-fit: contain;
      border-radius: 4px;
      background: white;
    }

    .btn-remove-image {
      background: none;
      border: none;
      color: #e03131;
      font-size: 13px;
      cursor: pointer;
      padding: 2px 6px;
      font-weight: 500;
    }

    .btn-remove-image:hover {
      text-decoration: underline;
    }

    .form-actions {
      margin-top: 28px;
    }

    .btn-submit {
      width: 100%;
      padding: 12px 20px;
      font-size: 15px;
      font-weight: 600;
      border-radius: 6px;
      display: flex;
      justify-content: center;
      align-items: center;
      gap: 8px;
    }

    .loading-inline {
      display: inline-flex;
      align-items: center;
      gap: 8px;
    }

    .spinner {
      display: inline-block;
      width: 16px;
      height: 16px;
      border: 2px solid rgba(255, 255, 255, 0.4);
      border-top-color: white;
      border-radius: 50%;
      animation: spin 0.8s linear infinite;
    }

    @keyframes spin {
      to { transform: rotate(360deg); }
    }
  `],
})
export class ProductNewComponent {
  private api = inject(ApiService);
  private auth = inject(AuthService);
  private router = inject(Router);

  name = '';
  category = 'electronics';
  price: number | null = null;
  stock: number | null = null;

  selectedFile: File | null = null;
  previewUrl = signal<string>('');
  fileError = signal<string>('');

  formErrors = signal<Record<string, string>>({});
  isSubmitting = signal<boolean>(false);
  generalError = signal<string>('');

  categories = [
    { value: 'electronics', label: 'electronics' },
    { value: 'fashion', label: 'fashion' },
    { value: 'food', label: 'food' },
    { value: 'books', label: 'books' },
    { value: 'home', label: 'home' },
    { value: 'sports', label: 'sports' },
    { value: 'other', label: 'other' },
    { value: '家電・PC', label: '家電・PC' },
    { value: 'ファッション', label: 'ファッション' },
    { value: '食品', label: '食品' },
    { value: '本・書籍', label: '本・書籍' },
    { value: 'ホーム・キッチン', label: 'ホーム・キッチン' },
    { value: 'スポーツ・アウトドア', label: 'スポーツ・アウトドア' },
    { value: 'その他', label: 'その他' },
  ];

  clearFieldError(fieldName: string): void {
    const current = { ...this.formErrors() };
    if (current[fieldName]) {
      delete current[fieldName];
      this.formErrors.set(current);
    }
  }

  onFileSelected(event: Event): void {
    const input = event.target as HTMLInputElement;
    if (!input.files || input.files.length === 0) return;

    const file = input.files[0];
    this.fileError.set('');

    // バリデーション: JPEG / PNG
    if (!['image/jpeg', 'image/png', 'image/jpg'].includes(file.type)) {
      this.fileError.set('JPEG または PNG 形式の画像を選択してください');
      this.selectedFile = null;
      this.previewUrl.set('');
      input.value = '';
      return;
    }

    // バリデーション: 5MB 以下
    if (file.size > 5 * 1024 * 1024) {
      this.fileError.set('画像サイズは 5MB 以下にしてください');
      this.selectedFile = null;
      this.previewUrl.set('');
      input.value = '';
      return;
    }

    this.selectedFile = file;

    // FileReader でプレビュー表示
    const reader = new FileReader();
    reader.onload = () => {
      this.previewUrl.set(reader.result as string);
    };
    reader.readAsDataURL(file);
  }

  clearSelectedImage(fileInput: HTMLInputElement): void {
    this.selectedFile = null;
    this.previewUrl.set('');
    this.fileError.set('');
    if (fileInput) {
      fileInput.value = '';
    }
  }

  async onSubmit(): Promise<void> {
    this.formErrors.set({});
    this.generalError.set('');

    // 1. クライアントバリデーション
    const errors: Record<string, string> = {};

    const trimmedName = this.name?.trim() ?? '';
    if (!trimmedName) {
      errors['name'] = '商品名を入力してください';
    } else if (trimmedName.length > 100) {
      errors['name'] = '商品名は100文字以内で入力してください';
    }

    if (!this.category) {
      errors['category'] = 'カテゴリを選択してください';
    }

    if (this.price === null || this.price === undefined || String(this.price).trim() === '') {
      errors['price'] = '価格を入力してください';
    } else {
      const numPrice = Number(this.price);
      if (isNaN(numPrice) || !Number.isInteger(numPrice) || numPrice < 1) {
        errors['price'] = '価格は1以上の整数を入力してください';
      }
    }

    if (this.stock === null || this.stock === undefined || String(this.stock).trim() === '') {
      errors['stock'] = '在庫数を入力してください';
    } else {
      const numStock = Number(this.stock);
      if (isNaN(numStock) || !Number.isInteger(numStock) || numStock < 0) {
        errors['stock'] = '在庫数は0以上の整数を入力してください';
      }
    }

    if (Object.keys(errors).length > 0) {
      this.formErrors.set(errors);
      return;
    }

    this.isSubmitting.set(true);

    try {
      let imageKey: string | undefined;
      let imageUrl: string | undefined;

      // 処理フロー（画像あり）
      if (this.selectedFile) {
        // GET /products/upload-url（Presigned URL 取得）
        const uploadInfo = await firstValueFrom(
          this.api.getUploadUrl(this.selectedFile.name, this.selectedFile.type)
        );

        // 取得した URL へ画像を直接 PUT（S3 へ）
        if (uploadInfo?.uploadUrl) {
          try {
            await this.api.uploadImage(uploadInfo.uploadUrl, this.selectedFile);
          } catch (uploadErr) {
            console.warn('S3 upload warning:', uploadErr);
          }
        }

        imageKey = uploadInfo?.imageKey;
        imageUrl = uploadInfo?.imageUrl;
        if (!imageUrl && this.previewUrl()) {
          imageUrl = this.previewUrl();
        }
      }

      // POST /products（画像ありなら imageKey を含めてリクエスト、画像なしなら imageKey なし）
      const payload: any = {
        sellerId: this.auth.userId() || 'seller001',
        name: trimmedName,
        category: this.category,
        price: Number(this.price),
        stock: Number(this.stock),
      };

      if (imageKey) {
        payload.imageKey = imageKey;
      }
      if (imageUrl) {
        payload.imageUrl = imageUrl;
      }

      await firstValueFrom(this.api.createProduct(payload));

      // 成功 → S09（商品管理）へ遷移
      this.router.navigate(['/seller/products']);
    } catch (err: any) {
      console.error('Failed to create product:', err);
      this.generalError.set(err?.message || '商品の登録に失敗しました。もう一度お試しください。');
    } finally {
      this.isSubmitting.set(false);
    }
  }
}
