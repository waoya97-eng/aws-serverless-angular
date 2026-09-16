import { Component, OnInit, inject, signal } from '@angular/core';
import { NgIf, NgFor, NgClass, DatePipe } from '@angular/common';
import { ApiService } from '../../../core/services/api.service';
import { Order } from '../../../core/models/order.model';

@Component({
  selector: 'app-seller-orders',
  standalone: true,
  imports: [NgIf, NgFor, NgClass, DatePipe],
  template: `
    <div class="seller-orders-page">
      <!-- 画面タイトル: 📋 受注一覧 -->
      <div class="page-header">
        <h1 class="page-title">
          <span class="title-icon">📋</span>
          <span>受注一覧</span>
        </h1>
      </div>

      <!-- ローディング表示 -->
      <div *ngIf="loading()" class="loading-state">
        <span class="spinner" aria-hidden="true"></span>
        <span>受注データを読み込み中...</span>
      </div>

      <!-- 受注なし（空メッセージ） -->
      <div *ngIf="!loading() && orders().length === 0" class="card empty-state">
        <div class="empty-icon">📋</div>
        <h2 class="empty-title">受注データはありません</h2>
        <p class="empty-desc">現在、お客様からのご注文はまだ届いていません。</p>
      </div>

      <!-- 受注リスト（新着順: createdAt 降順） -->
      <div *ngIf="!loading() && orders().length > 0" class="orders-list">
        <div *ngFor="let order of orders()" class="card order-card">
          <!-- カード上部: 注文ID・日時・購入者名 / 合計・ステータス -->
          <div class="order-header-row">
            <div class="meta-left">
              <span class="order-id">{{ formatOrderId(order.orderId) }}</span>
              <span class="order-date" *ngIf="order.createdAt">
                {{ order.createdAt | date:'yyyy-MM-dd HH:mm' }}
              </span>
              <span class="buyer-name">{{ order.buyerName || order.buyerId || '購入者' }}</span>
            </div>

            <div class="meta-right">
              <span class="order-amount">¥ {{ order.totalAmount.toLocaleString() }}</span>
              <span class="status-badge" [ngClass]="getStatusClass(order.status)">
                {{ getStatusLabel(order.status) }}
              </span>
            </div>
          </div>

          <!-- 注文明細: 商品名・数量・小計（展開可能） -->
          <div class="order-card-body">
            <div class="items-summary-wrapper">
              <div class="wireframe-items-list">
                <div *ngFor="let item of order.items" class="item-line">
                  <span class="bullet">・</span>
                  <span class="item-name">{{ item.name }}</span>
                  <span class="item-qty">× {{ item.quantity }}</span>
                  <span class="item-spacer">　</span>
                  <span class="item-subtotal">¥ {{ (item.price * item.quantity).toLocaleString() }}</span>
                </div>
              </div>

              <!-- 展開・折りたたみボタン -->
              <button
                type="button"
                class="btn-toggle"
                (click)="toggleExpand(order.orderId)"
              >
                {{ isExpanded(order.orderId) ? '明細を閉じる ▴' : '内訳を展開 ▾' }}
              </button>
            </div>

            <!-- 展開時テーブル明細 -->
            <div *ngIf="isExpanded(order.orderId)" class="expanded-table-wrapper">
              <table class="details-table">
                <thead>
                  <tr>
                    <th>商品名</th>
                    <th class="th-num">単価</th>
                    <th class="th-num">数量</th>
                    <th class="th-num">小計</th>
                  </tr>
                </thead>
                <tbody>
                  <tr *ngFor="let item of order.items">
                    <td>{{ item.name }}</td>
                    <td class="td-num">¥{{ item.price.toLocaleString() }}</td>
                    <td class="td-num">{{ item.quantity }}</td>
                    <td class="td-num">¥{{ (item.price * item.quantity).toLocaleString() }}</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .seller-orders-page { max-width: 800px; margin: 20px auto 60px; padding: 0 16px; }
    .page-header { margin-bottom: 24px; }
    .page-title { font-size: 22px; font-weight: 700; color: #212529; margin: 0; display: flex; align-items: center; gap: 8px; }
    .title-icon { font-size: 24px; line-height: 1; }
    .loading-state { display: flex; align-items: center; justify-content: center; gap: 10px; padding: 60px 16px; color: #6c757d; font-size: 15px; }
    .spinner { display: inline-block; width: 20px; height: 20px; border: 2px solid #dee2e6; border-top-color: #4263eb; border-radius: 50%; animation: spin 0.8s linear infinite; }
    @keyframes spin { to { transform: rotate(360deg); } }
    .empty-state { text-align: center; padding: 60px 24px; }
    .empty-icon { font-size: 48px; line-height: 1; margin-bottom: 16px; }
    .empty-title { font-size: 18px; font-weight: 700; color: #343a40; margin-bottom: 8px; }
    .empty-desc { font-size: 14px; color: #868e96; }
    .orders-list { display: flex; flex-direction: column; gap: 16px; }
    .order-card { background: white; border-radius: 8px; border: 1px solid #eaeaea; padding: 20px 24px; box-shadow: 0 1px 4px rgba(0, 0, 0, 0.04); }
    .order-header-row { display: flex; justify-content: space-between; align-items: center; flex-wrap: wrap; gap: 12px; padding-bottom: 12px; border-bottom: 1px solid #f1f3f5; }
    .meta-left { display: flex; align-items: baseline; gap: 16px; flex-wrap: wrap; }
    .order-id { font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace; font-size: 16px; font-weight: 700; color: #212529; }
    .order-date { font-size: 14px; color: #6c757d; }
    .buyer-name { font-size: 14px; font-weight: 600; color: #495057; }
    .meta-right { display: flex; align-items: center; gap: 14px; }
    .order-amount { font-size: 16px; font-weight: 700; color: #212529; }
    .status-badge { display: inline-flex; align-items: center; padding: 3px 10px; border-radius: 20px; font-size: 12px; font-weight: 600; line-height: 1.4; }
    .status-confirmed { background: #e6fcf5; color: #0ca678; border: 1px solid #b2f2bb; }
    .status-pending { background: #fff9db; color: #f59f00; border: 1px solid #ffe066; }
    .status-shipped { background: #e7f5ff; color: #1c7ed6; border: 1px solid #a5d8ff; }
    .status-cancelled { background: #fff5f5; color: #f03e3e; border: 1px solid #ffc9c9; }
    .status-default { background: #f1f3f5; color: #495057; border: 1px solid #dee2e6; }
    .order-card-body { padding-top: 12px; }
    .items-summary-wrapper { display: flex; justify-content: space-between; align-items: flex-start; gap: 12px; flex-wrap: wrap; }
    .wireframe-items-list { font-size: 14px; color: #495057; line-height: 1.8; }
    .item-line { display: flex; align-items: baseline; gap: 4px; flex-wrap: wrap; }
    .bullet { color: #868e96; font-weight: 700; }
    .item-name { color: #212529; }
    .item-qty { color: #6c757d; }
    .item-subtotal { font-weight: 600; color: #212529; }
    .btn-toggle { background: none; border: 1px solid #dee2e6; padding: 4px 10px; font-size: 12px; border-radius: 4px; color: #495057; cursor: pointer; }
    .btn-toggle:hover { background: #f8f9fa; border-color: #ced4da; }
    .expanded-table-wrapper { margin-top: 14px; padding-top: 12px; border-top: 1px dashed #e9ecef; }
    .details-table { width: 100%; border-collapse: collapse; font-size: 13px; }
    .details-table th, .details-table td { padding: 8px 12px; text-align: left; }
    .details-table th { background: #f8f9fa; color: #495057; font-weight: 600; }
    .details-table td { border-bottom: 1px solid #f1f3f5; }
    .th-num, .td-num { text-align: right; }
    @media (max-width: 600px) {
      .order-header-row { flex-direction: column; align-items: flex-start; gap: 8px; }
      .meta-left, .meta-right { width: 100%; justify-content: space-between; }
    }
  `],
})
export class SellerOrdersComponent implements OnInit {
  private api = inject(ApiService);

