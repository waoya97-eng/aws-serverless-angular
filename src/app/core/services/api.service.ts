import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, map } from 'rxjs';
import { environment } from '../../../environments/environment';
import { Product, ProductListResponse } from '../models/product.model';

@Injectable({ providedIn: 'root' })
export class ApiService {
  private http = inject(HttpClient);
  private base = environment.apiEndpoint;

  // ─── 実装済み ────────────────────────────────────────────────────

  getProducts(category?: string): Observable<ProductListResponse> {
    const params = category ? `?category=${encodeURIComponent(category)}` : '';
    return this.http.get<any>(`${this.base}/products${params}`).pipe(
      map(res => {
        let data = res;
        if (typeof res?.body === 'string') {
          try {
            data = JSON.parse(res.body);
          } catch {}
        }
        return {
          products: data?.products ?? data?.items ?? [],
          lastEvaluatedKey: data?.lastEvaluatedKey,
        };
      })
    );
  }

  getProduct(sellerId: string, productId: string): Observable<Product> {
    return this.http.get<any>(`${this.base}/products/${sellerId}/${productId}`).pipe(
      map(res => {
        let data = res;
        if (typeof res?.body === 'string') {
          try {
            data = JSON.parse(res.body);
          } catch {}
        }
        return (data?.product ?? data?.item ?? data) as Product;
      })
    );
  }

  addToCart(item: { sellerId: string; productId: string; quantity: number }): Observable<void> {
    return this.http.post<void>(`${this.base}/cart`, item);
  }
  // getOrders(): Observable<{ orders: Order[] }>
  // createOrder(items: CartItem[]): Observable<Order>
  // getSellerOrders(): Observable<{ orders: Order[] }>
}
