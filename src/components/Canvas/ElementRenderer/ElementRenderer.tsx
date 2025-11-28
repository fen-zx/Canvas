import React, { useState } from 'react';
import type { CanvasElement, TextElement } from '../types';
import RichTextEditor from '../RichTextEditor/RichTextEditor';

interface ElementRendererProps {
  element: CanvasElement;
  onSelect: (elementId: string, event: React.MouseEvent) => void;
  onDoubleClick?: (elementId: string, event: React.MouseEvent) => void;
  onTextUpdate?: (elementId: string, updates: Partial<TextElement>) => void;
  onDragStart?: (elementId: string, event: React.MouseEvent) => void;
  onStartEditing?: () => void;
  onStopEditing?: () => void;
}

const ElementRenderer: React.FC<ElementRendererProps> = ({
  element,
  onSelect,
  onDoubleClick,
  onTextUpdate,
  onDragStart,
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
      // 使用CSS创建三角形，支持动态边框宽度和颜色
      return (
        <div
          className={`canvas-element canvas-shape ${element.selected ? 'selected' : ''}`}
          style={{
            ...baseStyle,
            padding: `${element.strokeWidth}px`,
            boxSizing: 'border-box',
            width: element.width,
            height: element.height,
            backgroundColor: 'transparent',
            position: 'relative'
          }}
          onClick={handleClick}
          onDoubleClick={handleDoubleClick}
          onMouseDown={handleMouseDown}
        >
          {/* 边框 - 使用外层div实现 */}
          <div
            style={{
              position: 'absolute',
              width: 0,
              height: 0,
              borderLeft: `${element.width / 2}px solid transparent`,
              borderRight: `${element.width / 2}px solid transparent`,
              borderBottom: `${element.height}px solid ${element.stroke || 'black'}`
            }}
          ></div>

          {/* 填充 - 使用内层div实现，通过调整大小和位置实现边框效果 */}
          <div
            style={{
              position: 'absolute',
              width: 0,
              height: 0,
              borderLeft: `${(element.width - element.strokeWidth * 2) / 2}px solid transparent`,
              borderRight: `${(element.width - element.strokeWidth * 2) / 2}px solid transparent`,
              borderBottom: `${element.height - element.strokeWidth * 2}px solid ${element.fill || 'transparent'}`,
              left: element.strokeWidth,
              top: element.strokeWidth
            }}
          ></div>
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
            border: element.selected && !isEditing ? '2px solid #2196F3' : 'none',
            padding: isEditing ? '0' : '5px', // 编辑模式下移除内边距
            cursor: isEditing ? 'text' : 'move',
            outline: 'none',
            resize: 'none',
            overflow: isEditing ? 'visible' : 'hidden', // 编辑模式下允许内容溢出
            position: 'relative' // 确保定位正确
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