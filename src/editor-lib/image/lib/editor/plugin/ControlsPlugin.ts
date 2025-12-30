/*
 * @author Image Editor
 * @date 2022-05-23
 * @lastEditors Image Editor
 * @lastEditTime 2023-08-01
 * @Description Plugin
 */
import { Control, FabricObject, controlsUtils, util } from 'fabric'
import type { Canvas as FabricCanvas } from 'fabric'
// @ts-ignore - SVG import with ?url suffix
import verticalImg from '../assets/middleControl.svg?url'
// import verticalImg from './middleControl.svg'
// @ts-ignore - SVG import with ?url suffix
import horizontalImg from '../assets/middleControlHoz.svg?url'
// @ts-ignore - SVG import with ?url suffix
import edgeImg from '../assets/edgeControl.svg?url'
// @ts-ignore - SVG import with ?url suffix
import rotateImg from '../assets/rotateIcon.svg?url'
import type { IEditor, IPluginTempl } from '../interface/Editor'

/**
 * In actual scenarios, when scaling an object, fabricjs uses toFixed(2) by default.
 * To make scaling more accurate, set the default value to 4, i.e., toFixed(4).
 */
(FabricObject as any).__uid = 0

function drawImg(
  ctx: CanvasRenderingContext2D,
  left: number,
  top: number,
  img: HTMLImageElement,
  wSize: number,
  hSize: number,
  angle: number | undefined
) {
  if (angle === undefined) return
  ctx.save()
  ctx.translate(left, top)
  ctx.rotate(util.degreesToRadians(angle))
  ctx.drawImage(img, -wSize / 2, -hSize / 2, wSize, hSize)
  ctx.restore()
}

function intervalControl() {
  // Ensure controls object exists on prototype
  if (!FabricObject.prototype.controls) {
    (FabricObject.prototype as any).controls = {};
  }
  
  const verticalImgIcon = document.createElement('img')
  verticalImgIcon.src = verticalImg

  const horizontalImgIcon = document.createElement('img')
  horizontalImgIcon.src = horizontalImg

  function renderIcon(
    ctx: CanvasRenderingContext2D,
    left: number,
    top: number,
    styleOverride: any,
    fabricObject: FabricObject
  ) {
    drawImg(ctx, left, top, verticalImgIcon, 20, 25, fabricObject.angle)
  }

  function renderIconHoz(
    ctx: CanvasRenderingContext2D,
    left: number,
    top: number,
    styleOverride: any,
    fabricObject: FabricObject
  ) {
    drawImg(ctx, left, top, horizontalImgIcon, 25, 20, fabricObject.angle)
  }
  FabricObject.prototype.controls.ml = new Control({
    x: -0.5,
    y: 0,
    offsetX: -1,
    cursorStyleHandler: controlsUtils.scaleSkewCursorStyleHandler,
    actionHandler: controlsUtils.scalingXOrSkewingY,
    getActionName: controlsUtils.scaleOrSkewActionName,
    render: renderIcon,
  })

  FabricObject.prototype.controls.mr = new Control({
    x: 0.5,
    y: 0,
    offsetX: 1,
    cursorStyleHandler: controlsUtils.scaleSkewCursorStyleHandler,
    actionHandler: controlsUtils.scalingXOrSkewingY,
    getActionName: controlsUtils.scaleOrSkewActionName,
    render: renderIcon,
  })

  FabricObject.prototype.controls.mb = new Control({
    x: 0,
    y: 0.5,
    offsetY: 1,
    cursorStyleHandler: controlsUtils.scaleSkewCursorStyleHandler,
    actionHandler: controlsUtils.scalingYOrSkewingX,
    getActionName: controlsUtils.scaleOrSkewActionName,
    render: renderIconHoz,
  })

  FabricObject.prototype.controls.mt = new Control({
    x: 0,
    y: -0.5,
    offsetY: -1,
    cursorStyleHandler: controlsUtils.scaleSkewCursorStyleHandler,
    actionHandler: controlsUtils.scalingYOrSkewingX,
    getActionName: controlsUtils.scaleOrSkewActionName,
    render: renderIconHoz,
  })
}

