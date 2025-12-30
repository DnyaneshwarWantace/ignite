import { Polygon, Point, Control, Transform, FabricObject, util, type TPointerEvent } from 'fabric';
import { drawImg } from '../utils/utils';
// @ts-ignore - SVG import
import edgeImg from '../assets/edgecontrol.svg';
import { noop } from 'lodash-es';
import type { IEditor, IPluginTempl } from '../interface/Editor';

type IPlugin = Pick<PolygonModifyPlugin, 'toggleEdit' | 'activeEdit' | 'inActiveEdit'>;

declare module '../interface/Editor' {
  // eslint-disable-next-line @typescript-eslint/no-empty-interface
  interface IEditor extends IPlugin {}
}

export type Options = {
  fill: string;
  style: 'rect' | 'circle';
};

interface PointIndexPolygon extends Polygon {
  pointIndex: number;
  __corner: string;
  _setPositionDimensions: (...args: any[]) => any;
}

interface PointIndexControl extends Control {
  pointIndex: number;
}

const actionHandler: Control['actionHandler'] = function (
  eventData: TPointerEvent,
  transform: Transform,
  x: number,
  y: number
) {
  const polygon = transform.target as PointIndexPolygon,
    currentControl = polygon.controls[polygon.__corner] as PointIndexControl,
    // In Fabric.js v6, toLocalPoint doesn't exist, use transformPoint with inverted matrix
    mousePoint = new Point(x, y),
    transformMatrix = polygon.calcTransformMatrix(),
    invertedMatrix = util.invertTransform(transformMatrix),
    mouseLocalPosition = util.transformPoint(mousePoint, invertedMatrix),
    polygonBaseSize = getObjectSizeWithStroke(polygon),
    size = polygon._getTransformedDimensions();
  if (polygon.points == null) return false;
  polygon.points[currentControl.pointIndex] = new Point(
    (mouseLocalPosition.x * polygonBaseSize.x) / size.x + polygon.pathOffset.x,
    (mouseLocalPosition.y * polygonBaseSize.y) / size.y + polygon.pathOffset.y
  );
  return true;
};
const anchorWrapper = function (anchorIndex: number, fn: Control['actionHandler']) {
  return function (eventData: TPointerEvent, transform: Transform, x: number, y: number) {
    const fabricObject = transform.target as PointIndexPolygon;
    if (fabricObject.points == null) return false;
    const absolutePoint = util.transformPoint(
        new Point(
          fabricObject.points[anchorIndex].x - fabricObject.pathOffset.x,
          fabricObject.points[anchorIndex].y - fabricObject.pathOffset.y
        ),
        fabricObject.calcTransformMatrix()
      ),
      actionPerformed = fn(eventData, transform, x, y),
      // newDim = fabricObject._setPositionDimensions({}),
      polygonBaseSize = getObjectSizeWithStroke(fabricObject),
      newX = (fabricObject.points[anchorIndex].x - fabricObject.pathOffset.x) / polygonBaseSize.x,
      newY = (fabricObject.points[anchorIndex].y - fabricObject.pathOffset.y) / polygonBaseSize.y;
    const originX = (newX + 0.5) as any;
    const originY = (newY + 0.5) as any;
    fabricObject.setPositionByOrigin(absolutePoint, originX, originY);
    return actionPerformed;
  };
};
const getObjectSizeWithStroke = function (object: FabricObject) {
  const strokeWidth = object.strokeWidth || 0;
  const stroke = new Point(
    object.strokeUniform ? 1 / (object.scaleX || 1) : 1,
    object.strokeUniform ? 1 / (object.scaleY || 1) : 1
  );
  stroke.x *= strokeWidth;
  stroke.y *= strokeWidth;
  return new Point((object.width || 0) + stroke.x, (object.height || 0) + stroke.y);
};
const polygonPositionHandler = function (
  this: PointIndexControl,
  dim: any,
  finalMatrix: any,
  fabricObject: any
) {
  const x = fabricObject.points[this.pointIndex].x - fabricObject.pathOffset.x,
    y = fabricObject.points[this.pointIndex].y - fabricObject.pathOffset.y;
  // Get position in world coordinate system
  return util.transformPoint(
    new Point(x, y), // Position in object coordinate system
    util.multiplyTransformMatrices(
      fabricObject.canvas.viewportTransform,
      fabricObject.calcTransformMatrix()
    )
  );
};
function renderIconEdge(
  ctx: CanvasRenderingContext2D,
  left: number,
  top: number,
  styleOverride: any,
  fabricObject: FabricObject,
  img: HTMLImageElement
) {
  drawImg(ctx, left, top, img, 25, 25, util.degreesToRadians(fabricObject.angle || 0));
}

