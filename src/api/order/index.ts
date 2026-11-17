import request from '@/utils/request';
import { orderColumns, orderFilters, requireProductId, validateExport, type OrderExport } from './contract';
import type { OrderId, OrderPageResult, OrderQuery, OrderStatistics, OrderVO } from './types';
const base = '/product/product';
export const listOrders = async (query: OrderQuery): Promise<OrderPageResult> => {
  const params = orderFilters(query);
  const response = await request<OrderVO[]>({
    url: `${base}/${params.productId}/orderList`, method: 'get',
    params: { ...params, pageNum: query.pageNum, pageSize: query.pageSize }
  });
  const rows = response.rows || [];
  let blocks: unknown = [];
  if (!rows.length) {
    const product = await request<{ blockConfigList?: unknown }>({ url: `${base}/${params.productId}`, method: 'get' });
    blocks = product.data?.blockConfigList || [];
  }
  return { rows, total: response.total || 0, columns: orderColumns(rows, blocks) };
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
export const exportOrders = async (query: OrderQuery): Promise<OrderExport> => {
  const params = orderFilters(query);
  const blob = await request<never, Blob>({ url: `${base}/${params.productId}/exportOrder`, method: 'get', params, responseType: 'blob' });
  return validateExport(blob);
};
