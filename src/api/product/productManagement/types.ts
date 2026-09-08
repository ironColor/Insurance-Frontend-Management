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

export interface ProtectionItem { name: string; amount: string }
export interface ProductPlan { name: string; premium: number; company: string; type: string; required: boolean; description: string; protections: ProtectionItem[] }
export interface InsuredField { name: string; type: string; placeholder: string; required: boolean }
export interface FieldGroup { name: string; fields: InsuredField[] }

export interface ProductConfig {
  productId?: number;
  name: string;
  code: string;
  businessUnit: string;
  subtitle: string;
  products: string[];
  plans: ProductPlan[];
  introduction: string;
  fieldGroups: FieldGroup[];
  forceRead: { title: string; content: string; seconds: number; enabled: boolean }[];
  agreements: { name: string; url: string; required: boolean }[];
}
