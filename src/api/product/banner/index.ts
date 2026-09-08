import { BannerForm, BannerPageResult, BannerProductOption, BannerQuery, BannerVO } from './types';

const STORAGE_KEY = 'banner-management-list';

const productOptions: BannerProductOption[] = [
  { productId: 1, productName: '学生平安综合险' },
  { productId: 2, productName: '少儿意外医疗险' },
  { productId: 3, productName: '家庭综合保障计划' },
  { productId: 4, productName: '成人重疾险' },
  { productId: 5, productName: '车险综合保障' }
];

const createBanner = (background: string, foreground: string) => {
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="280" height="120" viewBox="0 0 280 120"><rect width="280" height="120" rx="12" fill="${background}"/><rect x="118" y="30" width="44" height="34" rx="4" fill="none" stroke="${foreground}" stroke-width="3"/><circle cx="130" cy="41" r="5" fill="${foreground}"/><path d="M121 59l14-13 10 9 7-6 8 10" fill="none" stroke="${foreground}" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"/><text x="140" y="91" text-anchor="middle" font-family="Arial,sans-serif" font-size="17" fill="${foreground}">Banner</text></svg>`;
  return `data:image/svg+xml;charset=UTF-8,${encodeURIComponent(svg)}`;
};

const bannerImages = [
  createBanner('#f8e9e4', '#c9aba2'),
  createBanner('#edf0e8', '#afb8a4'),
  createBanner('#e7ecfb', '#a6b2d6'),
  createBanner('#eeeafb', '#b7acd9')
];

const initialRows: BannerVO[] = [
  { bannerId: 1, image: bannerImages[0], jumpUrl: '/pages/home/home', productId: 1, productName: '学生平安综合险', status: '0' },
  { bannerId: 2, image: bannerImages[1], jumpUrl: '/pages/product/detail?id=3', productId: 3, productName: '家庭综合保障计划', status: '0' },
  { bannerId: 3, image: bannerImages[2], jumpUrl: '/pages/promo/back-school', productId: 2, productName: '少儿意外医疗险', status: '0' },
  { bannerId: 4, image: bannerImages[3], jumpUrl: '/pages/home/home', productId: 4, productName: '成人重疾险', status: '1' },
  { bannerId: 5, image: bannerImages[0], jumpUrl: '/pages/product/list', productId: 5, productName: '车险综合保障', status: '0' },
  { bannerId: 6, image: bannerImages[2], jumpUrl: '/pages/home/home', productId: 2, productName: '少儿意外医疗险', status: '0' },
  { bannerId: 7, image: bannerImages[3], jumpUrl: '/pages/promo/anniversary', productId: 4, productName: '成人重疾险', status: '0' },
  { bannerId: 8, image: bannerImages[0], jumpUrl: '/pages/home/home', productId: 5, productName: '车险综合保障', status: '0' },
  { bannerId: 9, image: bannerImages[2], jumpUrl: '/pages/product/detail?id=2', productId: 2, productName: '少儿意外医疗险', status: '1' },
  { bannerId: 10, image: bannerImages[1], jumpUrl: '/pages/promo/new-year', productId: 1, productName: '学生平安综合险', status: '0' },
  { bannerId: 11, image: bannerImages[3], jumpUrl: '/pages/product/detail?id=1', productId: 1, productName: '学生平安综合险', status: '0' },
  { bannerId: 12, image: bannerImages[1], jumpUrl: '/pages/promo/summer', productId: 3, productName: '家庭综合保障计划', status: '1' }
];

const cloneRows = (rows: BannerVO[]) => rows.map((item) => ({ ...item }));

const readRows = (): BannerVO[] => {
  try {
    const value = localStorage.getItem(STORAGE_KEY);
    return value ? JSON.parse(value) : cloneRows(initialRows);
  } catch {
    return cloneRows(initialRows);
  }
};

let bannerRows = readRows();

const saveRows = () => {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(bannerRows));
  } catch {
    // 浏览器存储空间不足时仍保留当前会话内的数据。
  }
};

const getProductName = (productId?: number) => productOptions.find((item) => item.productId === productId)?.productName || '';

export const listEnabledBannerProducts = async (): Promise<BannerProductOption[]> => productOptions.map((item) => ({ ...item }));

export const listBanner = async (query: BannerQuery): Promise<BannerPageResult> => {
  const keyword = query.jumpUrl.trim().toLowerCase();
  const filteredRows = bannerRows.filter((item) => {
    const matchesUrl = !keyword || item.jumpUrl.toLowerCase().includes(keyword);
    const matchesProduct = query.productId === '' || item.productId === query.productId;
    const matchesStatus = !query.status || item.status === query.status;
    return matchesUrl && matchesProduct && matchesStatus;
  });
  const start = (query.pageNum - 1) * query.pageSize;
  return {
    rows: cloneRows(filteredRows.slice(start, start + query.pageSize)),
    total: filteredRows.length
  };
};

export const getBanner = async (bannerId: number): Promise<BannerVO> => {
  const banner = bannerRows.find((item) => item.bannerId === bannerId);
  if (!banner) throw new Error('未找到该 Banner 图');
  return { ...banner };
};

export const addBanner = async (data: BannerForm) => {
  const nextId = bannerRows.reduce((max, item) => Math.max(max, item.bannerId), 0) + 1;
  bannerRows.unshift({ ...data, bannerId: nextId, productName: getProductName(data.productId) });
  saveRows();
};

export const updateBanner = async (data: BannerForm) => {
  const index = bannerRows.findIndex((item) => item.bannerId === data.bannerId);
  if (index < 0 || !data.bannerId) throw new Error('未找到该 Banner 图');
  bannerRows[index] = { ...data, bannerId: data.bannerId, productName: getProductName(data.productId) };
  saveRows();
};

export const deleteBanner = async (bannerId: number) => {
  bannerRows = bannerRows.filter((item) => item.bannerId !== bannerId);
  saveRows();
};

export const changeBannerStatus = async (bannerId: number, status: '0' | '1') => {
  const banner = bannerRows.find((item) => item.bannerId === bannerId);
  if (!banner) throw new Error('未找到该 Banner 图');
  banner.status = status;
  saveRows();
};
