import { Routes } from '@angular/router';
import { authGuard } from './core/guards/auth.guard';
import { guestGuard } from './core/guards/guest.guard';
import { sellerGuard } from './core/guards/seller.guard';
import { consumerGuard } from './core/guards/consumer.guard';

export const routes: Routes = [
  { path: '', redirectTo: '/home', pathMatch: 'full' },

  {
    path: 'login',
    canActivate: [guestGuard],
    loadComponent: () =>
      import('./features/auth/login/login.component').then(m => m.LoginComponent),
  },

  // 実装済みスターター画面（商品一覧へ転送または商品一覧を表示）
  {
    path: 'home',
    canActivate: [authGuard],
    loadComponent: () =>
      import('./features/consumer/product-list/product-list.component').then(
        m => m.ProductListComponent
      ),
  },

  // 商品一覧画面
  {
    path: 'products',
    canActivate: [authGuard],
    loadComponent: () =>
      import('./features/consumer/product-list/product-list.component').then(
        m => m.ProductListComponent
      ),
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

  // カート画面（Consumer のみ）
  {
    path: 'cart',
    canActivate: [authGuard, consumerGuard],
    loadComponent: () =>
      import('./features/consumer/cart/cart.component').then(m => m.CartComponent),
  },

  // 注文確認画面（Consumer のみ）
  {
    path: 'checkout',
    canActivate: [authGuard, consumerGuard],
    loadComponent: () =>
      import('./features/consumer/checkout/checkout.component').then(m => m.CheckoutComponent),
  },

  // 注文完了画面（Consumer のみ）
  {
    path: 'order-complete',
    canActivate: [authGuard, consumerGuard],
    loadComponent: () =>
      import('./features/consumer/order-complete/order-complete.component').then(
        m => m.OrderCompleteComponent
      ),
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

  { path: '**', redirectTo: '/home' },
];
