import { useEffect, useState } from "react";

export default function ShortestPath({ plannerList, onBack }) {
  const [paths, setPaths] = useState(null);
  const [error, setError] = useState(null);

  console.log("🔥 ShortestPath rendered with plannerList:", plannerList);

  useEffect(() => {
    async function fetchPath() {
      try {
        if (!plannerList || plannerList.length === 0) {
          setError("Planner list is empty.");
          return;
        }

        console.log("📡 Sending to backend:", plannerList);

        const response = await fetch("http://10.5.185.106:5000/api/courses", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            courses: plannerList.map((c) => c.id)
          }),
        });

        if (!response.ok) {
          throw new Error("Backend returned error " + response.status);
        }

        const data = await response.json();
        console.log("📥 Backend returned:", data);

        setPaths(data);
      } catch (err) {
        console.error("❌ API Error:", err);
        setError(err.message);
      }
    }

    fetchPath();
  }, [plannerList]);

  return (
    <div style={{ padding: "20px", fontFamily: "sans-serif" }}>
      <button
        onClick={onBack}
        style={{
          padding: "8px 14px",
          borderRadius: "8px",
          background: "#111827",
          color: "white",
          border: "none",
          cursor: "pointer",
          marginBottom: "20px",
        }}
      >
        ← Back
      </button>

      <h1>📌 Shortest Path</h1>
      <p>Based on your current planner selection.</p >

      {/* Error */}
      {error && (
        <div style={{ color: "red", marginTop: "20px" }}>
          ❌ Failed to load shortest path<br />
          {error}
        </div>
      )}

      {/* Loading */}
      {!paths && !error && (
        <div style={{ marginTop: "20px" }}>Loading shortest path...</div>
      )}

      {/* Show Result */}
      {paths && (
        <div style={{ marginTop: "20px" }}>
          {paths.map((group, idx) => (
            <div key={idx} style={{ marginBottom: "14px" }}>
              <strong>Path {idx + 1}:</strong>
              <div
                style={{
                  background: "#f3f4f6",
                  padding: "10px",
                  borderRadius: "8px",
                  marginTop: "6px",
                }}
              >
                {group.join(" → ")}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}