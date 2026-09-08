<template>
  <div class="insurance-company-page">
    <el-card class="search-card" shadow="never">
      <el-form ref="queryFormRef" :model="queryParams" :inline="true" class="search-form">
        <el-form-item label="保险公司名称" prop="companyName">
          <el-input v-model="queryParams.companyName" placeholder="请输入保险公司名称" clearable @keyup.enter="handleQuery" />
        </el-form-item>
        <el-form-item label="状态" prop="status">
          <el-select v-model="queryParams.status" placeholder="全部" clearable>
            <el-option label="全部" value="" />
            <el-option label="启用" value="0" />
            <el-option label="停用" value="1" />
          </el-select>
        </el-form-item>
        <el-form-item class="search-actions">
          <el-button type="primary" icon="Search" @click="handleQuery">查询</el-button>
          <el-button icon="Refresh" @click="resetQuery">重置</el-button>
        </el-form-item>
      </el-form>
    </el-card>

    <el-card class="list-card" shadow="never">
      <template #header>
        <div class="list-header">
          <div class="list-title">
            <span>合作保险公司列表</span>
            <span class="record-count">共 {{ total }} 条记录</span>
          </div>
          <el-button type="primary" icon="Plus" @click="handleAdd">新增</el-button>
        </div>
      </template>

      <el-table v-loading="loading" :data="companyList" border>
        <el-table-column label="序号" type="index" width="72" align="center">
          <template #default="scope">
            {{ (queryParams.pageNum - 1) * queryParams.pageSize + scope.$index + 1 }}
          </template>
        </el-table-column>
        <el-table-column label="Logo" width="100" align="center">
          <template #default="scope">
            <img class="company-logo" :src="scope.row.logo" :alt="`${scope.row.companyName} Logo`" />
          </template>
        </el-table-column>
        <el-table-column label="保险公司名称" prop="companyName" min-width="170" show-overflow-tooltip />
        <el-table-column label="跳转地址" prop="website" min-width="230" show-overflow-tooltip>
          <template #default="scope">
            <a v-if="scope.row.website" class="company-link" :href="scope.row.website" target="_blank" rel="noopener noreferrer">
              {{ scope.row.website }}
            </a>
            <span v-else>-</span>
          </template>
        </el-table-column>
        <el-table-column label="备注" prop="remark" min-width="190" show-overflow-tooltip>
          <template #default="scope">{{ scope.row.remark || '-' }}</template>
        </el-table-column>
        <el-table-column label="状态" width="110" align="center">
          <template #default="scope">
            <el-switch
              v-model="scope.row.status"
              active-value="0"
              inactive-value="1"
              inline-prompt
              active-text="启"
              inactive-text="停"
              @change="handleStatusChange(scope.row)"
            />
          </template>
        </el-table-column>
        <el-table-column label="操作" width="150" align="center" fixed="right">
          <template #default="scope">
            <el-button link type="primary" @click="handleUpdate(scope.row)">编辑</el-button>
            <el-button link type="danger" @click="handleDelete(scope.row)">删除</el-button>
          </template>
        </el-table-column>
      </el-table>

      <pagination
        v-show="total > 0"
        v-model:page="queryParams.pageNum"
        v-model:limit="queryParams.pageSize"
        :page-sizes="[5, 10, 20]"
        :total="total"
        @pagination="getList"
      />
    </el-card>

    <el-dialog
      v-model="dialog.visible"
      :title="dialog.title"
      width="min(650px, calc(100vw - 24px))"
      top="10vh"
      append-to-body
      class="insurance-company-dialog"
      :close-on-click-modal="false"
      @closed="resetForm"
    >
      <el-form ref="companyFormRef" :model="form" :rules="rules" label-position="top" require-asterisk-position="right" class="company-dialog-form">
        <el-form-item label="Logo" prop="logo">
          <div class="logo-field">
            <div class="logo-preview-box">
              <img v-if="form.logo" class="logo-preview" :src="form.logo" alt="保险公司 Logo 预览" />
              <span v-else class="logo-placeholder">暂无图片</span>
            </div>
            <div class="logo-upload-block">
              <el-upload accept=".jpg,.jpeg,.png" :auto-upload="false" :show-file-list="false" :on-change="handleLogoChange">
                <el-button>上传 Logo</el-button>
              </el-upload>
              <div class="upload-tip">支持 JPG / PNG，建议 1:1 图片</div>
              <div v-if="logoError" class="upload-error">{{ logoError }}</div>
            </div>
          </div>
        </el-form-item>
        <el-form-item label="保险公司名称" prop="companyName">
          <el-input v-model="form.companyName" maxlength="50" placeholder="请输入保险公司名称" />
        </el-form-item>
        <el-form-item label="跳转地址" prop="website">
          <el-input v-model="form.website" placeholder="请输入跳转地址，如 https://www.example.com" />
        </el-form-item>
        <el-form-item label="备注" prop="remark">
          <el-input v-model="form.remark" type="textarea" :rows="3" maxlength="200" placeholder="请输入补充说明信息" />
        </el-form-item>
      </el-form>
      <template #footer>
        <div class="dialog-footer">
          <el-button @click="cancel">取消</el-button>
          <el-button :loading="buttonLoading" type="primary" @click="submitForm">保存</el-button>
        </div>
      </template>
    </el-dialog>
  </div>
