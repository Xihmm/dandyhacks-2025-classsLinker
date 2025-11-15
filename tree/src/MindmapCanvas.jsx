// src/MindmapCanvas.jsx
import React, { useMemo } from "react";

function buildEdgePath(from, to) {
  // 从 from 到 to 的贝塞尔曲线
  const startX = from.x + 70;
  const startY = from.y;
  const endX = to.x - 70;
  const endY = to.y;
  const control1X = startX + 60;
  const control1Y = startY;
  const control2X = endX - 60;
  const control2Y = endY;
  return `M ${startX},${startY} C ${control1X},${control1Y} ${control2X},${control2Y} ${endX},${endY}`;
}

export default function MindmapCanvas({ root }) {
  const {
    width,
    height,
    center,
    branchShapes,
    courseNodes,
    prereqEdges
  } = useMemo(() => {
    const width = 1400;
    const height = 800;
    const center = { x: 260, y: height / 2 };

    const branchColors = ["#ff6b6b", "#4dabf7", "#ffd43b", "#69db7c"];
    const lightColors = ["#ffe3e3", "#d0ebff", "#fff3bf", "#d3f9d8"];

    const branchShapes = [];
    const courseNodes = [];
    const prereqEdges = [];

    const nodePos = {};
    const courseMeta = [];

    const branches = root.children || [];
    const n = branches.length;

    branches.forEach((branch, idx) => {
      const color = branchColors[idx % branchColors.length];
      const light = lightColors[idx % lightColors.length];

      const by = center.y + (idx - (n - 1) / 2) * 160;
      const bx = center.x + 200;

      // 中心到分支的连接线
      branchShapes.push(
        <path
          key={`link-${branch.id}`}
          d={`M ${center.x},${center.y} C ${center.x + 90},${center.y} ${
            bx - 90
          },${by} ${bx},${by}`}
          stroke={color}
          strokeWidth="4"
          fill="none"
        />
      );

      // 分支大圆
      branchShapes.push(
        <g key={`branch-${branch.id}`}>
          <circle cx={bx} cy={by} r={50} fill={color} />
          <text
            x={bx}
            y={by}
            textAnchor="middle"
            alignmentBaseline="middle"
            fontSize="14"
            fill="#ffffff"
            fontWeight="600"
          >
            {branch.shortLabel || branch.id}
          </text>
        </g>
      );

      // 分支下面的小文字说明（含 choose one / two）
      branchShapes.push(
        <text
          key={`branch-label-${branch.id}`}
          x={bx}
          y={by + 75}
          textAnchor="middle"
          alignmentBaseline="hanging"
          fontSize="12"
          fill="#555"
        >
          {branch.label || branch.id}
        </text>
      );

      // ======== Math Path 分支（3 条路径） ========
      if (branch.type === "mathPaths") {
        const groups = branch.groups || [];
        const m = groups.length;

        const groupBaseX = center.x + 430;
        const courseStartX = center.x + 600;

        groups.forEach((g, gi) => {
          const gy = by + (gi - (m - 1) / 2) * 130;
          const gx = groupBaseX;

          // 路径小圆
          branchShapes.push(
            <g key={`group-${g.id}`}>
              <circle cx={gx} cy={gy} r={38} fill={light} stroke={color} />
              <text
                x={gx}
                y={gy}
                textAnchor="middle"
                alignmentBaseline="middle"
                fontSize="13"
                fill="#333"
                fontWeight="600"
              >
                {g.shortLabel || g.title}
              </text>
            </g>
          );

          const courses = g.courses || [];
          courses.forEach((c, ci) => {
            const cx = courseStartX + ci * 150;
            const cy = gy;

            nodePos[c.id] = { x: cx, y: cy };
            courseMeta.push({
              id: c.id,
              prereq: c.prereq || [],
              prereqOR: c.prereqOR || []
            });

            courseNodes.push(
              <g key={c.id}>
                <rect
                  x={cx - 70}
                  y={cy - 22}
                  width={140}
                  height={44}
                  rx={12}
                  fill="#ffffff"
                  stroke={color}
                  strokeWidth="2"
                />
                <text
                  x={cx}
                  y={cy}
                  textAnchor="middle"
                  alignmentBaseline="middle"
                  fontSize="13"
                  fill="#333"
                >
                  {c.id}
                </text>
              </g>
            );
          });
        });
      } else {
        // ======== 普通课程分支 ========
        const items = branch.children || [];
        const k = items.length;
        const courseX = center.x + 430;
        const baseY = by - ((k - 1) * 60) / 2;

        items.forEach((c, ci) => {
          const cy = baseY + ci * 60;
          const cx = courseX;

          nodePos[c.id] = { x: cx, y: cy };
          courseMeta.push({
            id: c.id,
            prereq: c.prereq || [],
            prereqOR: c.prereqOR || []
          });

          courseNodes.push(
            <g key={c.id}>
              <rect
                x={cx - 85}
                y={cy - 22}
                width={170}
                height={44}
                rx={14}
                fill="#ffffff"
                stroke={color}
                strokeWidth="2"
              />
              <text
                x={cx}
                y={cy}
                textAnchor="middle"
                alignmentBaseline="middle"
                fontSize="13"
                fill="#333"
              >
                {c.id}
              </text>
            </g>
          );
        });
      }
    });

    // ======== 前置课箭头（普通 + OR） ========
    courseMeta.forEach((meta) => {
      const to = nodePos[meta.id];
      if (!to) return;

      (meta.prereq || []).forEach((p) => {
        const from = nodePos[p];
        if (!from) return;
        prereqEdges.push(
          <path
            key={`edge-${p}-${meta.id}`}
            d={buildEdgePath(from, to)}
            stroke="#555"
            strokeWidth="1.8"
            fill="none"
            markerEnd="url(#arrow-head)"
          />
        );
      });

      (meta.prereqOR || []).forEach((p, index) => {
        const from = nodePos[p];
        if (!from) return;
        prereqEdges.push(
          <path
            key={`edge-or-${p}-${meta.id}-${index}`}
            d={buildEdgePath(from, to)}
            stroke="#888"
            strokeWidth="1.5"
            strokeDasharray="5 4"
            fill="none"
            markerEnd="url(#arrow-head)"
          />
        );
      });
    });

    return { width, height, center, branchShapes, courseNodes, prereqEdges };
  }, [root]);

  return (
    <svg width={width} height={height}>
      <defs>
        <marker
          id="arrow-head"
          markerWidth="10"
          markerHeight="10"
          refX="8"
          refY="5"
          orient="auto"
        >
          <path d="M0,0 L10,5 L0,10" fill="#555" />
        </marker>
      </defs>

      {/* 中心主题节点 */}
      <g>
        <rect
          x={center.x - 90}
          y={center.y - 28}
          width={180}
          height={56}
          rx={28}
          fill="#1b1f3b"
        />
        <text
          x={center.x}
          y={center.y}
          textAnchor="middle"
          alignmentBaseline="middle"
          fontSize="18"
          fill="#ffffff"
          fontWeight="600"
        >
          CS Major
        </text>
      </g>

      {/* 先画前置箭头，再画节点，避免箭头压在节点上层 */}
      {prereqEdges}
      {branchShapes}
      {courseNodes}
    </svg>
  );
}