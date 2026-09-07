import { Component, OnInit, inject, signal } from '@angular/core';
import { NgIf, NgFor } from '@angular/common';
import { RouterLink } from '@angular/router';
import { ApiService } from '../../../core/services/api.service';
import { AuthService } from '../../../core/services/auth.service';
import { Product } from '../../../core/models/product.model';

@Component({
  selector: 'app-home',
  standalone: true,
  imports: [NgIf, NgFor, RouterLink],
  template: `
    <h1 class="page-title">ホーム</h1>
    <p class="welcome">ようこそ、{{ auth.isSeller() ? '出品者' : '消費者' }} さん！</p>

    <section class="section">
      <h2 class="section-title">商品一覧（取得済み）</h2>

      <div *ngIf="loading()" class="loading">読み込み中...</div>

      <div class="product-grid" *ngIf="!loading()">
        <a
          *ngFor="let product of products()"
          [routerLink]="['/products', product.sellerId, product.productId]"
          [state]="{ product: product }"
          class="card product-card"
        >
          <p class="category">{{ product.category }}</p>
          <h3 class="name">{{ product.name }}</h3>
          <p class="price">¥{{ product.price.toLocaleString() }}</p>
        </a>
      </div>
    </section>

    <section class="section todo">
      <h2 class="section-title">📝 実装してみよう</h2>
      <ul>
        <li><del>商品詳細ページ（ProductDetailComponent）を作成する</del> ✅ 完了！</li>
        <li><del>カート機能（CartComponent）を実装する</del> ✅ 完了！</li>
        <li><del>注文機能（OrdersComponent）を実装する</del> ✅ 完了！</li>
        <li><del>出品者向け商品管理（SellerProductsComponent）を実装する</del> ✅ 完了！</li>
        <li>app.routes.ts に各ルートを追加する</li>
      </ul>
    </section>
  `,
  styles: [`
    .welcome { margin-bottom: 32px; color: #555; }
    .section { margin-bottom: 40px; }
    .section-title { font-size: 16px; font-weight: 700; margin-bottom: 16px; color: #333; }
    .product-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(200px, 1fr)); gap: 16px; }
    .product-card { padding: 16px; text-decoration: none; color: inherit; display: block; transition: transform 0.15s, box-shadow 0.15s; }
    .product-card:hover { transform: translateY(-2px); box-shadow: 0 4px 12px rgba(0,0,0,0.1); text-decoration: none; }
    .category { font-size: 11px; color: #868e96; margin-bottom: 4px; }
    .name { font-size: 14px; font-weight: 600; margin-bottom: 8px; color: #222; }
    .price { font-size: 16px; font-weight: 700; color: #4263eb; }
    .todo { background: white; border-radius: 8px; padding: 24px; border-left: 4px solid #4263eb; }
    .todo ul { list-style: none; display: flex; flex-direction: column; gap: 10px; }
    .todo li { font-size: 14px; color: #555; padding-left: 8px; }
    .todo li del { color: #868e96; }
  `],
})
export class HomeComponent implements OnInit {
  products = signal<Product[]>([]);
  loading = signal(true);

  api = inject(ApiService);
  auth = inject(AuthService);

  ngOnInit(): void {
    this.api.getProducts().subscribe({
      next: res => {
        this.products.set(res.products);
        this.loading.set(false);
      },
      error: () => this.loading.set(false),
    });
  }
}
