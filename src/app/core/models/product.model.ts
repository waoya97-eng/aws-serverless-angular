export interface Product {
  sellerId: string;
  productId: string;
  name: string;
  description: string;
  price: number;
  category: string;
  stock: number;
  imageUrl?: string;
  createdAt?: string;
}

export interface ProductListResponse {
  products: Product[];
  lastEvaluatedKey?: unknown;
}

export interface UploadUrlResponse {
  uploadUrl: string;
  imageUrl: string;
}
