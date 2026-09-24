import request from '@/utils/request';
import type { InsuranceCompanyForm, InsuranceCompanyPageResult, InsuranceCompanyQuery, InsuranceCompanyVO } from './types';

interface InsuranceCompanyResponse {
  insCompanyId: number;
  companyName: string;
  logoUrl?: string;
  linkUrl?: string;
  remark?: string;
  status?: '0' | '1';
}

const toCompany = (item: InsuranceCompanyResponse): InsuranceCompanyVO => ({
  companyId: item.insCompanyId,
  companyName: item.companyName,
  logo: item.logoUrl || '',
  website: item.linkUrl || '',
  remark: item.remark || '',
  status: item.status || '0'
});

const toRequest = (data: InsuranceCompanyForm) => ({
  ...(data.companyId ? { insCompanyId: data.companyId } : {}),
  companyName: data.companyName,
  logoUrl: data.logo,
  linkUrl: data.website,
  remark: data.remark,
  status: data.status
});

export const listInsuranceCompany = async (query: InsuranceCompanyQuery): Promise<InsuranceCompanyPageResult> => {
  const response = await request<InsuranceCompanyResponse[]>({
    url: '/product/insCompany/list',
    method: 'get',
    params: {
      pageNum: query.pageNum,
      pageSize: query.pageSize,
      companyName: query.companyName || undefined,
      status: query.status || undefined
    }
  });
  return { rows: (response.rows || []).map(toCompany), total: response.total || 0 };
};

export const getInsuranceCompany = async (companyId: number): Promise<InsuranceCompanyVO> => {
  const response = await request<InsuranceCompanyResponse>({ url: `/product/insCompany/${companyId}`, method: 'get' });
  return toCompany(response.data);
};

export const addInsuranceCompany = (data: InsuranceCompanyForm) => request({ url: '/product/insCompany', method: 'post', data: toRequest(data) });

export const updateInsuranceCompany = (data: InsuranceCompanyForm) => request({ url: '/product/insCompany', method: 'put', data: toRequest(data) });

export const deleteInsuranceCompany = (companyId: number) => request({ url: `/product/insCompany/${companyId}`, method: 'delete' });

export const changeInsuranceCompanyStatus = (companyId: number, status: '0' | '1') =>
  request({ url: '/product/insCompany/editStatus', method: 'put', data: { insCompanyId: companyId, status } });
