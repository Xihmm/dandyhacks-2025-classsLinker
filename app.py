from flask import Flask, jsonify
import json

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

if __name__ == '__main__':
    app.run(debug=True, port=5000)