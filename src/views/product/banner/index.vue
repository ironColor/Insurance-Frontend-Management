<template>
  <div class="banner-management-page">
    <el-card class="search-card" shadow="never">
      <el-form ref="queryFormRef" :model="queryParams" label-position="top" :inline="true" class="search-form">
        <el-form-item label="跳转页面" prop="jumpUrl">
          <el-input v-model="queryParams.jumpUrl" placeholder="请输入跳转页面" clearable @keyup.enter="handleQuery" />
        </el-form-item>
        <el-form-item label="关联产品" prop="productId">
          <el-select v-model="queryParams.productId" placeholder="全部" clearable>
            <el-option label="全部" value="" />
            <el-option v-for="product in productOptions" :key="product.productId" :label="product.productName" :value="product.productId" />
          </el-select>
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
            <span>Banner 图列表</span>
            <span class="record-count">共 {{ total }} 条记录</span>
          </div>
          <el-button type="primary" icon="Plus" @click="handleAdd">新增</el-button>
        </div>
      </template>

      <el-table v-loading="loading" :data="bannerList" border>
        <el-table-column label="序号" type="index" width="72" align="center">
          <template #default="scope">
            {{ (queryParams.pageNum - 1) * queryParams.pageSize + scope.$index + 1 }}
          </template>
        </el-table-column>
        <el-table-column label="Banner 图预览" width="220" align="center">
          <template #default="scope">
            <img class="banner-thumbnail" :src="scope.row.image" alt="Banner 图预览" />
          </template>
        </el-table-column>
        <el-table-column label="跳转页面" prop="jumpUrl" min-width="280" show-overflow-tooltip>
          <template #default="scope">
            <span v-if="scope.row.jumpUrl" class="banner-link">{{ scope.row.jumpUrl }}</span>
            <span v-else>-</span>
          </template>
        </el-table-column>
        <el-table-column label="关联产品" prop="productName" min-width="220" show-overflow-tooltip>
          <template #default="scope">{{ scope.row.productName || '-' }}</template>
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
      width="min(540px, calc(100vw - 24px))"
      append-to-body
      class="banner-management-dialog"
      :close-on-click-modal="false"
      @closed="resetForm"
    >
      <el-form ref="bannerFormRef" :model="form" :rules="rules" label-position="top" require-asterisk-position="right" class="banner-dialog-form">
        <el-form-item label="Banner 图" prop="image">
          <div class="banner-upload-field">
            <div class="banner-preview-box">
              <img v-if="form.image" class="banner-preview" :src="form.image" alt="Banner 图预览" />
              <div v-else class="banner-placeholder">
                <el-icon><Picture /></el-icon>
                <span>暂无图片</span>
              </div>
            </div>
            <div class="banner-upload-block">
              <el-upload accept=".jpg,.jpeg,.png" :auto-upload="false" :show-file-list="false" :on-change="handleBannerChange">
                <el-button>上传图片</el-button>
              </el-upload>
              <div class="upload-tip">仅支持 JPG / PNG 格式，大小不超过 2MB</div>
              <div v-if="imageError" class="upload-error">{{ imageError }}</div>
            </div>
          </div>
        </el-form-item>
        <el-form-item label="跳转页面" prop="jumpUrl">
          <el-input v-model="form.jumpUrl" maxlength="200" placeholder="请输入点击 Banner 后跳转的页面地址" />
        </el-form-item>
        <el-form-item label="关联产品" prop="productId">
          <el-select v-model="form.productId" placeholder="请选择关联产品" clearable>
            <el-option v-for="product in productOptions" :key="product.productId" :label="product.productName" :value="product.productId" />
          </el-select>
          <div class="product-tip">下拉列表展示所有已启用状态的产品</div>
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

<script setup name="BannerManagement" lang="ts">
import { addBanner, changeBannerStatus, deleteBanner, getBanner, listBanner, listEnabledBannerProducts, updateBanner } from '@/api/product/banner';
import { BannerForm, BannerProductOption, BannerQuery, BannerVO } from '@/api/product/banner/types';
import { Picture } from '@element-plus/icons-vue';

const { proxy } = getCurrentInstance() as ComponentInternalInstance;

const bannerList = ref<BannerVO[]>([]);
const productOptions = ref<BannerProductOption[]>([]);
const loading = ref(false);
const buttonLoading = ref(false);
const total = ref(0);
const imageError = ref('');
const queryFormRef = ref<ElFormInstance>();
const bannerFormRef = ref<ElFormInstance>();

const dialog = reactive<DialogOption>({
  visible: false,
  title: ''
});

