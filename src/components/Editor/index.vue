<template>
  <div>
    <el-upload
      v-if="type === 'url'"
      :action="upload.url"
      :before-upload="handleBeforeUpload"
      :on-success="handleUploadSuccess"
      :on-error="handleUploadError"
      class="editor-img-uploader"
      name="file"
      :show-file-list="false"
      :headers="upload.headers"
    >
      <i ref="uploadRef"></i>
    </el-upload>
    <el-upload
      v-if="type === 'url' && videoUpload"
      :action="upload.url"
      :before-upload="handleBeforeVideoUpload"
      :on-success="handleVideoUploadSuccess"
      :on-error="handleUploadError"
      accept="video/mp4,video/quicktime,video/webm,video/ogg,video/x-msvideo"
      class="editor-video-uploader"
      name="file"
      :show-file-list="false"
      :headers="upload.headers"
    >
      <i ref="videoUploadRef"></i>
    </el-upload>
  </div>
  <div class="editor">
    <quill-editor
      ref="quillEditorRef"
      v-model:content="content"
      content-type="html"
      :options="options"
      :style="styles"
      @text-change="(e: any) => $emit('update:modelValue', content)"
    />
  </div>
</template>

<script setup lang="ts">
import '@vueup/vue-quill/dist/vue-quill.snow.css';

import { QuillEditor, Quill } from '@vueup/vue-quill';
import { propTypes } from '@/utils/propTypes';
import { globalHeaders } from '@/utils/request';

const QuillRuntime = Quill as any;
if (!QuillRuntime.imports['formats/uploadedVideo']) {
  const BlockEmbed = QuillRuntime.import('blots/block/embed');
  class UploadedVideoBlot extends BlockEmbed {
    static create(url: string) {
      const node = super.create();
      node.setAttribute('src', url);
      node.setAttribute('controls', 'controls');
      node.setAttribute('preload', 'metadata');
      return node;
    }

    static value(node: HTMLVideoElement) {
      return node.getAttribute('src');
    }
  }
  UploadedVideoBlot.blotName = 'uploadedVideo';
  UploadedVideoBlot.tagName = 'video';
  QuillRuntime.register(UploadedVideoBlot);
}

defineEmits(['update:modelValue']);

const props = defineProps({
  /* 编辑器的内容 */
  modelValue: propTypes.string,
  /* 高度 */
  height: propTypes.number.def(400),
  /* 最小高度 */
  minHeight: propTypes.number.def(400),
  /* 只读 */
  readOnly: propTypes.bool.def(false),
  /* 上传文件大小限制(MB) */
  fileSize: propTypes.number.def(5),
  /* 类型（base64格式、url格式） */
  type: propTypes.string.def('url'),
  /* 是否将视频按钮改为本地文件上传 */
  videoUpload: propTypes.bool.def(false),
  /* 上传视频大小限制(MB) */
  videoFileSize: propTypes.number.def(100)
});

const { proxy } = getCurrentInstance() as ComponentInternalInstance;

const upload = reactive<UploadOption>({
  headers: globalHeaders(),
  url: import.meta.env.VITE_APP_BASE_API + '/resource/oss/upload'
});
const quillEditorRef = ref();
const uploadRef = ref<HTMLDivElement>();
const videoUploadRef = ref<HTMLDivElement>();

const toolbarHandlers: Record<string, (value: boolean) => void> = {
  image: (value: boolean) => {
    if (value) {
      uploadRef.value?.click();
    } else {
      Quill.format('image', true);
    }
  }
};

if (props.videoUpload) {
  toolbarHandlers.video = (value: boolean) => {
    if (value) videoUploadRef.value?.click();
  };
}

const options = ref<any>({
  theme: 'snow',
  bounds: document.body,
  debug: 'warn',
  modules: {
    // 工具栏配置
    toolbar: {
      container: [
        ['bold', 'italic', 'underline', 'strike'], // 加粗 斜体 下划线 删除线
        ['blockquote', 'code-block'], // 引用  代码块
        [{ list: 'ordered' }, { list: 'bullet' }], // 有序、无序列表
        [{ indent: '-1' }, { indent: '+1' }], // 缩进
        [{ size: ['small', false, 'large', 'huge'] }], // 字体大小
        [{ header: [1, 2, 3, 4, 5, 6, false] }], // 标题
        [{ color: [] }, { background: [] }], // 字体颜色、字体背景颜色
        [{ align: [] }], // 对齐方式
        ['clean'], // 清除文本格式
        ['link', 'image', 'video'] // 链接、图片、视频
      ],
      handlers: toolbarHandlers
    }
  },
  placeholder: '请输入内容',
  readOnly: props.readOnly
});

const styles = computed(() => {
  const style: any = {};
  if (props.minHeight) {
    style.minHeight = `${props.minHeight}px`;
  }
  if (props.height) {
    style.height = `${props.height}px`;
  }
  return style;
});

const content = ref('');
watch(
  () => props.modelValue,
  (v: string) => {
    if (v !== content.value) {
      content.value = v || '<p></p>';
    }
  },
  { immediate: true }
);

const insertEmbed = (type: 'image' | 'uploadedVideo', url: string) => {
  const quill = toRaw(quillEditorRef.value).getQuill();
  const range = quill.getSelection(true);
  const index = range?.index ?? Math.max(0, quill.getLength() - 1);
  quill.insertEmbed(index, type, url);
  quill.setSelection(index + 1);
};

// 图片上传成功返回图片地址
const handleUploadSuccess = (res: any) => {
  // 如果上传成功
  if (res.code === 200) {
    insertEmbed('image', res.data.url);
    proxy?.$modal.closeLoading();
  } else {
    proxy?.$modal.msgError('图片插入失败');
    proxy?.$modal.closeLoading();
  }
};

