import { BookOpen, Calendar, FileText, Home, Library, User, Bell, Users, Settings, BarChart3 } from "lucide-react";
import { Button } from "./ui/button";
import { Badge } from "./ui/badge";

interface LMSNavigationProps {
  currentView: string;
  setCurrentView: (view: string) => void;
  deadlineCount: number;
  userRole?: 'student' | 'faculty' | 'admin';
}

export default function LMSNavigation({ currentView, setCurrentView, deadlineCount, userRole = 'student' }: LMSNavigationProps) {
  const getNavItems = () => {
    const baseItems = [
      { id: 'dashboard', label: 'Dashboard', icon: Home },
      { id: 'profile', label: 'Profile', icon: User },
    ];

    if (userRole === 'student') {
      return [
        ...baseItems.slice(0, 1), // Dashboard
        { id: 'courses', label: 'My Courses', icon: BookOpen },
        { id: 'assignments', label: 'Assignments', icon: FileText, badge: deadlineCount > 0 ? deadlineCount : null },
        { id: 'workbooks', label: 'Workbooks', icon: Calendar },
        { id: 'library', label: 'Reference Library', icon: Library },
        ...baseItems.slice(1), // Profile
      ];
    } else if (userRole === 'faculty') {
      return [
        ...baseItems.slice(0, 1), // Dashboard
        { id: 'courses', label: 'My Courses', icon: BookOpen },
        { id: 'assignments', label: 'Assignment Review', icon: FileText },
        { id: 'students', label: 'Student Management', icon: Users },
        { id: 'library', label: 'Resource Library', icon: Library },
        ...baseItems.slice(1), // Profile
      ];
    } else { // admin
      return [
        ...baseItems.slice(0, 1), // Dashboard
        { id: 'courses', label: 'Course Management', icon: BookOpen },
        { id: 'users', label: 'User Management', icon: Users },
        { id: 'analytics', label: 'Analytics', icon: BarChart3 },
        { id: 'settings', label: 'System Settings', icon: Settings },
        { id: 'library', label: 'Content Library', icon: Library },
        ...baseItems.slice(1), // Profile
      ];
    }
  };

  const navItems = getNavItems();

  return (
    <nav className="w-64 bg-card border-r border-border p-4">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-primary">EduPortal</h1>
        <p className="text-sm text-muted-foreground">Learning Management System</p>
      </div>
      
      <div className="space-y-2">
        {navItems.map((item) => {
          const Icon = item.icon;
          return (
            <Button
              key={item.id}
              variant={currentView === item.id ? "default" : "ghost"}
              className="w-full justify-start gap-3"
              onClick={() => setCurrentView(item.id)}
            >
              <Icon className="h-4 w-4" />
              <span className="flex-1 text-left">{item.label}</span>
              {item.badge && (
                <Badge
  className="ml-auto"
  style={{
    backgroundColor: "#FACC15",  // yellow
    color: "black",
    fontWeight: 600,
  }}
>
  {item.badge}
</Badge>

              )}
            </Button>
          );
        })}
      </div>

      {deadlineCount > 0 && (
  <div
    className="mt-8 p-3 border rounded-lg"
    style={{
      backgroundColor: "rgba(134, 239, 172, 0.25)", // light green background
      borderColor: "rgba(34, 197, 94, 0.5)",        // green border
    }}
  >
    <div className="flex items-center gap-2 mb-2">
      <Bell className="h-4 w-4" style={{ color: "#22c55e" }} />  {/* green icon */}
      <span className="text-sm font-medium" style={{ color: "#16a34a" }}>
        Upcoming Deadlines
      </span>
    </div>
    <p className="text-xs" style={{ color: "#14532d" }}>
      You have {deadlineCount} assignment{deadlineCount > 1 ? "s" : ""} due soon
    </p>
  </div>
)}

    </nav>
  );
}