<template>
  <section class="introduction-config">
    <header class="intro-heading">
      <div>
        <div class="intro-eyebrow">销售端页面配置</div>
        <h2>产品介绍页</h2>
        <p>配置家长进入投保流程前看到的介绍内容、主视觉媒体和客服信息。</p>
      </div>
      <el-tag effect="plain" type="info">修改后影响销售端展示</el-tag>
    </header>

    <div class="intro-layout">
      <div class="intro-form-column">
        <article class="intro-card">
          <header class="intro-card-header">
            <span class="step-number">1</span>
            <div>
              <h3>顶部介绍内容</h3>
              <p>支持标题、段落、列表、链接和图片，销售端将按此内容直接展示。</p>
            </div>
            <span class="content-count">{{ introductionLength }} 字</span>
          </header>
          <div class="editor-shell">
            <Editor v-model="model.introduction" :height="260" :min-height="260" />
          </div>
        </article>

        <article class="intro-card">
          <header class="intro-card-header">
            <span class="step-number">2</span>
            <div>
              <h3>主视觉媒体</h3>
              <p>视频和图片轮播二选一。保存时只会提交当前选中的媒体类型。</p>
            </div>
            <el-tag type="primary" effect="light">{{ mediaTypeLabel }}</el-tag>
          </header>

          <div class="media-mode-grid" role="radiogroup" aria-label="主视觉媒体类型">
            <button
              type="button"
              class="media-mode-card"
              :class="{ active: model.introductionMediaType === 'video' }"
              @click="selectMediaType('video')"
            >
              <span class="mode-icon"
                ><el-icon><VideoCamera /></el-icon
              ></span>
              <span class="mode-copy">
                <b>宣传视频</b>
                <small>适合品牌介绍、家长信或产品讲解</small>
              </span>
              <span class="mode-check">{{ model.introductionMediaType === 'video' ? '✓' : '' }}</span>
            </button>
            <button
              type="button"
              class="media-mode-card"
              :class="{ active: model.introductionMediaType === 'carousel' }"
              @click="selectMediaType('carousel')"
            >
              <span class="mode-icon"
                ><el-icon><Picture /></el-icon
              ></span>
              <span class="mode-copy">
                <b>图片轮播</b>
                <small>适合多张海报、保障亮点或活动说明</small>
              </span>
              <span class="mode-check">{{ model.introductionMediaType === 'carousel' ? '✓' : '' }}</span>
            </button>
          </div>

          <div v-if="model.introductionMediaType === 'video'" class="media-panel">
            <div v-if="model.introductionVideoUrl" class="video-resource">
              <div class="video-preview">
                <video :src="model.introductionVideoUrl" :poster="model.introductionVideoPoster || undefined" controls preload="metadata"></video>
              </div>
              <div class="resource-meta">
                <div>
                  <b>{{ model.introductionVideoName || '已配置视频' }}</b>
                  <p>视频已就绪，可直接播放确认内容。</p>
                </div>
                <div class="resource-actions">
                  <el-upload
                    accept="video/mp4,video/quicktime,video/webm"
                    :auto-upload="false"
                    :show-file-list="false"
                    :on-change="handleVideoChange"
                  >
                    <el-button>替换视频</el-button>
                  </el-upload>
                  <el-button type="danger" plain @click="removeVideo">移除</el-button>
                </div>
              </div>
            </div>

            <el-upload
              v-else
              class="media-upload"
              drag
              accept="video/mp4,video/quicktime,video/webm"
              :auto-upload="false"
              :show-file-list="false"
              :on-change="handleVideoChange"
            >
              <el-icon class="upload-icon"><UploadFilled /></el-icon>
              <div class="upload-title">点击或拖拽上传视频</div>
              <div class="upload-tip">支持 MP4、MOV、WebM，建议 16:9，文件不超过 100MB</div>
            </el-upload>

            <div class="video-settings">
              <div class="poster-field">
                <div v-if="model.introductionVideoPoster" class="poster-preview">
                  <img :src="model.introductionVideoPoster" alt="视频封面预览" />
                </div>
                <div class="poster-copy">
                  <b>视频封面 <span>选填</span></b>
                  <small>视频未播放或加载失败时展示，建议 16:9</small>
                  <div class="poster-actions">
                    <el-upload accept="image/jpeg,image/png,image/webp" :auto-upload="false" :show-file-list="false" :on-change="handlePosterChange">
                      <el-button link type="primary">{{ model.introductionVideoPoster ? '更换封面' : '上传封面' }}</el-button>
                    </el-upload>
                    <el-button v-if="model.introductionVideoPoster" link type="danger" @click="removePoster">移除</el-button>
                  </div>
                </div>
              </div>
              <div class="switch-settings">
                <label><span>进入页面自动播放</span><el-switch v-model="model.introductionVideoAutoplay" /></label>
                <label><span>自动播放时静音</span><el-switch v-model="model.introductionVideoMuted" /></label>
              </div>
            </div>
          </div>

          <div v-else class="media-panel carousel-panel">
            <div class="carousel-toolbar">
              <div>
                <b>轮播图片</b>
                <p>按下方顺序展示，支持 1–8 张图片。</p>
              </div>
              <el-upload accept="image/jpeg,image/png,image/webp" :auto-upload="false" :show-file-list="false" :on-change="handleCarouselImageChange">
                <el-button type="primary" plain :disabled="model.introductionCarouselImages.length >= 8">
                  <el-icon><Plus /></el-icon>添加图片
                </el-button>
              </el-upload>
            </div>

            <div v-if="model.introductionCarouselImages.length" class="carousel-list">
              <div v-for="(image, index) in model.introductionCarouselImages" :key="image.id" class="carousel-item">
                <span class="image-order">{{ index + 1 }}</span>
                <img :src="image.url" :alt="image.name" />
                <div class="image-meta">
                  <b>{{ image.name }}</b>
                  <small>建议尺寸 1125 × 633，画面比例 16:9</small>
                </div>
                <div class="image-actions">
                  <el-button link :disabled="index === 0" aria-label="上移图片" @click="moveImage(index, -1)">
                    <el-icon><ArrowUp /></el-icon>
                  </el-button>
                  <el-button
                    link
                    :disabled="index === model.introductionCarouselImages.length - 1"
                    aria-label="下移图片"
                    @click="moveImage(index, 1)"
                  >
                    <el-icon><ArrowDown /></el-icon>
                  </el-button>
                  <el-button link type="danger" aria-label="删除图片" @click="removeImage(index)">
                    <el-icon><Delete /></el-icon>
                  </el-button>
                </div>
              </div>
            </div>

            <el-upload
              v-else
              class="media-upload compact"
              drag
              accept="image/jpeg,image/png,image/webp"
              :auto-upload="false"
              :show-file-list="false"
              :on-change="handleCarouselImageChange"
            >
              <el-icon class="upload-icon"><Picture /></el-icon>
              <div class="upload-title">添加第一张轮播图片</div>
              <div class="upload-tip">支持 JPG、PNG、WebP，单张不超过 5MB</div>
            </el-upload>

            <div class="carousel-setting">
              <div>
                <b>自动轮播间隔</b>
                <small>建议 3–5 秒，过短会影响阅读。</small>
              </div>
              <el-input-number v-model="model.introductionCarouselInterval" :min="2" :max="10" :step="1" />
              <span>秒</span>
            </div>
          </div>
        </article>

        <article class="intro-card">
          <header class="intro-card-header">
            <span class="step-number">3</span>
            <div>
              <h3>客服信息</h3>
              <p>展示在介绍页媒体内容下方，未填写的项目不会在销售端占位。</p>
            </div>
            <el-tag effect="plain">选填</el-tag>
          </header>
          <el-form :model="model" label-position="top" class="service-form">
            <el-form-item label="客服电话">
              <el-input v-model="model.customerServicePhone" maxlength="30" placeholder="例如：400-888-8888" />
            </el-form-item>
            <el-form-item label="服务时间">
              <el-input v-model="model.customerServiceHours" maxlength="50" placeholder="例如：周一至周日 9:00–21:00" />
            </el-form-item>
            <el-form-item label="补充说明" class="service-remark">
              <el-input v-model="model.customerServiceRemark" maxlength="100" placeholder="例如：点击电话可直接拨打" />
            </el-form-item>
          </el-form>
        </article>
      </div>
    </div>
  </section>
