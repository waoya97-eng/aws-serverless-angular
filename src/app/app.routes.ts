import { Routes } from '@angular/router';
import { authGuard } from './core/guards/auth.guard';

export const routes: Routes = [
  { path: '', redirectTo: '/home', pathMatch: 'full' },

  {
    path: 'login',
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

  // 商品詳細画面
  {
    path: 'products/:sellerId/:productId',
    canActivate: [authGuard],
    loadComponent: () =>
      import('./features/consumer/product-detail/product-detail.component').then(
        m => m.ProductDetailComponent
      ),
  },

  // TODO: 以下のルートを追加してください
  // { path: 'products', canActivate: [authGuard], loadComponent: ... }
  // { path: 'cart', ... }
  // { path: 'orders', ... }
  // { path: 'seller/products', canActivate: [authGuard, sellerGuard], ... }
  // { path: 'seller/orders', ... }

  { path: '**', redirectTo: '/home' },
];
