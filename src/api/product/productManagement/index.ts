import request from '@/utils/request';
import { getDicts } from '@/api/system/dict/data';
import { listDept } from '@/api/system/dept';
import type { DeptVO } from '@/api/system/dept/types';
import type { ApiDoc, ApiProduct, ProductId } from './apiTypes';
import type { ProductConfig, ProductConfigSection, ProductDictionaries, ProductQuery } from './types';
import { createProductConfig, toAgreement, toProductConfig, toProductRequest, toProductRow } from './mapper';

const productUrl = '/product/product';

export const listProducts = async (query: ProductQuery) => {
  const response = await request<ApiProduct[]>({
    url: `${productUrl}/list`,
    method: 'get',
    params: {
      pageNum: query.pageNum,
      pageSize: query.pageSize,
      productCode: query.productCode || undefined,
      productName: query.productName || undefined,
      businessDeptId: query.businessDeptId,
      businessDeptName: query.businessUnit || undefined,
      status: query.status
    }
  });
  return { rows: (response.rows || []).map(toProductRow), total: response.total || 0 };
};

export const changeProductStatus = (productId: ProductId, status: '0' | '1') =>
  request({ url: `${productUrl}/editStatus`, method: 'put', data: { productId, status } });

export const listProductDocuments = async (productId: ProductId) => {
  const response = await request<ApiDoc[]>({ url: '/product/doc/docList', method: 'get', params: { productId } });
  return (response.data || []).filter((doc) => doc.classify === '2' || doc.classify === '3').map(toAgreement);
};

export const getProductDocument = async (docId: ProductId) => {
  const response = await request<ApiDoc>({ url: `/product/doc/${docId}`, method: 'get' });
  return toAgreement(response.data);
};

export const saveProductDocument = (doc: ApiDoc) => request({ url: '/product/doc', method: doc.docId == null ? 'post' : 'put', data: doc });

export const deleteProductDocument = (docId: ProductId) => request({ url: `/product/doc/${docId}`, method: 'delete' });

export const getProductConfig = async (id?: ProductId): Promise<ProductConfig> => {
  if (id == null) return createProductConfig();
  const response = await request<ApiProduct>({ url: `${productUrl}/${id}`, method: 'get' });
  const product = response.data;
  // 当前详情接口不返回编辑状态，分页接口提供 isEdit，作为后端编辑限制的依据。
  if (product.isEdit == null) {
    const summary = await request<ApiProduct[]>({
      url: `${productUrl}/list`,
      method: 'get',
      params: { productId: id, productCode: product.productCode, pageNum: 1, pageSize: 100 }
    });
    const row = summary.rows?.find((item) => String(item.productId) === String(id));
    if (!row || row.isEdit == null) throw new Error('接口未返回产品编辑状态，无法确认当前配置是否允许修改');
    product.isEdit = row.isEdit;
    product.orderNum = row.orderNum;
  }
  return toProductConfig(product);
};

/** 临时保存提交整个配置；普通保存提交当前页签，新增配置由后端返回主键。 */
export const saveProductConfig = async (config: ProductConfig, section: ProductConfigSection | 'all' = 'all'): Promise<ProductId> => {
  const data = toProductRequest(config);
  if (config.productId == null) {
    const response = await request<ApiProduct>({ url: section === 'basic' ? productUrl : `${productUrl}/addAll`, method: 'post', data });
    const productId = response.data?.productId;
    if (productId == null) throw new Error('保存接口未返回产品ID，请检查后端响应');
    return productId;
  }
  const sectionPaths: Record<ProductConfigSection, string> = {
    basic: productUrl,
    plan: `${productUrl}/${config.productId}/plan`,
    intro: `${productUrl}/${config.productId}/media`,
    fields: `${productUrl}/${config.productId}/block`,
    read: `${productUrl}/${config.productId}/forceDoc`,
    agreement: `${productUrl}/${config.productId}/doc`
  };
  await request({ url: section === 'all' ? `${productUrl}/editAll` : sectionPaths[section], method: 'put', data });
  return config.productId;
};

export const getProductQrCode = async (productId: ProductId): Promise<Blob> => {
  const blob = await request<never, Blob>({
    url: `${productUrl}/${productId}/qrcode`,
    method: 'post',
    data: {
      productId,
      page: 'pages/index/index',
      params: { productId: String(productId) },
      encodeMode: 'KV',
      width: 430
    },
    responseType: 'blob'
  });
  if (blob.type.includes('json') || blob.type.startsWith('text/')) {
    let message = '二维码生成失败';
    const body = await blob.text();
    try {
      const response = JSON.parse(body);
      message = response.msg || message;
    } catch {
      message = body.trim() || message;
    }
    throw new Error(message);
  }
  if (!blob.size) throw new Error('二维码接口返回了空图片');
  return blob;
};

export const listBusinessDepartments = async (): Promise<DeptVO[]> => {
  const response = await listDept();
  return (response.data || []).filter((dept: DeptVO) => dept.status === '0');
};

export const getProductDictionaries = async (): Promise<ProductDictionaries> => {
  const dictionaryNames = ['pro_field_type', 'pro_valid_type', 'pro_busi_valid_type', 'pro_agreement_type'];
  const results = await Promise.all(dictionaryNames.map((name) => getDicts(name)));
  const [fieldTypes, formatRules, businessRules, agreementTypes] = results.map((response) =>
    (response.data || []).map((item) => ({ label: item.dictLabel, value: item.dictValue }))
  );
  return { fieldTypes, formatRules, businessRules, agreementTypes };
};
