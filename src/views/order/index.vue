<template>
  <div class="app-container order-page">
    <header class="page-header">
      <div class="page-crumb">
        <el-icon class="page-crumb__icon"><Document /></el-icon>
        <strong>订单管理</strong>
        <span>学平险订单</span>
        <el-icon><ArrowRight /></el-icon>
        <span>订单列表</span>
      </div>
      <el-button :icon="Download" @click="handleExport">导出</el-button>
    </header>

    <main class="order-content">
      <section class="statistics-grid" aria-label="订单统计">
        <button class="stat-card stat-card--total" type="button" @click="selectStatistics('')">
          <span class="stat-card__icon"
            ><el-icon><Document /></el-icon
          ></span>
          <span class="stat-card__content"
            ><strong>{{ statistics.total }}</strong
            ><span>订单总数</span></span
          >
        </button>
        <button class="stat-card stat-card--paid" type="button" @click="selectStatistics('paid')">
          <span class="stat-card__icon"
            ><el-icon><CircleCheck /></el-icon
          ></span>
          <span class="stat-card__content"
            ><strong>{{ statistics.paid }}</strong
            ><span>已支付订单</span></span
          >
        </button>
        <button class="stat-card stat-card--unpaid" type="button" @click="selectStatistics('unpaid')">
          <span class="stat-card__icon"
            ><el-icon><Clock /></el-icon
          ></span>
          <span class="stat-card__content"
            ><strong>{{ statistics.unpaid }}</strong
            ><span>未支付订单</span></span
          >
        </button>
        <button class="stat-card stat-card--premium" type="button" @click="selectStatistics('paid')">
          <span class="stat-card__icon"
            ><el-icon><Money /></el-icon
          ></span>
          <span class="stat-card__content"
            ><strong>{{ formatMoney(statistics.paidPremium) }}<small>元</small></strong
            ><span>已支付保费总额</span></span
          >
        </button>
      </section>

      <el-card shadow="never" class="filter-card">
        <el-form ref="queryFormRef" :model="query" inline class="filter-form" @submit.prevent="handleQuery">
          <el-form-item label="关键词" prop="keyword">
            <el-input v-model="query.keyword" placeholder="学生姓名/订单号/手机号" clearable @keyup.enter="handleQuery" />
          </el-form-item>
          <el-form-item label="支付状态" prop="payStatus">
            <el-select v-model="query.payStatus" placeholder="全部">
              <el-option label="全部" value="" />
              <el-option label="已支付" value="paid" />
              <el-option label="未支付" value="unpaid" />
            </el-select>
          </el-form-item>
          <el-form-item label="创建时间" prop="createDate">
            <el-date-picker v-model="query.createDate" type="date" value-format="YYYY-MM-DD" placeholder="年 / 月 / 日" />
          </el-form-item>
          <el-form-item class="filter-actions">
            <el-button @click="resetQuery">重置</el-button>
            <el-button type="primary" :icon="Search" @click="handleQuery">查询</el-button>
          </el-form-item>
        </el-form>
      </el-card>

      <el-card shadow="never" class="list-card">
        <template #header>
          <div class="list-header">
            <div class="list-heading">
              <strong>订单列表</strong><span>共 {{ total }} 条</span>
            </div>
            <el-button :icon="Refresh" :loading="loading" @click="loadOrders">刷新</el-button>
          </div>
        </template>

        <el-table v-loading="loading" :data="orderList" class="order-table" height="476" row-key="orderId">
          <el-table-column type="index" label="序号" width="62" align="center">
            <template #default="scope">{{ (query.pageNum - 1) * query.pageSize + scope.$index + 1 }}</template>
          </el-table-column>
          <el-table-column prop="productTitle" label="产品标题" min-width="210" show-overflow-tooltip />
          <el-table-column prop="businessUnit" label="业务归属" width="130" show-overflow-tooltip />
          <el-table-column prop="productCode" label="产品编码" width="130" show-overflow-tooltip />
          <el-table-column prop="productName" label="产品名称" width="150" show-overflow-tooltip />
          <el-table-column prop="premium" label="保费" width="76" align="right" />
          <el-table-column prop="orderNo" label="订单编号" min-width="230" show-overflow-tooltip />
          <el-table-column prop="merchantOrderNo" label="商户订单号" min-width="210" show-overflow-tooltip />
          <el-table-column prop="paymentNo" label="支付编号" width="150" show-overflow-tooltip />
          <el-table-column prop="studentName" label="学生姓名" width="100" />
          <el-table-column prop="studentIdCard" label="学生身份证号" width="190" show-overflow-tooltip />
          <el-table-column label="年级" width="78" align="center">
            <template #default="scope"
              ><el-tag size="small" effect="light">{{ scope.row.grade }}</el-tag></template
            >
          </el-table-column>
          <el-table-column prop="className" label="班级" width="74" align="center" />
          <el-table-column prop="parentName" label="家长姓名" width="100" />
          <el-table-column prop="parentIdCard" label="家长身份证号" width="190" show-overflow-tooltip />
          <el-table-column prop="phone" label="联系电话" width="130" />
          <el-table-column prop="totalAmount" label="订单总金额" width="110" align="right" />
          <el-table-column prop="createTime" label="创建时间" width="160" />
          <el-table-column label="是否支付" width="100" align="center">
            <template #default="scope"
              ><el-tag :type="scope.row.payStatus === 'paid' ? 'success' : 'warning'">{{ getStatusText(scope.row.payStatus) }}</el-tag></template
            >
          </el-table-column>
          <el-table-column prop="payTime" label="支付时间" width="160">
            <template #default="scope">{{ scope.row.payTime || '-' }}</template>
          </el-table-column>
          <el-table-column label="操作" width="86" align="center">
            <template #default="scope"><el-button link type="primary" @click="showDetail(scope.row)">详情</el-button></template>
          </el-table-column>
        </el-table>

        <div class="list-footer">
          <span>显示 {{ rangeStart }}-{{ rangeEnd }} 条，共 {{ total }} 条</span>
          <el-pagination
            v-model:current-page="query.pageNum"
            v-model:page-size="query.pageSize"
            :page-sizes="[10, 20, 50]"
            layout="prev, pager, next, sizes"
            :total="total"
            @current-change="loadOrders"
            @size-change="handleSizeChange"
          />
        </div>
      </el-card>
    </main>

    <el-drawer v-model="drawerVisible" title="订单详情" :size="drawerSize" class="order-detail-drawer">
      <div v-if="selectedOrder" class="detail-content">
        <section class="detail-section">
          <h3>订单信息</h3>
          <dl class="detail-grid">
            <div class="detail-grid__wide">
              <dt>订单编号</dt>
              <dd>{{ selectedOrder.orderNo }}</dd>
            </div>
            <div>
              <dt>商户订单号</dt>
              <dd>{{ selectedOrder.merchantOrderNo }}</dd>
            </div>
            <div>
              <dt>支付编号</dt>
              <dd>{{ selectedOrder.paymentNo }}</dd>
            </div>
            <div>
              <dt>支付状态</dt>
              <dd>
                <el-tag type="success">{{ getStatusText(selectedOrder.payStatus) }}</el-tag>
              </dd>
            </div>
            <div>
              <dt>创建时间</dt>
              <dd>{{ selectedOrder.createTime }}</dd>
            </div>
            <div>
              <dt>支付时间</dt>
              <dd>{{ selectedOrder.payTime || '-' }}</dd>
            </div>
          </dl>
        </section>
        <section class="detail-section">
          <h3>产品信息</h3>
          <dl class="detail-grid">
            <div class="detail-grid__wide">
              <dt>产品标题</dt>
              <dd>{{ selectedOrder.productTitle }}</dd>
            </div>
            <div>
              <dt>业务归属</dt>
              <dd>{{ selectedOrder.businessUnit }}</dd>
            </div>
            <div>
              <dt>产品编码</dt>
              <dd>{{ selectedOrder.productCode }}</dd>
            </div>
            <div>
              <dt>产品名称</dt>
              <dd>{{ selectedOrder.productName }}</dd>
            </div>
            <div>
              <dt>保费</dt>
              <dd class="detail-money">{{ formatMoney(selectedOrder.premium) }} 元</dd>
            </div>
            <div>
              <dt>订单总金额</dt>
              <dd class="detail-money">{{ formatMoney(selectedOrder.totalAmount) }} 元</dd>
            </div>
          </dl>
        </section>
        <section class="detail-section">
          <h3>学生信息</h3>
          <dl class="detail-grid">
            <div>
              <dt>学生姓名</dt>
              <dd>{{ selectedOrder.studentName }}</dd>
            </div>
            <div>
              <dt>年级</dt>
              <dd>
                <el-tag size="small">{{ selectedOrder.grade }}</el-tag>
              </dd>
            </div>
            <div>
              <dt>班级</dt>
              <dd>{{ selectedOrder.className }}</dd>
            </div>
            <div class="detail-grid__wide">
              <dt>学生身份证号</dt>
              <dd>{{ selectedOrder.studentIdCard }}</dd>
            </div>
          </dl>
        </section>
        <section class="detail-section">
          <h3>家长信息</h3>
          <dl class="detail-grid">
            <div>
              <dt>家长姓名</dt>
              <dd>{{ selectedOrder.parentName }}</dd>
            </div>
            <div>
              <dt>联系电话</dt>
              <dd>{{ selectedOrder.phone }}</dd>
            </div>
            <div class="detail-grid__wide">
              <dt>家长身份证号</dt>
              <dd>{{ selectedOrder.parentIdCard }}</dd>
            </div>
          </dl>
        </section>
      </div>
    </el-drawer>
  </div>
