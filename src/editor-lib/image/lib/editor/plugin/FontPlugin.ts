/*
 * Custom font plugin
 * Handles font loading and management
 */

import type { Canvas as FabricCanvas } from 'fabric'
// @ts-ignore - fontfaceobserver doesn't have proper type definitions
import FontFaceObserver from 'fontfaceobserver'
import axios from 'axios'
import { downFile } from '../utils/utils'
import type { IEditor, IPluginTempl } from '../interface/Editor'

type IPlugin = Pick<FontPlugin, 'getFontList' | 'loadFont' | 'getFontJson' | 'downFonty'>

declare module '../interface/Editor' {
  // eslint-disable-next-line @typescript-eslint/no-empty-interface
  interface IEditor extends IPlugin {}
}

interface Font {
  type: string
  fontFamily: string
}

interface FontSrc {
  name: string
  type: string
  file: string
  img: string
}

class FontPlugin implements IPluginTempl {
  private tmpPromise!: Promise<FontSrc[]> | null
  static pluginName = 'FontPlugin'
  static apis = ['getFontList', 'loadFont', 'getFontJson', 'downFonty']
  repoSrc: string
  cacheList: FontSrc[]
  fontList: FontSrc[] | null
  constructor(public canvas: FabricCanvas, public editor: IEditor, config: { repoSrc?: string, fontList?: FontSrc[] }) {
    this.repoSrc = config.repoSrc || ''
    this.cacheList = []
    this.tmpPromise = null
    this.fontList = config.fontList || null

    // If fonts provided, initialize them immediately
    if (this.fontList) {
      this.cacheList = this.fontList
      this.createFont(this.fontList)
    }
  }

  hookImportBefore(...args: unknown[]) {
    const json = args[0] as string
    return this.downFonty(json)
  }
  getFontList() {
    // Return cached fonts if available
    if (this.cacheList.length) {
      return Promise.resolve(this.cacheList)
    }

    // If no cached fonts and no repoSrc, return empty array
    if (!this.repoSrc) {
      console.warn('FontPlugin: No fonts loaded and no repoSrc configured')
      return Promise.resolve([])
    }

    // Fallback to Strapi API (for backward compatibility)
    if (this.tmpPromise) return this.tmpPromise
    this.tmpPromise = axios
      .get(`${this.repoSrc}/api/fonts?populate=*&pagination[pageSize]=100`)
      .then((res) => {
        const list = res.data.data
          .filter((item: any) => {
            // Only include fonts that have both file and image data
            return item.attributes?.file?.data?.attributes?.url &&
                   item.attributes?.img?.data?.attributes?.url
          })
          .map((item: any) => {
            return {
              name: item.attributes.name,
              type: item.attributes.type,
              file: this.repoSrc + item.attributes.file.data.attributes.url,
              img: this.repoSrc + item.attributes.img.data.attributes.url,
            }
          })
        this.cacheList = list
        this.createFont(list)
        return list
      })
      .catch((error) => {
        console.error('FontPlugin: Failed to fetch fonts from API:', error)
        return []
      })
    return this.tmpPromise
  }

  downFonty(str: string) {
    const object = JSON.parse(str)
    let fontFamilies: string[] = []
    const skipFonts = ['arial']
    if (object.objects) {
      fontFamilies = JSON.parse(str)
        .objects.filter((item: Font) => {
          const hasFontFile = this.cacheList.find((font) => font.name === item.fontFamily)
          return item.type.includes('text') && !skipFonts.includes(item.fontFamily) && hasFontFile
        })
        .map((item: Font) => item.fontFamily)
    } else {
      fontFamilies = skipFonts.includes(object.fontFamily) ? [] : [object.fontFamily]
    }

    const fontFamiliesAll = fontFamilies.map((fontName) => {
      const font = new FontFaceObserver(fontName)
      return font.load(null, 10000)
    })
    return Promise.all(fontFamiliesAll)
  }

  // Get font data for creating new font styles
  getFontJson() {
    const activeObject = this.canvas.getActiveObject()
    if (activeObject) {
      const json = activeObject.toJSON()
      const filter = `data:text/json;charset=utf-8,${encodeURIComponent(
        JSON.stringify(json, null, '\t')
      )}`
      const dataUrl = activeObject.toDataURL({ multiplier: 1 })
      downFile(filter, 'font.json')
      downFile(dataUrl, 'font.png')
    }
  }

  loadFont(fontName: string) {
    const font = new FontFaceObserver(fontName)
    return font.load(null, 10000).then(() => {
      const activeObject = this.canvas.getActiveObjects()[0]
      if (activeObject) {
        activeObject.set('fontFamily', fontName)
        this.canvas.requestRenderAll()
      }
    })
  }

  createFont(arr: any[]) {
    let code = ''
    arr.forEach((item) => {
      code =
        code +
        `
    @font-face {
      font-family: ${item.name};
      src: url('${item.file}');
    }
    `
    })
    const style = document.createElement('style')
    try {
      style.appendChild(document.createTextNode(code))
    } catch (error) {
      // style.styleSheet.cssText = code
    }
    const head = document.getElementsByTagName('head')[0]
    head.appendChild(style)
  }

  destroy() {
    console.log('pluginDestroy')
  }
}

export default FontPlugin
