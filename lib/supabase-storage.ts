import { supabase } from '@/lib/db/queries';

// Upload file to Supabase Storage
export async function uploadFileToStorage(file: File, userId: string) {
  try {
    // Create a unique filename with timestamp and user ID
    const timestamp = Date.now();
    const fileExtension = file.name.split('.').pop();
    const fileName = `${userId}/${timestamp}-${file.name}`;

    console.log('Uploading file to Supabase Storage:', {
      fileName,
      size: file.size,
      type: file.type,
    });

    // Upload to the 'documents' bucket
    const { data, error } = await supabase.storage
      .from('documents')
      .upload(fileName, file, {
        cacheControl: '3600',
        upsert: false,
      });

    if (error) {
      console.error('Supabase Storage upload error:', error);
      throw new Error(`Upload failed: ${error.message}`);
    }

    // Get the public URL
    const { data: urlData } = supabase.storage
      .from('documents')
      .getPublicUrl(data.path);

    console.log('File uploaded successfully:', {
      path: data.path,
      url: urlData.publicUrl,
    });

    return {
      path: data.path,
      url: urlData.publicUrl,
      fileName: file.name,
      fileSize: file.size,
      fileType: file.type,
    };
  } catch (error) {
    console.error('Error uploading file to storage:', error);
    throw error;
  }
}

// Delete file from Supabase Storage
export async function deleteFileFromStorage(path: string) {
  try {
    const { error } = await supabase.storage.from('documents').remove([path]);

    if (error) {
      console.error('Supabase Storage delete error:', error);
      throw new Error(`Delete failed: ${error.message}`);
    }

    console.log('File deleted successfully:', path);
  } catch (error) {
    console.error('Error deleting file from storage:', error);
    throw error;
  }
}
