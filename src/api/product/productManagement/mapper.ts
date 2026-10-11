import type { ApiDoc, ApiProduct } from './apiTypes';
import type { AgreementConfigItem, ProductConfig, ProductVO } from './types';

const sorted = <T extends { sort?: number }>(items: T[] = []) => [...items].sort((a, b) => (a.sort ?? 0) - (b.sort ?? 0));
const enabled = (value?: string) => value !== '0';
const flag = (value: boolean) => (value ? '1' : '0');

/** 兼容接口返回的 JSON 数组和逗号分隔字符串。 */
export const parseStringList = (value?: string, separator: string | RegExp = ','): string[] => {
  if (!value) return [];
  try {
    const parsed: unknown = JSON.parse(value);
    if (Array.isArray(parsed)) {
      return parsed.map((item) => (typeof item === 'object' && item ? String(item.label ?? item.value ?? item.url ?? '') : String(item)));
    }
  } catch {
    // 普通分隔字符串无需 JSON 解析。
  }
  return value
    .split(separator)
    .map((item) => item.trim())
    .filter(Boolean);
};

const serializeList = (values: string[], original: string | undefined, format: 'semicolon' | 'comma') => {
  const separator = format === 'semicolon' ? /[；;\n]/ : ',';
  if (original !== undefined && JSON.stringify(parseStringList(original, separator)) === JSON.stringify(values)) return original;
  return values.join(format === 'semicolon' ? '；' : ',');
};

export const createProductConfig = (): ProductConfig => ({
  hasOrders: false,
  name: '',
  code: '',
  businessUnit: '',
  status: '0',
  subtitle: '',
  products: [],
  introduction: '',
  introductionMediaType: 'video',
  introductionVideoUrl: '',
  introductionVideoName: '',
  introductionVideoPoster: '',
  introductionVideoPosterName: '',
  introductionVideoAutoplay: true,
  introductionVideoMuted: true,
  introductionCarouselImages: [],
  introductionCarouselInterval: 3,
  customerServicePhone: '',
  customerServiceHours: '',
  customerServiceRemark: '',
  fieldGroups: [],
  forceReadRule: { requireScroll: true, requireDuration: true, seconds: 10 },
  forceRead: [],
  agreements: []
});

export const toProductRow = (item: ApiProduct & { createTime?: string }): ProductVO => ({
  productId: item.productId!,
  owner: item.businessDeptName || '',
  productCode: item.productCode || '',
  productName: item.productName || '',
  businessUnit: item.businessDeptName || '',
  createTime: item.createTime || '',
  premium: item.payAmount == null ? undefined : Number(item.payAmount),
  orderCount: item.orderNum,
  status: item.status === '1' ? '1' : '0'
});

export const toAgreement = (doc: ApiDoc): AgreementConfigItem => ({
  apiData: doc,
  id: doc.docId,
  configType: doc.classify === '2' ? 'agreement' : 'productFile',
  code: doc.code || '',
  name: doc.name || '',
  agreementType: doc.agreementType || '',
  version: doc.version || '',
  contentType: doc.contentType === '2' ? 'link' : doc.contentType === '3' ? 'attachment' : 'text',
  content: doc.contentText || '',
  link: doc.contentUrl || '',
  fileName: doc.fileName || '',
  filePath: doc.filePath || '',
  enabled: enabled(doc.visible),
  sort: doc.sort,
  remark: doc.remarks || '',
  updatedAt: doc.updateTime || ''
});

