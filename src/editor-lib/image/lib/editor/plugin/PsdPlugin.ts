/*
 * PSD plugin
 * Handles PSD file import
 */
import { Canvas } from 'fabric';
import { selectFiles } from '../utils/utils';
import psdToJson from '../utils/psd';
import Psd from '@webtoon/psd';
import type { IEditor, IPluginTempl } from '../interface/Editor';

type IPlugin = Pick<PsdPlugin, 'insertPSD'>;

declare module '../interface/Editor' {
  // eslint-disable-next-line @typescript-eslint/no-empty-interface
  interface IEditor extends IPlugin {}
}

class PsdPlugin implements IPluginTempl {
  static pluginName = 'PsdPlugin';
  static apis = ['insertPSD'];
  constructor(public canvas: Canvas, public editor: IEditor) {}

  insertPSD(fileOrCallback?: File | (() => void), callback?: () => void) {
    return new Promise((resolve, reject) => {
      // Check if first parameter is a File
      const isFile = fileOrCallback instanceof File;
      const file = isFile ? fileOrCallback : null;
      const cb = isFile ? callback : (fileOrCallback as (() => void) | undefined);

      const processPSD = async (psdFile: File) => {
        try {
          const result = await psdFile.arrayBuffer();
          // Parse PSD file
          const psdData = Psd.parse(result as ArrayBuffer);
          console.log(psdData, 'PSD file parsed');
          const json = await psdToJson(psdData);
          // Load JSON
          this.loadJSON(json, cb);
          resolve('');
        } catch (error) {
          console.error('Error processing PSD:', error);
          reject(error);
        }
      };

      if (file) {
        // File provided directly
        processPSD(file);
      } else {
        // Use file picker
        selectFiles({ accept: '.psd' })
          .then((files) => {
            if (files && files.length > 0) {
              processPSD(files[0]);
            }
          })
          .catch(reject);
      }
    });
  }

  loadJSON(json: string, callback?: () => void) {
    this.editor.loadJSON(json, callback);
  }
}

export default PsdPlugin;

