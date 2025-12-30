/*
 * Group alignment plugin
 * Handles alignment of grouped objects
 */

import { Canvas, ActiveSelection, FabricObject } from 'fabric';
import type { IEditor, IPluginTempl } from '../interface/Editor';

type IPlugin = Pick<
  GroupAlignPlugin,
  'left' | 'right' | 'xcenter' | 'ycenter' | 'top' | 'bottom' | 'xequation' | 'yequation'
>;

declare module '../interface/Editor' {
  // eslint-disable-next-line @typescript-eslint/no-empty-interface
  interface IEditor extends IPlugin {}
}

class GroupAlignPlugin implements IPluginTempl {
  static pluginName = 'GroupAlignPlugin';
  static apis = ['left', 'right', 'xcenter', 'ycenter', 'top', 'bottom', 'xequation', 'yequation'];
  // public hotkeys: string[] = ['space'];
  constructor(public canvas: Canvas, public editor: IEditor) {}

  left() {
    const { canvas } = this;

    const activeObject = canvas.getActiveObject();
    const selectObjects = canvas.getActiveObjects();
    if (activeObject) {
      const { left = 0 } = activeObject;
      canvas.discardActiveObject();
      // Ensure selectObjects is an array
      const objectsArray = Array.isArray(selectObjects) ? selectObjects : [];
      objectsArray.forEach((item) => {
        const bounding = item.getBoundingRect();
        item.set({
          left: left - bounding.left + Number(item.left),
        });
        item.setCoords();
      });
      const activeSelection = new ActiveSelection(objectsArray, {
        canvas: canvas,
      });
      canvas.setActiveObject(activeSelection);
      canvas.requestRenderAll();
    }
  }

  right() {
    const { canvas } = this;

    const activeObject = canvas.getActiveObject();
    const selectObjects = canvas.getActiveObjects();
    if (activeObject) {
      const { left = 0, width = 0 } = activeObject;
      canvas.discardActiveObject();
      // Ensure selectObjects is an array
      const objectsArray = Array.isArray(selectObjects) ? selectObjects : [];
      objectsArray.forEach((item) => {
        const bounding = item.getBoundingRect();
        item.set({
          left: left + width - (bounding.left + bounding.width) + Number(item.left),
        });
      });
      const activeSelection = new ActiveSelection(objectsArray, {
        canvas: canvas,
      });
      canvas.setActiveObject(activeSelection);
      canvas.requestRenderAll();
    }
  }

  xcenter() {
    const { canvas } = this;

    const activeObject = canvas.getActiveObject();
    const selectObjects = canvas.getActiveObjects();
    if (activeObject) {
      const { left = 0, width = 0 } = activeObject;
      canvas.discardActiveObject();
      // Ensure selectObjects is an array
      const objectsArray = Array.isArray(selectObjects) ? selectObjects : [];
      objectsArray.forEach((item) => {
        const bounding = item.getBoundingRect();
        item.set({
          left: left + width / 2 - (bounding.left + bounding.width / 2) + Number(item.left),
        });
      });
      const activeSelection = new ActiveSelection(objectsArray, {
        canvas: canvas,
      });
      canvas.setActiveObject(activeSelection);
      canvas.requestRenderAll();
    }
  }

  ycenter() {
    const { canvas } = this;

    const activeObject = canvas.getActiveObject();
    const selectObjects = canvas.getActiveObjects();
    if (activeObject) {
      const { top = 0, height = 0 } = activeObject;
      canvas.discardActiveObject();
      // Ensure selectObjects is an array
      const objectsArray = Array.isArray(selectObjects) ? selectObjects : [];
      objectsArray.forEach((item) => {
        const bounding = item.getBoundingRect();
        item.set({
          top: top + height / 2 - (bounding.top + bounding.height / 2) + Number(item.top),
        });
      });
      const activeSelection = new ActiveSelection(objectsArray, {
        canvas: canvas,
      });
      canvas.setActiveObject(activeSelection);
      canvas.requestRenderAll();
    }
  }

  top() {
    const { canvas } = this;

    const activeObject = canvas.getActiveObject();
    const selectObjects = canvas.getActiveObjects();
    if (activeObject) {
      const { top = 0 } = activeObject;
      canvas.discardActiveObject();
      // Ensure selectObjects is an array
      const objectsArray = Array.isArray(selectObjects) ? selectObjects : [];
      objectsArray.forEach((item) => {
        const bounding = item.getBoundingRect();
        item.set({
          top: top - bounding.top + Number(item.top),
        });
      });
      const activeSelection = new ActiveSelection(objectsArray, {
        canvas: canvas,
      });
      canvas.setActiveObject(activeSelection);
      canvas.requestRenderAll();
    }
  }

  bottom() {
    const { canvas } = this;

    const activeObject = canvas.getActiveObject();
    const selectObjects = canvas.getActiveObjects();
    if (activeObject) {
      const { top = 0, height = 0 } = activeObject;
      canvas.discardActiveObject();
      // Ensure selectObjects is an array
      const objectsArray = Array.isArray(selectObjects) ? selectObjects : [];
      objectsArray.forEach((item) => {
        const bounding = item.getBoundingRect();
        item.set({
          top: top + height - (bounding.top + bounding.height) + Number(item.top),
        });
      });
      const activeSelection = new ActiveSelection(objectsArray, {
        canvas: canvas,
      });
      canvas.setActiveObject(activeSelection);
      canvas.requestRenderAll();
    }
  }

