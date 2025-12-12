import React, { useState } from 'react';
import type { Pattern, PatternSidebarProps } from '../types';
import './PatternSidebar.css';

// 简化的图案列表 - 包含矩形、圆形、五角星、圆角矩形和三角形
const patterns: Pattern[] = [
  { id: 'rect', name: '矩形', type: 'rect', fill: 'transparent', stroke: 'black', strokeWidth: 2, width: 100, height: 100 },
  { id: 'circle', name: '圆形', type: 'circle', fill: 'transparent', stroke: 'black', strokeWidth: 2, width: 100, height: 100 },
  { id: 'star', name: '五角星', type: 'star', fill: 'transparent', stroke: 'black', strokeWidth: 2, width: 100, height: 100 },
  { id: 'rounded-rect', name: '圆角矩形', type: 'rounded-rect', fill: 'transparent', stroke: 'black', strokeWidth: 2, width: 100, height: 100 },
  { id: 'triangle', name: '三角形', type: 'triangle', fill: 'transparent', stroke: 'black', strokeWidth: 2, width: 100, height: 100 },
];

const PatternSidebar: React.FC<PatternSidebarProps> = ({ onSelectPattern }) => {
  // 添加选中状态管理
  const [selectedPatternId, setSelectedPatternId] = useState<string | null>(null);
  const renderPatternPreview = (pattern: Pattern) => {
    switch (pattern.type) {
      case 'rect':
        return (
          <rect
            width="100%"
            height="100%"
            fill={pattern.fill}
            stroke={pattern.stroke}
            strokeWidth={pattern.strokeWidth}
          />
        );
      case 'circle':
        return (
          <circle
            cx="50%"
            cy="50%"
            r="45%"
            fill={pattern.fill}
            stroke={pattern.stroke}
            strokeWidth={pattern.strokeWidth}
          />
        );
      case 'star':
        // 使用SVG多边形创建五角星
        return (
          <polygon
            points="50,10 61,39 92,39 68,58 79,87 50,70 21,87 32,58 8,39 39,39"
            fill={pattern.fill}
            stroke={pattern.stroke}
            strokeWidth={pattern.strokeWidth}
          />
        );
      case 'rounded-rect':
        return (
          <rect
            width="100%"
            height="100%"
            rx="15%"
            ry="15%"
            fill={pattern.fill}
            stroke={pattern.stroke}
            strokeWidth={pattern.strokeWidth}
          />
        );
      case 'triangle':
        // 使用SVG多边形创建三角形
        return (
          <polygon
            points="50,10 10,90 90,90"
            fill={pattern.fill}
            stroke={pattern.stroke}
            strokeWidth={pattern.strokeWidth}
          />
        );
      default:
        return null;
    }
  };

  return (
    <div className="pattern-sidebar">
      <h3>选择图形</h3>
      <div className="pattern-list-scrollable">
        {patterns.map(pattern => (
          <div
            key={pattern.id}
            className={`pattern-item ${selectedPatternId === pattern.id ? 'pattern-item-selected' : ''}`}
            onClick={() => {
              setSelectedPatternId(pattern.id);
              onSelectPattern(pattern);
            }}
            title={pattern.name}
          >
            <div className="pattern-preview">
              <svg width="80" height="80" viewBox="0 0 100 100">
                {renderPatternPreview(pattern)}
              </svg>
            </div>
            <span className="pattern-name">{pattern.name}</span>
          </div>
        ))}
      </div>
    </div>
  );
};

export default PatternSidebar;