export const toProductConfig = (item: ApiProduct): ProductConfig => {
  const config = createProductConfig();
  const media = item.media;
  const service = item.servicePhoneList?.[0];
  Object.assign(config, {
    apiData: item,
    productId: item.productId,
    hasOrders: item.isEdit === '0' || (item.isEdit == null && Number(item.orderNum) > 0),
    name: item.productName || '',
    code: item.productCode || '',
    businessUnit: item.businessDeptName || '',
    businessDeptId: item.businessDeptId,
    status: item.status === '1' ? '1' : '0',
    subtitle: item.productTitle || '',
    introduction: media?.introInfo ?? item.introInfo ?? '',
    introductionMediaType: media?.type === '2' ? 'carousel' : 'video',
    introductionVideoUrl: media?.videoUrl || '',
    introductionVideoPoster: item.logoUrl || '',
    introductionCarouselImages: parseStringList(media?.picUrl).map((url, index) => ({ id: `image-${index}`, name: '', url })),
    introductionCarouselInterval: media?.intervals || 3,
    customerServicePhone: service?.phone || '',
    customerServiceHours: service?.serviceTime || '',
    customerServiceRemark: service?.description || ''
  });
  config.products = sorted(item.planGroupList).map((group) => ({
    apiData: group,
    name: group.groupName || '',
    type: group.classify === '2' ? '附加险' : '主险',
    companyId: group.insCompanyId,
    companyName: group.insCompanyName,
    required: group.required === '1',
    plans: sorted(group.planList).map((plan) => ({
      apiData: plan,
      name: plan.planName || '',
      premium: Number(plan.price || 0),
      description: plan.planDesc || '',
      protections: sorted(plan.liabilityList).map((liability) => ({
        apiData: liability,
        name: liability.liabilityName || '',
        amount: liability.sumInsured || ''
      }))
    }))
  }));
  config.fieldGroups = sorted(item.blockConfigList).map((block) => ({
    apiData: block,
    id: block.blockId == null ? undefined : String(block.blockId),
    name: block.blockName || '',
    fields: sorted(block.fieldConfigList).map((field) => ({
      apiData: field,
      id: field.fieldId == null ? undefined : String(field.fieldId),
      name: field.fieldLabel || '',
      type: field.fieldType || '',
      placeholder: field.fieldPlaceholder || '',
      required: field.required === '1',
      sort: field.sort,
      options: parseStringList(field.fieldOptions, /[；;\n]/),
      formatRule: field.validType || '',
      businessRules: parseStringList(field.busiValidType)
    }))
  }));
  config.forceRead = sorted(item.forceDocList).map((doc) => {
    const styles = parseStringList(doc.readStyle);
    return {
      apiData: doc,
      title: doc.name || '',
      content: doc.contentText || '',
      seconds: doc.readSeconds || 0,
      enabled: enabled(doc.visible),
      requireScroll: styles.includes('1'),
      requireDuration: styles.includes('2'),
      sort: doc.sort || 1,
      important: doc.isForceRead === '0'
    };
  });
  const readRule = config.forceRead.find((doc) => !doc.important);
  if (readRule) {
    config.forceReadRule = { requireScroll: readRule.requireScroll, requireDuration: readRule.requireDuration, seconds: readRule.seconds || 10 };
  }
  config.agreements = sorted(item.docList).map(toAgreement);
  return config;
};

