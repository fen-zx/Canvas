import React, { useRef, useState, useEffect, useLayoutEffect, useCallback } from 'react';
import './Canvas.css';
import useCanvasState from './useCanvasState';
import ElementRenderer from './ElementRenderer';
import Toolbar from './Toolbar';
import ImageUploader from './ImageUploader';
import CanvasStatus from './CanvasStatus';
import KeyboardShortcuts from './KeyboardShortcuts';
import type { CanvasElement } from './types';

interface CanvasProps {
}

const Canvas: React.FC<CanvasProps> = () => {
  // 引用定义
  const canvasRef = useRef<HTMLDivElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  // 拖拽和交互状态
  const [isDraggingCanvas, setIsDraggingCanvas] = useState(false);
  const [lastMousePos, setLastMousePos] = useState({ x: 0, y: 0 });
  const [isDraggingElement, setIsDraggingElement] = useState(false);
  const [dragStartPos, setDragStartPos] = useState({ x: 0, y: 0 });
  const [isResizing, setIsResizing] = useState(false);
  const [resizeHandle, setResizeHandle] = useState<string | null>(null);
  const [resizeStartPos, setResizeStartPos] = useState({ x: 0, y: 0 });
  const [resizeStartSize, setResizeStartSize] = useState({ width: 0, height: 0 });
  const [isMobile, setIsMobile] = useState(false);
  const [showMobileToolbar, setShowMobileToolbar] = useState(false); // 控制移动端工具栏显示
  const [activeTouchId, setActiveTouchId] = useState<number | null>(null); // 当前活动触摸ID
  const [isPinching, setIsPinching] = useState(false); // 是否正在捏合缩放
  const [lastPinchDistance, setLastPinchDistance] = useState(0); // 上次捏合距离
  
  // 使用自定义Hook管理画布状态
  const canvasState = useCanvasState({
    elements: [],
    selectedElementIds: [],
    currentTool: 'select',
    position: { x: 0, y: 0 },
    scale: 1
  });

  // 从状态中解构需要的属性和方法
  const {
    elements,
    selectedElementIds,
    currentTool,
    position,
    scale,
    addElement,
    selectElement,
    clearSelection,
    setCurrentTool,
    updateCanvasPosition,
    updateCanvasScale,
    moveSelectedElements,
    updateElement,
    deleteSelectedElements,
    rotateSelectedElements,
    resizeSelectedElements
  } = canvasState;
  
  // 响应式处理
  useLayoutEffect(() => {
    const checkMobile = () => {
      const width = window.innerWidth;
      const height = window.innerHeight;
      setIsMobile(width <= 768 || height <= 768); // 基于宽度或高度判断
      
      // 小屏幕时自动隐藏键盘快捷键提示
      if (width <= 600) {
        const shortcutsElement = document.querySelector('.keyboard-shortcuts');
        if (shortcutsElement) {
          (shortcutsElement as HTMLElement).style.display = 'none';
        }
      }
    };

    // 初始检查
    checkMobile();
    
    // 监听窗口大小变化
    window.addEventListener('resize', checkMobile);
    
    // 禁用双击缩放
    const preventZoom = (e: Event) => {
      if ((e as TouchEvent).touches.length === 2) {
        e.preventDefault();
      }
    };
    
    document.addEventListener('touchstart', preventZoom, { passive: false });
    
    return () => {
      window.removeEventListener('resize', checkMobile);
      document.removeEventListener('touchstart', preventZoom);
    };
  }, []);

  // 将鼠标坐标转换为画布坐标
  const clientToCanvasCoords = (clientX: number, clientY: number) => ({
    x: (clientX - position.x) / scale,
    y: (clientY - position.y) / scale
  });

  // 处理画布点击事件
  const handleCanvasClick = (e: React.MouseEvent) => {
    // 如果不是在拖拽状态
    if (!isDraggingCanvas && !isDraggingElement) {
      // 清除所有选择
      clearSelection();
      
      // 根据当前工具创建新元素
      if (currentTool !== 'select') {
        const canvasCoords = clientToCanvasCoords(e.clientX, e.clientY);
        
        switch (currentTool) {
          case 'rect':
            addElement({
              type: 'rect',
              x: canvasCoords.x - 50,
              y: canvasCoords.y - 50,
              width: 100,
              height: 100,
              rotation: 0,
              scale: 1,
              fill: '#2196F3',
              stroke: '#1976D2',
              strokeWidth: 2
            } as Omit<CanvasElement, 'id' | 'selected' | 'zIndex'>);
            break; 
            
          case 'circle':
            addElement({
              type: 'circle',
              x: canvasCoords.x - 50,
              y: canvasCoords.y - 50,
              width: 100,
              height: 100,
              rotation: 0,
              scale: 1,
              fill: '#FF9800',
              stroke: '#F57C00',
              strokeWidth: 2
            } as Omit<CanvasElement, 'id' | 'selected' | 'zIndex'>);
            break;
            
          case 'triangle':
            addElement({
              type: 'triangle',
              x: canvasCoords.x - 50,
              y: canvasCoords.y - 50,
              width: 100,
              height: 100,
              rotation: 0,
              scale: 1,
              fill: '#4CAF50',
              stroke: '#388E3C',
              strokeWidth: 2
            } as Omit<CanvasElement, 'id' | 'selected' | 'zIndex'>);
            break;
            
          case 'text':
            addElement({
              type: 'text',
              x: canvasCoords.x,
              y: canvasCoords.y,
              width: 200,
              height: 50,
              rotation: 0,
              scale: 1,
              content: '点击编辑文本',
              fontSize: 16,
              fontFamily: 'Arial, sans-serif',
              color: '#333333',
              fontWeight: 'normal' as const,
              fontStyle: 'normal' as const,
              textAlign: 'left' as const
            } as Omit<CanvasElement, 'id' | 'selected' | 'zIndex'>);
            break;
            
          case 'image':
            // 当选择图片工具时，触发图片上传
            if (fileInputRef.current) {
              fileInputRef.current.click();
            }
            break;
        }
      }
    }
  };
  
  // 处理图片上传
  const handleImageUpload = (file: File) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      const img = new Image();
      img.onload = () => {
        // 计算图片在画布中的位置（居中显示）
        const container = containerRef.current;
        if (!container) return;
        
        const rect = container.getBoundingClientRect();
        const centerX = rect.width / 2;
        const centerY = rect.height / 2;
        
        const canvasCoords = clientToCanvasCoords(centerX, centerY);
        
        // 限制图片大小，防止过大
        const maxWidth = 500;
        const maxHeight = 500;
        let width = img.width;
        let height = img.height;
        
        if (width > maxWidth || height > maxHeight) {
          const ratio = Math.min(maxWidth / width, maxHeight / height);
          width *= ratio;
          height *= ratio;
        }
        
        // 添加图片元素到画布
        addElement({
          type: 'image',
          x: canvasCoords.x - width / 2,
          y: canvasCoords.y - height / 2,
          width: width,
          height: height,
          rotation: 0,
          scale: 1,
          //@ts-ignore
          src: e.target?.result as string
        });
      };
      img.src = e.target?.result as string;
    };
    reader.readAsDataURL(file);
  };
  
  // 处理文件输入变化
  const handleFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      if (file.type.startsWith('image/')) {
        handleImageUpload(file);
      }
      // 重置input，允许选择相同的文件
      e.target.value = '';
    }
  };

  // 计算两点之间的距离
  const getDistance = (touches: React.TouchList) => {
    const dx = touches[0].clientX - touches[1].clientX;
    const dy = touches[0].clientY - touches[1].clientY;
    return Math.sqrt(dx * dx + dy * dy);
  };
  
  // 获取触摸事件的中心点
  const getTouchCenter = (touches: React.TouchList) => ({
    x: (touches[0].clientX + touches[1].clientX) / 2,
    y: (touches[0].clientY + touches[1].clientY) / 2
  });
  
  // 处理鼠标按下事件
  const handleMouseDown = (e: React.MouseEvent) => {
    // 只有当没有选中元素时才允许拖拽画布
    if (!e.target || !(e.target as HTMLElement).closest('.canvas-element')) {
      setIsDraggingCanvas(true);
      setLastMousePos({ x: e.clientX, y: e.clientY });
      document.body.style.cursor = 'grabbing';
    }
  };
  
  // 处理触摸开始事件
  const handleTouchStart = (e: React.TouchEvent) => {
    const touches = e.touches;
    
    // 单指触摸
    if (touches.length === 1) {
      const touch = touches[0];
      setActiveTouchId(touch.identifier);
      
      // 检查是否点击了画布本身
      if (e.target === canvasRef.current) {
        setIsDraggingCanvas(true);
        setLastMousePos({ x: touch.clientX, y: touch.clientY });
      }
    }
    // 双指触摸开始缩放
    else if (touches.length === 2 && !isPinching) {
      e.preventDefault();
      setIsPinching(true);
      setLastPinchDistance(getDistance(touches));
    }
  };
  
  // 处理触摸移动事件
  const handleTouchMove = useCallback((e: React.TouchEvent) => {
    const touches = e.touches;
    
    // 双指缩放
    if (touches.length === 2 && isPinching) {
      e.preventDefault();
      
      const currentDistance = getDistance(touches);
      const scaleFactor = currentDistance / lastPinchDistance;
      const center = getTouchCenter(touches);
      
      // 计算缩放中心点
      const container = containerRef.current;
      if (!container) return;
      
      const rect = container.getBoundingClientRect();
      const mouseX = center.x - rect.left;
      const mouseY = center.y - rect.top;
      
      // 缩放前的鼠标相对于画布原点的位置
      const mouseXCanvas = (mouseX - position.x) / scale;
      const mouseYCanvas = (mouseY - position.y) / scale;
      
      // 计算新的缩放比例
      const newScale = Math.max(0.1, Math.min(5, scale * scaleFactor));
      
      // 计算新的位置，使缩放围绕触摸中心点进行
      const newX = mouseX - mouseXCanvas * newScale;
      const newY = mouseY - mouseYCanvas * newScale;
      
      updateCanvasScale(newScale);
      updateCanvasPosition({ x: newX, y: newY });
      setLastPinchDistance(currentDistance);
    }
    // 单指拖拽
    else if (touches.length === 1 && activeTouchId !== null) {
      const touch = Array.from(touches).find(t => t.identifier === activeTouchId);
      if (!touch) return;
      
      // 画布拖拽
      if (isDraggingCanvas) {
        e.preventDefault();
        
        const dx = touch.clientX - lastMousePos.x;
        const dy = touch.clientY - lastMousePos.y;
        
        updateCanvasPosition({
          x: position.x + dx,
          y: position.y + dy
        });
        
        setLastMousePos({ x: touch.clientX, y: touch.clientY });
      }
      // 元素拖拽
      else if (isDraggingElement && selectedElementIds.length > 0) {
        e.preventDefault();
        
        const dx = touch.clientX - dragStartPos.x;
        const dy = touch.clientY - dragStartPos.y;
        
        moveSelectedElements(dx / scale, dy / scale);
        
        setDragStartPos({ x: touch.clientX, y: touch.clientY });
      }
      // 调整大小
      else if (isResizing && resizeHandle) {
        e.preventDefault();
        
        const dx = touch.clientX - resizeStartPos.x;
        const dy = touch.clientY - resizeStartPos.y;
        
        // 根据拖动的手柄计算宽高变化
        let deltaWidth = 0;
        let deltaHeight = 0;
        
        switch (resizeHandle) {
          case 'n':
            deltaHeight = -dy / scale;
            break;
          case 's':
            deltaHeight = dy / scale;
            break;
          case 'w':
            deltaWidth = -dx / scale;
            break;
          case 'e':
            deltaWidth = dx / scale;
            break;
          case 'nw':
            deltaWidth = -dx / scale;
            deltaHeight = -dy / scale;
            break;
          case 'ne':
            deltaWidth = dx / scale;
            deltaHeight = -dy / scale;
            break;
          case 'sw':
            deltaWidth = -dx / scale;
            deltaHeight = dy / scale;
            break;
          case 'se':
            deltaWidth = dx / scale;
            deltaHeight = dy / scale;
            break;
          case 'rotate':
            // 旋转逻辑：计算触摸相对于元素中心的角度变化
            const selectedElement = elements.find(el => selectedElementIds.includes(el.id));
            if (selectedElement) {
              const centerX = selectedElement.x + selectedElement.width / 2;
              const centerY = selectedElement.y + selectedElement.height / 2;
              
              const currentAngle = Math.atan2(
                touch.clientY / scale - centerY,
                touch.clientX / scale - centerX
              );
              const startAngle = Math.atan2(
                resizeStartPos.y / scale - centerY,
                resizeStartPos.x / scale - centerX
              );
              
              const deltaRotation = (currentAngle - startAngle) * (180 / Math.PI);
              rotateSelectedElements(deltaRotation);
              setResizeStartPos({ x: touch.clientX, y: touch.clientY });
            }
            return;
        }
        
        resizeSelectedElements(deltaWidth, deltaHeight);
        setResizeStartPos({ x: touch.clientX, y: touch.clientY });
      }
    }
  }, [isDraggingCanvas, isDraggingElement, isResizing, activeTouchId, isPinching, 
      lastMousePos, dragStartPos, resizeStartPos, resizeHandle, lastPinchDistance,
      position, scale, selectedElementIds, updateCanvasPosition, updateCanvasScale,
      moveSelectedElements, rotateSelectedElements, resizeSelectedElements, elements]);
  
  // 处理触摸结束事件
  const handleTouchEnd = (e: React.TouchEvent) => {
    setIsDraggingCanvas(false);
    setIsDraggingElement(false);
    setIsResizing(false);
    setIsPinching(false);
    setActiveTouchId(null);
    
    // 重置光标样式
    document.body.style.cursor = 'default';
    
    // 移除所有元素的拖拽状态
    selectedElementIds.forEach(id => {
      updateElement(id, { isDragging: false });
    });
  };
  
  // 处理触摸取消事件
  const handleTouchCancel = () => {
    setIsDraggingCanvas(false);
    setIsDraggingElement(false);
    setIsResizing(false);
    setIsPinching(false);
    setActiveTouchId(null);
    
    // 重置光标样式
    document.body.style.cursor = 'default';
    
    // 移除所有元素的拖拽状态
    selectedElementIds.forEach(id => {
      updateElement(id, { isDragging: false });
    });
  };

  // 处理元素选择事件
  const handleElementSelect = (elementId: string, event: React.MouseEvent) => {
    event.stopPropagation();
    const multiSelect = event.ctrlKey || event.metaKey;
    selectElement(elementId, multiSelect);
    
    // 播放选中动画或音效（视觉反馈）
    // 简单实现：添加选中状态并在短时间后移除，用于CSS动画
    setTimeout(() => {
      const element = elements.find(el => el.id === elementId);
      if (element && element.selected) {
        updateElement(elementId, { 
          selected: true,
          isHighlighted: true 
        });
        setTimeout(() => {
          updateElement(elementId, { isHighlighted: false });
        }, 300);
      }
    }, 0);
  };
  
  // 处理元素拖拽开始
  const handleElementDragStart = (elementId: string, event: React.MouseEvent) => {
    event.stopPropagation();
    
    // 如果元素未被选中，则先选中它
    if (!selectedElementIds.includes(elementId)) {
      const multiSelect = event.ctrlKey || event.metaKey;
      selectElement(elementId, multiSelect);
    }
    
    // 准备拖拽选中的元素
    setIsDraggingElement(true);
    setDragStartPos({ x: event.clientX, y: event.clientY });
    
    // 为被拖拽的元素添加拖拽状态
    selectedElementIds.forEach(id => {
      updateElement(id, { isDragging: true });
    });
  };
  
  // 处理元素双击
  const handleElementDoubleClick = (elementId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    // 可以在这里添加双击处理逻辑
    // 例如：如果是文本元素，可以直接进入编辑模式
    const element = elements.find(el => el.id === elementId);
    if (element && element.type === 'text') {
      // 可以在这里触发文本编辑功能
    }
  };
  
  // 处理文本元素更新
  const handleTextElementUpdate = (elementId: string, updates: Partial<any>) => {
    // 使用canvasState中的更新方法
    updateElement(elementId, updates);
  };

  // 处理全局鼠标移动和释放事件
  useEffect(() => {
    const handleGlobalMouseMove = (e: MouseEvent) => {
      if (isDraggingCanvas) {
        // 拖拽画布
        const deltaX = e.clientX - lastMousePos.x;
        const deltaY = e.clientY - lastMousePos.y;
        
        updateCanvasPosition({
          x: position.x + deltaX,
          y: position.y + deltaY
        });
        
        setLastMousePos({ x: e.clientX, y: e.clientY });
        document.body.style.cursor = 'grabbing';
      } else if (isDraggingElement && selectedElementIds.length > 0) {
        // 拖拽选中的元素
        const deltaX = (e.clientX - dragStartPos.x) / scale;
        const deltaY = (e.clientY - dragStartPos.y) / scale;
        
        // 优化：只在有实际移动时才更新
        if (Math.abs(deltaX) > 0 || Math.abs(deltaY) > 0) {
          moveSelectedElements(deltaX, deltaY);
          setDragStartPos({ x: e.clientX, y: e.clientY });
        }
        document.body.style.cursor = 'grabbing';
      } else if (isResizing && resizeHandle && selectedElementIds.length > 0) {
        // 调整元素大小
        const deltaX = (e.clientX - resizeStartPos.x) / scale;
        const deltaY = (e.clientY - resizeStartPos.y) / scale;
        
        let deltaWidth = 0;
        let deltaHeight = 0;
        
        // 根据拖动的手柄计算宽高变化
        switch (resizeHandle) {
          case 'n':
            deltaHeight = -deltaY;
            break;
          case 's':
            deltaHeight = deltaY;
            break;
          case 'w':
            deltaWidth = -deltaX;
            break;
          case 'e':
            deltaWidth = deltaX;
            break;
          case 'nw':
            deltaWidth = -deltaX;
            deltaHeight = -deltaY;
            break;
          case 'ne':
            deltaWidth = deltaX;
            deltaHeight = -deltaY;
            break;
          case 'sw':
            deltaWidth = -deltaX;
            deltaHeight = deltaY;
            break;
          case 'se':
            deltaWidth = deltaX;
            deltaHeight = deltaY;
            break;
          case 'rotate':
            // 旋转逻辑：计算鼠标相对于元素中心的角度变化
            const selectedElement = elements.find(el => selectedElementIds.includes(el.id));
            if (selectedElement) {
              const centerX = selectedElement.x + selectedElement.width / 2;
              const centerY = selectedElement.y + selectedElement.height / 2;
              
              const currentAngle = Math.atan2(
                e.clientY / scale - centerY,
                e.clientX / scale - centerX
              );
              const startAngle = Math.atan2(
                resizeStartPos.y / scale - centerY,
                resizeStartPos.x / scale - centerX
              );
              
              const deltaRotation = (currentAngle - startAngle) * (180 / Math.PI);
              rotateSelectedElements(deltaRotation);
              setResizeStartPos({ x: e.clientX, y: e.clientY });
            }
            return;
        }
        
        resizeSelectedElements(deltaWidth, deltaHeight);
        document.body.style.cursor = getCursorForResizeHandle(resizeHandle);
      }
    };

    const handleGlobalMouseUp = () => {
      setIsDraggingCanvas(false);
      setIsDraggingElement(false);
      setIsResizing(false);
      setResizeHandle(null);
      document.body.style.cursor = 'default';
      
      // 移除所有元素的拖拽状态
      selectedElementIds.forEach(id => {
        updateElement(id, { isDragging: false });
      });
    };

    document.addEventListener('mousemove', handleGlobalMouseMove);
    document.addEventListener('mouseup', handleGlobalMouseUp);

    return () => {
      document.removeEventListener('mousemove', handleGlobalMouseMove);
      document.removeEventListener('mouseup', handleGlobalMouseUp);
    };
  }, [isDraggingCanvas, isDraggingElement, lastMousePos, dragStartPos, 
      position, scale, selectedElementIds, updateCanvasPosition, 
      moveSelectedElements, updateElement, elements]);

  // 处理鼠标滚轮事件，实现缩放
  const handleWheel = (e: React.WheelEvent) => {
    e.preventDefault();
    
    const container = containerRef.current;
    if (!container) return;
    
    // 计算鼠标在容器中的位置
    const rect = container.getBoundingClientRect();
    const mouseX = e.clientX - rect.left;
    const mouseY = e.clientY - rect.top;
    
    // 缩放前的鼠标相对于画布原点的位置
    const mouseXCanvas = (mouseX - position.x) / scale;
    const mouseYCanvas = (mouseY - position.y) / scale;
    
    // 计算新的缩放比例
    const scaleFactor = e.deltaY > 0 ? 0.9 : 1.1;
    const newScale = Math.max(0.1, Math.min(5, scale * scaleFactor));
    
    // 计算新的位置，使缩放围绕鼠标位置进行
    const newX = mouseX - mouseXCanvas * newScale;
    const newY = mouseY - mouseYCanvas * newScale;
    
    updateCanvasScale(newScale);
    updateCanvasPosition({ x: newX, y: newY });
  };

  // 获取调整大小手柄的光标样式
  const getCursorForResizeHandle = (handle: string) => {
    const cursors: { [key: string]: string } = {
      'n': 'ns-resize',
      's': 'ns-resize',
      'w': 'ew-resize',
      'e': 'ew-resize',
      'nw': 'nwse-resize',
      'ne': 'nesw-resize',
      'sw': 'nesw-resize',
      'se': 'nwse-resize',
      'rotate': 'grab'
    };
    return cursors[handle] || 'default';
  };
  
  // 获取调整大小手柄的位置
  const getPositionForResizeHandle = (handle: string) => {
    const positions: { [key: string]: React.CSSProperties } = {
      'n': { top: '-5px', left: '50%', transform: 'translateX(-50%)' },
      's': { bottom: '-5px', left: '50%', transform: 'translateX(-50%)' },
      'w': { left: '-5px', top: '50%', transform: 'translateY(-50%)' },
      'e': { right: '-5px', top: '50%', transform: 'translateY(-50%)' },
      'nw': { top: '-5px', left: '-5px' },
      'ne': { top: '-5px', right: '-5px' },
      'sw': { bottom: '-5px', left: '-5px' },
      'se': { bottom: '-5px', right: '-5px' }
    };
    return positions[handle] || {};
  };
  
  // 处理调整大小手柄的鼠标按下事件
  const handleResizeHandleMouseDown = (e: React.MouseEvent, handle: string) => {
    e.stopPropagation();
    
    setIsResizing(true);
    setResizeHandle(handle);
    setResizeStartPos({ x: e.clientX, y: e.clientY });
    
    // 获取第一个选中元素的尺寸作为参考
    const selectedElement = elements.find(el => selectedElementIds.includes(el.id));
    if (selectedElement) {
      setResizeStartSize({ width: selectedElement.width, height: selectedElement.height });
    }
    
    document.body.style.cursor = getCursorForResizeHandle(handle);
  };
  
  // 键盘快捷键处理
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // 删除选中的元素
      if ((e.key === 'Delete' || e.key === 'Backspace') && selectedElementIds.length > 0) {
        e.preventDefault();
        deleteSelectedElements();
      }
      
      // 重置视图（Alt+0）
      if (e.altKey && e.key === '0') {
        updateCanvasPosition({ x: 0, y: 0 });
        updateCanvasScale(1);
      }
      
      // 旋转元素（Alt+方向键）
      if (e.altKey && selectedElementIds.length > 0) {
        if (e.key === 'ArrowLeft') {
          e.preventDefault();
          rotateSelectedElements(-5); // 逆时针旋转5度
        } else if (e.key === 'ArrowRight') {
          e.preventDefault();
          rotateSelectedElements(5); // 顺时针旋转5度
        }
      }
      
      // 调整元素大小（Ctrl+方向键）
      if (e.ctrlKey && selectedElementIds.length > 0) {
        const scaleFactor = 10;
        if (e.key === 'ArrowUp') {
          e.preventDefault();
          resizeSelectedElements(0, -scaleFactor);
        } else if (e.key === 'ArrowDown') {
          e.preventDefault();
          resizeSelectedElements(0, scaleFactor);
        } else if (e.key === 'ArrowLeft') {
          e.preventDefault();
          resizeSelectedElements(-scaleFactor, 0);
        } else if (e.key === 'ArrowRight') {
          e.preventDefault();
          resizeSelectedElements(scaleFactor, 0);
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [selectedElementIds, updateCanvasPosition, updateCanvasScale, deleteSelectedElements, rotateSelectedElements, resizeSelectedElements]);

  return (
    <>
      {!isMobile && <Toolbar currentTool={currentTool} onToolChange={setCurrentTool} />}
      <ImageUploader onImageSelected={handleImageUpload} />
      
      {/* 隐藏的文件输入 */}
      <input
        type="file"
        ref={fileInputRef}
        onChange={handleFileInputChange}
        accept="image/*"
        style={{ display: 'none' }}
      />
      
      <div 
        className="canvas-container"
        ref={containerRef}
        onMouseDown={handleMouseDown}
        onWheel={handleWheel}
        onClick={handleCanvasClick}
      >
        <div 
          className="infinite-canvas" 
          ref={canvasRef}
          style={{
            transform: `translate(${position.x}px, ${position.y}px) scale(${scale})`,
            transformOrigin: '0 0'
          }}
        >
          <div className="canvas-grid"></div>
          
          {/* 渲染所有画布元素 */}
          {elements.map(element => (
            <React.Fragment key={element.id}>
              <ElementRenderer
                element={element}
                onSelect={handleElementSelect}
                onDoubleClick={handleElementDoubleClick}
                onTextUpdate={handleTextElementUpdate}
                onDragStart={handleElementDragStart}
              />
              
              {/* 如果元素被选中，显示调整大小和旋转手柄 */}
              {element.selected && (
                <div
                  className="resize-handles"
                  style={{
                    position: 'absolute',
                    left: `${element.x}px`,
                    top: `${element.y}px`,
                    width: `${element.width}px`,
                    height: `${element.height}px`,
                    transform: `scale(${element.scale}) rotate(${element.rotation}deg)`,
                    transformOrigin: '0 0',
                    zIndex: element.zIndex + 1,
                    pointerEvents: 'none'
                  }}
                >
                /* 八个调整大小手柄 - 移动端更大一些 */
                  {['n', 's', 'w', 'e', 'nw', 'ne', 'sw', 'se'].map(handle => (
                    <div
                      key={handle}
                      className={`resize-handle resize-handle-${handle}`}
                      style={{
                        position: 'absolute',
                        width: isMobile ? '20px' : '10px',
                        height: isMobile ? '20px' : '10px',
                        backgroundColor: '#2196F3',
                        border: '1px solid white',
                        borderRadius: '50%',
                        cursor: getCursorForResizeHandle(handle),
                        pointerEvents: 'auto',
                        touchAction: 'none',
                        ...getPositionForResizeHandle(handle)
                      }}
                      onMouseDown={(e) => handleResizeHandleMouseDown(e, handle)}
                      onTouchStart={(e) => {
                        e.stopPropagation();
                        // 模拟鼠标按下事件
                        handleResizeHandleMouseDown(
                          { clientX: e.touches[0].clientX, clientY: e.touches[0].clientY } as any, 
                          handle
                        );
                      }}
                    />
                  ))}
                  
                  {/* 旋转手柄 - 移动端更大一些 */}
                  <div
                    className="resize-handle resize-handle-rotate"
                    style={{
                      position: 'absolute',
                      width: isMobile ? '24px' : '12px',
                      height: isMobile ? '24px' : '12px',
                      backgroundColor: '#f44336',
                      border: '1px solid white',
                      borderRadius: '50%',
                      cursor: 'grab',
                      pointerEvents: 'auto',
                      touchAction: 'none',
                      top: isMobile ? '-40px' : '-30px',
                      left: '50%',
                      transform: 'translateX(-50%)'
                    }}
                    onMouseDown={(e) => handleResizeHandleMouseDown(e, 'rotate')}
                    onTouchStart={(e) => {
                      e.stopPropagation();
                      // 模拟鼠标按下事件
                      handleResizeHandleMouseDown(
                        { clientX: e.touches[0].clientX, clientY: e.touches[0].clientY } as any, 
                        'rotate'
                      );
                    }}
                  />
                </div>
              )}
            </React.Fragment>
          ))}
        </div>
      </div>
      
      {/* 画布状态指示器和快捷键提示 */}
      <CanvasStatus 
        scale={scale}
        selectedElementCount={selectedElementIds.length}
        elementCount={elements.length}
      />
      <KeyboardShortcuts />
    </>
  );
};

export default Canvas;