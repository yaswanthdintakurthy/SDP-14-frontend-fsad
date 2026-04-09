import React, { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "./ui/card";
import { Button } from "./ui/button";

type Material = {
  id: number;
  title: string;
  type: string;
  url: string;
  filename?: string;
};

const courseMaterials: Record<string, Material[]> = {
  "Physics 101": [
    { id: 1, title: "Kinematics Notes", type: "pdf", url: "https://www.w3.org/WAI/ER/tests/xhtml/testfiles/resources/pdf/dummy.pdf", filename: "physics-kinematics.pdf" },
    { id: 2, title: "Lab Manual - Mechanics", type: "pdf", url: "https://www.w3.org/WAI/ER/tests/xhtml/testfiles/resources/pdf/dummy.pdf", filename: "physics-lab.pdf" },
  ],
  "Mathematics": [
    { id: 3, title: "Multivariable Calculus Notes", type: "pdf", url: "https://www.w3.org/WAI/ER/tests/xhtml/testfiles/resources/pdf/dummy.pdf", filename: "math-multivar.pdf" },
  ],
  "Chemistry": [
    { id: 4, title: "Organic Chemistry - Functional Groups", type: "pdf", url: "https://www.w3.org/WAI/ER/tests/xhtml/testfiles/resources/pdf/dummy.pdf", filename: "chem-organic.pdf" },
  ],
  "Computer Science": [
    { id: 5, title: "Algorithms Lecture Slides", type: "pdf", url: "https://www.w3.org/WAI/ER/tests/xhtml/testfiles/resources/pdf/dummy.pdf", filename: "cs-algo.pdf" },
    { id: 6, title: "Project Guidelines", type: "pdf", url: "https://www.w3.org/WAI/ER/tests/xhtml/testfiles/resources/pdf/dummy.pdf", filename: "cs-project.pdf" },
  ],
};

const courseList = Object.keys(courseMaterials);

export default function WorkbooksView() {
  const [selectedCourse, setSelectedCourse] = useState<string>(courseList[0] || "");

  const materials = selectedCourse ? courseMaterials[selectedCourse] || [] : [];

  return (
    <div className="p-6 space-y-6">
      <div>
        <h2 className="text-3xl font-bold">Workbooks & Materials</h2>
        <p className="text-muted-foreground">Select a course to view or download workbook materials.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 items-end">
        <div className="md:col-span-2">
          <label className="block text-sm font-medium text-muted-foreground">Choose Course</label>
          <select
            value={selectedCourse}
            onChange={(e) => setSelectedCourse(e.target.value)}
            className="mt-1 block w-full rounded-md border p-2"
          >
            {courseList.map((c) => (
              <option key={c} value={c}>{c}</option>
            ))}
          </select>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Materials for {selectedCourse}</CardTitle>
          <CardDescription>Download or view editable materials and workbooks</CardDescription>
        </CardHeader>
        <CardContent>
          {materials.length === 0 ? (
            <p className="text-sm text-muted-foreground">No materials available for this course.</p>
          ) : (
            <div className="space-y-4">
              {materials.map((m) => (
                <div key={m.id} className="flex items-center justify-between border rounded p-3">
                  <div>
                    <div className="font-medium">{m.title}</div>
                    <div className="text-sm text-muted-foreground">Type: {m.type.toUpperCase()}</div>
                  </div>

                  <div className="flex gap-2">
                    <a href={m.url} target="_blank" rel="noreferrer">
                      <Button size="sm" variant="outline">View</Button>
                    </a>
                    <a href={m.url} download={m.filename || undefined}>
                      <Button size="sm">Download</Button>
                    </a>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

