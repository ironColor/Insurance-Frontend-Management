import type { OrderQuery, OrderVO } from './types';
/** Never silently stringify an already rounded int64. */
export const requireProductId = (value: string | number): string => {
  if (typeof value === 'number' && !Number.isSafeInteger(value)) throw new Error('ID精度已丢失，请使用字符串ID');
  const id = String(value ?? '').trim();
  if (!/^\d+$/.test(id) || /^0+$/.test(id)) throw new Error('缺少有效产品或订单ID');
  return id;
};
export const orderFilters = (query: OrderQuery) => ({
  productId: requireProductId(query.productId),
  orderNo: query.orderNo?.trim() || undefined,
  payStatus: query.payStatus || undefined,
  // Backend accepts inclusive boundaries in local YYYY-MM-DD HH:mm:ss format.
  beginCreateTime: query.beginCreateTime || undefined,
  endCreateTime: query.endCreateTime || undefined
});
export const statusText = (value: unknown, options: { value: string; label: string }[]) =>
  options.find((item) => item.value === String(value))?.label || (value == null || value === '' ? '未知' : `未知（${value}）`);
export const displayAmount = (value: unknown) => value == null || value === '' ? '未知' : String(value);
const record = (value: unknown): value is Record<string, unknown> => !!value && typeof value === 'object' && !Array.isArray(value);
const parse = (value: unknown): unknown => {
  if (typeof value !== 'string') return value;
  try { return JSON.parse(value); } catch { return undefined; }
};
const safeName = (name: unknown): name is string => typeof name === 'string' && /^[A-Za-z][A-Za-z0-9_]*$/.test(name) && !['__proto__', 'prototype', 'constructor'].includes(name);
const own = (obj: object, key: string) => Object.prototype.hasOwnProperty.call(obj, key);
const sort = (value: unknown) => record(value) && Number.isFinite(Number(value.sort)) ? Number(value.sort) : 0;
export interface OrderField { name: string; label: string }
const fields = (value: unknown): OrderField[] => {
  const parsed = parse(value);
  if (!Array.isArray(parsed)) return [];
  return [...parsed].sort((a, b) => sort(a) - sort(b)).flatMap((field) =>
    record(field) && safeName(field.fieldName) && String(field.visible ?? '1') !== '0'
      ? [{ name: field.fieldName, label: typeof field.fieldLabel === 'string' && field.fieldLabel ? field.fieldLabel : field.fieldName }]
      : []);
};
/** Union every row's historical snapshot; never guess a field from a Chinese label or numeric ID. */
export const orderColumns = (rows: Pick<OrderVO, 'fieldData'>[], blocks: unknown = []): OrderField[] => {
  const candidates = rows.length ? rows.flatMap((row) => fields(row.fieldData)) :
    (Array.isArray(blocks) ? [...blocks].sort((a, b) => sort(a) - sort(b)).flatMap((block) =>
      record(block) && String(block.visible ?? '1') !== '0' ? fields(block.fieldConfigList) : []) : []);
  const seen = new Set<string>();
  return candidates.filter((field) => !seen.has(field.name) && !!seen.add(field.name));
};
export const displayValue = (value: unknown): string => {
  if (value == null || value === '') return '—';
  if (['string', 'number', 'boolean'].includes(typeof value)) return String(value);
  if (Array.isArray(value)) return value.map((item) => record(item) || Array.isArray(item) ? '—' : displayValue(item)).join('、');
  return '—';
};
export const orderSections = (row: Pick<OrderVO, 'fieldData' | 'orderData'>, listFields: readonly OrderField[] = []) => {
  const data = parse(row.orderData);
  const labels = new Map(fields(row.fieldData).map((field) => [field.name, field.label]));
  // Reuse displayed list labels; detail metadata fills gaps, never replaces a known list label.
  for (const field of listFields) {
    const label = field.label?.trim();
    if (safeName(field.name) && label && label !== field.name) labels.set(field.name, label);
  }
  if (!record(data) || !Array.isArray(data.blockConfigList)) return [];
  return [...data.blockConfigList].sort((a, b) => sort(a) - sort(b)).flatMap((block) => {
    if (!record(block) || !record(block.fieldConfig)) return [];
    return [{ name: typeof block.blockName === 'string' ? block.blockName : '投保信息', fields: Object.entries(block.fieldConfig)
      .filter(([key]) => safeName(key))
      .map(([name, value]) => ({ name, label: labels.get(name) || name, value: displayValue(value) })) }];
  });
};
export const orderFieldValue = (row: Pick<OrderVO, 'fieldData' | 'orderData'>, name: string) => {
  if (!safeName(name)) return '—';
  // A field absent in this historical configuration must not inherit another row's definition.
  if (!fields(row.fieldData).some((field) => field.name === name)) return '—';
  return orderSections(row).flatMap((section) => section.fields).filter((field) => field.name === name).map((field) => field.value).join(' / ') || '—';
};
/** Only scalar values of explicit safe keys may be displayed; never stringify gateway payloads. */
export const safeRecordValue = (recordValue: unknown, key: string) => record(recordValue) && own(recordValue, key) ? displayValue(recordValue[key]) : '—';
export const refundStatusDefaults = [{ value: 'SUCCESS', label: '退款成功' }];
export interface OrderExport { blob: Blob; extension: 'xlsx' | 'xls' | 'zip' | 'rar' }
export const validateExport = async (blob: Blob): Promise<OrderExport> => {
  if (!(blob instanceof Blob) || !blob.size) throw new Error('导出接口返回空文件');
  const head = await blob.slice(0, 512).text();
  const mediaType = blob.type.split(';', 1)[0].trim().toLowerCase();
  const isTextResponse = mediaType.startsWith('text/') || /[/+](?:json|xml|html)$/.test(mediaType);
  if (isTextResponse || /^[\s\uFEFF]*[\[{<]/.test(head)) throw new Error('导出接口未返回有效文件');
  const bytes = new Uint8Array(await blob.arrayBuffer());
  const starts = (signature: number[]) => signature.every((byte, index) => bytes[index] === byte);
  if (bytes.length >= 512 && starts([0xd0, 0xcf, 0x11, 0xe0, 0xa1, 0xb1, 0x1a, 0xe1])) return { blob, extension: 'xls' };
  if (bytes.length > 8 && (starts([0x52, 0x61, 0x72, 0x21, 0x1a, 0x07, 0x00]) || starts([0x52, 0x61, 0x72, 0x21, 0x1a, 0x07, 0x01, 0x00]))) return { blob, extension: 'rar' };
  if (starts([0x50, 0x4b, 0x03, 0x04]) || starts([0x50, 0x4b, 0x05, 0x06])) {
    // Identify OOXML using ZIP central-directory names, not MIME or arbitrary bytes in file contents.
    const view = new DataView(bytes.buffer);
    let end = -1;
    for (let i = bytes.length - 22; i >= Math.max(0, bytes.length - 65557); i--) {
      if (view.getUint32(i, true) === 0x06054b50 && i + 22 + view.getUint16(i + 20, true) === bytes.length) { end = i; break; }
    }
    if (end >= 0) {
      const names = new Set<string>();
      let cursor = view.getUint32(end + 16, true);
      const count = view.getUint16(end + 10, true);
      const directoryEnd = cursor + view.getUint32(end + 12, true);
      if (directoryEnd !== end) throw new Error('导出压缩文件结构无法确认');
      for (let i = 0; i < count; i++) {
        if (cursor + 46 > end || view.getUint32(cursor, true) !== 0x02014b50) throw new Error('导出压缩文件结构无法确认');
        const length = view.getUint16(cursor + 28, true);
        const next = cursor + 46 + length + view.getUint16(cursor + 30, true) + view.getUint16(cursor + 32, true);
        if (next > end) throw new Error('导出压缩文件结构无法确认');
        names.add(new TextDecoder().decode(bytes.slice(cursor + 46, cursor + 46 + length)));
        cursor = next;
      }
      if (cursor !== end) throw new Error('导出压缩文件结构无法确认');
      return { blob, extension: names.has('[Content_Types].xml') && names.has('xl/workbook.xml') ? 'xlsx' : 'zip' };
    }
  }
  throw new Error('导出文件格式无法确认');
};
