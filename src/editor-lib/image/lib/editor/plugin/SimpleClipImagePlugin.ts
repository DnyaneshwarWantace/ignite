import { Rect, Ellipse, Triangle, Polygon, Point, FabricImage, FabricObject, util } from 'fabric'
import type { Canvas as FabricCanvas } from 'fabric'
import { getPolygonVertices } from '@/editor-lib/image/lib/math'
import { get, set } from 'lodash-es'
import type { IEditor, IPluginTempl } from '../interface/Editor'

type IPlugin = Pick<SimpleClipImagePlugin, 'addClipPathToImage' | 'removeClip'>

declare module '../interface/Editor' {
  // eslint-disable-next-line typescript-eslint/no-empty-interface
  interface IEditor extends IPlugin {}
}

const getBounds = (activeObject: FabricObject) => {
  const { left = 0, top = 0 } = activeObject
  return {
    width: activeObject.getScaledWidth(),
    height: activeObject.getScaledHeight(),
    left,
    top,
  }
}
const bindInfo = (shell: FabricObject, activeObject: FabricObject) => {
  bindFlagToObject(shell)
  bindFlagToObject(shell, 'targetId', get(activeObject, 'id'))
  bindFlagToObject(shell, 'targetType', get(activeObject, 'type'))
}
const bindFlagToObject = (activeObject: FabricObject, key = 'clip', val: any = true) => {
  set(activeObject, key, val)
}
const createRectClip = (activeObject: FabricObject, inverted: boolean) => {
  const { width = 0, height = 0, left = 0, top = 0 } = getBounds(activeObject)
  const clipX = Math.round(width / 2)
  const clipY = Math.round(height / 2)
  const shell = new Rect({
    width: clipX,
    height: clipY,
    fill: 'rgba(0,0,0,0)',
    originX: 'center',
    originY: 'center',
    left: left + width / 2,
    top: top + height / 2,
  })
  bindInfo(shell, activeObject)
  const clipPath = new Rect({
    absolutePositioned: true,
    width: shell.width,
    height: shell.height,
    originX: 'center',
    originY: 'center',
    left: shell.left,
    top: shell.top,
    inverted: inverted,
  })
  return { clipPath, shell }
}
const createCircleClip = (activeObject: FabricObject, inverted: boolean) => {
  const point = activeObject.getCenterPoint()
  const { width } = getBounds(activeObject)
  const shell = new Ellipse({
    fill: 'rgba(0,0,0,0)',
    originX: 'center',
    originY: 'center',
    left: point.x,
    top: point.y,
    rx: width / 2,
    ry: width / 2,
  })
  bindInfo(shell, activeObject)
  const clipPath = new Ellipse({
    absolutePositioned: true,
    originX: 'center',
    originY: 'center',
    left: shell.left,
    top: shell.top,
    inverted: inverted,
    rx: shell.rx,
    ry: shell.ry,
  })
  return { shell, clipPath }
}
const createTriClip = (activeObject: FabricObject, inverted: boolean) => {
  const point = activeObject.getCenterPoint()
  const { width = 0, height = 0 } = getBounds(activeObject)
  const clipX = Math.round(width / 2)
  const clipY = Math.round(height / 2)
  const shell = new Triangle({
    fill: 'rgba(0,0,0,0)',
    originX: 'center',
    originY: 'center',
    left: point.x,
    top: point.y,
    width: clipX,
    height: clipY,
  })
  bindInfo(shell, activeObject)
  const clipPath = new Triangle({
    absolutePositioned: true,
    originX: 'center',
    originY: 'center',
    left: shell.left,
    top: shell.top,
    width: shell.width,
    height: shell.height,
    inverted: inverted,
  })
  return { shell, clipPath }
}
const createPolygonClip = (activeObject: FabricObject, inverted: boolean) => {
  const point = activeObject.getCenterPoint()
  const points = getPolygonVertices(6, 50)
  // Ensure points is an array before using
  const pointsArray = Array.isArray(points) ? points : []
  const shell = new Polygon(pointsArray, {
    fill: 'rgba(0,0,0,0)',
    originX: 'center',
    originY: 'center',
    left: point.x,
    top: point.y,
  })
  bindInfo(shell, activeObject)
  const clipPath = new Polygon([...pointsArray], {
    absolutePositioned: true,
    originX: 'center',
    originY: 'center',
    left: shell.left,
    top: shell.top,
    inverted: inverted,
  })
  return { shell, clipPath }
}
export default class SimpleClipImagePlugin implements IPluginTempl {
  static pluginName = 'SimpleClipImagePlugin'
  //  static events = ['sizeChange']
  static apis = ['addClipPathToImage', 'removeClip']
  constructor(public canvas: FabricCanvas, public editor: IEditor) {}
  addClipPathToImage(val: string) {
    const activeObject = this.canvas.getActiveObjects()[0]
    if (activeObject && activeObject.type === 'image') {
      let clip: { shell: FabricObject; clipPath: FabricObject } | null = null
      const [name, inverted] = val.split('-')
      const isInverted = !!inverted
      switch (name) {
        case 'polygon':
          clip = createPolygonClip(activeObject, isInverted)
          break
        case 'rect':
          clip = createRectClip(activeObject, isInverted)
          break
        case 'circle':
          clip = createCircleClip(activeObject, isInverted)
          break
        case 'triangle':
          clip = createTriClip(activeObject, isInverted)
          break
      }
      if (clip == null) return
      const { shell, clipPath } = clip
      shell.on('moving', (e) => {
        clipPath.setPositionByOrigin(shell.getCenterPoint(), 'center', 'center')
        activeObject.set('dirty', true)
      })
      shell.on('rotating', (e) => {
        clipPath.set({ angle: shell.angle })
        activeObject.set('dirty', true)
      })
      shell.on('scaling', (e) => {
        clipPath.set({ scaleX: shell.scaleX, scaleY: shell.scaleY })
        clipPath.setPositionByOrigin(shell.getCenterPoint(), 'center', 'center')
        activeObject.set('dirty', true)
      })
      shell.on('deselected', (e) => {
        if (clipPath instanceof Ellipse && shell instanceof Ellipse) {
          clipPath.set({ rx: shell.getRx(), ry: shell.getRy() })
          this.correctPosition(activeObject, shell, clipPath)
        } else if (shell instanceof Polygon) {
          this.correctPosition(activeObject, shell, clipPath)
          const { scaleX: cx = 1, scaleY: cy = 1 } = clipPath
          const { scaleX: sx = 1, scaleY: sy = 1 } = shell
          clipPath.set('scaleX', cx * sx)
          clipPath.set('scaleY', cy * sy)
        } else {
          this.correctPosition(activeObject, shell, clipPath)
          clipPath.set('width', shell.getScaledWidth())
          clipPath.set('height', shell.getScaledHeight())
        }
        activeObject.set('dirty', true)
        this.canvas.remove(shell)
        this.canvas.requestRenderAll()
      })
      activeObject.set({ clipPath: clipPath })
      this.canvas.add(shell)
      this.canvas.setActiveObject(shell)
    }
  }
  correctPosition(activeObject: FabricObject, shell: FabricObject, clipPath: FabricObject) {
    // Convert shell center point to activeObject's local coordinate system
    const shellCenter = shell.getCenterPoint();
    const transformMatrix = activeObject.calcTransformMatrix();
    const invertedMatrix = util.invertTransform(transformMatrix);
    const position = util.transformPoint(shellCenter, invertedMatrix);
    const { scaleX = 1, scaleY = 1 } = activeObject;
    clipPath.set({
      absolutePositioned: false,
      left: position.x / scaleX,
      top: position.y / scaleY,
      scaleX: 1 / scaleX,
      scaleY: 1 / scaleY,
    });
  }
  removeClip() {
    const activeObject = this.canvas.getActiveObjects()[0]
    if (activeObject && activeObject.type === 'image') {
      activeObject.set({ clipPath: undefined })
      activeObject.set('dirty', true)
      this.canvas.requestRenderAll()
    }
  }
}
