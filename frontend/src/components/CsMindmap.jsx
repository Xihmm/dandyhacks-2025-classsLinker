import React, { useState, useMemo } from "react";

// (新!) 步骤 1: 我们把所有 UI 和动画样式定义在这里
const MindmapStyles = () => (
  <style>{`
    /* --- 动画类 (Animation) --- */
    
    .mindmap-group, .mindmap-path, .mindmap-subgroup-label {
      /* 这是“炫酷”动画的核心 */
      transition: all 0.35s ease-out;
    }

    .mindmap-group.collapsed, .mindmap-path.collapsed, .mindmap-subgroup-label.collapsed {
      /* 当折叠时: 淡出 + 向左微移 */
      opacity: 0;
      transform: translateX(-20px);
      pointer-events: none; /* 隐藏时不可点击 */
    }

    /* --- UI 样式 (Notion-Like) --- */

    .mindmap-node {
      /* 节点(rect)的过渡和阴影 */
      transition: all 0.3s ease-out;
      filter: drop-shadow(0px 2px 4px rgba(0, 0, 0, 0.1));
    }

    .mindmap-node:hover {
      /* 鼠标悬停时: 阴影变大 + 微微上浮 */
      filter: drop-shadow(0px 4px 8px rgba(0, 0, 0, 0.15));
      transform: translateY(-2px);
    }
    
    .mindmap-node-prereq-text {
      /* 节点内“先修课”的文本 (e.g., "Pre: CSC 171") */
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
      font-size: 11px;
      color: #fff; /* 保持你原来的白色，因为背景是深色 */
      text-align: center;
      line-height: 12px;
      display: flex;
      align-items: center;
      justify-content: center;
      word-wrap: break-word;
    }

    .mindmap-node-text-wrapper {
      /* 节点内“课程ID”的文本 (e.g., "CSC 172") */
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
      font-size: 13px;
      color: #000; /* 保持你原来的黑色 */
      text-align: center;
      white-space: normal;
      line-height: 1.3;
      display: flex;
      align-items: center;
      justify-content: center;
      height: 100%;
      padding: 0 4px;
      word-wrap: break-word;
    }

    .mindmap-path {
      /* 连接线 (path) 的样式 */
      fill: none;
      stroke: #ddd; /* 更柔和的“Notion”灰色 */
      stroke-width: 1.5;
    }
    
    .mindmap-path.writing-subgroup {
      /* “Writing” 分支的特殊曲线 */
      stroke: #b48bda;
      stroke-width: 2;
    }

    .mindmap-cluster-label {
      /* Cluster 标签 (e.g., "Core") */
      filter: drop-shadow(0px 4px 6px rgba(0, 0, 0, 0.1));
    }
    
    .math-seq-node {
      /* "MATH 141" 等子节点 */
      fill: #ffd2a6;
      stroke: #c78b53;
      stroke-width: 1.5;
      transition: all 0.3s ease-out;
    }
    
    .math-seq-path {
      fill: none;
      stroke: #d8a875;
      stroke-width: 2;
    }
  `}</style>
);

