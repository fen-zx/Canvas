import React from 'react';

interface CanvasStatusProps {
  scale: number;
  selectedElementCount: number;
  elementCount: number;
}

const CanvasStatus: React.FC<CanvasStatusProps> = ({ 
  scale, 
  selectedElementCount, 
  elementCount 
}) => {
  // 格式化缩放比例为百分比
  const formattedScale = Math.round(scale * 100);
  
  return (
    <div className="canvas-status">
      <div className="status-item">
        <span className="status-label">缩放: </span>
        <span className="status-value">{formattedScale}%</span>
      </div>
      <div className="status-item">
        <span className="status-label">元素: </span>
        <span className="status-value">{selectedElementCount}/{elementCount}</span>
      </div>
    </div>
  );
};

export default CanvasStatus;