import React, { useState, useMemo } from "react";

export default function CsMindmap({ data }) {
  const [svgHeight, setSvgHeight] = useState(800);
  const [collapsed, setCollapsed] = useState({});

  // ------- STEP 1：按 cluster 分类 -------
  const clusters = useMemo(() => {
    const allowed = ["Core", "MathReq", "Foundations", "Writing"];
    const map = {};
    data.nodes.forEach((n) => {
      const c = n.cluster || "Other";
      if (!allowed.includes(c)) return;
      if (!map[c]) map[c] = [];
      map[c].push(n);
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
          <rect x={xStart - 70} y={cy - 25} width={140} height={50}
                rx={16} fill="#4dabf7" />
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
        </g>
      );

      elements.push(
        <line
          key={`root-${cluster}`}
          x1={nodePositions["CS_MAJOR"].x + 60}
          y1={nodePositions["CS_MAJOR"].y}
          x2={xStart - 70}
          y2={cy}
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
              style={{ cursor: "pointer" }}
            >
              <rect
                x={courseX - 90}
                y={courseY - 20}
                width={180}
                height={40}
                rx={12}
                fill="#fff"
                stroke="#333"
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
                    fontSize: "10px",
                    color: "#666",
                    textAlign: "center",
                    whiteSpace: "normal",
                    lineHeight: "12px",
                    display: "block",
                    overflow: "hidden"
                  }}
                >
                  {course.prerequisites && course.prerequisites.length > 0
                    ? "Pre: " + course.prerequisites.join(", ")
                    : ""}
                </div>
              </foreignObject>

              <text
                x={courseX}
                y={courseY + 8}
                alignmentBaseline="middle"
                textAnchor="middle"
                fontSize="12"
              >
                {course.id}
              </text>
            </g>
          );

          elements.push(
            <line
              key={`cluster-${cluster}-${course.id}`}
              x1={xStart + 70}
              y1={cy}
              x2={courseX - 75}
              y2={courseY}
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