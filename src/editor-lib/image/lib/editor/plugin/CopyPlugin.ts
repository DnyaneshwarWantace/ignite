/*
 * @author Image Editor
 * @date 2022-05-23
 * @lastEditors Image Editor
 * @lastEditTime 2023-08-01
 * @Description Plugin
 */

import { FabricImage, ActiveSelection, FabricObject, util, loadSVGFromURL, Textbox, IText } from 'fabric'
import type { Canvas as FabricCanvas } from 'fabric'
import { v4 as uuid } from 'uuid'
import { getImgStr } from '../utils/utils'
import type { IEditor, IPluginTempl } from '../interface/Editor'

type IPlugin = Pick<CopyPlugin, 'clone'>

declare module '../interface/Editor' {
  // eslint-disable-next-line typescript-eslint/no-empty-interface
  interface IEditor extends IPlugin {}
}

class CopyPlugin implements IPluginTempl {
  static pluginName = 'CopyPlugin'
  static apis = ['clone']
  hotkeys: string[] = ['ctrl+v', 'ctrl+c']
  private cache: null | ActiveSelection | FabricObject = null
  constructor(public canvas: FabricCanvas, public editor: IEditor) {
    this.initPaste()
  }

  // Copy multiple selected objects
  async _copyActiveSelection(activeObject: FabricObject) {
    // Spacing settings
    const grid = 10
    const canvas = this.canvas
    const cloned = await activeObject.clone()
    // Clone again to handle multiple object selection
    const clonedObj = await cloned.clone() as ActiveSelection
    canvas.discardActiveObject()
    if (clonedObj.left === undefined || clonedObj.top === undefined) return
    // Reassign the cloned canvas
    clonedObj.canvas = canvas
    // Set position information
    clonedObj.set({
      left: clonedObj.left + grid,
      top: clonedObj.top + grid,
      evented: true,
      id: uuid(),
    })
    clonedObj.forEachObject((obj: FabricObject) => {
      (obj as any).id = uuid()
      canvas.add(obj)
    })
    // Fix unselectable issue
    clonedObj.setCoords()
    canvas.setActiveObject(clonedObj)
    canvas.requestRenderAll()
  }

  // Copy single object
  async _copyObject(activeObject: FabricObject) {
    // Spacing settings
    const grid = 10
    const canvas = this.canvas
    const cloned = await activeObject.clone()
    if (cloned.left === undefined || cloned.top === undefined) return
    canvas.discardActiveObject()
    // Set position information
    cloned.set({
      left: cloned.left + grid,
      top: cloned.top + grid,
      evented: true,
      id: uuid(),
    })
    canvas.add(cloned)
    canvas.setActiveObject(cloned)
    canvas.requestRenderAll()
  }

  // Copy element
  clone(paramsActiveObject: ActiveSelection | FabricObject) {
    const activeObject = paramsActiveObject || this.canvas.getActiveObject()
    if (!activeObject) return
    if (activeObject.type === 'activeSelection') {
      this._copyActiveSelection(activeObject)
    } else {
      this._copyObject(activeObject)
    }
  }

  // Hotkey extension callback
  hotkeyEvent(eventName: string, e: KeyboardEvent) {
    if (eventName === 'ctrl+c' && e.type === 'keydown') {
      const activeObject = this.canvas.getActiveObject()
      this.cache = activeObject || null
      // Clear clipboard
      navigator.clipboard.writeText('')
    }
    if (eventName === 'ctrl+v' && e.type === 'keydown') {
      // Ensure clone element operation executes after pasteListener
      setTimeout(() => {
        if (this.cache) {
          this.clone(this.cache)
        }
      }, 0)
    }
  }

  contextMenu() {
    const activeObject = this.canvas.getActiveObject()
    if (activeObject) {
      return [{ text: 'Copy', hotkey: 'Ctrl+V', disabled: false, onclick: () => this.clone(activeObject) }]
    }
  }

