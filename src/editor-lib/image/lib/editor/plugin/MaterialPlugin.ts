/*
 * @author Image Editor
 * @date 2022-05-24 15:14:34
 * @lastEditors Image Editor
 * @lastEditTime 2022-09-05 18:23:13
 * @Description Material Plugin
 */

import type { Canvas as FabricCanvas } from 'fabric'
import axios from 'axios'
import qs from 'qs'
import type { IEditor, IPluginTempl } from '../interface/Editor'

type IPlugin = Pick<
  MaterialPlugin,
  'getTmplTypeList' | 'getTmplList' | 'getMaterialTypeList' | 'getMaterialList' | 'getSizeList'
>

declare module '../interface/Editor' {
  // eslint-disable-next-line @typescript-eslint/no-empty-interface
  interface IEditor extends IPlugin {}
}

class MaterialPlugin implements IPluginTempl {
  static pluginName = 'MaterialPlugin'
  static apis = [
    'getTmplTypeList',
    'getTmplList',
    'getMaterialTypeList',
    'getMaterialList',
    'getSizeList',
  ]
  apiMapUrl: { [propName: string]: string }
  repoSrc: string
  constructor(public canvas: FabricCanvas, public editor: IEditor, config: { repoSrc: string }) {
    this.repoSrc = config.repoSrc
    this.apiMapUrl = {
      template: config.repoSrc + '/template/type.json',
      svg: config.repoSrc + '/svg/type.json',
    }
  }
  getTmplTypeList() {
    return axios.get(`${this.repoSrc}/api/tmpl-types?pagination[pageSize]=100`).then((res) => {
      const list = res.data.data.map((item: any) => {
        return {
          value: item.id,
          label: item.attributes.name,
        }
      })
      return list
    })
  }
  getTmplList(tmplType = '', index = 1, searchKeyword = '') {
    const query = {
      fields: '*',
      populate: {
        img: '*',
      },
      filters: {},
      pagination: {
        page: index,
        pageSize: 20,
      },
    }

    const queryParams = this._getQueryParams(query, [
      {
        key: 'tmpl_type',
        value: tmplType,
        type: '$eq',
      },
      {
        key: 'name',
        value: searchKeyword,
        type: '$contains',
      },
    ])

    return axios.get(`${this.repoSrc}/api/tmpls?${queryParams}`).then((res: any) => {
      const list = res.data.data.map((item: any) => {
        return {
          name: item.attributes.name,
          desc: item.attributes.desc,
          src: this._getMaterialPreviewUrl(item.attributes.img),
          json: item.attributes.json,
        }
      })
      return { list, pagination: res.data.meta.pagination }
    })
  }

  /**
   * @return {Promise<any>}
   */
  getMaterialTypeList() {
    return axios.get(`${this.repoSrc}/api/matrial-types?pagination[pageSize]=100`).then((res) => {
      const list = res.data.data.map((item: any) => {
        return {
          value: item.id,
          label: item.attributes.name,
        }
      })
      return list
    })
  }

  /**
   * @returns Promise<Array>
   */
  getMaterialList(materialType = '', index = 1, searchKeyword = '') {
    const query = {
      populate: {
        img: '*',
      },
      // fields: ['materialType'],
      filters: {},
      pagination: {
        page: index,
        pageSize: 20,
      },
    }

    const queryParams = this._getQueryParams(query, [
      {
        key: 'matrial_type',
        value: materialType,
        type: '$eq',
      },
      {
        key: 'name',
        value: searchKeyword,
        type: '$contains',
      },
    ])

    return axios.get(`${this.repoSrc}/api/matrials?${queryParams}`).then((res: any) => {
      const list = res.data.data.map((item: any) => {
        return {
          name: item.attributes.name,
          desc: item.attributes.desc,
          src: this._getMaterialInfoUrl(item.attributes.img),
          previewSrc: this._getMaterialPreviewUrl(item.attributes.img),
        }
      })
      return { list, pagination: res.data.meta.pagination }
    })
  }

  getSizeList() {
    return axios.get(`${this.repoSrc}/api/sizes?pagination[pageSize]=100`).then((res) => {
      const list = res.data.data.map((item: any) => {
        return {
          value: item.id,
          name: item.attributes.name,
          width: Number(item.attributes.width),
          height: Number(item.attributes.height),
          unit: item.attributes.unit,
        }
      })
      return list
    })
  }
  getFontList() {
    return axios.get(`${this.repoSrc}/api/fonts?pagination[pageSize]=100`).then((res) => {
      const list = res.data.data.map((item: any) => {
        return {
          value: item.id,
          label: item.attributes.name,
        }
      })
      return list
    })
  }

  _getMaterialInfoUrl(info: any) {
    const imgUrl = info.data.attributes.url || ''
    return this.repoSrc + imgUrl
  }

  _getMaterialPreviewUrl(info: any) {
    const imgUrl = info.data.attributes.formats.small.url || info.data.attributes.url || ''
    return this.repoSrc + imgUrl
  }

  _getQueryParams(option: any, filters: any) {
    filters.forEach((item: any) => {
      const { key, value, type } = item
      if (value) {
        option.filters[key] = { [type]: value }
      }
    })
    return qs.stringify(option)
  }

  async getMaterialInfo(typed: string) {
    const url = this.apiMapUrl[typed]
    const res = await axios.get(url, { params: { typed } })
    return res.data.data
  }
}

export default MaterialPlugin
