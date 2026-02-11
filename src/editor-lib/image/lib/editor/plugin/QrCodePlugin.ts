/*
 * @author Image Editor
 * @date 2022-05-24
 * @lastEditors Image Editor
 * @lastEditTime 2023-08-01
 * @Description QR Code Generator Plugin
 */

import { FabricImage } from 'fabric'
import QRCodeStyling from 'qr-code-styling'
import { blobToBase64 } from '../utils/utils'
import type { IEditor, IPluginTempl } from '../interface/Editor'
import type { Canvas as FabricCanvas } from 'fabric'

type IPlugin = Pick<QrCodePlugin, 'addQrCode' | 'setQrCode' | 'getQrCodeTypes'>

declare module '../interface/Editor' {
  // eslint-disable-next-line typescript-eslint/no-empty-interface
  interface IEditor extends IPlugin {}
}


enum DotsType {
  rounded = 'rounded',
  dots = 'dots',
  classy = 'classy',
  classy_rounded = 'classy-rounded',
  square = 'square',
  extra_rounded = 'extra-rounded',
}

enum CornersType {
  dot = 'dot',
  square = 'square',
  extra_rounded = 'extra-rounded',
}

enum CornersDotType {
  dot = 'dot',
  square = 'square',
}

enum ErrorCorrectionLevelType {
  L = 'L',
  M = 'M',
  Q = 'Q',
  H = 'H',
}

class QrCodePlugin implements IPluginTempl {
  static pluginName = 'QrCodePlugin'
  static apis = ['addQrCode', 'setQrCode', 'getQrCodeTypes']
  constructor(public canvas: FabricCanvas, public editor: IEditor) {}

  async hookImportAfter(object: any) {
    if (object.extensionType === 'qrcode') {
      const paramsOption = this._paramsToOption(object.extension)
      const url = await this._getDataStr(paramsOption)
      object.src = url
    }
  }

  async _getDataStr(options: any): Promise<string> {
    // QRCodeStyling needs non-empty data to generate an image; use placeholder when empty so QR still shows
    const data = (options.data != null && String(options.data).trim() !== '') ? options.data : ' '
    const opts = { ...options, data }
    const qrCode = new QRCodeStyling(opts)
    const blob = await qrCode.getRawData('png')
    if (!blob) return ''
    const base64Str = (await blobToBase64(blob as any)) as string
    return base64Str || ''
  }

  _defaultBarCodeOption() {
    return {
      data: '',
      width: 200,
      margin: 10,
      errorCorrectionLevel: 'Q',
      dotsColor: '#000000',
      dotsType: 'rounded',
      cornersSquareColor: '#000000',
      cornersSquareType: 'square',
      cornersDotColor: '#000000',
      cornersDotType: 'square',
      background: '#ffffff',
    }
  }

  _paramsToOption(option: any) {
    return {
      width: option.width,
      height: option.width,
      type: 'canvas',
      data: option.data,
      margin: option.margin,
      qrOptions: {
        errorCorrectionLevel: option.errorCorrectionLevel,
      },
      dotsOptions: {
        color: option.dotsColor,
        type: option.dotsType,
      },
      cornersSquareOptions: {
        color: option.cornersSquareColor,
        type: option.cornersSquareType,
      },
      cornersDotOptions: {
        color: option.cornersDotColor,
        type: option.cornersDotType,
      },
      backgroundOptions: {
        color: option.background,
      },
    }
  }

  _getWorkspace() {
    return this.canvas.getObjects().find((item: any) => item.id === 'workspace')
  }

  async addQrCode() {
    const option = this._defaultBarCodeOption()
    const paramsOption = this._paramsToOption(option)
    const url = await this._getDataStr(paramsOption)
    if (!url) return
    const canvasWidth = this.canvas.getWidth() ?? 800
    const canvasHeight = this.canvas.getHeight() ?? 600
    FabricImage.fromURL(url, { crossOrigin: 'anonymous' }).then((imgEl) => {
      imgEl.set({
        extensionType: 'qrcode',
        extension: option,
      })
      const workspace = this._getWorkspace()
      const targetWidth = workspace && typeof workspace.getScaledWidth === 'function'
        ? workspace.getScaledWidth() / 2
        : canvasWidth / 2
      imgEl.scaleToWidth(targetWidth)
      // Place at canvas center so it doesn't jump (no position('center') which can shift to wrong place)
      imgEl.set({
        left: canvasWidth / 2,
        top: canvasHeight / 2,
        originX: 'center',
        originY: 'center',
      })
      imgEl.setCoords()
      this.canvas.add(imgEl)
      this.canvas.setActiveObject(imgEl)
      this.canvas.renderAll()
      if (typeof this.editor.saveState === 'function') {
        this.editor.saveState()
      }
    })
  }

  async setQrCode(option: any) {
    try {
      const activeObject = this.canvas.getActiveObjects()[0]
      if (!activeObject || (activeObject as any).extensionType !== 'qrcode') return
      const paramsOption = this._paramsToOption(option)
      const url = await this._getDataStr(paramsOption)
      if (!url) return
      FabricImage.fromURL(url, { crossOrigin: 'anonymous' }).then((imgEl) => {
        imgEl.set({
          left: activeObject.left,
          top: activeObject.top,
          extensionType: 'qrcode',
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

  getQrCodeTypes() {
    return {
      DotsType: Object.values(DotsType),
      CornersType: Object.values(CornersType),
      CornersDotType: Object.values(CornersDotType),
      ErrorCorrectionLevelType: Object.values(ErrorCorrectionLevelType),
    }
  }

  destroy() {
    console.log('plugin destroy')
  }
}

export default QrCodePlugin
