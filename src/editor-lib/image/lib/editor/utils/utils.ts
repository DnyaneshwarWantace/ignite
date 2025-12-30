/*
 * Utility functions for the image editor
 */
import { v4 as uuid } from 'uuid';
import { Point, Image, Group, IText, ActiveSelection } from 'fabric';

/**
 * Convert image file to base64 string
 * @param {Blob|File} file File to convert
 * @return {Promise<string>} Base64 string
 */
export function getImgStr(file: File | Blob): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

/**
 * Select files using file input dialog
 * @param {Object} options accept = '', capture = '', multiple = false
 * @return {Promise<FileList | null>}
 */
export function selectFiles(options: {
  accept?: string;
  capture?: string;
  multiple?: boolean;
}): Promise<FileList | null> {
  return new Promise((resolve) => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = options.accept || '';
    input.multiple = options.multiple || false;
    if (options.capture) {
      input.setAttribute('capture', options.capture);
    }
    
    input.onchange = (e) => {
      const target = e.target as HTMLInputElement;
      resolve(target.files);
      input.remove();
    };
    
    input.oncancel = () => {
      resolve(null);
      input.remove();
    };
    
    input.click();
  });
}

/**
 * Create image element
 * @param {String} str Image URL or base64 image
 * @return {Promise<HTMLImageElement>} Image element
 */
export function insertImgFile(str: string) {
  return new Promise<HTMLImageElement>((resolve) => {
    const imgEl = document.createElement('img');
    imgEl.src = str;
    // Insert into page
    document.body.appendChild(imgEl);
    imgEl.onload = () => {
      resolve(imgEl);
    };
  });
}

/**
 * Copying text to the clipboard
 * @param source Copy source
 * @returns Promise that resolves when the text is copied successfully, or rejects when the copy fails.
 */
export const clipboardText = async (source: string): Promise<void> => {
  if (navigator.clipboard && navigator.clipboard.writeText) {
    return navigator.clipboard.writeText(source);
  }
  // Fallback for older browsers
  const textArea = document.createElement('textarea');
  textArea.value = source;
  textArea.style.position = 'fixed';
  textArea.style.left = '-999999px';
  document.body.appendChild(textArea);
  textArea.select();
  try {
    document.execCommand('copy');
    return Promise.resolve();
  } catch (err) {
    return Promise.reject(err);
  } finally {
    document.body.removeChild(textArea);
  }
};

export function downFile(fileStr: string, fileType: string) {
  const anchorEl = document.createElement('a');
  anchorEl.href = fileStr;
  anchorEl.download = `${uuid()}.${fileType}`;
  document.body.appendChild(anchorEl); // required for firefox
  anchorEl.click();
  anchorEl.remove();
}

export function drawImg(
  ctx: CanvasRenderingContext2D,
  left: number,
  top: number,
  img: HTMLImageElement,
  wSize: number,
  hSize: number,
  angle: number | undefined
) {
  if (angle === undefined) return;
  ctx.save();
  ctx.translate(left, top);
  ctx.rotate(angle);
  ctx.drawImage(img, -wSize / 2, -hSize / 2, wSize, hSize);
  ctx.restore();
}

export function shiftAngle(start: Point, end: Point) {
  const startX = start.x;
  const startY = start.y;
  const x2 = end.x - startX;
  const y2 = end.y - startY;
  const r = Math.sqrt(x2 * x2 + y2 * y2);
  let angle = (Math.atan2(y2, x2) / Math.PI) * 180;
  angle = ~~(((angle + 7.5) % 360) / 15) * 15;

  const cosx = r * Math.cos((angle * Math.PI) / 180);
  const sinx = r * Math.sin((angle * Math.PI) / 180);

  return {
    x: cosx + startX,
    y: sinx + startY,
  };
}

/**
 * Type guards for Fabric.js objects
 */
export const isImage = (thing: unknown): thing is Image => {
  return thing instanceof Image;
};

export const isGroup = (thing: unknown): thing is Group => {
  return thing instanceof Group;
};

export const isIText = (thing: unknown): thing is IText => {
  return thing instanceof IText;
};

export const isActiveSelection = (thing: unknown): thing is ActiveSelection => {
  return thing instanceof ActiveSelection;
};

export function blobToBase64(blob: Blob) {
  return new Promise((resolve) => {
    const reader = new FileReader();
    reader.addEventListener('load', () => {
      resolve(reader.result as string);
    });
    reader.readAsDataURL(blob);
  });
}

export function base64ToBlob(base64Data: string) {
  if (!base64Data) {
    return null;
  }
  const dataArr = base64Data.split(',');
  const match = dataArr[0].match(/:(.*?);/);
  if (!match || !match[1]) {
    return null;
  }
  const imageType = match[1];
  const textData = window.atob(dataArr[1]);
  const arrayBuffer = new ArrayBuffer(textData.length);
  const uint8Array = new Uint8Array(arrayBuffer);
  for (let i = 0; i < textData.length; i++) {
    uint8Array[i] = textData.charCodeAt(i);
  }
  return [new Blob([arrayBuffer], { type: imageType }), imageType.slice(6)];
}

export default {
  getImgStr,
  downFile,
  selectFiles,
  insertImgFile,
  clipboardText,
  drawImg,
  isImage,
  isGroup,
  isIText,
  isActiveSelection,
  blobToBase64,
  base64ToBlob,
};