  orders = signal<Order[]>([]);
  loading = signal<boolean>(false);
  expandedMap = signal<Record<string, boolean>>({});

  ngOnInit(): void {
    this.loadSellerOrders();
  }

  loadSellerOrders(): void {
    this.loading.set(true);

    this.api.getSellerOrders().subscribe({
      next: res => {
        const raw = res.orders || [];
        // 新着順（createdAt 降順）
        const sorted = raw.sort((a, b) => {
          const dateA = a.createdAt ? new Date(a.createdAt).getTime() : 0;
          const dateB = b.createdAt ? new Date(b.createdAt).getTime() : 0;
          return dateB - dateA;
        });
        this.orders.set(sorted);
        this.loading.set(false);
      },
      error: err => {
        console.warn('getSellerOrders error:', err);
        this.loading.set(false);
      },
    });
  }

  formatOrderId(orderId: string): string {
    if (!orderId) return '';
    return orderId.startsWith('#') ? orderId : `#${orderId}`;
  }

  isExpanded(orderId: string): boolean {
    return !!this.expandedMap()[orderId];
  }

  toggleExpand(orderId: string): void {
    const current = { ...this.expandedMap() };
    current[orderId] = !current[orderId];
    this.expandedMap.set(current);
  }

  getStatusClass(status: string): string {
    switch (status?.toLowerCase()) {
      case 'confirmed':
        return 'status-confirmed';
      case 'pending':
        return 'status-pending';
      case 'shipped':
        return 'status-shipped';
      case 'cancelled':
      case 'canceled':
        return 'status-cancelled';
      default:
        return 'status-default';
    }
  }

  getStatusLabel(status: string): string {
    switch (status?.toLowerCase()) {
      case 'confirmed':
        return '確認済';
      case 'pending':
        return '処理中';
      case 'shipped':
        return '発送済';
      case 'cancelled':
      case 'canceled':
        return 'キャンセル';
      default:
        return status || '確認済';
    }
  }
}
