// src/App.jsx
import React, { useState, useEffect } from "react";
import MindmapCanvas from "./MindmapCanvas";
import "./App.css";
import data from "./mock-map.json";

export default function App() {
  // root 节点从 json 加载
  const [root, setRoot] = useState(null);

  useEffect(() => {
    setRoot(data.root);
  }, []);

  if (!root) return <div>Loading…</div>;

  return (
    <div className="app-container">
      {/* 左侧：思维导图 */}
      <div className="mindmap-wrapper">
        <MindmapCanvas root={root} />
      </div>

      {/* 右侧：插件窗口（保持原样，可放 LLM 或课程推荐） */}
      <div className="plugin-window">
        <div className="plugin-card">
          <h2>Plugin Window</h2>
          <p>这里预留给你的插件 / LLM / 课程建议模块。</p>
        </div>
      </div>
    </div>
  );
}