import { StudentImport } from "./admin/StudentImport";

export function StudentRecordsPage() {
  return (
    <div className="space-y-8">
      <StudentImport onImport={() => {}} />
    </div>
  );
}