/** 新增和复制时仅保留业务内容，所有实体主键及关联主键由后端生成。 */
export const toProductRequest = (config: ProductConfig): ApiProduct => {
  const isNew = config.productId == null;
  const productId = config.productId;
  const source = config.apiData || {};
  const identity = <T extends object>(data: T | undefined, ...keys: string[]): T => {
    const result = { ...data } as T;
    ['createDept', 'createBy', 'createTime', 'updateBy', 'updateTime', 'tenantId', 'params', 'isEdit', 'payAmount', 'orderNum'].forEach(
      (key) => delete result[key]
    );
    if (isNew) keys.forEach((key) => delete result[key]);
    return result;
  };
  return {
    ...identity(source, 'productId', 'isEdit', 'payAmount', 'orderNum'),
    productId,
    productName: config.name,
    productCode: config.code,
    businessDeptId: config.businessDeptId,
    businessDeptName: config.businessUnit,
    productTitle: config.subtitle,
    insCompanyId: config.products.find((group) => group.type === '主险')?.companyId ?? source.insCompanyId,
    insCompanyName: config.products.find((group) => group.type === '主险')?.companyName ?? source.insCompanyName,
    status: config.status || '0',
    logoUrl: config.introductionVideoPoster,
    media: {
      ...identity(source.media, 'id', 'productId'),
      productId,
      introInfo: config.introduction,
      type: config.introductionMediaType === 'carousel' ? '2' : '1',
      videoUrl: config.introductionMediaType === 'video' ? config.introductionVideoUrl : '',
      picUrl:
        config.introductionMediaType === 'carousel'
          ? serializeList(
              config.introductionCarouselImages.map((image) => image.url),
              source.media?.picUrl,
              'comma'
            )
          : '',
      intervals: config.introductionCarouselInterval
    },
    planGroupList: config.products.map((group, groupIndex) => ({
      ...identity(group.apiData, 'groupId', 'productId'),
      productId,
      groupName: group.name,
      classify: group.type === '附加险' ? '2' : '1',
      insCompanyId: group.companyId,
      insCompanyName: group.companyName,
      required: flag(group.required),
      visible: group.apiData?.visible ?? '1',
      sort: groupIndex + 1,
      planList: group.plans.map((plan, planIndex) => ({
        ...identity(plan.apiData, 'planId', 'groupId', 'productId'),
        productId,
        groupId: isNew ? undefined : group.apiData?.groupId,
        planName: plan.name,
        price: plan.premium,
        planDesc: plan.description,
        visible: plan.apiData?.visible ?? '1',
        sort: planIndex + 1,
        liabilityList: plan.protections.map((liability, index) => ({
          ...identity(liability.apiData, 'liabilityId', 'planId', 'productId'),
          productId,
          planId: isNew ? undefined : plan.apiData?.planId,
          liabilityName: liability.name,
          sumInsured: liability.amount,
          sort: index + 1
        }))
      }))
    })),
    blockConfigList: config.fieldGroups.map((block, index) => ({
      ...identity(block.apiData, 'blockId', 'productId'),
      productId,
      blockName: block.name,
      blockCode: block.apiData?.blockCode || `block_${block.id?.replace(/[^a-zA-Z0-9]/g, '_') || index + 1}`,
      blockType: block.apiData?.blockType || 'form',
      required: block.apiData?.required ?? '1',
      visible: block.apiData?.visible ?? '1',
      sort: index + 1,
      fieldConfigList: block.fields.map((field, fieldIndex) => ({
        ...identity(field.apiData, 'fieldId', 'blockId', 'productId'),
        productId,
        blockId: isNew ? undefined : block.apiData?.blockId,
        fieldLabel: field.name,
        fieldName: field.apiData?.fieldName || `field_${field.id?.replace(/[^a-zA-Z0-9]/g, '_') || fieldIndex + 1}`,
        fieldType: field.type,
        fieldPlaceholder: field.placeholder,
        required: flag(field.required),
        visible: field.apiData?.visible ?? '1',
        editable: field.apiData?.editable ?? '1',
        fieldOptions: serializeList(field.options || [], field.apiData?.fieldOptions, 'semicolon'),
        optionMode: field.apiData?.optionMode || 'manual',
        validType: field.formatRule || '',
        busiValidType: serializeList(field.businessRules || [], field.apiData?.busiValidType, 'comma'),
        sort: fieldIndex + 1
      }))
    })),
    servicePhoneList: config.customerServicePhone
      ? [
          {
            ...identity(source.servicePhoneList?.[0], 'serviceId', 'productId'),
            productId,
            phone: config.customerServicePhone,
            serviceTime: config.customerServiceHours,
            description: config.customerServiceRemark,
            visible: source.servicePhoneList?.[0]?.visible ?? '1'
          },
          ...(source.servicePhoneList?.slice(1) || []).map((service) => ({ ...identity(service, 'serviceId', 'productId'), productId }))
        ]
      : [],
    forceDocList: config.forceRead.map((doc, index) => ({
      ...identity(doc.apiData, 'docId', 'productId'),
      productId,
      classify: '1',
      name: doc.title,
      contentType: '1',
      contentText: doc.content,
      isForceRead: flag(!doc.important),
      readStyle: doc.important ? '' : [doc.requireScroll ? '1' : '', doc.requireDuration ? '2' : ''].filter(Boolean).join(','),
      readSeconds: doc.requireDuration ? doc.seconds : 0,
      visible: flag(doc.enabled),
      sort: doc.sort ?? index + 1
    })),
    docList: config.agreements.map((doc, index) => ({
      ...identity(doc.apiData, 'docId', 'productId'),
      productId,
      classify: doc.configType === 'agreement' ? '2' : '3',
      code: doc.code,
      name: doc.name,
      agreementType: doc.agreementType,
      version: doc.version,
      contentType: !doc.contentType || doc.contentType === 'text' ? '1' : doc.contentType === 'link' ? '2' : '3',
      contentText: doc.content || '',
      contentUrl: doc.link || '',
      fileName: doc.fileName || '',
      filePath: doc.filePath || '',
      visible: flag(doc.enabled),
      sort: doc.sort ?? index + 1,
      remarks: doc.remark || ''
    }))
  };
};
