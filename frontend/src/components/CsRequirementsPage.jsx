import CsMindmap from "./CsMindmap";
import csData from "../data/mock-data.json";

export default function CsRequirementsPage() {
  return (
    <div style={{ flex: 1, padding: "16px" }}>
      <CsMindmap data={csData} />
    </div>
  );
}