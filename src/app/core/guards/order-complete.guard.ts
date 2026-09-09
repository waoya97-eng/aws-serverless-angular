import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { OrderService } from '../services/order.service';

/** 直接 URL アクセス時は /products にリダイレクトするガード */
export const orderCompleteGuard: CanActivateFn = () => {
  const orderService = inject(OrderService);
  const router = inject(Router);

  const navigation = router.getCurrentNavigation();
  const navStateId =
    navigation?.extras?.state?.['orderId'] ||
    navigation?.extras?.state?.['order']?.orderId;

  const hasStateId =
    Boolean(navStateId) ||
    (typeof history !== 'undefined' &&
      Boolean(history.state?.orderId || history.state?.order?.orderId));
  const hasServiceId = Boolean(orderService.lastCompletedOrderId());

  if (!hasStateId && !hasServiceId) {
    return router.createUrlTree(['/products']);
  }
  return true;
};
