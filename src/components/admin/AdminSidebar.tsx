import { BrandMark } from "@/components/BrandMark";
import { useNavigate, useLocation } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { LayoutDashboard, Users, CreditCard, Receipt, LogOut, ArrowLeft, Settings, MessageSquare } from "lucide-react";
import {
  Sidebar, SidebarContent, SidebarGroup, SidebarGroupContent, SidebarGroupLabel,
  SidebarMenu, SidebarMenuButton, SidebarMenuItem, SidebarFooter, useSidebar,
} from "@/components/ui/sidebar";

const adminNavItems = [
  { title: "Overview", url: "/admin", icon: LayoutDashboard },
  { title: "Users", url: "/admin/users", icon: Users },
  { title: "Memberships", url: "/admin/memberships", icon: CreditCard },
  { title: "Payment Proofs", url: "/admin/payments", icon: Receipt },
  { title: "Client Feedback", url: "/admin/feedback", icon: MessageSquare },
  { title: "Settings", url: "/admin/settings", icon: Settings },
];

export function AdminSidebar() {
  const { state, isMobile, setOpenMobile } = useSidebar();
  const collapsed = state === "collapsed";
  const navigate = useNavigate();
  const location = useLocation();

  const handleSignOut = async () => { await supabase.auth.signOut(); navigate("/auth"); };

  return (
    <Sidebar collapsible="icon" className="border-r border-sidebar-border">
      <div className="h-20 flex items-center px-4 border-b border-sidebar-border text-sidebar-accent-foreground"><BrandMark compact={collapsed} /></div>
      <SidebarContent className="pt-4 px-1">
        <SidebarGroup>
          <SidebarGroupLabel className="text-[10px] uppercase tracking-[0.15em] text-sidebar-foreground font-body">Management</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {adminNavItems.map((item) => {
                const active = location.pathname === item.url || (item.url !== "/admin" && location.pathname.startsWith(item.url));
                return (
                  <SidebarMenuItem key={item.title}>
                    <SidebarMenuButton tooltip={item.title} isActive={active} onClick={() => { navigate(item.url); if (isMobile) setOpenMobile(false); }} className={`h-10 gap-3 transition-colors duration-150 ${active ? "bg-sidebar-accent text-sidebar-primary font-semibold" : "text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"}`}>
                      <item.icon className="h-4 w-4 shrink-0" />
                      {!collapsed && <span className="font-body text-sm">{item.title}</span>}
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                );
              })}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>
      <SidebarFooter className="border-t border-sidebar-border p-3">
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton onClick={() => navigate("/dashboard")} className="text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground transition-colors duration-150">
              <ArrowLeft className="h-4 w-4 shrink-0" />
              {!collapsed && <span className="font-body text-sm">Back to Dashboard</span>}
            </SidebarMenuButton>
          </SidebarMenuItem>
          <SidebarMenuItem>
            <SidebarMenuButton onClick={handleSignOut} className="text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground transition-colors duration-150">
              <LogOut className="h-4 w-4 shrink-0" />
              {!collapsed && <span className="font-body text-sm">Sign Out</span>}
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarFooter>
    </Sidebar>
  );
}
