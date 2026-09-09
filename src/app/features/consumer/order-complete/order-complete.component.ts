import { Component, inject, OnInit, signal } from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import { NgIf, NgFor } from '@angular/common';
import { Order } from '../../../core/models/order.model';
import { OrderService } from '../../../core/services/order.service';

@Component({
  selector: 'app-order-complete',
  standalone: true,
  imports: [NgIf, NgFor, RouterLink],
  template: `
    <div class="complete-page">
      <div class="card complete-card" *ngIf="order(); else noOrderTpl">
        <div class="complete-header">
          <div class="success-icon" aria-hidden="true">🎉</div>
          <h1 class="complete-title">ご注文ありがとうございます！</h1>
          <p class="order-id">
            注文番号: <strong>#{{ order()!.orderId }}</strong>
          </p>
        </div>

        <div class="order-summary-box">
          <h2 class="summary-heading">注文内容の控え</h2>
          <div class="order-items-list">
            <div *ngFor="let item of order()!.items" class="order-item-row">
              <span class="item-name">{{ item.name }}</span>
              <span class="item-qty">× {{ item.quantity }}</span>
              <span class="item-price">¥ {{ (item.price * item.quantity).toLocaleString() }}</span>
            </div>
          </div>
          <div class="order-total-row">
            <span>合計お支払い金額 (税込)</span>
            <strong class="total-price">¥ {{ order()!.totalAmount.toLocaleString() }}</strong>
          </div>
        </div>

        <div class="complete-actions">
          <a routerLink="/orders" class="btn btn-primary">注文履歴を見る</a>
          <a routerLink="/products" class="btn btn-outline">商品一覧に戻る</a>
        </div>
      </div>

      <ng-template #noOrderTpl>
        <div class="card empty-card">
          <div class="icon">📦</div>
          <h2>ご注文情報が見つかりません</h2>
          <p>すでに完了したか、直接アクセスされた可能性があります。</p>
          <div class="actions">
            <a routerLink="/orders" class="btn btn-primary">注文履歴を見る</a>
            <a routerLink="/products" class="btn btn-outline">商品一覧に戻る</a>
          </div>
        </div>
      </ng-template>
    </div>
  `,
  styles: [`
    .complete-page {
      max-width: 560px;
      margin: 20px auto 60px;
      padding: 0 16px;
    }

    .complete-card {
      background: white;
      border-radius: 8px;
      border: 1px solid #eaeaea;
      padding: 32px 24px;
      box-shadow: 0 1px 4px rgba(0, 0, 0, 0.05);
      text-align: center;
    }

    .complete-header {
      margin-bottom: 24px;
    }

    .success-icon {
      font-size: 48px;
      margin-bottom: 12px;
    }

    .complete-title {
      font-size: 22px;
      font-weight: 700;
      color: #212529;
      margin: 0 0 8px;
    }

    .order-id {
      font-size: 14px;
      color: #666;
      margin: 0;
    }

    .order-id strong {
      color: #212529;
      font-family: monospace;
      font-size: 15px;
    }

    .order-summary-box {
      background: #f8f9fa;
      border-radius: 6px;
      border: 1px solid #e9ecef;
      padding: 16px;
      text-align: left;
      margin-bottom: 24px;
    }

    .summary-heading {
      font-size: 14px;
      font-weight: 700;
      color: #495057;
      margin: 0 0 12px;
      padding-bottom: 6px;
      border-bottom: 1px solid #dee2e6;
    }

    .order-items-list {
      display: flex;
      flex-direction: column;
      gap: 8px;
    }

    .order-item-row {
      display: flex;
      justify-content: space-between;
      align-items: center;
      font-size: 13px;
      color: #333;
    }

    .item-name {
      flex: 1;
      margin-right: 8px;
      overflow: hidden;
      text-overflow: ellipsis;
      white-space: nowrap;
    }

    .item-qty {
      color: #666;
      margin-right: 12px;
      white-space: nowrap;
    }

    .item-price {
      font-weight: 600;
      white-space: nowrap;
    }

    .order-total-row {
      display: flex;
      justify-content: space-between;
      align-items: baseline;
      font-size: 14px;
      font-weight: 700;
      border-top: 1px solid #dee2e6;
      padding-top: 10px;
      margin-top: 10px;
      color: #212529;
    }

    .total-price {
      color: #4263eb;
      font-size: 17px;
    }

    .complete-actions {
      display: flex;
      justify-content: center;
      gap: 12px;
    }

    .complete-actions .btn {
      padding: 10px 20px;
    }

    .empty-card {
      text-align: center;
      padding: 40px 20px;
    }

    .empty-card .icon {
      font-size: 40px;
      margin-bottom: 12px;
    }

    .empty-card h2 {
      font-size: 18px;
      margin-bottom: 8px;
    }

    .empty-card p {
      color: #666;
      font-size: 14px;
      margin-bottom: 20px;
    }

    .empty-card .actions {
      display: flex;
      justify-content: center;
      gap: 12px;
    }

    @media (max-width: 480px) {
      .complete-actions {
        flex-direction: column;
      }
      .complete-actions .btn {
        width: 100%;
      }
    }
  `],
})
export class OrderCompleteComponent implements OnInit {
  private router = inject(Router);
  private orderService = inject(OrderService);

  order = signal<Order | null>(null);

  ngOnInit(): void {
    const navOrder = (typeof history !== 'undefined' && history.state?.order) as Order | undefined;
    if (navOrder && navOrder.orderId) {
      this.order.set(navOrder);
    } else {
      // 直前または保存済みの注文があれば取得
      const recentOrders = this.orderService.orders();
      if (recentOrders && recentOrders.length > 0) {
        this.order.set(recentOrders[0]);
      }
    }
  }
}
