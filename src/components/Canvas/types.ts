// 基础元素属性
interface BaseElement {
  id: string;
  type: 'rect' | 'circle' | 'star' | 'image' | 'text';
  x: number;
  y: number;
  width: number;
  height: number;
  rotation: number;
  scale: number;
  selected: boolean;
  zIndex: number;
  isDragging?: boolean;
  isHighlighted?: boolean;
}

// 图形元素属性
interface ShapeElement extends BaseElement {
  type: 'rect' | 'circle' | 'star';
  fill: string;
  stroke: string;
  strokeWidth: number;
}

// 图片元素属性
export interface ImageElement extends BaseElement {
  type: 'image';
  src: string;
  filter?: string; // 支持滤镜效果
}

// 文本元素属性
export interface TextElement extends BaseElement {
  type: 'text';
  content: string;
  fontSize: number;
  fontFamily: string;
  color: string;
  fontWeight: string;
  fontStyle: string;
  textAlign: 'left' | 'center' | 'right';
  textDecoration?: string; // 用于支持下划线等文本装饰
}

// 所有元素类型的联合类型
export type CanvasElement = ShapeElement | ImageElement | TextElement;

// 画布状态接口
export interface CanvasState {
  elements: CanvasElement[];
  selectedElementIds: string[];
  currentTool: 'select' | 'rect' | 'circle' | 'triangle' | 'image' | 'text' | 'shape';
  position: { x: number; y: number };
  scale: number;
}

// 工具栏按钮接口
export interface ToolButtonProps {
  icon: string;
  label: string;
  isActive: boolean;
  onClick: () => void;
}

// 图案类型定义
export interface Pattern {
  id: string;
  name: string;
  type: 'rect' | 'circle' | 'star';
  fill: string;
  stroke: string;
  strokeWidth: number;
  width: number;
  height: number;
}

// 侧边栏属性接口
export interface PatternSidebarProps {
  onSelectPattern: (pattern: Pattern) => void;
}