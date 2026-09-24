import request from '@/utils/request';

interface UploadResponse {
  url: string;
}

export const uploadProductImage = async (file: File): Promise<string> => {
  const data = new FormData();
  data.append('file', file);
  const response = await request<UploadResponse>({
    url: '/resource/oss/upload',
    method: 'post',
    data,
    headers: { repeatSubmit: false }
  });
  return response.data.url;
};
