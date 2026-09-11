<template>
  <section class="insured-fields-config">
    <el-alert v-if="disabled" class="order-lock-tip" title="该产品已有订单，投保信息配置不可修改" type="warning" :closable="false" show-icon />

    <div class="config-tip">
      <el-icon><InfoFilled /></el-icon>
      <span
        >字段分类可修改名称，字段类型支持文本、日期、单选、多选、身份证、手机。单选和多选类型点击「设置选项」可配置选项值。字段可通过上下按钮移动，也可输入目标序号直接调整。</span
      >
    </div>

    <el-empty v-if="!groups.length" :image-size="88" description="暂无字段分类，请点击下方按钮添加" />

    <article v-for="(group, groupIndex) in groups" :key="group.id || groupIndex" class="field-group">
      <header class="group-head">
        <div class="group-name">
          <span class="group-number">{{ groupIndex + 1 }}</span>
          <el-input v-model="group.name" :disabled="disabled" maxlength="20" placeholder="请输入分类名称" />
        </div>
        <div v-if="!disabled" class="group-actions">
          <el-button link :disabled="groupIndex === 0" @click="moveGroup(groupIndex, -1)">
            <el-icon><Top /></el-icon>上移
          </el-button>
          <el-button link :disabled="groupIndex === groups.length - 1" @click="moveGroup(groupIndex, 1)">
            <el-icon><Bottom /></el-icon>下移
          </el-button>
          <el-button link type="danger" @click="removeGroup(groupIndex)">
            <el-icon><Delete /></el-icon>删除分类
          </el-button>
        </div>
      </header>

      <div class="field-table-wrap">
        <el-table :data="group.fields" border row-key="id" empty-text="暂无字段，请点击添加字段">
          <el-table-column type="index" label="序号" width="52" align="center" />
          <el-table-column label="字段名称" min-width="130">
            <template #default="scope">
              <el-input v-model="scope.row.name" :disabled="disabled" maxlength="30" placeholder="请输入字段名称" />
            </template>
          </el-table-column>
          <el-table-column label="字段类型" width="115">
            <template #default="scope">
              <el-select v-model="scope.row.type" :disabled="disabled" @change="changeFieldType(scope.row)">
                <el-option v-for="type in fieldTypes" :key="type" :label="type" :value="type" />
              </el-select>
            </template>
          </el-table-column>
          <el-table-column label="占位提示" min-width="170">
            <template #default="scope">
              <el-input v-model="scope.row.placeholder" :disabled="disabled" maxlength="50" placeholder="请输入占位提示" />
            </template>
          </el-table-column>
          <el-table-column label="选项值" width="95" align="center">
            <template #default="scope">
              <template v-if="supportsOptions(scope.row)">
                <el-button link type="primary" :disabled="disabled" @click.stop="openOptionDialog(scope.row)">设置选项</el-button>
                <span v-if="scope.row.options?.length" class="option-count">{{ scope.row.options.length }} 项</span>
              </template>
              <span v-else class="empty-value">-</span>
            </template>
          </el-table-column>
          <el-table-column label="格式校验" width="118" align="center">
            <template #default="scope">
              <el-select v-model="scope.row.formatRule" :disabled="disabled" placeholder="请选择" clearable>
                <el-option v-for="rule in formatRules" :key="rule" :label="rule" :value="rule" />
              </el-select>
            </template>
          </el-table-column>
          <el-table-column label="业务校验" width="156" align="center">
            <template #default="scope">
              <el-select
                v-model="scope.row.businessRules"
                :disabled="disabled"
                multiple
                collapse-tags
                :max-collapse-tags="1"
                collapse-tags-tooltip
                popper-class="business-rule-popper"
                placeholder="请选择"
                @change="changeBusinessRules(scope.row)"
              >
                <el-option v-for="rule in businessRules" :key="rule.value" :label="rule.label" :value="rule.value" />
              </el-select>
            </template>
          </el-table-column>
          <el-table-column label="必填" width="60" align="center">
            <template #default="scope"><el-checkbox v-model="scope.row.required" :disabled="disabled" @click.stop /></template>
          </el-table-column>
          <el-table-column label="排序" width="132" align="center">
            <template #default="scope">
              <div class="field-sort-actions">
                <el-button
                  link
                  :disabled="disabled || scope.$index === 0"
                  aria-label="上移字段"
                  title="上移"
                  @click.stop="moveFieldByStep(group, scope.row, -1)"
                >
                  <el-icon><Top /></el-icon>
                </el-button>
                <el-input-number
                  v-model="scope.row.sort"
                  :disabled="disabled"
                  :min="1"
                  :max="group.fields.length"
                  :controls="false"
                  aria-label="目标排序序号"
                  title="输入目标序号"
                  @click.stop
                  @change="moveFieldTo(group, scope.row, $event)"
                />
                <el-button
                  link
                  :disabled="disabled || scope.$index === group.fields.length - 1"
                  aria-label="下移字段"
                  title="下移"
                  @click.stop="moveFieldByStep(group, scope.row, 1)"
                >
                  <el-icon><Bottom /></el-icon>
                </el-button>
              </div>
            </template>
          </el-table-column>
          <el-table-column label="操作" width="60" align="center">
            <template #default="scope">
              <el-button v-if="!disabled" link type="danger" @click.stop="removeField(groupIndex, scope.$index)">删除</el-button>
              <span v-else class="empty-value">-</span>
            </template>
          </el-table-column>
        </el-table>
      </div>

      <el-button v-if="!disabled" class="add-field" link type="primary" @click="addField(group)">
        <el-icon><Plus /></el-icon>添加字段
      </el-button>
    </article>

    <button v-if="!disabled" type="button" class="add-group" @click="addGroup">
      <span class="add-group-icon">+</span>
      <span>添加字段分类</span>
    </button>

    <el-dialog v-model="optionDialogVisible" title="设置选项值" width="520px" append-to-body destroy-on-close>
      <div class="option-dialog-tip">请按前端展示顺序配置选项，至少保留一个有效选项。</div>
      <div class="option-list">
        <div v-for="(_, index) in optionDraft" :key="index" class="option-row">
          <span class="option-index">{{ index + 1 }}</span>
          <el-input v-model="optionDraft[index]" maxlength="30" placeholder="请输入选项值" />
          <el-button link :disabled="index === 0" aria-label="上移选项" @click="moveOption(index, -1)"
            ><el-icon><Top /></el-icon
          ></el-button>
          <el-button link :disabled="index === optionDraft.length - 1" aria-label="下移选项" @click="moveOption(index, 1)"
            ><el-icon><Bottom /></el-icon
          ></el-button>
          <el-button link type="danger" aria-label="删除选项" @click="optionDraft.splice(index, 1)"
            ><el-icon><Delete /></el-icon
          ></el-button>
        </div>
      </div>
      <el-button link type="primary" @click="optionDraft.push('')"
        ><el-icon><Plus /></el-icon>添加选项</el-button
      >
      <template #footer>
        <el-button @click="optionDialogVisible = false">取消</el-button>
        <el-button type="primary" @click="saveOptions">确定</el-button>
      </template>
    </el-dialog>
  </section>