</template>

<script setup name="InsuranceCompany" lang="ts">
import {
  addInsuranceCompany,
  changeInsuranceCompanyStatus,
  deleteInsuranceCompany,
  getInsuranceCompany,
  listInsuranceCompany,
  updateInsuranceCompany
} from '@/api/product/insuranceCompany';
import { InsuranceCompanyForm, InsuranceCompanyQuery, InsuranceCompanyVO } from '@/api/product/insuranceCompany/types';

const { proxy } = getCurrentInstance() as ComponentInternalInstance;

const companyList = ref<InsuranceCompanyVO[]>([]);
const loading = ref(false);
const buttonLoading = ref(false);
const total = ref(0);
const logoError = ref('');
const queryFormRef = ref<ElFormInstance>();
const companyFormRef = ref<ElFormInstance>();

const dialog = reactive<DialogOption>({
  visible: false,
  title: ''
});

const initFormData: InsuranceCompanyForm = {
  companyId: undefined,
  logo: '',
  companyName: '',
  website: '',
  remark: '',
  status: '0'
};

const validateWebsite = (_rule: unknown, value: string, callback: (error?: Error) => void) => {
  if (!value) return callback();
  try {
    const url = new URL(value);
    if (!['http:', 'https:'].includes(url.protocol)) throw new Error();
    callback();
  } catch {
    callback(new Error('请输入以 http:// 或 https:// 开头的有效地址'));
  }
};

const data = reactive<PageData<InsuranceCompanyForm, InsuranceCompanyQuery>>({
  form: { ...initFormData },
  queryParams: {
    pageNum: 1,
    pageSize: 10,
    companyName: '',
    status: ''
  },
  rules: {
    companyName: [{ required: true, message: '请输入保险公司名称', trigger: 'blur' }],
    website: [{ validator: validateWebsite, trigger: 'blur' }]
  }
});

const { form, queryParams, rules } = toRefs(data);

const getList = async () => {
  loading.value = true;
  try {
    const result = await listInsuranceCompany(queryParams.value);
    companyList.value = result.rows;
    total.value = result.total;
  } finally {
    loading.value = false;
  }
};

const handleQuery = () => {
  queryParams.value.pageNum = 1;
  getList();
};

const resetQuery = () => {
  queryFormRef.value?.resetFields();
  queryParams.value.status = '';
  handleQuery();
};

const resetForm = () => {
  form.value = { ...initFormData };
  logoError.value = '';
  companyFormRef.value?.resetFields();
};

const handleAdd = () => {
  resetForm();
  dialog.title = '新增合作保险公司';
  dialog.visible = true;
};

const handleUpdate = async (row: InsuranceCompanyVO) => {
  resetForm();
  const company = await getInsuranceCompany(row.companyId);
  form.value = { ...company };
  dialog.title = '编辑合作保险公司';
  dialog.visible = true;
};

