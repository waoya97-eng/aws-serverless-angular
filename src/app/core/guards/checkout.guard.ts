import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { CartService } from '../services/cart.service';
import { OrderService } from '../services/order.service';

/** カートが空、または直前に注文完了している場合は /products にリダイレクトするガード（ブラウザバック時の再注文防止） */
export const checkoutGuard: CanActivateFn = () => {
  const cart = inject(CartService);
  const orderService = inject(OrderService);
  const router = inject(Router);

  const hasSessionFlag =
    typeof sessionStorage !== 'undefined' &&
    sessionStorage.getItem('ec_just_completed_order') === 'true';

  if (cart.isEmpty() || orderService.justCompletedOrder() || hasSessionFlag) {
    return router.createUrlTree(['/products']);
  }
  return true;
};
