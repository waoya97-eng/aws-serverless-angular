import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { Product, ProductListResponse } from '../models/product.model';

@Injectable({ providedIn: 'root' })
export class ApiService {
  private http = inject(HttpClient);
  private base = environment.apiEndpoint;

  // ─── 実装済み ────────────────────────────────────────────────────

  getProducts(category?: string): Observable<ProductListResponse> {
    const params = category ? `?category=${encodeURIComponent(category)}` : '';
    return this.http.get<ProductListResponse>(`${this.base}/products${params}`);
  }

  // ─── TODO: 以下を実装してください ───────────────────────────────

  // getProduct(sellerId: string, productId: string): Observable<Product>
  // createProduct(data: Partial<Product>): Observable<Product>
  // updateProduct(sellerId: string, productId: string, data: Partial<Product>): Observable<Product>
  // deleteProduct(sellerId: string, productId: string): Observable<void>
  // getUploadUrl(productId: string, contentType: string): Observable<...>
  // getCart(): Observable<{ items: CartItem[] }>
  // addToCart(item: { sellerId: string; productId: string; quantity: number }): Observable<void>
  // removeFromCart(productId: string): Observable<void>
  // getOrders(): Observable<{ orders: Order[] }>
  // createOrder(items: CartItem[]): Observable<Order>
  // getSellerOrders(): Observable<{ orders: Order[] }>
}
