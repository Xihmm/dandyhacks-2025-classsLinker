import React, { useState, useMemo } from "react";

export default function CsMindmap({ data, onCourseClick }) {
  const [svgHeight, setSvgHeight] = useState(800);
  const [collapsed, setCollapsed] = useState({});

  const clusterColors = {
    "Core": { bg: "#6ca0ff", stroke: "#3c6ddf" },
    "Writing": { bg: "#c28bff", stroke: "#9d63e5" },
    "Additional Math": { bg: "#6cd9c3", stroke: "#42b39d" },
    "Foundations": { bg: "#ffb066", stroke: "#e68a33" }
  };

  // ------- STEP 1：按 cluster 分类 -------
  const clusters = useMemo(() => {
    // Swap "Writing" and "MathReq" order for visual arrangement
    const allowed = ["Core", "Writing", "MathReq", "Foundations"];
    const map = {};
    data.nodes.forEach((n) => {
      // Skip nodes with id "CSC160", "CSC 160", "CSC161", or "CSC 161"
      if (
        n.id === "CSC160" ||
        n.id === "CSC 160" ||
        n.id === "CSC161" ||
        n.id === "CSC 161"
      )
        return;
      // Clone node to avoid mutating original data
      let node = { ...n };
      // Renaming for EQUIV-MATH14X, 16X, 17X
      if (node.id === "EQUIV-MATH14X") node.id = "MATH 14X";
      if (node.id === "EQUIV-MATH16X") node.id = "MATH 16X";
      if (node.id === "EQUIV-MATH17X") node.id = "MATH 17X";
      let c = node.cluster || "Other";
      if (!allowed.includes(c)) return;
      // Rename "MathReq" cluster to "Additional Math"
      if (c === "MathReq") c = "Additional Math";
      // Special modification for Writing cluster: WRTG273 and WRTG 273
      if (
        c === "Writing" &&
        (node.id === "WRTG273" || node.id === "WRTG 273")
      ) {
        node.id = "WRTG 273 (Soph. & Juniors only)";
      }
      if (!map[c]) map[c] = [];
      map[c].push(node);
    });
    return map;
  }, [data]);

  const clusterNames = Object.keys(clusters);

  // ------- STEP 2：记录节点坐标，用于画箭头 -------
  const nodePositions = {};

  // ------- STEP 3：生成 SVG 渲染 -------
  const renderMap = () => {
    let xStart = 140;
    const yRoot = 300;

    const elements = [];

    // root node
    elements.push(
      <g key="root">
        <rect x={xStart - 60} y={yRoot - 25} width={120} height={50} 
              rx={20} fill="#1b1f3b" />
        <text x={xStart} y={yRoot} textAnchor="middle"
              alignmentBaseline="middle" fill="#fff" fontSize="16">
          cs major
        </text>
      </g>
    );

    nodePositions["CS_MAJOR"] = { x: xStart, y: yRoot };

    // ===== dynamic cluster spacing (collapsible, auto-avoid overlap) =====
    const COURSE_HEIGHT = 70;
    const CLUSTER_MIN_HEIGHT = 80;
    const CLUSTER_HEADER_HEIGHT = 80;

    // compute actual height of each cluster depending on collapse state
    const clusterHeights = clusterNames.map((cluster) => {
      const expanded = !collapsed[cluster];
      const courseCount = clusters[cluster]?.length ?? 0;

      if (!expanded) {
        // collapsed = compact height
        return CLUSTER_MIN_HEIGHT;
      }

      // expanded = height based on visible courses
      return Math.max(
        CLUSTER_MIN_HEIGHT,
        CLUSTER_HEADER_HEIGHT + courseCount * COURSE_HEIGHT
      );
    });

    // compute Y offsets, ensuring no overlap
    const clusterYPositions = [];
    let cursorY = 80;

    clusterHeights.forEach((h) => {
      clusterYPositions.push(cursorY);
      cursorY += h + 40; // 40px spacer to avoid boundary touching
    });

    // avoid infinite re-render loop
    if (svgHeight !== cursorY + 400) {
      setSvgHeight(cursorY + 400);
    }

    // render clusters
    xStart += 250;

    clusterNames.forEach((cluster, ci) => {
      const cy = clusterYPositions[ci];

      nodePositions[`cluster_${cluster}`] = { x: xStart, y: cy };

      elements.push(
        <g key={cluster}>
          <rect
            className="mindmap-cluster-label"
            x={xStart - 90}
            y={cy - 30}
            width={180}
            height={60}
            rx={30}
            fill="url(#clusterGradient)"
            stroke={clusterColors[cluster]?.stroke || "#3c6ddf"}
            strokeWidth="2"
          />
          <text x={xStart} y={cy} textAnchor="middle"
                alignmentBaseline="middle" fill="#fff" fontSize="14">
            {cluster}
          </text>

          <text
            x={xStart + 80}
            y={cy}
            fontSize="20"
            cursor="pointer"
            onClick={() =>
              setCollapsed((p) => ({ ...p, [cluster]: !p[cluster] }))
            }
          >
            {collapsed[cluster] ? "+" : "-"}
          </text>

          {(cluster === "Writing" || cluster === "Additional Math") && (
            <text
              x={xStart}
              y={cy + 26}
              textAnchor="middle"
              alignmentBaseline="middle"
              fill="#ffffff"
              fontSize="12"
              fontStyle="italic"
            >
              Choose two courses
            </text>
          )}
        </g>
      );

      elements.push(
        <path
          key={`curve-root-${cluster}`}
          style={{ transition: "all 0.35s ease" }}
          d={`
            M ${nodePositions["CS_MAJOR"].x + 60} ${nodePositions["CS_MAJOR"].y}
            C ${nodePositions["CS_MAJOR"].x + 150} ${nodePositions["CS_MAJOR"].y},
              ${xStart - 150} ${cy},
              ${xStart - 90} ${cy}
          `}
          fill="none"
          stroke="#999"
          strokeWidth="2"
        />
      );

      if (!collapsed[cluster]) {
        const courses = clusters[cluster];
        courses.forEach((course, idx) => {
          const courseX = xStart + 280;
          const courseY = cy + idx * COURSE_HEIGHT;

          nodePositions[course.id] = { x: courseX, y: courseY };

          elements.push(
            <g
              key={course.id}
<<<<<<< HEAD
              style={{
                cursor: "pointer",
                transition: "all 0.35s ease"
              }}
=======
              onClick={() => onCourseClick && onCourseClick(course.id)}
              style={{ cursor: "pointer" }}
>>>>>>> feature/yuliang-Nov15_1858
            >
              <rect
                className="mindmap-node"
                x={courseX - 80}
                y={courseY - 30}
                width={160}
                height={60}
                rx={30}
                fill={clusterColors[cluster]?.bg || "#ffffff"}
                stroke={clusterColors[cluster]?.stroke || "#999"}
                strokeWidth="1.5"
              />
              <foreignObject
                x={courseX - 80}
                y={courseY - 20}
                width={160}
                height={30}
                style={{ overflow: "hidden" }}
              >
                <div
                  style={{
                    fontSize: "11px",
                    color: "#fff",
                    textAlign: "center",
                    whiteSpace: "normal",
                    lineHeight: "12px",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    overflow: "hidden",
                    padding: "0",
                    background: "transparent",
                    borderRadius: "0"
                  }}
                >
                  {course.prerequisites && course.prerequisites.length > 0
                    ? "Pre: " + course.prerequisites.join(", ")
                    : ""}
                </div>
              </foreignObject>

              <foreignObject
                x={courseX - 80}
                y={courseY - 5}
                width={160}
                height={36}
                style={{ overflow: "hidden" }}
              >
                <div
                  style={{
                    fontSize: "12px",
                    color: "#000",
                    textAlign: "center",
                    whiteSpace: "normal",
                    lineHeight: "14px",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    height: "100%",
                    padding: "0 4px",
                    wordWrap: "break-word"
                  }}
                >
                  {course.id}
                </div>
              </foreignObject>
            </g>
          );

          elements.push(
            <path
              key={`curve-${cluster}-${course.id}`}
              style={{ transition: "all 0.35s ease" }}
              d={`
                M ${xStart + 70} ${cy}
                C ${xStart + 150} ${cy},
                  ${courseX - 150} ${courseY},
                  ${courseX - 80} ${courseY}
              `}
              fill="none"
              stroke="#bbb"
              strokeWidth="1.5"
            />
          );
        });
      }
    });

    return elements;
  };

  return (
    <svg width={1600} height={svgHeight}>
      <defs>
        <linearGradient id="clusterGradient" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor="#6ca0ff" />
          <stop offset="100%" stopColor="#3c6ddf" />
        </linearGradient>
        <marker
          id="arrowhead"
          markerWidth="10"
          markerHeight="10"
          refX="8"
          refY="5"
          orient="auto"
        >
          <path d="M0,0 L10,5 L0,10" fill="#e66" />
        </marker>
      </defs>

      {renderMap()}
    </svg>
  );
}