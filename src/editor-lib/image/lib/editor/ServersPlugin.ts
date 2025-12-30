/*
 * @Author: AI Image Editor
 * @Date: 2023-06-20 12:52:09
 * @LastEditors: AI Image Editor
 * @LastEditTime: 2024-07-25 17:40:14
 * @Description: Plugin
 */
import { v4 as uuid } from 'uuid';
import { selectFiles, clipboardText, downFile } from './utils/utils';
import { Path, FabricObject, Canvas as FabricCanvas } from 'fabric';
import type { IEditor, IPluginTempl } from './interface/Editor';
import { SelectEvent, SelectMode } from './eventType';

type IPlugin = Pick<
  ServersPlugin,
  | 'insert'
  | 'loadJSON'
  | 'getJson'
  | 'dragAddItem'
  | 'clipboard'
  | 'clipboardBase64'
  | 'saveJson'
  | 'saveSvg'
  | 'saveImg'
  | 'clear'
  | 'preview'
  | 'getSelectMode'
  | 'getExtensionKey'
>;

declare module './interface/Editor' {
  // eslint-disable-next-line @typescript-eslint/no-empty-interface
  interface IEditor extends IPlugin {}
}

function transformText(objects: any) {
  if (!objects) return;
  objects.forEach((item: any) => {
    if (item.objects) {
      transformText(item.objects);
    } else {
      item.type === 'text' && (item.type = 'textbox');
    }
  });
}

class ServersPlugin implements IPluginTempl {
  public selectedMode: SelectMode;
  static pluginName = 'ServersPlugin';
  static apis = [
    'insert',
    'loadJSON',
    'getJson',
    'dragAddItem',
    'clipboard',
    'clipboardBase64',
    'saveJson',
    'saveSvg',
    'saveImg',
    'clear',
    'preview',
    'getSelectMode',
    'getExtensionKey',
  ];
  static events = [SelectMode.ONE, SelectMode.MULTI, SelectEvent.CANCEL];
  // public hotkeys: string[] = ['left', 'right', 'down', 'up'];
  constructor(public canvas: FabricCanvas, public editor: IEditor) {
    this.selectedMode = SelectMode.EMPTY;
    this._initSelectEvent();
  }

  private _initSelectEvent() {
    this.canvas.on('selection:created', () => this._emitSelectEvent());
    this.canvas.on('selection:updated', () => this._emitSelectEvent());
    this.canvas.on('selection:cleared', () => this._emitSelectEvent());
  }

  private _emitSelectEvent() {
    if (!this.canvas) {
      throw TypeError('还未初始化');
    }

    const actives = this.canvas
      .getActiveObjects()
      .filter((item) => item.type !== 'GuideLine'); // Filter out guide lines
    if (actives && actives.length === 1) {
      this.selectedMode = SelectMode.ONE;
      this.editor.emit(SelectEvent.ONE, actives);
    } else if (actives && actives.length > 1) {
      this.selectedMode = SelectMode.MULTI;
      this.editor.emit(SelectEvent.MULTI, actives);
    } else {
      this.editor.emit(SelectEvent.CANCEL);
    }
  }

  getSelectMode() {
    return String(this.selectedMode);
  }

  insert(callback?: () => void) {
    selectFiles({ accept: '.json' }).then((files) => {
      if (files && files.length > 0) {
        const file = files[0];
        const reader = new FileReader();
        reader.readAsText(file, 'UTF-8');
        reader.onload = () => {
          this.loadJSON(reader.result as string, callback);
        };
      }
    });
  }

  // Set path property
  async renderITextPath(textPaths: Record<'id' | 'path', any>[]) {
    for (const item of textPaths) {
      const object = this.canvas.getObjects().find((o) => (o as any).id === item.id);
      if (object) {
        try {
          const path = await Path.fromObject(item.path);
          object.set('path', path);
        } catch (error) {
          console.error('Error loading path:', error);
        }
      }
    }
  }