const handleLogoChange = (uploadFile: UploadFile) => {
  const file = uploadFile.raw;
  logoError.value = '';
  if (!file) return;
  if (!['image/jpeg', 'image/png'].includes(file.type)) {
    logoError.value = '图片格式不支持，请上传 JPG 或 PNG 图片';
    return;
  }
  if (file.size > 2 * 1024 * 1024) {
    logoError.value = '图片大小超出限制，请上传不超过 2MB 的图片';
    return;
  }
  const reader = new FileReader();
  reader.onload = () => {
    form.value.logo = String(reader.result || '');
    companyFormRef.value?.clearValidate('logo');
  };
  reader.readAsDataURL(file);
};

const cancel = () => {
  dialog.visible = false;
};

const submitForm = () => {
  companyFormRef.value?.validate(async (valid: boolean) => {
    if (!valid || logoError.value) return;
    buttonLoading.value = true;
    try {
      if (form.value.companyId) {
        await updateInsuranceCompany(form.value);
      } else {
        await addInsuranceCompany(form.value);
      }
      proxy?.$modal.msgSuccess('保存成功');
      dialog.visible = false;
      await getList();
    } finally {
      buttonLoading.value = false;
    }
  });
};

const handleStatusChange = async (row: InsuranceCompanyVO) => {
  await changeInsuranceCompanyStatus(row.companyId, row.status);
  proxy?.$modal.msgSuccess(`已${row.status === '0' ? '启用' : '停用'}${row.companyName}`);
};

const handleDelete = async (row: InsuranceCompanyVO) => {
  if (row.status === '0') {
    proxy?.$modal.msgWarning('启用状态的保险公司不可删除，请先停用');
    return;
  }
  await proxy?.$modal.confirm(`确认删除“${row.companyName}”吗？删除后不可恢复。`);
  await deleteInsuranceCompany(row.companyId);
  if (companyList.value.length === 1 && queryParams.value.pageNum > 1) {
    queryParams.value.pageNum--;
  }
  await getList();
  proxy?.$modal.msgSuccess('删除成功');
};

onMounted(getList);
</script>

<style lang="scss" scoped>
.insurance-company-page {
  display: flex;
  flex-direction: column;
  gap: 12px;
  min-height: 100%;
  padding: 12px;
  background: var(--el-bg-color-page);
}

.search-card,
.list-card {
  border-color: var(--el-border-color-lighter);
}

.search-form {
  display: flex;
  flex-wrap: wrap;
  gap: 0 20px;

  :deep(.el-form-item) {
    margin-bottom: 0;
  }

  :deep(.el-form-item__label) {
    width: auto !important;
    flex: 0 0 auto;
    white-space: nowrap;
  }

  :deep(.el-input) {
    width: 240px;
  }

  :deep(.el-select) {
    width: 180px;
  }
}

.list-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 16px;
}

.list-title {
  display: flex;
  align-items: baseline;
  gap: 12px;
  color: var(--el-text-color-primary);
  font-size: 16px;
  font-weight: 600;
}

.record-count {
  color: var(--el-text-color-secondary);
  font-size: 13px;
  font-weight: 400;
}

.company-logo {
  display: block;
  width: 38px;
  height: 38px;
  margin: 0 auto;
  border-radius: 8px;
  object-fit: cover;
}

.company-link {
  color: var(--el-color-primary);
  text-decoration: none;

  &:hover {
    text-decoration: underline;
  }
}

.logo-field {
  display: flex;
  align-items: flex-start;
  gap: 20px;
}

.logo-preview-box {
  display: flex;
  overflow: hidden;
  align-items: center;
  justify-content: center;
  width: 90px;
  height: 90px;
  flex: 0 0 90px;
  border: 1px dashed var(--el-border-color);
  border-radius: 10px;
  background: var(--el-fill-color-lighter);
}