class PolygonModifyPlugin implements IPluginTempl {
  public isEdit: boolean;
  private img: HTMLImageElement;
  static pluginName = 'PolygonModifyPlugin';
  static events = [];
  static apis = ['toggleEdit', 'activeEdit', 'inActiveEdit'];

  constructor(public canvas: any, public editor: IEditor) {
    this.isEdit = false;
    const img = document.createElement('img');
    img.src = edgeImg;
    this.img = img;
    this.init();
  }
  init() {
    console.info('[PolygonModifyPlugin]: init');
  }
  _onDeselected: () => any = noop;
  _ensureEvent(poly: FabricObject) {
    poly.off('deselected', this._onDeselected);
  }
  toggleEdit() {
    this.isEdit ? this.inActiveEdit() : this.activeEdit();
  }
  activeEdit() {
    this.isEdit = true;
    const poly = this.canvas.getActiveObject() as Polygon;
    if (poly && poly.type === 'polygon') {
      this._ensureEvent(poly);
      if (poly.points == null) return;
      // Ensure points is an array before using reduce
      const pointsArray = Array.isArray(poly.points) ? poly.points : [];
      if (pointsArray.length === 0) return;
      const lastControl = pointsArray.length - 1;
      const This = this;
      poly.controls = pointsArray.reduce<Record<string, PointIndexControl>>(function (
        acc,
        point,
        index
      ) {
        acc['p' + index] = <PointIndexControl>new Control({
          positionHandler: polygonPositionHandler,
          actionHandler: anchorWrapper(index > 0 ? index - 1 : lastControl, actionHandler),
          actionName: 'modifyPolygon',
          render: (ctx: CanvasRenderingContext2D, left: number, top: number, styleOverride: any, fabricObject: FabricObject) => 
            renderIconEdge(ctx, left, top, styleOverride, fabricObject, This.img),
        });
        Object.defineProperty(acc['p' + index], 'pointIndex', { value: index });
        return acc;
      },
      {});
      poly.set({
        objectCaching: false,
      });
      poly.hasBorders = !this.isEdit;
      this.canvas.requestRenderAll();
      this._onDeselected = () => this.inActiveEdit(poly);
      poly.on('deselected', this._onDeselected);
    }
  }
  inActiveEdit(poly?: Polygon) {
    this.isEdit = false;
    poly = poly || (this.canvas.getActiveObject() as Polygon);
    if (poly && poly.type === 'polygon') {
      poly.cornerColor = 'blue';
      poly.cornerStyle = 'rect';
      // Ensure controls object exists on prototype before assigning
      if (!FabricObject.prototype.controls) {
        (FabricObject.prototype as any).controls = {};
      }
      poly.controls = FabricObject.prototype.controls;
      poly.hasBorders = !this.isEdit;
      poly.set({
        objectCaching: true,
      });
      if (this._onDeselected) {
        poly.off('deselected', this._onDeselected);
        this._onDeselected = noop;
      }
    }
    this.canvas.requestRenderAll();
  }
}

export default PolygonModifyPlugin;
