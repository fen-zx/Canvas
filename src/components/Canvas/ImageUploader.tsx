import React, { useRef, useState } from 'react';

interface ImageUploaderProps {
  onImageSelected: (file: File) => void;
}

const ImageUploader: React.FC<ImageUploaderProps> = ({ onImageSelected }) => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isDragging, setIsDragging] = useState(false);
  
  // 处理文件选择
  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      if (file.type.startsWith('image/')) {
        onImageSelected(file);
      }
      // 重置input，允许选择相同的文件
      e.target.value = '';
    }
  };
  
  // 处理点击上传按钮
  const handleUploadClick = () => {
    if (fileInputRef.current) {
      fileInputRef.current.click();
    }
  };
  
  // 拖放相关事件处理
  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };
  
  const handleDragLeave = () => {
    setIsDragging(false);
  };
  
  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      const file = e.dataTransfer.files[0];
      if (file.type.startsWith('image/')) {
        onImageSelected(file);
      }
    }
  };
  
  return (
    <div className="image-uploader"
      style={{
        position: 'fixed',
        top: '20px',
        right: '20px',
        zIndex: 1000
      }}
    >
      <input
        type="file"
        ref={fileInputRef}
        onChange={handleFileSelect}
        accept="image/*"
        style={{ display: 'none' }}
      />
      <button
        className="upload-button"
        onClick={handleUploadClick}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        style={{
          padding: '10px 20px',
          backgroundColor: isDragging ? '#e3f2fd' : '#f5f5f5',
          border: `2px dashed ${isDragging ? '#2196F3' : '#ccc'}`,
          borderRadius: '4px',
          cursor: 'pointer',
          transition: 'all 0.2s ease',
          display: 'flex',
          alignItems: 'center',
          gap: '8px',
          fontSize: '14px',
          fontWeight: 'bold'
        }}
      >
        📁
        <span>上传图片</span>
      </button>
      
      {isDragging && (
        <div className="drop-indicator"
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: 'rgba(33, 150, 243, 0.1)',
            border: '3px dashed #2196F3',
            zIndex: 999,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: '24px',
            fontWeight: 'bold',
            color: '#2196F3'
          }}
        >
          释放图片到这里
        </div>
      )}
    </div>
  );
};

export default ImageUploader;