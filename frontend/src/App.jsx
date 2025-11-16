import CsRequirementsPage from "./components/CsRequirementsPage";
import PlanFloatingPanel from "./components/PlanFloatingPanel";
import rawData from "./data/mock-data.json";
import { useState, useEffect } from "react";   // ⭐ NEW：useEffect
import CourseGraph from "./components/CourseGraph";
import ShortestPath from "./components/ShortestPath";

const rawNodes = Array.isArray(rawData?.nodes)
  ? rawData.nodes
  : Array.isArray(rawData)
  ? rawData
  : [];

  // ⭐ 新增：读取 'edges' 数据
const rawEdges = Array.isArray(rawData?.edges)
  ? rawData.edges
  : [];

const normalizeId = (s) =>
  typeof s === "string" ? s.toUpperCase().replace(/\s+/g, "") : "";


const COURSE_IDS = rawNodes
  .map((n) => n && n.id)
  .filter((id) => typeof id === "string")
  .filter((id) => !id.toUpperCase().startsWith("EQUIV-"));

  // ⭐ 新增：创建一个标准化的、可见课程ID的Set，用于快速查找
const NORM_COURSE_IDS = new Set(COURSE_IDS.map(normalizeId));


function CourseDetail({ course, onAddToPlan, onClose, onGoToRequirements }) {
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

        {onGoToRequirements && (
          <button
            onClick={onGoToRequirements}
            style={{
              marginTop: "8px",
              padding: "8px 14px",
              borderRadius: "999px",
              border: "1px solid #d1d5db",
              background: "#ffffff",
              color: "#111827",
              fontSize: "14px",
              fontWeight: 500,
              cursor: "pointer",
            }}
          >
            Go to CS Requirements
          </button>
        )}
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
  const [activePage, setActivePage] = useState("graph"); 
  const [planCourses, setPlanCourses] = useState([]);
  const [plannerVisible, setPlannerVisible] = useState(true);

  const [showShortestPath, setShowShortestPath] = useState(false);  // ⭐ NEW

  // ⭐ NEW — 监听 Planner 发来的事件
  useEffect(() => {
    const handler = () => setShowShortestPath(true);
    window.addEventListener("openShortestPath", handler);
    return () => window.removeEventListener("openShortestPath", handler);
  }, []);

  const handleNodeSelect = (id, course) => {
    setFocusedCourseId(id);
    setSelectedCourse(course);
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
      if (normId.includes(normInput)) return true;

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
    setSearchText(id);
    setShowSuggestions(false);
    setActivePage("graph");
    setFocusedCourseId(id.toUpperCase());
  };

  const handleSearch = () => {
    let key = searchText.trim().toUpperCase();
    if (!key) return;

    if (["CSC160", "CSC161"].includes(key)) return;

    const normInput = normalizeId(key);
    if (!normInput) return;

    const matched = COURSE_IDS.find((id) =>
      normalizeId(id).startsWith(normInput)
    );

    if (matched) {
      setActivePage("graph");
      setFocusedCourseId(matched);
    }
  };

  const handleReset = () => {
    setFocusedCourseId(null);
    setSelectedCourse(null);
    setSearchText("");
  };

  const handleAddCourseToPlan = (course) => {
    if (!course?.id) return;
    setPlanCourses((prev) =>
      prev.find((c) => c.id === course.id)
        ? prev
        : [...prev, course]
    );
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
    const id = String(courseId).toUpperCase();
    const normId = normalizeId(id);

    // 1. 检查传来的ID是否本身就是一个可见的课程ID
    if (NORM_COURSE_IDS.has(normId)) {
      setActivePage("graph");
      setFocusedCourseId(id);
      setSelectedCourse(null);
      return;
    }

    // 2. 如果不是，说明它可能是一个虚拟节点 (如 EQUIV-MTH-150)
    //    我们需要在 "边" (rawEdges) 中查找它连接到哪个 "可见" 节点
    
    let finalId = id; // 默认ID

    // 查找一条边：从这个虚拟节点 -> 指向一个可见节点
    const targetEdge = rawEdges.find(edge => {
      const sourceId = normalizeId(edge.source);
      const targetId = normalizeId(edge.target);
      return sourceId === normId && NORM_COURSE_IDS.has(targetId);
    });

    if (targetEdge) {
      finalId = targetEdge.target.toUpperCase(); // 找到了！(例如 "CSC 160")
    } else {
      // 备用查找：查找一条边：从一个可见节点 -> 指向这个虚拟节点
      const sourceEdge = rawEdges.find(edge => {
        const sourceId = normalizeId(edge.source);
        const targetId = normalizeId(edge.target);
        return targetId === normId && NORM_COURSE_IDS.has(sourceId);
      });
      
      if (sourceEdge) {
        finalId = sourceEdge.source.toUpperCase(); // 找到了！(例如 "CSC 160")
      }
    }

    // 3. 使用 finalId (无论是原始ID还是翻译后的ID) 来跳转
    setActivePage("graph");
    setFocusedCourseId(finalId);
    setSelectedCourse(null);
  };

  const handleClearPlan = () => {
    setPlanCourses([]);
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
      {/* 顶部栏 */}
      <div
        style={{
          padding: "10px 16px",
          display: "flex",
          gap: "10px",
          alignItems: "center",
          borderBottom: "1px solid #e2e2e2",
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
            onClick={() => {
              setShowShortestPath(false); // ⭐ NEW
              setActivePage("graph");
            }}
            style={{
              padding: "6px 12px",
              borderRadius: "999px",
              border: "none",
              background:
                activePage === "graph" && !showShortestPath
                  ? "#111827"
                  : "transparent",
              color:
                activePage === "graph" && !showShortestPath
                  ? "#fff"
                  : "#374151",
              cursor: "pointer",
             }}
          >
            Course Graph
          </button>

          <button
            onClick={() => {
              setShowShortestPath(false); // ⭐ NEW
              setActivePage("cs");
            }}
            style={{
              padding: "6px 12px",
              borderRadius: "999px",
              border: "none",
              background:
                activePage === "cs" && !showShortestPath
                  ? "#111827"
                  : "transparent",
              color:
                activePage === "cs" && !showShortestPath
                  ? "#fff"
                  : "#374151",
              cursor: "pointer",
            }}
          >
            CS Requirements
          </button>
        </div>

        {/* 搜索栏 */}
        <div
          style={{
            flex: 1,
            position: "relative",
            maxWidth: "800px",
            marginRight: "30px",
          }}
        >
          <input
            placeholder="ENTER YOUR COURSE NUMBER (i.e.CSC 172)"
            value={searchText}
            onChange={handleSearchChange}
            style={{
              width: "100%",
              padding: "8px 12px",
              borderRadius: "999px",
              border: "1px solid #c4c4c4",
              fontSize: "14px",
            }}
          />

          {showSuggestions && (
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
              }}
            >
              {searchSuggestions.map((id) => (
                <div
                  key={id}
                  style={{
                    padding: "6px 10px",
                    color: "#111827",
                    cursor: "pointer",
                  }}
                  onMouseDown={() => handleSuggestionClick(id)}
                >
                  {id}
                </div>
              ))}
            </div>
          )}
        </div>

        <button
          onClick={handleSearch}
          style={{
            padding: "8px 14px",
            borderRadius: "999px",
            background: "#2563eb",
            color: "#ffffff",
            border: "none",
            cursor: "pointer",
          }}
        >
          Search
        </button>

        <button
          onClick={handleReset}
          style={{
            padding: "8px 14px",
            borderRadius: "999px",
            background: "#4b5563",
            color: "#ffffff",
            border: "none",
            cursor: "pointer",
          }}
        >
          Back
        </button>
      </div>

      {/* 主区域：核心部分 */}
      <div
        style={{
          flex: 1,
          display: "flex",
          minHeight: 0,
        }}
      >
   {/* ⭐ NEW: Shortest Path 页面 */}
        {showShortestPath ? (
          <div style={{ flex: 1, minWidth: 0 }}>
            <ShortestPath
              courses={planCourses}
              onBack={() => setShowShortestPath(false)}
            />
          </div>
        ) : activePage === "graph" ? (
          <>
            <div style={{ flex: selectedCourse ? 2 : 1 }}>
              <CourseGraph
                onNodeSelect={handleNodeSelect}
                focusedCourseId={focusedCourseId}
              />
            </div>

            {selectedCourse && (
              <div
                style={{
                  width: "320px",
                  borderLeft: "1px solid #eee",
                  background: "#fafafa",
                }}
              >
                <CourseDetail
                  course={selectedCourse}
                  onAddToPlan={handleAddCourseToPlan}
                  onClose={() => setSelectedCourse(null)}
                  onGoToRequirements={() => setActivePage("cs")}
                />
              </div>
            )}
          </>
        ) : (
          <div style={{ flex: 1, minWidth: 0 }}>
            <CsRequirementsPage onCourseSelect={handleJumpFromCsToGraph} />
          </div>
        )}

        {/* CS Requirements 副页面：始终挂载，只是按需显示 */}
        <div
          style={{
            flex: 1,
            minWidth: 0,
            display: activePage === "cs" ? "block" : "none",
          }}
        >
          <CsRequirementsPage onCourseSelect={handleJumpFromCsToGraph} />
        </div>
      </div>

      {/* 右下角 Planner */}
      <PlanFloatingPanel
        courses={planCourses}
        visible={plannerVisible}
        onToggleVisible={() => setPlannerVisible((v) => !v)}
        onRemove={handleRemoveFromPlan}
        onReorder={handleReorderPlan}
        onClear={handleClearPlan}
      />
    </div>
  );
}

export default App;


