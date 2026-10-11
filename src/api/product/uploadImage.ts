import request from '@/utils/request';

interface UploadResponse {
  url: string;
}

export const uploadProductFile = async (file: File): Promise<string> => {
  const data = new FormData();
  data.append('file', file);
  const response = await request<UploadResponse>({
    url: '/resource/oss/upload',
    method: 'post',
    data,
    headers: { repeatSubmit: false }
  });
  const url = response.data?.url;
  if (!url || /^(blob:|data:)/i.test(url)) throw new Error('上传接口未返回有效的文件地址');
  return url;
};

export const uploadProductImage = uploadProductFile;
