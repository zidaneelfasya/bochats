'use client';

import { createContext, useContext, useState, useCallback, useEffect } from 'react';
import Link from 'next/link';
import { Bot, User, Menu, X, LayoutDashboard, Settings, LogOut, ChevronUp, Users, Shield } from 'lucide-react';
import { ThemeSwitcher } from '@/components/theme-switcher';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { useRouter, usePathname } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { Loader2 } from 'lucide-react';
import { SubmitLoading } from "@/components/ui/submit-loading";
import Image from 'next/image';

// Sidebar Context
const SidebarContext = createContext<{
  isOpen: boolean;
  toggle: () => void;
  close: () => void;
}>({
  isOpen: false,
  toggle: () => {},
  close: () => {},
});

// Types
interface NavItem {
  name: string;
  href: string;
  icon: any;
}

interface SidebarProviderProps {
  children: React.ReactNode;
}

interface SidebarProps {
  user: any;
  navItems: NavItem[];
}

// Sidebar Provider Component
export function SidebarProvider({ children }: SidebarProviderProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [isDesktop, setIsDesktop] = useState(false);

  // Check if we're on desktop and load saved preference
  useEffect(() => {
    const checkDesktop = () => {
      const desktop = window.innerWidth >= 1024;
      setIsDesktop(desktop);
      
      if (desktop) {
        // Load saved preference from localStorage for desktop
        const savedState = localStorage.getItem('sidebar-open');
        if (savedState !== null) {
          setIsOpen(savedState === 'true');
        } else {
          setIsOpen(true); // Default to open on desktop
        }
      } else {
        setIsOpen(false); // Default to closed on mobile
      }
    };

    checkDesktop();
    window.addEventListener('resize', checkDesktop);
    return () => window.removeEventListener('resize', checkDesktop);
  }, []);

  const toggle = useCallback(() => {
    setIsOpen((prev: boolean) => {
      const newState = !prev;
      // Save preference only on desktop
      if (window.innerWidth >= 1024) {
        localStorage.setItem('sidebar-open', newState.toString());
      }
      return newState;
    });
  }, []);

  const close = useCallback(() => {
    setIsOpen(false);
    // Don't save close state to localStorage as it should only apply to current session on mobile
  }, []);

  // Close sidebar on mobile when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as HTMLElement;
      if (window.innerWidth < 1024 && isOpen && !target.closest('aside') && !target.closest('button')) {
        close();
      }
    };

    if (isOpen) {
      document.addEventListener('click', handleClickOutside);
      return () => document.removeEventListener('click', handleClickOutside);
    }
  }, [isOpen, close]);

  // Close sidebar on escape key
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        close();
      }
    };

    if (isOpen) {
      document.addEventListener('keydown', handleEscape);
      return () => document.removeEventListener('keydown', handleEscape);
    }
  }, [isOpen, close]);

  return (
    <SidebarContext.Provider value={{ isOpen, toggle, close }}>
      <div className={isOpen ? 'sidebar-open' : 'sidebar-collapsed'}>
        {children}
      </div>
    </SidebarContext.Provider>
  );
}

