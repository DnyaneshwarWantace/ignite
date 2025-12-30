/*
 * @author Image Editor
 * @date 2022-05-23
 * @lastEditors Image Editor
 * @lastEditTime 2023-08-01
 * @Description Plugin
 */
import { Control, FabricObject, controlsUtils } from 'fabric'
import type { Canvas as FabricCanvas } from 'fabric'
import type { IEditor, IPluginTempl } from '../interface/Editor'

function rotateCursorIcon(angle: number) {
  return `url("data:image/svg+xml,%3Csvg height='19' width='19' viewBox='0 0 32 32' xmlns='http://www.w3.org/2000/svg' style='color: black'%3E%3Cg fill='none' transform='rotate(${angle} 16 16)'%3E%3Cpath d='M18.27 2.266C16.799.346 13.2.346 11.73 2.266l-.71.886C9.745 4.671 9.745 7.329 11.02 8.85c.49.583.49 1.45 0 2.032-.488.582-1.28.582-1.767 0-2.55-3.04-2.55-7.563 0-10.604l.71-.885C12.613-3.535 19.387-3.535 22.036.393l.71.886c2.55 3.04 2.55 7.563 0 10.604-.488.582-1.28.582-1.768 0a1.442 1.442 0 0 1 0-2.032c1.276-1.521 1.276-4.179 0-5.7z' fill='white'/%3E%3Cpath d='M15.612 5.636c1.17-1.393 3.606-1.393 4.776 0l.355.443c1.17 1.393 1.17 3.67 0 5.063-.244.29-.244.724 0 1.015.245.29.64.29.884 0 1.755-2.091 1.755-5.204 0-7.296l-.355-.443C19.412 1.929 15.588 1.929 13.728 4.42l-.355.443c-1.755 2.091-1.755 5.204 0 7.296.244.29.639.29.884 0 .244-.29.244-.724 0-1.015-1.17-1.393-1.17-3.67 0-5.063z' fill='black'/%3E%3C/g%3E%3C/svg%3E ") 12 2,crosshair`
}

class ControlsRotatePlugin implements IPluginTempl {
  static pluginName = 'ControlsRotatePlugin'
  constructor(public canvas: FabricCanvas, public editor: IEditor) {
    this.init()
  }
  init() {
    const { canvas } = this
    // Ensure controls object exists on prototype
    if (!FabricObject.prototype.controls) {
      (FabricObject.prototype as any).controls = {};
    }
    // Add rotation control response area
    FabricObject.prototype.controls.mtr0 = new Control({
      x: -0.5,
      y: -0.5,
      offsetY: -40,
      offsetX: -40,
      actionName: 'rotate',
      actionHandler: controlsUtils.rotationWithSnapping,
      render: () => '',
    })
    // ↖ Top-left
    FabricObject.prototype.controls.mtr1 = new Control({
      x: 0.5,
      y: -0.5,
      offsetY: -40,
      offsetX: 40,
      actionName: 'rotate',
      actionHandler: controlsUtils.rotationWithSnapping,
      render: () => '',
    }) // ↗ Top-right
    FabricObject.prototype.controls.mtr2 = new Control({
      x: 0.5,
      y: 0.5,
      offsetY: 40,
      offsetX: 40,
      actionName: 'rotate',
      actionHandler: controlsUtils.rotationWithSnapping,
      render: () => '',
    }) // ↘ Bottom-right
    FabricObject.prototype.controls.mtr3 = new Control({
      x: -0.5,
      y: 0.5,
      offsetY: 40,
      offsetX: -40,
      actionName: 'rotate',
      actionHandler: controlsUtils.rotationWithSnapping,
      render: () => '',
    }) // ↙ Bottom-left

    // Execute on render
    canvas.on('after:render', (e) => {
      const activeObj = canvas.getActiveObject()
      if (activeObj && activeObj.angle !== undefined) {
        const angle = activeObj.angle.toFixed(0)
        FabricObject.prototype.controls.mtr0.cursorStyle = rotateCursorIcon(Number(angle))
        FabricObject.prototype.controls.mtr1.cursorStyle = rotateCursorIcon(Number(angle) + 90)
        FabricObject.prototype.controls.mtr2.cursorStyle = rotateCursorIcon(Number(angle) + 180)
        FabricObject.prototype.controls.mtr3.cursorStyle = rotateCursorIcon(Number(angle) + 270)
      }
    })

    // Update rotation control icon in real-time when rotating
    canvas.on('object:rotating', (event) => {
      const activeObj = canvas.getActiveObject()
      if (!activeObj || activeObj.angle === undefined) return
      const body = (canvas as any).lowerCanvasEl?.nextSibling as HTMLElement | null
      if (!body) return
      const angle = activeObj.angle.toFixed(0)
      switch ((event.transform as any)?.corner) {
        case 'mtr0':
          body.style.cursor = rotateCursorIcon(Number(angle))
          break
        case 'mtr1':
          body.style.cursor = rotateCursorIcon(Number(angle) + 90)
          break
        case 'mtr2':
          body.style.cursor = rotateCursorIcon(Number(angle) + 180)
          break
        case 'mtr3':
          body.style.cursor = rotateCursorIcon(Number(angle) + 270)
          break
        default:
          break
      } // Set four-corner rotation cursor
    })
  }

  destroy() {
    console.log('pluginDestroy')
  }
}

export default ControlsRotatePlugin
