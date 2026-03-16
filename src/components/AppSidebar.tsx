import { useNavigate, useLocation } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { User } from "@supabase/supabase-js";
import {
  LayoutDashboard,
  Users,
  DollarSign,
  Briefcase,
  FileText,
  Globe,
  LogOut,
  FolderOpen,
} from "lucide-react";
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarFooter,
  useSidebar,
} from "@/components/ui/sidebar";

const navItems = [
  { title: "Dashboard", url: "/dashboard", icon: LayoutDashboard },
  { title: "Projects", url: "/dashboard/projects", icon: FolderOpen },
  { title: "CRM", url: "/dashboard/crm", icon: Users },
  { title: "Finance", url: "/dashboard/finance", icon: DollarSign },
  { title: "Portals", url: "/dashboard/portals", icon: Briefcase },
  { title: "Portfolio", url: "/dashboard/portfolio", icon: Globe },
  { title: "Frameworks", url: "/dashboard/frameworks", icon: FileText },
];

interface AppSidebarProps {
  user: User | null;
}

export function AppSidebar({ user }: AppSidebarProps) {
  const { state } = useSidebar();
  const collapsed = state === "collapsed";
  const navigate = useNavigate();
  const location = useLocation();

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    navigate("/auth");
  };

  return (
    <Sidebar collapsible="icon" className="border-r border-border">
      <div className="h-14 flex items-center px-4 border-b border-border">
        {!collapsed && (
          <div>
            <span className="text-sm font-display font-bold text-foreground">Kraton</span>
            <span className="text-[10px] text-muted-foreground ml-1.5 uppercase tracking-[0.15em] font-body">OS</span>
          </div>
        )}
        {collapsed && (
          <span className="text-sm font-display font-bold text-foreground mx-auto">K</span>
        )}
      </div>

      <SidebarContent className="pt-2">
        <SidebarGroup>
          <SidebarGroupLabel className="text-[10px] uppercase tracking-[0.15em] text-muted-foreground font-body">
            Workspace
          </SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {navItems.map((item) => {
                const active = location.pathname === item.url;
                return (
                  <SidebarMenuItem key={item.title}>
                    <SidebarMenuButton
                      onClick={() => navigate(item.url)}
                      className={`transition-colors duration-150 ${
                        active
                          ? "bg-muted text-primary font-medium"
                          : "text-sidebar-foreground hover:bg-sidebar-accent hover:text-foreground"
                      }`}
                    >
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

      <SidebarFooter className="border-t border-border p-2">
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton
              onClick={handleSignOut}
              className="text-sidebar-foreground hover:bg-sidebar-accent hover:text-foreground transition-colors duration-150"
            >
              <LogOut className="h-4 w-4 shrink-0" />
              {!collapsed && <span className="font-body text-sm">Sign Out</span>}
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarFooter>
    </Sidebar>
  );
}
