<template>
  <div class="config-page">
    <div class="config-shell">
      <header class="config-header">
        <div class="config-title">产品配置 <el-tag v-if="isCopy" type="warning" effect="plain">复制新增</el-tag></div>
        <div class="config-subtitle">配置共用基本信息、各产品方案及前端展示内容</div>
      </header>

      <nav class="config-nav">
        <button v-for="item in tabs" :key="item.name" :class="{ active: activeTab === item.name }" @click="activeTab = item.name">
          {{ item.label }}
        </button>
      </nav>

      <main class="config-body">
        <section v-show="activeTab === 'plan'" class="plan-content">
          <el-alert
            v-if="hasOrders"
            class="order-lock-tip"
            title="该产品已有订单，仅顶部横幅副标题、保障责任和方案详情可修改"
            type="warning"
            :closable="false"
            show-icon
          />
          <div class="basic-card">
            <div class="section-title blue-title">基本信息</div>
            <el-form :model="form" label-position="top" class="basic-grid">
              <el-form-item label="产品名称" required
                ><el-input v-model="form.name" :disabled="hasOrders" placeholder="请输入产品名称"
              /></el-form-item>
              <el-form-item label="产品编码" required
                ><el-input v-model="form.code" :disabled="hasOrders" placeholder="请输入产品编码"
              /></el-form-item>
              <el-form-item label="业务归属" required
                ><el-select v-model="form.businessUnit" :disabled="hasOrders" placeholder="请选择业务归属"
                  ><el-option v-for="x in units" :key="x" :label="x" :value="x" /></el-select
              ></el-form-item>
            </el-form>
          </div>

          <div class="block-title"><b>页面展示配置</b><span>方案详情页顶部</span></div>
          <el-form label-position="top"
            ><el-form-item label="顶部横幅副标题"
              ><el-input v-model="form.subtitle" type="textarea" :rows="2" placeholder="请输入顶部横幅副标题" /></el-form-item
          ></el-form>

          <div class="horizontal-tabs product-tabs">
            <button v-for="(product, index) in form.products" :key="index" :class="{ active: productIndex === index }" @click="selectProduct(index)">
              <span class="number-dot">{{ index + 1 }}</span
              >{{ product.name || `产品${index + 1}` }}<el-icon v-if="!hasOrders" @click.stop="removeProduct(index)"><Close /></el-icon>
            </button>
            <button v-if="!hasOrders" class="add-tab" @click="addProduct">＋ 添加产品</button>
          </div>

          <template v-if="currentProduct">
            <div class="block-title"><b>产品信息</b><span>该产品独立配置</span></div>
            <el-form label-position="top" class="product-info-grid">
              <el-form-item label="产品名称" required
                ><el-input v-model="currentProduct.name" :disabled="hasOrders" placeholder="请输入产品名称"
              /></el-form-item>
              <el-form-item label="险种类别" required
                ><el-select v-model="currentProduct.type" :disabled="hasOrders" placeholder="请选择险种"
                  ><el-option label="主险" value="主险" /><el-option label="附加险" value="附加险" /></el-select
              ></el-form-item>
              <el-form-item label="承保公司" required>
                <el-select v-model="currentProduct.companyId" filterable :disabled="hasOrders" :loading="companyLoading" placeholder="请选择承保公司">
                  <el-option v-for="company in companyOptions" :key="company.companyId" :label="company.companyName" :value="company.companyId" />
                </el-select>
              </el-form-item>
              <el-form-item label="是否必选"><el-checkbox v-model="currentProduct.required" :disabled="hasOrders">必选</el-checkbox></el-form-item>
            </el-form>

            <div class="horizontal-tabs scheme-tabs">
              <button v-for="(plan, index) in currentProduct.plans" :key="index" :class="{ active: planIndex === index }" @click="planIndex = index">
                {{ plan.name || `方案${index + 1}` }}<el-icon v-if="!hasOrders" @click.stop="removePlan(index)"><Close /></el-icon>
              </button>
              <button v-if="!hasOrders" class="add-tab dashed" @click="addPlan">＋ 添加方案</button>
            </div>

            <template v-if="currentPlan">
              <div class="scheme-card">
                <label>方案名称</label><el-input v-model="currentPlan.name" :disabled="hasOrders" placeholder="请输入方案名称" /> <label>保费</label
                ><el-input-number v-model="currentPlan.premium" :disabled="hasOrders" :min="0" :controls="false" />
                <span class="unit">元/年</span>
              </div>

              <div class="table-title">
                <div><b>保障责任</b><span>该方案的保障项目</span></div>
                <el-button link type="primary" @click="currentPlan.protections.push({ name: '', amount: '' })">＋ 添加保障项</el-button>
              </div>
              <el-table :data="currentPlan.protections" border empty-text="暂无保障责任，请点击添加保障项">
                <el-table-column type="index" label="序号" width="68" align="center" />
                <el-table-column label="保障项目"
                  ><template #default="s"><el-input v-model="s.row.name" placeholder="请输入保障项目" /></template
                ></el-table-column>
                <el-table-column label="保障金额" width="240"
                  ><template #default="s"><el-input v-model="s.row.amount" placeholder="请输入金额" /></template
                ></el-table-column>
                <el-table-column label="操作" width="86" align="center"
                  ><template #default="s"
                    ><el-button link type="danger" @click="currentPlan.protections.splice(s.$index, 1)">删除</el-button></template
                  ></el-table-column
                >
              </el-table>
              <div class="block-title detail-title"><b>方案详情</b><span>支持富文本、图片和视频</span></div>
              <Editor v-model="currentPlan.description" :height="220" :min-height="220" video-upload :video-file-size="100" />
            </template>
            <el-empty v-else :image-size="72" :description="hasOrders ? '暂无方案' : '暂无方案，请点击添加方案'" />
          </template>
          <el-empty v-else :image-size="88" :description="hasOrders ? '暂无产品' : '暂无产品，请点击添加产品'" />
        </section>

        <section v-show="activeTab === 'intro'" class="normal-section">
          <div class="section-title">介绍页配置</div>
          <div class="tip">配置销售端产品介绍页展示的富文本、图片及视频内容</div>
          <Editor v-model="form.introduction" :min-height="430" />
        </section>

        <section v-show="activeTab === 'fields'" class="normal-section">
          <el-alert v-if="hasOrders" class="order-lock-tip" title="该产品已有订单，投保信息配置不可修改" type="warning" :closable="false" show-icon />
          <div class="tip blue">字段分类可修改名称，字段类型支持文本、日期、单选、多选、身份证、手机。单选和多选类型可配置选项值。</div>
          <div v-for="(group, gi) in form.fieldGroups" :key="gi" class="field-group">
            <div class="group-head">
              <div>
                <span class="group-number">{{ gi + 1 }}</span
                ><el-input v-model="group.name" :disabled="hasOrders" />
              </div>
              <div v-if="!hasOrders">
                <el-button link :disabled="gi === 0" @click="moveGroup(gi, -1)">▲ 上移</el-button
                ><el-button link :disabled="gi === form.fieldGroups.length - 1" @click="moveGroup(gi, 1)">▼ 下移</el-button
                ><el-button link type="danger" @click="form.fieldGroups.splice(gi, 1)">删除分类</el-button>
              </div>
            </div>
            <el-table :data="group.fields" border>
              <el-table-column type="index" label="序号" width="62" align="center" />
              <el-table-column label="字段名称"
                ><template #default="s"><el-input v-model="s.row.name" :disabled="hasOrders" /></template
              ></el-table-column>
              <el-table-column label="字段类型" width="150"
                ><template #default="s"
                  ><el-select v-model="s.row.type" :disabled="hasOrders"
                    ><el-option v-for="t in fieldTypes" :key="t" :label="t" :value="t" /></el-select></template
              ></el-table-column>
              <el-table-column label="占位提示"
                ><template #default="s"><el-input v-model="s.row.placeholder" :disabled="hasOrders" /></template
              ></el-table-column>
              <el-table-column label="必填" width="85" align="center"
                ><template #default="s"><el-checkbox v-model="s.row.required" :disabled="hasOrders" /></template
              ></el-table-column>
              <el-table-column label="排序" width="120" align="center"
                ><template #default="s"><el-input-number :model-value="s.$index + 1" disabled controls-position="right" /></template
              ></el-table-column>
              <el-table-column v-if="!hasOrders" label="操作" width="80" align="center"
                ><template #default="s"
                  ><el-button link type="danger" @click="group.fields.splice(s.$index, 1)">删除</el-button></template
                ></el-table-column
              >
            </el-table>
            <el-button
              v-if="!hasOrders"
              class="add-field"
              icon="Plus"
              @click="group.fields.push({ name: '', type: '文本', placeholder: '', required: false })"
              >添加字段</el-button
            >
          </div>
          <el-button v-if="!hasOrders" type="primary" plain icon="Plus" @click="form.fieldGroups.push({ name: '新分类', fields: [] })"
            >添加字段分类</el-button
          >
        </section>

        <section v-show="activeTab === 'read'" class="normal-section">
          <div class="section-head">
            <div class="section-title">强制阅读配置</div>
            <el-button type="primary" plain icon="Plus" @click="form.forceRead.push({ title: '', content: '', seconds: 5, enabled: true })"
              >添加内容</el-button
            >
          </div>
          <el-card v-for="(x, i) in form.forceRead" :key="i" shadow="never" class="read-card"
            ><el-form label-width="110px"
              ><el-form-item label="阅读标题"><el-input v-model="x.title" /></el-form-item
              ><el-form-item label="阅读内容"><el-input v-model="x.content" type="textarea" :rows="5" /></el-form-item
              ><el-form-item label="强制时长"><el-input-number v-model="x.seconds" :min="0" /><span class="unit">秒</span></el-form-item
              ><el-form-item label="启用状态"><el-switch v-model="x.enabled" /></el-form-item></el-form
            ><el-button class="delete-card" link type="danger" @click="form.forceRead.splice(i, 1)">删除</el-button></el-card
          >
        </section>

        <section v-show="activeTab === 'agreement'" class="normal-section">
          <div class="section-head">
            <div class="section-title">协议文件配置</div>
            <el-button type="primary" plain icon="Plus" @click="form.agreements.push({ name: '', url: '', required: true })">添加协议</el-button>
          </div>
          <el-table :data="form.agreements" border
            ><el-table-column type="index" label="序号" width="68" /><el-table-column label="协议名称"
              ><template #default="s"><el-input v-model="s.row.name" placeholder="请输入协议名称" /></template></el-table-column
            ><el-table-column label="文件地址"
              ><template #default="s"><el-input v-model="s.row.url" placeholder="请上传 PDF 协议文件" /></template></el-table-column
            ><el-table-column label="必读" width="90" align="center"
              ><template #default="s"><el-checkbox v-model="s.row.required" /></template></el-table-column
            ><el-table-column label="操作" width="86"
              ><template #default="s"
                ><el-button link type="danger" @click="form.agreements.splice(s.$index, 1)">删除</el-button></template
              ></el-table-column
            ></el-table
          >
        </section>
      </main>

      <footer class="config-footer">
        <el-button @click="router.push('/product/list')">取消</el-button>
        <el-button @click="save(true)">临时保存</el-button>
        <el-button type="primary" :loading="saving" @click="save(false)">保存全部配置</el-button>
      </footer>
    </div>
  </div>
