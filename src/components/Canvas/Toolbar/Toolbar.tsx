import React from 'react';
import type { ToolButtonProps } from '../types';
import './Toolbar.css';

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
  currentTool: 'select' | 'rect' | 'circle' | 'triangle' | 'image' | 'text' | 'shape';
  onToolChange: (tool: 'select' | 'rect' | 'circle' | 'triangle' | 'image' | 'text' | 'shape') => void;
}

interface Tool {
  id: 'select' | 'shape' | 'image' | 'text';
  icon: string;
  label: string;
}

const Toolbar: React.FC<ToolbarProps> = ({ currentTool, onToolChange }) => {
  const tools: Tool[] = [
    { id: 'select', icon: '☑️', label: '选择' },
    { id: 'shape', icon: '🔷', label: '图形' },
    { id: 'image', icon: '🖼️', label: '图片' },
    { id: 'text', icon: '📝', label: '文本' }
  ];

  return (
    <div className="canvas-toolbar">
      {tools.map(tool => (
        <ToolButton
          key={tool.id}
          icon={tool.icon}
          label={tool.label}
          isActive={currentTool === tool.id}
          onClick={() => onToolChange(tool.id)}
        />
      ))}

      <button
        className="tool-button"
        onClick={() => window.location.reload()}
        title="清空画布"
      >
        🗑️
        <span className="tool-label">清空</span>
      </button>
    </div>
  );
};

export default Toolbar;