// 图案按钮组件
import React, { useState } from 'react';
import type { CanvasElement, TextElement } from '../types';
import RichTextEditor from '../RichTextEditor/RichTextEditor';

interface ElementRendererProps {
  element: CanvasElement;
  onSelect: (elementId: string, event: React.MouseEvent) => void;
  onDoubleClick?: (elementId: string, event: React.MouseEvent) => void;
  onTextUpdate?: (elementId: string, updates: Partial<TextElement>) => void;
  onDragStart?: (elementId: string, event: React.MouseEvent) => void;
  onTouchStart?: (elementId: string, event: React.TouchEvent) => void;
  onStartEditing?: () => void;
  onStopEditing?: () => void;
}

const ElementRenderer: React.FC<ElementRendererProps> = ({
  element,
  onSelect,
  onDoubleClick,
  onTextUpdate,
  onDragStart,
  onTouchStart,
  onStartEditing,
  onStopEditing
}) => {
  // 处理元素点击事件
  const handleClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    onSelect(element.id, e);
  };

  // 处理元素鼠标按下事件（用于拖拽开始）
  const handleMouseDown = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (onDragStart) {
      onDragStart(element.id, e);
    }
  };

  // 处理元素触摸开始事件（用于拖拽开始）
  const handleTouchStart = (e: React.TouchEvent) => {
    e.stopPropagation();
    if (onTouchStart) {
      onTouchStart(element.id, e);
    }
  };

  // 处理元素双击事件
  const handleDoubleClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (onDoubleClick) {
      onDoubleClick(element.id, e);
    }
    if (element.type === 'text') {
      setIsEditing(true);
      onStartEditing?.(); // 通知父组件开始编辑
      // 强制进入编辑模式，确保双击中间区域有效
    }
  };

  // 状态管理
  const [isEditing, setIsEditing] = useState(false);

  // 处理文本元素更新
  const handleTextUpdate = (updatedProps: Partial<TextElement>) => {
    if (element.type === 'text' && onTextUpdate) {
      onTextUpdate(element.id, updatedProps);
    }
  };

  // 完成文本编辑
  const handleFinishEditing = () => {
    setIsEditing(false);
    onStopEditing?.(); // 通知父组件结束编辑
  };

  // 元素的基础样式
  const baseStyle: React.CSSProperties = {
    position: 'absolute',
    left: `${element.x}px`,
    top: `${element.y}px`,
    width: `${element.width}px`,
    height: `${element.height}px`,
    transform: `scale(${element.scale}) rotate(${element.rotation}deg)`,
    transformOrigin: '0 0',
    zIndex: element.zIndex,
    cursor: 'move',
    userSelect: 'none'
  };

  // 根据元素类型渲染不同的组件
  switch (element.type) {
    case 'rect':
      return (
        <div
          className={`canvas-element canvas-shape ${element.selected ? 'selected' : ''}`}
          style={{
            ...baseStyle,
            backgroundColor: element.fill,
            border: `${element.strokeWidth}px solid ${element.stroke}`,
            borderRadius: '0px'
          }}
          onClick={handleClick}
          onDoubleClick={handleDoubleClick}
          onMouseDown={handleMouseDown}
          onTouchStart={handleTouchStart}
        />
      );

    case 'circle':
      return (
        <div
          className={`canvas-element canvas-shape ${element.selected ? 'selected' : ''}`}
          style={{
            ...baseStyle,
            backgroundColor: element.fill,
            border: `${element.strokeWidth}px solid ${element.stroke}`,
            borderRadius: '50%'
          }}
          onClick={handleClick}
          onDoubleClick={handleDoubleClick}
          onMouseDown={handleMouseDown}
          onTouchStart={handleTouchStart}
        />
      );

    case 'rounded-rect':
      return (
        <div
          className={`canvas-element canvas-shape ${element.selected ? 'selected' : ''}`}
          style={{
            ...baseStyle,
            backgroundColor: element.fill,
            border: `${element.strokeWidth}px solid ${element.stroke}`,
            borderRadius: `${element.borderRadius || 10}px`
          }}
          onClick={handleClick}
          onDoubleClick={handleDoubleClick}
          onMouseDown={handleMouseDown}
          onTouchStart={handleTouchStart}
        />
      );

    case 'triangle':
      // 使用SVG多边形创建三角形，支持动态边框宽度和颜色
      return (
        <div
          className={`canvas-element canvas-shape ${element.selected ? 'selected' : ''}`}
          style={{
            ...baseStyle,
            width: element.width,
            height: element.height
          }}
          onClick={handleClick}
          onDoubleClick={handleDoubleClick}
          onMouseDown={handleMouseDown}
          onTouchStart={handleTouchStart}
        >
          <svg width="100%" height="100%" viewBox="0 0 100 100">
            <polygon
              points="50,10 10,90 90,90"
              fill={element.fill === undefined ? 'transparent' : element.fill}
              stroke={element.stroke || 'black'}
              strokeWidth={element.strokeWidth || 2}
            />
          </svg>
        </div>
      );

    case 'star':
      // 使用SVG多边形创建五角星，支持动态边框宽度和颜色
      return (
        <div
          className={`canvas-element canvas-shape ${element.selected ? 'selected' : ''}`}
          style={{
            ...baseStyle,
            width: element.width,
            height: element.height
          }}
          onClick={handleClick}
          onDoubleClick={handleDoubleClick}
          onMouseDown={handleMouseDown}
          onTouchStart={handleTouchStart}
        >
          <svg width="100%" height="100%" viewBox="0 0 100 100">
            <polygon
              points="50,10 61,39 92,39 68,58 79,87 50,70 21,87 32,58 8,39 39,39"
              fill={element.fill === undefined ? 'transparent' : element.fill}
              stroke={element.stroke || 'black'}
              strokeWidth={element.strokeWidth || 2}
            />
          </svg>
        </div>
      );

    case 'image':
      return (
        <img
          className={`canvas-element canvas-image ${element.selected ? 'selected' : ''}`}
          src={element.src}
          alt="Canvas image"
          style={{
            ...baseStyle,
            objectFit: 'contain',
            filter: element.filter || 'none'
          }}
          onClick={handleClick}
          onDoubleClick={handleDoubleClick}
          onMouseDown={handleMouseDown}
          onTouchStart={handleTouchStart}
          draggable={false}
        />
      );

    case 'text':
      return (
        <div
          className={`canvas-element canvas-text ${element.selected ? 'selected' : ''}`}
          style={{
            ...baseStyle,
            backgroundColor: element.selected && !isEditing ? 'rgba(240, 240, 240, 0.3)' : 'transparent',
            border: 'none', // 移除边框，使用CSS中的outline
            padding: isEditing ? '0' : '5px', // 编辑模式下移除内边距
            cursor: isEditing ? 'text' : 'move',
            resize: 'none',
            overflow: isEditing ? 'visible' : 'hidden' // 编辑模式下允许内容溢出
            // 移除position: relative，使用baseStyle中的position: absolute
          }}
          onClick={handleClick}
          onDoubleClick={handleDoubleClick}
          onMouseDown={!isEditing ? handleMouseDown : undefined}
          onTouchStart={!isEditing ? handleTouchStart : undefined}
        >
          <RichTextEditor
            element={element}
            isEditing={isEditing}
            onUpdate={handleTextUpdate}
            onFinishEditing={handleFinishEditing}
          />
        </div>
      );

    default:
      return null;
  }
};

export default ElementRenderer;