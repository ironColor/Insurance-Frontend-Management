import type { OrderPageResult, OrderQuery, OrderStatistics, OrderVO } from './types';

const productTitle = '*附属幼儿园_B0-441f8dfc_平塘秋季098*';
const baseProduct = {
  productTitle,
  businessUnit: '附属幼儿园',
  productCode: 'B0-441f8dfc',
  productName: '附属幼儿园幼儿',
  premium: 50,
  totalAmount: 50,
  payStatus: 'paid' as const
};

const orders: OrderVO[] = [
  {
    orderId: 1,
    ...baseProduct,
    orderNo: '50826162735261627439*19202608265',
    merchantOrderNo: '50826162735261627439',
    paymentNo: '19202608265',
    studentName: '范弘毅',
    studentIdCard: '52272720230522007X',
    grade: '小班',
    className: '01',
    parentName: '罗芝琴',
    parentIdCard: '52272719930405302',
    phone: '18385655942',
    createTime: '2026-08-26 16:21',
    payTime: '2026-08-26 16:21'
  },
  {
    orderId: 2,
    ...baseProduct,
    orderNo: '50826162612026162029*19202608263',
    merchantOrderNo: '50826162612026162029',
    paymentNo: '19202608263',
    studentName: '莫洪昱',
    studentIdCard: '522727202307120013',
    grade: '小班',
    className: '01',
    parentName: '罗大琴',
    parentIdCard: '52272719940803002',
    phone: '18385628417',
    createTime: '2026-08-26 16:20',
    payTime: '2026-08-26 16:20'
  },
  {
    orderId: 3,
    ...baseProduct,
    orderNo: '5082612060526120614455*1202608265',
    merchantOrderNo: '5082612060526120614455',
    paymentNo: '1202608265',
    studentName: '刘廷霄',
    studentIdCard: '522720220203260054',
    grade: '中班',
    className: '01',
    parentName: '石冠丹',
    parentIdCard: '522720008030621',
    phone: '18722865787',
    createTime: '2026-08-26 12:01',
    payTime: '2026-08-26 12:01'
  },
  {
    orderId: 4,
    ...baseProduct,
    orderNo: '5082614463126144613734*1202608265',
    merchantOrderNo: '5082614463126144613734',
    paymentNo: '1202608265',
    studentName: '宋阳光',
    studentIdCard: '501131202203280036',
    grade: '中班',
    className: '01',
    parentName: '宋子丹',
    parentIdCard: '52252219920408522',
    phone: '18111886787',
    createTime: '2026-08-26 14:41',
    payTime: '2026-08-26 14:41'
  },
  {
    orderId: 5,
    ...baseProduct,
    orderNo: '5082612573326125754350*18202608263',
    merchantOrderNo: '5082612573326125754350',
    paymentNo: '18202608263',
    studentName: '刘雅菁',
    studentIdCard: '522727202203130049',
    grade: '中班',
    className: '01',
    parentName: '卢家琴',
    parentIdCard: '52272719920926242',
    phone: '17886167062',
    createTime: '2026-08-26 12:51',
    payTime: '2026-08-26 12:51'
  },
  {
    orderId: 6,
    ...baseProduct,
    orderNo: '50826140820632612614898*202608264',
    merchantOrderNo: '50826140820632612614898',
    paymentNo: '202608264',
    studentName: '张睿安',
    studentIdCard: '510311202309050032',
    grade: '小班',
    className: '01',
    parentName: '胡成秀',
    parentIdCard: '51031119941081006',
    phone: '15681600686',
    createTime: '2026-08-26 16:21',
    payTime: '2026-08-26 16:21'
  },
  {
    orderId: 7,
    ...baseProduct,
    orderNo: '5082614085352614084580*202608269',
    merchantOrderNo: '5082614085352614084580',
    paymentNo: '202608269',
    studentName: '杨泽棂灵',
    studentIdCard: '522727202210140085',
    grade: '中班',
    className: '01',
    parentName: '石兴爱',
    parentIdCard: '5227119871017002',
    phone: '18281541591',
    createTime: '2026-08-26 14:01',
    payTime: '2026-08-26 14:01'
  },
  {
    orderId: 8,
    ...baseProduct,
    orderNo: '508261447312614473521*202608269',
    merchantOrderNo: '508261447312614473521',
    paymentNo: '202608269',
    studentName: '宋温暖',
    studentIdCard: '52012202203280052',
    grade: '中班',
    className: '01',
    parentName: '宋子田',
    parentIdCard: '52252219920408521',
    phone: '18111886787',
    createTime: '2026-08-26 14:41',
    payTime: '2026-08-26 14:41'
  },
  {
    orderId: 9,
    ...baseProduct,
    orderNo: '5082612952261221043568*202608262',
    merchantOrderNo: '5082612952261221043568',
    paymentNo: '202608262',
    studentName: '秦子衿',
    studentIdCard: '5227272022110150064',
    grade: '中班',
    className: '01',
    parentName: '秦帅',
    parentIdCard: '5227271988014811',
    phone: '19808438956',
    createTime: '2026-08-26 12:21',
    payTime: '2026-08-26 12:21'
  },
  {
    orderId: 10,
    ...baseProduct,
    orderNo: '508261429532614301457*19202608267',
    merchantOrderNo: '508261429532614301457',
    paymentNo: '19202608267',
    studentName: '杨华宇',
    studentIdCard: '5227272022110210051',
    grade: '中班',
    className: '01',
    parentName: '杨荣昌',
    parentIdCard: '52272719920902031',
    phone: '15121359607',
    createTime: '2026-08-26 14:21',
    payTime: '2026-08-26 14:21'
  },
  {
    orderId: 11,
    ...baseProduct,
    orderNo: '5082616391526163915271*19202608268',
    merchantOrderNo: '5082616391526163915271',
    paymentNo: '19202608268',
    studentName: '周子涵',
    studentIdCard: '522727202304180026',
    grade: '大班',
    className: '02',
    parentName: '周静',
    parentIdCard: '522727199105120028',
    phone: '18985623741',
    createTime: '2026-08-26 17:08',
    payTime: '2026-08-26 17:08'
  }
];

