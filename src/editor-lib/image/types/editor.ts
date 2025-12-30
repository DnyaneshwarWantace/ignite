/**
 * TypeScript types for Fabric Editor
 * Based on vue-fabric-editor but in TypeScript
 */

import type { Canvas as FabricCanvas, FabricObject } from 'fabric';

// Editor Instance Type
export interface IEditor {
  canvas: FabricCanvas;
  // Core Methods
  init(canvas: FabricCanvas): void;
  use(plugin: any, options?: any): IEditor;

  // Shape Methods
  addRect(options?: any): void;
  addCircle(options?: any): void;
  addTriangle(options?: any): void;
  addPolygon(options?: any): void;

  // Text Methods
  addText(text?: string, options?: any): void;
  addTextbox(text?: string, options?: any): void;

  // Image Methods
  addImage(url: string, options?: any): void;
  addSvg(url: string, options?: any): void;
  createImgByElement(element: HTMLImageElement): Promise<any>;
  addBaseType(item: any, options?: { event?: DragEvent; scale?: boolean; center?: boolean }): void;
  insertSvgStr(svgString: string): Promise<void>;

  // File Import Methods
  insert(callback?: () => void): Promise<string>;
  loadJSON(jsonFile: string | object, callback?: () => void): Promise<void>;
  insertPSD(file?: File | (() => void), callback?: () => void): Promise<string>;

  // Drawing Methods
  startDraw(options?: { width?: number; color?: string }): void;
  endDraw(): void;
  setMode(mode: string): void;
  setLineType(type: string): void;
  beginDrawPolygon(callback?: (polygon: any) => void): void;

  // QR/Barcode Methods
  addQrCode(): void;
  setQrCode(options: any): void;
  addBarcode(): void;
  setBarcode(options: any): void;
  getBarcodeTypes?(): string[];

  // Layer Methods
  up(): void;
  down(): void;
  upTop(): void;
  downTop(): void;

  // History Methods
  undo(): void;
  redo(): void;
  canUndo(): boolean;
  canRedo(): boolean;

  // Transform Methods
  flip(direction: 'X' | 'Y'): void;
  group(): void;
  unGroup(): void;
  lock(): void;
  unLock(): void;
  clone(): void;
  del(): void;

  // Align Methods
  left(): void;
  right(): void;
  xcenter(): void;
  top(): void;
  bottom(): void;
  ycenter(): void;
  centerH(): void;
  centerV(): void;
  position(type: 'center' | 'centerH' | 'centerV'): void;

  // Workspace Methods
  setSize(width: number, height: number): void;
  auto(): void;
  one(): void;
  big(): void;
  small(): void;

  // Watermark Methods
  drawWaterMark(options: any): void;
  clearWaterMark(): void;

  // Material Methods
  getSizeList(): Promise<any[]>;

  // Ruler Methods
  rulerEnable(): void;
  rulerDisable(): void;

  // Export/Save Methods
  getJson(): any;
  preview(): Promise<string>;
  clear(): void;

  // Event Methods
  on(event: string, handler: (...args: any[]) => void): void;
  off(event: string, handler: (...args: any[]) => void): void;
}

// Canvas Size Preset
export interface CanvasSizePreset {
  id: string;
  name: string;
  width: number;
  height: number;
  unit: 'px' | 'mm' | 'cm' | 'in';
  category?: 'social' | 'print' | 'web' | 'custom';
}

// Material Type
export interface MaterialType {
  id: number;
  name: string;
  icon?: string;
}

// Material Item
export interface MaterialItem {
  id: number;
  name: string;
  img: string;
  typeId: number;
  width?: number;
  height?: number;
}

// Template Type
export interface TemplateType {
  id: number;
  name: string;
  icon?: string;
}

// Template Item
export interface TemplateItem {
  id: number;
  name: string;
  json: string;
  img: string;
  typeId: number;
  width: number;
  height: number;
}

// Font Style Type
export interface FontStyleType {
  id: number;
  name: string;
}

// Font Style Item
export interface FontStyleItem {
  id: number;
  name: string;
  json: string;
  img: string;
  typeId: number;
}

// Font Item
export interface FontItem {
  id: number;
  name: string;
  fontFamily: string;
  url?: string;
}

// Shadow Settings
export interface ShadowSettings {
  color: string;
  blur: number;
  offsetX: number;
  offsetY: number;
}

// Gradient Stop
export interface GradientStop {
  offset: number;
  color: string;
}

// Gradient Settings
export interface GradientSettings {
  type: 'linear' | 'radial';
  angle?: number;
  stops: GradientStop[];
}

// Color Picker Mode
export type ColorPickerMode = 'solid' | 'gradient';

// Selection Type
export type SelectionMode = 'none' | 'one' | 'multiple';

// Left Sidebar Tab
export interface LeftSidebarTab {
  key: string;
  name: string;
  icon: string;
}

// Tool Type
export interface Tool {
  id: string;
  name: string;
  icon: string;
  category: 'shape' | 'draw' | 'text' | 'code' | 'image';
}

// Export Format
export interface ExportFormat {
  format: 'PNG' | 'JPEG' | 'WEBP' | 'SVG' | 'JSON';
  quality: number;
  label: string;
  extension: string;
  isVector?: boolean;
  isData?: boolean;
}

// Filter Type
export interface FilterType {
  id: string;
  name: string;
  icon?: string;
}

// Layer Item
export interface LayerItem {
  id: string;
  name: string;
  type: string;
  visible: boolean;
  locked: boolean;
  object: FabricObject;
}

// History Entry
export interface HistoryEntry {
  state: string;
  timestamp: number;
}

// Object Attributes
export interface ObjectAttributes {
  // Position
  left?: number;
  top?: number;

  // Size
  width?: number;
  height?: number;
  scaleX?: number;
  scaleY?: number;

  // Transform
  angle?: number;

  // Appearance
  fill?: string | object;
  stroke?: string;
  strokeWidth?: number;
  opacity?: number;

  // Shadow
  shadow?: ShadowSettings | null;

  // Border Radius (for rectangles)
  rx?: number;
  ry?: number;

  // Text Properties
  fontFamily?: string;
  fontSize?: number;
  fontWeight?: string | number;
  fontStyle?: string;
  textAlign?: string;
  lineHeight?: number;
  charSpacing?: number;

  // Visibility
  visible?: boolean;

  // Lock
  selectable?: boolean;
  evented?: boolean;
  lockMovementX?: boolean;
  lockMovementY?: boolean;
  lockScalingX?: boolean;
  lockScalingY?: boolean;
  lockRotation?: boolean;
}

// Editor State
export interface EditorState {
  canvas: FabricCanvas | null;
  editor: IEditor | null;
  activeTool: string | null;
  selectedObjects: FabricObject[];
  selectionMode: SelectionMode;
  zoom: number;
  rulerEnabled: boolean;
  gridEnabled: boolean;
}

// Component Props
export interface EditorComponentProps {
  projectId: string;
  project?: any;
}
