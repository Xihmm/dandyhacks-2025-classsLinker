import React, { useMemo } from "react";
import rawData from "../data/mock-data.json";

// 从 mock-data.json 取出课程节点和连线
const courseNodes = rawData.nodes ?? rawData;
const courseLinks = rawData.links ?? [];

// id -> 课程对象
const idToCourse = new Map();
courseNodes.forEach((c) => {
  if (c && c.id) {
    idToCourse.set(c.id, c);
  }
});

// 根据 links 构建无向邻接表
function buildAdjacency(nodes, links) {
  const adj = new Map();

  nodes.forEach((n) => {
    if (n && n.id) {
      adj.set(n.id, new Set());
    }
  });

  links.forEach((link) => {
    const { source, target } = link;
    if (!source || !target) return;

    if (!adj.has(source)) adj.set(source, new Set());
    if (!adj.has(target)) adj.set(target, new Set());

    adj.get(source).add(target);
    adj.get(target).add(source); // 无向，用于 distance 计算
  });

  return adj;
}

const ADJACENCY = buildAdjacency(courseNodes, courseLinks);

// 用 BFS 计算从 root 出发的最短“边距离”
function computeDistances(rootId) {
  const dist = new Map();
  if (!rootId || !ADJACENCY.has(rootId)) return dist;

  const q = [rootId];
  dist.set(rootId, 0);

  while (q.length > 0) {
    const cur = q.shift();
    const curDist = dist.get(cur);

    for (const nb of ADJACENCY.get(cur) || []) {
      if (!dist.has(nb)) {
        dist.set(nb, curDist + 1);
        q.push(nb);
      }
    }
  }

  return dist; // Map: id -> 最短边距离
}

// wordcloud 颜色表
const COLORS = [
  "#7FA7FF",
  "#FF8C8C",
  "#FFC86B",
  "#9FE3A2",
  "#A785FF",
  "#FF9AE3",
  "#6FC6FF",
  "#F6A27B",
];

function colorForId(id) {
  let sum = 0;
  for (let i = 0; i < id.length; i++) {
    sum += id.charCodeAt(i);
  }
  return COLORS[sum % COLORS.length];
}

function randomSize() {
  return 18 + Math.random() * 16; // 18–34 之间
}

// 根据距离生成“云”布局：中心 + 多圈
function layoutNodes(rootId) {
  const distances = computeDistances(rootId);

  const ringBuckets = new Map(); // level -> [id]
  let maxKnown = 0;
  distances.forEach((d) => {
    if (d > maxKnown) maxKnown = d;
  });
  const fallbackRing = maxKnown + 1;

  courseNodes.forEach((course) => {
    if (!course || !course.id) return;
    const id = course.id;
    const level = distances.has(id) ? distances.get(id) : fallbackRing;
    if (!ringBuckets.has(level)) ringBuckets.set(level, []);
    ringBuckets.get(level).push(id);
  });

  const laidOut = [];

  const CENTER_X = 50;
  const CENTER_Y = 50;
  const RADIUS_STEP = 14; // 每一圈的半径（百分比）

  const sortedLevels = Array.from(ringBuckets.keys()).sort((a, b) => a - b);

  sortedLevels.forEach((level) => {
    const ids = ringBuckets.get(level) || [];
    if (ids.length === 0) return;

    if (level === 0) {
      // 中心课
      ids.forEach((id) => {
        laidOut.push({
          id,
          x: CENTER_X,
          y: CENTER_Y,
          level,
          course: idToCourse.get(id) || null,
          size: randomSize(),
        });
      });
    } else {
      const radius = RADIUS_STEP * level;
      const count = ids.length;
      ids.forEach((id, index) => {
        const angle = (2 * Math.PI * index) / count;
        const x = CENTER_X + radius * Math.cos(angle);
        const y = CENTER_Y + radius * Math.sin(angle);
        laidOut.push({
          id,
          x,
          y,
          level,
          course: idToCourse.get(id) || null,
          size: randomSize(),
        });
      });
    }
  });

  return laidOut;
}

function CourseGraph({
  onNodeSelect,
  highlightedPath = [],
  focusedCourseId = null,
}) {
  // 默认 root：mock-data 中的第一门课
  const defaultRootId = courseNodes[0]?.id ?? null;
  // 当前“被选中 / 聚焦”的课由外部驱动
  const rootId = focusedCourseId ?? defaultRootId;

  // ★★★ 关键：每次 rootId 变化，就按“边距离”重新排布整朵云 ★★★
  const laidOutNodes = useMemo(() => layoutNodes(rootId), [rootId]);

  const handleNodeClick = (id) => {
    const course = idToCourse.get(id) || null;
    if (onNodeSelect) {
      onNodeSelect(id, course); // 交给 App 去更新 focusedCourseId
    }
    console.log("Clicked course:", id, course);
  };

  return (
    <div
      style={{
        width: "100%",
        height: "100%",
        boxSizing: "border-box",
        background: "#ffffff",
        position: "relative",
        overflow: "hidden",
      }}
    >
      {laidOutNodes.map((node) => {
        const isRoot = node.id === rootId;
        const isHighlighted = highlightedPath.includes(node.id);

        // 中心最大，其余基于随机 size 略微浮动
        const base = isRoot ? 36 : node.size;
        const size = Math.max(
          14,
          isRoot ? base : base - (node.level ?? 0) * 2
        );

        const color = colorForId(node.id);

        return (
          <span
            key={node.id}
            onClick={() => handleNodeClick(node.id)}
            style={{
              position: "absolute",
              left: `${node.x}%`,
              top: `${node.y}%`,
              transform: "translate(-50%, -50%)",
              fontSize: `${size}px`,
              fontWeight: isRoot ? 700 : 500,
              color,
              cursor: "pointer",
              whiteSpace: "nowrap",
              textShadow: isHighlighted
                ? "0 0 8px rgba(255,90,95,0.6)"
                : "0 0 4px rgba(0,0,0,0.12)",
              transition:
                "left 0.4s ease, top 0.4s ease, font-size 0.2s ease, text-shadow 0.2s ease",
            }}
          >
            {node.id}
          </span>
        );
      })}
    </div>
  );
}

export default CourseGraph;