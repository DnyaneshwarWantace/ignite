import type Editor from '../Editor';
import type { Canvas as FabricCanvas } from 'fabric';

// IEditor type includes plugin instances, Editor does not include plugin instances
// eslint-disable-next-line @typescript-eslint/no-empty-interface
export interface IEditor extends Editor {}

// Lifecycle event types
export type IEditorHooksType =
  | 'hookImportBefore'
  | 'hookImportAfter'
  | 'hookSaveBefore'
  | 'hookSaveAfter'
  | 'hookTransform';

// Plugin instance
export declare class IPluginTempl {
  constructor(canvas: FabricCanvas, editor: IEditor, options?: IPluginOption);
  static pluginName: string;
  static events: string[];
  static apis: string[];
  hotkeyEvent?: (name: string, e: KeyboardEvent) => void;
  hookImportBefore?: (...args: unknown[]) => Promise<unknown>;
  hookImportAfter?: (...args: unknown[]) => Promise<unknown>;
  hookSaveBefore?: (...args: unknown[]) => Promise<unknown>;
  hookSaveAfter?: (...args: unknown[]) => Promise<unknown>;
  hookTransform?: (...args: unknown[]) => Promise<unknown>;
  [propName: string]: any;
  canvas?: FabricCanvas;
  editor?: IEditor;
}

export declare interface IPluginOption {
  [propName: string]: unknown | undefined;
}

declare class IPluginClass2 extends IPluginTempl {
  constructor();
}
// Plugin class
export declare interface IPluginClass {
  new (canvas: FabricCanvas, editor: Editor, options?: IPluginOption): IPluginClass2;
}

export declare interface IPluginMenu {
  text: string;
  command?: () => void;
  child?: IPluginMenu[];
}
