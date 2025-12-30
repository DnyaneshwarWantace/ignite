import { FabricObject } from 'fabric'
import type { Canvas as FabricCanvas } from 'fabric'
import { SelectMode } from '../eventType'
import type { IEditor, IPluginTempl } from '../interface/Editor'

type IPlugin = Pick<FlipPlugin, 'flip'>

declare module '../interface/Editor' {
  // eslint-disable-next-line typescript-eslint/no-empty-interface
  interface IEditor extends IPlugin {}
}

export default class FlipPlugin implements IPluginTempl {
  static pluginName = 'FlipPlugin'
  static apis = ['flip']
  constructor(public canvas: FabricCanvas, public editor: IEditor) {}

  flip(type: 'X' | 'Y') {
    const activeObject = this.canvas.getActiveObject()
    if (activeObject) {
      activeObject.set(`flip${type}`, !activeObject[`flip${type}`]).setCoords()
      this.canvas.requestRenderAll()
    }
  }

  contextMenu() {
    const selectMode = this.editor.getSelectMode()
    if (selectMode === SelectMode.ONE) {
      return [
        {
          text: 'Flip',
          hotkey: '❯',
          subitems: [
            {
              text: 'Flip X',
              hotkey: '|',
              onclick: () => this.flip('X'),
            },
            {
              text: 'Flip Y',
              hotkey: '-',
              onclick: () => this.flip('Y'),
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