export default function CsMindmap({ data, onCourseClick }) {
  const [svgHeight, setSvgHeight] = useState(800);
  // (修复!) 恢复你原来的默认折叠状态
  const [collapsed, setCollapsed] = useState({
    "Foundations": true,
    "Core": true,
    "Writing": true,
    "Additional Math": true
  });
  const [mathSeqOpen, setMathSeqOpen] = useState({
    "MATH 14X": false,
    "MATH 16X": false,
    "MATH 17X": false
  });

  const clusterColors = {
    "Core": { bg: "#6ca0ff", stroke: "#3c6ddf" },
    "Writing": { bg: "#c28bff", stroke: "#9d63e5" },
    "Additional Math": { bg: "#6cd9c3", stroke: "#42b39d" },
    "Foundations": { bg: "#ffb066", stroke: "#e68a33" }
  };

  // (修复!) 恢复你原来的 formatPrereq 函数
  const formatPrereq = (prereqs = []) =>
    prereqs.map((p) => p.replace(/^EQUIV-/, "")).join(", ");

  // ------- STEP 1：按 cluster 分类 -------
  const clusters = useMemo(() => {
    // (保留你原来的逻辑)
    const allowed = ["Core", "Writing", "MathReq", "Foundations"];
    const map = {};
    data.nodes.forEach((n) => {
      if (
        n.id === "CSC160" ||
        n.id === "CSC 160" ||
        n.id === "CSC161" ||
        n.id === "CSC 161"
      )
        return;
      let node = { ...n };
      if (node.id === "EQUIV-MATH14X") node.id = "MATH 14X";
      if (node.id === "EQUIV-MATH16X") node.id = "MATH 16X";
      if (node.id === "EQUIV-MATH17X") node.id = "MATH 17X";
      let c = node.cluster || "Other";
      if (!allowed.includes(c)) return;
      if (c === "MathReq") c = "Additional Math";
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

  // ------- STEP 2：记录节点坐标 -------
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

    // ===== dynamic cluster spacing (保留你原来的逻辑) =====
    const COURSE_HEIGHT = 70;
    const CLUSTER_MIN_HEIGHT = 80;
    const CLUSTER_HEADER_HEIGHT = 80;

    const clusterHeights = clusterNames.map((cluster) => {
      const expanded = !collapsed[cluster];
      const courseCount = clusters[cluster]?.length ?? 0;
      if (!expanded) {
        return CLUSTER_MIN_HEIGHT;
      }
      return Math.max(
        CLUSTER_MIN_HEIGHT,
        CLUSTER_HEADER_HEIGHT + courseCount * COURSE_HEIGHT
      );
    });

    const clusterYPositions = [];
    let cursorY = 80;
    clusterHeights.forEach((h) => {
      clusterYPositions.push(cursorY);
      cursorY += h + 40;
    });

    if (svgHeight !== cursorY + 400) {
      setSvgHeight(cursorY + 400);
    }

    // render clusters
    xStart += 230; // (修复!) 恢复你原来的 230

    clusterNames.forEach((cluster, ci) => {
      const cy = clusterYPositions[ci];
      
      // (新!) 检查这个 cluster 是否被折叠 (用于动画)
      const isCollapsed = collapsed[cluster];

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
          className="mindmap-path" // (新!) 使用 CSS 类
          style={{ transition: "all 0.35s ease" }} // (保留) 这个 transition 是给 cluster 移动用的
          d={`
            M ${nodePositions["CS_MAJOR"].x + 60} ${nodePositions["CS_MAJOR"].y}
            C ${nodePositions["CS_MAJOR"].x + 150} ${nodePositions["CS_MAJOR"].y},
              ${xStart - 150} ${cy},
              ${xStart - 90} ${cy}
          `}
        />
      );

      // (新!) 删除了 if (!collapsed[cluster]) 检查
      
      // Special nested rendering for Writing cluster
      if (cluster === "Writing") {
        // (保留你原来的 Writing 逻辑)
        const writingCourses = clusters[cluster] || [];
        const subgroupMap = { CSC: [], WRTG: [], PHIL: [] };
        writingCourses.forEach((course) => {
          if (/^CSC/.test(course.id)) subgroupMap.CSC.push(course);
          else if (/^WRTG/.test(course.id)) subgroupMap.WRTG.push(course);
          else if (/^PHIL/.test(course.id)) subgroupMap.PHIL.push(course);
        });
        const subgroupNames = Object.keys(subgroupMap).filter(
          (sg) => subgroupMap[sg].length > 0
        );
        const SUBGROUP_HEADER_HEIGHT = 55;
        const SUBGROUP_COURSE_HEIGHT = 68;
        const SUBGROUP_SPACING = 32;
        let subgroupY = cy - Math.max((subgroupNames.length * (SUBGROUP_HEADER_HEIGHT + SUBGROUP_SPACING)) / 2, 0) + 90;
        let clusterToFirstY = null;
        
        subgroupNames.forEach((sg, sgi) => {
          const sgY = subgroupY;
          const subgroupNodeX = xStart + 250;
          elements.push(
            <g 
              key={`writing-subgroup-${sg}`}
              // (新!) 添加动画类
              className={`mindmap-subgroup-label ${isCollapsed ? "collapsed" : ""}`}
            >
              <rect
                x={subgroupNodeX - 68}
                y={sgY - 28}
                width={136}
                height={56}
                rx={22}
                fill="#a97ee5"
                stroke="#7e53b6"
                strokeWidth="2"
              />
              <text
                x={subgroupNodeX}
                y={sgY}
                textAnchor="middle"
                alignmentBaseline="middle"
                fill="#fff"
                fontSize="15"
                fontWeight="600"
                style={{ letterSpacing: "2px" }}
              >
                {sg}
              </text>
            </g>
          );
          if (sgi === 0) clusterToFirstY = sgY;
          elements.push(
            <path
              key={`curve-writing-cluster-${sg}`}
              // (新!) 添加动画类
              className={`mindmap-path writing-subgroup ${isCollapsed ? "collapsed" : ""}`}
              d={
               `M ${xStart + 70} ${cy} 
                C ${xStart + 150} ${cy},
                  ${subgroupNodeX - 110} ${sgY},
                  ${subgroupNodeX - 68} ${sgY}
              `}
            />
          );
          
          const courses = subgroupMap[sg];
          courses.forEach((course, cidx) => {
            const courseX = subgroupNodeX + 220;
            const courseY = sgY + cidx * SUBGROUP_COURSE_HEIGHT;
            nodePositions[course.id] = { x: courseX, y: courseY };
            elements.push(
              <g
                key={course.id}
                onClick={() => onCourseClick && onCourseClick(course.id)}
                // (新!) 添加动画类
                className={`mindmap-group ${isCollapsed ? "collapsed" : ""}`}
                style={{ cursor: "pointer" }}
              >
                <rect
                  className="mindmap-node" // (新!) 使用 CSS 类
                  x={courseX - 80}
                  y={courseY - 30}
                  width={160}
                  height={60}
                  rx={30}
                  fill={clusterColors[cluster]?.bg || "#ffffff"} // (保留) 动态颜色
                  stroke={clusterColors[cluster]?.stroke || "#999"} // (保留) 动态颜色
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
                    // (新!) 使用 CSS 类
                    className="mindmap-node-prereq-text"
                  >
                    {course.prerequisites && course.prerequisites.length > 0
                      ? "Pre: " + formatPrereq(course.prerequisites) // (修复!) 使用 formatPrereq
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
                    // (新!) 使用 CSS 类
                    className="mindmap-node-text-wrapper"
                  >
                    {course.id}
                  </div>
                </foreignObject>
              </g>
            );
            elements.push(
              <path
                key={`curve-writing-${sg}-${course.id}`}
                // (新!) 添加动画类
                className={`mindmap-path ${isCollapsed ? "collapsed" : ""}`}
                d={`
                  M ${subgroupNodeX + 68} ${sgY}
                  C ${subgroupNodeX + 130} ${sgY},
                    ${courseX - 150} ${courseY},
                    ${courseX - 80} ${courseY}
                `}
              />
            );
          });
          subgroupY += SUBGROUP_HEADER_HEIGHT + Math.max((courses.length - 1), 0) * SUBGROUP_COURSE_HEIGHT + SUBGROUP_SPACING;
        });
      } else {
        // Default: flat course rendering (保留你原来的逻辑)
        const courses = clusters[cluster];
        courses.forEach((course, idx) => {
          const isSeqParent =
            course.id === "MATH 14X" || course.id === "MATH 16X" || course.id === "MATH 17X";

          const courseX = xStart + 320;
          const courseY = cy + idx * COURSE_HEIGHT;

          nodePositions[course.id] = { x: courseX, y: courseY };

          elements.push(
            <g
              key={course.id}
              // (新!) 添加动画类
              className={`mindmap-group ${isCollapsed ? "collapsed" : ""}`}
              style={{ cursor: isSeqParent ? "pointer" : "default" }}
              onClick={() => {
                if (!isSeqParent) onCourseClick && onCourseClick(course.id);
              }}
            >
              <rect
                className="mindmap-node" // (新!) 使用 CSS 类
                x={courseX - 90}
                y={courseY - 30}
                width={180}
                height={60}
                rx={30}
                fill={clusterColors[cluster]?.bg || "#ffffff"} // (保留) 动态颜色
                stroke={clusterColors[cluster]?.stroke || "#999"} // (保留) 动态颜色
                strokeWidth="1.5"
              />

              <foreignObject
                x={courseX - 90}
                y={courseY - 22}
                width={180}
                height={24}
                style={{ overflow: "hidden" }}
              >
                <div
                  // (新!) 使用 CSS 类
                  className="mindmap-node-prereq-text"
                >
                  {course.prerequisites?.length ? "Pre: " + formatPrereq(course.prerequisites) : ""}
                </div>
              </foreignObject>

              <foreignObject
                x={courseX - 90}
                y={courseY - 4}
                width={180}
                height={40}
                style={{ overflow: "hidden" }}
              >
                <div
                  // (新!) 使用 CSS 类
                  className="mindmap-node-text-wrapper"
                  style={{ fontSize: "14px" }} // (保留) 覆盖 CSS
                >
                  {course.id}
                </div>
              </foreignObject>

              {isSeqParent && (
                <text
                  x={courseX + 70}
                  y={courseY - 10}
                  fontSize="22"
                  fill="#000"
                  style={{ cursor: "pointer" }}
                  onClick={(e) => {
                    e.stopPropagation();
                    setMathSeqOpen((p) => ({
                      ...p,
                      [course.id]: !p[course.id]
                    }));
                  }}
                >
                  {mathSeqOpen[course.id] ? "-" : "-"}
                </text>
              )}
            </g>
          );

          elements.push(
            <path
              key={`curve-${cluster}-${course.id}`}
              // (新!) 添加动画类
              className={`mindmap-path ${isCollapsed ? "collapsed" : ""}`}
              d={`
                M ${xStart + 70} ${cy}
                C ${xStart + 140} ${cy},
                  ${courseX - 200} ${courseY},
                  ${courseX - 90} ${courseY}
              `}
            />
          );

          // === sequence expansion === (保留你原来的逻辑)
          if (isSeqParent && mathSeqOpen[course.id]) {
            const seqMap = {
              "MATH 14X": ["MATH 141", "MATH 142", "MATH 143"],
              "MATH 16X": ["MATH 161", "MATH 162"],
              "MATH 17X": ["MATH 171", "MATH 172"]
            };
            const seq = seqMap[course.id] || [];
            let prevX = courseX + 120; // (修复!) 恢复你原来的 +120

            seq.forEach((sub, si) => {
              const sx = courseX + 260 + si * 150;
              const sy = courseY;
              nodePositions[sub] = { x: sx, y: sy };

              elements.push(
                <g
                  key={`${course.id}-seq-${sub}`}
                  onClick={() => onCourseClick && onCourseClick(sub)}
                  // (新!) 添加动画类
                  className={`mindmap-group ${isCollapsed ? "collapsed" : ""}`}
                  style={{ cursor: "pointer" }}
                >
                  <rect
                    className="math-seq-node mindmap-node" // (新!) 使用组合 CSS 类
                    x={sx - 65}
                    y={sy - 25}
                    width={130}
                    height={50}
                    rx={20}
                  />
                  <text
                    x={sx}
                    y={sy}
                    textAnchor="middle"
                    alignmentBaseline="middle"
                    fill="#000"
                    fontSize="13"
                    fontWeight="600"
                  >
                    {sub}
                  </text>
                </g>
              );

              elements.push(
                <path
                  key={`seq-arrow1-${course.id}-${sub}`}
                  // (新!) 添加动画类
                  className={`math-seq-path ${isCollapsed ? "collapsed" : ""}`}
                  d={`M ${prevX + 65} ${sy} L ${sx - 65} ${sy}`} // (修复!) 恢复你原来的 +65
                  markerEnd="url(#arrowhead)"
                />
              );
              prevX = sx;
            });
          }
        });
      }
    });

    return elements;
  };

  return (
    <svg width={1600} height={svgHeight}>
      {/* (新!) 在这里调用我们定义的样式组件 */}
      <MindmapStyles />
      
      <defs>
        {/* (保留你原来的 defs) */}
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