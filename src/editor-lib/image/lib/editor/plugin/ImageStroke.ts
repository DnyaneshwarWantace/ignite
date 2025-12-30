/*
 * @author fan qq.com
 * @date 2022-05-24 15:14:34
 * @lastEditors fan qq.com
 * @lastEditTime 2022-09-05 18:23:13
 * @FilePath /v-fabric-editor/packages/core/plugin/ImageStroke.ts
 */
import { FabricImage } from 'fabric'
import type { Canvas as FabricCanvas } from 'fabric'
import type { IEditor, IPluginTempl } from '../interface/Editor'

type IPlugin = Pick<ImageStrokePlugin, 'imageStrokeDraw'>

declare module '../interface/Editor' {
  // eslint-disable-next-line @typescript-eslint/no-empty-interface
  interface IEditor extends IPlugin {}
}

/*type StrokeOps = {
  enabled: boolean
  width: number
  color: string
  type: 'destination-out' | 'source-over' | 'source-in'
}*/
interface ExtendImage {
  [x: string]: any
  originWidth: number
  originHeight: number
  originSrc: string
}
class ImageStrokePlugin implements IPluginTempl {
  static pluginName = 'ImageStroke'
  static apis = ['imageStrokeDraw']
  //   public options: Required<StrokeOps>
  constructor(public canvas: FabricCanvas, public editor: IEditor) {
    // this.options = Object.assign(
    //   {
    //     enabled: false,
    //     width: 10,
    //     color: '#000',
    //     type: 'source-over',
    //   },
    //   _options
    // )
  }

  private addImage(src: string): Promise<HTMLImageElement | undefined> {
    return new Promise((resolve, reject) => {
      const img = new Image()
      img.crossOrigin = 'anonymous'
      img.onload = () => resolve(img)
      img.onerror = () => reject()
      img.src = src
    })
  }

  //   imageStrokeEnable() {
  //     this.options.enabled = true
  //   }

  //   imageStrokeDisable() {
  //     this.options.enabled = false
  //   }

  //   imageStrokeSet(key: 'enabled' | 'width' | 'color' | 'type', val: any) {
  //     this.options[key] = val
  //   }

  async imageStrokeDraw(stroke: string, strokeWidth: number, type = 'source-over') {
    const activeObject = this.canvas.getActiveObject() as (FabricImage & ExtendImage) | undefined
    if (!activeObject) return
    const w = activeObject.originWidth || 0,
      h = activeObject.originHeight || 0,
      src = activeObject.originSrc || activeObject.getSrc()
    let canvas: HTMLCanvasElement | null = document.createElement('canvas')
    const ctx = canvas!.getContext('2d')
    if (!ctx) return
    if (strokeWidth === 0) {
      await activeObject.setSrc(src)
      activeObject.canvas!.renderAll()
      return
    }
    ctx.save()
    ctx.clearRect(0, 0, canvas!.width, canvas!.height)
    ctx.restore()
    canvas!.width = w + strokeWidth * 2
    canvas!.height = h + strokeWidth * 2
    const dArr = [-1, -1, 0, -1, 1, 0, -1, 1, 1, 1, 1, -1, 1, 0, 0, 1, 0]
    const img = await this.addImage(src)
    if (!img) return
    for (let i = 0; i < dArr.length; i += 2) {
      ctx.drawImage(
        img,
        strokeWidth + dArr[i] * strokeWidth,
        strokeWidth + dArr[i + 1] * strokeWidth,
        w,
        h
      )
    }
    ctx.globalCompositeOperation = 'source-in'
    ctx.fillStyle = stroke
    ctx.fillRect(0, 0, w + strokeWidth * 2, h + strokeWidth * 2)
    ctx.globalCompositeOperation = type as any
    ctx.drawImage(img, strokeWidth, strokeWidth, w, h)
    const res = canvas.toDataURL()
    canvas = null
    if (!res) return
    await activeObject.setSrc(res)
    activeObject.canvas!.renderAll()
  }

  destroy() {
    // this.editor.off('sizeChange', this.drawWaterMark)
  }
}

export default ImageStrokePlugin
