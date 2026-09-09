import { Injectable, inject, signal } from '@angular/core';
import { ApiService } from './api.service';
import { Order } from '../models/order.model';

const ORDERS_STORAGE_KEY = 'ec_orders';

@Injectable({ providedIn: 'root' })
export class OrderService {
  private api = inject(ApiService);

  private _orders = signal<Order[]>(this.loadFromStorage());
  readonly orders = this._orders.asReadonly();
  readonly loading = signal<boolean>(false);

  // S06 注文完了画面連携用の一時状態
  readonly lastCompletedOrderId = signal<string | null>(null);
  readonly justCompletedOrder = signal<boolean>(false);

  setCompletedOrder(orderId: string): void {
    this.lastCompletedOrderId.set(orderId);
    this.justCompletedOrder.set(true);
    if (typeof sessionStorage !== 'undefined') {
      sessionStorage.setItem('ec_just_completed_order', 'true');
    }
  }

  consumeCompletedOrderId(): string | null {
    const id = this.lastCompletedOrderId();
    this.lastCompletedOrderId.set(null);
    return id;
  }

  resetJustCompleted(): void {
    this.justCompletedOrder.set(false);
    if (typeof sessionStorage !== 'undefined') {
      sessionStorage.removeItem('ec_just_completed_order');
    }
  }

  private loadFromStorage(): Order[] {
    if (typeof window === 'undefined' || !window.localStorage) {
      return [];
    }
    try {
      const data = localStorage.getItem(ORDERS_STORAGE_KEY);
      return data ? JSON.parse(data) : [];
    } catch {
      return [];
    }
  }

  private saveToStorage(orders: Order[]): void {
    if (typeof window !== 'undefined' && window.localStorage) {
      try {
        localStorage.setItem(ORDERS_STORAGE_KEY, JSON.stringify(orders));
      } catch (err) {
        console.error('Failed to save orders to localStorage', err);
      }
    }
  }

  /**
   * 注文履歴を取得（APIを呼び出し、ローカルのシミュレーション注文とも統合）
   */
  loadOrders(): void {
    this.loading.set(true);

    this.api.getOrders().subscribe({
      next: res => {
        const remoteOrders = res.orders || [];
        const localOrders = this.loadFromStorage();

        // orderId をキーにしてマージ（重複を排除）
        const map = new Map<string, Order>();
        for (const order of remoteOrders) {
          map.set(order.orderId, order);
        }
        for (const order of localOrders) {
          if (!map.has(order.orderId)) {
            map.set(order.orderId, order);
          }
        }

        const merged = Array.from(map.values()).sort((a, b) => {
          const dateA = a.createdAt ? new Date(a.createdAt).getTime() : 0;
          const dateB = b.createdAt ? new Date(b.createdAt).getTime() : 0;
          return dateB - dateA;
        });

        this._orders.set(merged);
        this.saveToStorage(merged);
        this.loading.set(false);
      },
      error: err => {
        console.warn('API getOrders failed, fallback to local orders:', err);
        const local = this.loadFromStorage().sort((a, b) => {
          const dateA = a.createdAt ? new Date(a.createdAt).getTime() : 0;
          const dateB = b.createdAt ? new Date(b.createdAt).getTime() : 0;
          return dateB - dateA;
        });
        this._orders.set(local);
        this.loading.set(false);
      },
    });
  }

  /**
   * 新しい注文を記録（ローカル状態とストレージを更新）
   */
  recordOrder(order: Order): void {
    const current = this.loadFromStorage();
    const updated = [order, ...current.filter(o => o.orderId !== order.orderId)];
    this._orders.set(updated);
    this.saveToStorage(updated);
  }
}
