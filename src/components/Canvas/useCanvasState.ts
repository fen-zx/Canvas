import { useState, useCallback } from 'react';
import type { CanvasElement, CanvasState } from './types';

// 生成唯一ID的函数
const generateId = (): string => {
  return `element-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
};

// 默认的画布状态
const defaultCanvasState: CanvasState = {
  elements: [],
  selectedElementIds: [],
  currentTool: 'select',
  position: { x: 0, y: 0 },
  scale: 1
};

// 自定义Hook：画布状态管理
export const useCanvasState = (initialState = defaultCanvasState) => {
  const [state, setState] = useState<CanvasState>(initialState);

  // 添加一个新的画布元素
  const addElement = useCallback((element: Omit<CanvasElement, 'id' | 'selected' | 'zIndex'>) => {
    setState(prevState => {
      const newElement = {
        ...element,
        id: generateId(),
        selected: false,
        zIndex: prevState.elements.length
      } as CanvasElement;
      
      return {
        ...prevState,
        elements: [...prevState.elements, newElement],
        // 添加新元素时自动选中它
        selectedElementIds: [newElement.id]
      };
    });
  }, []);

  // 删除选中的元素
  const deleteSelectedElements = useCallback(() => {
    setState(prevState => ({
      ...prevState,
      elements: prevState.elements.filter(element => !prevState.selectedElementIds.includes(element.id)),
      selectedElementIds: []
    }));
  }, []);

  // 选择一个元素
  const selectElement = useCallback((elementId: string, multiSelect = false) => {
    setState(prevState => ({
      ...prevState,
      elements: prevState.elements.map(element => ({
        ...element,
        selected: multiSelect ? 
          prevState.selectedElementIds.includes(element.id) || element.id === elementId :
          element.id === elementId
      })),
      selectedElementIds: multiSelect ? 
        prevState.selectedElementIds.includes(elementId) ?
          prevState.selectedElementIds.filter(id => id !== elementId) :
          [...prevState.selectedElementIds, elementId]
        : [elementId]
    }));
  }, []);

  // 清除所有选择
  const clearSelection = useCallback(() => {
    setState(prevState => ({
      ...prevState,
      elements: prevState.elements.map(element => ({ ...element, selected: false })),
      selectedElementIds: []
    }));
  }, []);

  // 更新元素属性
  const updateElement = useCallback((elementId: string, updates: Partial<CanvasElement>) => {
    setState(prevState => ({
      ...prevState,
      elements: prevState.elements.map(element =>
        element.id === elementId ? { ...element, ...updates } as CanvasElement : element
      )
    }));
  }, []);

  // 更新多个选中元素的属性
  const updateSelectedElements = useCallback((updates: Partial<CanvasElement>) => {
    setState(prevState => ({
      ...prevState,
      elements: prevState.elements.map(element =>
        prevState.selectedElementIds.includes(element.id)
          ? { ...element, ...updates } as CanvasElement
          : element
      )
    }));
  }, []);

  // 设置当前工具
  const setCurrentTool = useCallback((tool: CanvasState['currentTool']) => {
    setState(prevState => ({
      ...prevState,
      currentTool: tool
    }));
  }, []);

  // 更新画布位置
  const updateCanvasPosition = useCallback((position: { x: number; y: number }) => {
    setState(prevState => ({
      ...prevState,
      position
    }));
  }, []);

  // 更新画布缩放
  const updateCanvasScale = useCallback((scale: number) => {
    setState(prevState => ({
      ...prevState,
      scale
    }));
  }, []);

  // 获取选中的元素
  const getSelectedElements = useCallback(() => {
    return state.elements.filter(element => state.selectedElementIds.includes(element.id));
  }, [state.elements, state.selectedElementIds]);

  // 移动元素
  const moveElement = useCallback((elementId: string, deltaX: number, deltaY: number) => {
    setState(prevState => {
      const element = prevState.elements.find(el => el.id === elementId);
      if (element) {
        return {
          ...prevState,
          elements: prevState.elements.map(el =>
            el.id === elementId
              ? { ...el, x: el.x + deltaX, y: el.y + deltaY } as CanvasElement
              : el
          )
        };
      }
      return prevState;
    });
  }, []);

  // 移动选中的元素
  const moveSelectedElements = useCallback((deltaX: number, deltaY: number) => {
    setState(prevState => ({
      ...prevState,
      elements: prevState.elements.map(element =>
        prevState.selectedElementIds.includes(element.id)
          ? { ...element, x: element.x + deltaX, y: element.y + deltaY } as CanvasElement
          : element
      )
    }));
  }, []);
  
  // 旋转元素
  const rotateElement = useCallback((elementId: string, deltaRotation: number) => {
    setState(prevState => ({
      ...prevState,
      elements: prevState.elements.map(element =>
        element.id === elementId
          ? { ...element, rotation: (element.rotation + deltaRotation) % 360 } as CanvasElement
          : element
      )
    }));
  }, []);
  
  // 调整元素大小
  const resizeElement = useCallback((elementId: string, deltaWidth: number, deltaHeight: number) => {
    setState(prevState => ({
      ...prevState,
      elements: prevState.elements.map(element =>
        element.id === elementId
          ? { 
              ...element, 
              width: Math.max(10, element.width + deltaWidth), // 最小宽度限制
              height: Math.max(10, element.height + deltaHeight) // 最小高度限制
            } as CanvasElement
          : element
      )
    }));
  }, []);
  
  // 旋转选中的元素
  const rotateSelectedElements = useCallback((deltaRotation: number) => {
    state.selectedElementIds.forEach(id => rotateElement(id, deltaRotation));
  }, [state.selectedElementIds, rotateElement]);
  
  // 调整选中元素的大小
  const resizeSelectedElements = useCallback((deltaWidth: number, deltaHeight: number) => {
    state.selectedElementIds.forEach(id => resizeElement(id, deltaWidth, deltaHeight));
  }, [state.selectedElementIds, resizeElement]);

  return {
      ...state,
      addElement,
      deleteSelectedElements,
      selectElement,
      clearSelection,
      updateElement,
      updateSelectedElements,
      setCurrentTool,
      updateCanvasPosition,
      updateCanvasScale,
      getSelectedElements,
      moveElement,
      moveSelectedElements,
      rotateElement,
      resizeElement,
      rotateSelectedElements,
      resizeSelectedElements
    };
};

export default useCanvasState;