import React, { useRef, useState, useEffect, useLayoutEffect, useCallback } from 'react';
import './Canvas.css';
import useCanvasState from '../components/Canvas/useCanvasState';
import ElementRenderer from '../components/Canvas/ElementRenderer/ElementRenderer';
import Toolbar from '../components/Canvas/Toolbar/Toolbar';
import CanvasStatus from '../components/Canvas/CanvasStatus/CanvasStatus';
import KeyboardShortcuts from '../components/Canvas/KeyboardShortcuts/KeyboardShortcuts';
import PatternSidebar from '../components/Canvas/PatternSidebar/PatternSidebar';
import ColorPicker from '../components/Canvas/ColorPicker/ColorPicker';
import FilterPicker from '../components/Canvas/FilterPicker/FilterPicker';
import type { CanvasElement, Pattern, ImageElement } from '../components/Canvas/types';

interface CanvasProps {
}

const Canvas: React.FC<CanvasProps> = () => {
  // 引用定义
  const canvasRef = useRef<HTMLDivElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const importFileInputRef = useRef<HTMLInputElement>(null);

  // 拖拽和交互状态
  const [isDraggingCanvas, setIsDraggingCanvas] = useState(false);
  const [lastMousePos, setLastMousePos] = useState({ x: 0, y: 0 });
  const [isDraggingElement, setIsDraggingElement] = useState(false);
  const [dragStartPos, setDragStartPos] = useState({ x: 0, y: 0 });
  const [lastDragPos, setLastDragPos] = useState({ x: 0, y: 0 }); // 新增：保存上一次拖拽位置
  const [isResizing, setIsResizing] = useState(false);
  const [resizeHandle, setResizeHandle] = useState<string | null>(null);
  const [resizeStartPos, setResizeStartPos] = useState({ x: 0, y: 0 });
  const [resizeStartSize, setResizeStartSize] = useState({ width: 0, height: 0 });
  const [isTextEditing, setIsTextEditing] = useState(false); // 跟踪文本编辑状态
  const [isMobile, setIsMobile] = useState(false);
  const [activeTouchId, setActiveTouchId] = useState<number | null>(null); // 当前活动触摸ID
  const [isPinching, setIsPinching] = useState(false); // 是否正在捏合缩放
  const [lastPinchDistance, setLastPinchDistance] = useState(0); // 上次捏合距离
  const [hasDragged, setHasDragged] = useState(false); // 用于跟踪是否发生了拖拽操作
  const [selectedPattern, setSelectedPattern] = useState<Pattern | null>(null); // 保存选中的图案
  // 框选状态
  const [isMarqueeSelecting, setIsMarqueeSelecting] = useState(false);
  const [marqueeStartPos, setMarqueeStartPos] = useState({ x: 0, y: 0 });
  const [marqueeEndPos, setMarqueeEndPos] = useState({ x: 0, y: 0 });
  const [justDeselected, setJustDeselected] = useState(false); // 跟踪是否刚从选中状态切换
  const [showColorPicker, setShowColorPicker] = useState(false); // 控制颜色选择器显示
  const [colorPickerPosition, setColorPickerPosition] = useState({ x: 0, y: 0 }); // 颜色选择器位置
  const [colorPickerTargetElement, setColorPickerTargetElement] = useState<string | null>(null); // 颜色选择器目标元素

  const [showFilterPicker, setShowFilterPicker] = useState(false); // 控制滤镜选择器显示
  const [filterPickerPosition, setFilterPickerPosition] = useState({ x: 0, y: 0 }); // 滤镜选择器位置
  const [filterPickerTargetElement, setFilterPickerTargetElement] = useState<string | null>(null); // 滤镜选择器目标元素

  // 右键拖动状态
  const [rightMouseButtonDown, setRightMouseButtonDown] = useState(false);

  // 使用自定义Hook管理画布状态
  const canvasState = useCanvasState({
    elements: [],
    selectedElementIds: [],
    currentTool: 'select',
    position: { x: 0, y: 0 },
    scale: 1
  });

  // 线条模式状态管理
  const [isLineMode, setIsLineMode] = useState(false);

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
    clearCanvas,
    setCurrentTool,
    updateCanvasPosition,
    updateCanvasScale,
    moveSelectedElements,
    updateElement,
    deleteSelectedElements,
    rotateSelectedElements,
    resizeSelectedElements,
    copyElements,
    pasteElements
  } = canvasState;

  // 导出JSON功能
  const handleExport = () => {
    const canvasData = {
      elements: elements.map(element => ({
        ...element,
        // 移除临时状态属性
        isDragging: undefined,
        isHighlighted: undefined
      }))
    };

    const dataStr = JSON.stringify(canvasData, null, 2);
    const dataUri = 'data:application/json;charset=utf-8,' + encodeURIComponent(dataStr);

    const exportFileDefaultName = `canvas-export-${new Date().toISOString().slice(0, 10)}.json`;

    const linkElement = document.createElement('a');
    linkElement.setAttribute('href', dataUri);
    linkElement.setAttribute('download', exportFileDefaultName);
    linkElement.click();
  };

  // 导入JSON功能
  const handleImport = () => {
    if (importFileInputRef.current) {
      importFileInputRef.current.click();
    }
  };

  // 处理导入文件
  const handleFileImport = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const content = event.target?.result as string;
        const canvasData = JSON.parse(content);

        // 清除当前画布上的所有元素
        clearSelection();
        canvasData.elements.forEach((element: any) => {
          // 为每个导入的元素生成新的ID，避免ID冲突
          const { id, ...elementWithoutId } = element;
          addElement(elementWithoutId as any);
        });
      } catch (error) {
        console.error('导入失败:', error);
        alert('导入失败，请检查JSON文件格式是否正确');
      }
    };

    reader.readAsText(file);

    // 重置文件输入
    if (importFileInputRef.current) {
      importFileInputRef.current.value = '';
    }
  };

  // 处理从侧边栏选择图案
  const handleSelectPattern = useCallback((pattern: Pattern) => {
    // 保存选中的图案到状态
    setSelectedPattern(pattern);

    // 清除当前选择
    clearSelection();

    // 不再自动添加元素，改为在用户点击画布时添加
    // 同时将当前工具设置为shape，以便用户点击画布时可以创建图形
    setCurrentTool('shape');
  }, [clearSelection, setCurrentTool]);

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
    // 检查是否发生了拖拽操作
    if (hasDragged) {
      // 重置拖拽状态
      setHasDragged(false);
      return; // 不执行后续操作
    }

    // 如果不是在拖拽状态
    if (!isDraggingCanvas && !isDraggingElement) {
      // 检查是否有选中的元素
      const hadSelectedElements = selectedElementIds.length > 0;

      // 清除所有选择
      clearSelection();

      // 如果刚从选中状态切换，不创建新元素
      if (hadSelectedElements) {
        setJustDeselected(true);
        return;
      }

      // 如果设置了justDeselected标志，重置它但不创建新元素
      if (justDeselected) {
        setJustDeselected(false);
        return;
      }

      // 根据当前工具创建新元素
      if (currentTool !== 'select') {
        const canvasCoords = clientToCanvasCoords(e.clientX, e.clientY);

        switch (currentTool) {
          // 当选择图形工具时，使用选中的图案
          case 'shape':
            if (selectedPattern) {
              // 使用从侧边栏选择的图案
              addElement({
                type: selectedPattern.type,
                x: canvasCoords.x - selectedPattern.width / 2,
                y: canvasCoords.y - selectedPattern.height / 2,
                width: selectedPattern.width,
                height: selectedPattern.height,
                rotation: 0,
                scale: 1,
                fill: selectedPattern.fill,
                stroke: selectedPattern.stroke,
                strokeWidth: selectedPattern.strokeWidth
              } as Omit<CanvasElement, 'id' | 'selected' | 'zIndex'>);
            }
            break;

          case 'text':
            addElement({
              type: 'text',
              // 调整文本框位置，使其左上角与鼠标点击位置对齐
              // 或者根据需要调整偏移量
              x: canvasCoords.x - 100, // 向左偏移文本框宽度的一半
              y: canvasCoords.y - 25,  // 向上偏移文本框高度的一半
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
    // 重置拖拽状态
    setHasDragged(false);

    // 检查是否是右键点击
    if (e.button === 2) {
      e.preventDefault(); // 阻止默认右键菜单
      setRightMouseButtonDown(true);
      setIsDraggingCanvas(true);
      setLastMousePos({ x: e.clientX, y: e.clientY });
      document.body.style.cursor = 'grabbing';
    } else {
      // 左键点击逻辑
      // 检查是否点击了画布空白区域
      const target = e.target as HTMLElement;
      const canvasElement = target.closest('.canvas-element');

      // 如果点击了画布空白区域（不是元素），开始框选
      if (!canvasElement) {
        // 获取canvas-container的位置
        const containerRect = (e.currentTarget as HTMLElement).getBoundingClientRect();

        // 计算鼠标相对于容器的坐标
        const relativeX = e.clientX - containerRect.left;
        const relativeY = e.clientY - containerRect.top;

        setIsMarqueeSelecting(true);
        setMarqueeStartPos({ x: relativeX, y: relativeY });
        setMarqueeEndPos({ x: relativeX, y: relativeY });
        document.body.style.cursor = 'crosshair';
      }
    }
  };

  // // 处理触摸开始事件
  // const handleTouchStart = (e: React.TouchEvent) => {
  //   const touches = e.touches;

  //   // 单指触摸
  //   if (touches.length === 1) {
  //     const touch = touches[0];
  //     setActiveTouchId(touch.identifier);

  //     // 检查是否点击了画布本身
  //     if (e.target === canvasRef.current) {
  //       setIsDraggingCanvas(true);
  //       setLastMousePos({ x: touch.clientX, y: touch.clientY });
  //     }
  //   }
  //   // 双指触摸开始缩放
  //   else if (touches.length === 2 && !isPinching) {
  //     e.preventDefault();
  //     setIsPinching(true);
  //     setLastPinchDistance(getDistance(touches));
  //   }
  // };

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

        const dx = touch.clientX - lastDragPos.x;
        const dy = touch.clientY - lastDragPos.y;

        moveSelectedElements(dx / scale, dy / scale);
        setLastDragPos({ x: touch.clientX, y: touch.clientY });
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
    setDragStartPos({ x: 0, y: 0 });
    setLastDragPos({ x: 0, y: 0 });

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
    setDragStartPos({ x: 0, y: 0 });
    setLastDragPos({ x: 0, y: 0 });

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

    // 根据元素类型显示不同的选择器
    const element = elements.find(el => el.id === elementId);
    if (element && !hasDragged) {
      // 计算选择器位置
      const canvasRect = canvasRef.current?.getBoundingClientRect();
      const containerRect = containerRef.current?.getBoundingClientRect();

      if (canvasRect && containerRect) {
        // 计算元素在屏幕上的位置
        const elementScreenX = containerRect.left + position.x + (element.x + element.width) * scale + 10; // 显示在元素右侧
        const elementScreenY = containerRect.top + position.y + (element.y + element.height / 2) * scale; // 垂直居中

        if (['rect', 'circle', 'star', 'rounded-rect', 'triangle'].includes(element.type)) {
          // 显示颜色选择器
          setColorPickerPosition({
            x: elementScreenX,
            y: elementScreenY - 140 // 垂直居中
          });
          setColorPickerTargetElement(elementId);
          setShowColorPicker(true);
        } else if (element.type === 'image') {
          // 显示滤镜选择器
          setFilterPickerPosition({
            x: elementScreenX,
            y: elementScreenY - 140 // 垂直居中
          });
          setFilterPickerTargetElement(elementId);
          setShowFilterPicker(true);
        }
      }
    }
  };

  // 处理背景色变更
  const handleFillChange = (color: string) => {
    if (colorPickerTargetElement) {
      const element = elements.find(el => el.id === colorPickerTargetElement);
      if (element) {
        updateElement(colorPickerTargetElement, {
          fill: color
        });
      }
    }
  };

  // 处理边框色变更
  const handleStrokeChange = (color: string) => {
    if (colorPickerTargetElement) {
      const element = elements.find(el => el.id === colorPickerTargetElement);
      if (element) {
        updateElement(colorPickerTargetElement, {
          stroke: color
        });
      }
    }
  };

  // 处理边框宽度变更
  const handleStrokeWidthChange = (width: number) => {
    if (colorPickerTargetElement) {
      const element = elements.find(el => el.id === colorPickerTargetElement);
      if (element) {
        updateElement(colorPickerTargetElement, {
          strokeWidth: width
        });
      }
    }
  };

  // 处理滤镜变更
  const handleFilterChange = (filter: string) => {
    if (filterPickerTargetElement) {
      const element = elements.find(el => el.id === filterPickerTargetElement);
      if (element && element.type === 'image') {
        updateElement(filterPickerTargetElement, {
          filter: filter
        });
      }
    }
  };

  // 处理颜色选择（保留原有方法兼容性）
  const handleColorSelect = (color: string) => {
    if (colorPickerTargetElement) {
      const element = elements.find(el => el.id === colorPickerTargetElement);
      if (element) {
        updateElement(colorPickerTargetElement, {
          fill: color
        });
      }
    }
    setShowColorPicker(false);
  };

  // 处理颜色选择器关闭
  const handleColorPickerClose = () => {
    setShowColorPicker(false);
    setColorPickerTargetElement(null);
  };

  // 处理滤镜选择器关闭
  const handleFilterPickerClose = () => {
    setShowFilterPicker(false);
    setFilterPickerTargetElement(null);
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
    setLastDragPos({ x: event.clientX, y: event.clientY }); // 初始化上一次拖拽位置

    // 为被拖拽的元素添加拖拽状态
    selectedElementIds.forEach(id => {
      updateElement(id, { isDragging: true });
    });
  }

  // 处理元素触摸拖拽开始
  const handleElementTouchStart = (elementId: string, event: React.TouchEvent) => {
    event.stopPropagation();

    // 如果元素未被选中，则先选中它
    if (!selectedElementIds.includes(elementId)) {
      selectElement(elementId, false); // 触摸不支持多选
    }

    // 准备拖拽选中的元素
    const touch = event.touches[0];
    setIsDraggingElement(true);
    setDragStartPos({ x: touch.clientX, y: touch.clientY });
    setLastDragPos({ x: touch.clientX, y: touch.clientY }); // 初始化上一次拖拽位置

    // 为被拖拽的元素添加拖拽状态
    selectedElementIds.forEach(id => {
      updateElement(id, { isDragging: true });
    });
  }

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
      if (isDraggingCanvas && rightMouseButtonDown) {
        // 只有右键按下时才拖动画布
        e.preventDefault(); // 阻止默认行为，如文本选择
        const deltaX = e.clientX - lastMousePos.x;
        const deltaY = e.clientY - lastMousePos.y;

        // 当移动距离超过一定阈值时，标记为拖拽操作
        if (Math.abs(deltaX) > 2 || Math.abs(deltaY) > 2) {
          setHasDragged(true);
        }

        updateCanvasPosition({
          x: position.x + deltaX,
          y: position.y + deltaY
        });

        setLastMousePos({ x: e.clientX, y: e.clientY });
        document.body.style.cursor = 'grabbing';
      } else if (isDraggingElement && selectedElementIds.length > 0) {
        // 拖拽选中的元素 - 需要除以scale，确保在不同缩放比例下鼠标移动距离与元素移动距离一致
        const deltaX = (e.clientX - lastDragPos.x) / scale;
        const deltaY = (e.clientY - lastDragPos.y) / scale;

        // 当移动距离超过一定阈值时，标记为拖拽操作
        if (Math.abs(deltaX) > 2 || Math.abs(deltaY) > 2) {
          setHasDragged(true);
        }

        // 优化：只在有实际移动时才更新
        if (Math.abs(deltaX) > 0 || Math.abs(deltaY) > 0) {
          moveSelectedElements(deltaX, deltaY);
          setLastDragPos({ x: e.clientX, y: e.clientY });
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
      } else if (isMarqueeSelecting) {
        // 框选进行中，更新框选结束位置
        e.preventDefault();

        // 获取canvas-container的位置
        const containerRect = containerRef.current?.getBoundingClientRect();
        if (containerRect) {
          // 计算鼠标相对于容器的坐标
          const relativeX = e.clientX - containerRect.left;
          const relativeY = e.clientY - containerRect.top;
          setMarqueeEndPos({ x: relativeX, y: relativeY });
        }
      }
    };

    const handleGlobalMouseUp = () => {
      setIsDraggingCanvas(false);
      setRightMouseButtonDown(false);
      setIsDraggingElement(false);
      setIsResizing(false);
      setResizeHandle(null);
      setDragStartPos({ x: 0, y: 0 }); // 重置拖拽起始位置
      setLastDragPos({ x: 0, y: 0 }); // 重置上一次拖拽位置

      // 处理框选结束
      if (isMarqueeSelecting) {
        // 计算框选区域的边界和尺寸
        const startX = Math.min(marqueeStartPos.x, marqueeEndPos.x);
        const startY = Math.min(marqueeStartPos.y, marqueeEndPos.y);
        const endX = Math.max(marqueeStartPos.x, marqueeEndPos.x);
        const endY = Math.max(marqueeStartPos.y, marqueeEndPos.y);

        // 计算框选区域的宽度和高度
        const width = endX - startX;
        const height = endY - startY;

        // 只有当框选区域的宽度和高度都大于5像素时，才认为是真正的拖拽
        // 这样纯点击时不会阻止生成元素
        if (width > 5 || height > 5) {
          setHasDragged(true);
        }

        // 计算框选区域的实际尺寸（考虑画布的缩放和位置）
        const selectionRect = {
          x: (startX - position.x) / scale,
          y: (startY - position.y) / scale,
          width: (endX - startX) / scale,
          height: (endY - startY) / scale
        };

        // 找出所有与框选区域重叠的元素
        const selectedElements = elements.filter(element => {
          // 检查元素是否与框选区域重叠
          return (
            element.x < selectionRect.x + selectionRect.width &&
            element.x + element.width > selectionRect.x &&
            element.y < selectionRect.y + selectionRect.height &&
            element.y + element.height > selectionRect.y
          );
        });

        // 选中这些元素
        if (selectedElements.length > 0) {
          const selectedIds = selectedElements.map(el => el.id);

          // 先清除当前选择
          clearSelection();

          // 然后选择所有框选到的元素
          selectedIds.forEach(id => {
            selectElement(id, true); // 使用multiSelect=true保持之前的选择
            updateElement(id, { selected: true });
          });
        } else {
          // 如果没有选中任何元素，取消所有选择
          clearSelection();
        }
      }

      setIsMarqueeSelecting(false);
      document.body.style.cursor = 'default';

      // 移除所有元素的拖拽状态
      selectedElementIds.forEach(id => {
        updateElement(id, { isDragging: false });
      });

      // 注意：这里不立即重置hasDragged，因为click事件会在mouseup后触发
      // hasDragged会在handleCanvasClick中检查后重置
    };

    // 阻止默认右键菜单
    const handleContextMenu = (e: MouseEvent) => {
      const target = e.target as HTMLElement;
      if (target.closest('.canvas-container') || target.closest('.infinite-canvas')) {
        e.preventDefault();
      }
    };

    document.addEventListener('mousemove', handleGlobalMouseMove);
    document.addEventListener('mouseup', handleGlobalMouseUp);
    document.addEventListener('contextmenu', handleContextMenu);

    return () => {
      document.removeEventListener('mousemove', handleGlobalMouseMove);
      document.removeEventListener('mouseup', handleGlobalMouseUp);
      document.removeEventListener('contextmenu', handleContextMenu);
    };
  }, [isDraggingCanvas, rightMouseButtonDown, isDraggingElement, lastMousePos, dragStartPos,
    position, scale, selectedElementIds, updateCanvasPosition,
    moveSelectedElements, updateElement, elements, isMarqueeSelecting,
    marqueeStartPos, marqueeEndPos, clearSelection, selectElement]);

  // 处理鼠标滚轮事件，实现缩放
  const handleWheel = (e: React.WheelEvent) => {
    // 检查是否有选中的元素，并且鼠标在选中元素上方
    if (selectedElementIds.length > 0 && !e.shiftKey) {
      e.preventDefault();

      // 计算缩放因子
      const scaleFactor = e.deltaY > 0 ? -5 : 5; // 上滑缩小，下滑放大

      // 调整选中元素的大小
      resizeSelectedElements(scaleFactor, scaleFactor);
    }
    // 只有按下Shift键时才允许缩放画布
    else if (e.shiftKey) {
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
    }
  };

  // 根据调整手柄的方向获取光标的样式
  const getCursorForResizeHandle = (handle: string): string => {
    switch (handle) {
      case 'nw':
        return 'nwse-resize';
      case 'ne':
        return 'nesw-resize';
      case 'sw':
        return 'nesw-resize';
      case 'se':
        return 'nwse-resize';
      case 'rotate':
        return 'grab';
      default:
        return 'default';
    }
  };

  // 根据调整手柄的方向获取其位置
  const getPositionForResizeHandle = (handle: string): React.CSSProperties => {
    switch (handle) {
      // 四角的点 - 定位在角落
      case 'nw':
        return { top: 0, left: 0 };
      case 'ne':
        return { top: 0, right: 0 };
      case 'sw':
        return { bottom: 0, left: 0 };
      case 'se':
        return { bottom: 0, right: 0 };
      default:
        return {};
    }
  };

  // 处理鼠标释放事件
  const handleMouseUp = () => {
    if (isResizing) {
      setIsResizing(false);
      setResizeHandle(null);
      document.body.style.cursor = 'default';

      // 移除所有手柄的clicked类名
      document.querySelectorAll('.resize-handle.clicked').forEach(handle => {
        handle.classList.remove('clicked');
      });
    }
  };

  // 处理调整大小手柄的鼠标按下事件
  const handleResizeHandleMouseDown = (e: React.MouseEvent, handle: string) => {
    e.stopPropagation();

    // 给点击的handle添加clicked类名
    const handleElement = e.target as HTMLElement;
    handleElement.classList.add('clicked');

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
      // 检查是否有输入框获得焦点
      const isInputFocused = document.activeElement && (document.activeElement.tagName === 'INPUT' || document.activeElement.tagName === 'TEXTAREA');

      // 复制选中的元素
      if ((e.ctrlKey || e.metaKey) && e.key === 'c' && selectedElementIds.length > 0 && !isTextEditing && !isInputFocused) {
        e.preventDefault();
        copyElements();
      }

      // 粘贴元素
      if ((e.ctrlKey || e.metaKey) && e.key === 'v' && !isTextEditing && !isInputFocused) {
        e.preventDefault();
        pasteElements();
      }

      // 删除选中的元素 - 只有在不在文本编辑模式且没有输入框获得焦点时才执行
      if ((e.key === 'Delete' || e.key === 'Backspace') && selectedElementIds.length > 0 && !isTextEditing && !isInputFocused) {
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
  }, [selectedElementIds, updateCanvasPosition, updateCanvasScale, deleteSelectedElements, rotateSelectedElements, resizeSelectedElements, copyElements, pasteElements]);

  // 全局鼠标事件监听
  useEffect(() => {
    // 只有在调整大小状态时才添加事件监听
    if (isResizing) {
      document.addEventListener('mouseup', handleMouseUp);
      return () => {
        document.removeEventListener('mouseup', handleMouseUp);
      };
    }
  }, [isResizing]);

  return (
    <>
      <Toolbar
        currentTool={currentTool}
        onToolChange={setCurrentTool}
        onExport={handleExport}
        onImport={handleImport}
        onClearCanvas={clearCanvas}
        isLineMode={isLineMode}
        onLineModeToggle={() => {
          const newValue = !isLineMode;
          console.log('线条模式切换:', isLineMode, '->', newValue);
          setIsLineMode(newValue);
        }}
      />
      {/* ImageUploader removed */}

      {/* 隐藏的文件输入 */}
      <input
        type="file"
        ref={fileInputRef}
        onChange={handleFileInputChange}
        accept="image/*"
        style={{ display: 'none' }}
      />

      {/* JSON导入的隐藏输入 */}
      <input
        type="file"
        ref={importFileInputRef}
        style={{ display: 'none' }}
        accept=".json"
        onChange={handleFileImport}
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
          <div
            className={`canvas-grid ${isLineMode ? 'line-mode' : ''}`}
            data-is-line-mode={isLineMode}
          ></div>
          {/* 调试信息 */}
          <div style={{
            position: 'fixed',
            top: 10,
            right: 10,
            backgroundColor: 'rgba(0,0,0,0.7)',
            color: 'white',
            padding: '5px 10px',
            borderRadius: '5px',
            fontSize: '12px',
            zIndex: 10000
          }}>
            线条模式: {isLineMode ? '开启' : '关闭'}
          </div>

          {/* 渲染所有画布元素 */}
          {elements.map(element => (
            <React.Fragment key={element.id}>
              <ElementRenderer
                element={element}
                onSelect={handleElementSelect}
                onDoubleClick={handleElementDoubleClick}
                onTextUpdate={handleTextElementUpdate}
                onDragStart={handleElementDragStart}
                onTouchStart={handleElementTouchStart}
                onStartEditing={() => setIsTextEditing(true)}
                onStopEditing={() => setIsTextEditing(false)}
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
                  {/* 八个调整大小手柄 - 移动端更大一些 */}
                  {['nw', 'ne', 'sw', 'se'].map(handle => (
                    <div
                      key={handle}
                      className={`resize-handle resize-handle-${handle}`}
                      style={{
                        position: 'absolute',
                        width: isMobile ? '24px' : '14px', // 增大尺寸
                        height: isMobile ? '24px' : '14px',
                        backgroundColor: '#2196F3',
                        border: '2px solid white', // 增加边框宽度
                        borderRadius: '50%',
                        cursor: getCursorForResizeHandle(handle),
                        pointerEvents: 'auto',
                        touchAction: 'none',
                        ...getPositionForResizeHandle(handle),
                        // 根据handle类型调整transform，确保手柄中心点在正确位置
                        transform: handle.includes('nw') ? 'translate(-50%, -50%)' :
                          handle.includes('ne') ? 'translate(50%, -50%)' :
                            handle.includes('sw') ? 'translate(-50%, 50%)' :
                              handle.includes('se') ? 'translate(50%, 50%)' : 'translate(-50%, -50%)'
                      }}
                      onMouseDown={(e) => handleResizeHandleMouseDown(e, handle)}
                      onMouseUp={(e) => {
                        const handleElement = e.target as HTMLElement;
                        handleElement.classList.remove('clicked');
                      }}
                      onTouchStart={(e) => {
                        e.stopPropagation();
                        // 模拟鼠标按下事件
                        handleResizeHandleMouseDown(
                          { clientX: e.touches[0].clientX, clientY: e.touches[0].clientY } as any,
                          handle
                        );
                      }}
                      onTouchEnd={(e) => {
                        const handleElement = e.target as HTMLElement;
                        handleElement.classList.remove('clicked');
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

        {/* 渲染虚线框选矩形 - 放在infinite-canvas外部，不受transform影响 */}
        {isMarqueeSelecting && (
          <div
            style={{
              position: 'absolute',
              left: Math.min(marqueeStartPos.x, marqueeEndPos.x),
              top: Math.min(marqueeStartPos.y, marqueeEndPos.y),
              width: Math.abs(marqueeEndPos.x - marqueeStartPos.x),
              height: Math.abs(marqueeEndPos.y - marqueeStartPos.y),
              border: '2px dashed blue',
              backgroundColor: 'rgba(0, 0, 255, 0.1)',
              pointerEvents: 'none',
              zIndex: 1000
            }}
          />
        )}

        {/* 显示选中元素的坐标 */}
        {selectedElementIds.length === 1 && (
          <div className="element-coordinates">
            {(() => {
              const selectedElement = elements.find(el => el.id === selectedElementIds[0]);
              if (selectedElement) {
                return (
                  <div>
                    X: {Math.round(selectedElement.x)}, Y: {Math.round(selectedElement.y)}
                  </div>
                );
              }
              return null;
            })()}
          </div>
        )}
      </div>

      {/* 侧边栏 - 只有在选择图形工具时才显示 */}
      {currentTool === 'shape' && <PatternSidebar onSelectPattern={handleSelectPattern} />}

      {/* 颜色选择器 - 当showColorPicker为true时显示 */}
      {showColorPicker && colorPickerTargetElement && (
        <ColorPicker
          position={colorPickerPosition}
          currentFill={(elements.find(el => el.id === colorPickerTargetElement) as any)?.fill || 'transparent'}
          currentStroke={(elements.find(el => el.id === colorPickerTargetElement) as any)?.stroke || 'black'}
          currentStrokeWidth={(elements.find(el => el.id === colorPickerTargetElement) as any)?.strokeWidth || 2}
          currentWidth={(elements.find(el => el.id === colorPickerTargetElement) as any)?.width || 100}
          currentHeight={(elements.find(el => el.id === colorPickerTargetElement) as any)?.height || 100}
          onFillChange={handleFillChange}
          onStrokeChange={handleStrokeChange}
          onStrokeWidthChange={handleStrokeWidthChange}
          onWidthChange={(width) => {
            const element = elements.find(el => el.id === colorPickerTargetElement);
            if (element) {
              updateElement(colorPickerTargetElement, { width });
            }
          }}
          onHeightChange={(height) => {
            const element = elements.find(el => el.id === colorPickerTargetElement);
            if (element) {
              updateElement(colorPickerTargetElement, { height });
            }
          }}
          onClose={handleColorPickerClose}
        />
      )}

      {/* 滤镜选择器 - 当showFilterPicker为true时显示 */}
      {showFilterPicker && filterPickerTargetElement && (
        <FilterPicker
          position={filterPickerPosition}
          currentFilter={(elements.find(el => el.id === filterPickerTargetElement && el.type === 'image') as ImageElement)?.filter || 'none'}
          onFilterChange={handleFilterChange}
          onClose={handleFilterPickerClose}
        />
      )}

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