import { useNavigate, useLocation } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { User } from "@supabase/supabase-js";
import {
  LayoutDashboard, Users, DollarSign, Briefcase, FileText, Globe, LogOut,
  FolderOpen, Kanban, Shield, StickyNote, Brain, UserCircle, ChevronDown, Presentation, CalendarDays,
} from "lucide-react";
import {
  Sidebar, SidebarContent, SidebarGroup, SidebarGroupContent, SidebarGroupLabel,
  SidebarMenu, SidebarMenuButton, SidebarMenuItem, SidebarFooter, useSidebar,
} from "@/components/ui/sidebar";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { useUserRole } from "@/hooks/useUserRole";
import { useState } from "react";

const mainNavItems = [
  { title: "Dashboard", url: "/dashboard", icon: LayoutDashboard },
  { title: "Projects", url: "/dashboard/projects", icon: FolderOpen },
  { title: "CRM", url: "/dashboard/crm", icon: Users },
  { title: "Finance", url: "/dashboard/finance", icon: DollarSign },
  { title: "Portals", url: "/dashboard/portals", icon: Briefcase },
  { title: "Calendar", url: "/dashboard/calendar", icon: CalendarDays },
  { title: "Portfolio", url: "/dashboard/portfolio", icon: Globe },
  { title: "Frameworks", url: "/dashboard/frameworks", icon: FileText },
];

const brainstormItems = [
  { title: "Boards", url: "/dashboard/boards", icon: Kanban },
  { title: "Notes", url: "/dashboard/notes", icon: StickyNote },
  { title: "Slideshow", url: "/dashboard/slideshow", icon: Presentation },
];

interface AppSidebarProps { user: User | null; }

export function AppSidebar({ user }: AppSidebarProps) {
  const { state } = useSidebar();
  const collapsed = state === "collapsed";
  const navigate = useNavigate();
  const location = useLocation();
  const { data: role } = useUserRole(user?.id);
  const [brainstormOpen, setBrainstormOpen] = useState(
    location.pathname.includes("/dashboard/boards") || location.pathname.includes("/dashboard/notes") || location.pathname.includes("/dashboard/slideshow")
  );

  const handleSignOut = async () => { await supabase.auth.signOut(); navigate("/auth"); };
  const isActive = (url: string) => location.pathname === url || (url !== "/dashboard" && location.pathname.startsWith(url));

  const navButton = (item: { title: string; url: string; icon: any }) => {
    const active = isActive(item.url);
    return (
      <SidebarMenuItem key={item.title}>
        <SidebarMenuButton onClick={() => navigate(item.url)} className={`transition-colors duration-150 ${active ? "bg-muted text-primary font-medium" : "text-sidebar-foreground hover:bg-sidebar-accent hover:text-foreground"}`}>
          <item.icon className="h-4 w-4 shrink-0" />
          {!collapsed && <span className="font-body text-sm">{item.title}</span>}
        </SidebarMenuButton>
      </SidebarMenuItem>
    );
  };

  return (
    <Sidebar collapsible="icon" className="border-r border-border">
      <div className="h-14 flex items-center px-4 border-b border-border">
        {!collapsed ? (
          <div><span className="text-sm font-display font-bold text-foreground">Kraton</span><span className="text-[10px] text-muted-foreground ml-1.5 uppercase tracking-[0.15em] font-body">OS</span></div>
        ) : (
          <span className="text-sm font-display font-bold text-foreground mx-auto">K</span>
        )}
      </div>
      <SidebarContent className="pt-2">
        <SidebarGroup>
          <SidebarGroupLabel className="text-[10px] uppercase tracking-[0.15em] text-muted-foreground font-body">Workspace</SidebarGroupLabel>
          <SidebarGroupContent><SidebarMenu>{mainNavItems.map(navButton)}</SidebarMenu></SidebarGroupContent>
        </SidebarGroup>
        <SidebarGroup>
          {collapsed ? (
            <SidebarGroupContent><SidebarMenu>{brainstormItems.map(navButton)}</SidebarMenu></SidebarGroupContent>
          ) : (
            <Collapsible open={brainstormOpen} onOpenChange={setBrainstormOpen}>
              <CollapsibleTrigger className="flex items-center justify-between w-full px-2 py-1.5 text-[10px] uppercase tracking-[0.15em] text-muted-foreground font-body hover:text-foreground transition-colors">
                <span className="flex items-center gap-1.5"><Brain className="h-3 w-3" /> Brainstorming</span>
                <ChevronDown className={`h-3 w-3 transition-transform ${brainstormOpen ? "rotate-180" : ""}`} />
              </CollapsibleTrigger>
              <CollapsibleContent><SidebarGroupContent><SidebarMenu>{brainstormItems.map(navButton)}</SidebarMenu></SidebarGroupContent></CollapsibleContent>
            </Collapsible>
          )}
        </SidebarGroup>
        {role === "admin" && (
          <SidebarGroup>
            <SidebarGroupLabel className="text-[10px] uppercase tracking-[0.15em] text-muted-foreground font-body">Admin</SidebarGroupLabel>
            <SidebarGroupContent>
              <SidebarMenu>
                <SidebarMenuItem>
                  <SidebarMenuButton onClick={() => navigate("/admin")} className="text-sidebar-foreground hover:bg-sidebar-accent hover:text-foreground transition-colors duration-150">
                    <Shield className="h-4 w-4 shrink-0" />
                    {!collapsed && <span className="font-body text-sm">Admin Panel</span>}
                  </SidebarMenuButton>
                </SidebarMenuItem>
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
        )}
      </SidebarContent>
      <SidebarFooter className="border-t border-border p-2">
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton onClick={() => navigate("/dashboard/profile")}
              className={`transition-colors duration-150 ${isActive("/dashboard/profile") ? "bg-muted text-primary font-medium" : "text-sidebar-foreground hover:bg-sidebar-accent hover:text-foreground"}`}>
              <UserCircle className="h-4 w-4 shrink-0" />
              {!collapsed && <span className="font-body text-sm">Profile</span>}
            </SidebarMenuButton>
          </SidebarMenuItem>
          <SidebarMenuItem>
            <SidebarMenuButton onClick={handleSignOut} className="text-sidebar-foreground hover:bg-sidebar-accent hover:text-foreground transition-colors duration-150">
              <LogOut className="h-4 w-4 shrink-0" />
              {!collapsed && <span className="font-body text-sm">Sign Out</span>}
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarFooter>
    </Sidebar>
  );
}
