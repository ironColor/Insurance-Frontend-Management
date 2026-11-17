<template>
  <div class="app-container order-page">
    <h2>订单管理</h2>
    <el-alert v-if="!productId" title="请从产品管理的订单入口选择产品；接口不支持全局订单列表。" type="info" :closable="false" />
    <el-button v-if="!productId" @click="router.push('/product/productManagement')">前往产品管理</el-button>
    <template v-else>
      <p>产品 ID：{{ productId }} · 统计为该产品全部订单，不随列表筛选变化。</p>
      <el-alert title="接口文档未标注金额单位，以下金额均为接口原值，未进行元/分换算。" type="info" :closable="false" />
      <section class="statistics">
        <el-card v-for="item in statisticFields" :key="item.key" shadow="never">
          <div>{{ item.label }}</div><strong>{{ statistics[item.key] ?? '未知' }}</strong>
        </el-card>
      </section>
      <el-form inline @submit.prevent="search">
        <el-form-item label="订单编号"><el-input v-model="query.orderNo" clearable placeholder="订单编号" /></el-form-item>
        <el-form-item label="支付状态">
          <el-select v-model="query.payStatus" clearable placeholder="全部" style="width: 160px">
            <el-option v-for="item in dictionaries.payStatus" :key="item.value" :label="item.label" :value="item.value" />
          </el-select>
        </el-form-item>
        <el-form-item label="创建时间">
          <el-date-picker v-model="dateRange" type="datetimerange" value-format="YYYY-MM-DD HH:mm:ss" start-placeholder="开始时间" end-placeholder="结束时间" />
        </el-form-item>
        <el-form-item>
          <el-button type="primary" :loading="loading" @click="search">查询</el-button>
          <el-button @click="reset">重置</el-button>
          <el-button v-hasPermi="['product:product:exportOrder']" :loading="exporting" @click="download">导出</el-button>
        </el-form-item>
      </el-form>
      <el-alert v-if="error" :title="error" type="error" :closable="false" />
      <el-table v-loading="loading" :data="orders" row-key="orderId">
        <el-table-column prop="orderNo" label="订单编号" min-width="220" />
        <el-table-column prop="businessDeptName" label="业务归属" min-width="130" />
        <el-table-column prop="productCode" label="产品编码" min-width="130" />
        <el-table-column prop="productName" label="产品名称" min-width="150" />
        <el-table-column label="总金额（原值）" width="150"><template #default="{ row }">{{ displayAmount(row.totalAmount) }}</template></el-table-column>
        <el-table-column label="实付（原值）" width="130"><template #default="{ row }">{{ displayAmount(row.payAmount) }}</template></el-table-column>
        <el-table-column label="支付状态" width="130"><template #default="{ row }">{{ statusText(row.payStatus, dictionaries.payStatus) }}</template></el-table-column>
        <el-table-column prop="createTime" label="创建时间" width="180" />
        <el-table-column prop="payTime" label="支付时间" width="180" />
        <el-table-column label="操作" fixed="right" width="80"><template #default="{ row }"><el-button link type="primary" @click="showDetail(row)">详情</el-button></template></el-table-column>
      </el-table>
      <el-pagination v-model:current-page="query.pageNum" v-model:page-size="query.pageSize" :total="total" :page-sizes="[10,20,50]" layout="total, sizes, prev, pager, next" @current-change="load" @size-change="search" />
    </template>
    <el-drawer v-model="drawerVisible" title="订单详情" size="min(680px, 100%)" @closed="detailSequence++">
      <div v-loading="detailLoading">
        <el-alert v-if="detailError" :title="detailError" type="error" :closable="false" />
        <template v-if="selected">
          <el-descriptions :column="1" border>
            <el-descriptions-item v-for="item in detailFields" :key="item.key" :label="item.label">{{ selected[item.key] ?? '未知' }}</el-descriptions-item>
            <el-descriptions-item v-for="(options, key) in dictionaries" :key="key" :label="statusLabels[key]">{{ statusText(selected[key], options) }}</el-descriptions-item>
          </el-descriptions>
          <h3>投保信息</h3><p>按接口原始字段展示；文档未定义动态 JSON 内部结构。</p>
          <pre>{{ displayJson(selected.orderData) }}</pre>
          <h3>投保字段配置</h3><pre>{{ displayJson(selected.fieldData) }}</pre>
          <h3>支付记录</h3>
          <el-descriptions :column="1" border>
            <el-descriptions-item v-for="item in paymentFields" :key="item.key" :label="item.label">{{ selected.pay?.[item.key] ?? '未知' }}</el-descriptions-item>
          </el-descriptions>
          <h3>退款记录</h3>
          <el-descriptions v-for="(refund, index) in selected.refundList || []" :key="index" :column="1" border>
            <el-descriptions-item v-for="item in refundFields" :key="item.key" :label="item.label">{{ refund[item.key] ?? '未知' }}</el-descriptions-item>
            <el-descriptions-item label="退款状态">{{ statusText(refund.refundStatus, refundStatuses) }}</el-descriptions-item>
          </el-descriptions>
        </template>
      </div>
    </el-drawer>
  </div>
