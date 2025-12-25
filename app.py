import json
import google.generativeai as genai

from flask import Flask, jsonify, request
from flask_cors import CORS  
from collections import deque



app = Flask(__name__)
CORS(app, origins=["http://localhost:5173"])

# 加载模拟数据
def load_mock_data():
    with open('mock-data.json', 'r') as f:
        return json.load(f)

# ---------- Graph helpers for shortest path between two courses ----------

def build_prereq_graph():
    """
    Build an undirected graph of courses based on prerequisites from mock-data.json.
    Nodes: course IDs
    Edges: between course and each of its prerequisites
    """
    data = load_mock_data()
    nodes = data.get("nodes", [])
    adj = {}

    # ensure all nodes exist
    for c in nodes:
        cid = c.get("id")
        if not cid:
            continue
        adj.setdefault(cid, set())

    # add edges for prerequisites
    for c in nodes:
        cid = c.get("id")
        if not cid:
            continue
        prereqs = c.get("prerequisites", []) or []
        for pid in prereqs:
            if pid not in adj:
                continue
            adj[cid].add(pid)
            adj[pid].add(cid)

    return adj

def shortest_path_between(adj, start, goal):
    """
    Simple BFS shortest path on an undirected graph.
    Returns a list of course IDs from start to goal (inclusive),
    or [] if no path is found.
    """
    if start not in adj or goal not in adj:
        return []

    from collections import deque

    q = deque([start])
    parent = {start: None}

    while q:
        u = q.popleft()
        if u == goal:
            break
        for v in adj[u]:
            if v not in parent:
                parent[v] = u
                q.append(v)

    if goal not in parent:
        return []

    path = []
    cur = goal
    while cur is not None:
        path.append(cur)
        cur = parent[cur]
    path.reverse()
    return path

def plan_semesters(selected_ids, max_per_term=4):
    """
    Given a list of selected course IDs and a max courses-per-semester limit,
    return a semester-by-semester plan (list of lists of course IDs),
    respecting prerequisite constraints from mock-data.json.

    This function:
    1) builds the prerequisite-closure of the selected courses
    2) runs a capacity-limited topological layering (Kahn's algorithm variant)
    """
    data = load_mock_data()
    nodes = data.get("nodes", [])
    id_to_course = {c.get("id"): c for c in nodes if c.get("id")}

    # 1) prerequisite closure: all selected courses plus all their prereqs
    closure = set()
    stack = list(selected_ids or [])
    while stack:
        cid = stack.pop()
        if cid in closure or cid not in id_to_course:
            continue
        closure.add(cid)
        prereqs = id_to_course[cid].get("prerequisites", []) or []
        for pid in prereqs:
            stack.append(pid)

    if not closure:
        return []

    # 2) build directed graph on the closure (prereq -> course)
    in_degree = {cid: 0 for cid in closure}
    adj = {cid: [] for cid in closure}
    for cid in closure:
        prereqs = id_to_course[cid].get("prerequisites", []) or []
        for pid in prereqs:
            if pid in closure:
                adj[pid].append(cid)
                in_degree[cid] += 1

    remaining = set(closure)
    semesters = []

    # clamp workload
    try:
        max_per = int(max_per_term)
    except Exception:
        max_per = 4
    if max_per < 1:
        max_per = 1
    if max_per > 6:
        max_per = 6

    # 3) capacity-limited Kahn layering
    while remaining:
        available = [cid for cid in remaining if in_degree[cid] == 0]
        if not available:
            # cycle or missing prereqs; dump the rest as a final "catch-all" semester
            semesters.append(sorted(remaining))
            break

        # pick up to max_per courses this term; sort for determinism
        available.sort()
        term = available[:max_per]
        semesters.append(term)

        for cid in term:
            remaining.remove(cid)
            for nxt in adj.get(cid, []):
                in_degree[nxt] -= 1

    return semesters

@app.route('/api/hello')
def hello():
    return jsonify({"message": "Hello from Class-Linker API!"})

