export interface BannerProductOption {
  productId: string | number;
  productName: string;
}

export interface BannerVO {
  bannerId: number;
  image: string;
  jumpUrl: string;
  productId?: string | number;
  productName: string;
  status: '0' | '1';
}

export interface BannerForm {
  bannerId?: number;
  image: string;
  jumpUrl: string;
  productId?: string | number;
  status: '0' | '1';
}

export interface BannerQuery extends PageQuery {
  jumpUrl: string;
  productId: string | number;
  status: '' | '0' | '1';
}

export interface BannerPageResult {
  rows: BannerVO[];
  total: number;
}
