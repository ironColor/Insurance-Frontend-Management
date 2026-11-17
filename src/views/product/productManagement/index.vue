<template>
  <div class="app-container product-page">
    <div class="page-title">产品管理</div>
    <el-card shadow="never" class="content-card">
      <el-form :model="query" inline class="filter-form">
        <el-form-item class="status-filter">
          <el-button-group>
            <el-button :type="query.status === '0' ? 'primary' : 'default'" @click="setStatus('0')">启用</el-button>
            <el-button :type="query.status === '1' ? 'primary' : 'default'" @click="setStatus('1')">禁用</el-button>
          </el-button-group>
        </el-form-item>
        <el-form-item prop="productCode"
          ><el-input v-model="query.productCode" placeholder="产品编码" clearable @keyup.enter="search"
        /></el-form-item>
        <el-form-item prop="productName"
          ><el-input v-model="query.productName" placeholder="产品名称" clearable @keyup.enter="search"
        /></el-form-item>
        <el-form-item prop="businessUnit"
          ><el-select v-model="query.businessDeptId" placeholder="选择业务归属" clearable filterable
            ><el-option v-for="x in units" :key="x.deptId" :label="x.deptName" :value="x.deptId" /></el-select
        ></el-form-item>
        <el-form-item><el-button type="primary" @click="search">查询</el-button></el-form-item>
        <el-form-item class="add-action"><el-button type="primary" @click="router.push('/product/config')">新增</el-button></el-form-item>
      </el-form>
      <el-table v-loading="loading" :data="list" class="product-table">
        <el-table-column type="index" label="序号" width="64" align="center" />
        <el-table-column prop="productCode" label="产品编码" min-width="170" show-overflow-tooltip />
        <el-table-column prop="productName" label="产品名称" min-width="290" show-overflow-tooltip />
        <el-table-column prop="businessUnit" label="业务归属" width="150" />
        <el-table-column prop="createTime" label="创建时间" width="170" />
        <el-table-column label="保费统计" width="110" align="right"
          ><template #default="s"
            ><el-link type="primary" @click="showOrders(s.row, 'premium')">{{
              s.row.premium == null ? '-' : s.row.premium.toLocaleString()
            }}</el-link></template
          ></el-table-column
        >
        <el-table-column label="订单数量" width="100" align="center"
          ><template #default="s"
            ><el-link type="primary" @click="showOrders(s.row, 'count')">{{ s.row.orderCount ?? '-' }}</el-link></template
          ></el-table-column
        >
        <el-table-column label="操作" width="285" fixed="right" align="center"
          ><template #default="s"
            ><el-button link type="primary" @click="router.push(`/product/config/${s.row.productId}`)">编辑</el-button
            ><el-button link type="primary" @click="duplicate(s.row)">复制</el-button
            ><el-button link type="primary" @click="showQr(s.row)">二维码</el-button
            ><el-button link type="warning" @click="showOrders(s.row, 'all')">订单</el-button
            ><el-button link :type="s.row.status === '0' ? 'danger' : 'success'" @click="toggle(s.row)">{{
              s.row.status === '0' ? '禁用' : '启用'
            }}</el-button></template
          ></el-table-column
        >
      </el-table>
      <pagination v-show="total > 0" v-model:page="query.pageNum" v-model:limit="query.pageSize" :total="total" @pagination="load" />
    </el-card>
    <el-dialog v-model="qrVisible" title="产品二维码" width="380px" @closed="clearQr"
      ><div v-loading="qrLoading" class="qr-box">
        <img v-if="qrUrl" class="product-qr" :src="qrUrl" alt="产品投保二维码" />
        <el-empty v-else-if="!qrLoading" description="二维码生成失败，请重试" :image-size="100" />
        <h3>{{ qrProduct?.productName }}</h3>
        <p>微信扫码进入产品投保页</p>
      </div></el-dialog
    >
  </div>