</template>

<script setup lang="ts">
import { Bottom, Delete, InfoFilled, Plus, Top } from '@element-plus/icons-vue';
import type { FieldGroup, InsuredField } from '@/api/product/productManagement/types';

const props = defineProps<{ disabled?: boolean }>();
const groups = defineModel<FieldGroup[]>({ required: true });

const fieldTypes = ['文本', '日期', '单选', '多选', '身份证', '手机'];
const formatRules = ['无', '手机号', '身份证号', '邮箱', '统一信用代码', '纯数字', '金额'];
const businessRules = [
  { label: '无', value: '无' },
  { label: '已支付证件号校验（同一证件是否已支付）', value: '已支付证件号校验' },
  { label: '已投保证件号校验（同一证件是否已有生效保障）', value: '已投保证件号校验' },
  { label: '待支付订单校验（同一证件是否有未完成订单）', value: '待支付订单校验' },
  { label: '年龄范围校验（证件号出生日期是否符合产品范围）', value: '年龄范围校验' }
];
const optionDialogVisible = ref(false);
const optionDraft = ref<string[]>([]);
const optionField = ref<InsuredField>();
const previousBusinessRuleValues = new WeakMap<InsuredField, string[]>();

const supportsOptions = (field: InsuredField) => ['单选', '多选'].includes(field.type);
const createId = () => `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
const normalizeSort = (group: FieldGroup) => group.fields.forEach((field, index) => (field.sort = index + 1));
const changeFieldType = (field: InsuredField) => {
  if (!supportsOptions(field)) field.options = [];
  if (field.type === '身份证') field.formatRule = '身份证号';
  if (field.type === '手机') field.formatRule = '手机号';
};
const changeBusinessRules = (field: InsuredField) => {
  const values = field.businessRules || [];
  const previousValues = previousBusinessRuleValues.get(field) || [];
  const addedValue = values.find((value) => !previousValues.includes(value));
  field.businessRules = addedValue === '无' ? ['无'] : values.filter((value) => value !== '无');
  previousBusinessRuleValues.set(field, [...field.businessRules]);
};
const addField = (group: FieldGroup) => {
  group.fields.push({
    id: createId(),
    name: '',
    type: '文本',
    placeholder: '',
    required: false,
    sort: group.fields.length + 1,
    options: [],
    formatRule: '无',
    businessRules: []
  });
};
const removeField = (groupIndex: number, fieldIndex: number) => {
  const group = groups.value[groupIndex];
  group.fields.splice(fieldIndex, 1);
  normalizeSort(group);
};
const moveFieldTo = (group: FieldGroup, field: InsuredField, targetPosition?: number | string) => {
  const sourceIndex = group.fields.indexOf(field);
  const parsedPosition = Number(targetPosition);
  if (sourceIndex < 0 || !Number.isFinite(parsedPosition)) {
    normalizeSort(group);
    return;
  }
  const targetIndex = Math.min(group.fields.length - 1, Math.max(0, Math.round(parsedPosition) - 1));
  if (sourceIndex !== targetIndex) {
    const [movedField] = group.fields.splice(sourceIndex, 1);
    group.fields.splice(targetIndex, 0, movedField);
  }
  normalizeSort(group);
};
const moveFieldByStep = (group: FieldGroup, field: InsuredField, step: number) => {
  const sourceIndex = group.fields.indexOf(field);
  if (sourceIndex < 0) return;
  moveFieldTo(group, field, sourceIndex + step + 1);
};
const moveGroup = (index: number, step: number) => {
  const target = index + step;
  if (target < 0 || target >= groups.value.length) return;
  [groups.value[index], groups.value[target]] = [groups.value[target], groups.value[index]];
};
const removeGroup = async (index: number) => {
  try {
    await ElMessageBox.confirm(`确定删除“${groups.value[index].name || `分类${index + 1}`}”及其中全部字段吗？`, '删除字段分类', {
      confirmButtonText: '删除',
      cancelButtonText: '取消',
      type: 'warning'
    });
    groups.value.splice(index, 1);
  } catch {
    // 用户取消删除时不需要额外反馈。
  }
};
const addGroup = () => {
  groups.value.push({ id: createId(), name: `新分类${groups.value.length + 1}`, fields: [] });
};
const openOptionDialog = (field: InsuredField) => {
  optionField.value = field;
  optionDraft.value = field.options?.length ? [...field.options] : [''];
  optionDialogVisible.value = true;
};
const moveOption = (index: number, step: number) => {
  const target = index + step;
  if (target < 0 || target >= optionDraft.value.length) return;
  [optionDraft.value[index], optionDraft.value[target]] = [optionDraft.value[target], optionDraft.value[index]];
};
const saveOptions = () => {
  const values = optionDraft.value.map((item) => item.trim()).filter(Boolean);
  if (!values.length) {
    ElMessage.warning('请至少填写一个选项值');
    return;
  }
  if (new Set(values).size !== values.length) {
    ElMessage.warning('选项值不能重复');
    return;
  }
  if (optionField.value) optionField.value.options = values;
  optionDialogVisible.value = false;
};

watch(
  groups,
  (value) => {
    value.forEach((group) => {
      group.id ||= createId();
      group.fields.forEach((field, index) => {
        field.id ||= createId();
        field.sort ||= index + 1;
        field.options ||= [];
        field.formatRule ||= '无';
        field.businessRules ||= [];
        previousBusinessRuleValues.set(field, [...field.businessRules]);
      });
    });
  },
  { immediate: true }
);
</script>

<style scoped lang="scss">
.insured-fields-config {
  min-width: 0;
}
.order-lock-tip {
  margin-bottom: 18px;
}
.config-tip {
  display: flex;
  align-items: flex-start;
  gap: 9px;
  margin-bottom: 20px;
  padding: 11px 14px;
  border-radius: 4px;
  background: #eaf6fe;
  color: #3b91c5;
  font-size: 13px;
  line-height: 20px;
}
.config-tip .el-icon {
  margin-top: 2px;
  color: #39aaf0;
  font-size: 16px;
}
.field-group {
  margin-bottom: 24px;
  overflow: hidden;
  border: 1px solid #e5e9ef;
  border-radius: 4px;
  background: #fff;
}
.group-head {
  min-height: 52px;
  padding: 10px 15px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 16px;
  background: #f7fbfe;
  border-bottom: 1px solid #e4edf3;
}
.group-name,
.group-actions {
  display: flex;
  align-items: center;
}
.group-name {
  min-width: 0;
  gap: 10px;
}
.group-number {
  flex: 0 0 22px;
  width: 22px;
  height: 22px;
  display: grid;
  place-items: center;
  border-radius: 50%;
  background: #35b5f1;
  color: #fff;
  font-size: 12px;
}
.group-name .el-input {
  width: 190px;
}
.group-name :deep(.el-input__wrapper) {
  background: #fff;
  box-shadow: 0 0 0 1px #b8d9ee inset;
}
.group-name :deep(.el-input__wrapper:hover) {
  box-shadow: 0 0 0 1px #79c4ed inset;
}
.group-name :deep(.el-input__wrapper.is-focus) {
  box-shadow: 0 0 0 1px #35b5f1 inset;
}
.group-name :deep(.el-input__inner) {
  font-weight: 600;
  color: #303133;
}
.group-actions .el-button + .el-button {
  margin-left: 14px;
}
.field-table-wrap {
  overflow-x: auto;
}
.field-table-wrap .el-table {
  min-width: 1180px;
}
.field-table-wrap :deep(th.el-table__cell) {
  height: 44px;
  background: #fbfcfd;
  color: #606266;
  font-size: 13px;
  font-weight: 500;
}
.field-table-wrap :deep(td.el-table__cell) {
  height: 49px;
}
.field-table-wrap :deep(.el-input-number),
.field-table-wrap :deep(.el-select) {
  width: 100%;
}
.field-sort-actions {
  display: grid;
  grid-template-columns: 22px 54px 22px;
  align-items: center;
  justify-content: center;
  gap: 3px;
}
.field-sort-actions .el-button {
  width: 22px;
  height: 28px;
  margin: 0;
  color: #909399;
}
.field-sort-actions .el-button:not(.is-disabled):hover {
  color: #35aaf0;
}
.field-sort-actions :deep(.el-input-number) {
  width: 54px;
}
.field-sort-actions :deep(.el-input__inner) {
  text-align: center;
}
.option-count {
  margin-left: 5px;
  color: #a8abb2;
  font-size: 12px;
}
.empty-value {
  color: #c0c4cc;
}
.add-field {
  margin: 10px 15px 12px;
}
.add-group {
  width: 100%;
  min-height: 80px;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 7px;
  border: 1px dashed #9dddf9;
  border-radius: 4px;
  background: #fbfdff;
  color: #34abe5;
  cursor: pointer;
  transition:
    border-color 0.2s,
    background 0.2s;
}
.add-group:hover {
  border-color: #409eff;
  background: #f3faff;
}
.add-group-icon {
  width: 28px;
  height: 28px;
  display: grid;
  place-items: center;
  border-radius: 50%;
  background: #e2f5fe;
  font-size: 22px;
  line-height: 1;
}
.option-dialog-tip {
  margin: -4px 0 14px;
  color: #909399;
  font-size: 13px;
}
.option-list {
  max-height: 360px;
  overflow-y: auto;
}
.option-row {
  display: grid;
  grid-template-columns: 28px minmax(0, 1fr) 28px 28px 28px;
  align-items: center;
  gap: 6px;
  margin-bottom: 10px;
}
.option-index {
  color: #909399;
  text-align: center;
}
.option-row .el-button {
  margin: 0;
}
:global(.business-rule-popper) {
  min-width: 430px !important;
}
:global(.business-rule-popper .el-select-dropdown__item) {
  overflow: visible;
  text-overflow: clip;
}
@media (max-width: 767px) {
  .group-head {
    align-items: flex-start;
    flex-direction: column;
  }
  .group-actions {
    width: 100%;
    justify-content: flex-end;
  }
}
</style>
