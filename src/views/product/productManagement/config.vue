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
          <div class="basic-card">
            <div class="section-title blue-title">基本信息</div>
            <el-form :model="form" label-position="top" class="basic-grid">
              <el-form-item label="产品名称" required><el-input v-model="form.name" placeholder="请输入产品名称" /></el-form-item>
              <el-form-item label="产品编码" required><el-input v-model="form.code" placeholder="请输入产品编码" /></el-form-item>
              <el-form-item label="业务归属" required><el-select v-model="form.businessUnit" placeholder="请选择业务归属"><el-option v-for="x in units" :key="x" :label="x" :value="x" /></el-select></el-form-item>
            </el-form>
          </div>

          <div class="block-title"><b>页面展示配置</b><span>方案详情页顶部</span></div>
          <el-form label-position="top"><el-form-item label="顶部横幅副标题"><el-input v-model="form.subtitle" type="textarea" :rows="2" placeholder="请输入顶部横幅副标题" /></el-form-item></el-form>

          <div class="horizontal-tabs product-tabs">
            <button v-for="(name, index) in form.products" :key="index" :class="{ active: productIndex === index }" @click="productIndex = index">
              <span class="number-dot">{{ index + 1 }}</span>{{ name || `产品${index + 1}` }}<el-icon v-if="form.products.length > 1" @click.stop="removeProduct(index)"><Close /></el-icon>
            </button>
            <button class="add-tab" @click="addProduct">＋ 添加产品</button>
          </div>

          <template v-if="currentPlan">
            <div class="block-title"><b>产品信息</b><span>该产品独立配置</span></div>
            <el-form label-position="top" class="product-info-grid">
              <el-form-item label="产品名称" required><el-input v-model="currentProductName" /></el-form-item>
              <el-form-item label="险种类别"><el-select v-model="currentPlan.type"><el-option label="主险" value="主险" /><el-option label="附加险" value="附加险" /></el-select></el-form-item>
              <el-form-item label="承保公司"><el-input v-model="currentPlan.company" placeholder="请输入承保公司" /></el-form-item>
              <el-form-item label="是否必选"><el-checkbox v-model="currentPlan.required">必选</el-checkbox></el-form-item>
            </el-form>

            <div class="horizontal-tabs scheme-tabs">
              <button v-for="(plan, index) in form.plans" :key="index" :class="{ active: planIndex === index }" @click="planIndex = index">
                {{ plan.name || `方案${index + 1}` }}<el-icon v-if="form.plans.length > 1" @click.stop="removePlan(index)"><Close /></el-icon>
              </button>
              <button class="add-tab dashed" @click="addPlan">＋ 添加方案</button>
            </div>

            <div class="scheme-card">
              <label>方案名称</label><el-input v-model="currentPlan.name" />
              <label>保费</label><el-input-number v-model="currentPlan.premium" :min="0" :controls="false" />
              <span class="unit">元/年</span>
            </div>

            <div class="table-title"><div><b>保障责任</b><span>该方案的保障项目</span></div><el-button link type="primary" @click="currentPlan.protections.push({ name: '', amount: '' })">＋ 添加保障项</el-button></div>
            <el-table :data="currentPlan.protections" border>
              <el-table-column type="index" label="序号" width="68" align="center" />
              <el-table-column label="保障项目"><template #default="s"><el-input v-model="s.row.name" placeholder="请输入保障项目" /></template></el-table-column>
              <el-table-column label="保障金额" width="240"><template #default="s"><el-input v-model="s.row.amount" placeholder="请输入金额" /></template></el-table-column>
              <el-table-column label="操作" width="86" align="center"><template #default="s"><el-button link type="danger" @click="currentPlan.protections.splice(s.$index, 1)">删除</el-button></template></el-table-column>
            </el-table>
            <div class="block-title detail-title"><b>方案详情</b><span>方案描述说明</span></div>
            <el-input v-model="currentPlan.description" type="textarea" :rows="5" placeholder="请输入方案描述说明" />
          </template>
        </section>

      <section v-show="activeTab === 'intro'" class="normal-section">
        <div class="section-title">介绍页配置</div><div class="tip">配置销售端产品介绍页展示的富文本、图片及视频内容</div>
        <Editor v-model="form.introduction" :min-height="430" />
      </section>

      <section v-show="activeTab === 'fields'" class="normal-section">
        <div class="tip blue">字段分类可修改名称，字段类型支持文本、日期、单选、多选、身份证、手机。单选和多选类型可配置选项值。</div>
        <div v-for="(group, gi) in form.fieldGroups" :key="gi" class="field-group">
          <div class="group-head"><div><span class="group-number">{{ gi + 1 }}</span><el-input v-model="group.name" /></div><div><el-button link :disabled="gi === 0" @click="moveGroup(gi, -1)">▲ 上移</el-button><el-button link :disabled="gi === form.fieldGroups.length - 1" @click="moveGroup(gi, 1)">▼ 下移</el-button><el-button link type="danger" @click="form.fieldGroups.splice(gi, 1)">删除分类</el-button></div></div>
          <el-table :data="group.fields" border>
            <el-table-column type="index" label="序号" width="62" align="center" />
            <el-table-column label="字段名称"><template #default="s"><el-input v-model="s.row.name" /></template></el-table-column>
            <el-table-column label="字段类型" width="150"><template #default="s"><el-select v-model="s.row.type"><el-option v-for="t in fieldTypes" :key="t" :label="t" :value="t" /></el-select></template></el-table-column>
            <el-table-column label="占位提示"><template #default="s"><el-input v-model="s.row.placeholder" /></template></el-table-column>
            <el-table-column label="必填" width="85" align="center"><template #default="s"><el-checkbox v-model="s.row.required" /></template></el-table-column>
            <el-table-column label="排序" width="120" align="center"><template #default="s"><el-input-number :model-value="s.$index + 1" disabled controls-position="right" /></template></el-table-column>
            <el-table-column label="操作" width="80" align="center"><template #default="s"><el-button link type="danger" @click="group.fields.splice(s.$index, 1)">删除</el-button></template></el-table-column>
          </el-table>
          <el-button class="add-field" icon="Plus" @click="group.fields.push({ name: '', type: '文本', placeholder: '', required: false })">添加字段</el-button>
        </div>
        <el-button type="primary" plain icon="Plus" @click="form.fieldGroups.push({ name: '新分类', fields: [] })">添加字段分类</el-button>
      </section>

      <section v-show="activeTab === 'read'" class="normal-section"><div class="section-head"><div class="section-title">强制阅读配置</div><el-button type="primary" plain icon="Plus" @click="form.forceRead.push({ title: '', content: '', seconds: 5, enabled: true })">添加内容</el-button></div><el-card v-for="(x, i) in form.forceRead" :key="i" shadow="never" class="read-card"><el-form label-width="110px"><el-form-item label="阅读标题"><el-input v-model="x.title" /></el-form-item><el-form-item label="阅读内容"><el-input v-model="x.content" type="textarea" :rows="5" /></el-form-item><el-form-item label="强制时长"><el-input-number v-model="x.seconds" :min="0" /><span class="unit">秒</span></el-form-item><el-form-item label="启用状态"><el-switch v-model="x.enabled" /></el-form-item></el-form><el-button class="delete-card" link type="danger" @click="form.forceRead.splice(i, 1)">删除</el-button></el-card></section>

        <section v-show="activeTab === 'agreement'" class="normal-section"><div class="section-head"><div class="section-title">协议文件配置</div><el-button type="primary" plain icon="Plus" @click="form.agreements.push({ name: '', url: '', required: true })">添加协议</el-button></div><el-table :data="form.agreements" border><el-table-column type="index" label="序号" width="68" /><el-table-column label="协议名称"><template #default="s"><el-input v-model="s.row.name" placeholder="请输入协议名称" /></template></el-table-column><el-table-column label="文件地址"><template #default="s"><el-input v-model="s.row.url" placeholder="请上传 PDF 协议文件" /></template></el-table-column><el-table-column label="必读" width="90" align="center"><template #default="s"><el-checkbox v-model="s.row.required" /></template></el-table-column><el-table-column label="操作" width="86"><template #default="s"><el-button link type="danger" @click="form.agreements.splice(s.$index, 1)">删除</el-button></template></el-table-column></el-table></section>
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
import { getProductConfig, saveProductConfig } from '@/api/product/productManagement';
import type { ProductConfig } from '@/api/product/productManagement/types';

