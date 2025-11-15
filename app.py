from flask import Flask, jsonify, request
from flask import Flask, jsonify
import json
from collections import deque


app = Flask(__name__)

# 加载模拟数据
def load_mock_data():
    with open('mock-data.json', 'r') as f:
        return json.load(f)

@app.route('/api/hello')
def hello():
    return jsonify({"message": "Hello from Class-Linker API!"})

@app.route('/api/courses')
def get_courses():
    # 这是 P1 和 P2 马上就需要的数据
    mock_data = load_mock_data()
    return jsonify(mock_data)



def calculate_shortest_path():
    # 1. 加载数据 (P4 的 { "nodes": [...] } 结构)
    data = load_mock_data()
    courses = data.get("nodes", []) 
    
    # 2. 预处理 (和我们第一个“同修”版本一样)
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
        strict_prereqs = course.get('prerequisites', [])
        for prereq_id in strict_prereqs:
            if prereq_id in all_course_ids:
                adj_list[prereq_id].append(course_id)
                in_degree[course_id] += 1
                
        # B. 处理“同修课” (corequisites: [String])
        coreq_ids = course.get('corequisites', [])
        for coreq_id in coreq_ids:
            if coreq_id in all_course_ids:
                coreq_course = course_map[coreq_id]
                coreq_strict_prereqs = coreq_course.get('prerequisites', [])
                
                for prereq_of_coreq_id in coreq_strict_prereqs:
                    if prereq_of_coreq_id in all_course_ids:
                        adj_list[prereq_of_coreq_id].append(course_id)
                        in_degree[course_id] += 1
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

@app.route('/api/parse-course', methods=['POST'])
def parse_course_with_llm():
    # 1. (P2/P1) 从前端获取用户发来的原始文本
    data = request.get_json()
    if not data or 'text' not in data:
        return jsonify({"error": "No 'text' field provided"}), 400

    raw_text = data.get('text')

    # 2. (P4) P4 的 LLM 逻辑将在这里实现
    #    P4 会在这里调用 Google / OpenAI API
    #    ====================================
    #    TODO: P4 在这里添加 LLM 调用逻辑
    #    parsed_json = p4_llm_function(raw_text) 
    #    ====================================

    # 3. (P3/P4) 在 P4 完成前, 我们先返回一个"假"数据
    #    这能让 P1/P2 立即开始开发前端!
    mock_parsed_json = {
        "id": "LLM-101",
        "title": "New Course (from LLM)",
        "description": f"Parsed from: {raw_text[:50]}...",
        "credits": 3,
        "prerequisites": ["LLM-PREREQ-1", "LLM-PREREQ-2"]
    }

    return jsonify(mock_parsed_json)

# --- LLM API "空壳" 在这里结束 ---


if __name__ == '__main__':
    app.run(debug=True, port=5000)