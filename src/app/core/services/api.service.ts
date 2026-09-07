import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, map, catchError, of } from 'rxjs';
import { environment } from '../../../environments/environment';
import { Product, ProductListResponse, UploadUrlResponse } from '../models/product.model';
import { CartItem } from '../models/cart.model';
import { Order } from '../models/order.model';

const SELLER_PRODUCTS_STORAGE_KEY = 'ec_seller_products';

@Injectable({ providedIn: 'root' })
export class ApiService {
  private http = inject(HttpClient);
  private base = environment.apiEndpoint;

  private loadLocalProducts(): Product[] {
    if (typeof window === 'undefined' || !window.localStorage) {
      return [];
    }
    try {
      const data = localStorage.getItem(SELLER_PRODUCTS_STORAGE_KEY);
      return data ? JSON.parse(data) : [];
    } catch {
      return [];
    }
  }

  private saveLocalProduct(product: Product): void {
    if (typeof window !== 'undefined' && window.localStorage) {
      const current = this.loadLocalProducts();
      const idx = current.findIndex(p => p.productId === product.productId);
      let updated: Product[];
      if (idx >= 0) {
        updated = current.map((p, i) => (i === idx ? product : p));
      } else {
        updated = [product, ...current];
      }
      localStorage.setItem(SELLER_PRODUCTS_STORAGE_KEY, JSON.stringify(updated));
    }
  }

  private removeLocalProduct(productId: string): void {
    if (typeof window !== 'undefined' && window.localStorage) {
      const current = this.loadLocalProducts();
      const updated = current.filter(p => p.productId !== productId);
      localStorage.setItem(SELLER_PRODUCTS_STORAGE_KEY, JSON.stringify(updated));
    }
  }

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
        const remoteProducts: Product[] = data?.products ?? data?.items ?? [];
        const localProducts = this.loadLocalProducts();

        const mapObj = new Map<string, Product>();
        for (const p of remoteProducts) {
          mapObj.set(p.productId, p);
        }
        for (const p of localProducts) {
          mapObj.set(p.productId, p);
        }

        let products = Array.from(mapObj.values());
        if (category) {
          products = products.filter(p => p.category === category);
        }

