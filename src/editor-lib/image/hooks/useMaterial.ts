/*
 * React/TypeScript version of useMaterial hook
 * Converted from Vue to React - removed auth/user dependencies
 */

import { useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { useCanvasContext } from '@/editor-lib/image/providers/canvas-provider';
import dayjs from 'dayjs';

// Material API functions (no auth needed)
const uploadImage = async (base64: string): Promise<string> => {
  // Convert base64 to file
  const dataURLtoFile = (dataurl: string, filename: string): File => {
    const arr = dataurl.split(',');
    const mime = arr[0].match(/:(.*?);/)?.[1] || 'image/png';
    const bstr = atob(arr[1]);
    const n = bstr.length;
    const u8arr = new Uint8Array(n);
    for (let i = 0; i < n; i++) {
      u8arr[i] = bstr.charCodeAt(i);
    }
    return new File([u8arr], filename, { type: mime });
  };

  const file = dataURLtoFile(base64, 'canvas.png');
  const formData = new FormData();
  const time = new Date();
  formData.append('files', file, `${time.getTime()}`);

  // Upload to your image service (e.g., ImageKit, Cloudinary, etc.)
  // This is a placeholder - implement based on your image upload service
  const response = await fetch('/api/imagekit/upload', {
    method: 'POST',
    body: formData,
  });

  if (!response.ok) {
    throw new Error('Failed to upload image');
  }

  const data = await response.json();
  return data.url || data.id;
};

export function useMaterial() {
  const router = useRouter();
  const { editor } = useCanvasContext();

  // Get canvas data as base64
  const getCanvasData = useCallback(async () => {
    if (!editor) throw new Error('Editor not initialized');
    
    const json = editor.getJson();
    const base64 = await editor.preview();
    const imageUrl = await uploadImage(base64);
    
    return {
      json,
      img: imageUrl,
      desc: '',
    };
  }, [editor]);

  // Create template (simplified - no user auth)
  const createTemplate = useCallback(
    async (width: number, height: number, parentId: string = '') => {
      if (!editor) throw new Error('Editor not initialized');

      editor.clear();
      editor.setSize(width, height);
      const name =
        dayjs().format('YYYY-MM-DD HH:mm:ss') + ' - Created Design';

      const data = await getCanvasData();
      
      // Save to Convex or your database
      // This is a placeholder - implement based on your database
      const templateData = {
        ...data,
        type: 'file',
        parentId: String(parentId),
        name,
        width,
        height,
      };

      // Navigate to editor with new project ID
      // router.push(`/editor/${templateId}`);
      
      return templateData;
    },
    [editor, getCanvasData]
  );

  // Get template info (placeholder)
  const getTemplateInfo = useCallback(async (id: string) => {
    // Fetch from your database
    // const response = await fetch(`/api/templates/${id}`);
    // return response.json();
    return null;
  }, []);

  // Update template (placeholder)
  const updateTemplate = useCallback(
    async (id: string, name?: string) => {
      if (!editor) throw new Error('Editor not initialized');

      const data = await getCanvasData();
      const templateData = {
        ...data,
        ...(name && { name }),
      };

      // Update in your database
      // await fetch(`/api/templates/${id}`, {
      //   method: 'PUT',
      //   body: JSON.stringify(data),
      // });
    },
    [editor, getCanvasData]
  );

  return {
    createTemplate,
    getTemplateInfo,
    updateTemplate,
    getCanvasData,
  };
}

