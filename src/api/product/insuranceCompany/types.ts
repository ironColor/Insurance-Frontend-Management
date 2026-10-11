export interface InsuranceCompanyVO {
  companyId: string | number;
  logo: string;
  companyName: string;
  website: string;
  remark: string;
  status: '0' | '1';
}

export interface InsuranceCompanyForm {
  companyId?: string | number;
  logo: string;
  companyName: string;
  website: string;
  remark: string;
  status: '0' | '1';
}

export interface InsuranceCompanyQuery extends PageQuery {
  companyName: string;
  status: '' | '0' | '1';
}

export interface InsuranceCompanyPageResult {
  rows: InsuranceCompanyVO[];
  total: number;
}
