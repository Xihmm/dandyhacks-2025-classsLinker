# ClassLinker | DandyHacks 2025

**ClassLinker** is an AI-powered academic planning tool designed to transform complex, unstructured course catalogs into optimized, visual graduation plans. Developed during the 48-hour **DandyHacks 2025** hackathon, it solves the "prerequisite maze" by combining LLM-based data extraction with graph-based scheduling algorithms.

---

## 🚀 Product Vision & Impact

As students, we recognized that course catalogs are often dense and difficult to navigate, making long-term academic planning a major pain point. **ClassLinker** addresses this by:
* **Simplifying Complexity**: Automatically extracting "OR" logic and hidden prerequisites from text.
* **Strategic Planning**: Generating semester-bounded plans that respect course capacity and prerequisite order.
* **Visual Clarity**: Providing an interactive tree interface to help students visualize their entire degree path.

---

## 🛠️ Technical Architecture

### 1. AI-Powered Data Pipeline
* **Unstructured to Structured**: Built a robust ingestion pipeline that utilizes prompt-engineered **Gemini API** calls to convert raw course catalog text into validated JSON schemas.
* **Automated Updates**: Supports automated graph regeneration whenever university course descriptions are updated.

### 2. Prerequisite-Resolution Engine
* **Graph Theory Implementation**: Leveraged **Kahn’s Algorithm (Topological Sort)** to resolve dependencies across 100+ CS courses.
* **Virtual Node Abstraction**: Introduced a novel abstraction to correctly model non-linear "OR-prerequisite" logic (e.g., *Course A OR Course B*), ensuring accurate resolution without inflating requirements.

### 3. Modular Backend Design
* **REST API**: Architected a Flask-based API with a clear **Separation of Concerns**, covering graph construction, prerequisite closure, and capacity-constrained scheduling.
* **Reliability**: Optimized for correctness and extensibility, improving the testability of the graduation plans.

---

## 💻 Tech Stack

* **Language:** Python
* **AI Engine:** Gemini API
* **Backend:** Flask
* **Frontend:** React.js
* **Algorithms:** Graph Theory, Topological Sorting (Kahn’s)
* **Tools:** Git, GitHub

---

## 👥 Leadership & Execution 

* **Role**: Led backend development for a cross-functional **4-person team**.
* **Project Management**: Owned API contracts and Git workflows, ensuring seamless frontend-backend integration.
* **Agile Delivery**: Successfully delivered a production-ready MVP under a high-pressure **48-hour hackathon timeline**.

---

## 📁 Repository Structure

* `app.py`: Flask API and Gemini-powered course parsing logic.
* `requirements.txt`: Project dependencies.
* `frontend/`: React.js user interface code.
* `tree/`: Logic for tree visualization and appearance refinement.
* `mock-data.json`: Validated course schemas and test data.

---

**Developed with ❤️🤖 by Ruby G. & Team | DandyHacks 2025**