const initFormData: BannerForm = {
  bannerId: undefined,
  image: '',
  jumpUrl: '',
  productId: undefined,
  status: '0'
};

const validateJumpUrl = (_rule: unknown, value: string, callback: (error?: Error) => void) => {
  if (!value || value.startsWith('/')) return callback();
  try {
    const url = new URL(value);
    if (!['http:', 'https:'].includes(url.protocol)) throw new Error();
    callback();
  } catch {
    callback(new Error('请输入以 /、http:// 或 https:// 开头的有效地址'));
  }
};

const data = reactive<PageData<BannerForm, BannerQuery>>({
  form: { ...initFormData },
  queryParams: {
    pageNum: 1,
    pageSize: 10,
    jumpUrl: '',
    productId: '',
    status: ''
  },
  rules: {
    image: [{ required: true, message: '请上传 Banner 图', trigger: 'change' }],
    jumpUrl: [{ validator: validateJumpUrl, trigger: 'blur' }]
  }
});

const { form, queryParams, rules } = toRefs(data);

const getList = async () => {
  loading.value = true;
  try {
    const result = await listBanner(queryParams.value);
    bannerList.value = result.rows;
    total.value = result.total;
  } finally {
    loading.value = false;
  }
};

const getProductOptions = async () => {
  productOptions.value = await listEnabledBannerProducts();
};

const handleQuery = () => {
  queryParams.value.pageNum = 1;
  getList();
};

const resetQuery = () => {
  queryFormRef.value?.resetFields();
  queryParams.value.productId = '';
  queryParams.value.status = '';
  handleQuery();
};

const resetForm = () => {
  form.value = { ...initFormData };
  imageError.value = '';
  bannerFormRef.value?.resetFields();
};

const handleAdd = () => {
  resetForm();
  dialog.title = '新增 Banner 图';
  dialog.visible = true;
};

const handleUpdate = async (row: BannerVO) => {
  resetForm();
  const banner = await getBanner(row.bannerId);
  form.value = {
    bannerId: banner.bannerId,
    image: banner.image,
    jumpUrl: banner.jumpUrl,
    productId: banner.productId,
    status: banner.status
  };
  dialog.title = '编辑 Banner 图';
  dialog.visible = true;
};

const handleBannerChange = (uploadFile: UploadFile) => {
  const file = uploadFile.raw;
  imageError.value = '';
  if (!file) return;
  if (!['image/jpeg', 'image/png'].includes(file.type)) {
    imageError.value = '图片格式不支持，请上传 JPG 或 PNG 图片';
    return;
  }
  if (file.size > 2 * 1024 * 1024) {
    imageError.value = '图片大小超出限制，请上传不超过 2MB 的图片';
    return;
  }
  const reader = new FileReader();
  reader.onload = () => {
    form.value.image = String(reader.result || '');
    bannerFormRef.value?.clearValidate('image');
  };
  reader.readAsDataURL(file);
};

const cancel = () => {
  dialog.visible = false;
};

const submitForm = () => {
  bannerFormRef.value?.validate(async (valid: boolean) => {
    if (!valid || imageError.value) return;
    buttonLoading.value = true;
    try {
      if (form.value.bannerId) {
        await updateBanner(form.value);
      } else {
        await addBanner(form.value);
      }
      proxy?.$modal.msgSuccess('保存成功');
      dialog.visible = false;
      await getList();
    } finally {
      buttonLoading.value = false;
    }
  });
};

const handleStatusChange = async (row: BannerVO) => {
  await changeBannerStatus(row.bannerId, row.status);
  proxy?.$modal.msgSuccess(`已${row.status === '0' ? '启用' : '停用'}该 Banner 图`);
};

const handleDelete = async (row: BannerVO) => {
  await proxy?.$modal.confirm('确认删除该 Banner 图吗？删除后不可恢复。');
  await deleteBanner(row.bannerId);
  if (bannerList.value.length === 1 && queryParams.value.pageNum > 1) {
    queryParams.value.pageNum--;
  }
  await getList();
  proxy?.$modal.msgSuccess('删除成功');
};

onMounted(async () => {
  await getProductOptions();
  await getList();
});
</script>

<style lang="scss" scoped>
.banner-management-page {
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
  align-items: flex-end;
  gap: 0 16px;

  :deep(.el-form-item) {
    margin-bottom: 0;
  }

  :deep(.el-form-item__label) {
    height: auto;
    margin-bottom: 6px;
    padding: 0;
    line-height: 20px;
  }

  :deep(.el-input) {
    width: 220px;
  }

  :deep(.el-select) {
    width: 200px;
  }
}

