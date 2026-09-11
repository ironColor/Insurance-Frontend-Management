import type { ProductConfig, ProductQuery, ProductVO } from './types';

const rows: ProductVO[] = [
  {
    productId: 1,
    owner: '贵州本部',
    productCode: '福泉26秋季001',
    productName: '福泉高级实验中学26年秋季学平险（100元/年）',
    businessUnit: '重庆本部',
    createTime: '2026-08-22',
    premium: 12000,
    orderCount: 120,
    status: '0'
  },
  {
    productId: 2,
    owner: '保定财险事业部',
    productCode: 'bwyl',
    productName: '百万医疗保险',
    businessUnit: '保定本部',
    createTime: '2026-08-21',
    premium: 0,
    orderCount: 0,
    status: '0'
  },
  {
    productId: 3,
    owner: '贵州本部',
    productCode: '平塘秋季010',
    productName: '平塘民中高一年级31、32班（26年秋季）',
    businessUnit: '保险财险事业部',
    createTime: '2026-08-16',
    premium: 8500,
    orderCount: 170,
    status: '0'
  },
  {
    productId: 4,
    owner: '贵州本部',
    productCode: '平塘秋季009',
    productName: '塘边中学（26年秋季）',
    businessUnit: '山西',
    createTime: '2026-08-16',
    premium: 6200,
    orderCount: 124,
    status: '0'
  },
  {
    productId: 5,
    owner: '贵州本部',
    productCode: '平塘秋季008',
    productName: '克度中学（26年秋季）',
    businessUnit: '济南',
    createTime: '2026-08-16',
    premium: 4800,
    orderCount: 96,
    status: '0'
  },
  {
    productId: 6,
    owner: '保定',
    productCode: 'TEST-202608120002-BDXYX',
    productName: 'TEST-保定学幼险-202608120002',
    businessUnit: '保定',
    createTime: '2026-08-12',
    premium: 0,
    orderCount: 0,
    status: '0'
  },
  {
    productId: 7,
    owner: '保定',
    productCode: 'TEST-20260812-BDXYX',
    productName: 'TEST-保定学幼险-202608',
    businessUnit: '重庆本部',
    createTime: '2026-08-12',
    premium: 0,
    orderCount: 0,
    status: '0'
  },
  {
    productId: 8,
    owner: '重庆本部',
    productCode: 'njyge',
    productName: '南江',
    businessUnit: '四川本部',
    createTime: '2026-08-11',
    premium: 2100,
    orderCount: 42,
    status: '0'
  },
  {
    productId: 9,
    owner: '重庆本部',
    productCode: 'chongqing001',
    productName: '巴中市职业技术学院（26秋）',
    businessUnit: '四川本部',
    createTime: '2026-08-10',
    premium: 1400,
    orderCount: 14,
    status: '0'
  },
  {
    productId: 10,
    owner: '保定财险事业部',
    productCode: 'BDCCXYD HQZ20260805',
    productName: '河北保定长城学院运动会秋招',
    businessUnit: '保定财险事业部',
    createTime: '2026-08-05',
    premium: 0.01,
    orderCount: 1,
    status: '0'
  }
];

const delay = <T>(value: T) => new Promise<T>((resolve) => setTimeout(() => resolve(value), 180));
export const listProducts = async (query: ProductQuery) => {
  const filtered = rows.filter(
    (x) =>
      x.status === query.status &&
      (!query.productCode || x.productCode.includes(query.productCode)) &&
      (!query.productName || x.productName.includes(query.productName)) &&
      (!query.businessUnit || x.businessUnit === query.businessUnit)
  );
  const start = (query.pageNum - 1) * query.pageSize;
  return delay({ rows: filtered.slice(start, start + query.pageSize).map((x) => ({ ...x })), total: filtered.length });
};
export const changeProductStatus = async (id: number, status: '0' | '1') => {
  const item = rows.find((x) => x.productId === id);
  if (item) item.status = status;
  return delay(undefined);
};

