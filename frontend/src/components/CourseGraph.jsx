import React, { useMemo } from "react";
import rawData from "../data/mock-data.json";

// 所有原始节点 + 边
const rawNodes = rawData.nodes ?? rawData;
const courseLinks = rawData.links ?? [];

// 只展示非 EQUIV-xxxx 课程
const courseNodes = rawNodes.filter(
  (c) => c && c.id && !c.id.startsWith("EQUIV-")
);

// id -> course 映射（包含 EQUIV，在相似度和距离里都可以用）
const idToCourse = new Map();
rawNodes.forEach((c) => {
  if (c && c.id) {
    idToCourse.set(c.id, c);
  }
});

// 根据传入的 id（可能带空格/大小写不同）在现有课程中找到匹配的真实 id
function resolveCourseId(inputId) {
  if (!inputId) return null;

  // 先尝试原始 id
  if (idToCourse.has(inputId)) return inputId;

  const norm = String(inputId).replace(/\s+/g, "").toUpperCase();

  // EQUIV- 节点不要作为 root，只找非 EQUIV 的真实课程
  for (const key of idToCourse.keys()) {
    const keyStr = String(key);
    if (keyStr.toUpperCase().startsWith("EQUIV-")) continue;
    const kNorm = keyStr.replace(/\s+/g, "").toUpperCase();
    if (kNorm === norm) {
      return keyStr;
    }
  }

  return null;
}

// 构建无向邻接表，用于 BFS 计算图距离（包括 EQUIV）
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
    adj.get(target).add(source);
  });

  return adj;
}

const ADJ = buildAdjacency(rawNodes, courseLinks);

// BFS：从 root 出发的最短 hop 数
function computeDistances(rootId) {
  const dist = new Map();
  if (!rootId || !ADJ.has(rootId)) return dist;

  const q = [rootId];
  dist.set(rootId, 0);

  while (q.length > 0) {
    const cur = q.shift();
    const curDist = dist.get(cur);

    for (const nb of ADJ.get(cur) || []) {
      if (!dist.has(nb)) {
        dist.set(nb, curDist + 1);
        q.push(nb);
      }
    }
  }

  return dist; // Map: id -> hops
}

// 小工具：确保是数组
function arr(x) {
  return Array.isArray(x) ? x : [];
}

// 颜色：根据 id 哈希，稳定但看起来随机
const COLOR_POOL = [
  "#5B8FF9",
  "#61DDAA",
  "#65789B",
  "#F6BD16",
  "#7262FD",
  "#78D3F8",
  "#F6903D",
  "#F08BB4",
];

function colorForId(id) {
  let sum = 0;
  for (let i = 0; i < id.length; i++) {
    sum += id.charCodeAt(i);
  }
  return COLOR_POOL[sum % COLOR_POOL.length];
}

// （现在字号不用这个哈希版了，可以留着备选）
function sizeForId(id) {
  let sum = 0;
  for (let i = 0; i < id.length; i++) {
    sum = (sum * 31 + id.charCodeAt(i)) >>> 0;
  }
  const base = 20;
  const span = 18; // 20–38
  return base + (sum % span);
}

/**
 * rootCourse 和 course 的相似度：
 * - cluster 一样：+1.6
 * - department 一样：+1.0
 * - 共同先修：每个 +0.5，上限 +1.2
 * - 直接先修关系（两者互为先修）：+2.5
 *
 * 相似度越大，后面圈数越小（更靠近）。
 */
function similarityScore(rootCourse, course) {
  if (!rootCourse || !course) return 0;
  if (rootCourse.id === course.id) return 0; // root 自身单独处理

  let score = 0;

  // cluster 相同
  if (rootCourse.cluster && course.cluster) {
    if (rootCourse.cluster === course.cluster) {
      score += 1.6;
    }
  }

  // department 相同
  if (rootCourse.department && course.department) {
    if (rootCourse.department === course.department) {
      score += 1.0;
    }
  }

  const rootPre = new Set(arr(rootCourse.prerequisites));
  const coursePre = new Set(arr(course.prerequisites));

  // 共同先修
  if (rootPre.size && coursePre.size) {
    let overlap = 0;
    rootPre.forEach((p) => {
      if (coursePre.has(p)) overlap += 1;
    });

    if (overlap > 0) {
      const extra = Math.min(1.2, 0.5 * overlap);
      score += extra;
    }
  }

  // 直接先修关系：root 的先修里出现 course.id，或 course 的先修里出现 root.id
  if (rootPre.has(course.id) || coursePre.has(rootCourse.id)) {
    score += 2.5;
  }

  return score;
}

// 根据图距离 + 相似度给课程一个“重要性字号”
// 越接近 root、越相似，字号越大；越远越小
function sizeForCourse(id, graphLevel, sim, rootId) {
  // root 本身最大
  if (id === rootId) {
    return 40;
  }

  // 基础 18px，图距离每增加一圈略微变小，相似度每 +1 明显变大
  let size = 18 + 4 * sim - 1.5 * Math.min(graphLevel, 4);

  // 做一下 clamp，别太极端
  if (size < 12) size = 12;
  if (size > 30) size = 30;

  return size;
}

