import Editor from './Editor';
import type { Canvas } from 'fabric';
import { SelectMode } from './eventType';
type IEditor = Editor;

class FontPlugin {
  public canvas: Canvas;
  public editor: IEditor;
  // Plugin name
  static pluginName = 'FontPlugin';
  // Mounted API names
  static apis = ['downFontByJSON'];
  // Published events
  static events = ['textEvent1', 'textEvent2'];
  // Hotkeys keyCode hotkeys-js
  public hotkeys: string[] = ['backspace', 'space'];
  // Private property
  repoSrc: string;

  constructor(canvas: Canvas, editor: IEditor, config: { repoSrc: string }) {
    // Initialize
    this.canvas = canvas;
    this.editor = editor;
    // External configuration
    this.repoSrc = config.repoSrc;
  }

  // Hook function hookImportAfter/hookSaveBefore/hookSaveAfter Promise
  hookImportBefore(json: string) {
    return this.downFontByJSON(json);
  }

  // Mounted API method
  downFontByJSON(json?: string) {
    // TODO: Implement font download by JSON
    return Promise.resolve();
  }

  // Private method + publish event
  _createFontCSS() {
    const params: any[] = [];
    this.editor.emit('textEvent1', params);
  }

  // Context menu
  contextMenu() {
    const selectedMode = this.editor.getSelectMode();
    if (selectedMode === SelectMode.ONE) {
      return [
        null, // Separator
        {
          text: 'Flip',
          hotkey: '❯',
          subitems: [
            {
              text: 'Flip Horizontal',
              hotkey: '|',
              onclick: () => {
                // TODO: Implement flip functionality
                console.log('Flip horizontal');
              },
            },
            {
              text: 'Flip Vertical',
              hotkey: '-',
              onclick: () => {
                // TODO: Implement flip functionality
                console.log('Flip vertical');
              },
            },
          ],
        },
      ];
    }
    return [];
  }

  // Hotkeys
  hotkeyEvent(eventName: string, { type }: KeyboardEvent) {
    // eventName: hotkeys property (backspace, space)
    // type: keyUp or keyDown
    // code: hotkeys-js Code
    if (eventName === 'backspace' && type === 'keydown') {
      // TODO: Implement delete functionality
      console.log('Delete key pressed');
    }
  }

  // Cleanup/Destroy
  destroy() {
    console.log('FontPlugin destroyed');
  }
}

export default FontPlugin;
