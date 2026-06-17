export interface CartItem {
  sellerId: string;
  productId: string;
  name: string;
  price: number;
  quantity: number;
  imageUrl?: string;
}
