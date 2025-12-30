

import { FabricText, Group, ActiveSelection, FabricObject, type TPointerEvent, type TPointerEventInfo } from 'fabric'
import type { Canvas as FabricCanvas } from 'fabric'
import { isGroup } from '../utils/utils'
import { v4 as uuid } from 'uuid'
import { pick } from 'lodash-es'
import type { IEditor, IPluginTempl } from '../interface/Editor'

class GroupTextEditorPlugin implements IPluginTempl {
  static pluginName = 'GroupTextEditorPlugin'
  isDown = false
  constructor(public canvas: FabricCanvas, public editor: IEditor) {
    this._init()
  }

  
  _init() {
    this.canvas.on('mouse:down', (opt: TPointerEventInfo<TPointerEvent>) => {
      this.isDown = true
      const target = opt.target as FabricObject | undefined
      if (
        target &&
        !target.lockMovementX &&
        !target.lockMovementY &&
        !target.lockRotation &&
        !target.lockScalingX &&
        !target.lockScalingY
      ) {
        target.hasControls = true
      }
    })

    this.canvas.on('mouse:up', () => {
      this.isDown = false
    })

    this.canvas.on('mouse:dblclick', (opt: TPointerEventInfo<TPointerEvent>) => {
      if (isGroup(opt.target)) {
        const selectedObject = this._getGroupObj(opt) as FabricText
        if (!selectedObject) return
        selectedObject.selectable = true
        if (selectedObject.hasControls) {
          selectedObject.hasControls = false
        }
        if (this.isText(selectedObject)) {
          this._bindTextEditingEvent(selectedObject, opt.target)
          return
        }
        this.canvas.setActiveObject(selectedObject)
        this.canvas.renderAll()
      }
    })
  }

  
  _getGroupTextObj(opt: TPointerEventInfo<TPointerEvent>) {
    const pointer = this.canvas.getScenePoint(opt.e)
    if (!isGroup(opt.target)) return false
    const clickObj = (this.canvas as any)._searchPossibleTargets(opt.target._objects, pointer)
    if (clickObj && this.isText(clickObj)) {
      return clickObj
    }
    return false
  }

  _getGroupObj(opt: TPointerEventInfo<TPointerEvent>) {
    const pointer = this.canvas.getScenePoint(opt.e)
    if (!isGroup(opt.target)) return false
    const clickObj = (this.canvas as any)._searchPossibleTargets(opt.target._objects, pointer)
    return clickObj
  }

  
  _bindTextEditingEvent(textObject: FabricText, groupObj: Group) {
    const textObjJSON = textObject.toObject()

    // Store original fill color to preserve it
    const originalFill = textObject.fill || textObjJSON.fill || '#000000'
    const originalBgColor = textObject.backgroundColor || textObjJSON.backgroundColor

    const groupMatrix: number[] = groupObj.calcTransformMatrix()

    const a: number = groupMatrix[0]
    const b: number = groupMatrix[1]
    const c: number = groupMatrix[2]
    const d: number = groupMatrix[3]
    const e: number = groupMatrix[4]
    const f: number = groupMatrix[5]

    const newX = a * (textObjJSON.left || 0) + c * (textObjJSON.top || 0) + e
    const newY = b * (textObjJSON.left || 0) + d * (textObjJSON.top || 0) + f

    const tmpText = new (textObject.constructor as typeof FabricText)((textObjJSON as any).text || '', {
      ...(textObjJSON as any),
      fill: originalFill, // Preserve original fill color
      backgroundColor: originalBgColor, // Preserve background color
      scaleX: textObjJSON.scaleX! * a,
      scaleY: textObjJSON.scaleY! * a,
      textAlign: textObjJSON.textAlign,
      left: newX,
      top: newY,
      styles: (textObjJSON as any).styles,
      group: (textObjJSON as any).group,
    });
    (tmpText as any).id = uuid()
    textObject.visible = false;
    (groupObj as any).addWithUpdate()
    tmpText.visible = true
    tmpText.selectable = true
    tmpText.hasControls = false;
    (tmpText as any).editable = true
    this.canvas.add(tmpText);
    this.canvas.setActiveObject(tmpText);
    (tmpText as any).enterEditing();
    (tmpText as any).selectAll()

    (tmpText as any).on('editing:exited', () => {
      const attrs = tmpText.toObject()

      // Only update fill if user explicitly changed it, otherwise keep original
      const finalFill = tmpText.fill === '#000000' ? originalFill : (tmpText.fill || originalFill)
      const finalBgColor = tmpText.backgroundColor || originalBgColor

      textObject.set({
        ...pick(attrs, [
          'fontSize',
          'fontStyle',
          'fontFamily',
          'lineHeight',
        ]),
        fill: finalFill, // Preserve color
        backgroundColor: finalBgColor, // Preserve background
        text: (tmpText as any).text,
        visible: true,
      });
      (groupObj as any).addWithUpdate()
      tmpText.visible = false
      this.canvas.remove(tmpText)
      this.canvas.setActiveObject(groupObj)
    })
  }

  _bindingEditingEvent(textObject: FabricText, opt: TPointerEventInfo<TPointerEvent>) {
    if (!opt.target) return
    const left = (opt.target as any).left
    const top = (opt.target as any).top
    const ids = this._unGroup() || []

    const restoreGroup = () => {
      const groupArr = this.canvas.getObjects().filter((item: any) => item.id && ids.includes(item.id))
      groupArr.forEach((item: any) => this.canvas.remove(item))

      // ensure groupArr is an array before spreading
      const group = new Group(Array.isArray(groupArr) ? [...groupArr] : []);
      (group as any).set('left', left);
      (group as any).set('top', top);
      (group as any).set('id', uuid());
      (textObject as any).off('editing:exited', restoreGroup)
      this.canvas.add(group)
      this.canvas.discardActiveObject()
      this.canvas.renderAll()
    }
    
    (textObject as any).on('editing:exited', restoreGroup)
  }

  
  _unGroup() {
    const ids: string[] = []
    const activeObj = this.canvas.getActiveObject() as Group
    if (!activeObj) return
    activeObj.getObjects().forEach((item: any) => {
      const _id = uuid()
      ids.push(_id)
      item.set('id', _id)
    });
    (activeObj as any).toActiveSelection()
    return ids
  }

  isText(obj: any) {
    return obj.type && ['i-text', 'text', 'textbox'].includes(obj.type)
  }

  destroy() {
    console.log('pluginDestroy')
  }
}

export default GroupTextEditorPlugin
