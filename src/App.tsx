// import React from 'react';
import Canvas from './pages/Canvas';
import './App.css';

function App() {
  return (
    <div className="app">
      <header className="app-header">
        <h1 className="app-title">Canvas 绘图工具</h1>
      </header>
      <main className="app-main">
        <Canvas />
      </main>
    </div>
  );
}

export default App;