@app.route('/api/courses', methods=['GET', 'POST'])
def courses():
    print(">>> /api/courses route hit, method =", request.method, flush=True)
    """
    GET  -> 返回完整 mock-data.json（给 P1 / P2 用）
    POST -> 接收前端传来的 planner 课程列表，先返回一个简单的“路径”结果
            之后可以替换成真正的最短路径算法。
    """
    if request.method == 'GET':
        # 原来的逻辑：返回全部课程数据
        mock_data = load_mock_data()
        return jsonify(mock_data)

    # POST: 期望前端 body 里是 { "courses": ["CSC 172", "CSC 173", ...] }
    data = request.get_json() or {}
    course_ids = data.get("courses", [])

    # 简单防御：如果空就直接报错给前端
    if not isinstance(course_ids, list) or len(course_ids) == 0:
        return jsonify({"error": "No courses provided"}), 400

    # 根据先修关系和 workload 上限，生成一个“按学期分组”的最短毕业路径
    max_per_term = data.get("maxPerTerm", 4)
    semesters = plan_semesters(course_ids, max_per_term)

    # Hide internal equivalence helper nodes like "EQUIV-MATH17X" from the final plan.
    cleaned_semesters = []
    for term in semesters:
        visible = [
            cid for cid in term
            if not (isinstance(cid, str) and cid.startswith("EQUIV-"))
        ]
        if visible:
            cleaned_semesters.append(visible)

    result = {
        "semesters": cleaned_semesters,
        "semester_count": len(cleaned_semesters),
        "maxPerTerm": max_per_term,
    }
    return jsonify(result)



def calculate_shortest_path():
    # 1. 加载数据 (P4 的 { "nodes": [...] } 结构)
    data = load_mock_data()
    courses = data.get("nodes", []) 
    
    # 2. 预处理
    in_degree = {}
    adj_list = {}
    all_course_ids = set()
    course_map = {} 
    
    # --- 第一次遍历: 初始化 ---
    for course in courses:
        course_id = course['id']
        all_course_ids.add(course_id)
        course_map[course_id] = course
        in_degree[course_id] = 0
        adj_list[course_id] = []

    # --- 第二次遍历: 构建图 (只处理简单的 [String] 列表) ---
    for course_id in all_course_ids:
        course = course_map[course_id]
        
        # A. 处理严格的“先修课” (prerequisites: [String])
        #    P4 已经把 "OR" 逻辑 (e.g., EQUIV-MATH16X) 清洗干净了
        #    所以我们的算法保持简单即可
        strict_prereqs = course.get('prerequisites', [])
        for prereq_id in strict_prereqs:
            if prereq_id in all_course_ids:
                adj_list[prereq_id].append(course_id)
                in_degree[course_id] += 1
                
        # B. "同修课" (Corequisites) 逻辑已移除
        #    因为 P4 当前的 mock-data.json 中不包含 'corequisites' 键
    
    
    # 3. 准备拓扑排序 (Kahn's Algorithm)
    
    # "queue" 里放所有“第1学期”的课 (入度为0的课)
    queue = deque()
    for course_id in all_course_ids:
        if in_degree[course_id] == 0:
            queue.append(course_id)

    shortest_path_semesters = [] # 最终结果, e.g., [ ["CS101"], ["CS201"] ]

    # 4. 执行算法
    while queue:
        # "current_semester" 里的所有课可以一起上
        current_semester = []
        
        # 处理当前队列中的所有"可上"课程
        for _ in range(len(queue)):
            current_course_id = queue.popleft()
            current_semester.append(current_course_id)

            # 看看这门课解锁了哪些"后续课"
            for next_course_id in adj_list[current_course_id]:
                # "假装"上完了, 先修课要求-1
                in_degree[next_course_id] -= 1
                
                # 如果这门"后续课"的所有先修课都上完了...
                if in_degree[next_course_id] == 0:
                    # ...那它就可以在"下个学期"上了
                    queue.append(next_course_id)
        
        # 把这个学期的课加入总路径
        if current_semester:
            shortest_path_semesters.append(current_semester)

    # (可选: 检查是否有循环依赖，这里Hackathon先省略)
    
    return shortest_path_semesters

# --- P3 的新 API 端点 ---
@app.route('/api/shortest-path')
def get_shortest_path():
    # 1. 调用你的算法
    path = calculate_shortest_path()
    
    # 2. 把结果返回给前端
    return jsonify({
        "semesters": path,
        "semester_count": len(path)
    })

# --- P4 的 LLM API "空壳" 从这里开始 ---
# (这部分代码保留你之前的版本，等你准备好了再改)
@app.route('/api/parse-course', methods=['POST'])
def parse_course_with_llm():
    # 1. (P2/P1) 从前端获取用户发来的原始文本
    data = request.get_json()
    if not data or 'text' not in data:
        return jsonify({"error": "No 'text' field provided"}), 400

    raw_text = data.get('text')

    system_prompt = """
    You are a course data assistant. Convert the following course description into 
    a strict JSON format with fields: id, title, credits, and prerequisites.
    """
    
    # 调用逻辑，因为 API Key 配置问题没跑通，但 Prompt 已经调优好了
    # model = genai.GenerativeModel('gemini-1.5-flash')
    # response = model.generate_content(f"{system_prompt}\n\nText: {raw_text}")

    return jsonify(mock_parsed_json)

# --- LLM API "空壳" 在这里结束 ---


if __name__ == '__main__':
    app.run(debug=True, port=5000)