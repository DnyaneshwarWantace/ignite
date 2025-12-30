/* eslint-disable @typescript-eslint/no-explicit-any */
/*
 * History plugin
 * Handles undo/redo functionality
 */
import { Canvas } from 'fabric';
import Editor from '../Editor';

type IEditor = Editor;
type callback = () => void;

class HistoryPlugin {
  static pluginName = 'HistoryPlugin';
  static apis = ['undo', 'redo', 'canUndo', 'canRedo', 'historyUpdate', 'clearAndSaveState', 'saveState'];
  static events = [];

  // History-related properties
  private stack: string[] = [];
  private currentIndex = 0;
  private maxLength = 100;
  private isProcessing = false;
  private isLoading = false;

  hotkeys: string[] = ['ctrl+z', 'ctrl+shift+z', '⌘+z', '⌘+shift+z'];

  constructor(public canvas: Canvas, public editor: IEditor) {
    this._init();
  }

  private _init() {
    // Listen to object change events
    const events = {
      'object:removed': () => this.saveState(),
      'object:modified': () => this.saveState(),
      'object:skewing': () => this.saveState(),
    };

    // Bind events
    Object.entries(events).forEach(([event, handler]) => {
      this.canvas.on(event as any, handler);
    });

    // Initialize state
    this.saveState();

    // Update history state
    this.canvas.on('history:append' as any, () => {
      this.historyUpdate();
    });

    // Page leave warning
    window.addEventListener('beforeunload', (e) => {
      const { undoCount } = this.getState();
      if (undoCount > 0) {
        (e || window.event).returnValue = 'Confirm leave';
      }
    });
  }

  // Get current state
  private getCurrentState() {
    return this.editor.getJson();
  }

  // Save state
  private saveState() {
    if (this.isProcessing) return;

    // Clear records after current index
    this.stack.splice(this.currentIndex);
    this.stack.push(this.getCurrentState());

    // Maintain max length
    if (this.stack.length > this.maxLength) {
      this.stack.shift();
    } else {
      this.currentIndex++;
    }
    this.historyUpdate();
  }

  // Load state
  private _loadState(state: string | object, eventName: string, callback?: callback) {
    this.isLoading = true;
    this.isProcessing = true;

    // Handle workspace special case
    const parsedState = typeof state === 'string' ? JSON.parse(state) : state;
    const workspace = parsedState.objects?.find((item: any) => item.id === 'workspace');
    if (workspace) {
      workspace.evented = false;
    }

    // Fabric.js v6 loadFromJSON returns a Promise
    const stateToLoad = typeof state === 'string' ? state : JSON.stringify(state);
    this.canvas.loadFromJSON(stateToLoad).then(() => {
      this.canvas.requestRenderAll();
      (this.canvas as any).fire(eventName);
      this.isProcessing = false;
      this.isLoading = false;
      callback?.();
    }).catch((error) => {
      console.error('Error loading history state:', error);
      this.isProcessing = false;
      this.isLoading = false;
      callback?.();
    });
  }

  // Get history state
  private getState() {
    return {
      undoCount: this.currentIndex - 1,
      redoCount: this.stack.length - this.currentIndex,
    };
  }

  // Clear history
  private clear() {
    this.stack = [];
    this.currentIndex = 0;
    this.saveState();
  }

  // Public methods
  historyUpdate() {
    const { undoCount, redoCount } = this.getState();
    this.editor.emit('historyUpdate', undoCount, redoCount);
  }

  hookImportAfter() {
    this.clear();
    this.historyUpdate();
    return Promise.resolve();
  }

  undo() {
    if (this.isLoading || this.currentIndex <= 1) return;

    this.currentIndex--;
    const state = this.stack[this.currentIndex - 1];
    if (state) {
      this._loadState(state, 'history:undo', () => {
        // Update history state after loading is complete
        this.historyUpdate();
      });
    } else {
      // If no state found, restore index
      this.currentIndex++;
    }
  }

  redo() {
    if (this.isLoading || this.currentIndex >= this.stack.length) return;

    const state = this.stack[this.currentIndex];
    if (state) {
      // Increment index before loading so state calculation is correct
      this.currentIndex++;
      
      this._loadState(state, 'history:redo', () => {
        // Update history state after loading is complete
        this.historyUpdate();
      });
    }
  }

  canUndo(): boolean {
    return !this.isLoading && this.currentIndex > 1;
  }

  canRedo(): boolean {
    return !this.isLoading && this.currentIndex < this.stack.length;
  }

  hotkeyEvent(eventName: string, e: KeyboardEvent) {
    if (e.type === 'keydown') {
      switch (eventName) {
        case 'ctrl+z':
        case '⌘+z':
          this.undo();
          break;
        case 'ctrl+shift+z':
        case '⌘+shift+z':
          this.redo();
          break;
      }
    }
  }

  clearAndSaveState() {
    const currentState = this.getCurrentState();
    this.stack = [currentState]; // Keep only current state as first record
    this.currentIndex = 1;
    this.historyUpdate();
  }
}

export default HistoryPlugin;
