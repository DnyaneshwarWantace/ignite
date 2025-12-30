/*
 * @author Image Editor
 * @date 2022-05-24 15:14:34
 * @lastEditors Image Editor
 * @lastEditTime 2022-09-05 18:23:13
 */
import { Control, ActiveSelection, FabricObject, Canvas as FabricCanvas, util } from 'fabric'
import { SelectEvent, SelectMode } from '../eventType'
import type { IEditor, IPluginTempl } from '../interface/Editor'
// @ts-ignore - SVG import
import lockImg from '../assets/lock.svg?url'
// import lockImg from '../assets/rotateicon.svg?url'
// import unlockImg from '../assets/unlock.svg?url'

type IPlugin = Pick<LockPlugin, 'lock' | 'unlock'>

declare module '../interface/Editor' {
  // eslint-disable-next-line @typescript-eslint/no-empty-interface
  interface IEditor extends IPlugin {}
}

enum TypeKey {
  lockMovementX = 'lockMovementX',
  lockMovementY = 'lockMovementY',
  lockRotation = 'lockRotation',
  lockScalingX = 'lockScalingX',
  lockScalingY = 'lockScalingY',
}

enum ControlKey {
  bl = 'bl',
  br = 'br',
  mb = 'mb',
  ml = 'ml',
  mr = 'mr',
  mt = 'mt',
  tl = 'tl',
  tr = 'tr',
  mtr = 'mtr',
  lock = 'lock',
}

export default class LockPlugin implements IPluginTempl {
  static pluginName = 'LockPlugin'
  static apis = ['lock', 'unlock']
  constructor(public canvas: FabricCanvas, public editor: IEditor) {
    this.init()
  }

  init() {
    const imgEl = document.createElement('img')
    imgEl.src = lockImg
    const that = this
    function renderIcon(
      ctx: CanvasRenderingContext2D,
      left: number,
      top: number,
      styleOverride: any,
      fabricObject: FabricObject
    ) {
      const iconWidth = 20
      ctx.save()
      ctx.translate(left, top)
      const angle = fabricObject.angle as number
      ctx.rotate(util.degreesToRadians(angle))
      ctx.drawImage(imgEl, -iconWidth / 2, -iconWidth / 2, iconWidth, iconWidth)
      ctx.restore()
    }

    function unlockObject(eventData: any, transform: any): boolean {
      that.unlock()
      return true
    }

    // Ensure controls object exists on prototype
    if (!FabricObject.prototype.controls) {
      (FabricObject.prototype as any).controls = {};
    }
    FabricObject.prototype.controls.lock = new Control({
      x: 0.5,
      y: 0.5,
      offsetY: 30,
      cursorStyle: 'pointer',
      mouseUpHandler: unlockObject,
      render: renderIcon,
    })

    // Textbox uses different control coordinates
    // (Textbox as any).prototype.controls.lock = new Control({
    //   x: 0.5,
    //   y: 0.5,
    //   offsetY: 30,
    //   cursorStyle: 'pointer',
    //   mouseUpHandler: unlockObject,
    //   render: renderIcon,
    // })
    this.canvas.on('selection:created', () => this.renderForEveryActiveObj())
    this.canvas.on('selection:updated', () => this.renderForEveryActiveObj())

    // Override _groupSelectedObjects to filter out locked objects
    const originalGroupSelectedObjects = (FabricCanvas.prototype as any)._groupSelectedObjects;
    (FabricCanvas.prototype as any)._groupSelectedObjects = function (this: FabricCanvas) {
      // In Fabric.js v6, _collectObjects doesn't accept arguments
      // Try calling without arguments first, or use getActiveObjects as fallback
      let group: FabricObject[];
      try {
        // Try to call _collectObjects without arguments (v6 signature)
        const collected = (this as any)._collectObjects ? (this as any)._collectObjects() : this.getActiveObjects();
        group = Array.isArray(collected) ? collected : [];
      } catch {
        // Fallback to getActiveObjects if _collectObjects doesn't work
        const activeObjects = this.getActiveObjects();
        group = Array.isArray(activeObjects) ? activeObjects : [];
      }
      
      let aGroup

      for (let i = group.length - 1; i >= 0; i--) {
        if (group[i].lockMovementX) {
          group.splice(i, 1)
        }
      }

      // do not create group for 1 element only
      if (group.length === 1) {
        this.setActiveObject(group[0])
      } else if (group.length > 1) {
        // reverse() modifies the array in place and returns it
        const reversedGroup = [...group].reverse();
        aGroup = new ActiveSelection(reversedGroup, {
          canvas: this,
        })
        this.setActiveObject(aGroup)
      }
    }

    // Override _handleGrouping to filter out locked objects
    const originalHandleGrouping = (FabricCanvas.prototype as any)._handleGrouping;
    (FabricCanvas.prototype as any)._handleGrouping = function (this: FabricCanvas, e: any, target: FabricObject | undefined) {
      const activeObject = (this as any)._activeObject
      // avoid multi select when shift click on a corner
      if (activeObject.__corner) {
        return
      }

      if (!target) {
        return
      }

      if (target.lockMovementX) return
      if (activeObject.lockMovementX) return

      if (target && target === activeObject) {
        // if it's a group, find target again, using activeGroup objects
        // In Fabric.js v6, findTarget might have a different signature
        const foundTarget = (this as any).findTarget ? (this as any).findTarget(e, true) : this.findTarget(e)
        // if even object is not found or we are on activeObjectCorner, bail out
        if (!foundTarget || !foundTarget.selectable) {
          return
        }
        if (foundTarget.lockMovementX) return
        target = foundTarget as FabricObject
      }
      
      if (!target) {
        return
      }
      if (activeObject && activeObject.type === 'activeSelection') {
        // In Fabric.js v6, these methods might not exist or have different signatures
        if ((this as any)._updateActiveSelection) {
          (this as any)._updateActiveSelection(target, e)
        }
      } else {
        if ((this as any)._createActiveSelection) {
          (this as any)._createActiveSelection(target, e)
        }
      }
    }
  }