</template>

<script setup lang="ts">
import { ArrowDown, ArrowUp, Delete, Picture, Plus, UploadFilled, VideoCamera } from '@element-plus/icons-vue';
import type { UploadFile } from 'element-plus';
import type { IntroductionMediaType, ProductConfig } from '@/api/product/productManagement/types';

const model = defineModel<ProductConfig>({ required: true });

const introductionLength = computed(
  () =>
    (model.value.introduction || '')
      .replace(/<[^>]*>/g, '')
      .replace(/&nbsp;/g, ' ')
      .trim().length
);
const mediaTypeLabel = computed(() => (model.value.introductionMediaType === 'video' ? '当前：宣传视频' : '当前：图片轮播'));

const selectMediaType = (type: IntroductionMediaType) => {
  model.value.introductionMediaType = type;
};

const validateImage = (file: File) => {
  if (!['image/jpeg', 'image/png', 'image/webp'].includes(file.type)) {
    ElMessage.warning('图片格式不支持，请上传 JPG、PNG 或 WebP 图片');
    return false;
  }
  if (file.size > 5 * 1024 * 1024) {
    ElMessage.warning('单张图片不能超过 5MB');
    return false;
  }
  return true;
};

const readImage = (file: File) =>
  new Promise<string>((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result || ''));
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });

const revokeBlobUrl = (url: string) => {
  if (url.startsWith('blob:')) URL.revokeObjectURL(url);
};

const handleVideoChange = (uploadFile: UploadFile) => {
  const file = uploadFile.raw;
  if (!file) return;
  const supported = ['video/mp4', 'video/quicktime', 'video/webm'].includes(file.type) || /\.(mp4|mov|webm)$/i.test(file.name);
  if (!supported) {
    ElMessage.warning('视频格式不支持，请上传 MP4、MOV 或 WebM 视频');
    return;
  }
  if (file.size > 100 * 1024 * 1024) {
    ElMessage.warning('视频文件不能超过 100MB');
    return;
  }
  revokeBlobUrl(model.value.introductionVideoUrl);
  model.value.introductionVideoUrl = URL.createObjectURL(file);
  model.value.introductionVideoName = file.name;
};

const removeVideo = () => {
  revokeBlobUrl(model.value.introductionVideoUrl);
  model.value.introductionVideoUrl = '';
  model.value.introductionVideoName = '';
};

const handlePosterChange = async (uploadFile: UploadFile) => {
  const file = uploadFile.raw;
  if (!file || !validateImage(file)) return;
  model.value.introductionVideoPoster = await readImage(file);
  model.value.introductionVideoPosterName = file.name;
};

const removePoster = () => {
  model.value.introductionVideoPoster = '';
  model.value.introductionVideoPosterName = '';
};

const handleCarouselImageChange = async (uploadFile: UploadFile) => {
  const file = uploadFile.raw;
  if (!file || !validateImage(file)) return;
  if (model.value.introductionCarouselImages.length >= 8) {
    ElMessage.warning('轮播图片最多上传 8 张');
    return;
  }
  model.value.introductionCarouselImages.push({
    id: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
    name: file.name,
    url: await readImage(file)
  });
};

const moveImage = (index: number, step: number) => {
  const target = index + step;
  if (target < 0 || target >= model.value.introductionCarouselImages.length) return;
  [model.value.introductionCarouselImages[index], model.value.introductionCarouselImages[target]] = [
    model.value.introductionCarouselImages[target],
    model.value.introductionCarouselImages[index]
  ];
};

const removeImage = (index: number) => {
  model.value.introductionCarouselImages.splice(index, 1);
};
</script>

<style scoped lang="scss">
.introduction-config {
  color: #1f2937;
}

.intro-heading {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 20px;
  margin-bottom: 22px;
  padding: 0 2px;
}