  async loadJSON(jsonFile: string | object, callback?: () => void) {
    const temp = typeof jsonFile === 'string' ? JSON.parse(jsonFile) : jsonFile;
    const textPaths: Record<'id' | 'path', any>[] = [];
    temp.objects.forEach((item: any) => {
      !(item as any).id && ((item as any).id = uuid());
      if (item.type === 'i-text' && item.path) {
        textPaths.push({ id: item.id, path: item.path });
        item.path = null;
      }
    });

    const tempTransform = await this._transform(temp);

    jsonFile = JSON.stringify(tempTransform);
    this.editor.hooksEntity.hookImportBefore.callAsync(jsonFile, () => {
      this.canvas.loadFromJSON(jsonFile, () => {
        this.renderITextPath(textPaths);
        this.canvas.renderAll();
        this.editor.hooksEntity.hookImportAfter.callAsync(jsonFile, () => {
          this.editor?.updateDrawStatus &&
            typeof this.editor.updateDrawStatus === 'function' &&
            this.editor.updateDrawStatus(!!temp['overlayImage']);
          this.canvas.renderAll();
          callback && callback();
          this.editor.emit('loadJson');
        });
      });
    });
  }

  async _transform(json: any) {
    await this.promiseCallAsync(json);
    if (json.objects) {
      const all = json.objects.map((item: any) => {
        return this._transform(item);
      });
      await Promise.all(all);
    }
    return json;
  }

  promiseCallAsync(item: any) {
    return new Promise((resolve) => {
      this.editor.hooksEntity.hookTransform.callAsync(item, () => {
        resolve(item);
      });
    });
  }

  getJson() {
    // In Fabric.js v6, toJSON() doesn't accept arguments
    // Custom properties are included by default in toJSON()
    return this.canvas.toJSON();
  }

  getExtensionKey() {
    return [
      'id',
      'gradientAngle',
      'selectable',
      'hasControls',
      'linkData',
      'editable',
      'extensionType',
      'extension',
      'verticalAlign',
      'roundValue',
    ];
  }

  /**
   * @param {Event} event
   * @param {Object} item
   */
  dragAddItem(item: FabricObject, event?: DragEvent) {
    if (event) {
      const { left, top } = this.canvas.getSelectionElement().getBoundingClientRect();
      if (event.x < left || event.y < top || item.width === undefined) return;

      // In Fabric.js v6, restorePointerVpt was removed
      // Calculate viewport-transformed coordinates manually
      const vpt = this.canvas.viewportTransform;
      const point = {
        x: event.x - left,
        y: event.y - top,
      };
      
      // Apply inverse viewport transform
      const det = vpt[0] * vpt[3] - vpt[1] * vpt[2];
      if (det !== 0) {
        const invDet = 1 / det;
        const pointerVpt = {
          x: (point.x - vpt[4]) * vpt[3] * invDet - (point.y - vpt[5]) * vpt[1] * invDet,
          y: (point.y - vpt[5]) * vpt[0] * invDet - (point.x - vpt[4]) * vpt[2] * invDet,
        };
        item.left = pointerVpt.x - (item.width || 0) / 2;
        item.top = pointerVpt.y;
      }
    }
    const { width } = this._getSaveOption();
    width && item.scaleToWidth(width / 2);
    this.canvas.add(item);
    this.canvas.setActiveObject(item);

    !event && this.editor.position('center');
    this.canvas.requestRenderAll();
  }

  clipboard() {
    const jsonStr = this.getJson();
    return clipboardText(JSON.stringify(jsonStr, null, '\t'));
  }

  async clipboardBase64() {
    const dataUrl = await this.preview();
    return clipboardText(dataUrl);
  }

  async saveJson() {
    const dataUrl = this.getJson();
    await transformText(dataUrl.objects);
    const fileStr = `data:text/json;charset=utf-8,${encodeURIComponent(
      JSON.stringify(dataUrl, null, '\t')
    )}`;
    downFile(fileStr, 'json');
  }

