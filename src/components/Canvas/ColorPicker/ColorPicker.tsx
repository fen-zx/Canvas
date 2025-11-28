import React, { useState } from 'react';
import './ColorPicker.css';

interface ColorPickerProps {
  position: { x: number; y: number };
  currentFill: string;
  currentStroke: string;
  currentStrokeWidth: number;
  onFillChange: (color: string) => void;
  onStrokeChange: (color: string) => void;
  onStrokeWidthChange: (width: number) => void;
  onClose: () => void;
}

// 预设的颜色选项
const colorOptions = [
  '#000000', '#ffffff', '#f44336', '#e91e63', '#9c27b0', '#673ab7',
  '#3f51b5', '#2196f3', '#03a9f4', '#00bcd4', '#009688',
  '#4caf50', '#8bc34a', '#cddc39', '#ffeb3b', '#ffc107',
  '#ff9800', '#ff5722', '#795548', '#9e9e9e', '#607d8b',
  'transparent'
];

// 预设的边框宽度选项
const strokeWidthOptions = [1, 2, 3, 4, 5, 6, 8, 10];

const ColorPicker: React.FC<ColorPickerProps> = ({
  position,
  currentFill,
  currentStroke,
  currentStrokeWidth,
  onFillChange,
  onStrokeChange,
  onStrokeWidthChange,
  onClose
}) => {
  // 当前激活的标签页
  const [activeTab, setActiveTab] = useState<'fill' | 'stroke' | 'strokeWidth'>('fill');

  // 处理颜色选择
  const handleColorClick = (color: string) => {
    if (activeTab === 'fill') {
      onFillChange(color);
    } else if (activeTab === 'stroke') {
      onStrokeChange(color);
    }
  };

  // 处理自定义颜色输入
  const handleCustomColorChange = (color: string) => {
    if (activeTab === 'fill') {
      onFillChange(color);
    } else if (activeTab === 'stroke') {
      onStrokeChange(color);
    }
  };

  // 处理边框宽度选择
  const handleStrokeWidthSelect = (width: number) => {
    onStrokeWidthChange(width);
  };

  // 处理关闭按钮点击
  const handleCloseButtonClick = () => {
    onClose();
  };

  // 处理点击外部关闭
  const handleClickOutside = (event: MouseEvent) => {
    const target = event.target as HTMLElement;
    if (!target.closest('.color-picker')) {
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
      className="color-picker"
      style={{
        position: 'absolute',
        left: `${position.x}px`,
        top: `${position.y}px`,
        zIndex: 1000
      }}
    >
      {/* 标题栏与关闭按钮 */}
      <div className="color-picker-header">
        <div className="color-picker-title">样式设置</div>
        <button
          className="color-picker-close-btn"
          onClick={handleCloseButtonClick}
          title="关闭"
        >
          ×
        </button>
      </div>

      {/* 标签页切换 */}
      <div className="color-picker-tabs">
        <button
          className={`color-picker-tab ${activeTab === 'fill' ? 'active' : ''}`}
          onClick={() => setActiveTab('fill')}
        >
          背景色
        </button>
        <button
          className={`color-picker-tab ${activeTab === 'stroke' ? 'active' : ''}`}
          onClick={() => setActiveTab('stroke')}
        >
          边框色
        </button>
        <button
          className={`color-picker-tab ${activeTab === 'strokeWidth' ? 'active' : ''}`}
          onClick={() => setActiveTab('strokeWidth')}
        >
          边框宽度
        </button>
      </div>

      {/* 内容区域 */}
      <div className="color-picker-content">
        {/* 颜色选择区域 */}
        {(activeTab === 'fill' || activeTab === 'stroke') && (
          <>
            <div className="color-palette">
              {colorOptions.map((color) => (
                <div
                  key={color}
                  className={`color-option ${color === 'transparent' ? 'transparent-color' : ''} ${(activeTab === 'fill' && color === currentFill) ||
                      (activeTab === 'stroke' && color === currentStroke) ? 'selected' : ''
                    }`}
                  style={{
                    backgroundColor: color === 'transparent' ? 'white' : color,
                    border: color === 'transparent' ? '1px dashed #ccc' : '1px solid rgba(0,0,0,0.1)',
                    backgroundImage: color === 'transparent' ? 'repeating-conic-gradient(#ccc 0% 25%, transparent 0% 50%) 50% / 8px 8px' : 'none'
                  }}
                  onClick={() => handleColorClick(color)}
                  title={color === 'transparent' ? '透明' : color}
                >
                  {color === 'transparent' && (
                    <div className="transparent-indicator">×</div>
                  )}
                </div>
              ))}
            </div>
            <div className="color-picker-footer">
              <input
                type="color"
                className="custom-color-input"
                value={activeTab === 'fill' ? (currentFill === 'transparent' ? '#000000' : currentFill) :
                  (currentStroke === 'transparent' ? '#000000' : currentStroke)}
                onChange={(e) => handleCustomColorChange(e.target.value)}
                title="自定义颜色"
                disabled={activeTab === 'fill' && currentFill === 'transparent'}
              />
            </div>
          </>
        )}

        {/* 边框宽度选择区域 */}
        {activeTab === 'strokeWidth' && (
          <div className="stroke-width-palette">
            {strokeWidthOptions.map((width) => (
              <div
                key={width}
                className={`stroke-width-option ${currentStrokeWidth === width ? 'selected' : ''}`}
                onClick={() => handleStrokeWidthSelect(width)}
                title={`${width}px`}
              >
                <div
                  className="stroke-width-preview"
                  style={{
                    height: `${width * 2}px`,
                    backgroundColor: currentStroke === 'transparent' ? '#000' : currentStroke
                  }}
                ></div>
                <div className="stroke-width-label">{width}px</div>
              </div>
            ))}

            {/* 自定义边框宽度输入 */}
            <div className="stroke-width-custom">
              <input
                type="number"
                min="1"
                max="50"
                value={currentStrokeWidth}
                onChange={(e) => handleStrokeWidthSelect(Number(e.target.value))}
                className="stroke-width-input"
                placeholder="输入宽度"
              />
              <span className="stroke-width-unit">px</span>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default ColorPicker;