import { Component, OnInit, inject } from '@angular/core';
import { NgIf, NgFor, NgClass, DatePipe } from '@angular/common';
import { RouterLink } from '@angular/router';
import { OrderService } from '../../../core/services/order.service';

@Component({
  selector: 'app-orders',
  standalone: true,
  imports: [NgIf, NgFor, NgClass, RouterLink, DatePipe],
  template: `
    <div class="orders-page">
      <div class="breadcrumb">
        <a routerLink="/home">← 商品一覧に戻る</a>
      </div>

      <div class="page-header">
        <h1 class="page-title">注文履歴</h1>
        <p class="subtitle">過去にご注文いただいた商品の一覧です。</p>
      </div>

      <!-- ローディング表示 -->
      <div *ngIf="orderService.loading()" class="loading">
        注文履歴を読み込み中...
      </div>

      <!-- 注文履歴が空の場合 -->
      <div *ngIf="!orderService.loading() && orderService.orders().length === 0" class="card empty-state">
        <div class="empty-icon">📦</div>
        <h2>注文履歴はありません</h2>
        <p class="empty-desc">まだご注文いただいた履歴がありません。商品を探してみましょう。</p>
        <a routerLink="/home" class="btn btn-primary" style="margin-top: 16px;">商品を探す</a>
      </div>

      <!-- 注文一覧 -->
      <div *ngIf="!orderService.loading() && orderService.orders().length > 0" class="orders-list">
        <div *ngFor="let order of orderService.orders()" class="card order-card">
          <!-- 注文ヘッダー -->
          <div class="order-header">
            <div class="header-left">
              <div class="order-meta">
                <span class="meta-label">注文番号</span>
                <strong class="order-id">#{{ order.orderId }}</strong>
              </div>
              <div class="order-meta" *ngIf="order.createdAt">
                <span class="meta-label">注文日時</span>
                <span class="meta-value">{{ order.createdAt | date:'yyyy年MM月dd日 HH:mm' }}</span>
              </div>
            </div>

            <div class="header-right">
              <span class="status-badge" [ngClass]="getStatusClass(order.status)">
                {{ getStatusLabel(order.status) }}
              </span>
              <div class="order-total-amount">
                <span class="total-label">合計金額:</span>
                <strong class="total-value">¥{{ order.totalAmount.toLocaleString() }}</strong>
              </div>
            </div>
          </div>

          <!-- 注文商品リスト -->
          <div class="order-items">
            <div *ngFor="let item of order.items" class="order-item-row">
              <div class="item-details">
                <a
                  [routerLink]="['/products', item.sellerId, item.productId]"
                  class="item-name"
                >
                  {{ item.name }}
                </a>
                <span class="item-seller">出品者: {{ item.sellerId }}</span>
              </div>

              <div class="item-pricing">
                <span class="item-price">¥{{ item.price.toLocaleString() }}</span>
                <span class="item-quantity">数量: {{ item.quantity }}</span>
                <strong class="item-subtotal">¥{{ (item.price * item.quantity).toLocaleString() }}</strong>
              </div>
            </div>
          </div>

          <!-- 注文カードフッター -->
          <div class="order-footer">
            <div class="footer-summary">
              <span>合計 {{ getTotalQuantity(order) }} 点の商品</span>
              <span class="footer-total">お支払い総額: <strong>¥{{ order.totalAmount.toLocaleString() }}</strong></span>
            </div>
          </div>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .orders-page { max-width: 960px; margin: 0 auto; padding-bottom: 40px; }
    .breadcrumb { margin-bottom: 20px; font-size: 14px; }
    .breadcrumb a { color: #555; }
    .page-header { margin-bottom: 24px; }
    .subtitle { color: #666; font-size: 14px; margin-top: 4px; }
    .empty-icon { font-size: 48px; margin-bottom: 12px; }
    .empty-desc { color: #777; margin-top: 8px; font-size: 14px; }
    .orders-list { display: flex; flex-direction: column; gap: 20px; }
    .order-card { padding: 0; overflow: hidden; border: 1px solid #e9ecef; }
    .order-header { background: #f8f9fa; padding: 16px 24px; border-bottom: 1px solid #e9ecef; display: flex; justify-content: space-between; align-items: center; flex-wrap: wrap; gap: 16px; }
    .header-left, .header-right { display: flex; align-items: center; gap: 24px; flex-wrap: wrap; }
    .order-meta { display: flex; flex-direction: column; gap: 2px; }
    .meta-label { font-size: 11px; color: #888; text-transform: uppercase; letter-spacing: 0.5px; }
    .order-id { font-size: 14px; color: #222; font-family: monospace; }
    .meta-value { font-size: 13px; color: #444; }
    .status-badge { display: inline-block; padding: 4px 10px; border-radius: 20px; font-size: 12px; font-weight: 600; }
    .status-confirmed { background: #e6fcf5; color: #0ca678; }
    .status-pending { background: #fff9db; color: #f59f00; }
    .status-shipped { background: #e7f5ff; color: #1c7ed6; }
    .status-cancelled { background: #fff5f5; color: #f03e3e; }
    .status-default { background: #f1f3f5; color: #495057; }
    .order-total-amount { display: flex; align-items: baseline; gap: 6px; }
    .total-label { font-size: 12px; color: #666; }
    .total-value { font-size: 16px; color: #4263eb; }
    .order-items { padding: 8px 24px; }
    .order-item-row { display: flex; justify-content: space-between; align-items: center; padding: 14px 0; border-bottom: 1px solid #f1f3f5; gap: 16px; }
    .order-item-row:last-child { border-bottom: none; }
    .item-details { display: flex; flex-direction: column; gap: 4px; flex: 1; }
    .item-name { font-weight: 600; font-size: 14px; color: #333; text-decoration: none; }
    .item-name:hover { color: #4263eb; text-decoration: underline; }
    .item-seller { font-size: 12px; color: #888; }
    .item-pricing { display: flex; align-items: center; gap: 20px; font-size: 14px; text-align: right; }
    .item-price { color: #666; }
    .item-quantity { color: #888; font-size: 13px; }
    .item-subtotal { color: #333; min-width: 80px; }
    .order-footer { background: #fafafa; padding: 12px 24px; border-top: 1px solid #f1f3f5; display: flex; justify-content: flex-end; }
    .footer-summary { display: flex; gap: 16px; font-size: 13px; color: #666; }
    .footer-total strong { color: #4263eb; font-size: 14px; }
    @media (max-width: 640px) {
      .order-header { flex-direction: column; align-items: flex-start; }
      .header-right { width: 100%; justify-content: space-between; }
      .order-item-row { flex-direction: column; align-items: flex-start; }
      .item-pricing { width: 100%; justify-content: space-between; margin-top: 6px; }
    }
  `],
})
export class OrdersComponent implements OnInit {
  orderService = inject(OrderService);

  ngOnInit(): void {
    this.orderService.loadOrders();
  }

  getStatusClass(status: string): string {
    switch (status?.toUpperCase()) {
      case 'CONFIRMED':
        return 'status-confirmed';
      case 'PENDING':
        return 'status-pending';
      case 'SHIPPED':
        return 'status-shipped';
      case 'CANCELLED':
        return 'status-cancelled';
      default:
        return 'status-default';
    }
  }

  getStatusLabel(status: string): string {
    switch (status?.toUpperCase()) {
      case 'CONFIRMED':
        return '注文確定';
      case 'PENDING':
        return '処理中';
      case 'SHIPPED':
        return '発送済み';
      case 'CANCELLED':
        return 'キャンセル';
      default:
        return status || '処理中';
    }
  }

  getTotalQuantity(order: { items: { quantity: number }[] }): number {
    return order.items?.reduce((sum, item) => sum + item.quantity, 0) ?? 0;
  }
}