const route = useRoute();
const router = useRouter();
const { proxy } = getCurrentInstance() as ComponentInternalInstance;
const tabs = [{ name: 'plan', label: '产品方案配置' }, { name: 'intro', label: '介绍页配置' }, { name: 'fields', label: '投保信息配置' }, { name: 'read', label: '强制阅读' }, { name: 'agreement', label: '协议文件配置' }];
const units = ['贵州本部', '重庆本部', '保定本部', '四川本部'];
const fieldTypes = ['文本', '日期', '单选', '多选', '身份证', '手机'];
const activeTab = ref('plan'); const productIndex = ref(0); const planIndex = ref(0); const saving = ref(false);
const isCopy = computed(() => Boolean(route.query.copy));
const form = reactive<ProductConfig>({ name: '', code: '', businessUnit: '', subtitle: '', products: [], plans: [], introduction: '', fieldGroups: [], forceRead: [], agreements: [] });
const currentPlan = computed(() => form.plans[planIndex.value]);
const currentProductName = computed({ get: () => form.products[productIndex.value] || '', set: (value: string) => { form.products[productIndex.value] = value; if (productIndex.value === 0) form.name = value; } });
const addProduct = () => { form.products.push(`新产品${form.products.length + 1}`); productIndex.value = form.products.length - 1; };
const removeProduct = (index: number) => { form.products.splice(index, 1); productIndex.value = Math.max(0, Math.min(productIndex.value, form.products.length - 1)); };
const addPlan = () => { form.plans.push({ name: `方案${form.plans.length + 1}`, premium: 0, company: '', type: '主险', required: false, description: '', protections: [{ name: '', amount: '' }] }); planIndex.value = form.plans.length - 1; };
const removePlan = (index: number) => { form.plans.splice(index, 1); planIndex.value = Math.max(0, Math.min(planIndex.value, form.plans.length - 1)); };
const moveGroup = (index: number, step: number) => { const target = index + step; if (target < 0 || target >= form.fieldGroups.length) return; [form.fieldGroups[index], form.fieldGroups[target]] = [form.fieldGroups[target], form.fieldGroups[index]]; };
const save = async (draft: boolean) => { if (!form.name || !form.code || !form.businessUnit) { proxy?.$modal.msgWarning('请完整填写产品名称、产品编码和业务归属'); activeTab.value = 'plan'; return; } saving.value = true; try { form.productId = await saveProductConfig(form); proxy?.$modal.msgSuccess(draft ? '临时保存成功' : '全部配置保存成功'); if (!draft) router.push('/product/list'); } finally { saving.value = false; } };

