import { NavLink, Outlet, useLocation } from "react-router-dom";
import {
  BarChart3,
  ChevronRight,
  FileText,
  Factory,
  Library,
  LogOut,
  Settings,
  Tags,
} from "lucide-react";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarInset,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarProvider,
  SidebarRail,
  SidebarTrigger,
} from "@/components/ui/sidebar";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useAuth } from "@/contexts/AuthContext";

const NAV_ITEMS = [
  { to: "/production", label: "Xưởng sản xuất nội dung", icon: Factory, match: (path: string) => path.startsWith("/production") },
  { to: "/", label: "Tổng quan", icon: BarChart3, match: (path: string) => path === "/" },
  {
    to: "/documents",
    label: "Kho tài liệu & tin tức",
    icon: Library,
    match: (path: string) => path.startsWith("/documents"),
  },
  {
    to: "/keywords",
    label: "Từ khóa & Chủ đề",
    icon: Tags,
    match: (path: string) => path.startsWith("/keywords"),
  },
  {
    to: "/articles",
    label: "Kho bài viết",
    icon: FileText,
    match: (path: string) => path.startsWith("/articles"),
  },
  {
    to: "/settings",
    label: "Cấu hình",
    icon: Settings,
    match: (path: string) => path.startsWith("/settings"),
  },
];

function pageTitleOf(pathname: string): string {
  if (pathname.startsWith("/production")) return "Xưởng sản xuất nội dung";
  if (pathname === "/") return "Tổng quan";
  if (pathname.startsWith("/documents")) {
    return pathname === "/documents" ? "Kho tài liệu & tin tức" : "Chi tiết tài liệu";
  }
  if (pathname.startsWith("/keywords")) return "Từ khóa & Chủ đề";
  if (pathname.startsWith("/articles")) {
    return pathname === "/articles" ? "Kho bài viết" : "Biên tập bài viết";
  }
  if (pathname.startsWith("/settings")) return "Cấu hình hệ thống";
  return "KT Writer PRO";
}

export default function AppLayout() {
  const { user, profile, signOut } = useAuth();
  const location = useLocation();

  const displayName = profile?.full_name?.trim() || user?.email || "Thành viên";
  const initials = displayName.slice(0, 2).toUpperCase();

  return (
    <SidebarProvider>
      <Sidebar collapsible="icon">
        <SidebarHeader>
          <div className="flex items-center gap-2.5 px-1 py-1.5">
            <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-gradient-primary text-primary-foreground">
              <Library className="h-4 w-4" />
            </span>
            <div className="min-w-0 group-data-[collapsible=icon]:hidden">
              <p className="truncate text-sm font-semibold text-sidebar-accent-foreground">
                KT Writer PRO
              </p>
              <p className="truncate text-[11px] text-sidebar-foreground/60">
                Kế toán · Thuế · Tài chính · Tin nóng
              </p>
            </div>
          </div>
        </SidebarHeader>

        <SidebarContent>
          <SidebarGroup>
            <SidebarGroupLabel>Khu vực làm việc</SidebarGroupLabel>
            <SidebarGroupContent>
              <SidebarMenu>
                {NAV_ITEMS.map((item) => {
                  const isActive = item.match(location.pathname);
                  return (
                    <SidebarMenuItem key={item.to}>
                      <SidebarMenuButton asChild isActive={isActive} tooltip={item.label}>
                        <NavLink to={item.to} end={item.to === "/"}>
                          <item.icon className="h-4 w-4" />
                          <span>{item.label}</span>
                        </NavLink>
                      </SidebarMenuButton>
                    </SidebarMenuItem>
                  );
                })}
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
        </SidebarContent>

        <SidebarFooter>
          <div className="rounded-lg bg-sidebar-accent/60 p-3 group-data-[collapsible=icon]:hidden">
            <p className="text-[11px] font-medium uppercase tracking-wide text-sidebar-foreground/60">
              Quy trình nội dung
            </p>
            <p className="mt-1 text-xs leading-relaxed text-sidebar-foreground/80">
              Chọn nguồn → tạo nháp AI → biên tập → kiểm duyệt → xuất nội dung.
            </p>
          </div>
        </SidebarFooter>
        <SidebarRail />
      </Sidebar>

      <SidebarInset className="surface-gradient">
        <header className="sticky top-0 z-20 flex h-14 items-center gap-3 border-b border-border bg-background/85 px-4 backdrop-blur">
          <SidebarTrigger />
          <div className="flex items-center gap-1.5 text-sm text-muted-foreground">
            <span className="hidden sm:inline">KT Writer PRO</span>
            <ChevronRight className="hidden h-3.5 w-3.5 sm:inline" />
            <span className="font-medium text-foreground">
              {pageTitleOf(location.pathname)}
            </span>
          </div>

          <div className="ml-auto flex items-center gap-2">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" className="h-9 gap-2 px-2">
                  <Avatar className="h-7 w-7">
                    <AvatarFallback className="bg-primary/10 text-[11px] font-semibold text-primary">
                      {initials}
                    </AvatarFallback>
                  </Avatar>
                  <span className="hidden max-w-[160px] truncate text-sm sm:inline">
                    {displayName}
                  </span>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-60">
                <DropdownMenuLabel className="font-normal">
                  <p className="text-sm font-medium text-foreground">{displayName}</p>
                  <p className="text-xs text-muted-foreground">{user?.email}</p>
                </DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={() => void signOut()} className="text-destructive">
                  <LogOut className="mr-2 h-4 w-4" />
                  Đăng xuất
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </header>

        <main className="flex-1 p-4 sm:p-6">
          <div className="mx-auto w-full max-w-[1400px] space-y-6">
            <Outlet />
          </div>
        </main>
      </SidebarInset>
    </SidebarProvider>
  );
}
