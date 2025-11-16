import { useState } from "react";
import CourseGraph from "./components/CourseGraph";
import CsRequirementsPage from "./components/CsRequirementsPage";

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
  const [activePage, setActivePage] = useState("graph"); // "graph" | "cs"

  // 点击云里的课程时触发
  const handleNodeSelect = (id, course) => {
    setFocusedCourseId(id);      // 让这门课变成中心 / 放大
    setSelectedCourse(course);   // 右侧详情显示
    console.log("Selected course:", id, course);
  };

  // 搜索到特定 node
  const handleSearch = () => {
    let key = searchText.trim().toUpperCase();
    if (!key) return;

    // Hide CSC160 / CSC161 from search
    if (["CSC160", "CSC 160", "CSC161", "CSC 161"].includes(key)) {
        return;
    }

    // Normalize math equivalents
    if (key === "EQUIV-MATH14X") key = "MATH 14X";
    if (key === "EQUIV-MATH16X") key = "MATH 16X";
    if (key === "EQUIV-MATH17X") key = "MATH 17X";

    // Normalize WRTG 273
    if (key === "WRTG273" || key === "WRTG 273") {
        key = "WRTG 273 (Soph. & Juniors only)";
    }

    setFocusedCourseId(key);
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
        <div
          style={{
            display: "flex",
            gap: "8px",
            marginRight: "16px",
          }}
        >
          <button
            onClick={() => setActivePage("graph")}
            style={{
              padding: "6px 12px",
              borderRadius: "999px",
              border: "none",
              fontSize: "14px",
              fontWeight: 500,
              cursor: "pointer",
              background:
                activePage === "graph" ? "#111827" : "transparent",
              color: activePage === "graph" ? "#ffffff" : "#374151",
            }}
          >
            Course Graph
          </button>
          <button
            onClick={() => setActivePage("cs")}
            style={{
              padding: "6px 12px",
              borderRadius: "999px",
              border: "none",
              fontSize: "14px",
              fontWeight: 500,
              cursor: "pointer",
              background:
                activePage === "cs" ? "#111827" : "transparent",
              color: activePage === "cs" ? "#ffffff" : "#374151",
            }}
          >
            CS Requirements
          </button>
        </div>

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
            background: "#ffffff",
            color: "#000000",
          }}
        />
        <button
          onClick={handleSearch}
          style={{
            padding: "8px 14px",
            fontSize: "14px",
            borderRadius: "999px",
            border: "none",
            background: "#2563eb",
            color: "#ffffff",
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
            background: "#4b5563",
            color: "#ffffff",
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
        {activePage === "graph" ? (
          <>
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
          </>
        ) : (
          // CS Requirements 副页面全宽显示
          <div style={{ flex: 1, minWidth: 0 }}>
            <CsRequirementsPage />
          </div>
        )}
      </div>
    </div>
  );
}

export default App;