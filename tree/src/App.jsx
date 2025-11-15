import React, { useMemo } from "react";
import Mindmap from "./Mindmap";
import data from "./mock-data.json";
import "./app.css";

export default function App() {
  return (
    <div className="app-container">
      <div className="mindmap-wrapper">
        <Mindmap data={data} />
      </div>
    </div>
  );
}