.intro-heading h2 {
  margin: 2px 0 7px;
  font-size: 22px;
  line-height: 1.35;
}

.intro-heading p,
.intro-card-header p,
.carousel-toolbar p {
  margin: 0;
  color: #7b8794;
  font-size: 13px;
  line-height: 1.6;
}

.intro-eyebrow {
  color: #1696d2;
  font-size: 12px;
  font-weight: 700;
  letter-spacing: 0.08em;
}

.intro-form-column {
  display: grid;
  gap: 18px;
  min-width: 0;
}

.intro-card {
  padding: 20px;
  border: 1px solid #e4eaf0;
  border-radius: 12px;
  background: #fff;
  box-shadow: 0 6px 20px rgba(31, 41, 55, 0.04);
}

.intro-card-header {
  display: grid;
  grid-template-columns: 34px minmax(0, 1fr) auto;
  gap: 12px;
  align-items: start;
  margin-bottom: 18px;
}

.intro-card-header h3 {
  margin: 0 0 4px;
  font-size: 16px;
}

.step-number {
  width: 32px;
  height: 32px;
  display: grid;
  place-items: center;
  border-radius: 9px;
  background: linear-gradient(135deg, #2bb8f0, #1688d3);
  color: #fff;
  font-weight: 700;
}

.content-count {
  color: #9aa4b2;
  font-size: 12px;
}

.editor-shell {
  overflow: hidden;
  border: 1px solid #dfe6ed;
  border-radius: 8px;
}

.editor-shell :deep(.ql-toolbar) {
  border: 0;
  border-bottom: 1px solid #e6ebf0;
  background: #f8fafc;
}

.editor-shell :deep(.ql-container) {
  border: 0;
}

.media-mode-grid {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 12px;
  margin-bottom: 18px;
}

.media-mode-card {
  position: relative;
  min-height: 86px;
  padding: 16px;
  display: grid;
  grid-template-columns: 44px minmax(0, 1fr) 24px;
  gap: 12px;
  align-items: center;
  text-align: left;
  border: 1px solid #dfe6ed;
  border-radius: 10px;
  background: #fff;
  color: #283545;
  cursor: pointer;
  transition: 0.2s ease;
}

.media-mode-card:hover,
.media-mode-card.active {
  border-color: #29aee8;
  background: #f1faff;
  box-shadow: inset 0 0 0 1px #29aee8;
}

.mode-icon {
  width: 44px;
  height: 44px;
  display: grid;
  place-items: center;
  border-radius: 12px;
  background: #edf5fb;
  color: #298ec5;
  font-size: 22px;
}

.media-mode-card.active .mode-icon {
  background: #d9f3ff;
  color: #128ed0;
}

.mode-copy {
  min-width: 0;
  display: flex;
  flex-direction: column;
  gap: 5px;
}

.mode-copy small {
  color: #87919e;
  line-height: 1.4;
}

.mode-check {
  width: 22px;
  height: 22px;
  display: grid;
  place-items: center;
  border: 1px solid #ccd5df;
  border-radius: 50%;
  color: #fff;
}

.media-mode-card.active .mode-check {
  border-color: #1da4e1;
  background: #1da4e1;
}

.media-panel {
  padding: 16px;
  border: 1px solid #e7edf2;
  border-radius: 10px;
  background: #fbfcfd;
}

.media-upload,
.media-upload :deep(.el-upload),
.media-upload :deep(.el-upload-dragger) {
  width: 100%;
}

.media-upload :deep(.el-upload-dragger) {
  min-height: 190px;
  padding: 34px 20px;
  border-color: #b9d9e8;
  background: #f5fbfe;
}

.media-upload.compact :deep(.el-upload-dragger) {
  min-height: 148px;
  padding: 24px 20px;
}

.upload-icon {
  margin-bottom: 10px;
  color: #29a8df;
  font-size: 38px;
}

.upload-title {
  color: #273444;
  font-size: 15px;
  font-weight: 600;
}

.upload-tip {
  margin-top: 7px;
  color: #8d99a6;
  font-size: 12px;
}

.video-resource {
  overflow: hidden;
  border: 1px solid #dfe6ed;
  border-radius: 10px;
  background: #fff;
}

.video-preview {
  aspect-ratio: 16 / 9;
  background: #111827;
}

.video-preview video {
  width: 100%;
  height: 100%;
  display: block;
  object-fit: contain;
}

.resource-meta {
  padding: 14px 16px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 16px;
}

.resource-meta b,
.image-meta b {
  display: block;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.resource-meta p {
  margin: 5px 0 0;
  color: #8b96a3;
  font-size: 12px;
}

.resource-actions,
.poster-actions,
.image-actions {
  display: flex;
  align-items: center;
  gap: 8px;
}

.video-settings {
  display: grid;
  grid-template-columns: minmax(0, 1.2fr) minmax(220px, 0.8fr);
  gap: 14px;
  margin-top: 14px;
}

.poster-field,
.switch-settings {
  padding: 14px;
  border: 1px solid #e5ebf0;
  border-radius: 9px;
  background: #fff;
}

.poster-field {
  display: flex;
  align-items: center;
  gap: 13px;
}

.poster-preview {
  width: 104px;
  aspect-ratio: 16 / 9;
  overflow: hidden;
  flex: 0 0 auto;
  border-radius: 7px;
  background: #eef2f5;
}

.poster-preview img,
.carousel-item img {
  width: 100%;
  height: 100%;
  display: block;
  object-fit: cover;
}

.poster-copy {
  min-width: 0;
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  gap: 5px;
}

.poster-copy b span {
  color: #9aa4b0;
  font-size: 12px;
  font-weight: 400;
}

.poster-copy small,
.carousel-toolbar small,
.image-meta small {
  color: #8b96a3;
  line-height: 1.4;
}

.switch-settings {
  display: grid;
  align-content: center;
  gap: 12px;
}

.switch-settings label {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  color: #4b5563;
  font-size: 13px;
}

.carousel-toolbar,
.carousel-setting {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 16px;
}

.carousel-toolbar {
  margin-bottom: 14px;
}

.carousel-list {
  display: grid;
  gap: 10px;
}

.carousel-item {
  min-width: 0;
  padding: 10px;
  display: grid;
  grid-template-columns: 28px 116px minmax(0, 1fr) auto;
  gap: 12px;
  align-items: center;
  border: 1px solid #e2e8ef;
  border-radius: 9px;
  background: #fff;
}

.carousel-item img {
  aspect-ratio: 16 / 9;
  border-radius: 6px;
}

.image-order {
  width: 26px;
  height: 26px;
  display: grid;
  place-items: center;
  border-radius: 50%;
  background: #edf6fb;
  color: #218fca;
  font-size: 12px;
  font-weight: 700;
}

.image-meta {
  min-width: 0;
}

.image-meta small {
  display: block;
  margin-top: 5px;
}

.carousel-setting {
  justify-content: flex-start;
  margin-top: 14px;
  padding: 14px;
  border-radius: 9px;
  background: #eef8fd;
}

.carousel-setting > div:first-child {
  margin-right: auto;
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.carousel-setting small {
  color: #7f8c98;
}

.carousel-setting :deep(.el-input-number) {
  width: 112px;
}

.service-form {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 0 16px;
}

.service-remark {
  grid-column: 1 / -1;
}

@media (max-width: 767px) {
  .intro-heading,
  .resource-meta,
  .carousel-toolbar {
    align-items: flex-start;
    flex-direction: column;
  }

  .media-mode-grid,
  .video-settings,
  .service-form {
    grid-template-columns: 1fr;
  }

  .service-remark {
    grid-column: auto;
  }

  .intro-card {
    padding: 15px;
  }

  .intro-card-header {
    grid-template-columns: 32px minmax(0, 1fr);
  }

  .intro-card-header > :last-child {
    grid-column: 2;
    justify-self: start;
  }

  .carousel-item {
    grid-template-columns: 28px 92px minmax(0, 1fr);
  }

  .image-actions {
    grid-column: 2 / -1;
    justify-content: flex-end;
  }
}
</style>