</template>

<script setup name="OrderList" lang="ts">
import { ArrowRight, CircleCheck, Clock, Document, Download, Money, Refresh, Search } from '@element-plus/icons-vue';
import { useWindowSize } from '@vueuse/core';
import FileSaver from 'file-saver';
import { listAllOrders, listOrders } from '@/api/order';
import type { OrderPayStatus, OrderQuery, OrderStatistics, OrderVO } from '@/api/order/types';

const route = useRoute();
const queryFormRef = ref<ElFormInstance>();
const loading = ref(false);
const drawerVisible = ref(false);
const selectedOrder = ref<OrderVO>();
const orderList = ref<OrderVO[]>([]);
const total = ref(0);
const { width: viewportWidth } = useWindowSize();
const statistics = reactive<OrderStatistics>({ total: 0, paid: 0, unpaid: 0, paidPremium: 0 });
const query = reactive<OrderQuery>({
  pageNum: 1,
  pageSize: 10,
  keyword: '',
  payStatus: route.query.payStatus === 'paid' || route.query.payStatus === 'unpaid' ? route.query.payStatus : '',
  createDate: '',
  productCode: typeof route.query.productCode === 'string' ? route.query.productCode : ''
});

const drawerSize = computed(() => (viewportWidth.value <= 767 ? '100%' : '560px'));
const rangeStart = computed(() => (total.value ? (query.pageNum - 1) * query.pageSize + 1 : 0));
const rangeEnd = computed(() => Math.min(query.pageNum * query.pageSize, total.value));

