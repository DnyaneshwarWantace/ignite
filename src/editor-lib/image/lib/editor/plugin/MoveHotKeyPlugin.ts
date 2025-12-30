/*
 * Move hotkey plugin
 * Provides keyboard shortcuts for moving objects
 */
import { Canvas } from 'fabric';
import type { IEditor, IPluginTempl } from '../interface/Editor';

class MoveHotKeyPlugin implements IPluginTempl {
  static pluginName = 'MoveHotKeyPlugin';
  hotkeys: string[] = ['left', 'right', 'down', 'up'];
  constructor(public canvas: Canvas, public editor: IEditor) {}

  // Hotkey extension callback
  hotkeyEvent(eventName: string, e: KeyboardEvent) {
    if (e.type === 'keydown') {
      const { canvas } = this;
      const activeObject = canvas.getActiveObject();
      if (!activeObject) return;
      switch (eventName) {
        case 'left':
          if (activeObject.left === undefined) return;
          activeObject.set('left', activeObject.left - 1);
          break;
        case 'right':
          if (activeObject.left === undefined) return;
          activeObject.set('left', activeObject.left + 1);
          break;
        case 'down':
          if (activeObject.top === undefined) return;
          activeObject.set('top', activeObject.top + 1);
          break;
        case 'up':
          if (activeObject.top === undefined) return;
          activeObject.set('top', activeObject.top - 1);
          break;
        default:
      }
      canvas.requestRenderAll();
    }
  }

  destroy() {
    console.log('pluginDestroy');
  }
}

export default MoveHotKeyPlugin;
