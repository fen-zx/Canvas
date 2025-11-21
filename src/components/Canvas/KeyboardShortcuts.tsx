import React, { useState } from 'react';

interface KeyboardShortcutsProps {
  // 可以添加属性来控制显示/隐藏或其他行为
}

const KeyboardShortcuts: React.FC<KeyboardShortcutsProps> = () => {
  const [isVisible, setIsVisible] = useState(false);

  const toggleVisibility = () => {
    setIsVisible(!isVisible);
  };

  const shortcuts = [
    { keys: 'Delete', description: '删除选中元素' },
    { keys: 'Esc', description: '取消选择' },
    { keys: 'Ctrl + Z', description: '撤销' },
    { keys: 'Ctrl + Y', description: '重做' },
    { keys: 'Ctrl + C', description: '复制' },
    { keys: 'Ctrl + V', description: '粘贴' },
    { keys: 'Alt + 滚轮', description: '缩放画布' },
    { keys: '空格 + 拖拽', description: '移动画布' },
    { keys: '双击文本', description: '编辑文本' },
  ];

  return (
    <div className="keyboard-shortcuts-container">
      <button 
        className="shortcuts-toggle"
        onClick={toggleVisibility}
        title="显示键盘快捷键"
      >
        <span className="shortcuts-icon">⌨️</span>
        <span className="shortcuts-text">快捷键</span>
      </button>
      
      {isVisible && (
        <div className="shortcuts-overlay" onClick={toggleVisibility}>
          <div className="shortcuts-panel" onClick={(e) => e.stopPropagation()}>
            <div className="shortcuts-header">
              <span className="shortcuts-title">键盘快捷键</span>
              <button 
                className="shortcuts-close"
                onClick={toggleVisibility}
              >
                ×
              </button>
            </div>
            <div className="shortcuts-content">
              {shortcuts.map((shortcut, index) => (
                <div key={index} className="shortcut-item">
                  <div className="shortcut-keys">{shortcut.keys}</div>
                  <div className="shortcut-description">{shortcut.description}</div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default KeyboardShortcuts;