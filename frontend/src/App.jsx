import { useState } from "react";

import CourseGraph from "./components/CourseGraph";
import CsRequirementsPage from "./components/CsRequirementsPage";
import PlanFloatingPanel from "./components/PlanFloatingPanel";
import rawData from "./data/mock-data.json";


const rawNodes = Array.isArray(rawData?.nodes)
  ? rawData.nodes
  : Array.isArray(rawData)
  ? rawData
  : [];


const COURSE_IDS = rawNodes
  .map((n) => n && n.id)
  .filter((id) => typeof id === "string")
  .filter((id) => !id.toUpperCase().startsWith("EQUIV-"));

// Helper to normalize course ids: uppercase and remove spaces
const normalizeId = (s) =>
  typeof s === "string" ? s.toUpperCase().replace(/\s+/g, "") : "";


function CourseDetail({ course, onAddToPlan, onClose }) {
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
      <div
        style={{
          marginBottom: "12px",
          display: "flex",
          alignItems: "flex-start",
          justifyContent: "space-between",
          gap: "8px",
        }}
      >
        <div>
          <div style={{ fontSize: "18px", fontWeight: 700 }}>
            {id || "-"}
          </div>
          <div style={{ fontSize: "15px", marginTop: "4px", color: "#555" }}>
            {title || ""}
          </div>
        </div>
        {onClose && (
          <button
            onClick={onClose}
            style={{
              border: "none",
              background: "transparent",
              color: "#9ca3af",
              cursor: "pointer",
              fontSize: "16px",
              lineHeight: 1,
            }}
            aria-label="Close"
          >
            ×
          </button>
        )}
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
      <div style={{ marginTop: "16px" }}>
        <button
          onClick={() =>
            onAddToPlan &&
            onAddToPlan({
              id,
              title,
              department,
              credits,
            })
          }
          style={{
            padding: "8px 14px",
            borderRadius: "999px",
            border: "none",
            background: "#2563eb",
            color: "#ffffff",
            fontSize: "14px",
            fontWeight: 500,
            cursor: "pointer",
          }}
        >
          Add to planner
        </button>
      </div>
    </div>
  );
}