  controlCornersVisible(obj: FabricObject) {
    const isLocked = obj.lockMovementX
    Object.values(ControlKey).forEach((key: ControlKey) => {
      if (key === ControlKey.lock) {
        obj.setControlVisible(key, isLocked)
      } else {
        obj.setControlVisible(key, !isLocked)
      }
    })
  }

  renderForEveryActiveObj() {
    const actives = this.canvas
      .getActiveObjects()
      .filter((item) => !(item instanceof ActiveSelection))
    if (actives && actives.length === 1) {
      const active = actives[0]
      this.controlCornersVisible(active)
    } else if (actives && actives.length > 1) {
      const active = this.canvas.getActiveObject()
      if (active) {
        this.controlCornersVisible(active)
      }
    }
  }

  hookImportAfter() {
    this.canvas.forEachObject((obj: FabricObject) => {
      if (obj.hasControls === false && obj.selectable === false) {
        this.canvas.setActiveObject(obj)
        this.lock()
      }
    })
    return Promise.resolve()
  }

  lock() {
    const activeObject = this.canvas.getActiveObject() as FabricObject
    if (activeObject) {
      Object.values(TypeKey).forEach((key: TypeKey) => {
        activeObject[key] = true
      })
      this.controlCornersVisible(activeObject)
      this.canvas.renderAll()
      this.editor.emit(SelectEvent.ONE, [activeObject])
    }
  }

  unlock() {
    const activeObject = this.canvas.getActiveObject() as FabricObject
    if (activeObject) {
      activeObject.hasControls = true
      activeObject.selectable = true
      activeObject.evented = true
      Object.values(TypeKey).forEach((key: TypeKey) => {
        activeObject[key] = false
      })
      this.controlCornersVisible(activeObject)
      this.canvas.renderAll()
      this.editor.emit(SelectEvent.ONE, [activeObject])
    }
  }

  contextMenu() {
    const selectedMode = this.editor.getSelectMode()
    const activeObject = this.canvas.getActiveObject()
    if (selectedMode === SelectMode.ONE && activeObject) {
      if (activeObject.selectable) {
        return [{ text: '锁定', hotkey: '', onclick: () => this.lock() }]
      } else {
        return [{ text: '解锁', hotkey: '', onclick: () => this.unlock() }]
      }
    }
  }

  destroy() {
    console.log('pluginDestroy')
  }
}
