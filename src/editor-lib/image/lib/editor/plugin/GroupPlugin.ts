/*
 * Group plugin
 * Handles grouping and ungrouping of objects
 */

import { Group, ActiveSelection } from 'fabric'
import type { Canvas as FabricCanvas } from 'fabric'
import { isGroup, isActiveSelection } from '../utils/utils'
import { v4 as uuid } from 'uuid'
import type { IEditor, IPluginTempl } from '../interface/Editor'

type IPlugin = Pick<GroupPlugin, 'unGroup' | 'group'>

declare module '../interface/Editor' {
  // eslint-disable-next-line typescript-eslint/no-empty-interface
  interface IEditor extends IPlugin {}
}

class GroupPlugin implements IPluginTempl {
  static pluginName = 'GroupPlugin'
  static apis = ['unGroup', 'group']
  constructor(public canvas: FabricCanvas, public editor: IEditor) {}

  // Ungroup
  unGroup() {
    const activeObject = this.canvas.getActiveObject() as Group
    if (!activeObject) return
    // Get objects from group, then ungroup
    const activeObjectList = activeObject.getObjects()
    const groupLeft = activeObject.left || 0
    const groupTop = activeObject.top || 0
    
    // Remove group from canvas
    this.canvas.remove(activeObject)
    
    // Add objects back to canvas with proper positioning
    activeObjectList.forEach((item) => {
      // Set new ID for each object
      ;(item as any).id = uuid()
      // Adjust position relative to group
      item.set({
        left: (item.left || 0) + groupLeft,
        top: (item.top || 0) + groupTop,
      })
      this.canvas.add(item)
    })
    
    // Create ActiveSelection with ungrouped objects
    // Ensure activeObjectList is an array
    const activeObjectArray = Array.isArray(activeObjectList) ? activeObjectList : [];
    if (activeObjectArray.length > 0) {
      const activeSelection = new ActiveSelection(activeObjectArray, {
        canvas: this.canvas,
      })
      this.canvas.setActiveObject(activeSelection)
    }
    
    this.canvas.requestRenderAll()
  }

  group() {
    // Group elements
    const activeObj = this.canvas.getActiveObject() as ActiveSelection
    if (!activeObj) return
    const objectsInGroup = activeObj.getObjects()
    
    // Create a new Group from the objects
    const activegroup = new Group(objectsInGroup, {
      canvas: this.canvas,
    })
    
    // Set ID for the new group
    ;(activegroup as any).id = uuid()
    
    // Remove original objects from canvas
    objectsInGroup.forEach((object: any) => {
      this.canvas.remove(object)
    })
    
    // Add the new group to canvas
    this.canvas.add(activegroup)
    this.canvas.setActiveObject(activegroup)
    this.canvas.requestRenderAll()
  }

  contextMenu() {
    const activeObject = this.canvas.getActiveObject()

    if (isActiveSelection(activeObject)) {
      return [{ text: 'Group', hotkey: 'Ctrl+G', disabled: false, onclick: () => this.group() }]
    }

    if (isGroup(activeObject)) {
      return [
        { text: 'Ungroup', hotkey: 'Ctrl+Shift+G', disabled: false, onclick: () => this.unGroup() },
      ]
    }
  }
  destroy() {
    console.log('pluginDestroy')
  }
}

export default GroupPlugin
