import { useEffect, useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/AppSidebar";
import { DashboardContent } from "@/components/DashboardContent";
import { CRMPage } from "@/components/crm/CRMPage";
import { FinancePage } from "@/components/finance/FinancePage";
import { ProjectsPage } from "@/components/projects/ProjectsPage";
import { PortalsPage } from "@/components/portals/PortalsPage";
import { PortfolioPage } from "@/components/portfolio/PortfolioPage";
import { FrameworksPage } from "@/components/frameworks/FrameworksPage";
import { BoardsPage } from "@/components/boards/BoardsPage";
import { NotesPage } from "@/components/notes/NotesPage";
import { ProfilePage } from "@/components/profile/ProfilePage";
import { SlideshowPage } from "@/components/slideshow/SlideshowPage";
import { CalendarPage } from "@/components/calendar/CalendarPage";
import { NotificationBell } from "@/components/notifications/NotificationBell";
import { User } from "@supabase/supabase-js";

const Dashboard = () => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      if (!session) { navigate("/auth"); }
      else {
        setUser(session.user);
        supabase.from("profiles").upsert({ id: session.user.id, email: session.user.email, full_name: session.user.user_metadata?.full_name ?? null }, { onConflict: "id" }).then(() => {});
      }
      setLoading(false);
    });
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (!session) { navigate("/auth"); }
      else {
        setUser(session.user);
        supabase.from("profiles").upsert({ id: session.user.id, email: session.user.email, full_name: session.user.user_metadata?.full_name ?? null }, { onConflict: "id" }).then(() => {});
      }
      setLoading(false);
    });
    return () => subscription.unsubscribe();
  }, [navigate]);

  if (loading) {
    return <div className="min-h-screen flex items-center justify-center bg-background"><div className="h-5 w-5 border-2 border-primary border-t-transparent rounded-full animate-spin" /></div>;
  }

  const renderContent = () => {
    const path = location.pathname;
    if (path.startsWith("/dashboard/boards")) return <BoardsPage user={user} />;
    if (path.startsWith("/dashboard/notes")) return <NotesPage user={user} />;
    if (path.startsWith("/dashboard/slideshow")) return <SlideshowPage user={user} />;
    if (path.startsWith("/dashboard/crm")) return <CRMPage user={user} />;
    if (path.startsWith("/dashboard/finance")) return <FinancePage user={user} />;
    if (path.startsWith("/dashboard/projects")) return <ProjectsPage user={user} />;
    if (path.startsWith("/dashboard/portals")) return <PortalsPage user={user} />;
    if (path.startsWith("/dashboard/portfolio")) return <PortfolioPage user={user} />;
    if (path.startsWith("/dashboard/frameworks")) return <FrameworksPage user={user} />;
    if (path.startsWith("/dashboard/profile")) return <ProfilePage user={user} />;
    return <DashboardContent user={user} />;
  };

  return (
    <SidebarProvider>
      <div className="min-h-screen flex w-full">
        <AppSidebar user={user} />
        <div className="flex-1 flex flex-col min-w-0">
          <header className="h-14 flex items-center border-b border-border px-4 shrink-0">
            <SidebarTrigger className="text-muted-foreground hover:text-foreground" />
            <div className="ml-auto flex items-center gap-3">
              <span className="text-xs text-muted-foreground font-body truncate max-w-[200px]">{user?.email}</span>
            </div>
          </header>
          <main className="flex-1 overflow-auto">{renderContent()}</main>
        </div>
      </div>
    </SidebarProvider>
  );
};

export default Dashboard;