onMounted(async () => {
  const sourceId = route.query.copy ? Number(route.query.copy) : route.params.id ? Number(route.params.id) : undefined;
  Object.assign(form, await getProductConfig(sourceId));
  if (isCopy.value) {
    form.productId = undefined;
    form.code = '';
    form.businessUnit = '';
  }
  if (!form.products.length) form.products.push(form.name || '新产品');
  if (!form.plans.length) addPlan();
});
</script>

<style scoped lang="scss">
.config-page{min-height:calc(100vh - 84px);padding:16px 20px 28px;background:#f3f5f8}.config-shell{max-width:1180px;margin:0 auto;background:#fff}.config-header{padding:22px 30px 16px;border-bottom:1px solid #ebeef5}.config-title{font-size:18px;font-weight:600;color:#222}.config-title .el-tag{margin-left:8px}.config-subtitle{margin-top:7px;color:#9a9a9a;font-size:13px}.config-nav{height:56px;padding-left:20px;display:flex;align-items:flex-end;background:#fafafa;border-bottom:1px solid #e8ebf0}.config-nav button{height:46px;padding:0 28px;border:0;border-bottom:2px solid transparent;background:transparent;color:#606266;cursor:pointer;font-weight:500}.config-nav button.active{color:#28aef0;border-bottom-color:#28aef0;background:#fff}.config-body{padding:24px 30px 10px}.plan-content,.normal-section{min-height:650px}.section-title{font-size:15px;font-weight:600;color:#303133;margin-bottom:18px}.blue-title{color:#268fcc}.basic-card,.scheme-card{padding:20px 22px 8px;border:1px solid #8fd6f7;border-radius:8px;background:#edf9ff}.basic-grid{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:0 34px}.basic-grid :deep(.el-form-item:nth-child(3)){grid-column:1/2}.basic-grid :deep(.el-select),.product-info-grid :deep(.el-select){width:100%}.block-title{display:flex;align-items:center;gap:12px;margin:24px 0 14px;padding-bottom:10px;border-bottom:1px solid #e5f3fa;color:#208ac5}.block-title span,.table-title span{font-size:12px;color:#aaa}.horizontal-tabs{display:flex;align-items:center;min-height:48px;padding:0 14px;background:#fafafa;border-bottom:1px solid #dfeaf0}.horizontal-tabs button{height:48px;padding:0 16px;display:flex;align-items:center;gap:8px;border:0;border-bottom:2px solid transparent;background:transparent;color:#555;cursor:pointer}.horizontal-tabs button.active{color:#159fe6;border-bottom-color:#29b5f4;font-weight:600}.number-dot{width:22px;height:22px;display:grid;place-items:center;border-radius:50%;background:#b9e5f9;color:#168fc8;font-size:12px}.horizontal-tabs button.active .number-dot{background:#2bb5f3;color:#fff}.horizontal-tabs .add-tab{color:#20a8e9}.horizontal-tabs .dashed{height:36px;margin-left:8px;border:1px dashed #25aff0}.product-tabs{margin-top:20px}.product-info-grid{display:grid;grid-template-columns:1.2fr 1.1fr 1.2fr .7fr;gap:0 30px}.scheme-tabs{margin:2px 0 18px;padding-left:0;background:transparent;border:0}.scheme-tabs button{height:40px;background:#fafafa}.scheme-tabs button.active{background:#25b1ef;color:#fff}.scheme-card{display:flex;align-items:center;gap:12px;padding:16px 20px;margin-bottom:22px}.scheme-card label{font-size:13px}.scheme-card .el-input{width:180px}.scheme-card .el-input-number{width:140px}.unit{color:#909399}.table-title,.section-head,.group-head{display:flex;align-items:center;justify-content:space-between}.table-title{margin:6px 0 12px;padding-bottom:10px;border-bottom:1px solid #e7f2f7;color:#218dc8}.table-title b{margin-right:12px}.detail-title{margin-top:24px}.normal-section{max-width:1120px}.tip{margin:-10px 0 18px;color:#909399}.tip.blue{margin:0 0 20px;padding:12px 16px;background:#ecf5ff;color:#409eff;border-radius:3px}.field-group{margin:18px 0 24px;border:1px solid #e4e7ed;border-radius:4px;overflow:hidden}.group-head{padding:12px 15px;background:#fafafa}.group-head>div:first-child{display:flex;align-items:center;gap:10px}.group-number{width:24px;height:24px;display:grid;place-items:center;background:#409eff;color:#fff;border-radius:50%;font-size:12px}.group-head .el-input{width:220px}.add-field{margin:12px}.read-card{position:relative;margin-bottom:16px;padding-right:80px}.delete-card{position:absolute;right:22px;top:22px}.config-footer{padding:18px 30px;display:flex;justify-content:flex-end;border-top:1px solid #ebeef5;background:#fff}@media(max-width:900px){.config-page{padding:10px}.config-nav{overflow-x:auto;padding-left:0}.config-nav button{white-space:nowrap;padding:0 13px}.config-body{padding:18px 16px}.basic-grid,.product-info-grid{grid-template-columns:1fr}.basic-grid :deep(.el-form-item:nth-child(3)){grid-column:auto}.scheme-card{align-items:flex-start;flex-wrap:wrap}}
</style>