const formatMoney = (value: number) => value.toLocaleString('zh-CN', { maximumFractionDigits: 2 });
const getStatusText = (status: OrderPayStatus) => (status === 'paid' ? '已支付' : '未支付');

const loadOrders = async () => {
  loading.value = true;
  try {
    const result = await listOrders(query);
    orderList.value = result.rows;
    total.value = result.total;
    Object.assign(statistics, result.statistics);
  } finally {
    loading.value = false;
  }
};

const handleQuery = () => {
  query.pageNum = 1;
  loadOrders();
};

const resetQuery = () => {
  queryFormRef.value?.resetFields();
  query.keyword = '';
  query.payStatus = '';
  query.createDate = '';
  handleQuery();
};

const selectStatistics = (payStatus: '' | OrderPayStatus) => {
  query.payStatus = payStatus;
  handleQuery();
};

const handleSizeChange = () => {
  query.pageNum = 1;
  loadOrders();
};

const showDetail = (row: OrderVO) => {
  selectedOrder.value = row;
  drawerVisible.value = true;
};

const escapeCsv = (value: string | number) => `"${String(value).replaceAll('"', '""')}"`;
const handleExport = async () => {
  const rows = await listAllOrders(query);
  const headers = [
    '序号',
    '产品标题',
    '业务归属',
    '产品编码',
    '产品名称',
    '保费',
    '订单编号',
    '商户订单号',
    '支付编号',
    '学生姓名',
    '学生身份证号',
    '年级',
    '班级',
    '家长姓名',
    '家长身份证号',
    '联系电话',
    '订单总金额',
    '创建时间',
    '是否支付',
    '支付时间'
  ];
  const body = rows.map((row, index) => [
    index + 1,
    row.productTitle,
    row.businessUnit,
    row.productCode,
    row.productName,
    row.premium,
    row.orderNo,
    row.merchantOrderNo,
    row.paymentNo,
    row.studentName,
    row.studentIdCard,
    row.grade,
    row.className,
    row.parentName,
    row.parentIdCard,
    row.phone,
    row.totalAmount,
    row.createTime,
    getStatusText(row.payStatus),
    row.payTime
  ]);
  const csv = [headers, ...body].map((line) => line.map(escapeCsv).join(',')).join('\n');
  FileSaver.saveAs(new Blob([`\ufeff${csv}`], { type: 'text/csv;charset=utf-8' }), `订单列表_${new Date().toISOString().slice(0, 10)}.csv`);
};

