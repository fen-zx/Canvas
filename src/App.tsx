// import React from 'react';
import Canvas from './components/Canvas/Canvas';
import './App.css';

function App() {
  return (
    <div className="app">
      <header className="app-header">
        <h1 className="app-title">Canvas 绘图工具</h1>
        <p className="app-subtitle">支持图形、图片和富文本编辑的交互式画布</p>
      </header>
      <main className="app-main">
        <Canvas />
      </main>
      <footer className="app-footer">
        <p>&copy; 2024 Canvas 绘图工具 - 无限创意，尽在画布</p>
      </footer>
    </div>
  );
}

export default App;
