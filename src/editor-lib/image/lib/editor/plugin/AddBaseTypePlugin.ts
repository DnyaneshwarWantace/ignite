/*
 * Add base type plugin
 * Adds basic elements to the canvas
 */
import { Canvas, FabricObject, Image, loadSVGFromURL, loadSVGFromString, util } from 'fabric';
import type { IEditor, IPluginTempl } from '../interface/Editor';
import { v4 as uuid } from 'uuid';

type IPlugin = Pick<AddBaseTypePlugin, 'addBaseType' | 'createImgByElement' | 'addImage' | 'insertSvgStr'>;

declare module '../interface/Editor' {
  // eslint-disable-next-line @typescript-eslint/no-empty-interface
  interface IEditor extends IPlugin {}
}

export default class AddBaseTypePlugin implements IPluginTempl {
  static pluginName = 'AddBaseTypePlugin';
  static apis = ['addBaseType', 'createImgByElement', 'addImage', 'insertSvgStr'];
  constructor(public canvas: Canvas, public editor: IEditor) {
    this.editor = editor;
    this.canvas = canvas;
  }

  addBaseType(
    item: FabricObject,
    optons?: {
      event?: DragEvent;
      scale?: boolean;
      center?: boolean;
    }
  ) {
    const { event, scale = false, center = true } = optons || {};
    item.set({
      id: uuid(),
    });
    scale && this._toScale(item);
    event && this._toEvent(item, event);
    this.canvas.add(item);
    if (!event && center) {
      this._toCenter(item);
    }
    this.canvas.setActiveObject(item);
    this.canvas.requestRenderAll();
    this.editor.saveState();
  }

  _toEvent(item: FabricObject, event: DragEvent) {
    const wrapperEl = this.canvas.wrapperEl;
    if (!wrapperEl) return;
    const { left, top } = wrapperEl.getBoundingClientRect();
    if (event.x < left || event.y < top || item.width === undefined) return;
    const point = {
      x: event.x - left,
      y: event.y - top,
    };
    // Manual viewport transform calculation for Fabric.js v6
    const vpt = this.canvas.viewportTransform;
    if (vpt) {
      const pointerVpt = {
        x: (point.x - vpt[4]) / vpt[0],
        y: (point.y - vpt[5]) / vpt[3],
      };
      item.set({
        left: pointerVpt.x,
        top: pointerVpt.y,
      });
    }
  }

  _toCenter(item: FabricObject) {
    this.canvas.setActiveObject(item);
    this.editor.position('center');
  }

  _toScale(item: FabricObject) {
    const workspace = this.editor.getWorkspace?.();
    if (!workspace || workspace.width === undefined) return;
    item.scaleToWidth(workspace.width / 2);
  }

  createImgByElement(target: HTMLImageElement) {
    return new Promise((resolve) => {
      const imgType = this.getImageExtension(target.src);
      if (imgType === 'svg') {
        loadSVGFromURL(target.src).then(({ objects, options }) => {
          const filteredObjects = objects.filter((obj): obj is FabricObject => obj !== null);
          const item = util.groupSVGElements(filteredObjects, options);
          if (item) {
            (item as any).name = 'SVG Element';
          }
          resolve(item);
        });
      } else {
        Image.fromURL(target.src, {
          crossOrigin: 'anonymous',
        }).then((imgEl) => {
          resolve(imgEl);
        });
      }
    });
  }

  getImageExtension(imageUrl: string) {
    const pathParts = imageUrl.split('/');
    const filename = pathParts[pathParts.length - 1];
    const fileParts = filename.split('.');
    return fileParts[fileParts.length - 1];
  }

  async addImage(url: string) {
    try {
      const imgType = this.getImageExtension(url);

      if (imgType === 'svg') {
        const { objects, options } = await loadSVGFromURL(url);
        const filteredObjects = objects.filter((obj): obj is FabricObject => obj !== null);
        const item = util.groupSVGElements(filteredObjects, options);
        if (item) {
          (item as any).name = 'SVG Element';
          this.addBaseType(item as FabricObject, { center: true, scale: true });
          // Auto-zoom to fit after adding image
          setTimeout(() => {
            (this.editor as any)?.auto?.();
            this.canvas.requestRenderAll();
          }, 200);
        }
      } else {
        const img = await Image.fromURL(url, { crossOrigin: 'anonymous' });
        (img as any).name = 'Image';
        this.addBaseType(img as FabricObject, { center: true, scale: true });
        // Auto-zoom to fit after adding image
        setTimeout(() => {
          (this.editor as any)?.auto?.();
          this.canvas.requestRenderAll();
        }, 200);
      }
    } catch (error) {
      console.error('Error adding image:', error);
      throw error;
    }
  }

  async insertSvgStr(svgString: string) {
    try {
      const { objects, options } = await loadSVGFromString(svgString);
      const filteredObjects = objects.filter((obj): obj is FabricObject => obj !== null);
      const item = util.groupSVGElements(filteredObjects, options);
      if (item) {
        (item as any).name = 'SVG Element';
        this.addBaseType(item as FabricObject, { center: true, scale: true });
        // Auto-zoom to fit after adding SVG
        setTimeout(() => {
          (this.editor as any)?.auto?.();
          this.canvas.requestRenderAll();
        }, 200);
      }
    } catch (error) {
      console.error('Error adding SVG:', error);
      throw error;
    }
  }

  destroy() {
    console.log('pluginDestroy');
  }
}
