import { Routes } from '@angular/router';
import { authGuard } from './core/guards/auth.guard';
import { guestGuard } from './core/guards/guest.guard';
import { sellerGuard } from './core/guards/seller.guard';

export const routes: Routes = [
  { path: '', redirectTo: '/home', pathMatch: 'full' },

  {
    path: 'login',
    canActivate: [guestGuard],
    loadComponent: () =>
      import('./features/auth/login/login.component').then(m => m.LoginComponent),
  },

  // 実装済みスターター画面
  {
    path: 'home',
    canActivate: [authGuard],
    loadComponent: () =>
      import('./features/consumer/home/home.component').then(m => m.HomeComponent),
  },

  // 商品一覧エイリアス
  {
    path: 'products',
    redirectTo: '/home',
    pathMatch: 'full',
  },

  // 商品詳細画面
  {
    path: 'products/:sellerId/:productId',
    canActivate: [authGuard],
    loadComponent: () =>
      import('./features/consumer/product-detail/product-detail.component').then(
        m => m.ProductDetailComponent
      ),
  },

  // カート画面
  {
    path: 'cart',
    canActivate: [authGuard],
    loadComponent: () =>
      import('./features/consumer/cart/cart.component').then(m => m.CartComponent),
  },

  // 注文履歴画面
  {
    path: 'orders',
    canActivate: [authGuard],
    loadComponent: () =>
      import('./features/consumer/orders/orders.component').then(m => m.OrdersComponent),
  },

  // 出品者向け商品管理画面
  {
    path: 'seller/products',
    canActivate: [authGuard, sellerGuard],
    loadComponent: () =>
      import('./features/seller/seller-products/seller-products.component').then(
        m => m.SellerProductsComponent
      ),
  },

  // TODO: 以下のルートを追加してください
  // { path: 'seller/orders', ... }

  { path: '**', redirectTo: '/home' },
];