.logo-preview {
  display: block;
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.logo-placeholder {
  color: var(--el-text-color-secondary);
  font-size: 14px;
}

.logo-upload-block {
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  padding-top: 8px;

  :deep(.el-button) {
    height: 42px;
    padding: 0 20px;
    border-radius: 8px;
    font-size: 16px;
  }
}

.upload-tip {
  margin-top: 8px;
  color: var(--el-text-color-secondary);
  font-size: 14px;
  line-height: 22px;
}

.upload-error {
  color: var(--el-color-danger);
  font-size: 12px;
  line-height: 20px;
}

:global(.el-overlay .el-overlay-dialog .el-dialog.insurance-company-dialog) {
  --el-dialog-border-radius: 16px;
  --el-dialog-padding-primary: 0;
  overflow: hidden;
  border-radius: 16px;
}

:global(.el-overlay .el-overlay-dialog .insurance-company-dialog .el-dialog__header) {
  box-sizing: border-box;
  height: 74px;
  margin: 0;
  padding: 25px 30px 22px;
  border-bottom: 1px solid var(--el-border-color-lighter);
}

:global(.insurance-company-dialog .el-dialog__title) {
  color: var(--el-text-color-primary);
  font-size: 20px;
  font-weight: 600;
  line-height: 26px;
}

:global(.insurance-company-dialog .el-dialog__headerbtn) {
  top: 13px;
  right: 18px;
  width: 48px;
  height: 48px;
  font-size: 23px;
}

:global(.el-overlay .el-overlay-dialog .insurance-company-dialog .el-dialog__body) {
  padding: 27px 30px !important;
}

:global(.insurance-company-dialog .el-dialog__footer) {
  padding: 19px 30px 20px;
  border-top: 1px solid var(--el-border-color-lighter);
}

:global(.insurance-company-dialog .company-dialog-form .el-form-item) {
  margin-bottom: 20px;
}

:global(.insurance-company-dialog .company-dialog-form .el-form-item:last-child) {
  margin-bottom: 0;
}

:global(.insurance-company-dialog .company-dialog-form .el-form-item__label) {
  height: auto;
  margin-bottom: 8px;
  padding: 0;
  color: var(--el-text-color-regular);
  font-size: 16px;
  line-height: 22px;
}

:global(.insurance-company-dialog .company-dialog-form .el-input__wrapper) {
  min-height: 48px;
  padding: 1px 16px;
  border-radius: 8px;
}

:global(.insurance-company-dialog .company-dialog-form .el-input__inner),
:global(.insurance-company-dialog .company-dialog-form .el-textarea__inner) {
  font-size: 16px;
}

:global(.insurance-company-dialog .company-dialog-form .el-textarea__inner) {
  height: 90px;
  min-height: 90px !important;
  padding: 12px 16px;
  border-radius: 8px;
  line-height: 24px;
}

:global(.insurance-company-dialog .dialog-footer) {
  display: flex;
  justify-content: flex-end;
  gap: 12px;
}

:global(.insurance-company-dialog .dialog-footer .el-button) {
  min-width: 76px;
  height: 42px;
  margin-left: 0;
  border-radius: 8px;
  font-size: 16px;
}

@media (max-width: 767px) {
  .insurance-company-page {
    padding: 8px;
  }

  .search-form {
    display: block;

    :deep(.el-form-item) {
      display: flex;
      margin-bottom: 14px;
    }

    :deep(.el-form-item__content),
    :deep(.el-input),
    :deep(.el-select) {
      flex: 1;
      width: 100%;
    }

    .search-actions {
      margin-bottom: 0;
    }
  }

  .list-header,
  .list-title {
    align-items: flex-start;
  }

  .list-title {
    flex-direction: column;
    gap: 4px;
  }

  .list-card {
    :deep(.el-pagination__total),
    :deep(.el-pagination__jump) {
      display: none;
    }
  }

  :global(.el-overlay .el-overlay-dialog .insurance-company-dialog .el-dialog__header) {
    padding-right: 20px;
    padding-left: 20px;
  }

  :global(.el-overlay .el-overlay-dialog .insurance-company-dialog .el-dialog__body) {
    padding: 22px 20px 16px !important;
  }

  :global(.insurance-company-dialog .el-dialog__footer) {
    padding-right: 20px;
    padding-left: 20px;
  }

  .logo-field {
    gap: 16px;
  }

  .logo-upload-block {
    min-width: 0;
  }

  .upload-tip {
    max-width: 180px;
  }
}
</style>
