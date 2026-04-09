import { BookOpen, Users, Clock, Calendar, Award, TrendingUp } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "./ui/card";
import { Progress } from "./ui/progress";
import { Badge } from "./ui/badge";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { Label } from "./ui/label";
import { Textarea } from "./ui/textarea";
import { useState } from "react";

type Course = {
  id: number;
  name: string;
  instructor: string;
  semester: string;
  progress: number;
  totalStudents: number;
  nextClass: string;
  assignments: number;
  workbooks: number;
  grade: string;
  credits: number;
  description: string;
  color: string;
  image?: string;
  syllabus?: string[];
  evaluationPlan?: { item: string; weight: string }[];
  grades?: { item: string; grade: string; feedback?: string }[];
  assignmentQuestions?: { id: number; title: string; question: string; dueDate?: string }[];
};

export default function CoursesView({ userRole }: { userRole?: "student" | "faculty" | "admin" }) {
  const initialCourses: Course[] = [
    {
      id: 1,
      name: "Physics 101",
      instructor: "Dr. Sarah Johnson",
      semester: "Fall 2025",
      progress: 75,
      totalStudents: 42,
      nextClass: "2025-01-08",
      assignments: 3,
      workbooks: 8,
      grade: "A-",
      credits: 4,
      description: "Introduction to classical mechanics, thermodynamics, and wave physics.",
      color: "blue",
      image: "https://images.unsplash.com/photo-1503676260728-1c00da094a0b?auto=format&fit=crop&w=800&q=60",
      syllabus: [
        "Kinematics and Newton's Laws",
        "Work and Energy",
        "Momentum and Collisions",
        "Rotational Motion",
        "Waves and Oscillations",
      ],
      evaluationPlan: [
        { item: "Assignments", weight: "30%" },
        { item: "Midterm Exam", weight: "25%" },
        { item: "Lab Work", weight: "15%" },
        { item: "Final Exam", weight: "30%" },
      ],
      grades: [
        { item: "Assignment 1", grade: "A", feedback: "Well explained." },
        { item: "Midterm", grade: "B+", feedback: "Good understanding, review oscillations." },
      ],
      assignmentQuestions: [
        { id: 11, title: "Assignment 1", question: "Derive the equation of motion for a pendulum (small-angle approximation).", dueDate: "2025-12-05" },
        { id: 12, title: "Assignment 2", question: "A block slides down an incline with friction; compute work done by friction.", dueDate: "2025-12-20" },
      ],
    },
    {
      id: 2,
      name: "Mathematics",
      instructor: "Prof. Michael Chen",
      semester: "Fall 2025",
      progress: 90,
      totalStudents: 38,
      nextClass: "2025-01-09",
      assignments: 2,
      workbooks: 12,
      grade: "A",
      credits: 3,
      description: "Advanced calculus and differential equations with practical applications.",
      color: "green",
      image: "https://images.unsplash.com/photo-1503676260728-1c00da094a0b?auto=format&fit=crop&w=800&q=60",
      syllabus: ["Limits and Continuity", "Multivariable Calculus", "Differential Equations"],
      evaluationPlan: [{ item: "Homework", weight: "40%" }, { item: "Final", weight: "60%" }],
      grades: [{ item: "Homework 1", grade: "A" }],
      assignmentQuestions: [{ id: 21, title: "HW 1", question: "Solve the given differential equation: y' + 3y = e^{2x}", dueDate: "2025-12-10" }],
    },
    {
      id: 3,
      name: "Chemistry",
      instructor: "Dr. Emily Rodriguez",
      semester: "Fall 2025",
      progress: 60,
      totalStudents: 35,
      nextClass: "2025-01-10",
      assignments: 4,
      workbooks: 6,
      grade: "B+",
      credits: 4,
      description: "Organic and inorganic chemistry fundamentals with laboratory work.",
      color: "purple",
      image: "https://images.unsplash.com/photo-1527534231851-3b1aee0b3c82?auto=format&fit=crop&w=800&q=60",
      syllabus: ["Atomic structure", "Periodic trends", "Chemical bonding", "Organic functional groups"],
      evaluationPlan: [{ item: "Labs", weight: "30%" }, { item: "Midterm", weight: "30%" }, { item: "Final", weight: "40%" }],
      grades: [{ item: "Lab 1", grade: "B+" }],
      assignmentQuestions: [{ id: 31, title: "Lab Report 1", question: "Prepare the lab report for titration experiment.", dueDate: "2025-12-12" }],
    },
    {
      id: 4,
      name: "Computer Science",
      instructor: "Prof. David Kim",
      semester: "Fall 2025",
      progress: 85,
      totalStudents: 45,
      nextClass: "2025-01-11",
      assignments: 1,
      workbooks: 10,
      grade: "A-",
      credits: 3,
      description: "Data structures, algorithms, and object-oriented programming concepts.",
      color: "orange",
      image: "https://images.unsplash.com/photo-1518779578993-ec3579fee39f?auto=format&fit=crop&w=800&q=60",
      syllabus: ["Arrays and Linked Lists", "Stacks and Queues", "Trees and Graphs", "Sorting Algorithms"],
      evaluationPlan: [{ item: "Projects", weight: "50%" }, { item: "Exams", weight: "50%" }],
      grades: [{ item: "Project 1", grade: "A-", feedback: "Good implementation." }],
      assignmentQuestions: [{ id: 41, title: "Project 1", question: "Implement Dijkstra's algorithm and analyze its complexity.", dueDate: "2025-12-18" }],
    },
  ];

  const [courses, setCourses] = useState<Course[]>(initialCourses);
  const [selectedCourse, setSelectedCourse] = useState<Course | null>(null);

  // create-assignment dialog state (faculty)
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [newTitle, setNewTitle] = useState("");
  const [newQuestion, setNewQuestion] = useState("");
  const [newDueDate, setNewDueDate] = useState("");
  const [newMaxMarks, setNewMaxMarks] = useState<number | undefined>(undefined);

  const getColorClasses = (color: string) => {
    const colorMap = {
      blue: "border-blue-200 bg-blue-50/50",
      green: "border-green-200 bg-green-50/50",
      purple: "border-purple-200 bg-purple-50/50",
      orange: "border-orange-200 bg-orange-50/50"
    };
    return colorMap[color as keyof typeof colorMap] || "border-gray-200 bg-gray-50/50";
  };

  const getProgressColor = (progress: number) => {
    if (progress >= 80) return "bg-green-500";
    if (progress >= 60) return "bg-blue-500";
    if (progress >= 40) return "bg-yellow-500";
    return "bg-red-500";
  };

  // If faculty, show a simplified course list (name + credits) and let them enter a course
  if (userRole === "faculty") {
    return (
      <div className="p-6 space-y-6">
        <div>
          <h2 className="text-3xl font-bold">My Courses</h2>
          <p className="text-muted-foreground">Your teaching courses — select to view syllabus, credits and evaluation plan</p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {courses.map((course) => (
            <Card key={course.id} className="hover:shadow-md transition-shadow">
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div>
                    <CardTitle className="flex items-center gap-2">
                      <BookOpen className="h-5 w-5" />
                      {course.name}
                    </CardTitle>
                    <CardDescription>Credits: {course.credits}</CardDescription>
                  </div>
                  <Badge variant="secondary">{course.grade}</Badge>
                </div>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground">{course.description}</p>
                <div className="flex gap-2 pt-4">
                  <Button size="sm" onClick={() => setSelectedCourse(course)}>Enter Course</Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      <div>
        <h2 className="text-3xl font-bold">My Courses</h2>
        <p className="text-muted-foreground">Track your enrolled courses and academic progress</p>
      </div>

      {/* Course Overview Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Courses</CardTitle>
            <BookOpen className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">4</div>
            <p className="text-xs text-muted-foreground">This semester</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Credits</CardTitle>
            <Award className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">14</div>
            <p className="text-xs text-muted-foreground">Credit hours</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Average Grade</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">A-</div>
            <p className="text-xs text-muted-foreground">3.7 GPA</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Completion</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">77%</div>
            <p className="text-xs text-muted-foreground">Overall progress</p>
          </CardContent>
        </Card>
      </div>

      {/* Course Cards or Course Details */}
      {selectedCourse ? (
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-2xl font-bold">{selectedCourse.name}</h3>
              <p className="text-sm text-muted-foreground">{selectedCourse.instructor} • {selectedCourse.semester}</p>
            </div>
            <div className="flex items-center gap-2">
              <Badge variant="secondary">{selectedCourse.grade}</Badge>
              <Button variant="ghost" onClick={() => setSelectedCourse(null)}>Back</Button>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <Card className="lg:col-span-2">
              <CardHeader>
                <CardTitle>Syllabus</CardTitle>
                <CardDescription>Topics covered this semester</CardDescription>
              </CardHeader>
              <CardContent>
                <ul className="list-disc pl-5 space-y-2">
                  {(selectedCourse.syllabus || []).map((s, idx) => (
                    <li key={idx}>{s}</li>
                  ))}
                </ul>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Course Info</CardTitle>
                <CardDescription>Credits & progress</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  <div><strong>Credits:</strong> {selectedCourse.credits}</div>
                  <div><strong>Progress:</strong> {selectedCourse.progress}%</div>
                  <div className="mt-2">
                    <div className="text-sm font-medium">Course Progress</div>
                    <div className="w-full bg-gray-200 rounded-full h-2 mt-1">
                      <div className={`h-2 rounded-full ${getProgressColor(selectedCourse.progress)}`} style={{ width: `${selectedCourse.progress}%` }}></div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Evaluation Plan</CardTitle>
                <CardDescription>Breakdown of assessment weights</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {(selectedCourse.evaluationPlan || []).map((ev, i) => (
                    <div key={i} className="flex justify-between">
                      <span>{ev.item}</span>
                      <span className="text-muted-foreground">{ev.weight}</span>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Grades & Feedback</CardTitle>
                <CardDescription>Grades provided by professor</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {(selectedCourse.grades || []).map((g, i) => (
                    <div key={i} className="border rounded p-3">
                      <div className="flex justify-between items-start">
                        <div>
                          <div className="font-medium">{g.item}</div>
                          {g.feedback && <div className="text-sm text-muted-foreground">{g.feedback}</div>}
                        </div>
                        <div className="text-lg font-semibold">{g.grade}</div>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>Assignments</CardTitle>
              <CardDescription>Assignment questions for this course</CardDescription>
            </CardHeader>
            <CardContent>
              {userRole === "faculty" && (
                <div className="mb-4 flex justify-end">
                  <Button onClick={() => setShowCreateDialog(true)}>Create Assignment</Button>
                </div>
              )}
              <div className="space-y-4">
                {(selectedCourse.assignmentQuestions || []).map((a) => (
                  <div key={a.id} className="border rounded-md p-4">
                    <div className="flex justify-between items-start">
                      <div>
                        <h4 className="font-semibold">{a.title}</h4>
                        <p className="text-sm text-muted-foreground mt-1">{a.question}</p>
                        {a.dueDate && <p className="text-xs text-muted-foreground mt-2">Due: {a.dueDate}</p>}
                      </div>
                      <div className="flex flex-col gap-2">
                        <Button size="sm" variant="outline">Download</Button>
                        <Button size="sm">Submit</Button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Create Assignment Dialog (faculty only) */}
          {showCreateDialog && selectedCourse && (
            <div>
              <div className="fixed inset-0 bg-black/40" onClick={() => setShowCreateDialog(false)} />
              <div className="fixed inset-0 flex items-center justify-center p-6">
                <div className="bg-white rounded-lg p-6 w-full max-w-lg shadow-lg">
                  <h3 className="text-lg font-semibold mb-4">Create Assignment for {selectedCourse.name}</h3>
                  <div className="space-y-3">
                    <div>
                      <Label>Title</Label>
                      <Input value={newTitle} onChange={(e) => setNewTitle(e.target.value)} className="mt-1" />
                    </div>
                    <div>
                      <Label>Question</Label>
                      <Textarea value={newQuestion} onChange={(e) => setNewQuestion(e.target.value)} rows={4} className="mt-1" />
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <Label>Due Date</Label>
                        <Input type="date" value={newDueDate} onChange={(e) => setNewDueDate(e.target.value)} className="mt-1" />
                      </div>
                      <div>
                        <Label>Max Marks</Label>
                        <Input type="number" value={newMaxMarks ?? ""} onChange={(e) => setNewMaxMarks(Number(e.target.value))} className="mt-1" />
                      </div>
                    </div>
                    <div className="flex gap-2 justify-end mt-2">
                      <Button onClick={() => setShowCreateDialog(false)} variant="outline">Cancel</Button>
                      <Button onClick={() => {
                        // append new assignment to selectedCourse
                        const newA = {
                          id: Math.floor(Math.random() * 90000) + 1000,
                          title: newTitle || "New Assignment",
                          question: newQuestion || "",
                          dueDate: newDueDate || undefined,
                        };
                        setSelectedCourse(prev => {
                          const updated = prev ? { ...prev, assignmentQuestions: [...(prev.assignmentQuestions||[]), newA] } : prev;
                          // also persist into courses list
                          setCourses((cs) => cs.map(c => c.id === updated?.id ? updated as Course : c));
                          return updated;
                        });
                        // reset
                        setNewTitle(""); setNewQuestion(""); setNewDueDate(""); setNewMaxMarks(undefined);
                        setShowCreateDialog(false);
                      }}>Create</Button>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {courses.map((course) => (
            <Card key={course.id} className={`${getColorClasses(course.color)} hover:shadow-md transition-shadow`}>
            <CardHeader>
              <div className="flex items-start justify-between">
                <div className="space-y-1">
                  <CardTitle className="flex items-center gap-2">
                    <BookOpen className="h-5 w-5" />
                    {course.name}
                  </CardTitle>
                  <CardDescription>{course.instructor}</CardDescription>
                </div>
                <Badge variant="secondary">{course.grade}</Badge>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-sm text-muted-foreground">{course.description}</p>
              
              {/* Progress */}
              <div className="space-y-2">
                <div className="flex justify-between items-center">
                  <span className="text-sm font-medium">Course Progress</span>
                  <span className="text-sm text-muted-foreground">{course.progress}%</span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div 
                    className={`h-2 rounded-full ${getProgressColor(course.progress)}`}
                    style={{ width: `${course.progress}%` }}
                  ></div>
                </div>
              </div>

              {/* Course Details */}
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div className="space-y-2">
                  <div className="flex items-center gap-2 text-muted-foreground">
                    <Calendar className="h-4 w-4" />
                    <span>Next Class: {course.nextClass}</span>
                  </div>
                  <div className="flex items-center gap-2 text-muted-foreground">
                    <Users className="h-4 w-4" />
                    <span>{course.totalStudents} students</span>
                  </div>
                </div>
                <div className="space-y-2">
                  <div className="text-muted-foreground">
                    {course.assignments} assignments pending
                  </div>
                  <div className="text-muted-foreground">
                    {course.workbooks} workbook entries
                  </div>
                </div>
              </div>

              {/* Course Actions */}
              <div className="flex gap-2 pt-2">
                <Button variant="outline" size="sm" className="flex-1">
                  View Details
                </Button>
                <Button size="sm" className="flex-1" onClick={() => setSelectedCourse(course)}>
                  Enter Course
                </Button>
              </div>
            </CardContent>
          </Card>
          ))}
        </div>
      )}
    </div>
  );
}