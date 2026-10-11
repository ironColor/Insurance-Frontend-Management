/** 根据产品服务接口文档定义的传输模型。 */
export type ProductId = string | number;

export interface ApiProduct {
  productId?: ProductId;
  productCode?: string;
  productName?: string;
  productTitle?: string;
  productType?: string;
  businessDeptId?: ProductId;
  businessDeptName?: string;
  insCompanyId?: ProductId;
  insCompanyName?: string;
  productDesc?: string;
  introInfo?: string;
  labels?: string;
  logoUrl?: string;
  isTop?: number;
  isDefault?: number;
  apiStyle?: string;
  status?: string;
  media?: ApiMedia;
  planGroupList?: ApiPlanGroup[];
  blockConfigList?: ApiBlockConfig[];
  servicePhoneList?: ApiServicePhone[];
  forceDocList?: ApiDoc[];
  docList?: ApiDoc[];
  isEdit?: string;
  payAmount?: string | number;
  orderNum?: number;
}

export interface ApiPlanGroup {
  groupId?: ProductId;
  productId?: ProductId;
  groupName?: string;
  classify?: string;
  insCompanyId?: ProductId;
  insCompanyName?: string;
  groupDesc?: string;
  sort?: number;
  required?: string;
  visible?: string;
  isDefault?: string;
  planList?: ApiPlan[];
}

export interface ApiPlan {
  planId?: ProductId;
  productId?: ProductId;
  groupId?: ProductId;
  planCode?: string;
  planName?: string;
  planDesc?: string;
  price?: string | number;
  sort?: number;
  required?: string;
  visible?: string;
  isDefault?: string;
  liabilityList?: ApiLiability[];
}

export interface ApiLiability {
  liabilityId?: ProductId;
  productId?: ProductId;
  planId?: ProductId;
  liabilityCode?: string;
  liabilityName?: string;
  description?: string;
  sumInsured?: string;
  sort?: number;
}

export interface ApiMedia {
  id?: ProductId;
  productId?: ProductId;
  introInfo?: string;
  type?: string;
  videoUrl?: string;
  picUrl?: string;
  intervals?: number;
  remarks?: string;
  sort?: number;
}

export interface ApiServicePhone {
  serviceId?: ProductId;
  productId?: ProductId;
  phone?: string;
  serviceTime?: string;
  description?: string;
  visible?: string;
}

export interface ApiBlockConfig {
  blockId?: ProductId;
  productId?: ProductId;
  pageId?: ProductId;
  blockCode?: string;
  blockName?: string;
  blockType?: string;
  blockDesc?: string;
  visible?: string;
  required?: string;
  sort?: number;
  fieldConfigList?: ApiFieldConfig[];
}

export interface ApiFieldConfig {
  fieldId?: ProductId;
  productId?: ProductId;
  blockId?: ProductId;
  fieldName?: string;
  fieldLabel?: string;
  fieldType?: string;
  fieldPlaceholder?: string;
  required?: string;
  visible?: string;
  editable?: string;
  defaultValue?: string;
  busiValidType?: string;
  validType?: string;
  validRule?: string;
  optionMode?: string;
  fieldOptions?: string;
  sort?: number;
  isTrigger?: number;
  triggerFields?: string;
}

export interface ApiDoc {
  docId?: ProductId;
  productId?: ProductId;
  classify?: string;
  code?: string;
  name?: string;
  agreementType?: string;
  contentType?: string;
  contentText?: string;
  contentUrl?: string;
  filePath?: string;
  fileName?: string;
  isForceRead?: string;
  readStyle?: string;
  readSeconds?: number;
  remarks?: string;
  sort?: number;
  visible?: string;
  version?: string;
  updateTime?: string;
}
