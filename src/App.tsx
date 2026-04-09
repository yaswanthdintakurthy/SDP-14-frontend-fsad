import { useState } from "react";
import LoginPage, { UserInfo } from "./components/LoginPage";
import LMSNavigation from "./components/LMSNavigation";
import Dashboard from "./components/Dashboard";
import AssignmentSubmission from "./components/AssignmentSubmission";
import CoursesView from "./components/CoursesView";
import BooksReferences from "./components/BooksReferences";
import WorkbooksView from "./components/WorkbooksView";
import StudentManagement from "./components/StudentManagement";
import { Toaster } from "./components/ui/sonner";

export default function App() {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [currentView, setCurrentView] = useState("dashboard");
  const [userInfo, setUserInfo] = useState<UserInfo | null>(null);

  const handleLogin = (user: UserInfo) => {
    setIsLoggedIn(true);
    setUserInfo(user);
  };

  const handleLogout = () => {
    setIsLoggedIn(false);
    setUserInfo(null);
    setCurrentView("dashboard");
  };

  const deadlineCount = 3;

  const renderCurrentView = () => {
    switch (currentView) {
      case "dashboard":
        return <Dashboard userRole={userInfo?.role} userName={userInfo?.name} userId={userInfo?.id} />;
      case "courses":
        return <CoursesView userRole={userInfo?.role} />;
      case "assignments":
        return (
          <AssignmentSubmission
            userRole={userInfo?.role}
            userId={userInfo?.id}
            userName={userInfo?.name}
          />
        );
      case "library":
        return <BooksReferences />;
      case "workbooks":
        return <WorkbooksView />;
      case "students":
        return <StudentManagement />;
      case "users":
        return (
          <div className="p-6">
            <h2 className="text-3xl font-bold">User Management</h2>
            <p className="text-muted-foreground">
              Manage student and faculty accounts, permissions, and access levels.
            </p>
          </div>
        );
      case "analytics":
        return (
          <div className="p-6">
            <h2 className="text-3xl font-bold">Analytics</h2>
            <p className="text-muted-foreground">
              View system-wide statistics, usage reports, and performance metrics.
            </p>
          </div>
        );
      case "settings":
        return (
          <div className="p-6">
            <h2 className="text-3xl font-bold">System Settings</h2>
            <p className="text-muted-foreground">
              Configure system settings, manage integrations, and customize the platform.
            </p>
          </div>
        );
      case "profile":
        return (
          <div className="p-6 space-y-6">
            <h2 className="text-3xl font-bold">Profile</h2>
            <div className="bg-card p-6 rounded-lg border">
              <h3 className="text-xl font-semibold mb-4">
                {userInfo?.role === 'student' ? 'Student Information' : 
                 userInfo?.role === 'faculty' ? 'Faculty Information' : 'Administrator Information'}
              </h3>
              <div className="space-y-2">
                <div>
                  <strong>{userInfo?.role === 'student' ? 'Student ID' : 
                           userInfo?.role === 'faculty' ? 'Faculty ID' : 'Admin ID'}:</strong> {userInfo?.id}
                </div>
                <div>
                  <strong>Name:</strong> {userInfo?.name}
                </div>
                <div>
                  <strong>Role:</strong> {userInfo?.role && (userInfo.role.charAt(0).toUpperCase() + userInfo.role.slice(1))}
                </div>
                <div>
                  <strong>Status:</strong> Active
                </div>
                {userInfo?.role === 'student' && (
                  <>
                    <div>
                      <strong>Year:</strong> Sophomore
                    </div>
                    <div>
                      <strong>Major:</strong> Physics
                    </div>
                  </>
                )}
                {userInfo?.role === 'faculty' && (
                  <>
                    <div>
                      <strong>Department:</strong> Physics
                    </div>
                    <div>
                      <strong>Title:</strong> Associate Professor
                    </div>
                  </>
                )}
                {userInfo?.role === 'admin' && (
                  <>
                    <div>
                      <strong>Department:</strong> IT Administration
                    </div>
                    <div>
                      <strong>Access Level:</strong> System Administrator
                    </div>
                  </>
                )}
              </div>
              <button
                onClick={handleLogout}
                className="mt-4 px-4 py-2 bg-destructive text-destructive-foreground rounded hover:bg-destructive/90"
              >
                Logout
              </button>
            </div>
          </div>
        );
      default:
        return <Dashboard />;
    }
  };

  if (!isLoggedIn) {
    return (
      <>
        <LoginPage onLogin={handleLogin} />
        <Toaster />
      </>
    );
  }

  return (
    <div className="h-screen flex bg-background">
      <LMSNavigation
        currentView={currentView}
        setCurrentView={setCurrentView}
        deadlineCount={deadlineCount}
        userRole={userInfo?.role}
      />
      <main className="flex-1 overflow-auto">
        {renderCurrentView()}
      </main>
      <Toaster />
    </div>
  );
}