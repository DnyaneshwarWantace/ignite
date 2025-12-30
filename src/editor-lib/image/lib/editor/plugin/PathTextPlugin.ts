import { Canvas, IText, PencilBrush, util } from 'fabric';
import { v4 as uuid } from 'uuid';
import type { IEditor, IPluginTempl } from '../interface/Editor';

type IPlugin = Pick<PathTextPlugin, 'startTextPathDraw' | 'endTextPathDraw'>;

declare module '../interface/Editor' {
  // eslint-disable-next-line @typescript-eslint/no-empty-interface
  interface IEditor extends IPlugin {}
}

type DrawOptions = {
  decimate: number;
  width: number;
  defaultText: string;
  color: string;
  lineColor: string;
  defaultFontSize: number;
};

export default class PathTextPlugin implements IPluginTempl {
  static pluginName = 'PathTextPlugin';
  static apis = ['startTextPathDraw', 'endTextPathDraw'];
  private options?: DrawOptions;
  constructor(public canvas: Canvas, public editor: IEditor) {}

  _beforeHandler = (opt: any) => {
    if (this.options == null) return;
    const path = opt.path as any;
    
    // Calculate path segments info (needed for text to follow path)
    const getPathSegmentsInfo = (util as any).getPathSegmentsInfo;
    if (getPathSegmentsInfo && path.path) {
      path.segmentsInfo = getPathSegmentsInfo(path.path);
    }
    
    // Configure path to be visible by default (user can hide it later)
    path.set({ 
      stroke: this.options.lineColor,
      strokeWidth: 2, // Show path line by default
      fill: '', // No fill
      selectable: false, // Path shouldn't be selectable separately
      evented: false, // Path shouldn't receive events
      excludeFromExport: false,
    });
  };
  
  _createdHandler = (opt: any) => {
    if (this.options == null) return;
    const path = opt.path as any;
    
    if (!path) return;
    
    // Use requestAnimationFrame to ensure path is fully initialized
    requestAnimationFrame(() => {
      // Ensure path segments info is calculated (critical for text to follow path)
      const getPathSegmentsInfo = (util as any).getPathSegmentsInfo;
      if (getPathSegmentsInfo && path.path) {
        try {
          path.segmentsInfo = getPathSegmentsInfo(path.path);
        } catch (e) {
          console.warn('Failed to calculate path segments:', e);
        }
      }
      
      // Ensure path is configured properly
      path.set({ 
        stroke: this.options.lineColor,
        strokeWidth: 2,
        fill: '',
        selectable: false,
        evented: false,
      });
      
      // Ensure path coordinates are set
      path.setCoords();
      
      // Add path to canvas (needed for text to reference it)
      if (!this.canvas.getObjects().includes(path)) {
        this.canvas.add(path);
      }
      
      const text = this.options.defaultText;
      const fontSize = this.options.defaultFontSize;
      
      // Create text object with path properties
      // CRITICAL: These properties make text follow the curve
      const textObject = new IText(text, {
        fontFamily: 'arial',
        fontSize: fontSize,
        fill: this.options.color,
        id: uuid(),
        editable: true,
        // Path properties - these make text follow the curve
        path: path, // Set path reference (REQUIRED for text to curve)
        pathSide: 'left', // Text on left side of path ('left' or 'right')
        pathStartOffset: 0, // Start at beginning of path (can offset if needed)
        pathAlign: 'baseline', // Align text baseline to path ('baseline', 'center', 'ascender', 'descender')
        // Position will be calculated automatically based on path
        top: path.top || 0,
        left: path.left || 0,
      });
      
      // IMPORTANT: Force text to recalculate path rendering
      // This ensures text curves along the path immediately
      if ((textObject as any)._renderTextOnPath) {
        (textObject as any)._renderTextOnPath();
      }
      
      // Set coordinates for text
      textObject.setCoords();
      
      // Force update to ensure path text is rendered correctly
      textObject.dirty = true;
      
      // Add text to canvas
      this.canvas.add(textObject);
      
      // Ensure text is rendered on top of path
      this.canvas.bringObjectToFront(textObject);
      
      // Force render to show text following path
      this.canvas.requestRenderAll();
    });
  };
  _bindEvent() {
    this.canvas.on('before:path:created', this._beforeHandler);
    this.canvas.on('path:created', this._createdHandler);
  }
  _unbindEvent() {
    this.canvas.off('before:path:created', this._beforeHandler);
    this.canvas.off('path:created', this._createdHandler);
  }
  startTextPathDraw(options: Partial<DrawOptions> = {}) {
    const defaultOptions = {
      decimate: 8,
      width: 2,
      defaultText: 'Everything goes well',
      color: '#000000',
      lineColor: '#000000',
      defaultFontSize: 20,
    };
    this.options = {
      ...defaultOptions,
      ...(options && typeof options === 'object' ? options : {}),
    };
    this.canvas.isDrawingMode = true;
    const brush = (this.canvas.freeDrawingBrush = new PencilBrush(this.canvas));
    brush.decimate = this.options.decimate;
    brush.width = this.options.width;
    brush.color = this.options.color;
    this._bindEvent();
  }
  endTextPathDraw() {
    this.canvas.isDrawingMode = false;
    this._unbindEvent();
  }
}
