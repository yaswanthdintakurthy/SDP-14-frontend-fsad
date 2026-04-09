import React, { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "./ui/card";
import { Button } from "./ui/button";

type Student = { id: string; name: string };

const courseStudents: Record<string, Student[]> = {
  "Physics 101": [
    { id: "P-1001", name: "Alice Kumar" },
    { id: "P-1002", name: "Brian Lee" },
    { id: "P-1003", name: "Chitra Patel" },
  ],
  "Mathematics": [
    { id: "M-2001", name: "Dinesh Rao" },
    { id: "M-2002", name: "Elena Gomez" },
  ],
  "Chemistry": [
    { id: "C-3001", name: "Farah Ahmed" },
    { id: "C-3002", name: "George Smith" },
  ],
  "Computer Science": [
    { id: "CS-4001", name: "Hannah Park" },
    { id: "CS-4002", name: "Ibrahim Khan" },
    { id: "CS-4003", name: "Julia Brown" },
  ],
};

export default function StudentManagement() {
  const courses = Object.keys(courseStudents);
  const [selectedCourse, setSelectedCourse] = useState<string>(courses[0] || "");

  const students = selectedCourse ? courseStudents[selectedCourse] || [] : [];

  return (
    <div className="p-6 space-y-6">
      <div>
        <h2 className="text-3xl font-bold">Student Management</h2>
        <p className="text-muted-foreground">View students registered for each course (ID & Name)</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 items-end">
        <div className="md:col-span-2">
          <label className="block text-sm font-medium text-muted-foreground">Select Course</label>
          <select
            value={selectedCourse}
            onChange={(e) => setSelectedCourse(e.target.value)}
            className="mt-1 block w-full rounded-md border p-2"
          >
            {courses.map((c) => (
              <option key={c} value={c}>{c}</option>
            ))}
          </select>
        </div>
        <div className="flex gap-2">
          <Button size="sm" variant="outline" onClick={() => alert('Exporting list...')}>Export CSV</Button>
          <Button size="sm" onClick={() => alert('Opening registration form...')}>Add Student</Button>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Registered Students - {selectedCourse}</CardTitle>
          <CardDescription>Student ID and Name</CardDescription>
        </CardHeader>
        <CardContent>
          {students.length === 0 ? (
            <p className="text-sm text-muted-foreground">No students registered for this course.</p>
          ) : (
            <div className="overflow-auto">
              <table className="w-full text-left">
                <thead>
                  <tr>
                    <th className="py-2 px-3 text-sm font-medium">Student ID</th>
                    <th className="py-2 px-3 text-sm font-medium">Name</th>
                  </tr>
                </thead>
                <tbody>
                  {students.map((s) => (
                    <tr key={s.id} className="border-t">
                      <td className="py-2 px-3">{s.id}</td>
                      <td className="py-2 px-3">{s.name}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