function App() {
  const [focusedCourseId, setFocusedCourseId] = useState(null);
  const [selectedCourse, setSelectedCourse] = useState(null);
  const [searchText, setSearchText] = useState("");
  const [searchSuggestions, setSearchSuggestions] = useState([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [activePage, setActivePage] = useState("graph"); // "graph" | "cs"
  const [planCourses, setPlanCourses] = useState([]);
  const [plannerVisible, setPlannerVisible] = useState(true);

  // 点击云里的课程时触发
  const handleNodeSelect = (id, course) => {
    setFocusedCourseId(id);      // 让这门课变成中心 / 放大
    setSelectedCourse(course);   // 右侧详情显示
    console.log("Selected course:", id, course);
  };

  const handleSearchChange = (e) => {
    const value = e.target.value;
    setSearchText(value);

    const trimmed = value.trim();
    const normInput = normalizeId(trimmed);
    if (!normInput) {
      setSearchSuggestions([]);
      setShowSuggestions(false);
      return;
    }

    const candidates = COURSE_IDS.filter((id) => {
      const normId = normalizeId(id);

      // direct match: CSC172 vs CSC 172
      if (normId.includes(normInput)) return true;

      // heuristic: allow "CS172" to match "CSC172"
      if (normInput.startsWith("CS") && !normInput.startsWith("CSC")) {
        const expanded = "CSC" + normInput.slice(2);
        if (normId.includes(expanded)) return true;
      }

      return false;
    })
      .sort((a, b) => {
        const t = normInput;
        const aNorm = normalizeId(a);
        const bNorm = normalizeId(b);
        const aStarts = aNorm.startsWith(t);
        const bStarts = bNorm.startsWith(t);
        if (aStarts === bStarts) return a.localeCompare(b);
        return aStarts ? -1 : 1;
      })
      .slice(0, 6);

    setSearchSuggestions(candidates);
    setShowSuggestions(candidates.length > 0);
  };

  const handleSuggestionClick = (id) => {
    if (!id) return;
    const upper = id.toUpperCase();
    setSearchText(upper);
    setShowSuggestions(false);
    setActivePage("graph");
    setFocusedCourseId(upper);
  };

  // 搜索到特定 node
  const handleSearch = () => {
<<<<<<< HEAD
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
=======
    const key = searchText.trim();
    const normInput = normalizeId(key);
    if (!normInput) return;

    // 在已知课程里找第一个规范化后前缀匹配的 id
    const matched = COURSE_IDS.find((id) => {
      const normId = normalizeId(id);
      if (normId.startsWith(normInput)) return true;
      if (normInput.startsWith("CS") && !normInput.startsWith("CSC")) {
        const expanded = "CSC" + normInput.slice(2);
        if (normId.startsWith(expanded)) return true;
      }
      return false;
    });

    if (!matched) return;
    setActivePage("graph");
    setFocusedCourseId(matched.toUpperCase());
>>>>>>> feature/yuliang-Nov15_1858
  };

  // 返回“主界面” = 回到默认中心课程
  const handleReset = () => {
    setFocusedCourseId(null);    // CourseGraph 里会自动用第一门课当中心
    setSelectedCourse(null);
    setSearchText("");
  };

  const handleAddCourseToPlan = (course) => {
    if (!course || !course.id) return;
    setPlanCourses((prev) => {
      if (prev.find((c) => c.id === course.id)) return prev;
      return [...prev, course];
    });
  };

  const handleRemoveFromPlan = (id) => {
    setPlanCourses((prev) => prev.filter((c) => c.id !== id));
  };

  const handleReorderPlan = (fromIndex, toIndex) => {
    setPlanCourses((prev) => {
      const next = [...prev];
      const [moved] = next.splice(fromIndex, 1);
      next.splice(toIndex, 0, moved);
      return next;
    });
  };

  const handleJumpFromCsToGraph = (courseId) => {
    if (!courseId) return;
    const id = String(courseId).toUpperCase();
    setActivePage("graph");
    setFocusedCourseId(id);
    // 从 CS Requirements 跳回时先收起右侧详情，等用户在图上点击节点再展开
    setSelectedCourse(null);
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

        <div
          style={{
            flex: 1,
            position: "relative",
            maxWidth: "800px",
            marginRight: "30px",
          }}
        >
          <input
            placeholder="输入课程号（如 CSC172）"
            value={searchText}
            onChange={handleSearchChange}
            onFocus={() => {
              if (searchSuggestions.length) setShowSuggestions(true);
            }}
            onBlur={() => {
              // 稍微延迟一下，保证点击选项时不会被立刻隐藏
              setTimeout(() => setShowSuggestions(false), 80);
            }}
            onKeyDown={(e) => {
              if (e.key === "Enter") handleSearch();
            }}
            style={{
              width: "100%",
              padding: "8px 12px",
              borderRadius: "999px",
              border: "1px solid #c4c4c4",
              fontSize: "14px",
              outline: "none",
              background: "#ffffff",
              color: "#000000",
            }}
          />

          {showSuggestions && searchSuggestions.length > 0 && (
            <div
              style={{
                position: "absolute",
                top: "100%",
                left: 0,
                right: 0,
                marginTop: "4px",
                background: "#ffffff",
                borderRadius: "12px",
                boxShadow: "0 8px 24px rgba(15,23,42,0.15)",
                maxHeight: "220px",
                overflowY: "auto",
                zIndex: 40,
                color: "#111827",
              }}
            >
              {searchSuggestions.map((id) => (
                <div
                  key={id}
                  onMouseDown={() => handleSuggestionClick(id)}
                  style={{
                    padding: "6px 10px",
                    fontSize: "13px",
                    cursor: "pointer",
                    display: "flex",
                    alignItems: "center",
                  }}
                >
                  <span
                    style={{
                      color: "#111827",
                    }}
                  >
                    {id}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
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
            <div
              style={{
                flex: selectedCourse ? 2 : 1,
                minWidth: 0,
              }}
            >
              <CourseGraph
                onNodeSelect={handleNodeSelect}
                focusedCourseId={focusedCourseId}
              />
            </div>

            {/* 右边详情 panel：只有选中课程时才显示 */}
            {selectedCourse && (
              <div
                style={{
                  width: "320px",
                  borderLeft: "1px solid #eee",
                  background: "#fafafa",
                  boxSizing: "border-box",
                }}
              >
                <CourseDetail
                  course={selectedCourse}
                  onAddToPlan={handleAddCourseToPlan}
                  onClose={() => setSelectedCourse(null)}
                />
              </div>
            )}
          </>
        ) : (
          // CS Requirements 副页面全宽显示
          <div style={{ flex: 1, minWidth: 0 }}>
            <CsRequirementsPage onCourseSelect={handleJumpFromCsToGraph} />
          </div>
        )}
      </div>
      <PlanFloatingPanel
        courses={planCourses}
        visible={plannerVisible}
        onToggleVisible={() => setPlannerVisible((v) => !v)}
        onRemove={handleRemoveFromPlan}
        onReorder={handleReorderPlan}
      />
    </div>
  );
}

export default App;