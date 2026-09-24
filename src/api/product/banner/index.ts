import request from '@/utils/request';
import type { BannerForm, BannerPageResult, BannerProductOption, BannerQuery, BannerVO } from './types';

interface BannerResponse {
  bannerId: number;
  bannerUrl?: string;
  linkUrl?: string;
  productId?: number;
  productName?: string;
  status?: '0' | '1';
}

const toBanner = (item: BannerResponse): BannerVO => ({
  bannerId: item.bannerId,
  image: item.bannerUrl || '',
  jumpUrl: item.linkUrl || '',
  productId: item.productId,
  productName: item.productName || '',
  status: item.status || '0'
});

const toRequest = (data: BannerForm) => ({
  ...(data.bannerId ? { bannerId: data.bannerId } : {}),
  bannerUrl: data.image,
  linkUrl: data.jumpUrl,
  productId: data.productId || undefined,
  status: data.status
});

export const listEnabledBannerProducts = async (): Promise<BannerProductOption[]> => {
  const response = await request<BannerProductOption[]>({ url: '/product/productList', method: 'get', params: { status: '0' } });
  return response.data || [];
};

export const listBanner = async (query: BannerQuery): Promise<BannerPageResult> => {
  const response = await request<BannerResponse[]>({
    url: '/product/banner/list',
    method: 'get',
    params: {
      pageNum: query.pageNum,
      pageSize: query.pageSize,
      linkUrl: query.jumpUrl || undefined,
      productId: query.productId || undefined,
      status: query.status || undefined
    }
  });
  return { rows: (response.rows || []).map(toBanner), total: response.total || 0 };
};

export const getBanner = async (bannerId: number): Promise<BannerVO> => {
  const response = await request<BannerResponse>({ url: `/product/banner/${bannerId}`, method: 'get' });
  return toBanner(response.data);
};

export const addBanner = (data: BannerForm) => request({ url: '/product/banner', method: 'post', data: toRequest(data) });

export const updateBanner = (data: BannerForm) => request({ url: '/product/banner', method: 'put', data: toRequest(data) });

export const deleteBanner = (bannerId: number) => request({ url: `/product/banner/${bannerId}`, method: 'delete' });

export const changeBannerStatus = (bannerId: number, status: '0' | '1') =>
  request({ url: '/product/banner/editStatus', method: 'put', data: { bannerId, status } });
