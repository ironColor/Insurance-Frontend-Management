import request from '@/utils/request';
import { orderFilters, requireProductId, validateExport } from './contract';
import type { OrderId, OrderPageResult, OrderQuery, OrderStatistics, OrderVO } from './types';
const base = '/product/product';
export const listOrders = async (query: OrderQuery): Promise<OrderPageResult> => {
  const params = orderFilters(query);
  const response = await request<OrderVO[]>({
    url: `${base}/${params.productId}/orderList`, method: 'get',
    params: { ...params, pageNum: query.pageNum, pageSize: query.pageSize }
  });
  return { rows: response.rows || [], total: response.total || 0 };
};
export const getOrderStatistics = async (productId: OrderId): Promise<OrderStatistics> => {
  const id = requireProductId(productId);
  const response = await request<OrderStatistics>({ url: `${base}/${id}/orderStatic`, method: 'get', params: { productId: id } });
  return response.data || {};
};
export const getOrder = async (orderId: OrderId): Promise<OrderVO> => {
  const response = await request<OrderVO>({ url: `${base}/${requireProductId(orderId)}/orderInfo`, method: 'get' });
  if (!response.data) throw new Error('未获取到订单详情');
  return response.data;
};
export const exportOrders = async (query: OrderQuery): Promise<Blob> => {
  const params = orderFilters(query);
  const blob = await request<never, Blob>({ url: `${base}/${params.productId}/exportOrder`, method: 'get', params, responseType: 'blob' });
  return validateExport(blob);
};
