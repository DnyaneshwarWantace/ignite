/*
 * @author Image Editor
 * @date 2022-05-24 15:14:34
 * @lastEditors Image Editor
 * @lastEditTime 2022-09-05 18:23:13
 * @Description Ruler Plugin
 */

import type { Canvas as FabricCanvas } from 'fabric'
import type { IEditor, IPluginTempl } from '../interface/Editor'

type IPlugin = Pick<
  RulerPlugin,
  'hideGuideLine' | 'showGuideLine' | 'rulerEnable' | 'rulerDisable'
>

declare module '../interface/Editor' {
  // eslint-disable-next-line @typescript-eslint/no-empty-interface
  interface IEditor extends IPlugin {}
}

import initRuler from '../ruler'

class RulerPlugin implements IPluginTempl {
  static pluginName = 'RulerPlugin'
  //  static events = ['sizeChange']
  static apis = ['hideGuideLine', 'showGuideLine', 'rulerEnable', 'rulerDisable']
  ruler: any
  constructor(public canvas: FabricCanvas, public editor: IEditor) {
    this.init()
  }

  hookSaveBefore() {
    return new Promise((resolve) => {
      this.hideGuideLine()
      resolve(true)
    })
  }

  hookSaveAfter() {
    return new Promise((resolve) => {
      this.showGuideLine()
      resolve(true)
    })
  }

  init() {
    this.ruler = initRuler(this.canvas)
  }

  hideGuideLine() {
    this.ruler.hideGuideLine()
  }

  showGuideLine() {
    this.ruler.showGuideLine()
  }

  rulerEnable() {
    this.ruler.enable()
  }

  rulerDisable() {
    this.ruler.disable()
  }

  destroy() {
    console.log('pluginDestroy')
  }
}

export default RulerPlugin
