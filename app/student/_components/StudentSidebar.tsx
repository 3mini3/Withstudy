'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useCallback, useState } from 'react';

import {
  Atom,
  BookOpen,
  Calculator,
  ChevronDown,
  Globe2,
  GraduationCap,
  HelpCircle,
  Languages,
  LayoutDashboard,
  LifeBuoy,
  LogOut,
  User,
} from 'lucide-react';

import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarRail,
  SidebarSeparator,
  useSidebar,
} from '@/components/ui/sidebar';
import { Button } from '@/components/ui/button';

const NAV_ITEMS = [
  { href: '/student/dashboard', label: 'ダッシュボード', icon: LayoutDashboard },
  { href: '/student/chat/math', label: '数学', icon: Calculator },
  { href: '/student/chat/science', label: '理科', icon: Atom },
  { href: '/student/chat/english', label: '英語', icon: Languages },
  { href: '/student/chat/social-studies', label: '社会', icon: Globe2 },
  { href: '/student/chat/japanese', label: '国語', icon: BookOpen },
];

interface StudentSidebarProps {
  email: string;
}

function StudentNavMenu() {
  const pathname = usePathname();
  const { isMobile, setOpenMobile } = useSidebar();

  const handleSelect = useCallback(() => {
    if (isMobile) {
      setOpenMobile(false);
    }
  }, [isMobile, setOpenMobile]);

  return (
    <SidebarGroup>
      <SidebarGroupLabel>学習メニュー</SidebarGroupLabel>
      <SidebarGroupContent>
        <SidebarMenu>
          {NAV_ITEMS.map((item) => {
            const isActive = pathname === item.href;
            const Icon = item.icon;

            return (
              <SidebarMenuItem key={item.href}>
                <SidebarMenuButton asChild isActive={isActive} tooltip={item.label}>
                  <Link href={item.href} onClick={handleSelect} prefetch={false} aria-label={item.label}>
                    <span className="flex w-full items-center gap-2 truncate">
                      <Icon className="h-4 w-4 shrink-0" aria-hidden />
                      <span className="truncate group-data-[collapsible=icon]:hidden">{item.label}</span>
                    </span>
                  </Link>
                </SidebarMenuButton>
              </SidebarMenuItem>
            );
          })}
        </SidebarMenu>
      </SidebarGroupContent>
    </SidebarGroup>
  );
}

function AccountSection({ email, onLogout, isLoggingOut }: { email: string; onLogout: () => Promise<void>; isLoggingOut: boolean }) {
  const { state } = useSidebar();
  const isCollapsed = state === 'collapsed';

  if (isCollapsed) {
    return (
      <SidebarFooter className="mt-auto">
        <div className="flex justify-center gap-2">
          <Button asChild variant="outline" size="icon" aria-label="プロフィールを編集" title="プロフィールを編集">
            <Link href="/profile">
              <User className="h-4 w-4" />
            </Link>
          </Button>
          <Button
            variant="destructive"
            size="icon"
            onClick={onLogout}
            disabled={isLoggingOut}
            aria-label="ログアウト"
            title="ログアウト"
          >
            <LogOut className="h-4 w-4" />
          </Button>
        </div>
      </SidebarFooter>
    );
  }

  return (
    <SidebarFooter className="mt-auto">
      <div className="flex flex-col gap-3 rounded-md border bg-card p-4">
        <div className="space-y-1">
          <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">ログイン中</p>
          <p className="truncate text-sm font-medium text-foreground">{email}</p>
        </div>
        <div className="flex flex-col gap-2">
          <Button asChild variant="outline" size="sm">
            <Link href="/profile">プロフィールを編集</Link>
          </Button>
          <Button variant="destructive" size="sm" onClick={onLogout} disabled={isLoggingOut}>
            {isLoggingOut ? 'ログアウト中…' : 'ログアウト'}
          </Button>
        </div>
      </div>
    </SidebarFooter>
  );
}

export default function StudentSidebar({ email }: StudentSidebarProps) {
  const [isLoggingOut, setIsLoggingOut] = useState(false);

  const handleLogout = useCallback(async () => {
    if (isLoggingOut) return;
    setIsLoggingOut(true);
    try {
      await fetch('/api/logout', { method: 'POST' });
    } catch (error) {
      console.error('Failed to logout', error);
    } finally {
      window.location.href = '/login';
    }
  }, [isLoggingOut]);

  const supportMailHref = 'mailto:support@withstady.jp';

  return (
    <Sidebar collapsible="icon">
      <SidebarHeader className="gap-3">
        <p className="text-sm font-semibold text-sidebar-foreground">Withstady</p>
        <p className="text-xs text-sidebar-foreground/70">学習を見える化しながら AI チューターと学び続けましょう。</p>
      </SidebarHeader>

      <SidebarContent>
        <StudentNavMenu />

        <Collapsible defaultOpen className="group/collapsible">
          <SidebarGroup>
            <SidebarGroupLabel asChild>
              <CollapsibleTrigger className="flex w-full items-center text-xs font-medium text-sidebar-foreground/80">
                <span className="flex items-center gap-2">
                  <HelpCircle className="h-4 w-4" aria-hidden />
                  ヘルプ
                </span>
                <ChevronDown className="ml-auto h-4 w-4 transition-transform group-data-[state=open]/collapsible:rotate-180" aria-hidden />
              </CollapsibleTrigger>
            </SidebarGroupLabel>
            <CollapsibleContent>
              <SidebarGroupContent className="pt-2">
                <SidebarMenu>
                  <SidebarMenuItem>
                    <SidebarMenuButton asChild tooltip="サポートに連絡">
                      <a href={supportMailHref} className="flex items-center gap-2" aria-label="サポートに連絡">
                        <LifeBuoy className="h-4 w-4" aria-hidden />
                        <span className="truncate group-data-[collapsible=icon]:hidden">サポートに連絡</span>
                      </a>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                  <SidebarMenuItem>
                    <SidebarMenuButton disabled tooltip={{ children: '近日公開' }}>
                      <span className="flex w-full items-center gap-2 text-muted-foreground">
                        <GraduationCap className="h-4 w-4" aria-hidden />
                        <span className="truncate group-data-[collapsible=icon]:hidden">学習ガイド（近日公開）</span>
                      </span>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                </SidebarMenu>
              </SidebarGroupContent>
            </CollapsibleContent>
          </SidebarGroup>
        </Collapsible>
      </SidebarContent>

      <SidebarSeparator />

      <AccountSection email={email} onLogout={handleLogout} isLoggingOut={isLoggingOut} />

      <SidebarRail />
    </Sidebar>
  );
}
