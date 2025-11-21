import React from 'react';
import type { ToolButtonProps } from './types';

const ToolButton: React.FC<ToolButtonProps> = ({ icon, label, isActive, onClick }) => (
  <button
    className={`tool-button ${isActive ? 'active' : ''}`}
    onClick={onClick}
    title={label}
  >
    {icon}
    <span className="tool-label">{label}</span>
  </button>
);

interface ToolbarProps {
  currentTool: string;
  onToolChange: (tool: string) => void;
}

const Toolbar: React.FC<ToolbarProps> = ({ currentTool, onToolChange }) => {
  const tools = [
    { id: 'select', icon: '☑️', label: '选择' },
    { id: 'rect', icon: '⬜', label: '矩形' },
    { id: 'circle', icon: '⭕', label: '圆形' },
    { id: 'triangle', icon: '🔺', label: '三角形' },
    { id: 'image', icon: '🖼️', label: '图片' },
    { id: 'text', icon: '📝', label: '文本' }
  ];

  return (
    <div className="canvas-toolbar">
      <div className="toolbar-section">
        {tools.map(tool => (
          <ToolButton
            key={tool.id}
            icon={tool.icon}
            label={tool.label}
            isActive={currentTool === tool.id}
            onClick={() => onToolChange(tool.id)}
          />
        ))}
      </div>
      
      <div className="toolbar-section">
        <button 
          className="tool-button"
          onClick={() => window.location.reload()}
          title="清空画布"
        >
          🗑️
          <span className="tool-label">清空</span>
        </button>
      </div>
    </div>
  );
};

export default Toolbar;