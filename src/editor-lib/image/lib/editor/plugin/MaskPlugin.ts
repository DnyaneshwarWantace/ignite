/*
 * @author demo
 * @date 2022-05-24 15:14:34
 * @lastEditors demo
 * @lastEditTime 2022-09-05 18:23:13
 * @Description Mask Plugin
 */

import { Rect } from 'fabric'
import type { Canvas as FabricCanvas } from 'fabric'
import type { IEditor, IPluginTempl } from '../interface/Editor'

type IPlugin = Pick<MaskPlugin, 'setOverMask' | 'workspaceMaskToggle' | 'getWorkspaceMaskState'>

declare module '../interface/Editor' {
  // eslint-disable-next-line @typescript-eslint/no-empty-interface
  interface IEditor extends IPlugin {}
}

class MaskPlugin implements IPluginTempl {
  static pluginName = 'MaskPlugin'
  static apis = ['setOverMask', 'workspaceMaskToggle', 'getWorkspaceMaskState']
  coverMask: null | Rect = null
  workspace: null | Rect = null
  workspaceEl!: HTMLElement
  hackFlag = false
  constructor(public canvas: FabricCanvas, public editor: IEditor) {
    this.init()
  }

  private init() {
    const workspaceEl = document.querySelector('#workspace') as HTMLElement
    if (!workspaceEl) {
      throw new Error('Element #workspace is missing, plz check!')
    }
    this.workspaceEl = workspaceEl
  }

  /**
   * @param val boolean false
   */
  workspaceMaskToggle() {
    const workspaceMask = this.getWorkspaceMask()
    if (!workspaceMask) {
      this.initMask()
    } else {
      workspaceMask && this.canvas.remove(workspaceMask)
      this.workspace!.clone().then((cloned: Rect) => {
        this.canvas.clipPath = cloned
        this.coverMask = null
        this.canvas.requestRenderAll()
      })
      this.editor.off('loadJson', this.initMask)
    }
  }
  /**
   */
  getWorkspaceMaskState() {
    return this.coverMask !== null
  }

  /**
   * @returns object
   */
  getWorkspaceMask() {
    return this.canvas.getObjects().find((item) => (item as any).id === 'coverMask') as Rect
  }

  getWorkspace() {
    return this.canvas.getObjects().find((item) => (item as any).id === 'workspace') as Rect
  }

  setOverMask(hack = false) {
    if (!this.coverMask || !this.workspace) {
      return
    }
    const center = this.canvas.getCenter()
    const zoom = this.canvas.getZoom()
    let zoomPoint: number = zoom
    if (hack) {
      zoomPoint += 0.0001 * (this.hackFlag ? 1 : -1)
      this.hackFlag = !this.hackFlag
    }

    this.canvas.zoomToPoint({ x: center.left, y: center.top } as any, zoomPoint)
    if (zoom) {
      const { workspaceEl } = this
      const width = workspaceEl.offsetWidth
      const height = workspaceEl.offsetHeight
      const cWidth = width / zoom
      const cHeight = height / zoom
      this.coverMask.width = cWidth
      this.coverMask.height = cHeight
      this.coverMask.left = (this.workspace.left || 0) + (this.workspace.width! - cWidth) / 2
      this.coverMask.top = (this.workspace.top || 0) + (this.workspace.height! - cHeight) / 2
      this.workspace.clone().then((clone: Rect) => {
        clone.left = -clone.width! / 2
        clone.top = -clone.height! / 2
        clone.inverted = true
        this.coverMask!.clipPath = clone
        this.canvas.requestRenderAll()
      })
    }
  }

  initMask(undefinedLoad = true) {
    this.workspace = this.getWorkspace()
    if (!this.workspace) {
      throw new Error('MaskPlugin must be used after WorkspacePlugin!')
    }
    const coverMask = new Rect({
      fill: 'rgba(0,0,0,0.4)',
      id: 'coverMask',
      strokeWidth: 0,
    })
    coverMask.set('selectable', false)
    coverMask.set('hasControls', false)
    coverMask.set('evented', false)
    coverMask.hoverCursor = 'default'
    this.canvas.on('object:added', () => {
      // In Fabric.js v6, use canvas.bringObjectToFront instead of object.bringToFront
      this.canvas.bringObjectToFront(coverMask)
    })
    this.canvas.clipPath = undefined
    this.canvas.add(coverMask)
    this.coverMask = coverMask
    this.setOverMask()
    undefinedLoad && this.editor.on('loadJson', () => this.initMask(false))
  }

  destroy() {
    console.log('pluginDestroy')
  }
}

export default MaskPlugin
