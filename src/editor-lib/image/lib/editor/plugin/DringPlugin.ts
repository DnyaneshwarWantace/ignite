/*
 * Drag plugin
 * Handles canvas dragging functionality
 */

import type { IEditor, IPluginTempl } from '../interface/Editor';
import type { Canvas } from 'fabric';

type IPlugin = Pick<DringPlugin, 'startDring' | 'endDring'>;

declare module '../interface/Editor' {
  // eslint-disable-next-line @typescript-eslint/no-empty-interface
  interface IEditor extends IPlugin {}
}

export class DringPlugin implements IPluginTempl {
  defautOption = {};
  static pluginName = 'DringPlugin';
  static events = ['startDring', 'endDring'];
  static apis = ['startDring', 'endDring'];
  hotkeys: string[] = ['space'];
  dragMode = false;
  constructor(public canvas: Canvas, public editor: IEditor) {
    this.dragMode = false;
    this.init();
  }
  init() {
    this._initDring();
  }

  startDring() {
    this.dragMode = true;
    this.canvas.setCursor('grab');
    this.editor.emit('startDring');
    this.canvas.requestRenderAll();
  }
  endDring() {
    this.dragMode = false;
    this.canvas.setCursor('default');
    (this.canvas as any).isDragging = false;
    this.editor.emit('endDring');
    this.canvas.requestRenderAll();
  }

  // Drag mode
  _initDring() {
    const This = this;
    this.canvas.on('mouse:down', function (this: ExtCanvas, opt) {
      const evt = opt.e;
      // Check if it's a MouseEvent and evt.button === 1 is middle mouse button
      const isMouseEvent = 'button' in evt;
      if (evt.altKey || This.dragMode || (isMouseEvent && (evt as MouseEvent).button === 1)) {
        This.canvas.setCursor('grabbing');
        This.canvas.discardActiveObject();
        This._setDring();
        this.selection = false;
        this.isDragging = true;
        const mouseEvt = evt as MouseEvent;
        this.lastPosX = mouseEvt.clientX;
        this.lastPosY = mouseEvt.clientY;
        this.requestRenderAll();
      }
    });

    this.canvas.on('mouse:move', function (this: ExtCanvas, opt) {
      This.dragMode && This.canvas.setCursor('grab');
      if (this.isDragging) {
        This.canvas.discardActiveObject();
        This.canvas.setCursor('grabbing');
        const { e } = opt;
        if (!this.viewportTransform) return;
        const mouseEvt = e as MouseEvent;
        const vpt = this.viewportTransform;
        vpt[4] += mouseEvt.clientX - this.lastPosX;
        vpt[5] += mouseEvt.clientY - this.lastPosY;
        this.lastPosX = mouseEvt.clientX;
        this.lastPosY = mouseEvt.clientY;
        this.requestRenderAll();
      }
    });

    this.canvas.on('mouse:up', function (this: ExtCanvas) {
      if (!this.viewportTransform) return;
      this.setViewportTransform(this.viewportTransform);
      this.isDragging = false;
      this.selection = true;
      this.getObjects().forEach((obj) => {
        if ((obj as any).id !== 'workspace' && obj.hasControls) {
          obj.selectable = true;
        }
      });
      This.dragMode && This.canvas.setCursor('grab');
      this.requestRenderAll();
    });
  }

  _setDring() {
    this.canvas.selection = false;
    this.canvas.getObjects().forEach((obj) => {
      obj.selectable = false;
    });
    this.canvas.requestRenderAll();
  }

  destroy() {
    console.log('pluginDestroy');
  }

  // Hotkey extension callback
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  hotkeyEvent(eventName: string, e: KeyboardEvent) {
    if (e.code === 'Space' && e.type === 'keydown') {
      if (!this.dragMode) {
        this.startDring();
      }
    }
    if (e.code === 'Space' && e.type === 'keyup') {
      this.endDring();
    }
  }
}

declare global {
  export type ExtCanvas = Canvas & {
    isDragging: boolean;
    lastPosX: number;
    lastPosY: number;
  };
}

export default DringPlugin;
