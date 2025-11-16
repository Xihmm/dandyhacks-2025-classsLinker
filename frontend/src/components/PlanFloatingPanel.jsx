import { useState, useCallback } from "react";

export default function PlanFloatingPanel({
  courses,
  visible,
  onToggleVisible,
  onRemove,
  onReorder,
  onExternalDrop,
}) {
  const [dragIndex, setDragIndex] = useState(null);

  const handleDragStart = (index) => (e) => {
    setDragIndex(index);
    e.dataTransfer.effectAllowed = "move";
  };

  const handleDragOver = (index) => (e) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = "move";
  };

  const handleDrop = (index) => (e) => {
    e.preventDefault();
    if (dragIndex === null || dragIndex === index) return;
    onReorder(dragIndex, index);
    setDragIndex(null);
  };

  const handleDragEnd = useCallback(() => {
    setDragIndex(null);
  }, []);

  const handleExternalDragOver = (e) => {
    e.preventDefault();
  };

  const handleExternalDrop = (e) => {
    e.preventDefault();
    if (!onExternalDrop) return;
    const id = e.dataTransfer.getData("text/plain");
    if (!id) return;
    onExternalDrop(id);
  };

  // 折叠状态
  if (!visible) {
    return (
      <div
        style={{
          position: "fixed",
          right: "16px",
          bottom: "16px",
          zIndex: 50,
        }}
      >
        <button
          onClick={onToggleVisible}
          style={{
            padding: "8px 12px",
            borderRadius: "999px",
            border: "none",
            background: "#111827",
            color: "#ffffff",
            fontSize: "14px",
            cursor: "pointer",
            boxShadow: "0 10px 30px rgba(15,23,42,0.3)",
          }}
        >
          Open planner
        </button>
      </div>
    );
  }

  return (
    <div
      style={{
        position: "fixed",
        right: "16px",
        bottom: "16px",
        width: "320px",
        maxHeight: "60vh",
        display: "flex",
        flexDirection: "column",
        background: "#f9fafb",
        borderRadius: "16px",
        border: "1px solid #e5e7eb",
        boxShadow: "0 20px 40px rgba(15,23,42,0.2)",
        zIndex: 50,
        overflow: "hidden",
      }}
    >
      {/* 顶部标题栏 */}
      <div
        style={{
          padding: "8px 12px",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          background: "#111827",
          color: "#f9fafb",
        }}
      >
        <div style={{ fontSize: "14px", fontWeight: 600 }}>My Plan</div>
        <button
          onClick={onToggleVisible}
          style={{
            border: "none",
            background: "transparent",
            color: "#e5e7eb",
            fontSize: "14px",
            cursor: "pointer",
          }}

        >
          hide
        </button>
      </div>

      {/* 列表区域 */}
      <div
        onDragOver={handleExternalDragOver}
        onDrop={handleExternalDrop}
        style={{
          flex: 1,
          overflowY: "auto",
          padding: "8px",
          background: "#ffffff",
        }}
      >
        {(!courses || courses.length === 0) ? (
          <div
            style={{
              fontSize: "13px",
              color: "#6b7280",
              padding: "4px 2px",
            }}
          >
            Click a course in the graph / mindmap or use “Add to planner” in the detail panel.
          </div>
        ) : (
          courses.map((c, index) => (
            <div
              key={c.id}
              draggable
              onDragStart={handleDragStart(index)}
              onDragOver={handleDragOver(index)}
              onDrop={handleDrop(index)}
              onDragEnd={handleDragEnd}
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                gap: "8px",
                padding: "6px 8px",
                marginBottom: "6px",
                borderRadius: "8px",
                border:
                  dragIndex === index
                    ? "1px dashed #2563eb"
                    : "1px solid #e5e7eb",
                background:
                  dragIndex === index ? "#eff6ff" : "#f9fafb",
                cursor: "grab",
                fontSize: "13px",
              }}
            >
              <span
                style={{
                  flex: 1,
                  whiteSpace: "nowrap",
                  overflow: "hidden",
                  textOverflow: "ellipsis",
                  color: "#111827",
                }}
              >
                {index + 1}. {c.id || c.code || c.title}
              </span>
              <button
                onClick={() => onRemove(c.id)}
                style={{

                  border: "none",
                  borderRadius: "999px",
                  padding: "2px 8px",
                  fontSize: "12px",
                  background: "#ef4444",
                  color: "#ffffff",
                  cursor: "pointer",
                }}
              >
                x
              </button>
            </div>
          ))
        )}
      </div>

      {/* Shortest Path 按钮 */}
      <div
        style={{
          padding: "8px",
          borderTop: "1px solid #e5e7eb",
          background: "#fff",
          textAlign: "center",
        }}
      >
        <button
          onClick={() => window.dispatchEvent(new Event("openShortestPath"))}
          style={{
            padding: "8px 14px",
            borderRadius: "999px",
            background: "#2563eb",
            color: "white",
            border: "none",
            fontSize: "14px",
            cursor: "pointer",
          }}
        >
          Shortest Path
        </button>
      </div>

      <div
        style={{
          padding: "6px 8px",
          fontSize: "11px",
          color: "#6b7280",
          background: "#f3f4f6",
        }}
      >
        Drag to reorder. This panel stays across all pages.
      </div>
    </div>
  );
}



