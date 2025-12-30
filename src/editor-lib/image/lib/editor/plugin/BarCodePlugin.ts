/*
 * @author Image Editor
 * @date 2022-05-23
 * @lastEditors Image Editor
 * @lastEditTime 2023-08-01
 */

import { FabricImage } from 'fabric'
import JsBarcode from 'jsbarcode'
import type { IEditor, IPluginTempl } from '../interface/Editor'
import type { Canvas as FabricCanvas } from 'fabric'

type IPlugin = Pick<BarCodePlugin, 'addBarCode' | 'setBarCode' | 'getBarCodeTypes'>

declare module '../interface/Editor' {
  // eslint-disable-next-line typescript-eslint/no-empty-interface
  interface IEditor extends IPlugin {}
}

// https://github.com/lindell/JsBarcode/wiki/Options

enum CodeType {
  EAN13 = 'EAN13',
  EAN8 = 'EAN8',
  CODE39 = 'CODE39',
  CODE128 = 'CODE128',
  codabar = 'codabar',
  pharmacode = 'pharmacode',
}

class BarCodePlugin implements IPluginTempl {
  static pluginName = 'BarCodePlugin'
  static apis = ['addBarCode', 'setBarCode', 'getBarCodeTypes']
  constructor(public canvas: FabricCanvas, public editor: IEditor) {}

  async hookImportAfter(object: any) {
    if (object.extensionType === 'barcode') {
      const url = await this._getDataStr(object.extension)
      object.src = url
    }
  }
  _getDataStr(option: any) {
    const canvas = document.createElement('canvas')
    JsBarcode(canvas, option.value, {
      ...option,
    })
    const url = canvas.toDataURL('image/png', 1)
    return url
  }

  _defaultBarCodeOption() {
    return {
      value: '1234567890',
      format: CodeType.CODE128,
      text: 'hi kuaitu',
      textAlign: 'left',
      textPosition: 'bottom',
      fontSize: 14,
      background: '#ffffff',
      lineColor: '#000000',
      displayValue: false,
    }
  }

  addBarCode() {
    const option = this._defaultBarCodeOption()
    const url = this._getDataStr(JSON.parse(JSON.stringify(option)))
    FabricImage.fromURL(url, { crossOrigin: 'anonymous' }).then((imgEl) => {
      imgEl.set({
        extensionType: 'barcode',
        extension: option,
      })
      const workspace = this.editor.getWorkspace()
      if (workspace) {
        imgEl.scaleToWidth(workspace.getScaledWidth() / 2)
      }
      this.canvas.add(imgEl)
      this.canvas.setActiveObject(imgEl)
      this.editor.position('center')
      this.canvas.renderAll()
      this.editor.saveState()
    })
  }

  setBarCode(option: any) {
    try {
      const url = this._getDataStr(option)
      const activeObject = this.canvas.getActiveObjects()[0]
      FabricImage.fromURL(url, { crossOrigin: 'anonymous' }).then((imgEl) => {
        imgEl.set({
          left: activeObject.left,
          top: activeObject.top,
          extensionType: 'barcode',
          extension: { ...option },
        })
        imgEl.scaleToWidth(activeObject.getScaledWidth())
        this.editor.del()
        this.canvas.add(imgEl)
        this.canvas.setActiveObject(imgEl)
      })
    } catch (error) {
      console.log(error)
    }
  }

  getBarCodeTypes() {
    return Object.values(CodeType)
  }

  destroy() {
    console.log('plugin destroy')
  }
}

export default BarCodePlugin
