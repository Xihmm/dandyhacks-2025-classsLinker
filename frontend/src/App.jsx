import CourseGraph from "./components/CourseGraph";

function App() {
  const handleNodeSelect = (id, node) => {
    console.log("Selected course:", id, node);
  };

  return (
    <div style={{ width: "100vw", height: "100vh" }}>
      <CourseGraph onNodeSelect={handleNodeSelect} />
    </div>
  );
}

export default App;