</template>

<script setup name="ProductConfig" lang="ts">
import { Close } from '@element-plus/icons-vue';
import { listInsuranceCompany } from '@/api/product/insuranceCompany';
import type { InsuranceCompanyVO } from '@/api/product/insuranceCompany/types';
import { getProductConfig, saveProductConfig } from '@/api/product/productManagement';
import type { ProductConfig } from '@/api/product/productManagement/types';

const route = useRoute();
const router = useRouter();
const { proxy } = getCurrentInstance() as ComponentInternalInstance;
const tabs = [
  { name: 'plan', label: '产品方案配置' },
  { name: 'intro', label: '介绍页配置' },
  { name: 'fields', label: '投保信息配置' },
  { name: 'read', label: '强制阅读' },
  { name: 'agreement', label: '协议文件配置' }
];
const units = ['贵州本部', '重庆本部', '保定本部', '四川本部'];
const fieldTypes = ['文本', '日期', '单选', '多选', '身份证', '手机'];
const activeTab = ref('plan');
const productIndex = ref(0);
const planIndex = ref(0);
const saving = ref(false);
const companyLoading = ref(false);
const companyOptions = ref<InsuranceCompanyVO[]>([]);
const isCopy = computed(() => Boolean(route.query.copy));
const form = reactive<ProductConfig>({
  hasOrders: false,
  name: '',
  code: '',
  businessUnit: '',
  subtitle: '',
  products: [],
  introduction: '',
  fieldGroups: [],
  forceRead: [],
  agreements: []
});
const hasOrders = computed(() => form.hasOrders && !isCopy.value);
const currentProduct = computed(() => form.products[productIndex.value]);
const currentPlan = computed(() => currentProduct.value?.plans[planIndex.value]);
const selectProduct = (index: number) => {
  productIndex.value = index;
  planIndex.value = 0;
};
const addProduct = () => {
  if (hasOrders.value) return;
  form.products.push({ name: `新产品${form.products.length + 1}`, type: '', companyId: undefined, required: false, plans: [] });
  selectProduct(form.products.length - 1);
};
const removeProduct = (index: number) => {
  if (hasOrders.value) return;
  form.products.splice(index, 1);
  productIndex.value = Math.max(0, Math.min(productIndex.value, form.products.length - 1));
  planIndex.value = 0;
};
const addPlan = () => {
  if (hasOrders.value || !currentProduct.value) return;
  currentProduct.value.plans.push({ name: `方案${currentProduct.value.plans.length + 1}`, premium: 0, description: '', protections: [] });
  planIndex.value = currentProduct.value.plans.length - 1;
};
const removePlan = (index: number) => {
  if (hasOrders.value || !currentProduct.value) return;
  currentProduct.value.plans.splice(index, 1);
  planIndex.value = Math.max(0, Math.min(planIndex.value, currentProduct.value.plans.length - 1));
};
const moveGroup = (index: number, step: number) => {
  if (hasOrders.value) return;
  const target = index + step;
  if (target < 0 || target >= form.fieldGroups.length) return;
  [form.fieldGroups[index], form.fieldGroups[target]] = [form.fieldGroups[target], form.fieldGroups[index]];
};
const validatePlanConfig = () => {
  if (!form.name || !form.code || !form.businessUnit) return '请完整填写产品名称、产品编码和业务归属';
  if (!form.products.length) return '请至少添加一个产品';
  if (!form.products.some((product) => product.required)) return '请至少将一个产品设置为必选';
  const invalidProductIndex = form.products.findIndex((product) => !product.name || !product.type || !product.companyId);
  if (invalidProductIndex >= 0) {
    selectProduct(invalidProductIndex);
    return `请完整填写第 ${invalidProductIndex + 1} 个产品的信息`;
  }
  const emptyPlanProductIndex = form.products.findIndex((product) => !product.plans.length);
  if (emptyPlanProductIndex >= 0) {
    selectProduct(emptyPlanProductIndex);
    return `请为第 ${emptyPlanProductIndex + 1} 个产品至少添加一个方案`;
  }
  for (let productOffset = 0; productOffset < form.products.length; productOffset += 1) {
    const invalidPlanIndex = form.products[productOffset].plans.findIndex((plan) => !plan.name);
    if (invalidPlanIndex >= 0) {
      selectProduct(productOffset);
      planIndex.value = invalidPlanIndex;
      return `请填写第 ${productOffset + 1} 个产品的方案名称`;
    }
  }
  return '';
};
const save = async (draft: boolean) => {
  const message = hasOrders.value
    ? ''
    : draft
      ? !form.name || !form.code || !form.businessUnit
        ? '请完整填写产品名称、产品编码和业务归属'
        : ''
      : validatePlanConfig();
  if (message) {
    proxy?.$modal.msgWarning(message);
    activeTab.value = 'plan';
    return;
  }
  saving.value = true;
  try {
    form.productId = await saveProductConfig(form);
    proxy?.$modal.msgSuccess(draft ? '临时保存成功' : '全部配置保存成功');
    if (!draft) router.push('/product/list');
  } finally {
    saving.value = false;
  }
};

