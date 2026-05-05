'use client';

import { useEffect, useState } from 'react';
import { Plus, Bot, Users, BarChart3, Settings } from 'lucide-react';
import Link from 'next/link';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { useChatbot } from '@/hooks/useChatbot';

// Force dynamic rendering
export const dynamic = 'force-dynamic'

export default function DashboardPage() {
  const [stats, setStats] = useState({
    totalChatbots: 0,
    totalChats: 0,
    activeChatbots: 0,
  });
  const [isLoadingStats, setIsLoadingStats] = useState(true);
  const { fetchChatbots } = useChatbot();

  useEffect(() => {
    loadStats();
  }, []);

  const loadStats = async () => {
    try {
      setIsLoadingStats(true);
      const chatbots = await fetchChatbots();
      
      // Fetch telegram stats for all chatbots in parallel
      const statsPromises = chatbots.map(async (chatbot: any) => {
        try {
          const response = await fetch(`/api/chatbots/${chatbot.id}/telegram-stats?timeframe=all`);
          if (response.ok) {
            const data = await response.json();
            if (data.success && data.stats) {
              return data.stats.totalConversations || 0;
            }
          }
        } catch (error) {
          console.error(`Failed to load stats for chatbot ${chatbot.id}:`, error);
        }
        return 0;
      });

      const statsResults = await Promise.all(statsPromises);
      const totalConversations = statsResults.reduce((sum, val) => sum + val, 0);
      
      setStats({
        totalChatbots: chatbots.length,
        activeChatbots: chatbots.filter((c: any) => c.status === 'active').length,
        totalChats: totalConversations,
      });
    } catch (error) {
      console.error('Failed to load stats:', error);
    } finally {
      setIsLoadingStats(false);
    }
  };

  const quickActions = [
    {
      title: 'Create Chatbot',
      description: 'Build a new AI chatbot',
      href: '/dashboard/chatbots/create',
      icon: Plus,
      color: 'bg-primary text-primary-foreground',
    },
    {
      title: 'View Chatbots',
      description: 'Manage your chatbots',
      href: '/dashboard/chatbots',
      icon: Bot,
      color: 'bg-blue-500 text-white',
    },
    {
      title: 'Analytics',
      description: 'View performance metrics',
      href: '/dashboard/analytics',
      icon: BarChart3,
      color: 'bg-green-500 text-white',
    },
    {
      title: 'Settings',
      description: 'Configure your account',
      href: '/dashboard/settings',
      icon: Settings,
      color: 'bg-purple-500 text-white',
    },
  ];

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="border-b border-border bg-card">
        <div className="max-w-7xl mx-auto px-6 py-6">
          <div>
            <h1 className="text-3xl font-bold text-foreground">Dashboard</h1>
            <p className="text-muted-foreground mt-2">
              Welcome back! Here's what's happening with your chatbots.
            </p>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-6 py-8">
        {isLoadingStats ? (
          // Loading State
          <>
            {/* Stats Cards Skeleton */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
              {[1, 2, 3].map((i) => (
                <Card key={i}>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <Skeleton className="h-4 w-24" />
                    <Skeleton className="h-4 w-4 rounded" />
                  </CardHeader>
                  <CardContent>
                    <Skeleton className="h-8 w-16 mb-2" />
                    <Skeleton className="h-3 w-20" />
                  </CardContent>
                </Card>
              ))}
            </div>

            {/* Quick Actions Skeleton */}
            <div className="mb-8">
              <Skeleton className="h-8 w-32 mb-4" />
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                {[1, 2, 3, 4].map((i) => (
                  <Card key={i}>
                    <CardContent className="p-6">
                      <div className="flex items-center gap-4">
                        <Skeleton className="w-12 h-12 rounded-lg" />
                        <div className="flex-1">
                          <Skeleton className="h-5 w-24 mb-2" />
                          <Skeleton className="h-4 w-32" />
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>

            {/* Getting Started Skeleton */}
            <Card>
              <CardHeader>
                <Skeleton className="h-6 w-32 mb-2" />
                <Skeleton className="h-4 w-64" />
              </CardHeader>
              <CardContent className="space-y-4">
                {[1, 2, 3].map((i) => (
                  <div key={i} className="flex items-start gap-4">
                    <Skeleton className="w-6 h-6 rounded-full" />
                    <div className="flex-1">
                      <Skeleton className="h-5 w-40 mb-2" />
                      <Skeleton className="h-4 w-full mb-2" />
                      {i === 1 && <Skeleton className="h-9 w-32" />}
                    </div>
                  </div>
                ))}
              </CardContent>
            </Card>
          </>
        ) : (
          // Actual Content
          <>
            {/* Stats Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Total Chatbots</CardTitle>
                  <Bot className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{stats.totalChatbots}</div>
                  <p className="text-xs text-muted-foreground">
                    {stats.activeChatbots} active
                  </p>
                </CardContent>
              </Card>
              
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Total Chats</CardTitle>
                  <Users className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{stats.totalChats.toLocaleString()}</div>
                  <p className="text-xs text-muted-foreground">
                    From all Telegram conversations
                  </p>
                </CardContent>
              </Card>
              
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Response Rate</CardTitle>
                  <BarChart3 className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">--</div>
                  <p className="text-xs text-muted-foreground">
                    Coming soon
                  </p>
                </CardContent>
              </Card>
            </div>

            {/* Quick Actions */}
            <div className="mb-8">
              <h2 className="text-2xl font-bold text-foreground mb-4">Quick Actions</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                {quickActions.map((action) => {
                  const Icon = action.icon;
                  return (
                    <Link key={action.title} href={action.href}>
                      <Card className="hover:shadow-lg transition-shadow cursor-pointer">
                        <CardContent className="p-6">
                          <div className="flex items-center gap-4">
                            <div className={`w-12 h-12 rounded-lg ${action.color} flex items-center justify-center`}>
                              <Icon size={24} />
                            </div>
                            <div>
                              <h3 className="font-semibold text-foreground">{action.title}</h3>
                              <p className="text-sm text-muted-foreground">{action.description}</p>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    </Link>
                  );
                })}
              </div>
            </div>

            {/* Getting Started */}
            <Card>
              <CardHeader>
                <CardTitle>Getting Started</CardTitle>
                <CardDescription>
                  Follow these steps to create your first chatbot
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-start gap-4">
                  <div className="w-6 h-6 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-sm font-semibold">
                    1
                  </div>
                  <div>
                    <h4 className="font-medium text-foreground">Create Your First Chatbot</h4>
                    <p className="text-sm text-muted-foreground mb-2">
                      Set up a new chatbot with your preferred AI model and configuration.
                    </p>
                    <Link href="/dashboard/chatbots/create">
                      <Button size="sm" className="gap-2">
                        <Plus size={16} />
                        Create Chatbot
                      </Button>
                    </Link>
                  </div>
                </div>
                
                <div className="flex items-start gap-4">
                  <div className="w-6 h-6 rounded-full bg-muted text-muted-foreground flex items-center justify-center text-sm font-semibold">
                    2
                  </div>
                  <div>
                    <h4 className="font-medium text-muted-foreground">Add Knowledge Base</h4>
                    <p className="text-sm text-muted-foreground">
                      Upload documents or add URLs to train your chatbot.
                    </p>
                  </div>
                </div>
                
                <div className="flex items-start gap-4">
                  <div className="w-6 h-6 rounded-full bg-muted text-muted-foreground flex items-center justify-center text-sm font-semibold">
                    3
                  </div>
                  <div>
                    <h4 className="font-medium text-muted-foreground">Deploy & Share</h4>
                    <p className="text-sm text-muted-foreground">
                      Test your chatbot and share it with your users.
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </>
        )}
      </div>
    </div>
  );
}