const defaultConfig = (id?: number): ProductConfig => ({
  productId: id,
  hasOrders: false,
  name: id ? '学平险保障计划' : '',
  code: id ? '福泉26秋季001' : '',
  businessUnit: id ? '贵州本部' : '',
  subtitle: '针对幼儿、学生设计，为孩子提供综合险保障。',
  products: id
    ? [
        { name: '学平险', type: '主险', companyId: 2, required: true, plans: [{ name: '无忧版', premium: 100, description: '', protections: [] }] },
        { name: '监护人责任险', type: '附加险', companyId: 2, required: false, plans: [] }
      ]
    : [],
  introduction: '<h2>学生平安综合保险</h2><p>为学生提供安心、全面的成长保障。</p>',
  fieldGroups: [
    {
      id: 'group-applicant',
      name: '投保人信息',
      fields: [
        {
          id: 'applicant-name',
          name: '投保人姓名',
          type: '文本',
          placeholder: '请输入投保人姓名',
          required: true,
          sort: 1,
          options: [],
          formatRule: '无',
          businessRules: []
        },
        {
          id: 'applicant-phone',
          name: '联系电话',
          type: '手机',
          placeholder: '请输入联系电话',
          required: true,
          sort: 2,
          options: [],
          formatRule: '手机号',
          businessRules: []
        }
      ]
    },
    {
      id: 'group-student',
      name: '学生信息',
      fields: [
        {
          id: 'student-name',
          name: '学生姓名',
          type: '文本',
          placeholder: '请输入学生姓名',
          required: true,
          sort: 1,
          options: [],
          formatRule: '无',
          businessRules: []
        },
        {
          id: 'student-id-type',
          name: '证件类型',
          type: '单选',
          placeholder: '请选择证件类型',
          required: true,
          sort: 2,
          options: ['居民身份证', '护照', '其他证件'],
          formatRule: '无',
          businessRules: []
        },
        {
          id: 'student-id-number',
          name: '证件号码',
          type: '身份证',
          placeholder: '请输入证件号码',
          required: true,
          sort: 3,
          options: [],
          formatRule: '身份证号',
          businessRules: ['已支付证件号校验', '已投保证件号校验']
        },
        {
          id: 'student-school',
          name: '学校名称',
          type: '文本',
          placeholder: '请输入学校名称',
          required: true,
          sort: 4,
          options: [],
          formatRule: '无',
          businessRules: []
        },
        {
          id: 'student-grade',
          name: '年级',
          type: '单选',
          placeholder: '请选择年级',
          required: true,
          sort: 5,
          options: ['一年级', '二年级', '三年级', '四年级', '五年级', '六年级'],
          formatRule: '无',
          businessRules: []
        },
        {
          id: 'student-class',
          name: '班级',
          type: '单选',
          placeholder: '请选择班级',
          required: true,
          sort: 6,
          options: ['1班', '2班', '3班', '4班'],
          formatRule: '无',
          businessRules: []
        },
        {
          id: 'student-birthday',
          name: '出生日期',
          type: '日期',
          placeholder: '请选择出生日期',
          required: false,
          sort: 7,
          options: [],
          formatRule: '无',
          businessRules: []
        },
        {
          id: 'student-hobby',
          name: '兴趣爱好',
          type: '多选',
          placeholder: '请选择兴趣爱好（可多选）',
          required: false,
          sort: 8,
          options: ['阅读', '运动', '音乐', '绘画'],
          formatRule: '无',
          businessRules: []
        }
      ]
    }
  ],
  forceRead: [{ title: '投保须知', content: '请仔细阅读保障责任、责任免除及理赔说明。', seconds: 5, enabled: true }],
  agreements: [{ name: '保险条款.pdf', url: '', required: true }]
});
const configs = new Map<number, ProductConfig>();
export const getProductConfig = async (id?: number) => {
  if (!id) return delay(defaultConfig());
  const row = rows.find((item) => item.productId === id);
  const savedConfig = configs.get(id);
  const config = savedConfig ? structuredClone(savedConfig) : defaultConfig(id);
  config.hasOrders = Boolean(row?.orderCount);
  if (row && !savedConfig) {
    config.name = row.productName;
    config.code = row.productCode;
    config.businessUnit = row.businessUnit;
  }
  return delay(config);
};
export const saveProductConfig = async (data: ProductConfig) => {
  const id = data.productId || Math.max(...rows.map((x) => x.productId)) + 1;
  configs.set(id, structuredClone({ ...data, productId: id }));
  if (!data.productId)
    rows.unshift({
      productId: id,
      owner: data.businessUnit,
      productCode: data.code,
      productName: data.name,
      businessUnit: data.businessUnit,
      createTime: new Date().toISOString().slice(0, 10),
      premium: 0,
      orderCount: 0,
      status: '0'
    });
  return delay(id);
};
