import { useState, useCallback, useEffect, useRef } from "react";

export default function PlanFloatingPanel({
  courses,
  visible,
  onToggleVisible,
  onRemove,
  onReorder,
  onExternalDrop,
  onClear,
}) {
  const [panelPosition, setPanelPosition] = useState({ top: null, left: null });
  const [isPanelDragging, setIsPanelDragging] = useState(false);
  const panelRef = useRef(null);
  const panelDragOffsetRef = useRef({ x: 0, y: 0 });

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

  const handlePanelDragStart = (e) => {
    if (!panelRef.current) return;
    const rect = panelRef.current.getBoundingClientRect();
    panelDragOffsetRef.current = {
      x: e.clientX - rect.left,
      y: e.clientY - rect.top,
    };
    setIsPanelDragging(true);
  };

  useEffect(() => {
    if (!isPanelDragging) return;

    const handleMouseMove = (e) => {
      setPanelPosition({
        top: e.clientY - panelDragOffsetRef.current.y,
        left: e.clientX - panelDragOffsetRef.current.x,
      });
    };

    const handleMouseUp = () => {
      setIsPanelDragging(false);
    };

    window.addEventListener("mousemove", handleMouseMove);
    window.addEventListener("mouseup", handleMouseUp);

    return () => {
      window.removeEventListener("mousemove", handleMouseMove);
      window.removeEventListener("mouseup", handleMouseUp);
    };
  }, [isPanelDragging]);

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
      ref={panelRef}
      style={{
        position: "fixed",
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
        right: panelPosition.left === null ? "16px" : undefined,
        bottom: panelPosition.top === null ? "16px" : undefined,
        top: panelPosition.top !== null ? panelPosition.top : undefined,
        left: panelPosition.left !== null ? panelPosition.left : undefined,
      }}
    >
      {/* 顶部标题栏 */}
      <div
        onMouseDown={handlePanelDragStart}
        style={{
          padding: "8px 12px",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          background: "#111827",
          color: "#f9fafb",
          cursor: "move",
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
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          gap: "8px",
        }}
      >
        <button
          onClick={onClear}
          disabled={!courses || courses.length === 0}
          style={{
            flex: 1,
            padding: "6px 10px",
            borderRadius: "999px",
            background: (!courses || courses.length === 0) ? "#e5e7eb" : "#ef4444",
            color: (!courses || courses.length === 0) ? "#9ca3af" : "#ffffff",
            border: "none",
            fontSize: "13px",
            cursor: (!courses || courses.length === 0) ? "default" : "pointer",
          }}
        >
          Clear all
        </button>
        <button
          onClick={() => window.dispatchEvent(new Event("openShortestPath"))}
          style={{
            flex: 1,
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