const wait = <T>(value: T) => new Promise<T>((resolve) => setTimeout(() => resolve(value), 180));

const filterOrders = (query: OrderQuery) => {
  const keyword = query.keyword.trim().toLowerCase();
  return orders.filter((order) => {
    const keywordMatched =
      !keyword || [order.studentName, order.orderNo, order.merchantOrderNo, order.phone].some((value) => value.toLowerCase().includes(keyword));
    const statusMatched = !query.payStatus || order.payStatus === query.payStatus;
    const dateMatched = !query.createDate || order.createTime.startsWith(query.createDate);
    const productMatched = !query.productCode || order.productCode === query.productCode;
    return keywordMatched && statusMatched && dateMatched && productMatched;
  });
};

const getStatistics = (productCode: string): OrderStatistics => {
  const scoped = productCode ? orders.filter((order) => order.productCode === productCode) : orders;
  const paidOrders = scoped.filter((order) => order.payStatus === 'paid');
  return {
    total: scoped.length,
    paid: paidOrders.length,
    unpaid: scoped.length - paidOrders.length,
    paidPremium: paidOrders.reduce((sum, order) => sum + order.totalAmount, 0)
  };
};

export const listOrders = async (query: OrderQuery): Promise<OrderPageResult> => {
  const filtered = filterOrders(query);
  const start = (query.pageNum - 1) * query.pageSize;
  return wait({
    rows: filtered.slice(start, start + query.pageSize).map((order) => ({ ...order })),
    total: filtered.length,
    statistics: getStatistics(query.productCode)
  });
};

export const listAllOrders = async (query: OrderQuery): Promise<OrderVO[]> => wait(filterOrders(query).map((order) => ({ ...order })));
