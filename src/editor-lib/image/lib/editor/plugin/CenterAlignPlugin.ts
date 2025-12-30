/*
 * @author Image Editor
 * @date 2022-05-23
 * @lastEditors bigace@qq.com
 * @lastEditTime 2023-06-08
 * @Description Plugin
 */

import { Rect, Point, FabricObject } from 'fabric'
import type { Canvas as FabricCanvas } from 'fabric'
import type { IEditor, IPluginTempl } from '../interface/Editor'

type IPlugin = Pick<CenterAlignPlugin, 'centerH' | 'centerV' | 'position' | 'center'>

declare module '../interface/Editor' {
  // eslint-disable-next-line typescript-eslint/no-empty-interface
  interface IEditor extends IPlugin {}
}

class CenterAlignPlugin implements IPluginTempl {
  static pluginName = 'CenterAlignPlugin'
  static apis = ['centerH', 'centerV', 'position', 'center']
  // public hotkeys: string[] = ['space']
  constructor(public canvas: FabricCanvas, public editor: IEditor) {}

  center(workspace: Rect, object: FabricObject) {
    const center = workspace.getCenterPoint()
    return this.canvas._centerObject(object, center)
  }

  centerV(workspace: Rect, object: FabricObject) {
    return this.canvas._centerObject(
      object,
      new Point(object.getCenterPoint().x, workspace.getCenterPoint().y)
    )
  }

  centerH(workspace: Rect, object: FabricObject) {
    return this.canvas._centerObject(
      object,
      new Point(workspace.getCenterPoint().x, object.getCenterPoint().y)
    )
  }

  position(name: 'center' | 'centerH' | 'centerV') {
    const anignType = ['center', 'centerH', 'centerV']
    const activeObject = this.canvas.getActiveObject()
    if (anignType.includes(name) && activeObject) {
      const defaultWorkspace = this.canvas.getObjects().find((item) => (item as any).id === 'workspace') as Rect | undefined
      if (defaultWorkspace) {
        this[name](defaultWorkspace, activeObject)
      }
      this.canvas.requestRenderAll()
    }
  }

  contextMenu() {
    const activeObject = this.canvas.getActiveObject()
    if (activeObject) {
      return [
        {
          text: '水平垂直居中',
          hotkey: '',
          disabled: false,
          onclick: () => this.position('center'),
        },
      ]
    }
  }
  destroy() {
    console.log('pluginDestroy')
  }
}

export default CenterAlignPlugin