/**
 * 根据图距离 + 相似度决定圈数并排版：
 * - root 始终固定在中心
 * - 其它课程：graphLevel 小、sim 大 → level 小（更靠近）
 * - effectiveLevel ≈ graphLevel + 0.5 - sim，最小从 1 圈开始
 * - 同一圈里按角度均匀排开，大圈课程太多时拆成内外双环
 */
function layoutNodes(rootId) {
  const distances = computeDistances(rootId);

  // BFS 没覆盖到的节点，用“最大已知距离 + 2”作基准
  let maxKnown = 0;
  distances.forEach((d) => {
    if (d > maxKnown) maxKnown = d;
  });
  const fallbackRing = maxKnown + 2;

  const rootCourse = rootId ? idToCourse.get(rootId) : null;
  const rootCourseForLayout = rootCourse || (rootId ? { id: rootId } : null);

  // level -> [{ id, graphLevel, sim }]
  const ringBuckets = new Map();

  courseNodes.forEach((course) => {
    if (!course || !course.id) return;
    const id = course.id;

    // root 自己单独放在中心，不参与圈分配
    if (id === rootId) return;

    const graphLevel = distances.has(id) ? distances.get(id) : fallbackRing;
    const sim = similarityScore(rootCourse, course);

    const effectiveLevelRaw = graphLevel + 0.5 - sim;
    const effectiveLevel = Math.max(0, effectiveLevelRaw);
    // 至少从第 1 圈开始，避免把别的课挤进中心
    const level = Math.max(1, Math.round(effectiveLevel));

    if (!ringBuckets.has(level)) ringBuckets.set(level, []);
    ringBuckets.get(level).push({ id, graphLevel, sim });
  });

  const laidOut = [];

  const CENTER_X = 50;
  const CENTER_Y = 50;
  const RADIUS_STEP = 18; // 每一圈半径差再拉大一点，减少重叠

  // 先把 root 放在中心：即便 mock-data 里没有完整信息，也至少显示一个 root 节点
  if (rootId && rootCourseForLayout) {
    const rootSize = sizeForCourse(rootId, 0, 999, rootId); // 会被函数内部强制成最大字号
    laidOut.push({
      id: rootId,
      x: CENTER_X,
      y: CENTER_Y,
      course: rootCourseForLayout,
      level: 0,
      size: rootSize,
    });
  }

  const sortedLevels = Array.from(ringBuckets.keys()).sort((a, b) => a - b);

  sortedLevels.forEach((level) => {
    const items = ringBuckets.get(level) || [];
    if (!items.length) return;

    const count = items.length;
    const baseRadius = RADIUS_STEP * level;

    // 如果这一圈课程很多，就拆成内外两个半径，交替放置
    let innerRadius = baseRadius;
    let outerRadius = baseRadius;
    const useDoubleRing = count > 16;

    if (useDoubleRing) {
      innerRadius = baseRadius - 4;
      outerRadius = baseRadius + 4;
    }

    items.forEach((item, index) => {
      const angle = (2 * Math.PI * index) / count;
      const r = useDoubleRing && index % 2 === 0 ? outerRadius : innerRadius;

      const x = CENTER_X + r * Math.cos(angle);
      const y = CENTER_Y + r * Math.sin(angle);
      const size = sizeForCourse(item.id, item.graphLevel, item.sim, rootId);
      laidOut.push({
        id: item.id,
        x,
        y,
        course: idToCourse.get(item.id) || null,
        level,
        size,
      });
    });
  });

  return laidOut;
}

function CourseGraph({
  onNodeSelect,
  highlightedPath = [],
  focusedCourseId = null,
}) {
  const defaultRootId = courseNodes[0]?.id ?? null;

  // 先把外部传进来的 focusedCourseId 解析成真实存在的课程 id
  const resolvedFocusId = resolveCourseId(focusedCourseId);
  const effectiveFocusId = resolvedFocusId ?? defaultRootId;

  const laidOutNodes = useMemo(
    () => layoutNodes(effectiveFocusId),
    [effectiveFocusId]
  );

  const handleNodeClick = (id) => {
    const course = idToCourse.get(id) || null;
    if (onNodeSelect) {
      onNodeSelect(id, course);
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
        const isFocused = node.id === effectiveFocusId;
        const isHighlighted = highlightedPath.includes(node.id);

        const x = node.x;
        const y = node.y;

        const baseSize = node.size || 24;
        const size = isFocused ? baseSize * 1.7 : baseSize;

        const color = colorForId(node.id);

        return (
          <span
            key={node.id}
            onClick={() => handleNodeClick(node.id)}
            style={{
              position: "absolute",
              left: `${x}%`,
              top: `${y}%`,
              transform: "translate(-50%, -50%)",
              fontSize: `${size}px`,
              fontWeight: isFocused ? 700 : 500,
              color,
              cursor: "pointer",
              whiteSpace: "nowrap",
              textShadow: isHighlighted
                ? "0 0 8px rgba(255,90,95,0.6)"
                : "0 0 4px rgba(0,0,0,0.12)",
              transition:
                "left 0.35s ease, top 0.35s ease, font-size 0.2s ease, text-shadow 0.2s ease",
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