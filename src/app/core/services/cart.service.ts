import { Injectable, signal, computed, inject } from '@angular/core';
import { CartItem } from '../models/cart.model';
import { Product } from '../models/product.model';
import { ApiService } from './api.service';

const CART_STORAGE_KEY = 'ec_cart_items';

@Injectable({ providedIn: 'root' })
export class CartService {
  private api = inject(ApiService);

  private _items = signal<CartItem[]>(this.loadInitialCart());

  readonly items = this._items.asReadonly();
  readonly totalCount = computed(() =>
    this._items().reduce((acc, item) => acc + item.quantity, 0)
  );
  readonly totalAmount = computed(() =>
    this._items().reduce((acc, item) => acc + item.price * item.quantity, 0)
  );
  readonly isEmpty = computed(() => this._items().length === 0);

  private loadInitialCart(): CartItem[] {
    if (typeof window === 'undefined' || !window.localStorage) {
      return [];
    }
    try {
      const data = localStorage.getItem(CART_STORAGE_KEY);
      return data ? JSON.parse(data) : [];
    } catch {
      return [];
    }
  }

  private saveToStorage(items: CartItem[]): void {
    if (typeof window !== 'undefined' && window.localStorage) {
      try {
        localStorage.setItem(CART_STORAGE_KEY, JSON.stringify(items));
      } catch (err) {
        console.error('Failed to save cart to localStorage', err);
      }
    }
  }

  /**
   * カートに商品を追加
   */
  addItem(product: Product, quantity = 1): void {
    const current = this._items();
    const existingIndex = current.findIndex(
      item => item.productId === product.productId && item.sellerId === product.sellerId
    );

    let updated: CartItem[];
    if (existingIndex > -1) {
      const existing = current[existingIndex];
      const maxStock = product.stock ?? 99;
      const newQuantity = Math.min(existing.quantity + quantity, maxStock);

      updated = current.map((item, idx) =>
        idx === existingIndex ? { ...item, quantity: newQuantity } : item
      );
    } else {
      const newItem: CartItem = {
        sellerId: product.sellerId,
        productId: product.productId,
        name: product.name,
        price: product.price,
        quantity: Math.min(quantity, product.stock ?? 99),
        imageUrl: product.imageUrl,
      };
      updated = [...current, newItem];
    }

    this._items.set(updated);
    this.saveToStorage(updated);

    // バックエンド API にも通知（非同期、エラー時はコンソールログのみでUIは阻害しない）
    this.api.addToCart({
      sellerId: product.sellerId,
      productId: product.productId,
      quantity,
    }).subscribe({
      next: () => {},
      error: err => {
        console.warn('API addToCart warning (local state maintained):', err);
      },
    });
  }

  /**
   * 数量を更新（1未満の場合は削除）
   */
  updateQuantity(productId: string, quantity: number): void {
    if (quantity <= 0) {
      this.removeItem(productId);
      return;
    }

    const updated = this._items().map(item =>
      item.productId === productId ? { ...item, quantity } : item
    );
    this._items.set(updated);
    this.saveToStorage(updated);
  }

  /**
   * カートから商品を削除
   */
  removeItem(productId: string): void {
    const updated = this._items().filter(item => item.productId !== productId);
    this._items.set(updated);
    this.saveToStorage(updated);

    this.api.removeFromCart(productId).subscribe({
      next: () => {},
      error: err => {
        console.warn('API removeFromCart warning (local state maintained):', err);
      },
    });
  }

  /**
   * カートを空にする
   */
  clearCart(): void {
    this._items.set([]);
    if (typeof window !== 'undefined' && window.localStorage) {
      localStorage.removeItem(CART_STORAGE_KEY);
    }
  }
}
