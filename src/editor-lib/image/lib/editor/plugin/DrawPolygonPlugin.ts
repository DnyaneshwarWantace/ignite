import { Circle, Line, Point, Polygon } from 'fabric'
import type { Canvas as FabricCanvas } from 'fabric'
import { v4 as uuid } from 'uuid'
import { shiftAngle } from '../utils/utils'
import type { IEditor, IPluginTempl } from '../interface/Editor'

type IPlugin = Pick<DrawPolygonPlugin, 'beginDrawPolygon' | 'endDrawPolygon' | 'discardPolygon'>

declare module '../interface/Editor' {
  // eslint-disable-next-line @typescript-eslint/no-empty-interface
  interface IEditor extends IPlugin {}
}

type LineCoords = [Point, Point]
type Listener = (ev: any) => void
type OnEnd = (...args: any[]) => void
class DrawPolygonPlugin implements IPluginTempl {
  isDrawingPolygon = false
  points: Point[] = []
  lines: Line[] = []
  anchors: Circle[] = []
  tmpPoint: Point | undefined
  tmpLine: Line | undefined
  lastPoint: Point | undefined
  onEnd!: OnEnd
  delta = 10
  static pluginName = 'DrawPolygonPlugin'
  static apis = ['beginDrawPolygon', 'endDrawPolygon', 'discardPolygon']
  constructor(public canvas: FabricCanvas, public editor: IEditor) {}

  _hassingHistory() {
    return this.canvas.off && typeof this.canvas.off === 'function'
  }
  _bindEvent() {
    window.addEventListener('keydown', this._escListener)
    this.canvas.on('mouse:down', this._downHandler)
    this.canvas.on('mouse:move', this._moveHandler)
  }
  _escListener = (evt: KeyboardEvent) => {
    if (evt.key === 'Escape' || evt['keyCode'] === 27) {
      this._confirmBuildPolygon()
    }
  }
  _downHandler = (ev: any): void => {
    if (!this.isDrawingPolygon) return
    const absolutePointer = ev.absolutePointer!
    const confirmPoint = new Point(absolutePointer.x, absolutePointer.y)
    const anchor = this._makeAnchor(absolutePointer)
    this.anchors.push(anchor)
    if (this.tmpLine === undefined) {
      const tmpPoint = new Point(absolutePointer.x, absolutePointer.y)
      this.tmpLine = this._makeLine([tmpPoint, tmpPoint])
      this.canvas.add(this.tmpLine)
    } else {
      ev.e.shiftKey && confirmPoint.setXY(this.tmpLine.x2!, this.tmpLine.y2!)
      anchor.set({ left: confirmPoint.x, top: confirmPoint.y })
      this.tmpLine.set({
        x2: confirmPoint.x,
        y2: confirmPoint.y,
        x1: confirmPoint.x,
        y1: confirmPoint.y,
      })
    }
    if (this.lastPoint) {
      const line = this._makeLine([this.lastPoint, confirmPoint])
      this.lines.push(line)
      this.canvas.add(line)
      if (this.points[0].distanceFrom(confirmPoint) / this.canvas.getZoom() < this.delta) {
        this._confirmBuildPolygon()
        return
      }
    }
    this.canvas.add(anchor)
    this.lastPoint = confirmPoint
    this.points.push(confirmPoint)
    this._ensureAnchorsForward()
  }
  _moveHandler = (ev: any): void => {
    if (!this.isDrawingPolygon || !this.tmpLine) return
    const absPoint = ev.absolutePointer!
    if (ev.e.shiftKey && this.lastPoint) {
      const point = shiftAngle(this.lastPoint, absPoint)
      this.tmpLine.set({
        x2: point.x,
        y2: point.y,
      })
    } else {
      this.tmpLine.set({
        x2: absPoint.x,
        y2: absPoint.y,
      })
    }
    this.canvas.requestRenderAll()
  }
  _ensureAnchorsForward() {
    this.anchors.forEach((item) => {
      this.canvas.bringObjectForward(item)
    })
  }
  _unbindEvent() {
    window.removeEventListener('keydown', this._escListener)
    this.canvas.off('mouse:down', this._downHandler as Listener)
    this.canvas.off('mouse:move', this._moveHandler as Listener)
  }
  _createPolygon(points: Point[]) {
    return new Polygon(points, {
      fill: '#808080',
      stroke: '#000000',
      strokeWidth: 8,
      // eslint-disable-next-line @typescript-eslint/ban-ts-comment
      // @ts-ignore
      id: uuid(),
    })
  }
  _makeLine(coords: LineCoords) {
    const [p1, p2] = coords
    return new Line([p1.x, p1.y, p2.x, p2.y], {
      fill: '#000',
      stroke: '#000',
      strokeWidth: 4,
      selectable: false,
      evented: false,
    })
  }
  _makeAnchor(position: Point) {
    return new Circle({
      radius: 5,
      left: position.x,
      top: position.y,
      fill: 'rgb(0, 0, 255)',
      scaleX: 1 / this.canvas.getZoom(),
      scaleY: 1 / this.canvas.getZoom(),
      strokeWidth: 1 / this.canvas.getZoom(),
      originX: 'center',
      originY: 'center',
      evented: false,
      selectable: false,
    })
  }
  _confirmBuildPolygon() {
    const points = this.points
    this.discardPolygon()
    if (this._hassingHistory()) {
      (this.canvas as any).historyProcessing = false
    }
    if (points.length > 2) {
      const poly = this._createPolygon(points)
      this.canvas.add(poly)
    }
  }
  _prepare() {
    this.canvas.discardActiveObject()
    this.canvas.getObjects().forEach((obj) => {
      obj.selectable = false
      obj.hasControls = false
    })
  }
  beginDrawPolygon(onEnd: OnEnd) {
    this._prepare()
    this.onEnd = onEnd
    if (this._hassingHistory()) {
      (this.canvas as any).historyProcessing = true
    }
    this.canvas.requestRenderAll()
    this.isDrawingPolygon = true
    this._bindEvent()
  }
  endDrawPolygon() {
    this.canvas.discardActiveObject()
    this.isDrawingPolygon = false
    this.lastPoint = undefined
    this.tmpPoint = undefined
    this._unbindEvent()
    this.onEnd && this.onEnd()
    this.onEnd = undefined as any
  }
  discardPolygon() {
    this.lines.forEach((item) => {
      this.canvas.remove(item)
    })
    this.anchors.forEach((item) => {
      this.canvas.remove(item)
    })
    this.tmpLine && this.canvas.remove(this.tmpLine)
    this.tmpLine = undefined
    this.anchors = []
    this.lines = []
    this.points = []
    this.endDrawPolygon()
  }
}

export default DrawPolygonPlugin
