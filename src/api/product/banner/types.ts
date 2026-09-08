export interface BannerProductOption {
  productId: number;
  productName: string;
}

export interface BannerVO {
  bannerId: number;
  image: string;
  jumpUrl: string;
  productId?: number;
  productName: string;
  status: '0' | '1';
}

export interface BannerForm {
  bannerId?: number;
  image: string;
  jumpUrl: string;
  productId?: number;
  status: '0' | '1';
}

export interface BannerQuery extends PageQuery {
  jumpUrl: string;
  productId: number | '';
  status: '' | '0' | '1';
}

export interface BannerPageResult {
  rows: BannerVO[];
  total: number;
}
