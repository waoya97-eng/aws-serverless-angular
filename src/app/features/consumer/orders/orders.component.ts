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
      <!-- 画面タイトル: 📦 注文履歴 -->
      <h1 class="orders-title">
        <span class="title-icon">📦</span>
        <span>注文履歴</span>
      </h1>

      <!-- ローディング表示 -->
      <div *ngIf="orderService.loading()" class="loading-state">
        <span class="spinner" aria-hidden="true"></span>
        <span>注文履歴を読み込み中...</span>
      </div>

      <!-- 注文履歴が空の場合（空メッセージ） -->
      <div
        *ngIf="!orderService.loading() && orderService.orders().length === 0"
        class="card empty-state"
      >
        <div class="empty-icon">📦</div>
        <h2 class="empty-title">注文履歴はありません</h2>
        <p class="empty-desc">まだご注文いただいた履歴がありません。商品を探してみましょう。</p>
        <a routerLink="/products" class="btn btn-primary btn-explore">商品を探す</a>
      </div>

      <!-- 注文一覧 -->
      <div
        *ngIf="!orderService.loading() && orderService.orders().length > 0"
        class="orders-list"
      >
        <!-- 注文カード: 注文ID・日時・合計・ステータス・商品リスト -->
        <div *ngFor="let order of orderService.orders()" class="card order-card">
          <!-- カード上部: 注文ID・日時 / 合計・ステータス -->
          <div class="order-card-header">
            <div class="order-meta-left">
              <span class="order-id">{{ formatOrderId(order.orderId) }}</span>
              <span class="order-date" *ngIf="order.createdAt">
                {{ order.createdAt | date:'yyyy-MM-dd HH:mm' }}
              </span>
            </div>

            <div class="order-meta-right">
              <span class="order-amount">¥ {{ order.totalAmount.toLocaleString() }}</span>
              <span class="status-badge" [ngClass]="getStatusClass(order.status)">
                {{ getStatusLabel(order.status) }}
              </span>
            </div>
          </div>

          <!-- カード下部: 商品リスト -->
          <div class="order-card-body" *ngIf="order.items && order.items.length > 0">
            <div class="order-items-summary">
              <span class="bullet">・</span>
              <ng-container *ngFor="let item of order.items; let last = last">
                <a
                  *ngIf="item.sellerId && item.productId"
                  [routerLink]="['/products', item.sellerId, item.productId]"
                  class="item-link"
                >{{ item.name }} × {{ item.quantity }}</a>
                <span *ngIf="!item.sellerId || !item.productId">
                  {{ item.name }} × {{ item.quantity }}
                </span>
                <span *ngIf="!last" class="item-separator"> ／ </span>
              </ng-container>
            </div>
          </div>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .orders-page {
      max-width: 800px;
      margin: 0 auto;
      padding-bottom: 48px;
    }

    .orders-title {
      display: flex;
      align-items: center;
      gap: 8px;
      font-size: 22px;
      font-weight: 700;
      color: #212529;
      margin-bottom: 24px;
    }

    .title-icon {
      font-size: 24px;
      line-height: 1;
    }

    .orders-list {
      display: flex;
      flex-direction: column;
      gap: 16px;
    }

    .order-card {
      background: white;
      border-radius: 8px;
      border: 1px solid #eaeaea;
      padding: 20px 24px;
      box-shadow: 0 1px 4px rgba(0, 0, 0, 0.04);
      transition: border-color 0.2s, box-shadow 0.2s;
    }

    .order-card:hover {
      border-color: #ced4da;
      box-shadow: 0 2px 8px rgba(0, 0, 0, 0.07);
    }

    .order-card-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      flex-wrap: wrap;
      gap: 12px;
      padding-bottom: 12px;
      border-bottom: 1px solid #f1f3f5;
    }

    .order-meta-left {
      display: flex;
      align-items: baseline;
      gap: 16px;
      flex-wrap: wrap;
    }

    .order-id {
      font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace;
      font-size: 16px;
      font-weight: 700;
      color: #212529;
      letter-spacing: -0.2px;
    }

    .order-date {
      font-size: 14px;
      color: #6c757d;
    }

    .order-meta-right {
      display: flex;
      align-items: center;
      gap: 14px;
    }

    .order-amount {
      font-size: 16px;
      font-weight: 700;
      color: #212529;
    }

    .status-badge {
      display: inline-flex;
      align-items: center;
      padding: 3px 10px;
      border-radius: 20px;
      font-size: 12px;
      font-weight: 600;
      line-height: 1.4;
    }

    .status-confirmed {
      background: #e6fcf5;
      color: #0ca678;
      border: 1px solid #b2f2bb;
    }

    .status-pending {
      background: #fff9db;
      color: #f59f00;
      border: 1px solid #ffe066;
    }

    .status-shipped {
      background: #e7f5ff;
      color: #1c7ed6;
      border: 1px solid #a5d8ff;
    }

    .status-cancelled {
      background: #fff5f5;
      color: #f03e3e;
      border: 1px solid #ffc9c9;
    }

    .status-default {
      background: #f1f3f5;
      color: #495057;
      border: 1px solid #dee2e6;
    }

    .order-card-body {
      padding-top: 12px;
    }

    .order-items-summary {
      font-size: 14px;
      color: #495057;
      line-height: 1.6;
      word-break: break-word;
    }

    .bullet {
      color: #495057;
      font-weight: 500;
    }

    .item-link {
      color: #212529;
      text-decoration: none;
      transition: color 0.15s;
    }

    .item-link:hover {
      color: #4263eb;
      text-decoration: underline;
    }

    .item-separator {
      color: #868e96;
      font-weight: 400;
      margin: 0 2px;
    }

    .loading-state {
      display: flex;
      align-items: center;
      justify-content: center;
      gap: 10px;
      padding: 48px 16px;
      color: #6c757d;
      font-size: 15px;
    }

    .spinner {
      display: inline-block;
      width: 20px;
      height: 20px;
      border: 2px solid #dee2e6;
      border-top-color: #4263eb;
      border-radius: 50%;
      animation: spin 0.8s linear infinite;
    }

    @keyframes spin {
      to { transform: rotate(360deg); }
    }

    .empty-state {
      text-align: center;
      padding: 56px 24px;
    }

    .empty-icon {
      font-size: 48px;
      line-height: 1;
      margin-bottom: 16px;
    }

    .empty-title {
      font-size: 18px;
      font-weight: 700;
      color: #343a40;
      margin-bottom: 8px;
    }

    .empty-desc {
      font-size: 14px;
      color: #868e96;
      margin-bottom: 20px;
    }

    .btn-explore {
      padding: 10px 24px;
      font-size: 14px;
    }

    @media (max-width: 600px) {
      .order-card-header {
        flex-direction: column;
        align-items: flex-start;
        gap: 8px;
      }

      .order-meta-left, .order-meta-right {
        width: 100%;
        justify-content: space-between;
      }
    }
  `],
})
export class OrdersComponent implements OnInit {
  orderService = inject(OrderService);

  ngOnInit(): void {
    this.orderService.loadOrders();
  }

  formatOrderId(orderId: string): string {
    if (!orderId) return '';
    return orderId.startsWith('#') ? orderId : `#${orderId}`;
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
