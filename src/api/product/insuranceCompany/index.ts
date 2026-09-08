import { InsuranceCompanyForm, InsuranceCompanyPageResult, InsuranceCompanyQuery, InsuranceCompanyVO } from './types';

const STORAGE_KEY = 'insurance-company-list';

const createLogo = (text: string, color: string) => {
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="80" height="80" viewBox="0 0 80 80"><rect width="80" height="80" rx="14" fill="${color}"/><text x="40" y="49" text-anchor="middle" font-family="Arial,sans-serif" font-size="25" font-weight="700" fill="#fff">${text}</text></svg>`;
  return `data:image/svg+xml;charset=UTF-8,${encodeURIComponent(svg)}`;
};

const initialRows: InsuranceCompanyVO[] = [
  {
    companyId: 1,
    logo: createLogo('PI', '#6658d3'),
    companyName: '中国人民保险',
    website: 'https://www.picc.com',
    remark: '央企头部，全险种覆盖',
    status: '0'
  },
  {
    companyId: 2,
    logo: createLogo('CL', '#2879c9'),
    companyName: '中国人寿',
    website: 'https://www.chinalife.com.cn',
    remark: '寿险龙头',
    status: '0'
  },
  {
    companyId: 3,
    logo: createLogo('CP', '#c25336'),
    companyName: '太平洋保险',
    website: 'https://www.cpic.com.cn',
    remark: '综合金融集团',
    status: '0'
  },
  { companyId: 4, logo: createLogo('ZK', '#b67646'), companyName: '紫金保险', website: 'https://www.zking.com', remark: '地方性财险', status: '0' },
  {
    companyId: 5,
    logo: createLogo('CC', '#5c8c79'),
    companyName: '大地保险',
    website: 'https://www.ccic-net.com.cn',
    remark: '全国性财险',
    status: '0'
  },
  { companyId: 6, logo: createLogo('CI', '#2866bf'), companyName: '中华财险', website: 'https://www.cic.cn', remark: '全国性财险公司', status: '1' },
  {
    companyId: 7,
    logo: createLogo('SG', '#c86143'),
    companyName: '阳光保险集团',
    website: 'https://www.sinosig.com',
    remark: '七大保险集团之一',
    status: '0'
  },
  { companyId: 8, logo: createLogo('PA', '#c88b42'), companyName: '平安保险', website: 'https://www.pingan.com', remark: '综合金融', status: '0' },
  { companyId: 9, logo: createLogo('TK', '#675acb'), companyName: '泰康保险', website: 'https://www.taikang.com', remark: '医养结合', status: '0' },
  {
    companyId: 10,
    logo: createLogo('NC', '#9a6a49'),
    companyName: '新华保险',
    website: 'https://www.newchinalife.com',
    remark: '上市险企',
    status: '0'
  },
  {
    companyId: 11,
    logo: createLogo('TP', '#3583bd'),
    companyName: '中国太平',
    website: 'https://www.cntaiping.com',
    remark: '综合性保险集团',
    status: '0'
  },
  {
    companyId: 12,
    logo: createLogo('ZA', '#3d9a79'),
    companyName: '众安保险',
    website: 'https://www.zhongan.com',
    remark: '互联网保险公司',
    status: '1'
  }
];

const cloneRows = (rows: InsuranceCompanyVO[]) => rows.map((item) => ({ ...item }));

const readRows = (): InsuranceCompanyVO[] => {
  try {
    const value = localStorage.getItem(STORAGE_KEY);
    return value ? JSON.parse(value) : cloneRows(initialRows);
  } catch {
    return cloneRows(initialRows);
  }
};

let companyRows = readRows();

const saveRows = () => {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(companyRows));
  } catch {
    // 浏览器存储空间不足时仍保留当前会话内的数据。
  }
};

export const listInsuranceCompany = async (query: InsuranceCompanyQuery): Promise<InsuranceCompanyPageResult> => {
  const keyword = query.companyName.trim().toLowerCase();
  const filteredRows = companyRows.filter((item) => {
    const matchesName = !keyword || item.companyName.toLowerCase().includes(keyword);
    const matchesStatus = !query.status || item.status === query.status;
    return matchesName && matchesStatus;
  });
  const start = (query.pageNum - 1) * query.pageSize;
  return {
    rows: cloneRows(filteredRows.slice(start, start + query.pageSize)),
    total: filteredRows.length
  };
};

export const getInsuranceCompany = async (companyId: number): Promise<InsuranceCompanyVO> => {
  const company = companyRows.find((item) => item.companyId === companyId);
  if (!company) throw new Error('未找到该保险公司');
  return { ...company };
};

export const addInsuranceCompany = async (data: InsuranceCompanyForm) => {
  const nextId = companyRows.reduce((max, item) => Math.max(max, item.companyId), 0) + 1;
  companyRows.unshift({ ...data, companyId: nextId });
  saveRows();
};

export const updateInsuranceCompany = async (data: InsuranceCompanyForm) => {
  const index = companyRows.findIndex((item) => item.companyId === data.companyId);
  if (index < 0 || !data.companyId) throw new Error('未找到该保险公司');
  companyRows[index] = { ...data, companyId: data.companyId };
  saveRows();
};

export const deleteInsuranceCompany = async (companyId: number) => {
  companyRows = companyRows.filter((item) => item.companyId !== companyId);
  saveRows();
};

export const changeInsuranceCompanyStatus = async (companyId: number, status: '0' | '1') => {
  const company = companyRows.find((item) => item.companyId === companyId);
  if (!company) throw new Error('未找到该保险公司');
  company.status = status;
  saveRows();
};
