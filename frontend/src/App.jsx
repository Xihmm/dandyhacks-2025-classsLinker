import { useState } from "react";
import CourseGraph from "./components/CourseGraph";

function CourseDetail({ course }) {
  if (!course) {
    return (
      <div
        style={{
          height: "100%",
          padding: "16px",
          fontSize: "14px",
          color: "#666",
        }}
      >
        <div style={{ marginBottom: "8px", fontWeight: 600 }}>Course Details</div>
        <div>Click a course in the graph to see details here.</div>
      </div>
    );
  }

  const {
    id,
    title,
    department,
    credits,
    prerequisites,
    description,
  } = course;

  return (
    <div
      style={{
        height: "100%",
        padding: "16px",
        fontSize: "14px",
        color: "#333",
        boxSizing: "border-box",
      }}
    >
      <div style={{ marginBottom: "12px" }}>
        <div style={{ fontSize: "18px", fontWeight: 700 }}>
          {id || "-"}
        </div>
        <div style={{ fontSize: "15px", marginTop: "4px", color: "#555" }}>
          {title || ""}
        </div>
      </div>

      <div style={{ marginBottom: "8px" }}>
        <span style={{ fontWeight: 600 }}>Department: </span>
        <span>{department || "-"}</span>
      </div>

      <div style={{ marginBottom: "8px" }}>
        <span style={{ fontWeight: 600 }}>Credits: </span>
        <span>{credits != null ? credits : "-"}</span>
      </div>

      <div style={{ marginBottom: "12px" }}>
        <div style={{ fontWeight: 600, marginBottom: "4px" }}>
          Prerequisites:
        </div>
        <div style={{ whiteSpace: "pre-wrap" }}>
          {Array.isArray(prerequisites) && prerequisites.length > 0
            ? prerequisites.join(", ")
            : "None"}
        </div>
      </div>

      <div>
        <div style={{ fontWeight: 600, marginBottom: "4px" }}>
          Description:
        </div>
        <div style={{ whiteSpace: "pre-wrap", lineHeight: 1.5 }}>
          {description || "No description provided."}
        </div>
      </div>
    </div>
  );
}

function App() {
  const [focusedCourseId, setFocusedCourseId] = useState(null);
  const [selectedCourse, setSelectedCourse] = useState(null);
  const [searchText, setSearchText] = useState("");

  // 点击云里的课程时触发
  const handleNodeSelect = (id, course) => {
    setFocusedCourseId(id);      // 让这门课变成中心 / 放大
    setSelectedCourse(course);   // 右侧详情显示
    console.log("Selected course:", id, course);
  };

  // 搜索到特定 node
  const handleSearch = () => {
    const key = searchText.trim();
    if (!key) return;
    // 简单处理：当成课程 id（如 CSC172）
    setFocusedCourseId(key.toUpperCase());
  };

  // 返回“主界面” = 回到默认中心课程
  const handleReset = () => {
    setFocusedCourseId(null);    // CourseGraph 里会自动用第一门课当中心
    setSelectedCourse(null);
    setSearchText("");
  };

  return (
    <div
      style={{
        width: "100vw",
        height: "100vh",
        display: "flex",
        flexDirection: "column",
      }}
    >
      {/* 顶部搜索 + 返回主界面 */}
      <div
        style={{
          padding: "10px 16px",
          display: "flex",
          gap: "10px",
          alignItems: "center",
          borderBottom: "1px solid #e2e2e2",
          boxSizing: "border-box",
          background: "#ffffff",
        }}
      >
        <input
          placeholder="输入课程号（如 CSC172）"
          value={searchText}
          onChange={(e) => setSearchText(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter") handleSearch();
          }}
          style={{
            flex: 1,
            padding: "8px 12px",
            borderRadius: "999px",
            border: "1px solid #c4c4c4",
            fontSize: "14px",
            outline: "none",
            background: "#fafafa",
          }}
        />
        <button
          onClick={handleSearch}
          style={{
            padding: "8px 14px",
            fontSize: "14px",
            borderRadius: "999px",
            border: "none",
            background: "#2563eb",     // 深蓝
            color: "#ffffff",          // 白字
            cursor: "pointer",
            fontWeight: 500,
          }}
        >
          Search
        </button>
        <button
          onClick={handleReset}
          style={{
            padding: "8px 14px",
            fontSize: "14px",
            borderRadius: "999px",
            border: "none",
            background: "#4b5563",     // 深灰
            color: "#ffffff",          // 白字
            cursor: "pointer",
            fontWeight: 500,
          }}
        >
          Back
        </button>
      </div>

      {/* 主体区域：左云图 + 右详情 */}
      <div
        style={{
          flex: 1,
          display: "flex",
          minHeight: 0,
        }}
      >
        {/* 左边课程云 */}
        <div style={{ flex: 2, minWidth: 0 }}>
          <CourseGraph
            onNodeSelect={handleNodeSelect}
            focusedCourseId={focusedCourseId}
          />
        </div>

        {/* 右边详情 panel */}
        <div
          style={{
            width: "320px",
            borderLeft: "1px solid #eee",
            background: "#fafafa",
            boxSizing: "border-box",
          }}
        >
          <CourseDetail course={selectedCourse} />
        </div>
      </div>
    </div>
  );
}

export default App;