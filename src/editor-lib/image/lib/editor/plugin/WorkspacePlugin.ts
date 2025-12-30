/*
 * @author Image Editor
 * @date 2022-08-18
 * @lastEditors Image Editor
 * @lastEditTime 2023-06-08
 * @Description Plugin
 */

import { Rect, Point, iMatrix, util } from 'fabric'
import { throttle } from 'lodash-es'
import type { IEditor, IPluginTempl } from '../interface/Editor'
import type { Canvas as FabricCanvas } from 'fabric'

type IPlugin = Pick<
  WorkspacePlugin,
  | 'big'
  | 'small'
  | 'auto'
  | 'one'
  | 'setSize'
  | 'getWorkspace'
  | 'setWorkspaceBg'
  | 'setCenterFromObject'
>

declare module '../interface/Editor' {
  // eslint-disable-next-line typescript-eslint/no-empty-interface
  interface IEditor extends IPlugin {}
}

class WorkspacePlugin implements IPluginTempl {
  static pluginName = 'WorkspacePlugin'
  static events = ['sizeChange']
  static apis = [
    'big',
    'small',
    'auto',
    'one',
    'setSize',
    'getWorkspace',
    'setWorkspaceBg',
    'setCenterFromObject',
  ]
  workspaceEl!: Element
  workspace: null | Rect | undefined
  resizeObserver!: ResizeObserver
  option: any
  zoomRatio: number
  constructor(public canvas: FabricCanvas, public editor: IEditor, options?: any) {
    this.workspace = null
    // Use options if provided, otherwise use defaults
    const initOptions = options && typeof options === 'object' && 'width' in options && 'height' in options
      ? { width: options.width, height: options.height }
      : { width: 300, height: 300 }
    this.init(initOptions)
    this.zoomRatio = 0.85
  }

  init(option: { width: number; height: number }) {
    const workspaceEl = document.querySelector('#workspace') as Element
    if (!workspaceEl) {
      throw new Error('Element #workspace is missing, please check!')
    }
    this.workspaceEl = workspaceEl
    this.workspace = null
    this.option = option
    this._initBackground()
    this._initWorkspace()
    this._initResizeObserve()
    this._bindWheel()
  }

  hookImportAfter() {
    return new Promise((resolve) => {
      const workspace = this.canvas.getObjects().find((item) => (item as any).id === 'workspace')
      if (workspace) {
        workspace.set('selectable', false)
        workspace.set('hasControls', false)
        workspace.set('evented', false)
        if (workspace.width && workspace.height) {
          this.setSize(workspace.width, workspace.height)
          this.editor.emit('sizeChange', workspace.width, workspace.height)
        }
      }
      resolve('')
    })
  }

  hookSaveAfter() {
    return new Promise((resolve) => {
      this.auto()
      resolve(true)
    })
  }

  _initBackground() {
    // In Fabric.js v6, set backgroundImage to undefined to clear it
    this.canvas.backgroundImage = undefined
    const workspaceEl = this.workspaceEl as HTMLElement
    const width = workspaceEl.offsetWidth || 800
    const height = workspaceEl.offsetHeight || 600
    // In Fabric.js v6, directly set width and height properties
    if (width > 0 && height > 0) {
      this.canvas.width = width
      this.canvas.height = height
    }
  }

  _initWorkspace() {
    const { width, height } = this.option
    const workspace = new Rect({
      fill: 'rgba(255,255,255,1)',
      width,
      height,
      id: 'workspace',
      strokeWidth: 0,
    })
    workspace.set('selectable', false)
    workspace.set('hasControls', false)
    workspace.hoverCursor = 'default'
    this.canvas.add(workspace)
    this.canvas.renderAll()

    this.workspace = workspace
    // historyClear is a custom method added by fabric-history.ts
    if ((this.canvas as any).historyClear) {
      (this.canvas as any).historyClear()
    }
    this.auto()
  }

  getWorkspace() {
    return this.canvas.getObjects().find((item) => (item as any).id === 'workspace') as Rect | undefined
  }