</template>
<script setup name="ProductList" lang="ts">
import { changeProductStatus, getProductQrCode, listBusinessDepartments, listProducts } from '@/api/product/productManagement';
import type { ProductQuery, ProductVO } from '@/api/product/productManagement/types';
import type { DeptVO } from '@/api/system/dept/types';
const router = useRouter();
const { proxy } = getCurrentInstance() as ComponentInternalInstance;
const units = ref<DeptVO[]>([]);
const loading = ref(false);
const list = ref<ProductVO[]>([]);
const total = ref(0);
const query = reactive<ProductQuery>({ pageNum: 1, pageSize: 10, productCode: '', productName: '', businessUnit: '', status: '0' });
const qrVisible = ref(false);
const qrProduct = ref<ProductVO>();
const qrLoading = ref(false);
const qrUrl = ref('');
let qrSequence = 0;
let listSequence = 0;
const load = async () => {
  const sequence = ++listSequence;
  loading.value = true;
  try {
    const res = await listProducts({ ...query });
    if (sequence !== listSequence) return;
    list.value = res.rows;
    total.value = res.total;
  } finally {
    if (sequence === listSequence) loading.value = false;
  }
};
const search = () => {
  query.pageNum = 1;
  load();
};
const setStatus = (status: '0' | '1') => {
  if (query.status === status) return;
  query.status = status;
  search();
};
const toggle = async (row: ProductVO) => {
  await changeProductStatus(row.productId, row.status === '0' ? '1' : '0');
  proxy?.$modal.msgSuccess(`已${row.status === '0' ? '禁用' : '启用'}`);
  load();
};
const duplicate = (row: ProductVO) => router.push({ path: '/product/config', query: { copy: String(row.productId) } });
const clearQr = () => {
  qrSequence += 1;
  if (qrUrl.value) URL.revokeObjectURL(qrUrl.value);
  qrUrl.value = '';
};
const showQr = async (row: ProductVO) => {
  clearQr();
  const sequence = qrSequence;
  qrProduct.value = row;
  qrVisible.value = true;
  qrLoading.value = true;
  try {
    const blob = await getProductQrCode(row.productId);
    if (sequence === qrSequence && qrVisible.value) qrUrl.value = URL.createObjectURL(blob);
  } catch (error) {
    if (sequence === qrSequence) proxy?.$modal.msgError(error instanceof Error ? error.message : '二维码生成失败');
  } finally {
    if (sequence === qrSequence) qrLoading.value = false;
  }
};
const showOrders = (row: ProductVO, _type: string) =>
  router.push({ path: '/order/list', query: { productId: String(row.productId) } });
onMounted(async () => {
  await Promise.allSettled([load(), listBusinessDepartments().then((result) => (units.value = result))]);
});
onActivated(() => {
  if (!loading.value) load();
});
onBeforeUnmount(clearQr);
</script>
<style scoped lang="scss">
.product-page {
  background: #f5f7fa;
  min-height: calc(100vh - 84px);
}
.page-title {
  height: 52px;
  display: flex;
  align-items: center;
  padding: 0 20px;
  margin: -20px -20px 16px;
  background: #fff;
  border-bottom: 1px solid #ebeef5;
  font-size: 16px;
  font-weight: 600;
  color: #303133;
}
.content-card {
  border: 0;
}
.content-card :deep(.el-card__body) {
  padding: 16px 20px 12px;
}
.filter-form {
  display: flex;
  align-items: center;
  gap: 12px;
  margin-bottom: 8px;
}
.filter-form :deep(.el-form-item) {
  margin: 0;
}
.filter-form :deep(.el-input) {
  width: 190px;
}
.filter-form :deep(.el-select) {
  width: 190px;
}
.status-filter :deep(.el-button) {
  min-width: 62px;
}
.add-action {
  margin-left: auto !important;
}
.product-table :deep(th.el-table__cell) {
  height: 50px;
  background: #fafafa;
  color: #303133;
  font-weight: 600;
}
.product-table :deep(td.el-table__cell) {
  height: 55px;
}
.product-table :deep(.el-button + .el-button) {
  margin-left: 10px;
}
.content-card :deep(.pagination-container) {
  padding: 16px 0 0 !important;
}
.qr-box {
  text-align: center;
  padding: 8px 20px 24px;
}
.product-qr {
  width: 190px;
  height: 190px;
  margin: auto;
  display: block;
  object-fit: contain;
}
.qr-box p {
  color: #909399;
}
@media (max-width: 900px) {
  .filter-form {
    align-items: stretch;
    flex-wrap: wrap;
  }
  .filter-form :deep(.el-input),
  .filter-form :deep(.el-select) {
    width: 100%;
  }
  .filter-form :deep(.el-form-item) {
    width: calc(50% - 6px);
  }
  .add-action {
    margin-left: 0 !important;
  }
}
</style>
