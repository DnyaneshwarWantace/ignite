/*
 * @author wuchenguang
 * @date 2023-02-01
 * @lastEditors Image Editor
 * @lastEditTime 2023-08-01
 * @Description Plugin
 */

import { Rect } from 'fabric'
import type { Canvas as FabricCanvas } from 'fabric'
import { throttle } from 'lodash-es'
import '../styles/resizePlugin.css'
import type { IEditor, IPluginTempl } from '../interface/Editor'

type Position = 'left' | 'right' | 'top' | 'bottom'

class ResizePlugin implements IPluginTempl {
  static pluginName = 'ResizePlugin'
  static events = []
  static apis = []
  workspaceEl!: HTMLElement
  minSize = { width: 30, height: 30 }
  barOpts = {
    barWidth: 8,
    barHeight: 8,
    barPadding: 10,
  }
  hasCreatedBar = false
  isDragging = false
  dragEl: HTMLElement | null = null
  startPoints = { x: 0, y: 0 }
  barPos = { x: 0, y: 0 }
  wsPos: Record<'left' | 'top' | 'width' | 'height', number> = {
    left: 0,
    top: 0,
    width: 0,
    height: 0,
  }
  constructor(public canvas: FabricCanvas, public editor: IEditor) {
    this._init()
    this._initResizeObserve()
    this._addListeners()
  }

  _init() {
    const workspaceEl = document.querySelector('#workspace') as HTMLElement
    if (!workspaceEl) {
      throw new Error('element #workspace is missing, plz check!')
    }
    this.workspaceEl = workspaceEl
  }

  _initResizeObserve() {
    const resizeObserver = new ResizeObserver(
      throttle(() => {
        this.renderBars()
      }, 50)
    )
    resizeObserver.observe(this.workspaceEl)
  }

  renderBars() {
    const viewportTransform = this.canvas.viewportTransform
    if (!viewportTransform) return
    const [scaleX, , , scaleY, offsetX, offsetY] = viewportTransform
    const workspace = this.getWorkspace()
    if (!workspace || workspace.width === undefined || workspace.height === undefined) return
    const wsWidth = workspace.width * scaleX
    const wsHeight = workspace.height * scaleY
    const wsLeft = (workspace.left || 0) * scaleX
    const wsTop = (workspace.top || 0) * scaleY
    const { barWidth, barHeight, barPadding } = this.barOpts
    const leftBar = this._getBarFromType('left')
    leftBar.style.left = `${offsetX + wsLeft - barHeight - barPadding}px`
    leftBar.style.top = `${offsetY + wsTop + wsHeight / 2 - barWidth / 2}px`
    const rightBar = this._getBarFromType('right')
    rightBar.style.left = `${offsetX + wsLeft + wsWidth + barPadding}px`
    rightBar.style.top = `${offsetY + wsTop + wsHeight / 2 - barWidth / 2}px`
    const topBar = this._getBarFromType('top')
    topBar.style.left = `${offsetX + wsLeft + wsWidth / 2 - barWidth / 2}px`
    topBar.style.top = `${offsetY + wsTop - barHeight - barPadding}px`
    const bottomBar = this._getBarFromType('bottom')
    bottomBar.style.left = `${offsetX + wsLeft + wsWidth / 2 - barWidth / 2}px`
    bottomBar.style.top = `${offsetY + wsTop + wsHeight + barPadding}px`
    if (!this.hasCreatedBar) {
      this.hasCreatedBar = true
      this._watchDrag()
    }
  }

  _getBarFromType(type: Position) {
    let bar = document.querySelector(`#resize-${type}-bar`) as HTMLElement
    if (bar) return bar
    bar = document.createElement('div')
    bar.id = `resize-${type}-bar`
    bar.className = 'resize-bar'
    if (['left', 'right'].includes(type)) {
      bar.classList.add('horizontal')
    } else {
      bar.classList.add('vertical')
    }
    this.workspaceEl.appendChild(bar)
    return bar
  }