.search-actions {
  :deep(.el-form-item__content) {
    height: 32px;
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

.banner-thumbnail {
  display: block;
  width: 140px;
  height: 60px;
  margin: 0 auto;
  border-radius: 8px;
  object-fit: cover;
}

.banner-link {
  color: var(--el-color-primary);
}

.banner-upload-field {
  display: flex;
  align-items: flex-start;
  gap: 16px;
}

.banner-preview-box {
  display: flex;
  overflow: hidden;
  align-items: center;
  justify-content: center;
  width: 240px;
  height: 104px;
  flex: 0 0 240px;
  border: 1px dashed var(--el-border-color);
  border-radius: 8px;
  background: var(--el-fill-color-lighter);
}

.banner-preview {
  display: block;
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.banner-placeholder {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 6px;
  color: var(--el-text-color-secondary);
  font-size: 13px;

  .el-icon {
    font-size: 32px;
  }
}

.banner-upload-block {
  display: flex;
  min-width: 0;
  flex-direction: column;
  align-items: flex-start;

  :deep(.el-button) {
    height: 38px;
    padding: 0 16px;
    border-radius: 6px;
  }
}

.upload-tip,
.product-tip {
  color: var(--el-text-color-secondary);
  font-size: 12px;
  line-height: 18px;
}

.upload-tip {
  width: 210px;
  margin-top: 6px;
}

.upload-error {
  margin-top: 2px;
  color: var(--el-color-danger);
  font-size: 12px;
  line-height: 18px;
}

.product-tip {
  margin-top: 6px;
}

:global(.el-overlay .el-overlay-dialog .el-dialog.banner-management-dialog) {
  --el-dialog-padding-primary: 0;
  overflow: hidden;
  border-radius: 10px;
}

:global(.el-overlay .el-overlay-dialog .banner-management-dialog .el-dialog__header) {
  box-sizing: border-box;
  height: 60px;
  margin: 0;
  padding: 20px 24px 17px;
  border-bottom: 1px solid var(--el-border-color-lighter);
}

:global(.banner-management-dialog .el-dialog__title) {
  color: var(--el-text-color-primary);
  font-size: 18px;
  font-weight: 600;
  line-height: 23px;
}

:global(.banner-management-dialog .el-dialog__headerbtn) {
  top: 6px;
  right: 8px;
  width: 48px;
  height: 48px;
  font-size: 20px;
}

:global(.el-overlay .el-overlay-dialog .banner-management-dialog .el-dialog__body) {
  padding: 20px 24px 16px !important;
}

:global(.banner-management-dialog .el-dialog__footer) {
  padding: 16px 24px;
  border-top: 1px solid var(--el-border-color-lighter);
}

:global(.banner-management-dialog .banner-dialog-form .el-form-item) {
  margin-bottom: 16px;
}

:global(.banner-management-dialog .banner-dialog-form .el-form-item:last-child) {
  margin-bottom: 0;
}

:global(.banner-management-dialog .banner-dialog-form .el-form-item__label) {
  height: auto;
  margin-bottom: 6px;
  padding: 0;
  color: var(--el-text-color-regular);
  line-height: 20px;
}

:global(.banner-management-dialog .banner-dialog-form .el-input__wrapper),
:global(.banner-management-dialog .banner-dialog-form .el-select__wrapper) {
  min-height: 40px;
  border-radius: 6px;
}

:global(.banner-management-dialog .banner-dialog-form .el-select) {
  width: 100%;
}

:global(.banner-management-dialog .dialog-footer) {
  display: flex;
  justify-content: flex-end;
  gap: 10px;
}

:global(.banner-management-dialog .dialog-footer .el-button) {
  min-width: 60px;
  height: 36px;
  margin-left: 0;
  border-radius: 6px;
}

@media (max-width: 767px) {
  .banner-management-page {
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

  .banner-upload-field {
    flex-direction: column;
  }

  .banner-preview-box {
    width: 100%;
    flex-basis: auto;
  }

  .upload-tip {
    width: auto;
  }

  :global(.el-overlay .el-overlay-dialog .banner-management-dialog .el-dialog__header) {
    padding-right: 20px;
    padding-left: 20px;
  }

  :global(.el-overlay .el-overlay-dialog .banner-management-dialog .el-dialog__body) {
    padding: 18px 20px 14px !important;
  }

  :global(.banner-management-dialog .el-dialog__footer) {
    padding-right: 20px;
    padding-left: 20px;
  }
}
</style>
