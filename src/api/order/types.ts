export type OrderId = string | number;
/** Codes are supplied by backend dictionaries, not a frontend enum. */
export type OrderPayStatus = string;
export interface OrderVO {
  orderId: OrderId;
  productId?: OrderId;
  orderNo?: string;
  productTitle?: string;
  businessDeptName?: string;
  productCode?: string;
  productName?: string;
  totalAmount?: number;
  payAmount?: number;
  discountAmount?: number;
  createTime?: string;
  orderStatus?: string;
  payStatus?: string;
  policyStatus?: string;
  policyNo?: string;
  policyEffectiveDate?: string;
  policyExpiryDate?: string;
  expireTime?: string;
  payTime?: string;
  remark?: string;
  fieldData?: string;
  orderData?: string;
  pay?: Record<string, unknown>;
  refundList?: Record<string, unknown>[];
}
export interface OrderQuery {
  productId: OrderId;
  pageNum: number;
  pageSize: number;
  orderNo?: string;
  payStatus?: string;
  beginCreateTime?: string;
  endCreateTime?: string;
}
export interface OrderStatistics {
  totalNum?: number;
  payNum?: number;
  refundNum?: number;
  unPayNum?: number;
  payAmount?: number;
  refundAmount?: number;

}
export interface OrderPageResult { rows: OrderVO[]; total: number; columns: import('./contract').OrderField[] }