onMounted(loadOrders);
</script>

<style scoped lang="scss">
.order-page {
  min-height: calc(100vh - 84px);
  padding: 0;
  background: #f4f7fb;
  color: #182230;
}

.page-header {
  min-height: 54px;
  padding: 10px 24px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 16px;
  background: #fff;
  border-bottom: 1px solid #e8edf4;
}

.page-crumb {
  display: flex;
  align-items: center;
  gap: 10px;
  color: #8a98ad;
  font-size: 13px;

  strong {
    color: #1f2937;
    font-size: 15px;
  }

  &__icon {
    color: #3276f5;
    font-size: 19px;
  }
}

.order-content {
  padding: 16px 24px 28px;
}

.statistics-grid {
  display: grid;
  grid-template-columns: repeat(4, minmax(0, 1fr));
  gap: 16px;
  margin-bottom: 16px;
}

.stat-card {
  min-width: 0;
  min-height: 82px;
  padding: 16px 18px;
  display: flex;
  align-items: center;
  gap: 14px;
  appearance: none;
  text-align: left;
  font: inherit;
  background: #fff;
  border: 1px solid #e5ebf3;
  border-radius: 8px;
  cursor: pointer;
  transition:
    transform 0.18s ease,
    box-shadow 0.18s ease,
    border-color 0.18s ease;

  &:hover {
    transform: translateY(-2px);
    border-color: #c8d7ef;
    box-shadow: 0 8px 18px rgb(38 73 120 / 9%);
  }

  &__icon {
    width: 44px;
    height: 44px;
    flex: 0 0 44px;
    display: grid;
    place-items: center;
    border-radius: 10px;
    font-size: 24px;
  }

  &__content {
    min-width: 0;
    display: flex;
    flex-direction: column;
    gap: 3px;

    strong {
      color: #172033;
      font-size: 24px;
      line-height: 1.1;
    }

    small {
      margin-left: 3px;
      color: #8391a7;
      font-size: 12px;
      font-weight: 400;
    }

    span {
      color: #91a0b5;
      font-size: 13px;
    }
  }

  &--total .stat-card__icon {
    color: #3276f5;
    background: #edf4ff;
  }
  &--paid .stat-card__icon {
    color: #1fbd7b;
    background: #eafbf4;
  }
  &--unpaid .stat-card__icon {
    color: #f4a62a;
    background: #fff8e8;
  }
  &--premium .stat-card__icon {
    color: #8b5cf6;
    background: #f4efff;
  }
}

.filter-card,
.list-card {
  border-color: #e5ebf3;
  border-radius: 8px;
}

.filter-card {
  margin-bottom: 16px;

  :deep(.el-card__body) {
    padding: 16px 18px;
  }
}