  _watchDrag() {
    const barList = Array.from(document.getElementsByClassName('resize-bar')) as HTMLElement[]
    barList.forEach((bar) => {
      bar.addEventListener('mousedown', (e: MouseEvent) => {
        this.isDragging = true
        this.dragEl = bar
        this.dragEl.classList.add('active')
        this.startPoints = {
          x: e.clientX,
          y: e.clientY,
        }
        this.barPos = {
          x: bar.offsetLeft,
          y: bar.offsetTop,
        }
        const workspace = this.getWorkspace()
        if (!workspace || workspace.width === undefined || workspace.height === undefined) return
        const { width, height, left, top } = workspace
        this.wsPos = { width, height, left: left || 0, top: top || 0 }
      })
    })
    document.addEventListener('mousemove', this.eventHandler.onDragging)
    document.addEventListener('mouseup', () => {
      if (this.isDragging && this.dragEl) {
        this.isDragging = false
        this.dragEl.classList.remove('active')
        this.dragEl = null
        this.canvas.defaultCursor = 'default'
      }
    })
  }

  onDragging(e: MouseEvent) {
    if (this.isDragging && this.dragEl) {
      const workspace = this.getWorkspace()
      if (!workspace || workspace.width === undefined || workspace.height === undefined) return
      const viewportTransform = this.canvas.viewportTransform
      if (!viewportTransform) return
      const [scaleX, , , scaleY] = viewportTransform
      const deltaX = e.clientX - this.startPoints.x
      const deltaY = e.clientY - this.startPoints.y
      const deltaWidth = deltaX / scaleX
      const deltaHeight = deltaY / scaleY
      const type = this.dragEl.id.split('-')[1]
      let tmpLength = 0
      switch (type) {
        case 'left':
          tmpLength = Math.round(this.wsPos.width - deltaWidth * 2)
          if (tmpLength > this.minSize.width) {
            this.dragEl.style.left = `${this.barPos.x + deltaX}px`
            workspace.set('left', this.wsPos.left + deltaWidth * 2)
            workspace.set('width', tmpLength)
          } else {
            workspace.set('left', this.wsPos.left + this.wsPos.width - this.minSize.width)
            workspace.set('width', this.minSize.width)
          }
          break
        case 'right':
          tmpLength = Math.round(this.wsPos.width + deltaWidth * 2)
          if (tmpLength > this.minSize.width) {
            this.dragEl.style.left = `${this.barPos.x + deltaX}px`
            workspace.set('width', tmpLength)
          } else {
            workspace.set('width', this.minSize.width)
          }
          break
        case 'top':
          tmpLength = Math.round(this.wsPos.height - deltaHeight * 2)
          if (tmpLength > this.minSize.height) {
            this.dragEl.style.top = `${this.barPos.y + deltaY}px`
            workspace.set('top', this.wsPos.top + deltaHeight * 2)
            workspace.set('height', tmpLength)
          } else {
            workspace.set('top', this.wsPos.top + this.wsPos.height - this.minSize.height)
            workspace.set('height', this.minSize.height)
          }
          break
        case 'bottom':
          tmpLength = Math.round(this.wsPos.height + deltaHeight * 2)
          if (tmpLength > this.minSize.height) {
            this.dragEl.style.top = `${this.barPos.y + deltaY}px`
            workspace.set('height', tmpLength)
          } else {
            workspace.set('height', this.minSize.height)
          }
          break
        default:
          break
      }

      this.editor.setCenterFromObject(workspace)
      // In Fabric.js v6, clone() returns a Promise
      workspace.clone().then((cloned: Rect) => {
        this.canvas.clipPath = cloned
        this.canvas.requestRenderAll()
      })
      if (['left', 'right'].includes(type)) {
        this.canvas.defaultCursor = 'ew-resize'
      } else {
        this.canvas.defaultCursor = 'ns-resize'
      }
      this.editor.emit('sizeChange', workspace.width, workspace.height)
    }
  }

  private eventHandler: Record<string, (...args: any) => void> = {
    render: throttle(this.renderBars.bind(this), 50),
    onDragging: throttle(this.onDragging.bind(this), 50),
  }

  _addListeners() {
    this.canvas.on('after:render', this.eventHandler.render)
  }

  getWorkspace() {
    return this.canvas.getObjects().find((item) => (item as any).id === 'workspace') as Rect | undefined
  }

  destroy() {
    console.log('pluginDestroy')
  }
}

export default ResizePlugin
