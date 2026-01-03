import { useState } from 'react';
import { isSupabaseConfigured, getSupabaseOrThrow } from '@/lib/supabase';
import { getAuthToken } from '@/lib/auth-context';
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

      // Attempt to save metadata server-side so inserts use the service role (bypass RLS)
      (async () => {
        try {
          const token = await getAuthToken();
          if (!token) return;

          const body = {
            imageKitFileId: uploadResponse.filePath,
            url: uploadResponse.url,
            thumbnailUrl: uploadResponse.thumbnailUrl,
            category: 'property',
            propertyId: null,
            metadata: { fileSize: uploadResponse.size, filePath: uploadResponse.filePath },
          };

          // show a UI indicator that metadata is being saved
          toast({ title: 'Saving metadata', description: 'Saving image metadata to server' });

          const resp = await fetch('/api/photos', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              Authorization: `Bearer ${token}`,
            },
            body: JSON.stringify(body),
          });

          if (!resp.ok) {
            const text = await resp.text().catch(() => '');
            console.warn('[UPLOAD] failed to persist photo metadata:', resp.status, text);
            toast({
              title: 'Upload metadata failed',
              description: 'Image uploaded but server failed to save metadata',
              variant: 'destructive',
            });
          }
        } catch (err: any) {
          console.warn('[UPLOAD] error saving photo metadata:', err);
          toast({
            title: 'Upload metadata error',
            description: err?.message || 'Failed to save upload metadata',
            variant: 'destructive',
          });
        }
      })();

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
