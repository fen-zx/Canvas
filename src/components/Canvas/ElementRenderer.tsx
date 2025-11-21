import React, { useState } from 'react';
import type { CanvasElement , TextElement } from './types';
import RichTextEditor from './RichTextEditor';

interface ElementRendererProps {
  element: CanvasElement;
  onSelect: (elementId: string, event: React.MouseEvent) => void;
  onDoubleClick?: (elementId: string, event: React.MouseEvent) => void;
  onTextUpdate?: (elementId: string, updates: Partial<TextElement>) => void;
  onDragStart?: (elementId: string, event: React.MouseEvent) => void;
}

const ElementRenderer: React.FC<ElementRendererProps> = ({ 
  element, 
  onSelect, 
  onDoubleClick,
  onTextUpdate,
  onDragStart
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

  // 处理元素双击事件
  const handleDoubleClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (onDoubleClick) {
      onDoubleClick(element.id, e);
    }
    if (element.type === 'text') {
      setIsEditing(true);
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
        />
      );

    case 'triangle':
      // 使用CSS创建三角形
      const triangleSize = Math.min(element.width, element.height);
      const triangleBorderSize = triangleSize / 2;
      
      return (
        <div
          className={`canvas-element canvas-shape ${element.selected ? 'selected' : ''}`}
          style={{
            ...baseStyle,
            width: 0,
            height: 0,
            borderLeft: `${triangleBorderSize}px solid transparent`,
            borderRight: `${triangleBorderSize}px solid transparent`,
            borderBottom: `${triangleSize}px solid ${element.fill}`,
            backgroundColor: 'transparent',
            borderTop: 'none'
          }}
          onClick={handleClick}
          onDoubleClick={handleDoubleClick}
          onMouseDown={handleMouseDown}
        />
      );

    case 'image':
      return (
        <img
          className={`canvas-element canvas-image ${element.selected ? 'selected' : ''}`}
          src={element.src}
          alt="Canvas image"
          style={{
            ...baseStyle,
            objectFit: 'contain'
          }}
          onClick={handleClick}
          onDoubleClick={handleDoubleClick}
          onMouseDown={handleMouseDown}
          draggable={false}
        />
      );

    case 'text':
      return (
        <div
          className={`canvas-element canvas-text ${element.selected ? 'selected' : ''}`}
          style={{
            ...baseStyle,
            backgroundColor: 'transparent',
            border: 'none',
            padding: '5px',
            cursor: isEditing ? 'text' : 'move',
            outline: 'none',
            resize: 'none',
            overflow: 'auto'
          }}
          onClick={handleClick}
          onDoubleClick={handleDoubleClick}
          onMouseDown={!isEditing ? handleMouseDown : undefined}
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