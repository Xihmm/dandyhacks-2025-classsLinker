import React, { useState, useMemo } from "react";

export default function CsMindmap({ data, onCourseClick }) {
  const [svgHeight, setSvgHeight] = useState(800);
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
  const [writingSubOpen, setWritingSubOpen] = useState({});

  const clusterColors = {
    "Core": { bg: "#6ca0ff", stroke: "#3c6ddf" },
    "Writing": { bg: "#c28bff", stroke: "#9d63e5" },
    "Additional Math": { bg: "#6cd9c3", stroke: "#42b39d" },
    "Foundations": { bg: "#ffb066", stroke: "#e68a33" }
  };

  const formatPrereq = (prereqs = []) =>
    prereqs.map((p) => p.replace(/^EQUIV-/, "")).join(", ");

  const expandPrereqList = (prereqs = []) =>
    prereqs.map((p) => p.replace(/^EQUIV-/, ""));

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
    xStart += 230;

    clusterNames.forEach((cluster, ci) => {
      const cy = clusterYPositions[ci];

      nodePositions[`cluster_${cluster}`] = { x: xStart, y: cy };

      elements.push(
        <g
          key={cluster}
          style={{ cursor: "pointer" }}
          onClick={() =>
            setCollapsed((p) => ({ ...p, [cluster]: !p[cluster] }))
          }
        >
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
          <text
            x={xStart}
            y={cy}
            textAnchor="middle"
            alignmentBaseline="middle"
            fill="#fff"
            fontSize="14"
          >
            {cluster}
          </text>

          {/* cluster expand / collapse icon */}
          <text
            x={xStart + 80}
            y={cy}
            fontSize="20"
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
        // Special nested rendering for Writing cluster
        if (cluster === "Writing") {
          // Group Writing courses by prefix
          const writingCourses = clusters[cluster] || [];
          const subgroupMap = { CSC: [], WRTG: [], PHIL: [] };
          writingCourses.forEach((course) => {
            if (/^CSC/.test(course.id)) subgroupMap.CSC.push(course);
            else if (/^WRTG/.test(course.id)) subgroupMap.WRTG.push(course);
            else if (/^PHIL/.test(course.id)) subgroupMap.PHIL.push(course);
          });
          // Layout: vertical stack of subgroups, each with vertical stack of courses
          const subgroupNames = Object.keys(subgroupMap).filter(
            (sg) => subgroupMap[sg].length > 0
          );
          // Subgroup layout parameters
          const SUBGROUP_HEADER_HEIGHT = 55;
          const SUBGROUP_COURSE_HEIGHT = 68;
          const SUBGROUP_SPACING = 32;
          // Compute subgroup Y positions
          let subgroupY = cy - Math.max((subgroupNames.length * (SUBGROUP_HEADER_HEIGHT + SUBGROUP_SPACING)) / 2, 0) + 90;
          // For connector from cluster to first subgroup
          let clusterToFirstY = null;
          subgroupNames.forEach((sg, sgi) => {
            const sgY = subgroupY;
            const subgroupNodeX = xStart + 250; //紫色框的X坐标
            const courses = subgroupMap[sg];
            const isOpen = writingSubOpen[sg] === true;

            // Draw subgroup rectangle and label (clickable parent)
            elements.push(
              <g
                key={`writing-subgroup-${sg}`}
                style={{ cursor: "pointer" }}
                onClick={() =>
                  setWritingSubOpen((p) => ({
                    ...p,
                    [sg]: !isOpen,
                  }))
                }
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
                  style={{ transition: "all 0.35s ease" }}
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
                {/* subgroup expand / collapse icon */}
                <text
                  x={subgroupNodeX + 60}
                  y={sgY}
                  fontSize="18"
                >
                  {isOpen ? "-" : "+"}
                </text>
              </g>
            );

            // Draw connector from cluster to subgroup
            if (sgi === 0) clusterToFirstY = sgY;
            elements.push(
              <path
                key={`curve-writing-cluster-${sg}`}
                style={{ transition: "all 0.35s ease" }}
                d={//紫色曲线开始的坐标
                 `M ${xStart + 70} ${cy} 
                  C ${xStart + 150} ${cy},
                    ${subgroupNodeX - 110} ${sgY},
                    ${subgroupNodeX - 68} ${sgY}
                `}
                fill="none"
                stroke="#b48bda"
                strokeWidth="2"
              />
            );

            // Render courses under subgroup only if open
            if (isOpen) {
              courses.forEach((course, cidx) => {
                const courseX = subgroupNodeX + 220;
                const courseY = sgY + cidx * SUBGROUP_COURSE_HEIGHT;
                nodePositions[course.id] = { x: courseX, y: courseY };

                const hasPrereq =
                  course.prerequisites && course.prerequisites.length > 0;
                const expandedPrereqs = hasPrereq
                  ? expandPrereqList(course.prerequisites)
                  : [];

                // Course node
                elements.push(
                  <g
                    key={course.id}
                    onClick={() => {
                      onCourseClick && onCourseClick(course.id);
                    }}
                    style={{
                      cursor: "pointer",
                      transition: "all 0.35s ease"
                    }}
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
                        {hasPrereq
                          ? "Pre: " + formatPrereq(course.prerequisites)
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
                // Connector from subgroup to course
                elements.push(
                  <path
                    key={`curve-writing-${sg}-${course.id}`}
                    style={{ transition: "all 0.35s ease" }}
                    d={`
                      M ${subgroupNodeX + 68} ${sgY}
                      C ${subgroupNodeX + 130} ${sgY},
                        ${courseX - 150} ${courseY},
                        ${courseX - 80} ${courseY}
                    `}
                    fill="none"
                    stroke="#bbb"
                    strokeWidth="1.5"
                  />
                );

                // Always show prereqs (no collapse/expand, no arrow from parent)
                if (hasPrereq && expandedPrereqs.length > 0) {
                  const PREREQ_WIDTH = 180;
                  const baseX = courseX + 260;
                  expandedPrereqs.forEach((pid, pidx) => {
                    const sx = baseX + pidx * PREREQ_WIDTH;
                    const sy = courseY;

                    // Normalize pid for special-case handling
                    const normalizedPid = pid.replace(/^EQUIV-/, "").replace(/\s+/g, "");

                    nodePositions[pid] = { x: sx, y: sy };

                    // prereq capsule styled like Foundations courses
                    const isSeqParentPrereq =
                      normalizedPid === "MATH14X" || normalizedPid === "MATH16X";

                    // Special-case: if prereq is "MATH17X" (with or without space / EQUIV-), render only 171->172 sequence here (no orange capsule)
                    if (normalizedPid === "MATH17X") {
                      const seq = ["MATH 171", "MATH 172"];
                      let prevSeqCenterX = null;
                      seq.forEach((sub, si) => {
                        const ssx = sx + si * 180;
                        const ssy = sy;
                        nodePositions[sub] = { x: ssx, y: ssy };
                        elements.push(
                          <g
                            key={`${course.id}-prereq-${pid}-seq-${sub}`}
                            onClick={() => onCourseClick && onCourseClick(sub)}
                            style={{ cursor: "pointer", transition: "all 0.35s ease" }}
                          >
                            <rect
                              x={ssx - 65}
                              y={ssy - 25}
                              width={130}
                              height={50}
                              rx={20}
                              fill="#ffd2a6"
                              stroke="#c78b53"
                              strokeWidth="1.5"
                            />
                            <text
                              x={ssx}
                              y={ssy}
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
                        // Draw arrow segment:
                        if (si > 0) {
                          elements.push(
                            <path
                              key={`prereq-seq-arrow-writing-${course.id}-${pid}-${sub}`}
                              d={`M ${ssx - 180 + 65} ${ssy} L ${ssx - 65} ${ssy}`}
                              fill="none"
                              stroke="#d8a875"
                              strokeWidth="2"
                              markerEnd="url(#arrowhead)"
                            />
                          );
                        }
                        prevSeqCenterX = ssx;
                      });
                      return;
                    }

                    elements.push(
                      <g
                        key={`${course.id}-prereq-${pid}`}
                        onClick={
                          isSeqParentPrereq
                            ? undefined
                            : () => onCourseClick && onCourseClick(pid)
                        }
                        style={{
                          cursor: isSeqParentPrereq ? "default" : "pointer",
                          transition: "all 0.35s ease",
                        }}
                      >
                        <rect
                          x={sx - 90}
                          y={sy - 30}
                          width={180}
                          height={60}
                          rx={30}
                          fill={clusterColors["Foundations"]?.bg || "#ffb066"}
                          stroke={clusterColors["Foundations"]?.stroke || "#e68a33"}
                          strokeWidth="1.5"
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
                          {pid}
                        </text>
                      </g>
                    );
                  });
                }
              });
            }

            // Update subgroupY for next subgroup; if collapsed, ignore course height
            const visibleCount = isOpen ? courses.length : 0;
            subgroupY +=
              SUBGROUP_HEADER_HEIGHT +
              Math.max(visibleCount - 1, 0) * SUBGROUP_COURSE_HEIGHT +
              SUBGROUP_SPACING;
          });
        } else {
          // Default: flat course rendering
          const courses = clusters[cluster];
          courses.forEach((course, idx) => {
            const isSeqParent =
              course.id === "MATH 14X" || course.id === "MATH 16X" || course.id === "MATH 17X";

            const courseX = xStart + 320;
            const courseY = cy + idx * COURSE_HEIGHT;

            nodePositions[course.id] = { x: courseX, y: courseY };

          const hasPrereq =
            course.prerequisites && course.prerequisites.length > 0;
          const expandedPrereqs = hasPrereq
            ? expandPrereqList(course.prerequisites)
            : [];

            // render parent course box
          elements.push(
            <g
              key={course.id}
              style={{ cursor: "pointer", transition: "all 0.35s ease" }}
              onClick={() => {
                if (isSeqParent) {
                  setMathSeqOpen((p) => ({
                    ...p,
                    [course.id]: !p[course.id],
                  }));
                } else {
                  onCourseClick && onCourseClick(course.id);
                }
              }}
            >
                <rect
                  className="mindmap-node"
                  x={courseX - 90}
                  y={courseY - 30}
                  width={180}
                  height={60}
                  rx={30}
                  fill={clusterColors[cluster]?.bg || "#ffffff"}
                  stroke={clusterColors[cluster]?.stroke || "#999"}
                  strokeWidth="1.5"
                />

                {/* Prereq small text */}
                <foreignObject
                  x={courseX - 90}
                  y={courseY - 22}
                  width={180}
                  height={24}
                  style={{ overflow: "hidden" }}
                >
                  <div
                    style={{
                      fontSize: "11px",
                      color: "#fff",
                      textAlign: "center",
                      lineHeight: "12px",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      wordWrap: "break-word",
                    }}
                  >
                    {hasPrereq
                      ? "Pre: " + formatPrereq(course.prerequisites)
                      : ""}
                  </div>
                </foreignObject>

                {/* course ID */}
                <foreignObject
                  x={courseX - 90}
                  y={courseY - 4}
                  width={180}
                  height={40}
                  style={{ overflow: "hidden" }}
                >
                  <div
                    style={{
                      fontSize: "14px",
                      color: "#000",
                      textAlign: "center",
                      lineHeight: "14px",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      wordWrap: "break-word",
                    }}
                  >
                    {course.id}
                  </div>
                </foreignObject>

            {isSeqParent && (
              <text
                x={courseX + 70}
                y={courseY}
                fontSize="20"
              >
                {mathSeqOpen[course.id] ? "-" : "+"}
              </text>
            )}
              </g>
            );

            // connecting curve from cluster
            elements.push(
              <path
                key={`curve-${cluster}-${course.id}`}
                d={`
                  M ${xStart + 70} ${cy}
                  C ${xStart + 140} ${cy},
                    ${courseX - 200} ${courseY},
                    ${courseX - 90} ${courseY}
                `}
                fill="none"
                stroke="#bbb"
                strokeWidth="1.5"
              />
            );

          // Always show prereqs (no collapse/expand, no arrow from parent)
          if (hasPrereq && expandedPrereqs.length > 0) {
            const PREREQ_WIDTH = 180;
            const baseX = courseX + 260;
            expandedPrereqs.forEach((pid, pidx) => {
              const sx = baseX + pidx * PREREQ_WIDTH;
              const sy = courseY;

              // Normalize pid for special-case handling
              const normalizedPid = pid.replace(/^EQUIV-/, "").replace(/\s+/g, "");

              nodePositions[pid] = { x: sx, y: sy };

              const isSeqParentPrereq =
                normalizedPid === "MATH14X" || normalizedPid === "MATH16X";

              // Special-case: if prereq is "MATH17X" (with or without space / EQUIV-), render only 171->172 sequence here (no orange capsule)
              if (normalizedPid === "MATH17X") {
                const seq = ["MATH 171", "MATH 172"];
                let prevSeqCenterX = null;
                seq.forEach((sub, si) => {
                  const ssx = sx + si * 180;
                  const ssy = sy;
                  nodePositions[sub] = { x: ssx, y: ssy };
                  elements.push(
                    <g
                      key={`${course.id}-prereq-${pid}-seq-${sub}`}
                      onClick={() => onCourseClick && onCourseClick(sub)}
                      style={{ cursor: "pointer", transition: "all 0.35s ease" }}
                    >
                      <rect
                        x={ssx - 65}
                        y={ssy - 25}
                        width={130}
                        height={50}
                        rx={20}
                        fill="#ffd2a6"
                        stroke="#c78b53"
                        strokeWidth="1.5"
                      />
                      <text
                        x={ssx}
                        y={ssy}
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
                  // Draw arrow segment:
                  if (si > 0) {
                    elements.push(
                      <path
                        key={`prereq-seq-arrow-${course.id}-${pid}-${sub}`}
                        d={`M ${ssx - 180 + 65} ${ssy} L ${ssx - 65} ${ssy}`}
                        fill="none"
                        stroke="#d8a875"
                        strokeWidth="2"
                        markerEnd="url(#arrowhead)"
                      />
                    );
                  }
                  prevSeqCenterX = ssx;
                });
                return;
              }

              elements.push(
                <g
                  key={`${course.id}-prereq-${pid}`}
                  onClick={
                    isSeqParentPrereq
                      ? undefined
                      : () => onCourseClick && onCourseClick(pid)
                  }
                  style={{
                    cursor: isSeqParentPrereq ? "default" : "pointer",
                    transition: "all 0.35s ease",
                  }}
                >
                  <rect
                    x={sx - 90}
                    y={sy - 30}
                    width={180}
                    height={60}
                    rx={30}
                    fill={clusterColors["Foundations"]?.bg || "#ffb066"}
                    stroke={clusterColors["Foundations"]?.stroke || "#e68a33"}
                    strokeWidth="1.5"
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
                    {pid}
                  </text>
                </g>
              );
            });
          }

            // === sequence expansion ===
            if (isSeqParent && mathSeqOpen[course.id]) {
              const seqMap = {
                "MATH 14X": ["MATH 141", "MATH 142", "MATH 143"],
                "MATH 16X": ["MATH 161", "MATH 162"],
                "MATH 17X": ["MATH 171", "MATH 172"]
              };
              const seq = seqMap[course.id] || [];

              // prevX will track the center X of the previous sequence capsule
              let prevX = null;

              seq.forEach((sub, si) => {
                const sx = courseX + 260 + si * 220;
                const sy = courseY;

                nodePositions[sub] = { x: sx, y: sy };

                elements.push(
                  <g
                    key={`${course.id}-seq-${sub}`}
                    onClick={() => onCourseClick && onCourseClick(sub)}
                    style={{ cursor: "pointer", transition: "all 0.35s ease" }}
                  >
                    <rect
                      x={sx - 65}
                      y={sy - 25}
                      width={130}
                      height={50}
                      rx={20}
                      fill="#ffd2a6"
                      stroke="#c78b53"
                      strokeWidth="1.5"
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

                // Draw arrow segment:
                //  - for the first child, from the parent capsule's right edge
                //  - for later children, from the previous child capsule
                const startX =
                  si === 0 ? courseX + 90 : prevX + 65; // parent right edge or previous child right edge

                elements.push(
                  <path
                    key={`seq-arrow1-${course.id}-${sub}`}
                    d={`M ${startX} ${sy} L ${sx - 65} ${sy}`}
                    fill="none"
                    stroke="#d8a875"
                    strokeWidth="2"
                    markerEnd="url(#arrowhead)"
                  />
                );

                // Update prevX for next segment (center of this capsule)
                prevX = sx;
              });
            }
          });
        }
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