export default function AcademicFilters({ faculties, value, onChange }) {
  const available = faculties || []
  const majors = (value.facultyId ? available.filter((faculty) => faculty.id === value.facultyId) : available)
    .flatMap((faculty) => faculty.majors)
  return (
    <>
      <label className="library-select">
        <span className="sr-only">Khoa</span>
        <select aria-label="Khoa" disabled={!faculties} value={value.facultyId}
          onChange={(event) => onChange({ facultyId: event.target.value, majorId: '' })}>
          <option value="">Tất cả các Khoa</option>
          {available.map((faculty) => <option key={faculty.id} value={faculty.id}>{faculty.name}</option>)}
        </select>
      </label>
      <label className="library-select">
        <span className="sr-only">Chuyên ngành</span>
        <select aria-label="Chuyên ngành" disabled={!faculties} value={value.majorId}
          onChange={(event) => onChange({ majorId: event.target.value })}>
          <option value="">Tất cả chuyên ngành</option>
          {majors.map((major) => <option key={major.id} value={major.id}>{major.name}</option>)}
        </select>
      </label>
    </>
  )
}
