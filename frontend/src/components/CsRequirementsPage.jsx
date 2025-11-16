import CsMindmap from "./CsMindmap";
import csData from "../data/mock-data.json";

export default function CsRequirementsPage({ onCourseSelect }) {
  const handleCourseClick = (courseId) => {
    if (!onCourseSelect) return;
    onCourseSelect(courseId);
  };

  const getClickableId = (id) => {
    if (id === "EQUIV-MATH14X") return "MATH 14X";
    if (id === "EQUIV-MATH16X") return "MATH 16X";
    if (id === "EQUIV-MATH17X") return "MATH 17X";
    return id;
  };

  return (
    <div style={{ flex: 1, padding: "16px" }}>
      <CsMindmap data={csData} onCourseClick={handleCourseClick} />
    </div>
  );
}