  destroy() {
    console.log('pluginDestroy')
    window.removeEventListener('paste', this.pasteListener)
  }

  initPaste() {
    window.addEventListener('paste', (e) => this.pasteListener(e))
  }

  async pasteListener(event: any) {
    const canvas = this.canvas
    const activeEl = document.activeElement as HTMLElement | null
    const isInputLike =
      activeEl?.tagName === 'INPUT' ||
      activeEl?.tagName === 'TEXTAREA' ||
      activeEl?.getAttribute?.('contenteditable') === 'true'
    if (isInputLike) {
      return
    }
    if (activeEl !== document.body) {
      event.preventDefault()
    } else {
      return
    }

    const items = (event.clipboardData || event.originalEvent.clipboardData).items
    const fileAccept = '.psd,.psd,.cdr,.ai,.svg,.jpg,.jpeg,.png,.webp,.json'
    for (const item of items) {
      if (item.kind === 'file') {
        const file = item.getAsFile()
        const crfileix: string | undefined = file.name.split('.').pop()
        if (!fileAccept.split(',').includes(`.${crfileix}`)) return
        if (crfileix === 'svg') {
          const svgFile = await getImgStr(file)
          if (!svgFile) throw new Error('file is undefined')
          loadSVGFromURL(svgFile as string).then(({ objects, options }) => {
            const filteredObjects = objects.filter((obj): obj is FabricObject => obj !== null)
            const item = util.groupSVGElements(filteredObjects, options)
            if (item) {
              (item as any).name = 'default'
              ;(item as any).id = uuid()
              canvas.add(item)
              canvas.centerObject(item)
              canvas.requestRenderAll()
            }
          })
        }
        // if (crfileix === 'json') {
        //   const dataText = await getImgText(file)
        //   const template = JSON.parse(dataText)
        //   addTemplate(template)
        // }
        if (item.type.indexOf('image/') === 0) {
          // This is an image file
          const imageUrl = URL.createObjectURL(file)
          const imgEl = document.createElement('img')
          imgEl.src = imageUrl
          // Insert into page
          document.body.appendChild(imgEl)
          imgEl.onload = () => {
            // Create image object
            const imgInstance = new FabricImage(imgEl, {
              left: 100,
              top: 100,
            })
            ;(imgInstance as any).id = uuid()
            ;(imgInstance as any).name = 'Image'
            // Set scaling
            canvas.add(imgInstance)
            canvas.setActiveObject(imgInstance)
            canvas.requestRenderAll()
            // Delete image element from page
            imgEl.remove()
          }
        }
      } else if (item.kind === 'string' && item.type.indexOf('text/plain') === 0) {
        // Text data
        item.getAsString((text: any) => {
          // Insert into text box
          const activeObject = canvas.getActiveObject() as Textbox
          // If active text, insert copied content at cursor position
          if (
            activeObject &&
            (activeObject.type === 'textbox' || activeObject.type === 'i-text') &&
            activeObject.text
          ) {
            const cursorPosition = activeObject.selectionStart
            const textBeforeCursorPosition = activeObject.text.substring(0, cursorPosition)
            const textAfterCursorPosition = activeObject.text.substring(cursorPosition as number)

            // Update text object's text
            activeObject.set('text', textBeforeCursorPosition + text + textAfterCursorPosition)

            // Reset cursor position
            activeObject.selectionStart = cursorPosition + text.length
            activeObject.selectionEnd = cursorPosition + text.length

            // Re-render canvas to show updated text
            activeObject.dirty = true
            canvas.requestRenderAll()
          } else {
            const fabricText = new IText(text, {
              left: 100,
              top: 100,
              fontSize: 40,
            })
            ;(fabricText as any).id = uuid()
            canvas.add(fabricText)
            canvas.setActiveObject(fabricText)
          }
        })
      }
    }
    // When copying elements outside browser, clear cached paste elements in canvas
    if (items.length) this.cache = null
  }
}

export default CopyPlugin