  /**
   */
  setCenterFromObject(obj: Rect) {
    const { canvas } = this
    const objCenter = obj.getCenterPoint()
    const viewportTransform = canvas.viewportTransform
    if (canvas.width === undefined || canvas.height === undefined || !viewportTransform) return
    viewportTransform[4] = canvas.width / 2 - objCenter.x * viewportTransform[0]
    viewportTransform[5] = canvas.height / 2 - objCenter.y * viewportTransform[3]
    canvas.setViewportTransform(viewportTransform)
    canvas.renderAll()
  }

  _initResizeObserve() {
    const resizeObserver = new ResizeObserver(
      throttle(() => {
        this.auto()
      }, 50)
    )
    this.resizeObserver = resizeObserver
    this.resizeObserver.observe(this.workspaceEl)
  }

  setSize(width: number, height: number) {
    this._initBackground()
    this.option.width = width
    this.option.height = height
    this.workspace = this.canvas
      .getObjects()
      .find((item) => (item as any).id === 'workspace') as Rect | undefined
    if (!this.workspace) return
    this.workspace.set('width', width)
    this.workspace.set('height', height)
    this.editor.emit('sizeChange', this.workspace.width, this.workspace.height)
    this.auto()
  }

  setZoomAuto(scale: number, cb?: (left: number, top: number) => void) {
    const workspaceEl = this.workspaceEl as HTMLElement
    const width = workspaceEl.offsetWidth || this.canvas.width || 800
    const height = workspaceEl.offsetHeight || this.canvas.height || 600
    // In Fabric.js v6, directly set width and height properties
    if (width > 0 && height > 0) {
      this.canvas.width = width
      this.canvas.height = height
    }
    const center = this.canvas.getCenter()
    // iMatrix is [1, 0, 0, 1, 0, 0] - identity matrix for resetting viewport
    this.canvas.setViewportTransform([1, 0, 0, 1, 0, 0] as [number, number, number, number, number, number])
    this.canvas.zoomToPoint(new Point(center.left, center.top), scale)
    if (!this.workspace) return
    this.setCenterFromObject(this.workspace)

    // In Fabric.js v6, clone() returns a Promise
    this.workspace.clone().then((cloned: Rect) => {
      this.canvas.clipPath = cloned
      this.canvas.requestRenderAll()
    })
    if (cb) cb(this.workspace.left, this.workspace.top)
  }

  _getScale() {
    const workspaceEl = this.workspaceEl as HTMLElement
    const workspace = this.getWorkspace()
    if (!workspace) return 1
    return util.findScaleToFit(workspace, {
      width: workspaceEl.offsetWidth,
      height: workspaceEl.offsetHeight,
    })
  }

  big() {
    let zoomRatio = this.canvas.getZoom()
    zoomRatio += 0.05
    const center = this.canvas.getCenter()
    this.canvas.zoomToPoint(new Point(center.left, center.top), zoomRatio)
  }

  small() {
    let zoomRatio = this.canvas.getZoom()
    zoomRatio -= 0.05
    const center = this.canvas.getCenter()
    this.canvas.zoomToPoint(
      new Point(center.left, center.top),
      zoomRatio < 0 ? 0.01 : zoomRatio
    )
  }

  auto() {
    const scale = this._getScale()
    this.setZoomAuto(scale * this.zoomRatio)
  }

  one() {
    this.setZoomAuto(1 * this.zoomRatio)
    this.canvas.requestRenderAll()
  }

  setWorkspaceBg(color: string) {
    const workspace = this.getWorkspace()
    if (!workspace) return
    workspace.set('fill', color)
  }

  _bindWheel() {
    this.canvas.on('mouse:wheel', function (this: FabricCanvas, opt) {
      const delta = opt.e.deltaY
      let zoom = this.getZoom()
      zoom *= 0.999 ** delta
      if (zoom > 20) zoom = 20
      if (zoom < 0.01) zoom = 0.01
      const center = this.getCenter()
      this.zoomToPoint(new Point(center.left, center.top), zoom)
      opt.e.preventDefault()
      opt.e.stopPropagation()
    })
  }

  destroy() {
    this.resizeObserver.disconnect()
    this.canvas.off()
    console.log('plugin destroy')
  }
}

export default WorkspacePlugin