        return {
          products,
          lastEvaluatedKey: data?.lastEvaluatedKey,
        };
      }),
      catchError(err => {
        console.warn('API getProducts failed, falling back to local products:', err);
        let products = this.loadLocalProducts();
        if (category) {
          products = products.filter(p => p.category === category);
        }
        return of({ products });
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
      }),
      catchError(() => {
        const local = this.loadLocalProducts().find(p => p.productId === productId);
        if (local) {
          return of(local);
        }
        throw new Error('商品が見つかりませんでした');
      })
    );
  }

  getCart(): Observable<{ items: CartItem[] }> {
    return this.http.get<any>(`${this.base}/cart`).pipe(
      map(res => {
        let data = res;
        if (typeof res?.body === 'string') {
          try {
            data = JSON.parse(res.body);
          } catch {}
        }
        return { items: data?.items ?? data?.cart ?? [] };
      })
    );
  }

  addToCart(item: { sellerId: string; productId: string; quantity: number }): Observable<void> {
    return this.http.post<void>(`${this.base}/cart`, item);
  }

  removeFromCart(productId: string): Observable<void> {
    return this.http.delete<void>(`${this.base}/cart/${productId}`);
  }

  createOrder(items: CartItem[]): Observable<Order> {
    return this.http.post<any>(`${this.base}/orders`, { items }).pipe(
      map(res => {
        let data = res;
        if (typeof res?.body === 'string') {
          try {
            data = JSON.parse(res.body);
          } catch {}
        }
        return (data?.order ?? data) as Order;
      })
    );
  }

  getOrders(): Observable<{ orders: Order[] }> {
    return this.http.get<any>(`${this.base}/orders`).pipe(
      map(res => {
        let data = res;
        if (typeof res?.body === 'string') {
          try {
            data = JSON.parse(res.body);
          } catch {}
        }
        const orders: Order[] = Array.isArray(data)
          ? data
          : data?.orders ?? data?.items ?? [];
        return { orders };
      })
    );
  }

  getSellerOrders(): Observable<{ orders: Order[] }> {
    return this.http.get<any>(`${this.base}/seller/orders`).pipe(
      map(res => {
        let data = res;
        if (typeof res?.body === 'string') {
          try {
            data = JSON.parse(res.body);
          } catch {}
        }
        const orders: Order[] = Array.isArray(data)
          ? data
          : data?.orders ?? data?.items ?? [];
        return { orders };
      })
    );
  }

  // ─── 出品者向け商品管理 API ──────────────────────────────────────────

  getSellerProducts(sellerId?: string): Observable<ProductListResponse> {
    return this.http.get<any>(`${this.base}/seller/products`).pipe(
      map(res => {
        let data = res;
        if (typeof res?.body === 'string') {
          try {
            data = JSON.parse(res.body);
          } catch {}
        }
        const remoteProducts: Product[] = data?.products ?? data?.items ?? [];
        const localProducts = this.loadLocalProducts();

        const mapObj = new Map<string, Product>();
        for (const p of remoteProducts) {
          mapObj.set(p.productId, p);
        }
        for (const p of localProducts) {
          mapObj.set(p.productId, p);
        }

        let products = Array.from(mapObj.values());
        if (sellerId) {
          products = products.filter(p => p.sellerId === sellerId);
        }
        return {
          products,
          lastEvaluatedKey: data?.lastEvaluatedKey,
        };
      }),
      catchError(() => {
        return this.getProducts().pipe(
          map(res => {
            let products = res.products;
            if (sellerId) {
              products = products.filter(p => p.sellerId === sellerId);
            }
            return { products };
          })
        );
      })
    );
  }

  createProduct(data: Partial<Product>): Observable<Product> {
    return this.http.post<any>(`${this.base}/products`, data).pipe(
      map(res => {
        let responseData = res;
        if (typeof res?.body === 'string') {
          try {
            responseData = JSON.parse(res.body);
          } catch {}
        }
        const created = (responseData?.product ?? responseData?.item ?? responseData) as Product;
        const fullProduct: Product = {
          sellerId: created.sellerId || data.sellerId || 'seller001',
          productId: created.productId || data.productId || 'prod_' + Date.now().toString(36),
          name: created.name || data.name || '',
          description: created.description || data.description || '',
          price: created.price ?? data.price ?? 0,
          category: created.category || data.category || 'その他',
          stock: created.stock ?? data.stock ?? 0,
          imageUrl: created.imageUrl || data.imageUrl,
          createdAt: created.createdAt || new Date().toISOString(),
        };
        this.saveLocalProduct(fullProduct);
        return fullProduct;
      }),
      catchError(err => {
        console.warn('API createProduct failed, saving to local storage:', err);
        const fullProduct: Product = {
          sellerId: data.sellerId || 'seller001',
          productId: data.productId || 'prod_' + Date.now().toString(36),
          name: data.name || '',
          description: data.description || '',
          price: data.price ?? 0,
          category: data.category || 'その他',
          stock: data.stock ?? 0,
          imageUrl: data.imageUrl,
          createdAt: data.createdAt || new Date().toISOString(),
        };
        this.saveLocalProduct(fullProduct);
        return of(fullProduct);
      })
    );
  }

  updateProduct(sellerId: string, productId: string, data: Partial<Product>): Observable<Product> {
    return this.http.put<any>(`${this.base}/products/${sellerId}/${productId}`, data).pipe(
      map(res => {
        let responseData = res;
        if (typeof res?.body === 'string') {
          try {
            responseData = JSON.parse(res.body);
          } catch {}
        }
        const updated = (responseData?.product ?? responseData?.item ?? { ...data, sellerId, productId }) as Product;
        this.saveLocalProduct(updated);
        return updated;
      }),
      catchError(err => {
        console.warn('API updateProduct failed, saving to local storage:', err);
        const current = this.loadLocalProducts().find(p => p.productId === productId);
        const updated: Product = {
          sellerId,
          productId,
          name: data.name ?? current?.name ?? '',
          description: data.description ?? current?.description ?? '',
          price: data.price ?? current?.price ?? 0,
          category: data.category ?? current?.category ?? 'その他',
          stock: data.stock ?? current?.stock ?? 0,
          imageUrl: data.imageUrl ?? current?.imageUrl,
          createdAt: current?.createdAt ?? new Date().toISOString(),
        };
        this.saveLocalProduct(updated);
        return of(updated);
      })
    );
  }

  deleteProduct(sellerId: string, productId: string): Observable<void> {
    return this.http.delete<void>(`${this.base}/products/${sellerId}/${productId}`).pipe(
      map(() => {
        this.removeLocalProduct(productId);
      }),
      catchError(err => {
        console.warn('API deleteProduct failed, removing from local storage:', err);
        this.removeLocalProduct(productId);
        return of(void 0);
      })
    );
  }

  getUploadUrl(productId: string, contentType: string): Observable<UploadUrlResponse> {
    return this.http.post<any>(`${this.base}/products/upload-url`, { productId, contentType }).pipe(
      map(res => {
        let data = res;
        if (typeof res?.body === 'string') {
          try {
            data = JSON.parse(res.body);
          } catch {}
        }
        return (data?.data ?? data) as UploadUrlResponse;
      })
    );
  }

  async uploadImage(uploadUrl: string, file: File): Promise<void> {
    const res = await fetch(uploadUrl, {
      method: 'PUT',
      headers: {
        'Content-Type': file.type,
      },
      body: file,
    });
    if (!res.ok) {
      throw new Error(`画像のアップロードに失敗しました: ${res.statusText}`);
    }
  }
}