onMounted(async () => {
  companyLoading.value = true;
  try {
    const result = await listInsuranceCompany({ pageNum: 1, pageSize: 100, companyName: '', status: '0' });
    companyOptions.value = result.rows;
  } finally {
    companyLoading.value = false;
  }
  const sourceId = route.query.copy ? Number(route.query.copy) : route.params.id ? Number(route.params.id) : undefined;
  Object.assign(form, await getProductConfig(sourceId));
  if (isCopy.value) {
    form.productId = undefined;
    form.hasOrders = false;
    form.code = '';
    form.businessUnit = '';
  }
});
</script>

<style scoped lang="scss">
.config-page {
  min-height: calc(100vh - 84px);
  padding: 16px 20px 28px;
  background: #f3f5f8;
}
.config-shell {
  max-width: 1180px;
  margin: 0 auto;
  background: #fff;
}
.config-header {
  padding: 22px 30px 16px;
  border-bottom: 1px solid #ebeef5;
}
.config-title {
  font-size: 18px;
  font-weight: 600;
  color: #222;
}
.config-title .el-tag {
  margin-left: 8px;
}
.config-subtitle {
  margin-top: 7px;
  color: #9a9a9a;
  font-size: 13px;
}
.config-nav {
  height: 56px;
  padding-left: 20px;
  display: flex;
  align-items: flex-end;
  background: #fafafa;
  border-bottom: 1px solid #e8ebf0;
}
.config-nav button {
  height: 46px;
  padding: 0 28px;
  border: 0;
  border-bottom: 2px solid transparent;
  background: transparent;
  color: #606266;
  cursor: pointer;
  font-weight: 500;
}
.config-nav button.active {
  color: #28aef0;
  border-bottom-color: #28aef0;
  background: #fff;
}
.config-body {
  padding: 24px 30px 10px;
}
.plan-content,
.normal-section {
  min-height: 650px;
}
.order-lock-tip {
  margin-bottom: 18px;
}
.section-title {
  font-size: 15px;
  font-weight: 600;
  color: #303133;
  margin-bottom: 18px;
}
.blue-title {
  color: #268fcc;
}
.basic-card,
.scheme-card {
  padding: 20px 22px 8px;
  border: 1px solid #8fd6f7;
  border-radius: 8px;
  background: #edf9ff;
}
.basic-grid {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 0 34px;
}
.basic-grid :deep(.el-form-item:nth-child(3)) {
  grid-column: 1/2;
}
.basic-grid :deep(.el-select),
.product-info-grid :deep(.el-select) {
  width: 100%;
}
.block-title {
  display: flex;
  align-items: center;
  gap: 12px;
  margin: 24px 0 14px;
  padding-bottom: 10px;
  border-bottom: 1px solid #e5f3fa;
  color: #208ac5;
}
.block-title span,
.table-title span {
  font-size: 12px;
  color: #aaa;
}
.horizontal-tabs {
  display: flex;
  align-items: center;
  min-height: 48px;
  padding: 0 14px;
  background: #fafafa;
  border-bottom: 1px solid #dfeaf0;
}
.horizontal-tabs button {
  height: 48px;
  padding: 0 16px;
  display: flex;
  align-items: center;
  gap: 8px;
  border: 0;
  border-bottom: 2px solid transparent;
  background: transparent;
  color: #555;
  cursor: pointer;
}
.horizontal-tabs button.active {
  color: #159fe6;
  border-bottom-color: #29b5f4;
  font-weight: 600;
}
.number-dot {
  width: 22px;
  height: 22px;
  display: grid;
  place-items: center;
  border-radius: 50%;
  background: #b9e5f9;
  color: #168fc8;
  font-size: 12px;
}
.horizontal-tabs button.active .number-dot {
  background: #2bb5f3;
  color: #fff;
}
.horizontal-tabs .add-tab {
  color: #20a8e9;
}
.horizontal-tabs .dashed {
  height: 36px;
  margin-left: 8px;
  border: 1px dashed #25aff0;
}
.product-tabs {
  margin-top: 20px;
}
.product-info-grid {
  display: grid;
  grid-template-columns: 1.2fr 1.1fr 1.2fr 0.7fr;
  gap: 0 30px;
}
.scheme-tabs {
  margin: 2px 0 18px;
  padding-left: 0;
  background: transparent;
  border: 0;
}
.scheme-tabs button {
  height: 40px;
  background: #fafafa;
}
.scheme-tabs button.active {
  background: #25b1ef;
  color: #fff;
}
.scheme-card {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 16px 20px;
  margin-bottom: 22px;
}
.scheme-card label {
  font-size: 13px;
}
.scheme-card .el-input {
  width: 180px;
}
.scheme-card .el-input-number {
  width: 140px;
}
.unit {
  color: #909399;
}
.table-title,
.section-head,
.group-head {
  display: flex;
  align-items: center;
  justify-content: space-between;
}
.table-title {
  margin: 6px 0 12px;
  padding-bottom: 10px;
  border-bottom: 1px solid #e7f2f7;
  color: #218dc8;
}
.table-title b {
  margin-right: 12px;
}
.detail-title {
  margin-top: 24px;
}
.normal-section {
  max-width: 1120px;
}
.tip {
  margin: -10px 0 18px;
  color: #909399;
}
.tip.blue {
  margin: 0 0 20px;
  padding: 12px 16px;
  background: #ecf5ff;
  color: #409eff;
  border-radius: 3px;
}
.field-group {
  margin: 18px 0 24px;
  border: 1px solid #e4e7ed;
  border-radius: 4px;
  overflow: hidden;
}
.group-head {
  padding: 12px 15px;
  background: #fafafa;
}
.group-head > div:first-child {
  display: flex;
  align-items: center;
  gap: 10px;
}
.group-number {
  width: 24px;
  height: 24px;
  display: grid;
  place-items: center;
  background: #409eff;
  color: #fff;
  border-radius: 50%;
  font-size: 12px;
}
.group-head .el-input {
  width: 220px;
}
.add-field {
  margin: 12px;
}
.read-card {
  position: relative;
  margin-bottom: 16px;
  padding-right: 80px;
}
.delete-card {
  position: absolute;
  right: 22px;
  top: 22px;
}
.config-footer {
  padding: 18px 30px;
  display: flex;
  justify-content: flex-end;
  border-top: 1px solid #ebeef5;
  background: #fff;
}
@media (max-width: 900px) {
  .config-page {
    padding: 10px;
  }
  .config-nav {
    overflow-x: auto;
    padding-left: 0;
  }
  .config-nav button {
    white-space: nowrap;
    padding: 0 13px;
  }
  .config-body {
    padding: 18px 16px;
  }
  .basic-grid,
  .product-info-grid {
    grid-template-columns: 1fr;
  }
  .basic-grid :deep(.el-form-item:nth-child(3)) {
    grid-column: auto;
  }
  .scheme-card {
    align-items: flex-start;
    flex-wrap: wrap;
  }
}
</style>
