/*
 * @author Image Editor
 * @date 2022-05-24 15:14:34
 * @lastEditors Image Editor
 * @lastEditTime 2022-09-05 18:23:13
 * @Description File content
 */

import { v4 as uuid } from 'uuid'
import { Line } from 'fabric'
import type { Canvas as FabricCanvas } from 'fabric'
import Arrow from '../objects/Arrow'
import ThinTailArrow from '../objects/ThinTailArrow'
import type { IEditor, IPluginTempl } from '../interface/Editor'

type IPlugin = Pick<DrawLinePlugin, 'setLineType' | 'setMode'>

declare module '../interface/Editor' {
  // eslint-disable-next-line @typescript-eslint/no-empty-interface
  interface IEditor extends IPlugin {}
}

class DrawLinePlugin implements IPluginTempl {
  static pluginName = 'DrawLinePlugin'
  static apis = ['setLineType', 'setMode']
  isDrawingLineMode: boolean
  lineType: string
  lineToDraw: any
  pointer: any
  pointerPoints: any
  isDrawingLine: boolean
  constructor(public canvas: FabricCanvas, public editor: IEditor) {
    this.isDrawingLine = false
    this.isDrawingLineMode = false
    this.lineType = ''
    this.lineToDraw = null
    this.pointer = null
    this.pointerPoints = null
    this.init()
  }

  init() {
    const { canvas } = this
    canvas.on('mouse:down', (o) => {
      if (!this.isDrawingLineMode) return
      canvas.discardActiveObject()
      canvas.getObjects().forEach((obj) => {
        obj.selectable = false
        obj.hasControls = false
      })
      canvas.requestRenderAll()
      this.isDrawingLine = true
      this.pointer = canvas.getScenePoint(o.e)
      this.pointerPoints = [this.pointer.x, this.pointer.y, this.pointer.x, this.pointer.y]
      let modeHandler
      let opts: any = {
        strokeWidth: 8,
        stroke: '#000',
        id: uuid(),
      }
      switch (this.lineType) {
        case 'line':
          modeHandler = Line
          break
        case 'arrow':
          modeHandler = Arrow
          break
        case 'thinTailArrow':
          modeHandler = ThinTailArrow
          opts = {
            strokeWidth: 8,
            stroke: '#000',
            fill: '#000',
            id: uuid(),
          }
          break
        default:
          break
      }
      if (!modeHandler) throw new Error('Draw failed: invalid lineType.')

      this.lineToDraw = new modeHandler(this.pointerPoints, opts)

      this.lineToDraw.selectable = false
      this.lineToDraw.evented = false
      this.lineToDraw.strokeUniform = true
      canvas.add(this.lineToDraw)
    })

    canvas.on('mouse:move', (o) => {
      if (!this.isDrawingLine || !['line', 'arrow', 'thinTailArrow'].includes(this.lineType))
        return
      canvas.discardActiveObject()
      const activeObject = canvas.getActiveObject()
      if (activeObject) return
      this.pointer = canvas.getScenePoint(o.e)

      if (o.e.shiftKey) {
        // calc angle
        const startX = this.pointerPoints[0]
        const startY = this.pointerPoints[1]
        const x2 = this.pointer.x - startX
        const y2 = this.pointer.y - startY
        const r = Math.sqrt(x2 * x2 + y2 * y2)
        let angle = (Math.atan2(y2, x2) / Math.PI) * 180
        angle = ~~(((angle + 7.5) % 360) / 15) * 15

        const cosx = r * Math.cos((angle * Math.PI) / 180)
        const sinx = r * Math.sin((angle * Math.PI) / 180)

        this.lineToDraw.set({
          x2: cosx + startX,
          y2: sinx + startY,
        })
      } else {
        this.lineToDraw.set({
          x2: this.pointer.x,
          y2: this.pointer.y,
        })
      }

      canvas.requestRenderAll()
    })

    canvas.on('mouse:up', () => {
      if (!this.isDrawingLine) return
      this.lineToDraw.setCoords()
      this.isDrawingLine = false
      canvas.discardActiveObject()
      canvas.requestRenderAll()
      this.editor.saveState()
    })
  }

  setLineType(params: any) {
    this.lineType = params
  }

  setMode(params: any) {
    this.isDrawingLineMode = params
    if (!this.isDrawingLineMode) {
      this.endSet()
    }
  }

  endSet() {
    this.canvas.getObjects().forEach((obj) => {
      if ((obj as any).id !== 'workspace') {
        obj.selectable = true
        obj.hasControls = true
      }
    })
  }

  destroy() {
    console.log('pluginDestroy')
  }
}

export default DrawLinePlugin
