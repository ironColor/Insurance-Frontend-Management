export interface ProductVO {
  productId: number;
  owner: string;
  productCode: string;
  productName: string;
  businessUnit: string;
  createTime: string;
  premium: number;
  orderCount: number;
  status: '0' | '1';
}

export interface ProductQuery {
  pageNum: number;
  pageSize: number;
  productCode: string;
  productName: string;
  businessUnit: string;
  status: '0' | '1';
}

export interface ProtectionItem {
  name: string;
  amount: string;
}
export interface ProductPlan {
  name: string;
  premium: number;
  description: string;
  protections: ProtectionItem[];
}
export interface ProductItem {
  name: string;
  type: string;
  companyId?: number;
  required: boolean;
  plans: ProductPlan[];
}
export interface InsuredField {
  id?: string;
  name: string;
  type: string;
  placeholder: string;
  required: boolean;
  sort?: number;
  options?: string[];
  formatRule?: string;
  businessRules?: string[];
}
export interface FieldGroup {
  id?: string;
  name: string;
  fields: InsuredField[];
}
export interface ForceReadItem {
  title: string;
  content: string;
  seconds: number;
  enabled: boolean;
  requireScroll: boolean;
  requireDuration: boolean;
  sort: number;
  important?: boolean;
  readMode?: 'floating' | 'scroll' | 'duration';
}

export interface ForceReadRule {
  requireScroll: boolean;
  requireDuration: boolean;
  seconds: number;
}

export type AgreementConfigType = 'productFile' | 'agreement';
export type AgreementContentType = 'text' | 'link' | 'attachment';

export interface AgreementConfigItem {
  id?: number;
  configType: AgreementConfigType;
  code?: string;
  name: string;
  agreementType: string;
  version?: string;
  contentType?: AgreementContentType;
  content?: string;
  link?: string;
  fileName?: string;
  enabled: boolean;
  sort?: number;
  remark?: string;
  updatedAt: string;
  /** 兼容旧版协议数据。 */
  url?: string;
  required?: boolean;
}

export interface ProductConfig {
  productId?: number;
  hasOrders: boolean;
  name: string;
  code: string;
  businessUnit: string;
  subtitle: string;
  products: ProductItem[];
  introduction: string;
  customerServicePhone: string;
  customerServiceHours: string;
  customerServiceRemark: string;
  fieldGroups: FieldGroup[];
  forceReadRule: ForceReadRule;
  forceRead: ForceReadItem[];
  agreements: AgreementConfigItem[];
}
