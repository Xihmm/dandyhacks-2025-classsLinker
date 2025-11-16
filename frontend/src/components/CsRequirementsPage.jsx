import CsMindmap from "./CsMindmap";
import csData from "../data/mock-data.json";

export default function CsRequirementsPage({ onCourseSelect }) {
  const handleCourseClick = (courseId) => {
    if (!onCourseSelect) return;
    onCourseSelect(courseId);
  };

  return (
    <div style={{ flex: 1, padding: "16px" }}>
      <CsMindmap data={csData} onCourseClick={handleCourseClick} />
    </div>
  );
}