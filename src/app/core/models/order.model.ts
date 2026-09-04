export interface OrderItem {
  sellerId: string;
  productId: string;
  name: string;
  price: number;
  quantity: number;
}

export interface Order {
  buyerId: string;
  orderId: string;
  items: OrderItem[];
  totalAmount: number;
  status: string;
  createdAt?: string;
}

export interface OrdersResponse {
  orders: Order[];
}

