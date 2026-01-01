import { useState } from 'react';
import { isSupabaseConfigured, getSupabaseOrThrow } from '@/lib/supabase';
import { useToast } from '@/hooks/use-toast';

export interface SupabaseUploadResponse {
  fileId: string;
  name: string;
  size: number;
  filePath: string;
  url: string;
  thumbnailUrl: string;
  type: string;
}

interface UseSupabaseUploadOptions {
  folder?: string;
  onUploadComplete?: (response: SupabaseUploadResponse) => void;
  maxSize?: number;
}

export function useSupabaseUpload(options: UseSupabaseUploadOptions = {}) {
  const { toast } = useToast();
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);

  if (!isSupabaseConfigured()) {
    console.warn('[useSupabaseUpload] Supabase not configured — upload disabled');
  }
  const supabase = isSupabaseConfigured() ? getSupabaseOrThrow() : null;

  const uploadImage = async (file: File): Promise<SupabaseUploadResponse | null> => {
    const maxSize = (options.maxSize || 10) * 1024 * 1024;
    if (file.size > maxSize) {
      toast({
        title: 'File Too Large',
        description: `Maximum file size is ${options.maxSize || 10}MB`,
        variant: 'destructive',
      });
      return null;
    }

    const allowedTypes = ['image/jpeg', 'image/png', 'image/jpg', 'image/webp', 'image/gif'];
    if (!allowedTypes.includes(file.type)) {
      toast({
        title: 'Invalid File Type',
        description: 'Only JPG, PNG, WebP, and GIF files are allowed',
        variant: 'destructive',
      });
      return null;
    }

    setIsUploading(true);
    setUploadProgress(0);

    try {
      const bucket = 'property-images';
      const folder = options.folder || 'general';
      const timestamp = Date.now();
      const randomStr = Math.random().toString(36).substring(7);
      const fileName = `${timestamp}-${randomStr}-${file.name}`;
      const filePath = `${folder}/${fileName}`;

      console.log(`[UPLOAD] Attempting to upload to bucket: ${bucket}, path: ${filePath}`);

      const { data, error } = await getSupabaseOrThrow().storage
        .from(bucket)
        .upload(filePath, file, {
          cacheControl: '3600',
          upsert: false,
        });

      if (error) {
        console.error('[UPLOAD] Supabase storage error:', error);
        throw new Error(error.message);
      }

      const { data: publicData } = getSupabaseOrThrow().storage
        .from(bucket)
        .getPublicUrl(data.path);

      const uploadResponse: SupabaseUploadResponse = {
        fileId: data.id || data.path,
        name: file.name,
        size: file.size,
        filePath: data.path,
        url: publicData.publicUrl,
        thumbnailUrl: publicData.publicUrl,
        type: file.type,
      };

      setUploadProgress(100);
      options.onUploadComplete?.(uploadResponse);

      toast({
        title: 'Image Uploaded',
        description: `${file.name} has been uploaded successfully`,
      });

      return uploadResponse;
    } catch (error: any) {
      console.error('Supabase upload error:', error);
      toast({
        title: 'Upload Failed',
        description: error.message || 'Failed to upload image',
        variant: 'destructive',
      });
      return null;
    } finally {
      setIsUploading(false);
      setUploadProgress(0);
    }
  };

  return {
    uploadImage,
    isUploading,
    uploadProgress,
  };
}
