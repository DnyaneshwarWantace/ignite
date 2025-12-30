/*
 * @author Image Editor
 * @date 2022-05-24 15:14:34
 * @lastEditors Image Editor
 * @lastEditTime 2022-09-05 18:23:13
 * @Description Layer Plugin
 */

import type { Canvas as FabricCanvas } from 'fabric'
import type { IEditor, IPluginTempl } from '../interface/Editor'

type IPlugin = Pick<LayerPlugin, 'up' | 'down' | 'toFront' | 'toBack'>

declare module '../interface/Editor' {
  // eslint-disable-next-line @typescript-eslint/no-empty-interface
  interface IEditor extends IPlugin {}
}

class LayerPlugin implements IPluginTempl {
  static pluginName = 'LayerPlugin'
  static apis = ['up', 'down', 'toFront', 'toBack']
  constructor(public canvas: FabricCanvas, public editor: IEditor) {}

  _getWorkspace() {
    return this.canvas.getObjects().find((item) => (item as any).id === 'workspace')
  }

  _workspaceSendToBack() {
    const workspace = this._getWorkspace()
    if (workspace) {
      this.canvas.sendObjectToBack(workspace)
    }
  }

  up() {
    const actives = this.canvas.getActiveObjects()
    if (actives && actives.length === 1) {
      const activeObject = this.canvas.getActiveObjects()[0]
      if (activeObject) {
        this.canvas.bringObjectForward(activeObject)
        this.canvas.renderAll()
        this._workspaceSendToBack()
      }
    }
  }

  down() {
    const actives = this.canvas.getActiveObjects()
    if (actives && actives.length === 1) {
      const activeObject = this.canvas.getActiveObjects()[0]
      if (activeObject) {
        this.canvas.sendObjectBackwards(activeObject)
        this.canvas.renderAll()
        this._workspaceSendToBack()
      }
    }
  }

  toFront() {
    const actives = this.canvas.getActiveObjects()
    if (actives && actives.length === 1) {
      const activeObject = this.canvas.getActiveObjects()[0]
      if (activeObject) {
        this.canvas.bringObjectToFront(activeObject)
        this.canvas.renderAll()
        this._workspaceSendToBack()
      }
    }
  }

  toBack() {
    const actives = this.canvas.getActiveObjects()
    if (actives && actives.length === 1) {
      const activeObject = this.canvas.getActiveObjects()[0]
      if (activeObject) {
        this.canvas.sendObjectToBack(activeObject)
        this.canvas.renderAll()
        this._workspaceSendToBack()
      }
    }
  }

  contextMenu() {
    const activeObject = this.canvas.getActiveObject()
    if (activeObject) {
      return [
        {
          text: '图层管理',
          hotkey: '❯',
          subitems: [
            {
              text: '上一个',
              hotkey: '',
              onclick: () => this.up(),
            },
            {
              text: '下一个',
              hotkey: '',
              onclick: () => this.down(),
            },
            {
              text: '置顶',
              hotkey: '',
              onclick: () => this.toFront(),
            },
            {
              text: '置底',
              hotkey: '',
              onclick: () => this.toBack(),
            },
          ],
        },
      ]
    }
  }

  destroy() {
    console.log('pluginDestroy')
  }
}

export default LayerPlugin
