import React, { useState, useEffect, useRef, useCallback } from 'react';
import type { TextElement } from './types';

interface RichTextEditorProps {
  element: TextElement;
  isEditing: boolean;
  onUpdate: (updatedElement: Partial<TextElement>) => void;
  onFinishEditing: () => void;
}

const RichTextEditor: React.FC<RichTextEditorProps> = ({
  element,
  isEditing,
  onUpdate,
  onFinishEditing
}) => {
  // 本地状态管理
  const [localContent, setLocalContent] = useState(element.content);
  const [localFontSize, setLocalFontSize] = useState(element.fontSize);
  const [localFontFamily, setLocalFontFamily] = useState(element.fontFamily);
  const [localColor, setLocalColor] = useState(element.color);
  const [localFontWeight, setLocalFontWeight] = useState(element.fontWeight);
  const [localFontStyle, setLocalFontStyle] = useState(element.fontStyle);
  const [localTextAlign, setLocalTextAlign] = useState(element.textAlign);
  const [isUnderlined, setIsUnderlined] = useState(element.textDecoration?.includes('underline') || false);
  
  // 历史记录状态（用于撤销/重做）
  const [history, setHistory] = useState<Partial<TextElement>[]>([]);
  const [historyIndex, setHistoryIndex] = useState(-1);
  const historyMaxLength = 50; // 最大历史记录条数
  
  // 文本区域引用
  const textAreaRef = useRef<HTMLTextAreaElement>(null);
  const isComposingRef = useRef(false); // 用于IME输入处理

  // 当元素属性变化时更新本地状态
  useEffect(() => {
    setLocalContent(element.content);
    setLocalFontSize(element.fontSize);
    setLocalFontFamily(element.fontFamily);
    setLocalColor(element.color);
    setLocalFontWeight(element.fontWeight);
    setLocalFontStyle(element.fontStyle);
    setLocalTextAlign(element.textAlign);
    setIsUnderlined(element.textDecoration?.includes('underline') || false);
  }, [element]);

  // 当进入编辑模式时，聚焦到文本区域
  useEffect(() => {
    if (isEditing && textAreaRef.current) {
      textAreaRef.current.focus();
    }
  }, [isEditing]);

  // 保存当前状态到历史记录
  const saveToHistory = useCallback((changes: Partial<TextElement>) => {
    setHistory(prev => {
      const newHistory = prev.slice(0, historyIndex + 1);
      newHistory.push({ ...element, ...changes });
      return newHistory.slice(-historyMaxLength); // 限制历史记录长度
    });
    setHistoryIndex(prevIndex => prevIndex + 1);
  }, [historyIndex, element]);
  
  // 撤销操作
  const handleUndo = useCallback(() => {
    if (historyIndex > 0) {
      const previousState = history[historyIndex - 1];
      setHistoryIndex(prevIndex => prevIndex - 1);
      
      // 应用历史状态
      if (previousState.content !== undefined) {
        setLocalContent(previousState.content);
        onUpdate({ content: previousState.content });
      }
      if (previousState.fontSize !== undefined) {
        setLocalFontSize(previousState.fontSize);
        onUpdate({ fontSize: previousState.fontSize });
      }
      // 更新其他属性...
    }
  }, [history, historyIndex, onUpdate]);
  
  // 重做操作
  const handleRedo = useCallback(() => {
    if (historyIndex < history.length - 1) {
      const nextState = history[historyIndex + 1];
      setHistoryIndex(prevIndex => prevIndex + 1);
      
      // 应用历史状态
      if (nextState.content !== undefined) {
        setLocalContent(nextState.content);
        onUpdate({ content: nextState.content });
      }
      if (nextState.fontSize !== undefined) {
        setLocalFontSize(nextState.fontSize);
        onUpdate({ fontSize: nextState.fontSize });
      }
      // 更新其他属性...
    }
  }, [history, historyIndex, onUpdate]);
  
  // 处理内容变化
  const handleContentChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    if (isComposingRef.current) return;
    
    const newContent = e.target.value;
    const changes: Partial<TextElement> = { content: newContent };
    
    setLocalContent(newContent);
    saveToHistory(changes);
    onUpdate(changes);
    
    // 自动调整文本框高度以适应内容
    if (textAreaRef.current) {
      textAreaRef.current.style.height = 'auto';
      textAreaRef.current.style.height = textAreaRef.current.scrollHeight + 'px';
      
      // 更新元素高度
      const heightChanges = { height: textAreaRef.current.scrollHeight };
      onUpdate(heightChanges);
    }
  };
  
  // 处理IME输入
  const handleCompositionStart = () => {
    isComposingRef.current = true;
  };
  
  const handleCompositionEnd = (e: React.CompositionEvent) => {
    isComposingRef.current = false;
    // 当IME输入完成时触发内容变化处理
    const target = e.target as HTMLTextAreaElement;
    handleContentChange({ target } as React.ChangeEvent<HTMLTextAreaElement>);
  };

  // 处理样式变化
  const handleStyleChange = (property: keyof TextElement, value: any) => {
    const changes = { [property]: value };
    saveToHistory(changes);
    onUpdate(changes);
  };

  // 处理键盘事件
  const handleKeyDown = (e: React.KeyboardEvent) => {
    // 按Enter不创建新行，而是完成编辑
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      onFinishEditing();
    }
    
    // 按Esc完成编辑
    if (e.key === 'Escape') {
      onFinishEditing();
    }
    
    // 支持快捷键操作
    if (e.ctrlKey || e.metaKey) {
      switch (e.key.toLowerCase()) {
        case 'z':
          e.preventDefault();
          if (e.shiftKey) {
            handleRedo();
          } else {
            handleUndo();
          }
          break;
        case 'b':
          e.preventDefault();
          handleStyleToggle('bold');
          break;
        case 'i':
          e.preventDefault();
          handleStyleToggle('italic');
          break;
        case 'u':
          e.preventDefault();
          handleStyleToggle('underline');
          break;
        case 'c':
          // 允许复制
          break;
        case 'v':
          // 允许粘贴，但稍后处理
          break;
        default:
          e.preventDefault(); // 阻止其他默认的Ctrl组合键行为
          break;
      }
    }
  };
  
  // 处理粘贴事件，移除富文本格式
  const handlePaste = (e: React.ClipboardEvent) => {
    e.preventDefault();
    
    // 获取纯文本
    const text = e.clipboardData.getData('text/plain');
    
    // 在光标位置插入文本
    if (textAreaRef.current) {
      const start = textAreaRef.current.selectionStart;
      const end = textAreaRef.current.selectionEnd;
      const newValue = localContent.slice(0, start) + text + localContent.slice(end);
      
      setLocalContent(newValue);
      const changes = { content: newValue };
      saveToHistory(changes);
      onUpdate(changes);
      
      // 更新光标位置
      setTimeout(() => {
        if (textAreaRef.current) {
          textAreaRef.current.selectionStart = textAreaRef.current.selectionEnd = start + text.length;
          
          // 重新计算高度
          textAreaRef.current.style.height = 'auto';
          textAreaRef.current.style.height = textAreaRef.current.scrollHeight + 'px';
          onUpdate({ height: textAreaRef.current.scrollHeight });
        }
      }, 0);
    }
  };

  // 富文本样式应用
  const handleStyleToggle = (styleType: 'bold' | 'italic' | 'underline') => {
    if (styleType === 'bold') {
      const newValue = localFontWeight === 'bold' ? 'normal' : 'bold';
      setLocalFontWeight(newValue);
      handleStyleChange('fontWeight', newValue);
    } else if (styleType === 'italic') {
      const newValue = localFontStyle === 'italic' ? 'normal' : 'italic';
      setLocalFontStyle(newValue);
      handleStyleChange('fontStyle', newValue);
    } else if (styleType === 'underline') {
      // 切换下划线状态并保存到元素属性
      const newValue = !isUnderlined;
      setIsUnderlined(newValue);
      
      // 获取当前textDecoration属性
      let textDecoration = element.textDecoration || '';
      
      if (newValue) {
        // 添加下划线
        if (!textDecoration.includes('underline')) {
          textDecoration = textDecoration ? `${textDecoration} underline` : 'underline';
        }
      } else {
        // 移除下划线
        textDecoration = textDecoration.replace('underline', '').trim();
      }
      
      handleStyleChange('textDecoration', textDecoration);
    }
  };

  // 富文本工具栏
  const renderToolbar = () => (
    <div className="rich-text-toolbar" style={{
      backgroundColor: '#f5f5f5',
      border: '1px solid #ddd',
      borderRadius: '4px 4px 0 0',
      padding: '5px',
      display: 'flex',
      alignItems: 'center',
      gap: '3px',
      flexWrap: 'wrap',
      fontSize: '12px'
    }}>
      {/* 撤销/重做按钮 */}
      <button 
        className={`toolbar-btn ${historyIndex <= 0 ? 'disabled' : ''}`}
        onClick={handleUndo}
        title="撤销 (Ctrl+Z)"
        disabled={historyIndex <= 0}
        style={{
          padding: '4px 8px',
          border: '1px solid #ccc',
          borderRadius: '3px',
          backgroundColor: historyIndex <= 0 ? '#eee' : 'white',
          cursor: historyIndex <= 0 ? 'not-allowed' : 'pointer'
        }}
      >
        ↶
      </button>
      <button 
        className={`toolbar-btn ${historyIndex >= history.length - 1 ? 'disabled' : ''}`}
        onClick={handleRedo}
        title="重做 (Ctrl+Shift+Z)"
        disabled={historyIndex >= history.length - 1}
        style={{
          padding: '4px 8px',
          border: '1px solid #ccc',
          borderRadius: '3px',
          backgroundColor: historyIndex >= history.length - 1 ? '#eee' : 'white',
          cursor: historyIndex >= history.length - 1 ? 'not-allowed' : 'pointer'
        }}
      >
        ↷
      </button>
      
      <div style={{ width: '1px', height: '16px', backgroundColor: '#ddd', margin: '0 4px' }}></div>
      
      {/* 文本样式按钮 */}
      <button 
        className={`toolbar-btn ${localFontWeight === 'bold' ? 'active' : ''}`}
        onClick={() => handleStyleToggle('bold')}
        title="粗体 (Ctrl+B)"
        style={{
          padding: '4px 8px',
          border: '1px solid #ccc',
          borderRadius: '3px',
          backgroundColor: localFontWeight === 'bold' ? '#e3f2fd' : 'white',
          fontWeight: 'bold',
          cursor: 'pointer'
        }}
      >
        B
      </button>
      <button 
        className={`toolbar-btn ${localFontStyle === 'italic' ? 'active' : ''}`}
        onClick={() => handleStyleToggle('italic')}
        title="斜体 (Ctrl+I)"
        style={{
          padding: '4px 8px',
          border: '1px solid #ccc',
          borderRadius: '3px',
          backgroundColor: localFontStyle === 'italic' ? '#e3f2fd' : 'white',
          fontStyle: 'italic',
          cursor: 'pointer'
        }}
      >
        I
      </button>
      <button 
        className={`toolbar-btn ${isUnderlined ? 'active' : ''}`}
        onClick={() => handleStyleToggle('underline')}
        title="下划线 (Ctrl+U)"
        style={{
          padding: '4px 8px',
          border: '1px solid #ccc',
          borderRadius: '3px',
          backgroundColor: isUnderlined ? '#e3f2fd' : 'white',
          textDecoration: 'underline',
          cursor: 'pointer'
        }}
      >
        U
      </button>
      
      <div style={{ width: '1px', height: '16px', backgroundColor: '#ddd', margin: '0 4px' }}></div>
      
      {/* 字体选择器 */}
      <select 
        className="font-family-select"
        value={localFontFamily}
        onChange={(e) => {
          setLocalFontFamily(e.target.value);
          handleStyleChange('fontFamily', e.target.value);
        }}
        style={{
          padding: '4px',
          border: '1px solid #ccc',
          borderRadius: '3px',
          fontSize: '11px'
        }}
      >
        <option value="Arial, sans-serif">Arial</option>
        <option value="'Times New Roman', serif">Times New Roman</option>
        <option value="'Courier New', monospace">Courier New</option>
        <option value="Georgia, serif">Georgia</option>
        <option value="Verdana, sans-serif">Verdana</option>
        <option value="'Microsoft YaHei', sans-serif">微软雅黑</option>
        <option value="'SimSun', serif">宋体</option>
        <option value="'SimHei', sans-serif">黑体</option>
      </select>
      
      {/* 字号选择器 */}
      <select 
        className="font-size-select"
        value={localFontSize}
        onChange={(e) => {
          const size = parseInt(e.target.value);
          setLocalFontSize(size);
          handleStyleChange('fontSize', size);
        }}
        style={{
          padding: '4px',
          border: '1px solid #ccc',
          borderRadius: '3px',
          fontSize: '11px',
          width: '70px'
        }}
      >
        {[8, 10, 12, 14, 16, 18, 20, 24, 28, 32, 36, 40, 48, 56, 64].map(size => (
          <option key={size} value={size}>{size}px</option>
        ))}
      </select>
      
      {/* 颜色选择器 */}
      <input 
        type="color" 
        className="color-picker"
        value={localColor} 
        onChange={(e) => {
          setLocalColor(e.target.value);
          handleStyleChange('color', e.target.value);
        }}
        title="文本颜色"
        style={{
          width: '25px',
          height: '25px',
          padding: '0',
          border: '1px solid #ccc',
          borderRadius: '3px',
          cursor: 'pointer'
        }}
      />
      
      <div style={{ width: '1px', height: '16px', backgroundColor: '#ddd', margin: '0 4px' }}></div>
      
      {/* 文本对齐按钮 */}
      <div className="text-align-buttons" style={{ display: 'flex' }}>
        <button 
          className={`toolbar-btn ${localTextAlign === 'left' ? 'active' : ''}`}
          onClick={() => {
            setLocalTextAlign('left');
            handleStyleChange('textAlign', 'left');
          }}
          title="左对齐"
          style={{
            padding: '4px 8px',
            border: '1px solid #ccc',
            borderRadius: '3px 0 0 3px',
            backgroundColor: localTextAlign === 'left' ? '#e3f2fd' : 'white',
            cursor: 'pointer',
            borderRight: 'none'
          }}
        >
          ⬅
        </button>
        <button 
          className={`toolbar-btn ${localTextAlign === 'center' ? 'active' : ''}`}
          onClick={() => {
            setLocalTextAlign('center');
            handleStyleChange('textAlign', 'center');
          }}
          title="居中对齐"
          style={{
            padding: '4px 8px',
            border: '1px solid #ccc',
            backgroundColor: localTextAlign === 'center' ? '#e3f2fd' : 'white',
            cursor: 'pointer',
            borderRight: 'none',
            borderLeft: 'none'
          }}
        >
          ⬌
        </button>
        <button 
          className={`toolbar-btn ${localTextAlign === 'right' ? 'active' : ''}`}
          onClick={() => {
            setLocalTextAlign('right');
            handleStyleChange('textAlign', 'right');
          }}
          title="右对齐"
          style={{
            padding: '4px 8px',
            border: '1px solid #ccc',
            borderRadius: '0 3px 3px 0',
            backgroundColor: localTextAlign === 'right' ? '#e3f2fd' : 'white',
            cursor: 'pointer',
            borderLeft: 'none'
          }}
        >
          ➡
        </button>
      </div>
    </div>
  );

  // 文本编辑区域
  if (isEditing) {
    return (
      <div className="rich-text-editor-wrapper" style={{
        position: 'relative',
        width: '100%',
        minHeight: '100%',
        zIndex: 10
      }}>
        {renderToolbar()}
        <textarea
          ref={textAreaRef}
          value={localContent}
          onChange={handleContentChange}
          onBlur={onFinishEditing}
          onKeyDown={handleKeyDown}
          onPaste={handlePaste}
          onCompositionStart={handleCompositionStart}
          onCompositionEnd={handleCompositionEnd}
          placeholder="点击输入文本..."
          style={{
            fontFamily: localFontFamily,
            fontSize: `${localFontSize}px`,
            color: localColor,
            fontWeight: localFontWeight,
            fontStyle: localFontStyle,
            textAlign: localTextAlign,
            textDecoration: isUnderlined ? 'underline' : 'none',
            width: `${element.width}px`,
            height: 'auto',
            minHeight: `${element.height}px`,
            resize: 'none',
            border: '2px solid #2196F3',
            borderRadius: '0 0 4px 4px',
            padding: '8px',
            outline: 'none',
            backgroundColor: 'white',
            position: 'absolute',
            left: 0,
            top: '30px', // 为工具栏留出空间
            boxSizing: 'border-box'
          }}
        />
      </div>
    );
  }

  // 只读模式下的文本展示
  return (
    <div 
      className="rich-text-display"
      style={{
        fontFamily: localFontFamily,
        fontSize: `${localFontSize}px`,
        color: localColor,
        fontWeight: localFontWeight,
        fontStyle: localFontStyle,
        textAlign: localTextAlign,
        textDecoration: element.textDecoration || (isUnderlined ? 'underline' : 'none'),
        width: `${element.width}px`,
        minHeight: `${element.height}px`,
        wordBreak: 'break-word',
        padding: '4px',
        whiteSpace: 'pre-wrap', // 保留换行符
        lineHeight: '1.4'
      }}
      title={localContent || '双击编辑文本'}
    >
      {localContent || <span style={{ color: '#ccc', fontStyle: 'italic' }}>双击编辑文本</span>}
    </div>
  );
};

export default RichTextEditor;