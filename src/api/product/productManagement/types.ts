import type { ApiBlockConfig, ApiDoc, ApiFieldConfig, ApiLiability, ApiPlan, ApiPlanGroup, ApiProduct, ProductId } from './apiTypes';
export type { ProductId } from './apiTypes';

export interface ProductDictionaryOption {
  label: string;
  value: string;
}

export interface ProductDictionaries {
  fieldTypes: ProductDictionaryOption[];
  formatRules: ProductDictionaryOption[];
  businessRules: ProductDictionaryOption[];
  agreementTypes: ProductDictionaryOption[];
}

export type ProductConfigSection = 'basic' | 'plan' | 'intro' | 'fields' | 'read' | 'agreement';

export interface ProductVO {
  productId: ProductId;
  owner: string;
  productCode: string;
  productName: string;
  businessUnit: string;
  createTime: string;
  premium?: number;
  orderCount?: number;
  status: '0' | '1';
}

export interface ProductQuery {
  pageNum: number;
  pageSize: number;
  productCode: string;
  productName: string;
  businessUnit: string;
  businessDeptId?: ProductId;
  status: '0' | '1';
}

export interface ProtectionItem {
  apiData?: ApiLiability;
  name: string;
  amount: string;
}
export interface ProductPlan {
  apiData?: ApiPlan;
  name: string;
  premium: number;
  description: string;
  protections: ProtectionItem[];
}
export interface ProductItem {
  apiData?: ApiPlanGroup;
  name: string;
  type: string;
  companyId?: ProductId;
  companyName?: string;
  required: boolean;
  plans: ProductPlan[];
}
export interface InsuredField {
  apiData?: ApiFieldConfig;
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
  apiData?: ApiBlockConfig;
  id?: string;
  name: string;
  fields: InsuredField[];
}

export type IntroductionMediaType = 'video' | 'carousel';

export interface IntroductionCarouselImage {
  id: string;
  name: string;
  url: string;
}

export interface ForceReadItem {
  apiData?: ApiDoc;
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
  apiData?: ApiDoc;
  id?: ProductId;
  configType: AgreementConfigType;
  code?: string;
  name: string;
  agreementType: string;
  version?: string;
  contentType?: AgreementContentType;
  content?: string;
  link?: string;
  fileName?: string;
  filePath?: string;
  enabled: boolean;
  sort?: number;
  remark?: string;
  updatedAt: string;
  /** 兼容旧版协议数据。 */
  url?: string;
  required?: boolean;
}

export interface ProductConfig {
  apiData?: ApiProduct;
  productId?: ProductId;
  hasOrders: boolean;
  name: string;
  code: string;
  businessUnit: string;
  businessDeptId?: ProductId;
  status?: '0' | '1';
  subtitle: string;
  products: ProductItem[];
  introduction: string;
  introductionMediaType: IntroductionMediaType;
  introductionVideoUrl: string;
  introductionVideoName: string;
  introductionVideoPoster: string;
  introductionVideoPosterName: string;
  introductionVideoAutoplay: boolean;
  introductionVideoMuted: boolean;
  introductionCarouselImages: IntroductionCarouselImage[];
  introductionCarouselInterval: number;
  customerServicePhone: string;
  customerServiceHours: string;
  customerServiceRemark: string;
  fieldGroups: FieldGroup[];
  forceReadRule: ForceReadRule;
  forceRead: ForceReadItem[];
  agreements: AgreementConfigItem[];
}
