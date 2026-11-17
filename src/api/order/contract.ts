import type { OrderQuery } from './types';
/** IDs stay strings to preserve int64 precision. */
export const requireProductId = (value: string | number): string => {
  const id = String(value ?? '').trim();
  if (!/^\d+$/.test(id) || /^0+$/.test(id)) throw new Error('缺少有效产品或订单ID');
  return id;
};
export const orderFilters = (query: OrderQuery) => ({
  productId: requireProductId(query.productId),
  orderNo: query.orderNo?.trim() || undefined,
  payStatus: query.payStatus || undefined,
  beginCreateTime: query.beginCreateTime || undefined,
  endCreateTime: query.endCreateTime || undefined
});
export const displayJson = (value: unknown): string => {
  if (value == null || value === '') return '未知';
  if (typeof value === 'string') {
    try { return JSON.stringify(JSON.parse(value), null, 2); } catch { return value; }
  }
  return JSON.stringify(value, null, 2);
};
export const statusText = (value: unknown, options: { value: string; label: string }[]) =>
  options.find((item) => item.value === String(value))?.label || (value == null || value === '' ? '未知' : `未知（${value}）`);
/** OpenAPI does not specify amount units. Do not convert or append a currency. */
export const displayAmount = (value: unknown) => value == null || value === '' ? '未知' : String(value);
export const validateExport = async (blob: Blob): Promise<Blob> => {
  if (!(blob instanceof Blob) || !blob.size) throw new Error('导出接口返回空文件');
  const head = await blob.slice(0, 512).text();
  if (/json|text|html|xml/i.test(blob.type) || /^[\s\uFEFF]*[\[{<]/.test(head)) {
    let message = '导出接口未返回有效表格文件';
    try { message = JSON.parse(await blob.text()).msg || message; } catch { /* Do not render server HTML. */ }
    throw new Error(message);
  }
  const signature = new Uint8Array(await blob.slice(0, 8).arrayBuffer());
  if (!(signature[0] === 0x50 && signature[1] === 0x4b) && !(signature[0] === 0xd0 && signature[1] === 0xcf)) {
    throw new Error('导出文件格式无法确认');
  }
  return blob;
};
