import { Component, inject } from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import { NgIf } from '@angular/common';
import { AuthService } from '../../../core/services/auth.service';
import { CartService } from '../../../core/services/cart.service';

@Component({
  selector: 'app-header',
  standalone: true,
  imports: [NgIf, RouterLink],
  template: `
    <header class="header">
      <div class="header-inner">
        <a routerLink="/home" class="logo">🛍 EC Market</a>

        <nav class="nav" *ngIf="auth.isAuthenticated()">
          <!-- 消費者メニュー -->
          <ng-container *ngIf="!auth.isSeller()">
            <a routerLink="/home">商品一覧</a>
            <a routerLink="/cart" class="cart-link">
              🛒 カート
              <span *ngIf="cart.totalCount() > 0" class="cart-badge">{{ cart.totalCount() }}</span>
            </a>
            <a routerLink="/orders">注文履歴</a>
          </ng-container>

          <!-- 出品者メニュー -->
          <ng-container *ngIf="auth.isSeller()">
            <a routerLink="/seller/products">商品管理</a>
            <a routerLink="/seller/orders">注文管理</a>
          </ng-container>

          <button class="btn-logout" (click)="logout()">ログアウト</button>
        </nav>

        <nav class="nav" *ngIf="!auth.isAuthenticated()">
          <a routerLink="/login">ログイン</a>
          <a routerLink="/register">新規登録</a>
        </nav>
      </div>
    </header>
  `,
  styles: [`
    .header {
      background: white;
      border-bottom: 1px solid #e9ecef;
      position: sticky;
      top: 0;
      z-index: 100;
    }
    .header-inner {
      max-width: 1200px;
      margin: 0 auto;
      padding: 0 20px;
      height: 56px;
      display: flex;
      align-items: center;
      justify-content: space-between;
    }
    .logo {
      font-size: 18px;
      font-weight: 700;
      color: #4263eb;
      text-decoration: none;
    }
    .nav {
      display: flex;
      align-items: center;
      gap: 20px;
    }
    .nav a {
      font-size: 14px;
      color: #555;
      text-decoration: none;
      display: inline-flex;
      align-items: center;
      gap: 6px;
    }
    .nav a:hover { color: #4263eb; }
    .cart-link {
      position: relative;
    }
    .cart-badge {
      background: #e03131;
      color: white;
      font-size: 11px;
      font-weight: 700;
      padding: 1px 6px;
      border-radius: 10px;
      line-height: 1.4;
      min-width: 18px;
      text-align: center;
    }
    .btn-logout {
      background: none;
      border: 1px solid #dee2e6;
      padding: 6px 14px;
      border-radius: 6px;
      font-size: 13px;
      cursor: pointer;
      color: #555;
    }
    .btn-logout:hover { background: #f8f9fa; }
  `],
})
export class HeaderComponent {
  auth = inject(AuthService);
  cart = inject(CartService);
  private router = inject(Router);

  async logout(): Promise<void> {
    await this.auth.logout();
    this.router.navigate(['/login']);
  }
}