.filter-form {
  display: flex;
  align-items: center;
  gap: 12px;

  :deep(.el-form-item) {
    margin: 0;
  }
  :deep(.el-form-item__label) {
    width: auto;
    white-space: nowrap;
  }
  :deep(.el-input) {
    width: 210px;
  }
  :deep(.el-select) {
    width: 150px;
  }
  :deep(.el-date-editor) {
    width: 180px;
  }
}

.filter-actions {
  margin-left: auto !important;
}

.list-card {
  :deep(.el-card__header) {
    padding: 12px 16px;
  }
  :deep(.el-card__body) {
    padding: 0;
  }
}

.list-header,
.list-heading,
.list-footer {
  display: flex;
  align-items: center;
}

.list-header {
  justify-content: space-between;
}

.list-heading {
  gap: 10px;

  strong {
    font-size: 15px;
  }
  span {
    color: #8a98ad;
    font-size: 13px;
  }
}

.order-table {
  width: 100%;
  border: 0;
  border-radius: 0;
  box-shadow: none;

  :deep(th.el-table__cell) {
    height: 42px;
    padding: 0;
    background: #f7f9fc;
    color: #617089;
    font-size: 12px;
    font-weight: 600;
  }

  :deep(td.el-table__cell) {
    height: 43px;
    padding: 0;
    color: #273448;
    font-size: 12px;
  }

  :deep(.el-table__inner-wrapper::before) {
    display: none;
  }
  :deep(.el-tag) {
    border: 0;
  }
}

.list-footer {
  min-height: 56px;
  padding: 10px 16px;
  justify-content: space-between;
  gap: 16px;
  border-top: 1px solid #edf0f5;
  color: #8795aa;
  font-size: 12px;
}

.detail-content {
  padding: 0 22px 28px;
}

.detail-section {
  padding: 18px 0 20px;
  border-bottom: 1px solid #edf0f5;

  &:last-child {
    border-bottom: 0;
  }

  h3 {
    margin: 0 0 18px;
    color: #1e293b;
    font-size: 15px;
    font-weight: 600;
  }
}

.detail-grid {
  margin: 0;
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 18px 24px;

  div {
    min-width: 0;
  }
  &__wide {
    grid-column: 1 / -1;
  }

  dt {
    margin-bottom: 7px;
    color: #96a2b4;
    font-size: 12px;
  }

  dd {
    margin: 0;
    color: #263348;
    font-size: 13px;
    line-height: 1.55;
    overflow-wrap: anywhere;
  }
}

.detail-money {
  color: #3276f5 !important;
  font-weight: 600;
}

:global(.order-detail-drawer .el-drawer__header) {
  min-height: 58px;
  padding: 0 22px;
  color: #1e293b;
  font-size: 16px;
  font-weight: 600;
}

:global(.order-detail-drawer .el-drawer__body) {
  padding: 0;
}

@media (max-width: 1100px) {
  .statistics-grid {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }
  .filter-form {
    align-items: flex-start;
    flex-wrap: wrap;
  }
  .filter-actions {
    margin-left: 0 !important;
  }
}

@media (max-width: 767px) {
  .page-header {
    padding: 10px 14px;
  }
  .page-crumb span:first-of-type {
    display: none;
  }
  .order-content {
    padding: 12px;
  }
  .statistics-grid {
    grid-template-columns: 1fr;
    gap: 10px;
  }
  .stat-card {
    min-height: 72px;
  }
  .filter-form {
    display: grid;
    grid-template-columns: 1fr;
  }
  .filter-form :deep(.el-form-item),
  .filter-form :deep(.el-input),
  .filter-form :deep(.el-select),
  .filter-form :deep(.el-date-editor) {
    width: 100%;
  }
  .filter-actions {
    justify-content: flex-end;
  }
  .list-footer {
    align-items: flex-start;
    flex-direction: column;
  }
  .list-footer :deep(.el-pagination) {
    max-width: 100%;
    flex-wrap: wrap;
    justify-content: flex-start;
  }
  .detail-grid {
    grid-template-columns: 1fr;
  }
  .detail-grid__wide {
    grid-column: auto;
  }
}
</style>
