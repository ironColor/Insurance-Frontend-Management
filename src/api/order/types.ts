export type OrderPayStatus = 'paid' | 'unpaid';

export interface OrderVO {
  orderId: number;
  productTitle: string;
  businessUnit: string;
  productCode: string;
  productName: string;
  premium: number;
  orderNo: string;
  merchantOrderNo: string;
  paymentNo: string;
  studentName: string;
  studentIdCard: string;
  grade: string;
  className: string;
  parentName: string;
  parentIdCard: string;
  phone: string;
  totalAmount: number;
  createTime: string;
  payStatus: OrderPayStatus;
  payTime: string;
}

export interface OrderQuery {
  pageNum: number;
  pageSize: number;
  keyword: string;
  payStatus: '' | OrderPayStatus;
  createDate: string;
  productCode: string;
}

export interface OrderStatistics {
  total: number;
  paid: number;
  unpaid: number;
  paidPremium: number;
}

export interface OrderPageResult {
  rows: OrderVO[];
  total: number;
  statistics: OrderStatistics;
}
