import { useState } from "react";
import { Upload, Calendar, Clock, CheckCircle, AlertTriangle, FileText } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "./ui/card";
import { Button } from "./ui/button";
import { Badge } from "./ui/badge";
import { Textarea } from "./ui/textarea";
import { Input } from "./ui/input";
import { Label } from "./ui/label";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "./ui/dialog";
import { toast } from "sonner@2.0.3";

export default function AssignmentSubmission({
  userRole,
  userId,
  userName,
}: {
  userRole?: "student" | "faculty" | "admin";
  userId?: string | null;
  userName?: string | null;
}) {
  const isStudent = userRole === "student";
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [submissionText, setSubmissionText] = useState("");
  // which assignment id's submission dialog is open (null = none)
  const [submissionDialogFor, setSubmissionDialogFor] = useState<number | null>(null);

  // grading dialog state
  const [gradeDialogOpen, setGradeDialogOpen] = useState(false);
  const [gradingSubmission, setGradingSubmission] = useState<any>(null);
  const [gradeValue, setGradeValue] = useState("");
  const [gradeFeedback, setGradeFeedback] = useState("");

  // sample students by course
  const courseStudents: Record<string, { id: string; name: string }[]> = {
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

  // sample assignments and submission records
  const initialAssignments = [
    {
      id: 1,
      title: "Physics Lab Report - Motion Analysis",
      course: "Physics 101",
      dueDate: "2025-01-08",
      description: "Analyze the motion data collected during the pendulum experiment and write a comprehensive report.",
      maxMarks: 50,
    },
    {
      id: 2,
      title: "Mathematical Proof Assignment",
      course: "Mathematics",
      dueDate: "2025-01-12",
      description: "Prove the fundamental theorem of calculus using epsilon-delta definition.",
      maxMarks: 30,
    },
    {
      id: 3,
      title: "Chemical Bonding Essay",
      course: "Chemistry",
      dueDate: "2025-01-10",
      description: "Write an essay explaining different types of chemical bonds with real-world examples.",
      maxMarks: 40,
    },
    {
      id: 4,
      title: "Algorithm Analysis Project",
      course: "Computer Science",
      dueDate: "2025-01-15",
      description: "Implement and analyze the time complexity of various sorting algorithms.",
      maxMarks: 60,
    },
  ];

  // submissions keyed by assignment id
  const initialSubmissions: Record<number, any[]> = {
    1: [
      { studentId: "P-1001", studentName: "Alice Kumar", submittedOn: "2025-01-05", fileUrl: null, grade: null, feedback: null },
      { studentId: "P-1003", studentName: "Chitra Patel", submittedOn: "2025-01-06", fileUrl: null, grade: "B+", feedback: "Good work" },
    ],
    2: [],
    3: [
      { studentId: "C-3001", studentName: "Farah Ahmed", submittedOn: "2025-01-05", fileUrl: null, grade: "A-", feedback: "Excellent explanation" },
    ],
    4: [
      { studentId: "CS-4002", studentName: "Ibrahim Khan", submittedOn: "2025-01-12", fileUrl: null, grade: null, feedback: null },
    ],
  };

  const [assignments] = useState(initialAssignments);
  const [submissionsMap, setSubmissionsMap] = useState<Record<number, any[]>>(initialSubmissions);

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      setSelectedFile(file);
    }
  };

  const handleSubmission = (assignmentId: number, studentId = "S-000") => {
    if (!selectedFile && !submissionText.trim()) {
      toast.error("Please upload a file or enter text submission");
      return;
    }

    // For demo: push a submission for a fictitious studentId (or you can integrate real user)
    const studentName = studentId; // in real app, map id->name
    const newSubmission = {
      studentId,
      studentName,
      submittedOn: new Date().toISOString().slice(0, 10),
      fileUrl: selectedFile ? URL.createObjectURL(selectedFile) : null,
      grade: null,
      feedback: null,
    };

    setSubmissionsMap((prev) => {
      const list = [...(prev[assignmentId] || []), newSubmission];
      return { ...prev, [assignmentId]: list };
    });

    toast.success("Assignment submitted successfully!");
    setSubmissionDialogFor(null);
    setSelectedFile(null);
    setSubmissionText("");
  };

  const getDaysLeft = (dueDateStr: string) => {
    const due = new Date(dueDateStr);
    const diff = Math.ceil((due.getTime() - Date.now()) / (1000 * 60 * 60 * 24));
    return diff;
  };

  const getDaysLeftColor = (days: number) => {
    if (days <= 1) return "destructive";
    if (days <= 3) return "secondary";
    return "default";
  };

  const sortByStudentId = (a: { studentId: string }, b: { studentId: string }) => {
    const numA = parseInt(a.studentId.replace(/[^0-9]/g, "")) || 0;
    const numB = parseInt(b.studentId.replace(/[^0-9]/g, "")) || 0;
    return numA - numB;
  };

  const openGradeDialog = (assignmentId: number, submission: any) => {
    setGradingSubmission({ assignmentId, ...submission });
    setGradeValue(submission.grade || "");
    setGradeFeedback(submission.feedback || "");
    setGradeDialogOpen(true);
  };

  const submitGrade = () => {
    if (!gradingSubmission) return;
    const { assignmentId, studentId } = gradingSubmission;
    setSubmissionsMap((prev) => {
      const list = (prev[assignmentId] || []).map((s) => {
        if (s.studentId === studentId) {
          return { ...s, grade: gradeValue, feedback: gradeFeedback };
        }
        return s;
      });
      return { ...prev, [assignmentId]: list };
    });
    toast.success("Grade submitted");
    setGradeDialogOpen(false);
    setGradingSubmission(null);
  };
  // Student view: simplified submission UI (file upload). Faculty/admin see the full review UI above.
  return (
    <div className="p-6 space-y-6">
      <div>
        <h2 className="text-3xl font-bold">Assignments</h2>
        <p className="text-muted-foreground">{isStudent ? "Upload and submit files for your assignments" : "Submit and review assignments"}</p>
      </div>

      <div className="grid gap-4">
        {assignments.map((assignment) => {
          const subs = submissionsMap[assignment.id] || [];
          const daysLeft = getDaysLeft(assignment.dueDate);

          // Student-facing card
          if (isStudent) {
            const already = subs.find((s) => s.studentId === (userId || "S-000"));
            return (
              <Card key={assignment.id}>
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div>
                      <CardTitle>{assignment.title}</CardTitle>
                      <CardDescription>{assignment.course}</CardDescription>
                    </div>
                    <div>
                      <Badge>{daysLeft === 0 ? "Due Today" : `${daysLeft} days left`}</Badge>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <p className="text-sm mb-4">{assignment.description}</p>

                  {already ? (
                    <div className="border rounded p-3 flex items-center justify-between">
                      <div>
                        <div className="font-medium">Submitted: {already.submittedOn}</div>
                        <div className="text-sm text-muted-foreground">File: {already.fileName || (already.fileUrl ? 'Uploaded file' : '—')}</div>
                        {already.grade && <div className="text-sm">Grade: {already.grade}</div>}
                      </div>
                      <div className="flex gap-2">
                        <a href={already.fileUrl || '#'} target="_blank" rel="noreferrer">
                          <Button size="sm">View</Button>
                        </a>
                      </div>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      <div>
                        <Label htmlFor={`file-${assignment.id}`}>Upload File</Label>
                        <Input id={`file-${assignment.id}`} type="file" accept=".pdf,.doc,.docx,.txt" onChange={handleFileUpload} className="mt-1" />
                        {selectedFile && <div className="text-sm text-muted-foreground mt-1">Selected: {selectedFile.name}</div>}
                      </div>

                      <div>
                        <Label>Optional Message</Label>
                        <Textarea value={submissionText} onChange={(e) => setSubmissionText(e.target.value)} rows={4} className="mt-1" />
                      </div>

                      <div className="flex gap-2">
                        <Button onClick={() => handleSubmission(assignment.id, userId || `S-000`)}>Submit</Button>
                        <Button variant="outline" onClick={() => { setSelectedFile(null); setSubmissionText(""); }}>Clear</Button>
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            );
          }

          // Faculty / admin view — keep existing detailed review UI
          // students enrolled in the course
          const roster = courseStudents[assignment.course] || [];
          const submittedIds = subs.map((s) => s.studentId);
          const notSubmitted = roster.filter((r) => !submittedIds.includes(r.id));
          const submitted = [...subs].sort(sortByStudentId);

          return (
            <Card key={assignment.id} className={`${submitted.length > 0 ? 'border-green-200 bg-green-50/50' : daysLeft <= 1 ? 'border-yellow-200 bg-yellow-50/50' : ''}`}>
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div className="space-y-1">
                    <CardTitle className="flex items-center gap-2">
                      {submitted.length > 0 ? (
                        <CheckCircle className="h-5 w-5 text-green-500" />
                      ) : daysLeft <= 1 ? (
                        <AlertTriangle className="h-5 w-5 text-yellow-500" />
                      ) : (
                        <FileText className="h-5 w-5 text-blue-500" />
                      )}
                      {assignment.title}
                    </CardTitle>
                    <CardDescription>{assignment.course}</CardDescription>
                  </div>
                  <div className="flex items-center gap-2">
                    {submitted.length > 0 ? (
                      <Badge variant="default" className="bg-green-500">
                        {submitted.length} Submitted
                      </Badge>
                    ) : (
                      <Badge
                        style={{
                          backgroundColor: daysLeft <= 1 ? "#FACC15" : "#FEEBC8",
                          color: "#1f1f1f",
                          fontWeight: 600,
                        }}
                      >
                        {daysLeft === 0 ? "Due Today" : `${daysLeft} days left`}
                      </Badge>
                    )}
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <p className="text-sm">{assignment.description}</p>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <h4 className="font-semibold">Submitted ({submitted.length})</h4>
                    {submitted.length === 0 ? (
                      <p className="text-sm text-muted-foreground">No submissions yet.</p>
                    ) : (
                      <div className="space-y-2 mt-2">
                        {submitted.map((s: any) => (
                          <div key={s.studentId} className="flex items-center justify-between border rounded p-2">
                            <div>
                              <div className="font-medium">{s.studentId} — {s.studentName}</div>
                              <div className="text-sm text-muted-foreground">Submitted: {s.submittedOn}</div>
                              {s.feedback && <div className="text-sm text-muted-foreground">Feedback: {s.feedback}</div>}
                            </div>
                            <div className="flex flex-col gap-2">
                              <Button size="sm" variant="outline" onClick={() => openGradeDialog(assignment.id, s)}>Grade</Button>
                              <a href={s.fileUrl || '#'} target="_blank" rel="noreferrer">
                                <Button size="sm">View</Button>
                              </a>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>

                  <div>
                    <h4 className="font-semibold">Not Submitted ({notSubmitted.length})</h4>
                    {notSubmitted.length === 0 ? (
                      <p className="text-sm text-muted-foreground">All students have submitted.</p>
                    ) : (
                      <div className="space-y-2 mt-2">
                        {notSubmitted.map((r) => (
                          <div key={r.id} className="flex items-center justify-between border rounded p-2">
                            <div>{r.id} — {r.name}</div>
                            <div className="flex gap-2">
                              <Button size="sm" variant="outline" onClick={() => alert(`Send reminder to ${r.name}`)}>Remind</Button>
                              <Button size="sm" onClick={() => setSubmissionDialogFor(assignment.id)}>Submit on behalf</Button>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>

                <div className="flex items-center justify-between text-sm text-muted-foreground">
                  <div className="flex items-center gap-4">
                    <span className="flex items-center gap-1">
                      <Calendar className="h-4 w-4" />
                      Due: {assignment.dueDate}
                    </span>
                    <span>Max Marks: {assignment.maxMarks}</span>
                  </div>
                </div>

                {/* Submit dialog (used for "Submit on behalf" or student submission) */}
                {submissionDialogFor === assignment.id && (
                  <Dialog open={true} onOpenChange={() => setSubmissionDialogFor(null)}>
                    <DialogContent className="sm:max-w-md">
                      <DialogHeader>
                        <DialogTitle>Submit Assignment</DialogTitle>
                        <DialogDescription>
                          Upload a file or enter text submission for: {assignment.title}
                        </DialogDescription>
                      </DialogHeader>
                      <div className="space-y-4">
                        <div>
                          <Label htmlFor="file-upload">Upload File</Label>
                          <Input
                            id="file-upload"
                            type="file"
                            accept=".pdf,.doc,.docx,.txt"
                            onChange={handleFileUpload}
                            className="mt-1"
                          />
                          {selectedFile && (
                            <p className="text-sm text-green-600 mt-1">Selected: {selectedFile.name}</p>
                          )}
                        </div>

                        <div>
                          <Label htmlFor="text-submission">Or Enter Text Submission</Label>
                          <Textarea
                            id="text-submission"
                            placeholder="Enter your assignment text here..."
                            value={submissionText}
                            onChange={(e) => setSubmissionText(e.target.value)}
                            rows={6}
                            className="mt-1"
                          />
                        </div>

                        <div className="flex gap-2">
                          <Button onClick={() => handleSubmission(assignment.id, `ONBEHALF-${Math.floor(Math.random()*9000)+1000}`)} className="flex-1">Submit</Button>
                          <Button variant="outline" onClick={() => setSubmissionDialogFor(null)}>Cancel</Button>
                        </div>
                      </div>
                    </DialogContent>
                  </Dialog>
                )}
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Grade dialog (faculty only) */}
      {!isStudent && gradeDialogOpen && gradingSubmission && (
        <Dialog open={true} onOpenChange={() => setGradeDialogOpen(false)}>
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle>Grade Submission</DialogTitle>
              <DialogDescription>
                Assign grade and optional feedback for {gradingSubmission.studentId} ({gradingSubmission.studentName})
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-4">
              <div>
                <Label>Grade</Label>
                <Input value={gradeValue} onChange={(e) => setGradeValue(e.target.value)} placeholder="e.g., A, B+ or numeric" className="mt-1" />
              </div>

              <div>
                <Label>Feedback</Label>
                <Textarea value={gradeFeedback} onChange={(e) => setGradeFeedback(e.target.value)} rows={4} className="mt-1" />
              </div>

              <div className="flex gap-2">
                <Button onClick={submitGrade} className="flex-1">Submit Grade</Button>
                <Button variant="outline" onClick={() => setGradeDialogOpen(false)}>Cancel</Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
}