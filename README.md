# EC マーケットプレイス — フロントエンド（Angular）

Angular 17 + TypeScript + Angular Signals を使った EC マーケットプレイスのフロントエンド実装です。

## リポジトリ構成

```
.
├── 完成版/          # 参考実装（課題の答え）
└── スターターキット/ # 課題の出発点（受講者に配布）
```

## 完成版 ディレクトリ構成

```
完成版/
├── angular.json          # Angular CLI 設定（ビルド・サーブの設定）
├── tsconfig.json         # TypeScript コンパイラ設定
├── tsconfig.app.json     # アプリ用 TypeScript 設定
├── package.json          # 依存パッケージ定義
│
└── src/
    ├── index.html        # エントリーポイント HTML（<app-root> を配置）
    ├── main.ts           # アプリ起動（bootstrapApplication を呼び出す）
    ├── styles.css        # グローバル CSS（ボタン・フォームの共通スタイル）
    │
    ├── environments/
    │   └── environment.ts  # Cognito・API エンドポイントなどの設定値
    │
    └── app/
        ├── app.component.ts  # ルートコンポーネント（ヘッダー + router-outlet）
        ├── app.config.ts     # DI プロバイダー設定（Router・HttpClient・Interceptor）
        ├── app.routes.ts     # 全ルート定義（lazy load で各コンポーネントを読み込む）
        │
        ├── core/                   # アプリ全体で使う共通ロジック
        │   ├── models/
        │   │   ├── product.model.ts  # Product の型定義
        │   │   ├── order.model.ts    # Order・OrderItem の型定義
        │   │   └── cart.model.ts     # CartItem の型定義
        │   ├── services/
        │   │   ├── auth.service.ts   # Cognito 認証（Signals で状態管理）
        │   │   └── api.service.ts    # バックエンド API 呼び出し（HttpClient）
        │   ├── interceptors/
        │   │   └── auth.interceptor.ts  # 全リクエストに Bearer Token を自動付与
        │   └── guards/
        │       ├── auth.guard.ts    # 未ログインを /login にリダイレクト
        │       └── seller.guard.ts  # consumer ユーザーを /products にリダイレクト
        │
        ├── shared/                 # 複数画面で使い回すコンポーネント
        │   └── components/
        │       ├── header/
        │       │   └── header.component.ts      # ナビゲーションバー（ロール別メニュー）
        │       └── product-card/
        │           └── product-card.component.ts  # 商品カード（一覧画面で使用）
        │
        └── features/               # 画面単位のコンポーネント
            ├── auth/
            │   ├── login/
            │   │   └── login.component.ts        # ログイン画面
            │   └── register/
            │       └── register.component.ts     # 新規登録 + 確認コード入力
            ├── consumer/
            │   ├── product-list/
            │   │   └── product-list.component.ts   # 商品一覧（カテゴリフィルター付き）
            │   ├── product-detail/
            │   │   └── product-detail.component.ts # 商品詳細・カートに追加
            │   ├── cart/
            │   │   └── cart.component.ts           # カート確認・注文実行
            │   └── orders/
            │       └── orders.component.ts         # 注文履歴
            └── seller/
                ├── seller-products/
                │   └── seller-products.component.ts  # 商品登録・編集・削除
                └── seller-orders/
                    └── seller-orders.component.ts    # 受注一覧
```

## 技術スタック

| 技術 | バージョン |
|------|-----------|
| Angular | 17 |
| TypeScript | 5.4 |
| Angular Signals | 17（組み込み） |
| Angular Router | 17（Functional Guards） |
| Angular HttpClient | 17（Functional Interceptors） |
| AWS Amplify JS | v6 |

## セットアップ

```bash
cd スターターキット
npm install
```

`src/environments/environment.ts` を開いて Cognito・API の設定値を入力：

```typescript
export const environment = {
  cognito: {
    userPoolId: 'ap-northeast-1_XXXXXXXXX',       // ← 変更
    userPoolClientId: 'xxxxxxxxxxxxxxxxxxxxxxxxxx', // ← 変更
  },
  apiEndpoint: 'https://xxxxxxxxxx.execute-api.ap-northeast-1.amazonaws.com/prod', // ← 変更
  cloudfrontUrl: 'https://xxxxxxxxxxxx.cloudfront.net', // ← 変更
};
```

```bash
npm start   # http://localhost:4200 で起動
```

## Angular 17 スタンドアロンのポイント

### NgModule 不要
各コンポーネントに `standalone: true` を指定し、必要なものだけ `imports` に列挙します。

```typescript
@Component({
  standalone: true,
  imports: [NgIf, NgFor, RouterLink, FormsModule],
  template: `...`
})
export class ProductListComponent {}
```

### Signals による状態管理
NgRx 不要。`signal()` / `computed()` で状態を管理します。

```typescript
const products = signal<Product[]>([]);
const total = computed(() => products().reduce(...));
products.set([...]);       // 値の更新
products.update(p => ...); // 現在値をもとに更新
```

### Functional Guards
```typescript
export const authGuard: CanActivateFn = () => {
  const auth = inject(AuthService);
  return auth.isAuthenticated() ? true : inject(Router).createUrlTree(['/login']);
};
```

### Functional Interceptors
```typescript
export const authInterceptor: HttpInterceptorFn = (req, next) => {
  return from(inject(AuthService).getToken()).pipe(
    switchMap(token => next(req.clone({ setHeaders: { Authorization: `Bearer ${token}` } })))
  );
};
```

## バックエンド連携

バックエンド（Lambda + API Gateway）のセットアップは [ec-backend](../ec-backend) を参照。
