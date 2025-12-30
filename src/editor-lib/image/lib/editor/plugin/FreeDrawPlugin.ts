import { PencilBrush, CircleBrush, SprayBrush } from 'fabric'
import { v4 as uuid } from 'uuid'
import type { IEditor, IPluginTempl } from '../interface/Editor'
import type { Canvas as FabricCanvas } from 'fabric'

type IPlugin = Pick<FreeDrawPlugin, 'startDraw' | 'endDraw'>

declare module '../interface/Editor' {
  // eslint-disable-next-line typescript-eslint/no-empty-interface
  interface IEditor extends IPlugin {}
}

type DrawOptions = {
  width?: number
  color?: string
  brushType?: 'pencil' | 'circle' | 'spray'
}

export default class FreeDrawPlugin implements IPluginTempl {
  static pluginName = 'FreeDrawPlugin'
  static apis = ['startDraw', 'endDraw']
  constructor(public canvas: FabricCanvas, public editor: IEditor) {}

  _bindEvent() {
    this.canvas.on('path:created', this._createdHandler)
  }

  _unbindEvent() {
    this.canvas.off('path:created', this._createdHandler)
  }

  _createdHandler = (opt: any) => {
    const path = opt.path
    path.set('id', uuid())

    // Store the original stroke properties and position
    const strokeColor = path.stroke || '#000000'
    const strokeWidth = path.strokeWidth || 3

    // Ensure the path is not filled (only stroke) and has proper stroke settings
    path.set({
      fill: null,
      stroke: strokeColor,
      strokeWidth: strokeWidth,
      selectable: true,
      evented: true,
      objectCaching: false, // Disable caching to prevent color issues
      dirty: true,
    })

    // Ensure path stays where it was drawn (don't center it)
    path.setCoords()

    // Add event listener to prevent stroke from being removed
    const preventStrokeRemoval = () => {
      if (!path.stroke || path.stroke === '' || path.stroke === 'transparent') {
        path.set('stroke', strokeColor)
        path.set('dirty', true)
        this.canvas.requestRenderAll()
      }
      if (path.fill && path.fill !== null && path.fill !== '') {
        path.set('fill', null)
        path.set('dirty', true)
        this.canvas.requestRenderAll()
      }
    }

    // Listen to modified event
    path.on('modified', preventStrokeRemoval)
    path.on('scaling', preventStrokeRemoval)
    path.on('moving', preventStrokeRemoval)
  }

  startDraw(options: DrawOptions) {
    this.canvas.isDrawingMode = true

    const brushType = options.brushType || 'pencil'
    const width = options.width || 5
    const color = options.color || '#000000'

    // Select brush type
    switch (brushType) {
      case 'circle':
        this.canvas.freeDrawingBrush = new CircleBrush(this.canvas)
        break
      case 'spray':
        this.canvas.freeDrawingBrush = new SprayBrush(this.canvas)
        ;(this.canvas.freeDrawingBrush as SprayBrush).density = 20
        ;(this.canvas.freeDrawingBrush as SprayBrush).dotWidth = 1
        break
      case 'pencil':
      default:
        this.canvas.freeDrawingBrush = new PencilBrush(this.canvas)
        break
    }

    this.canvas.freeDrawingBrush.width = width
    this.canvas.freeDrawingBrush.color = color
    this._bindEvent()
  }

  endDraw() {
    if (this.canvas.isDrawingMode) {
      this.canvas.isDrawingMode = false
      this._unbindEvent()
      return
    }
  }
}
