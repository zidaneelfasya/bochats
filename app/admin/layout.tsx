import type React from "react"
import type { Metadata } from "next"
import { Geist, Geist_Mono } from "next/font/google"
import { Analytics } from "@vercel/analytics/next"
import { createClient } from '@/lib/supabase/server';
import { createClient as createServiceClient } from '@supabase/supabase-js';
import { redirect } from 'next/navigation';
import Link from 'next/link';
import { LayoutDashboard, Users, Shield, Bot } from 'lucide-react';
import { cn } from '@/lib/utils';
import { headers } from 'next/headers';
import { SidebarProvider, Sidebar, SidebarToggle } from '@/components/dashboard/responsive-sidebar';

const _geist = Geist({ subsets: ["latin"] })
const _geistMono = Geist_Mono({ subsets: ["latin"] })

export const metadata: Metadata = {
  title: "Admin Panel - Ragly",
  description:
    "Admin dashboard untuk mengelola pengguna dan statistik platform Ragly",
  generator: "v0.app",
  icons: {
    icon: [
      {
        url: "/icon-light-32x32.png",
        media: "(prefers-color-scheme: light)",
      },
      {
        url: "/icon-dark-32x32.png",
        media: "(prefers-color-scheme: dark)",
      },
      {
        url: "/icon.svg",
        type: "image/svg+xml",
      },
    ],
    apple: "/apple-icon.png",
  },
}

export default async function AdminLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return redirect('/login');
  }

  // Check if user is admin
  console.log('[Admin Layout] Checking admin role for user:', user.email);
  console.log('[Admin Layout] User ID:', user.id);

  // Use service role client to bypass RLS
  const supabaseAdmin = createServiceClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    {
      auth: {
        autoRefreshToken: false,
        persistSession: false
      }
    }
  );

  const { data: profile, error: profileError } = await supabaseAdmin
    .from('profiles')
    .select('role, full_name, email')
    .eq('user_id', user.id)
    .single();

  console.log('[Admin Layout] Profile data:', profile);
  console.log('[Admin Layout] Profile role:', profile?.role);

  if (profileError) {
    console.error('[Admin Layout] Error fetching profile:', profileError);
  }

  // Get current pathname to prevent infinite redirect
  const headersList = await headers();
  const currentPath = headersList.get('x-invoke-path') || '';
  const isNoAccessPage = currentPath.includes('/admin/no-access');

  if (!profile || profile.role !== 'admin') {
    if (isNoAccessPage) {
      // Allow rendering the no-access page without sidebar
      return (
        <div className="min-h-screen bg-background">
          {children}
        </div>
      );
    }
    
    console.log('[Admin Layout] Access denied. Redirecting to no-access page.');
    return redirect('/admin/no-access');
  }

  console.log('[Admin Layout] ✓ Admin access granted');

  return (
    <div className="min-h-screen bg-background">
      <SidebarProvider>
        <Sidebar user={user} variant="admin" />
        
        {/* Main content */}
        <main className="transition-all duration-300 lg:ml-64">
          {/* Mobile header */}
          <div className="sticky top-0 z-40 lg:hidden border-b border-border bg-card/95 backdrop-blur supports-[backdrop-filter]:bg-card/60">
            <div className="flex h-16 items-center justify-between px-4">
              <Link href="/admin/dashboard" className="flex items-center gap-2">
                <Shield className="h-6 w-6 text-primary" />
                <span className="font-bold text-foreground">Admin Panel</span>
              </Link>
              <SidebarToggle />
            </div>
          </div>
          
          {/* Desktop toggle button */}
          <div className="hidden lg:block fixed top-4 left-4 z-50 sidebar-toggle-desktop">
            <SidebarToggle />
          </div>
          
          <div className="p-4 lg:p-6 lg:pt-16">
            <div className="mx-auto max-w-6xl">
              {children}
            </div>
          </div>
        </main>
      </SidebarProvider>
      <Analytics />
    </div>
  );
}