</template>

<script setup name="OrderList" lang="ts">
import { computed, reactive, ref, watch, onMounted } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { ElMessage } from 'element-plus';
import FileSaver from 'file-saver';
import { listOrders, getOrderStatistics, getOrder, exportOrders } from '@/api/order';
import { displayJson, displayAmount, statusText } from '@/api/order/contract';
import { getDicts } from '@/api/system/dict/data';
import type { OrderQuery, OrderStatistics, OrderVO } from '@/api/order/types';
const route = useRoute();
const router = useRouter();
const productId = computed(() => typeof route.query.productId === 'string' && /^[1-9]\d*$/.test(route.query.productId) ? route.query.productId : '');
const query = reactive<OrderQuery>({ productId: '', pageNum: 1, pageSize: 10, orderNo: '', payStatus: '' });
const dateRange = ref<string[]>([]);
const orders = ref<OrderVO[]>([]);
const total = ref(0);
const statistics = ref<OrderStatistics>({});
const loading = ref(false);
const exporting = ref(false);
const error = ref('');
const drawerVisible = ref(false);
const detailLoading = ref(false);
const detailError = ref('');
const selected = ref<OrderVO>();
let sequence = 0;
let detailSequence = 0;
const dictionaries = reactive<Record<'payStatus' | 'orderStatus' | 'policyStatus', {label: string; value: string}[]>>({ payStatus: [], orderStatus: [], policyStatus: [] });
const statusLabels = { payStatus: '支付状态', orderStatus: '订单状态', policyStatus: '保单状态' };
// Never expose gateway requests, responses or callback payloads.
const paymentFields = [{key: 'paymentNo', label: '支付编号'}, {key: 'payChannelName', label: '渠道名称'}, {key: 'transactionId', label: '第三方交易号'}, {key: 'payAmount', label: '金额（原值）'}, {key: 'payTime', label: '支付时间'}, {key: 'errorMsg', label: '错误说明'}];
const refundFields = [{key: 'refundNo', label: '退款编号'}, {key: 'transactionId', label: '第三方退款交易号'}, {key: 'refundAmount', label: '退款金额（原值）'}, {key: 'refundTime', label: '退款时间'}, {key: 'errorMsg', label: '错误说明'}];
const refundStatuses = ['申请中', '退款中', '退款成功', '退款失败', '已拒绝'].map((label, index) => ({label, value: String(index)}));
const statisticFields: {key: keyof OrderStatistics; label: string}[] = [
  { key: 'totalNum', label: '订单总数' }, { key: 'payNum', label: '已支付' }, { key: 'unPayNum', label: '待支付' },
  { key: 'refundNum', label: '已退款' }, { key: 'payAmount', label: '已支付金额（原值）' },
  { key: 'refundAmount', label: '已退款金额（原值）' }, { key: 'unPayAmount', label: '待支付金额（原值）' }
];
const detailFields: {key: keyof OrderVO; label: string}[] = [
  {key: 'orderId', label: '订单ID'}, {key: 'orderNo', label: '订单编号'}, {key: 'productTitle', label: '产品标题'},
  {key: 'productName', label: '产品名称'}, {key: 'businessDeptName', label: '业务归属'},
  {key: 'totalAmount', label: '总金额（原值）'}, {key: 'payAmount', label: '实付金额（原值）'}, {key: 'discountAmount', label: '优惠金额（原值）'},
  {key: 'policyNo', label: '保单号'}, {key: 'policyEffectiveDate', label: '保单生效日期'}, {key: 'policyExpiryDate', label: '保单到期日期'},
  {key: 'createTime', label: '创建时间'}, {key: 'payTime', label: '支付时间'}, {key: 'expireTime', label: '过期时间'}, {key: 'remark', label: '备注'}
];
const snapshot = (): OrderQuery => ({ ...query, productId: productId.value, beginCreateTime: dateRange.value?.[0], endCreateTime: dateRange.value?.[1] });
const message = (e: unknown) => e instanceof Error ? e.message : '请求失败，请重试';
const load = async () => {
  const current = ++sequence;
  orders.value = []; total.value = 0; statistics.value = {}; error.value = '';
  if (!productId.value) { loading.value = false; return; }
  loading.value = true;
  const params = snapshot();
  const [list, stats] = await Promise.allSettled([listOrders(params), getOrderStatistics(params.productId)]);
  if (current !== sequence) return;
  if (list.status === 'fulfilled') { orders.value = list.value.rows; total.value = list.value.total; }
  else error.value = message(list.reason);
  if (stats.status === 'fulfilled') statistics.value = stats.value;
  else error.value = [error.value, '统计加载失败'].filter(Boolean).join('；');
  loading.value = false;
};
const search = () => { query.pageNum = 1; void load(); };
const reset = () => { query.orderNo = ''; query.payStatus = ''; dateRange.value = []; search(); };
const showDetail = async (row: OrderVO) => {
  const current = ++detailSequence;
  selected.value = undefined; detailError.value = ''; drawerVisible.value = true; detailLoading.value = true;
  try { const result = await getOrder(row.orderId); if (current === detailSequence) selected.value = result; }
  catch (e) { if (current === detailSequence) detailError.value = message(e); }
  finally { if (current === detailSequence) detailLoading.value = false; }
};
const download = async () => {
  if (exporting.value || !productId.value) return;
  exporting.value = true;
  try { FileSaver.saveAs(await exportOrders(snapshot()), `订单_${productId.value}.xlsx`); }
  catch (e) { ElMessage.error(message(e)); }
  finally { exporting.value = false; }
};
watch(productId, () => { detailSequence++; drawerVisible.value = false; selected.value = undefined; reset(); }, { immediate: true });
onMounted(async () => {
  await Promise.allSettled((Object.keys(dictionaries) as (keyof typeof dictionaries)[]).map(async (key) => {
    const names = {payStatus: 'pay_status', orderStatus: 'pay_order_status', policyStatus: 'pay_policy_status'};
    const result = await getDicts(names[key]);
    dictionaries[key] = (result.data || []).map((item) => ({ label: item.dictLabel, value: String(item.dictValue) }));
  }));
});
</script>
<style scoped>
.statistics { display: grid; grid-template-columns: repeat(auto-fit, minmax(150px, 1fr)); gap: 12px; margin: 16px 0; }
.statistics strong { font-size: 24px; }
pre { white-space: pre-wrap; overflow-wrap: anywhere; background: #f5f7fa; padding: 12px; }
.el-pagination { margin-top: 20px; flex-wrap: wrap; }
</style>
