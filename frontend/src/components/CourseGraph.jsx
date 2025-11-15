// src/CourseGraph.js
// 这是一个 P1/P2 需要创建的 React 组件

import React, { useEffect, useState } from 'react';
import ReactFlow, {
    useNodesState,
    useEdgesState,
    Controls,
    Background,
} from 'reactflow';

// 别忘了导入 CSS，否则图表是空白的!
import 'reactflow/dist/style.css';

// ----------------------------------------------------
// 1. "翻译" 助手函数
// ----------------------------------------------------

/**
 * 把 P4 的 "nodes" 列表转换成 React Flow 需要的 "rfNodes" 列表
 */
function translateApiNodesToRfNodes(apiNodes) {
    return apiNodes.map((node, index) => {
        return {
            id: node.id,
            // 我们把“随机位置”作为“阶段一”的布局
            position: { x: (index * 50) % 800, y: Math.random() * 500 },
            data: {
                // 'label' 里的内容会显示在节点上
                label: `${node.title} (${node.department})`
            },
            // (可选) 我们可以根据 'department' 给节点设置不同的样式
            // type: node.department === 'CSC' ? 'special' : 'default'
        };
    });
}

/**
 * 把 P4 的 "links" 列表转换成 React Flow 需要的 "rfEdges" 列表
 */
function translateApiLinksToRfEdges(apiLinks) {
    return apiLinks.map((link) => {
        return {
            id: `e-${link.source}-${link.target}`, // React Flow 需要一个唯一的 'id'
            source: link.source, // 线的起点 (课程 ID)
            target: link.target, // 线的终点 (课程 ID)
            
            // 额外功能: 我们可以把 P4 的 'type' 显示为线的标签
            label: link.type,
            
            // 额外功能: 让 "prerequisite" 的线动起来！
            animated: link.type === 'prerequisite',
            
            // 额外功能: 让 "prerequisite" 的线更突出
            style: {
                stroke: link.type === 'prerequisite' ? '#f00' : '#aaa', // 红色
                strokeWidth: link.type === 'prerequisite' ? 2 : 1,
            },
        };
    });
}


// ----------------------------------------------------
// 2. 核心的 React 组件
// ----------------------------------------------------
function CourseGraph() {
    // 准备 React Flow 需要的 'state'
    const [nodes, setNodes, onNodesChange] = useNodesState([]);
    const [edges, setEdges, onEdgesChange] = useEdgesState([]);

    // "useEffect" 会在组件加载时自动运行一次
    useEffect(() => {
        // 去 P3 (你) 的后端 API 拿数据
        fetch('http://127.0.0.1:5000/api/courses')
            .then(response => response.json())
            .then(data => {
                //  data 就是 P4 的那个 { nodes: [...], links: [...] } 对象
                
                // --- 这就是“阶段一”的核心 ---
                // 1. 翻译 P4 的 'nodes'
                const rfNodes = translateApiNodesToRfNodes(data.nodes);
                
                // 2. 翻译 P4 的 'links'
                const rfEdges = translateApiLinksToRfEdges(data.links);
                // -----------------------------

                // 3. 把翻译好的数据“装载”到 React Flow 画布上
                setNodes(rfNodes);
                setEdges(rfEdges);
            })
            .catch(error => {
                console.error("P3 的 API 挂了! 赶紧去 @Yangrui!", error);
            });
    }, []); // '[]' 确保这个 fetch 只运行一次

    // 3. 渲染 (JRX)
    return (
        // 需要给 React Flow 一个明确的高度，否则它不显示
        <div style={{ width: '100%', height: '90vh', border: '1px solid #ccc' }}>
            <ReactFlow
                nodes={nodes}
                edges={edges}
                onNodesChange={onNodesChange}
                onEdgesChange={onEdgesChange}
                fitView // 自动缩放，让所有节点都可见
            >
                <Controls />  {/* 右下角的 +/- 缩放按钮 */}
                <Background /> {/* 背景网格 */}
            </ReactFlow>
        </div>
    );
}

export default CourseGraph;