// Sidebar Component
export function Sidebar({ user, variant = "default" }: { user: any, variant?: "default" | "admin" }) {
  const { isOpen, close } = useContext(SidebarContext);
  const router = useRouter();
  const pathname = usePathname();
  const [isNavigating, setIsNavigating] = useState(false);
  const [targetPath, setTargetPath] = useState("");

  // Automatically turn off loading overlay when pathway updates
  useEffect(() => {
    setIsNavigating(false);
    setTargetPath("");
  }, [pathname]);

  // Definisikan navItems di client component
  const defaultNavItems = [
    { name: 'Dashboard', href: '/dashboard', icon: LayoutDashboard },
    { name: 'Chatbots', href: '/dashboard/chatbots', icon: Bot },
    { name: 'Profile', href: '/dashboard/profile', icon: User },
    { name: 'Settings', href: '/dashboard/settings', icon: Settings },
  ];

  const adminNavItems = [
    { name: 'Admin Dashboard', href: '/admin/dashboard', icon: Shield },
    { name: 'Pengguna', href: '/admin/users', icon: Users },
    { name: 'Back to Client', href: '/dashboard', icon: Bot },
  ];

  const navItems = variant === "admin" ? adminNavItems : defaultNavItems;
  
  const handleNavClick = (href: string) => {
    // If navigating to a different page, trigger the loading state
    if (pathname !== href) {
      setIsNavigating(true);
      setTargetPath(href);
    }
    
    // Close sidebar on mobile after navigation
    if (window.innerWidth < 1024) {
      close();
    }
  };

  const handleLogout = async () => {
    const supabase = createClient();
    await supabase.auth.signOut();
    router.push('/');
  };

  // Truncate email if too long
  const truncateEmail = (email: string, maxLength: number = 25) => {
    if (email.length <= maxLength) return email;
    return email.substring(0, maxLength) + '...';
  };

  return (
    <>
      {/* Backdrop for mobile */}
      {isOpen && (
        <div 
          className="fixed inset-0 z-40 bg-black/50 lg:hidden"
          onClick={close}
        />
      )}

      {/* Sidebar */}
      <aside 
        className={`
          fixed inset-y-0 left-0 z-50 w-64 border-r border-border bg-card
          transform transition-transform duration-300 ease-in-out
          ${isOpen ? 'translate-x-0' : '-translate-x-full'}
          lg:translate-x-0 lg:sidebar-collapsed:-translate-x-full
        `}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex h-full flex-col">
          {/* Logo */}
          <div className="flex h-16 items-center justify-between border-b border-border px-6">
            <Link href="/" className="flex items-center gap-2 font-bold text-xl text-primary">
            {/* <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center text-primary-foreground">
              ◆
            </div> */}
            <Image src="/images/logo-ragly.svg" alt="Logo" width={32} height={32} />
            <div className="flex flex-col">
              <span className="leading-tight">Ragly</span>
              {variant === "admin" && (
                <span className="text-[10px] uppercase tracking-wider text-muted-foreground leading-tight">Admin Panel</span>
              )}
            </div>
          </Link>
            
            {/* Close button for mobile */}
            <button
              onClick={close}
              className="lg:hidden p-1 rounded-lg hover:bg-accent text-muted-foreground hover:text-accent-foreground"
            >
              <X className="h-5 w-5" />
            </button>
          </div>
          
          {/* Navigation */}
          <nav className="flex-1 space-y-1 p-4">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = item.href === '/dashboard' ? pathname === item.href : pathname.startsWith(item.href);
              return (
                <Link
                  key={item.name}
                  href={item.href}
                  onClick={() => handleNavClick(item.href)}
                  className={`flex items-center gap-3 rounded-lg px-3 py-2 text-sm transition-colors ${
                    isActive 
                    ? 'bg-primary/10 text-primary font-medium' 
                    : 'text-muted-foreground hover:bg-accent hover:text-accent-foreground'
                  }`}
                >
                  <Icon className={`h-4 w-4 ${isActive ? 'text-primary' : ''}`} />
                  {item.name}
                </Link>
              );
            })}
          </nav>
          
          {/* Theme Switcher */}
          <div className="px-4 pb-3">
            <div className="flex items-center justify-between gap-3 px-3 py-2">
              <span className="text-sm text-muted-foreground">Theme</span>
              <ThemeSwitcher />
            </div>
          </div>
          
          {/* User info with dropdown */}
          <div className="border-t border-border p-4">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <button className="w-full flex items-center gap-3 rounded-lg px-3 py-2 text-sm hover:bg-accent transition-colors group">
                  <div className="flex h-9 w-9 items-center justify-center rounded-full bg-primary/10 text-primary ring-1 ring-primary/20 group-hover:bg-primary/20 transition-colors">
                    <User className="h-4 w-4" />
                  </div>
                  <div className="flex flex-col flex-1 text-left overflow-hidden">
                    <span className="text-xs text-muted-foreground">Logged in as</span>
                    <span className="text-sm font-medium text-foreground truncate" title={user.email}>
                      {truncateEmail(user.email)}
                    </span>
                  </div>
                  <ChevronUp className="h-4 w-4 text-muted-foreground group-hover:text-foreground transition-colors" />
                </button>
              </DropdownMenuTrigger>
              <DropdownMenuContent 
                align="end" 
                side="top" 
                className="w-56 mb-2"
                sideOffset={5}
              >
                <div className="px-2 py-1.5">
                  <p className="text-sm font-medium text-foreground">My Account</p>
                  <p className="text-xs text-muted-foreground truncate" title={user.email}>
                    {user.email}
                  </p>
                </div>
                <DropdownMenuSeparator />
                <DropdownMenuItem asChild>
                  <Link 
                    href="/dashboard/profile" 
                    className="cursor-pointer flex items-center"
                    onClick={() => handleNavClick("/dashboard/profile")}
                  >
                    <User className="mr-2 h-4 w-4" />
                    <span>Profile</span>
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem 
                  onClick={handleLogout}
                  className="cursor-pointer text-red-600 focus:text-red-600 focus:bg-red-50 dark:focus:bg-red-950/20"
                >
                  <LogOut className="mr-2 h-4 w-4" />
                  <span>Logout</span>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
      </aside>

      <SubmitLoading 
        isLoading={isNavigating && pathname !== targetPath} 
        text="Memuat Halaman..." 
      />
    </>
  );
}

// Sidebar Toggle Button
export function SidebarToggle() {
  const { isOpen, toggle } = useContext(SidebarContext);

  return (
    <button
      onClick={toggle}
      className="p-2 rounded-lg border border-border bg-card hover:bg-accent text-muted-foreground hover:text-accent-foreground transition-all duration-200 shadow-sm hover:shadow-md"
      aria-label={isOpen ? 'Close sidebar' : 'Open sidebar'}
    >
      <div className="relative">
        {isOpen ? (
          <X className="h-4 w-4 transition-transform duration-200" />
        ) : (
          <Menu className="h-4 w-4 transition-transform duration-200" />
        )}
      </div>
    </button>
  );
}
