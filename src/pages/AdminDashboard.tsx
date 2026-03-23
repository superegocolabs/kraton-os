import { useEffect, useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { AdminSidebar } from "@/components/admin/AdminSidebar";
import { AdminOverview } from "@/components/admin/AdminOverview";
import { AdminUsersPage } from "@/components/admin/AdminUsersPage";
import { AdminMembershipsPage } from "@/components/admin/AdminMembershipsPage";
import { AdminPaymentProofsPage } from "@/components/admin/AdminPaymentProofsPage";
import { AdminSettingsPage } from "@/components/admin/AdminSettingsPage";
import { AdminFeedbackPage } from "@/components/admin/AdminFeedbackPage";
import { NotificationBell } from "@/components/notifications/NotificationBell";
import { User } from "@supabase/supabase-js";

const AdminDashboard = () => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [isAdmin, setIsAdmin] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    const checkAdminAccess = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) { navigate("/auth"); return; }
      setUser(session.user);
      const { data: roleData } = await supabase.from("user_roles").select("role").eq("user_id", session.user.id).eq("role", "admin").maybeSingle();
      if (!roleData) { navigate("/dashboard"); return; }
      setIsAdmin(true);
      setLoading(false);
    };
    checkAdminAccess();
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => { if (!session) navigate("/auth"); });
    return () => subscription.unsubscribe();
  }, [navigate]);

  if (loading || !isAdmin) {
    return <div className="min-h-screen flex items-center justify-center bg-background"><div className="h-5 w-5 border-2 border-primary border-t-transparent rounded-full animate-spin" /></div>;
  }

  const renderContent = () => {
    const path = location.pathname;
    if (path.startsWith("/admin/users")) return <AdminUsersPage />;
    if (path.startsWith("/admin/memberships")) return <AdminMembershipsPage user={user} />;
    if (path.startsWith("/admin/payments")) return <AdminPaymentProofsPage />;
    if (path.startsWith("/admin/settings")) return <AdminSettingsPage user={user} />;
    if (path.startsWith("/admin/feedback")) return <AdminFeedbackPage />;
    return <AdminOverview />;
  };

  return (
    <SidebarProvider>
      <div className="min-h-screen flex w-full">
        <AdminSidebar />
        <div className="flex-1 flex flex-col">
          <header className="h-14 flex items-center border-b border-border px-4">
            <SidebarTrigger className="text-muted-foreground hover:text-foreground" />
            <div className="ml-auto flex items-center gap-3">
              <NotificationBell userId={user?.id} />
              <span className="text-[10px] text-destructive uppercase tracking-wider font-body font-medium">Admin</span>
              <span className="text-xs text-muted-foreground font-body">{user?.email}</span>
            </div>
          </header>
          <main className="flex-1 overflow-auto">{renderContent()}</main>
        </div>
      </div>
    </SidebarProvider>
  );
};

export default AdminDashboard;