function peakControl() {
  // Ensure controls object exists on prototype
  if (!FabricObject.prototype.controls) {
    (FabricObject.prototype as any).controls = {};
  }
  
  const img = document.createElement('img')
  img.src = edgeImg

  function renderIconEdge(
    ctx: CanvasRenderingContext2D,
    left: number,
    top: number,
    styleOverride: any,
    fabricObject: FabricObject
  ) {
    drawImg(ctx, left, top, img, 25, 25, fabricObject.angle)
  }
  FabricObject.prototype.controls.tl = new Control({
    x: -0.5,
    y: -0.5,
    cursorStyleHandler: controlsUtils.scaleCursorStyleHandler,
    actionHandler: controlsUtils.scalingEqually,
    render: renderIconEdge,
  })
  FabricObject.prototype.controls.bl = new Control({
    x: -0.5,
    y: 0.5,
    cursorStyleHandler: controlsUtils.scaleCursorStyleHandler,
    actionHandler: controlsUtils.scalingEqually,
    render: renderIconEdge,
  })
  FabricObject.prototype.controls.tr = new Control({
    x: 0.5,
    y: -0.5,
    cursorStyleHandler: controlsUtils.scaleCursorStyleHandler,
    actionHandler: controlsUtils.scalingEqually,
    render: renderIconEdge,
  })
  FabricObject.prototype.controls.br = new Control({
    x: 0.5,
    y: 0.5,
    cursorStyleHandler: controlsUtils.scaleCursorStyleHandler,
    actionHandler: controlsUtils.scalingEqually,
    render: renderIconEdge,
  })
}

// delete
/*function deleteControl(canvas: FabricCanvas) {
  const deleteIcon =
    "data:image/svg+xml,%3C%3Fxml version='1.0' encoding='utf-8'%3F%3E%3C!DOCTYPE svg PUBLIC '-//W3C//DTD SVG 1.1//EN' 'http://www.w3.org/Graphics/SVG/1.1/DTD/svg11.dtd'%3E%3Csvg version='1.1' id='Ebene_1' xmlns='http://www.w3.org/2000/svg' xmlns:xlink='http://www.w3.org/1999/xlink' x='0px' y='0px' width='595.275px' height='595.275px' viewBox='200 215 230 470' xml:space='preserve'%3E%3Ccircle style='fill:%23F44336;' cx='299.76' cy='439.067' r='218.516'/%3E%3Cg%3E%3Crect x='267.162' y='307.978' transform='matrix(0.7071 -0.7071 0.7071 0.7071 -222.6202 340.6915)' style='fill:white;' width='65.545' height='262.18'/%3E%3Crect x='266.988' y='308.153' transform='matrix(0.7071 0.7071 -0.7071 0.7071 398.3889 -83.3116)' style='fill:white;' width='65.544' height='262.179'/%3E%3C/g%3E%3C/svg%3E"
  const delImg = document.createElement('img')
  delImg.src = deleteIcon

  function renderDelIcon(
    ctx: CanvasRenderingContext2D,
    left: number,
    top: number,
    styleOverride: any,
    fabricObject: FabricObject
  ) {
    drawImg(ctx, left, top, delImg, 24, 24, fabricObject.angle)
  }

  function deleteObject(mouseEvent: MouseEvent, target: FabricTransform) {
    if (target.action === 'rotate') return true
    const activeObject = canvas.getActiveObjects()
    if (activeObject) {
      activeObject.map((item) => canvas.remove(item))
      canvas.requestRenderAll()
      canvas.discardActiveObject()
    }
    return true
  }

  FabricObject.prototype.controls.deleteControl = new Control({
    x: 0.5,
    y: -0.5,
    offsetY: -16,
    offsetX: 16,
    cursorStyle: 'pointer',
    mouseUpHandler: deleteObject,
    render: renderDelIcon,
    // cornerSize: 24,
  })
}*/

function rotationControl() {
  // Ensure controls object exists on prototype
  if (!FabricObject.prototype.controls) {
    (FabricObject.prototype as any).controls = {};
  }
  
  const img = document.createElement('img')
  img.src = rotateImg
  function renderIconRotate(
    ctx: CanvasRenderingContext2D,
    left: number,
    top: number,
    styleOverride: any,
    fabricObject: FabricObject
  ) {
    drawImg(ctx, left, top, img, 40, 40, fabricObject.angle)
  }
  FabricObject.prototype.controls.mtr = new Control({
    x: 0,
    y: 0.5,
    cursorStyleHandler: controlsUtils.rotationStyleHandler,
    actionHandler: controlsUtils.rotationWithSnapping,
    offsetY: 30,
    // withConnection: false,
    actionName: 'rotate',
    render: renderIconRotate,
  })
}

class ControlsPlugin implements IPluginTempl {
  static pluginName = 'ControlsPlugin'
  constructor(public canvas: FabricCanvas, public editor: IEditor) {
    this.init()
  }
  init() {
    // Ensure controls object exists on prototype
    if (!FabricObject.prototype.controls) {
      (FabricObject.prototype as any).controls = {};
    }
    
    // deleteControl(this.canvas)
    peakControl()
    intervalControl()
    rotationControl()

    FabricObject.prototype.set({
      transparentCorners: false,
      borderColor: '#51B9F9',
      cornerColor: '#FFF',
      borderScaleFactor: 2.5,
      cornerStyle: 'circle',
      cornerStrokeColor: '#0E98FC',
      borderOpacityWhenMoving: 1,
    })
    // Textbox.prototype.controls = FabricObject.prototype.controls
  }

  destroy() {
    console.log('pluginDestroy')
  }
}

export default ControlsPlugin
