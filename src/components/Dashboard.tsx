// Dashboard.tsx
import React from "react";
import { Calendar, Clock, BookOpen, FileText, TrendingUp } from "lucide-react";
import { Progress } from "./ui/progress";
import { Badge } from "./ui/badge";

interface DashboardProps {
  userRole?: "student" | "faculty" | "admin";
  userName?: string;
  userId?: string | null;
}

export default function Dashboard({
  userRole = "student",
  userName = "Student User",
  userId = null,
}: DashboardProps) {
  // Render a simplified faculty dashboard when role is faculty
  if (userRole === "faculty") {
    const cards = [
      { id: 1, title: "Journals & Conferences", icon: BookOpen, color: "#1E90FF", count: 0 },
      { id: 2, title: "Awards & Recognitions", icon: FileText, color: "#06D6FF", count: 0 },
      { id: 3, title: "Workshops,Seminars & Guest Lectures", icon: BookOpen, color: "#138D63", count: 0 },
      { id: 4, title: "Projects & Consultancy", icon: TrendingUp, color: "#1E66FF", count: 0 },
    ];

    return (
      <div className="min-h-screen bg-background">
        <div className="max-w-7xl mx-auto px-6 py-8">
          <header className="mb-6">
            <h1 className="text-2xl font-semibold text-slate-900">{userName}</h1>
            <div className="text-sm text-slate-500">ID: {userId || "-"}</div>
          </header>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {cards.map((c) => {
              const Icon = c.icon;
              return (
                <div key={c.id} className="rounded-lg bg-white p-6 shadow-sm border">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                      <div style={{ width: 56, height: 56, borderRadius: 9999, background: c.color, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        <Icon className="h-6 w-6 text-white" />
                      </div>
                      <div>
                        <div className="text-slate-700">{c.title}</div>
                      </div>
                    </div>
                    <div>
                      <div style={{ background: '#FBBF24', padding: '6px 10px', borderRadius: 8, fontWeight: 700 }}>{c.count}</div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    );
  }
  const recentActivities = [
    { id: 1, type: "assignment", title: "Physics Lab Report", course: "Physics 101", dueDate: "2025-01-08", status: "pending" },
    { id: 2, type: "workbook", title: "Chapter 5 Exercises", course: "Mathematics", completed: true, status: "completed" },
    { id: 3, type: "assignment", title: "Chemical Bonding Essay", course: "Chemistry", dueDate: "2025-01-10", status: "submitted" },
  ];

  const courses = [
    { id: 1, name: "Physics 101", progress: 75, assignments: 3, workbooks: 8 },
    { id: 2, name: "Mathematics", progress: 90, assignments: 2, workbooks: 12 },
    { id: 3, name: "Chemistry", progress: 60, assignments: 4, workbooks: 6 },
    { id: 4, name: "Computer Science", progress: 85, assignments: 1, workbooks: 10 },
  ];

  // Purple background - inline hex fallback ensures color shows even if Tailwind color missing
  const purpleBgStyle = { backgroundColor: "#F3E8FF", borderColor: "#EDE8FF" };

  return (
    <div className="bg-white min-h-screen">
      <div className="max-w-7xl mx-auto px-6 py-6">
        {/* Header */}
        <header className="mb-6">
          <h1 className="text-3xl font-bold text-slate-900">Welcome back, {userName}!</h1>
          <p className="text-sm text-slate-500 mt-1">
            {userRole === "student"
              ? "Here's your learning progress overview"
              : userRole === "faculty"
              ? "Here's your teaching dashboard overview"
              : "Here's your administrative dashboard overview"}
          </p>
        </header>

        {/* TOP SUMMARY ROW: Four boxes (exact row on md+, stacked on small screens) */}
        <section className="mb-8">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            {/* Active Courses */}
            <div className="rounded-lg border p-5 shadow-sm" style={purpleBgStyle}>
              <div className="flex items-start justify-between">
                <div>
                  <div className="text-sm text-slate-600">Active Courses</div>
                  <div className="text-2xl font-bold text-slate-900 mt-2">4</div>
                  <div className="text-xs text-slate-500 mt-1">Enrolled courses</div>
                </div>
                <BookOpen className="h-6 w-6 text-slate-500" />
              </div>
            </div>

            {/* Pending Assignments */}
            <div className="rounded-lg border p-5 shadow-sm" style={purpleBgStyle}>
              <div className="flex items-start justify-between">
                <div>
                  <div className="text-sm text-slate-600">Pending Assignments</div>
                  <div className="text-2xl font-bold text-slate-900 mt-2">3</div>
                  <div className="text-xs text-slate-500 mt-1">Due this week</div>
                </div>
                <FileText className="h-6 w-6 text-slate-500" />
              </div>
            </div>

            {/* Avg Progress */}
            <div className="rounded-lg border p-5 shadow-sm" style={purpleBgStyle}>
              <div className="flex items-start justify-between">
                <div>
                  <div className="text-sm text-slate-600">Avg Progress</div>
                  <div className="text-2xl font-bold text-slate-900 mt-2">77%</div>
                  <div className="text-xs text-slate-500 mt-1">Across all courses</div>
                </div>
                <TrendingUp className="h-6 w-6 text-slate-500" />
              </div>
            </div>

            {/* Study Streak */}
            <div className="rounded-lg border p-5 shadow-sm" style={purpleBgStyle}>
              <div className="flex items-start justify-between">
                <div>
                  <div className="text-sm text-slate-600">Study Streak</div>
                  <div className="text-2xl font-bold text-slate-900 mt-2">12</div>
                  <div className="text-xs text-slate-500 mt-1">Days in a row</div>
                </div>
                <Calendar className="h-6 w-6 text-slate-500" />
              </div>
            </div>
          </div>
        </section>

        {/* MAIN CONTENT: Recent Activity (left) + Course Progress (right)
            Both main cards use light purple background and have inner white areas for lists */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Recent Activity */}
          <section className="lg:col-span-4">
            <div className="rounded-lg border p-4 shadow-sm" style={purpleBgStyle}>
              <div className="mb-4">
                <h2 className="text-sm font-medium text-slate-800">Recent Activity</h2>
                <p className="text-xs text-slate-500">Your latest assignments and workbook entries</p>
              </div>

              {/* inner white container for list items so they remain readable */}
              <div className="space-y-3 bg-transparent">
                {recentActivities.map((a) => (
                  <div key={a.id} className="flex items-center justify-between p-3 bg-white rounded-md border">
                    <div className="flex items-center gap-3">
                      {a.type === "assignment" ? (
                        <FileText className="h-5 w-5 text-blue-500" />
                      ) : (
                        <BookOpen className="h-5 w-5 text-green-500" />
                      )}
                      <div>
                        <div className="font-medium text-slate-800">{a.title}</div>
                        <div className="text-xs text-slate-500">{a.course}</div>
                      </div>
                    </div>

                    <div className="flex items-center gap-3">
                      {a.dueDate && (
                        <div className="flex items-center gap-1 text-xs text-slate-500">
                          <Clock className="h-3 w-3" />
                          <span>{a.dueDate}</span>
                        </div>
                      )}
                      <Badge
                        style={{
                          backgroundColor: a.status === "pending" ? "#FACC15" : a.status === "submitted" ? "#4ADE80" : "#E5E7EB",
                          color: "black",
                          fontWeight: 600,
                        }}
                      >
                        {a.status === "pending" ? "Pending" : a.status === "submitted" ? "Submitted" : "Completed"}
                      </Badge>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </section>

          {/* Course Progress */}
          <section className="lg:col-span-8">
            <div className="rounded-lg border p-6 shadow-sm" style={purpleBgStyle}>
              <div className="mb-4">
                <h2 className="text-sm font-medium text-slate-800">Course Progress</h2>
                <p className="text-xs text-slate-500">Your progress across all enrolled courses</p>
              </div>

              {/* inner white area for progress rows */}
              <div className="space-y-6 bg-transparent">
                {courses.map((course) => (
                  <div key={course.id} className="space-y-2 bg-transparent">
                    <div className="flex justify-between items-center">
                      <span className="font-medium text-slate-800">{course.name}</span>
                      <span className="text-sm text-slate-500">{course.progress}%</span>
                    </div>
                    <div className="bg-white p-3 rounded-md border">
                      <Progress value={course.progress} className="h-3 rounded-full" />
                      <div className="flex gap-4 text-sm text-slate-500 mt-3">
                        <span>{course.assignments} assignments</span>
                        <span>{course.workbooks} workbook entries</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </section>
        </div>
      </div>
    </div>
  );
}