  xequation() {
    const { canvas } = this;
    const activeObject = canvas.getActiveObject() as ActiveSelection;
    // width property is not accurate, needs coordinate conversion
    function getItemWidth(item: FabricObject) {
      let x1 = Infinity,
        x2 = -Infinity;
      const aCoords = item.aCoords as any;
      for (const key in aCoords) {
        if (aCoords[key].x < x1) {
          x1 = aCoords[key].x;
        }
        if (aCoords[key].x > x2) {
          x2 = aCoords[key].x;
        }
      }
      return x2 - x1;
    }

    // Get all element heights
    function getAllItemHeight() {
      let count = 0;
      if (activeObject) {
        activeObject.forEachObject((item: FabricObject) => {
          count += getItemWidth(item);
        });
      }

      return count;
    }
    // Get average spacing
    function spacWidth() {
      const count = getAllItemHeight();
      if (activeObject) {
        const allSpac = Number(activeObject.width) - count;
        return allSpac / ((activeObject as any)._objects.length - 1);
      }
    }

    // Get height of all elements before current element
    function getItemLeft(i: number) {
      if (i === 0) return 0;
      let width = 0;
      if (activeObject) {
        for (let index = 0; index < i; index++) {
          width += getItemWidth((activeObject as any)._objects[index]);
        }
      }

      return width;
    }
    if (activeObject && activeObject.type === 'activeSelection') {
      const activeSelection = activeObject;
      // Sort
      (activeSelection as any)._objects.sort((a: FabricObject, b: FabricObject) => (a.left || 0) - (b.left || 0));

      // Average spacing calculation
      const itemSpac = spacWidth() as number;
      // Group origin height
      const yHeight = Number(activeObject.width) / 2;

      activeObject.forEachObject((item: FabricObject, i: number) => {
        // Get height of all elements before current element
        const preHeight = getItemLeft(i);
        // Top distance: spacing * index + previous element height - origin height
        const top = itemSpac * i + preHeight - yHeight;
        item.set('left', top);
      });
    }

    const objecs = canvas.getActiveObjects();
    canvas.discardActiveObject();
    // Ensure objecs is an array
    const objectsArray = Array.isArray(objecs) ? objecs : [];
    objectsArray.forEach((item: FabricObject) => {
      let x = Infinity;
      const aCoords = item.aCoords as any;
      for (const key in aCoords) {
        if (aCoords[key].x < x) {
          x = aCoords[key].x;
        }
      }
      item.set('left', 2 * (item.left || 0) - x);
    });

    const sel = new ActiveSelection(objectsArray, {
      canvas: canvas,
    });
    canvas.setActiveObject(sel);
    canvas.requestRenderAll();
  }

  yequation() {
    const { canvas } = this;
    const activeObject = (canvas.getActiveObject() as ActiveSelection) || {
      top: 0,
      height: 0,
    };
    // width property is not accurate, needs coordinate conversion
    function getItemHeight(item: FabricObject) {
      let y1 = Infinity,
        y2 = -Infinity;
      const aCoords = item.aCoords as any;
      for (const key in aCoords) {
        if (aCoords[key].y < y1) {
          y1 = aCoords[key].y;
        }
        if (aCoords[key].y > y2) {
          y2 = aCoords[key].y;
        }
      }
      return y2 - y1;
    }
    // Get all element heights
    function getAllItemHeight() {
      let count = 0;
      (activeObject as any).forEachObject((item: FabricObject) => {
        count += getItemHeight(item);
      });
      return count;
    }
    // Get average spacing
    function spacHeight() {
      const count = getAllItemHeight();
      const allSpac = activeObject.height - count;
      return allSpac / ((activeObject as any)._objects.length - 1);
    }

    // Get height of all elements before current element
    function getItemTop(i: number) {
      if (i === 0) return 0;
      let height = 0;
      for (let index = 0; index < i; index++) {
        height += getItemHeight((activeObject as any)._objects[index]);
      }
      return height;
    }

    if (activeObject && (activeObject as any).type === 'activeSelection') {
      const activeSelection = activeObject;
      // Sort
      (activeSelection as any)._objects.sort((a: FabricObject, b: FabricObject) => (a.top || 0) - (b.top || 0));

      // Average spacing calculation
      const itemSpac = spacHeight();
      // Group origin height
      const yHeight = Number(activeObject.height) / 2;

      (activeObject as any).forEachObject((item: FabricObject, i: number) => {
        // Get height of all elements before current element
        const preHeight = getItemTop(i);
        // Top distance: spacing * index + previous element height - origin height
        const top = itemSpac * i + preHeight - yHeight;
        item.set('top', top);
      });
    }

    const objecs = canvas.getActiveObjects();
    canvas.discardActiveObject();
    objecs.forEach((item) => {
      let y = Infinity;
      const aCoords = item.aCoords as any;
      for (const key in aCoords) {
        if (aCoords[key].y < y) {
          y = aCoords[key].y;
        }
      }
      item.set('top', 2 * (item.top || 0) - y);
    });

    // Ensure objecs is an array
    const objectsArray2 = Array.isArray(objecs) ? objecs : [];
    const sel = new ActiveSelection(objectsArray2, {
      canvas: canvas,
    });
    canvas.setActiveObject(sel);
    canvas.requestRenderAll();
  }

  destroy() {
    console.log('pluginDestroy');
  }
}

export default GroupAlignPlugin;
