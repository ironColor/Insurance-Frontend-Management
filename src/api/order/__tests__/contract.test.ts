import { describe, it, expect, vi, beforeEach } from 'vitest';
import { orderColumns, orderFieldValue, orderSections, requireProductId, orderFilters, validateExport, safeRecordValue, displayAmount, statusText, refundStatusDefaults } from '../contract';
vi.mock('@/utils/request', () => ({ default: vi.fn() }));
import request from '@/utils/request';
import { listOrders, getOrderStatistics, getOrder, exportOrders } from '../index';
const mock = vi.mocked(request);
const id = '9223372036854775806';
const fieldData = JSON.stringify([{ fieldName: 'studentName', fieldLabel: '学生姓名', fieldId: id, visible: '1' }]);
const row = { orderId: id, fieldData, orderData: JSON.stringify({ blockConfigList: [{ blockName: '被保险人', sort: 1, fieldConfig: { studentName: '模拟学生' } }] }) };
// A minimal ZIP with central directory (no production data).
const zip = (names: string[]) => {
  const encoder = new TextEncoder();
  const local = new Uint8Array(30); new DataView(local.buffer).setUint32(0, 0x04034b50, true);
  const entries = names.map((name) => { const text = encoder.encode(name); const bytes = new Uint8Array(46 + text.length); const view = new DataView(bytes.buffer); view.setUint32(0, 0x02014b50, true); view.setUint16(28, text.length, true); bytes.set(text, 46); return bytes; });
  const end = new Uint8Array(22); const view = new DataView(end.buffer); view.setUint32(0, 0x06054b50, true); view.setUint16(8, names.length, true); view.setUint16(10, names.length, true); view.setUint32(12, entries.reduce((n, v) => n + v.length, 0), true); view.setUint32(16, 30, true);
  return new Blob([local, ...entries, end], { type: 'application/octet-stream' });
};
beforeEach(() => mock.mockReset());
describe('order contract', () => {
  it('maps actual fieldName, not label/id, and unions historical fields', () => {
    const old = { ...row, fieldData: JSON.stringify([{ fieldName: 'oldName', fieldLabel: '旧姓名' }]), orderData: JSON.stringify({ blockConfigList: [{ fieldConfig: { oldName: '旧模拟学生' } }] }) };
    expect(orderColumns([row, old]).map((v) => v.name)).toEqual(['studentName', 'oldName']);
    expect(orderFieldValue(row, 'studentName')).toBe('模拟学生');
    expect(orderFieldValue(old, 'studentName')).toBe('—');
    expect(orderFieldValue(old, 'oldName')).toBe('旧模拟学生');
    expect(orderSections(row)[0].fields[0].label).toBe('学生姓名');
  });
  it('reuses list labels when detail fieldData is missing or malformed', () => {
    const columns = orderColumns([row]);
    for (const fieldData of [undefined, '', '{']) {
      const detail = { ...row, fieldData };
      expect(orderSections(detail, columns)[0].fields).toEqual([
        { name: 'studentName', label: '学生姓名', value: '模拟学生' }
      ]);
    }
  });
  it('prefers list labels and supplements detail-only labels without changing values', () => {
    const detail = {
      fieldData: JSON.stringify([
        { fieldName: 'studentName', fieldLabel: '详情姓名' },
        { fieldName: 'grade', fieldLabel: '年级' }
      ]),
      orderData: JSON.stringify({ blockConfigList: [{ blockName: '被保险人', fieldConfig: { studentName: '详情学生', grade: '高一' } }] })
    };
    const columns = [...orderColumns([row]), { name: 'listOnly', label: '其他字段' }];
    expect(orderSections(detail, columns)[0].fields).toEqual([
      { name: 'studentName', label: '学生姓名', value: '详情学生' },
      { name: 'grade', label: '年级', value: '高一' }
    ]);
    expect(orderSections(detail)[0].fields[0].label).toBe('详情姓名');
    expect(columns).toEqual([{ name: 'studentName', label: '学生姓名' }, { name: 'listOnly', label: '其他字段' }]);
  });
  it('does not overwrite detail labels with empty or raw-name list fallbacks', () => {
    for (const label of ['', '   ', 'studentName']) {
      expect(orderSections(row, [{ name: 'studentName', label }])[0].fields[0].label).toBe('学生姓名');
    }
  });
  it('handles malformed JSON and dangerous keys without prototype lookup', () => {
    expect(orderColumns([{ fieldData: '{' }])).toEqual([]);
    const dangerous = { fieldData: '[{"fieldName":"constructor"},{"fieldName":"__proto__"}]', orderData: '{"blockConfigList":[{"fieldConfig":{"__proto__":{"polluted":true},"constructor":"secret","safe":"ok"}}]}' };
    expect(orderColumns([dangerous])).toEqual([]);
    expect(orderSections(dangerous)[0].fields).toEqual([{ name: 'safe', label: 'safe', value: 'ok' }]);
    expect(orderFieldValue(dangerous, 'constructor')).toBe('—');
    expect(safeRecordValue({ payAmount: { sign: 'hidden' } }, 'payAmount')).toBe('—');
    expect(({} as any).polluted).toBeUndefined();
  });
  it('preserves long string IDs, rejects unsafe numbers and missing IDs', () => {
    expect(requireProductId(id)).toBe(id);
    expect(() => requireProductId(Number(id))).toThrow();
    expect(() => requireProductId('')).toThrow();
  });
  it('preserves inclusive date boundaries and amounts in yuan', () => {
    const range = { productId: id, pageNum: 1, pageSize: 10, beginCreateTime: '2026-11-01 00:00:00', endCreateTime: '2026-11-02 23:59:59' };
    expect(orderFilters(range)).toMatchObject({ beginCreateTime: range.beginCreateTime, endCreateTime: range.endCreateTime });
    expect(displayAmount(120.5)).toBe('120.5');
    expect(statusText('SUCCESS', refundStatusDefaults)).toBe('退款成功');
    expect(statusText('2', refundStatusDefaults)).toBe('未知（2）');
  });
  it('empty orders fetch raw product blockConfigList, populated orders do not', async () => {
    mock.mockResolvedValueOnce({ rows: [], total: 0 } as any).mockResolvedValueOnce({ data: { blockConfigList: [{ fieldConfigList: JSON.parse(fieldData) }] } } as any);
    expect((await listOrders({ productId: id, pageNum: 1, pageSize: 10 })).columns[0].name).toBe('studentName');
    expect(mock.mock.calls[1][0].url).toBe(`/product/product/${id}`);
    mock.mockReset(); mock.mockResolvedValueOnce({ rows: [row], total: 1 } as any);
    expect((await listOrders({ productId: id, pageNum: 1, pageSize: 10 })).columns).toHaveLength(1);
    expect(mock).toHaveBeenCalledTimes(1);
  });
  it('statistics accept only productId; detail URL preserves long ID', async () => {
    mock.mockResolvedValue({ data: {} } as any);
    await getOrderStatistics(id); expect(mock.mock.calls[0][0].params).toEqual({ productId: id });
    await getOrder(id); expect(mock.mock.calls[1][0].url).toBe(`/product/product/${id}/orderInfo`);
  });
  it('identifies XLSX, ZIP, XLS and both RAR signatures', async () => {
    expect((await validateExport(zip(['[Content_Types].xml', 'xl/workbook.xml']))).extension).toBe('xlsx');
    expect((await validateExport(zip(['orders.xlsx']))).extension).toBe('zip');
    const xls = new Uint8Array(512); xls.set([0xd0, 0xcf, 0x11, 0xe0, 0xa1, 0xb1, 0x1a, 0xe1]);
    expect((await validateExport(new Blob([xls]))).extension).toBe('xls');
    for (const signature of [[0x52,0x61,0x72,0x21,0x1a,0x07,0x00,0,0], [0x52,0x61,0x72,0x21,0x1a,0x07,0x01,0x00,0]]) expect((await validateExport(new Blob([new Uint8Array(signature)]))).extension).toBe('rar');
  });
  it('rejects JSON, HTML, empty and truncated/fake binary responses', async () => {
    for (const blob of [new Blob(), new Blob(['{"msg":"error"}']), new Blob(['<html>error</html>']), new Blob([new Uint8Array([0x50,0x4b,3,4])]), new Blob(['garbage'], { type: 'application/vnd.ms-excel' })]) await expect(validateExport(blob)).rejects.toThrow();
  });
  it('export excludes pagination and keeps discovered extension', async () => {
    mock.mockResolvedValueOnce(zip(['orders.xlsx']) as any);
    const file = await exportOrders({ productId: id, pageNum: 9, pageSize: 10, payStatus: 'SUCCESS' });
    expect(file.extension).toBe('zip'); expect(mock.mock.calls[0][0].params).not.toHaveProperty('pageNum');
    expect(mock.mock.calls[0][0].responseType).toBe('blob');
  });
});
