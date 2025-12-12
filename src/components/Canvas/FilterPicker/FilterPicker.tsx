//滤镜选择组件
import React, { useState, useRef, useEffect } from 'react';
import './FilterPicker.css';

interface FilterPickerProps {
  position: { x: number; y: number };
  currentFilter: string;
  onFilterChange: (filter: string) => void;
  onClose: () => void;
}

// 预设的滤镜选项
const filterOptions = [
  { name: '无滤镜', value: 'none' },
  { name: '黑白', value: 'grayscale(100%)' },
  { name: '复古', value: 'sepia(100%)' },
  { name: '暖色调', value: 'sepia(50%) hue-rotate(-10deg) brightness(110%) contrast(110%)' },
  { name: '冷色调', value: 'blur(1px) sepia(20%) hue-rotate(180deg) brightness(110%) contrast(110%)' },
  { name: '明亮', value: 'brightness(130%)' },
  { name: '暗黑', value: 'brightness(70%)' },
  { name: '锐化', value: 'contrast(130%) brightness(110%)' },
  { name: '模糊', value: 'blur(3px)' },
  { name: '反转', value: 'invert(100%)' },
  { name: '棕褐色', value: 'sepia(70%) hue-rotate(20deg)' },
  { name: '饱和度', value: 'saturate(200%)' },
  { name: '低饱和度', value: 'saturate(50%)' },
];

const FilterPicker: React.FC<FilterPickerProps> = ({
  position,
  currentFilter,
  onFilterChange,
  onClose
}) => {
  // 拖拽相关状态
  const [isDragging, setIsDragging] = useState(false);
  const [currentPosition, setCurrentPosition] = useState(position);
  const dragStartRef = useRef({ x: 0, y: 0 });
  const pickerRef = useRef<HTMLDivElement>(null);

  // 当position属性变化时更新当前位置
  useEffect(() => {
    setCurrentPosition(position);
  }, [position]);

  // 处理拖拽开始
  const handleMouseDown = (e: React.MouseEvent) => {
    // 只有点击头部区域才允许拖拽
    if ((e.target as HTMLElement).closest('.filter-picker-header')) {
      setIsDragging(true);
      dragStartRef.current = {
        x: e.clientX - currentPosition.x,
        y: e.clientY - currentPosition.y
      };
      e.preventDefault();
    }
  };

  // 处理拖拽移动
  const handleMouseMove = (e: MouseEvent) => {
    if (isDragging) {
      const newX = e.clientX - dragStartRef.current.x;
      const newY = e.clientY - dragStartRef.current.y;
      setCurrentPosition({ x: newX, y: newY });
    }
  };

  // 处理拖拽结束
  const handleMouseUp = () => {
    setIsDragging(false);
  };

  // 添加拖拽事件监听
  useEffect(() => {
    if (isDragging) {
      document.addEventListener('mousemove', handleMouseMove);
      document.addEventListener('mouseup', handleMouseUp);
      return () => {
        document.removeEventListener('mousemove', handleMouseMove);
        document.removeEventListener('mouseup', handleMouseUp);
      };
    }
  }, [isDragging]);

  // 处理滤镜选择
  const handleFilterClick = (filter: string) => {
    onFilterChange(filter);
  };

  // 处理关闭按钮点击
  const handleCloseButtonClick = () => {
    onClose();
  };

  // 处理点击外部关闭
  const handleClickOutside = (event: MouseEvent) => {
    const target = event.target as HTMLElement;
    if (!target.closest('.filter-picker')) {
      handleCloseButtonClick();
    }
  };

  // 添加点击外部关闭的事件监听
  React.useEffect(() => {
    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  return (
    <div
      ref={pickerRef}
      className={`filter-picker ${isDragging ? 'dragging' : ''}`}
      style={{
        position: 'absolute',
        left: `${currentPosition.x}px`,
        top: `${currentPosition.y}px`,
        zIndex: 1000,
        cursor: isDragging ? 'grabbing' : 'default'
      }}
      onMouseDown={handleMouseDown}
    >
      {/* 标题栏与关闭按钮 */}
      <div className="filter-picker-header">
        <div className="filter-picker-title">滤镜选择</div>
        <button
          className="filter-picker-close-btn"
          onClick={handleCloseButtonClick}
          title="关闭"
        >
          ×
        </button>
      </div>

      {/* 内容区域 */}
      <div className="filter-picker-content">
        {/* 滤镜选择区域 */}
        <div className="filter-palette">
          {filterOptions.map((filter) => (
            <div
              key={filter.value}
              className={`filter-option ${currentFilter === filter.value ? 'selected' : ''}`}
              onClick={() => handleFilterClick(filter.value)}
              title={filter.name}
            >
              <div className="filter-preview">
                <div className="filter-icon" style={{ filter: filter.value }}>
                  🖼️
                </div>
              </div>
              <div className="filter-name">{filter.name}</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default FilterPicker;