  saveSvg() {
    this.editor.hooksEntity.hookSaveBefore.callAsync('', () => {
      const { fontOption, svgOption } = this._getSaveSvgOption();
      // Note: fontPaths handling for Fabric.js v6
      // @ts-ignore - fontPaths may not exist in v6
      if (typeof (this.canvas as any).fontPaths !== 'undefined') {
        (this.canvas as any).fontPaths = {
          ...fontOption,
        };
      }
      const dataUrl = this.canvas.toSVG(svgOption);
      const fileStr = `data:image/svg+xml;charset=utf-8,${encodeURIComponent(dataUrl)}`;
      this.editor.hooksEntity.hookSaveAfter.callAsync(fileStr, () => {
        downFile(fileStr, 'svg');
      });
    });
  }

  saveImg() {
    this.editor.hooksEntity.hookSaveBefore.callAsync('', () => {
      const { format, quality } = this._getSaveOption();
      this.canvas.setViewportTransform([1, 0, 0, 1, 0, 0]);
      // In Fabric.js v6, toDataURL() requires multiplier property
      const dataUrl = this.canvas.toDataURL({
        multiplier: 1,
        format: format as any,
        quality: quality,
      });
      this.editor.hooksEntity.hookSaveAfter.callAsync(dataUrl, () => {
        downFile(dataUrl, 'png');
      });
    });
  }

  preview() {
    return new Promise<string>((resolve) => {
      this.editor.hooksEntity.hookSaveBefore.callAsync('', () => {
        const { format, quality } = this._getSaveOption();
        this.canvas.setViewportTransform([1, 0, 0, 1, 0, 0]);
        this.canvas.renderAll();
        // In Fabric.js v6, toDataURL() requires multiplier property
        const dataUrl = this.canvas.toDataURL({
          multiplier: 1,
          format: format as any,
          quality: quality,
        });
        this.editor.hooksEntity.hookSaveAfter.callAsync(dataUrl, () => {
          resolve(dataUrl);
        });
      });
    });
  }

  _getSaveSvgOption() {
    const workspace = this.canvas.getObjects().find((item) => (item as any).id === 'workspace');
    let fontFamilyArry = this.canvas
      .getObjects()
      .filter((item) => item.type == 'textbox')
      .map((item) => (item as any).fontFamily)
      .filter((font) => font != null); // Filter out null/undefined values
    fontFamilyArry = Array.from(new Set(fontFamilyArry));

    const fontPlugin = this.editor.getPlugin('FontPlugin');
    const fontList = fontPlugin?.cacheList || [];

    const fontEntry: Record<string, string> = {};
    for (const font of fontFamilyArry) {
      const item = fontList.find((item: any) => item.name === font);
      if (item?.file) {
        fontEntry[font] = item.file;
      }
    }

    console.log('_getSaveSvgOption', fontEntry);
    const { left, top, width, height } = workspace as FabricObject;
    // In Fabric.js v6, toSVG() expects width and height as strings
    return {
      fontOption: fontEntry,
      svgOption: {
        width: String(width),
        height: String(height),
        viewBox: {
          x: left,
          y: top,
          width,
          height,
        },
      },
    };
  }

  _getSaveOption() {
    const workspace = this.canvas
      .getObjects()
      .find((item: FabricObject) => (item as any).id === 'workspace');
    console.log('getObjects', this.canvas.getObjects());
    const { left, top, width, height } = workspace as FabricObject;
    const option = {
      name: 'New Image',
      format: 'png',
      quality: 1,
      width,
      height,
      left,
      top,
    };
    return option;
  }

  clear() {
    this.canvas.getObjects().forEach((obj) => {
      if ((obj as any).id !== 'workspace') {
        this.canvas.remove(obj);
      }
    });
    // Use optional chaining since WorkspacePlugin might not be loaded
    if (this.editor?.setWorkspaceBg) {
      this.editor.setWorkspaceBg('#fff');
    }
    this.canvas.discardActiveObject();
    this.canvas.renderAll();
  }

  destroy() {
    console.log('pluginDestroy');
  }
}

export default ServersPlugin;
