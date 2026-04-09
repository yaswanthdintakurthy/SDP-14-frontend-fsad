// Dashboard.tsx  (replace entire file)
import { Calendar, Clock, BookOpen, FileText, TrendingUp, Users } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "./ui/card";
import { Progress } from "./ui/progress";
import { Badge } from "./ui/badge";

interface DashboardProps {
  userRole?: 'student' | 'faculty' | 'admin';
  userName?: string;
}

export default function Dashboard({ userRole = 'student', userName = 'User' }: DashboardProps) {
  const recentActivities = [
    { id: 1, type: 'assignment', title: 'Physics Lab Report', course: 'Physics 101', dueDate: '2025-01-08', status: 'pending' },
    { id: 2, type: 'workbook', title: 'Chapter 5 Exercises', course: 'Mathematics', completed: true },
    { id: 3, type: 'assignment', title: 'Chemical Bonding Essay', course: 'Chemistry', dueDate: '2025-01-10', status: 'submitted' },
  ];

  const courses = [
    { id: 1, name: 'Physics 101', progress: 75, assignments: 3, workbooks: 8 },
    { id: 2, name: 'Mathematics', progress: 90, assignments: 2, workbooks: 12 },
    { id: 3, name: 'Chemistry', progress: 60, assignments: 4, workbooks: 6 },
    { id: 4, name: 'Computer Science', progress: 85, assignments: 1, workbooks: 10 },
  ];

  return (
    // Page background white
    <div className="bg-white min-h-screen p-6">
      {/* Header */}
      <div className="mb-6">
        <h2 className="text-3xl font-bold text-slate-900">Welcome back, {userName}!</h2>
        <p className="text-sm text-slate-500">
          {userRole === 'student' ? "Here's your learning progress overview" :
           userRole === 'faculty' ? "Here's your teaching dashboard overview" :
           "Here's your administrative dashboard overview"}
        </p>
      </div>

      {/* New layout:
          left column: vertical compact box with Active + Pending
          middle: Recent Activity
          right: Course Progress
      */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">

        {/* Left: vertical compact stats (stacked) */}
        <div className="lg:col-span-3 space-y-4">
          {/* wrapper box to visually group the two small cards */}
          <div className="space-y-3">
            <Card className="bg-purple-50 border border-purple-100 shadow-sm">
              <CardHeader className="flex items-center justify-between px-4 py-3">
                <CardTitle className="text-sm font-medium text-slate-800">Active Courses</CardTitle>
                <BookOpen className="h-4 w-4 text-slate-500" />
              </CardHeader>
              <CardContent className="px-4 py-3">
                <div className="text-xl font-semibold text-slate-900">4</div>
                <p className="text-xs text-slate-500">Enrolled courses</p>
              </CardContent>
            </Card>

            <Card className="bg-purple-50 border border-purple-100 shadow-sm">
              <CardHeader className="flex items-center justify-between px-4 py-3">
                <CardTitle className="text-sm font-medium text-slate-800">Pending Assignments</CardTitle>
                <FileText className="h-4 w-4 text-slate-500" />
              </CardHeader>
              <CardContent className="px-4 py-3">
                <div className="text-xl font-semibold text-slate-900">3</div>
                <p className="text-xs text-slate-500">Due this week</p>
              </CardContent>
            </Card>
          </div>

          {/* Recent Activity (placed under the two stacked cards in same column on smaller screens,
              but on desktop it's in the middle column — we will duplicate positioning using grid) */}
        </div>

        {/* Middle: Recent Activity */}
        <div className="lg:col-span-4">
          <Card className="bg-purple-50 border border-purple-100 shadow-sm h-full">
            <CardHeader className="px-4 py-3">
              <CardTitle className="text-sm font-medium text-slate-800">Recent Activity</CardTitle>
              <CardDescription>Your latest assignments and workbook entries</CardDescription>
            </CardHeader>
            <CardContent className="px-4 py-4">
              <div className="space-y-3">
                {recentActivities.map((activity) => (
                  <div key={activity.id} className="flex items-center justify-between p-3 bg-white rounded-md border">
                    <div className="flex items-center gap-3">
                      {activity.type === 'assignment' ? 
                        <FileText className="h-4 w-4 text-blue-500" /> : 
                        <BookOpen className="h-4 w-4 text-green-500" />
                      }
                      <div>
                        <p className="font-medium text-slate-800">{activity.title}</p>
                        <p className="text-xs text-slate-500">{activity.course}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      {activity.dueDate && (
                        <div className="flex items-center gap-1 text-xs text-slate-500">
                          <Clock className="h-3 w-3" />
                          {activity.dueDate}
                        </div>
                      )}
                      <Badge
                        style={{
                          backgroundColor:
                            activity.status === "pending"
                              ? "#FACC15"
                              : activity.status === "submitted"
                              ? "#4ADE80"
                              : "#E5E7EB",
                          color: "black",
                          fontWeight: 600,
                        }}
                      >
                        {activity.status === "pending"
                          ? "Pending"
                          : activity.status === "submitted"
                          ? "Submitted"
                          : "Completed"}
                      </Badge>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Right: Course Progress (bigger) */}
        <div className="lg:col-span-5">
          <Card className="bg-purple-50 border border-purple-100 shadow-sm">
            <CardHeader className="px-4 py-3">
              <CardTitle className="text-sm font-medium text-slate-800">Course Progress</CardTitle>
              <CardDescription>Your progress across all enrolled courses</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4 px-4 py-4">
              {courses.map((course) => (
                <div key={course.id} className="space-y-2">
                  <div className="flex justify-between items-center">
                    <span className="font-medium text-slate-800">{course.name}</span>
                    <span className="text-sm text-slate-500">{course.progress}%</span>
                  </div>
                  <Progress value={course.progress} className="h-2 rounded-full" />
                  <div className="flex gap-4 text-sm text-slate-500">
                    <span>{course.assignments} assignments</span>
                    <span>{course.workbooks} workbook entries</span>
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
