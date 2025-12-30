import EventEmitter from 'events';
import hotkeys from 'hotkeys-js';
import ContextMenu from './ContextMenu.js';
import ServersPlugin from './ServersPlugin';
import { AsyncSeriesHook } from 'tapable';
import type {
  IPluginMenu,
  IPluginClass,
  IPluginOption,
  IEditorHooksType,
  IPluginTempl,
} from './interface/Editor';

import Utils from './utils/utils';

import type { Canvas as FabricCanvas } from 'fabric';

class Editor extends EventEmitter {
  private canvas: FabricCanvas | null = null;
  contextMenu: ContextMenu | null = null;
  [key: string]: any;
  private pluginMap: {
    [propName: string]: IPluginTempl;
  } = {};
  // Custom events
  private customEvents: string[] = [];
  // Custom APIs
  private customApis: string[] = [];
  // Lifecycle hook names
  private hooks: IEditorHooksType[] = [
    'hookImportBefore',
    'hookImportAfter',
    'hookSaveBefore',
    'hookSaveAfter',
    'hookTransform',
  ];
  public hooksEntity: {
    [propName: string]: AsyncSeriesHook<any, any>;
  } = {};

  init(canvas: FabricCanvas) {
    this.canvas = canvas;
    this._initContextMenu();
    this._bindContextMenu();
    this._initActionHooks();
    this._initServersPlugin();

    this.Utils = Utils;
  }

  get fabricCanvas() {
    return this.canvas;
  }

  // Use plugin
  use(plugin: IPluginTempl, options?: IPluginOption) {
    if (this._checkPlugin(plugin) && this.canvas) {
      this._saveCustomAttr(plugin);
      const pluginRunTime = new (plugin as IPluginClass)(this.canvas, this, options || {});
      pluginRunTime.pluginName = plugin.pluginName;
      this.pluginMap[plugin.pluginName] = pluginRunTime;
      this._bindingHooks(pluginRunTime);
      this._bindingHotkeys(pluginRunTime);
      this._bindingApis(pluginRunTime);
    }
    return this;
  }

  destory() {
    this.canvas = null;
    this.contextMenu = null;
    this.pluginMap = {};
    this.customEvents = [];
    this.customApis = [];
    this.hooksEntity = {};
  }
  // Get plugin
  getPlugin(name: string) {
    if (this.pluginMap[name]) {
      return this.pluginMap[name];
    }
  }

  // Check plugin
  private _checkPlugin(plugin: IPluginTempl) {
    const { pluginName, events = [], apis = [] } = plugin;
    // Check name
    if (this.pluginMap[pluginName]) {
      throw new Error(`Plugin ${pluginName} is already initialized`);
    }
    events.forEach((eventName: string) => {
      if (this.customEvents.find((info) => info === eventName)) {
        throw new Error(`Event ${eventName} in plugin ${pluginName} is duplicate`);
      }
    });

    apis.forEach((apiName: string) => {
      if (this.customApis.find((info) => info === apiName)) {
        throw new Error(`API ${apiName} in plugin ${pluginName} is duplicate`);
      }
    });
    return true;
  }

  // Bind hooks
  private _bindingHooks(plugin: IPluginTempl) {
    this.hooks.forEach((hookName) => {
      const hook = plugin[hookName];
      if (hook) {
        this.hooksEntity[hookName].tapPromise(plugin.pluginName + hookName, function (): Promise<void> {
          // console.log(hookName, ...arguments);
          // eslint-disable-next-line prefer-rest-params
          // Convert arguments to array to ensure it's iterable
          const argsArray = Array.from(arguments);
          const result = hook.apply(plugin, argsArray);
          // Convert to Promise<void> as required by tapPromise
          const promise = (result as any) instanceof Promise ? result : Promise.resolve(result);
          return promise.then(() => undefined);
        });
      }
    });
  }

  // Bind hotkeys
  private _bindingHotkeys(plugin: IPluginTempl) {
    // Ensure hotkeys is an array before iterating
    const hotkeysList = (plugin?.hotkeys && Array.isArray(plugin.hotkeys)) ? plugin.hotkeys : [];
    hotkeysList.forEach((keyName: string) => {
      // Support keyup
      hotkeys(keyName, { keyup: true }, (e) => {
        plugin.hotkeyEvent && plugin.hotkeyEvent(keyName, e);
      });
    });
  }

  // Save custom events and APIs
  private _saveCustomAttr(plugin: IPluginTempl) {
    // plugin is the plugin class, access static properties directly
    const pluginClass = plugin as any;
    // Ensure events and apis are arrays before concatenating
    const events = (pluginClass.events && Array.isArray(pluginClass.events)) ? pluginClass.events : [];
    const apis = (pluginClass.apis && Array.isArray(pluginClass.apis)) ? pluginClass.apis : [];
    this.customApis = this.customApis.concat(apis);
    this.customEvents = this.customEvents.concat(events);
  }
  // Proxy API methods
  private _bindingApis(pluginRunTime: IPluginTempl) {
    const constructor = pluginRunTime.constructor as any;
    const apis = (constructor && constructor.apis && Array.isArray(constructor.apis)) ? constructor.apis : [];
    apis.forEach((apiName: string) => {
      if (pluginRunTime[apiName] && typeof pluginRunTime[apiName] === 'function') {
        this[apiName] = function () {
          // eslint-disable-next-line prefer-rest-params
          // Convert arguments to array to ensure it's iterable
          const argsArray = Array.from(arguments);
          return (pluginRunTime[apiName] as Function).apply(pluginRunTime, argsArray);
        };
      }
    });
  }

  // Context menu
  private _bindContextMenu() {
    this.canvas &&
      this.canvas.on('mouse:down', (opt: any) => {
        // Check if it's a MouseEvent and right button (button === 3)
        if (opt.e && 'button' in opt.e && opt.e.button === 3) {
          let menu: IPluginMenu[] = [];
          Object.keys(this.pluginMap).forEach((pluginName) => {
            const pluginRunTime = this.pluginMap[pluginName];
            const pluginMenu = pluginRunTime.contextMenu && pluginRunTime.contextMenu();
            // Ensure pluginMenu is an array before concatenating
            if (pluginMenu && Array.isArray(pluginMenu)) {
              menu = menu.concat(pluginMenu);
            }
          });
          this._renderMenu(opt, menu);
        }
      });
  }

  // Render context menu
  private _renderMenu(opt: any, menu: IPluginMenu[]) {
    if (menu.length !== 0 && this.contextMenu) {
      this.contextMenu.hideAll();
      this.contextMenu.setData(menu);
      // Get clientX/clientY from the event (works for both MouseEvent and TouchEvent)
      const e = opt.e as MouseEvent | TouchEvent;
      const clientX = 'clientX' in e ? e.clientX : (e as TouchEvent).touches[0]?.clientX || 0;
      const clientY = 'clientY' in e ? e.clientY : (e as TouchEvent).touches[0]?.clientY || 0;
      this.contextMenu.show(clientX, clientY);
    }
  }

  // Lifecycle hooks
  _initActionHooks() {
    this.hooks.forEach((hookName) => {
      this.hooksEntity[hookName] = new AsyncSeriesHook(['data']);
    });
  }

  _initContextMenu() {
    this.contextMenu = new ContextMenu(this.canvas!.wrapperEl, []);
    this.contextMenu.install();
  }

  _initServersPlugin() {
    this.use(ServersPlugin);
  }

  // Fix off() error when listener is undefined
  off(eventName: string, listener: any): this {
    // noinspection TypeScriptValidateTypes
    return listener ? super.off(eventName, listener) : this;
  }
}

export default Editor;
