import React from 'react';
import './App.css'; // (如果你们有 App.css 的话)
import CourseGraph from './components/CourseGraph'; // <-- 导入图表组件

function App() {
  
  return (
    <div className="App">
      
      {/* 我们可以加一个标题 */}
      <header style={{ padding: '20px', textAlign: 'center' }}>
        <h1>DandyHacks 课程规划器</h1>
      </header>
      
      {/* --- 在这里渲染图表 --- */}
      {/* 我们直接调用 CourseGraph，不传任何多余的 props */}
      <CourseGraph />
      
    </div>
  );
}

export default App;