const handleVideoUploadSuccess = (res: any) => {
  if (res.code === 200) {
    insertEmbed('uploadedVideo', res.data.url);
    proxy?.$modal.closeLoading();
  } else {
    proxy?.$modal.msgError('视频插入失败');
    proxy?.$modal.closeLoading();
  }
};

// 图片上传前拦截
const handleBeforeUpload = (file: any) => {
  const type = ['image/jpeg', 'image/jpg', 'image/png', 'image/svg'];
  const isJPG = type.includes(file.type);
  //检验文件格式
  if (!isJPG) {
    proxy?.$modal.msgError(`图片格式错误!`);
    return false;
  }
  // 校检文件大小
  if (props.fileSize) {
    const isLt = file.size / 1024 / 1024 < props.fileSize;
    if (!isLt) {
      proxy?.$modal.msgError(`上传文件大小不能超过 ${props.fileSize} MB!`);
      return false;
    }
  }
  proxy?.$modal.loading('正在上传文件，请稍候...');
  return true;
};

const handleBeforeVideoUpload = (file: File) => {
  const supportedTypes = ['video/mp4', 'video/quicktime', 'video/webm', 'video/ogg', 'video/x-msvideo'];
  const supportedExtension = /\.(mp4|mov|webm|ogv|avi)$/i.test(file.name);
  if (!supportedTypes.includes(file.type) && !supportedExtension) {
    proxy?.$modal.msgError('视频格式错误，仅支持 MP4、MOV、WebM、OGV、AVI');
    return false;
  }
  if (props.videoFileSize && file.size / 1024 / 1024 > props.videoFileSize) {
    proxy?.$modal.msgError(`上传视频大小不能超过 ${props.videoFileSize} MB!`);
    return false;
  }
  proxy?.$modal.loading('正在上传视频，请稍候...');
  return true;
};

// 图片失败拦截
const handleUploadError = (err: any) => {
  proxy?.$modal.msgError('上传文件失败');
  proxy?.$modal.closeLoading();
};
</script>

<style>
.editor-img-uploader {
  display: none;
}
.editor-video-uploader {
  display: none;
}
.editor,
.ql-toolbar {
  white-space: pre-wrap !important;
  line-height: normal !important;
}
.ql-editor video {
  display: block;
  max-width: 100%;
  margin: 12px 0;
}
.quill-img {
  display: none;
}
.ql-snow .ql-tooltip[data-mode='link']::before {
  content: '请输入链接地址:';
}
.ql-snow .ql-tooltip.ql-editing a.ql-action::after {
  border-right: 0;
  content: '保存';
  padding-right: 0;
}
.ql-snow .ql-tooltip[data-mode='video']::before {
  content: '请输入视频地址:';
}
.ql-snow .ql-picker.ql-size .ql-picker-label::before,
.ql-snow .ql-picker.ql-size .ql-picker-item::before {
  content: '14px';
}
.ql-snow .ql-picker.ql-size .ql-picker-label[data-value='small']::before,
.ql-snow .ql-picker.ql-size .ql-picker-item[data-value='small']::before {
  content: '10px';
}
.ql-snow .ql-picker.ql-size .ql-picker-label[data-value='large']::before,
.ql-snow .ql-picker.ql-size .ql-picker-item[data-value='large']::before {
  content: '18px';
}
.ql-snow .ql-picker.ql-size .ql-picker-label[data-value='huge']::before,
.ql-snow .ql-picker.ql-size .ql-picker-item[data-value='huge']::before {
  content: '32px';
}
.ql-snow .ql-picker.ql-header .ql-picker-label::before,
.ql-snow .ql-picker.ql-header .ql-picker-item::before {
  content: '文本';
}
.ql-snow .ql-picker.ql-header .ql-picker-label[data-value='1']::before,
.ql-snow .ql-picker.ql-header .ql-picker-item[data-value='1']::before {
  content: '标题1';
}
.ql-snow .ql-picker.ql-header .ql-picker-label[data-value='2']::before,
.ql-snow .ql-picker.ql-header .ql-picker-item[data-value='2']::before {
  content: '标题2';
}
.ql-snow .ql-picker.ql-header .ql-picker-label[data-value='3']::before,
.ql-snow .ql-picker.ql-header .ql-picker-item[data-value='3']::before {
  content: '标题3';
}
.ql-snow .ql-picker.ql-header .ql-picker-label[data-value='4']::before,
.ql-snow .ql-picker.ql-header .ql-picker-item[data-value='4']::before {
  content: '标题4';
}
.ql-snow .ql-picker.ql-header .ql-picker-label[data-value='5']::before,
.ql-snow .ql-picker.ql-header .ql-picker-item[data-value='5']::before {
  content: '标题5';
}
.ql-snow .ql-picker.ql-header .ql-picker-label[data-value='6']::before,
.ql-snow .ql-picker.ql-header .ql-picker-item[data-value='6']::before {
  content: '标题6';
}
.ql-snow .ql-picker.ql-font .ql-picker-label::before,
.ql-snow .ql-picker.ql-font .ql-picker-item::before {
  content: '标准字体';
}
.ql-snow .ql-picker.ql-font .ql-picker-label[data-value='serif']::before,
.ql-snow .ql-picker.ql-font .ql-picker-item[data-value='serif']::before {
  content: '衬线字体';
}
.ql-snow .ql-picker.ql-font .ql-picker-label[data-value='monospace']::before,
.ql-snow .ql-picker.ql-font .ql-picker-item[data-value='monospace']::before {
  content: '等宽字体';
}
</style>
