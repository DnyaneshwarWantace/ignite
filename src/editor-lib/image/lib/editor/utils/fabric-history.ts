/*
 * Fabric.js History Plugin
 * Converted to Fabric.js v6
 */
import { Canvas } from 'fabric';

// Override dispose function for _historyDispose()
const originalDispose = Canvas.prototype.dispose;
Canvas.prototype.dispose = function () {
  (this as any)._historyDispose();
  return originalDispose.call(this);
};

// History state interface
interface HistoryState {
  json: string;
  state: string;
}

// Add history methods to Canvas prototype
declare module 'fabric' {
  interface Canvas {
    _historyInit(): void;
    _historyDispose(): void;
    _historyUndo(): void;
    _historyRedo(): void;
    _historySave(): void;
    _historyClear(): void;
    historyUndo(): void;
    historyRedo(): void;
    historySave(): void;
    historyClear(): void;
    _historyNext(): void;
    _historyPrev(): void;
    _historyState: HistoryState[];
    _historyCurrentState: number;
  }
}

// Initialize history
// Note: In Fabric.js v6, there's no initialize method, so _historyInit() must be called manually
// after creating a Canvas instance, or it will be called lazily on first use
Canvas.prototype._historyInit = function () {
  if (this._historyState === undefined) {
    this._historyState = [];
    this._historyCurrentState = -1;
    this._historySave();
  }
};

// Dispose history
Canvas.prototype._historyDispose = function () {
  this._historyState = [];
  this._historyCurrentState = -1;
};

// Save history state
Canvas.prototype._historySave = function () {
  // Initialize if not already initialized
  if (this._historyState === undefined) {
    this._historyInit();
  }
  
  const json = JSON.stringify(this.toJSON());
  const state = JSON.stringify(this.toObject());
  
  // Remove future states if we're not at the end
  if (this._historyCurrentState < this._historyState.length - 1) {
    this._historyState = this._historyState.slice(0, this._historyCurrentState + 1);
  }
  
  this._historyState.push({ json, state });
  this._historyCurrentState = this._historyState.length - 1;
  
  // Limit history size (keep last 50 states)
  if (this._historyState.length > 50) {
    this._historyState.shift();
    this._historyCurrentState--;
  }
};

// Undo
Canvas.prototype._historyUndo = function () {
  if (this._historyCurrentState > 0) {
    this._historyCurrentState--;
    this._historyNext();
  }
};

// Redo
Canvas.prototype._historyRedo = function () {
  if (this._historyCurrentState < this._historyState.length - 1) {
    this._historyCurrentState++;
    this._historyNext();
  }
};

// Load state
Canvas.prototype._historyNext = function () {
  const state = this._historyState[this._historyCurrentState];
  if (state) {
    this.loadFromJSON(state.json, () => {
      this.requestRenderAll();
    });
  }
};

// Public API
Canvas.prototype.historyUndo = function () {
  this._historyUndo();
};

Canvas.prototype.historyRedo = function () {
  this._historyRedo();
};

Canvas.prototype.historySave = function () {
  this._historySave();
};

Canvas.prototype.historyClear = function () {
  this._historyDispose();
  this._historyInit();
};

// Auto-save on object modifications
const originalAdd = Canvas.prototype.add;
Canvas.prototype.add = function (...objects: any[]) {
  const result = originalAdd.apply(this, objects);
  this._historySave();
  return result;
};

const originalRemove = Canvas.prototype.remove;
Canvas.prototype.remove = function (...objects: any[]) {
  const result = originalRemove.apply(this, objects);
  this._historySave();
  return result;
};

// Note: Event handling for history is now done in HistoryPlugin
// This file only provides the history methods on Canvas prototype

export default {};

