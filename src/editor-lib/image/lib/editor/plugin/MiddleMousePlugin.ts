/*
 * Middle mouse button click event plugin
 */
import { Canvas } from 'fabric';
import type { IEditor, IPluginTempl } from '../interface/Editor';

class MiddleMousePlugin implements IPluginTempl {
  static pluginName = 'MiddleMousePlugin';
  workspaceEl!: HTMLElement;

  constructor(public canvas: Canvas, public editor: IEditor) {
    this.init();
  }

  private init() {
    const workspaceEl = document.querySelector('#workspace') as HTMLElement;
    if (!workspaceEl) {
      throw new Error('element #workspace is missing, plz check!');
    }
    this.workspaceEl = workspaceEl;
    this.initListener();
  }

  private handleMouseUp = (e: MouseEvent) => {
    if (e.button === 1) {
      (this.canvas as any).fire('mouse:up', { e });
    }
  };

  private handleMouseDown = (e: MouseEvent) => {
    if (e.button === 1) {
      (this.canvas as any).fire('mouse:down', { e });
    }
  };

  /**
   * Initialize middle mouse button listener events
   */
  private initListener() {
    this.workspaceEl.addEventListener('mouseup', this.handleMouseUp);
    this.workspaceEl.addEventListener('mousedown', this.handleMouseDown);
  }

  destroy() {
    this.workspaceEl.removeEventListener('mouseup', this.handleMouseUp);
    this.workspaceEl.removeEventListener('mousedown', this.handleMouseDown);
    console.log('pluginDestroy');
  }
}

export default MiddleMousePlugin;
