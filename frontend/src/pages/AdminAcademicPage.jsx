import { useState } from "react";
import Catalog from "../components/AdminCatalog";

export default function AdminAcademicPage({ currentUser }) {
  const [tab, setTab] = useState("faculties");
  const [selectedFaculty, setSelectedFaculty] = useState("");
  return (
    <>
      <div
        className="admin-catalog-tabs"
        role="group"
        aria-label="Danh mục đào tạo"
      >
        <button
          aria-pressed={tab === "faculties"}
          onClick={() => setTab("faculties")}
        >
          Khoa
        </button>
        <button
          aria-pressed={tab === "majors"}
          onClick={() => {
            setSelectedFaculty("");
            setTab("majors");
          }}
        >
          Ngành
        </button>
      </div>
      <Catalog
        key={tab}
        currentUser={currentUser}
        type={tab}
        initialFacultyId={selectedFaculty}
        onViewMajors={(id) => {
          setSelectedFaculty(id);
          setTab("majors");
        }}
      />
    </>
  );
}
