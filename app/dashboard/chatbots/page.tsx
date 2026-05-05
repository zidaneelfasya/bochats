'use client';

import { useEffect, useState } from 'react';
import { Plus, Bot, Users, Globe, Lock, MoreVertical, Edit, Trash2, Eye } from 'lucide-react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { useChatbot } from '@/hooks/useChatbot';
import { toast } from 'sonner';
import DeleteConfirmDialog from '@/components/delete-confirm-dialog';

export default function ChatbotsPage() {
  const [chatbots, setChatbots] = useState<any[]>([]);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const { fetchChatbots, deleteChatbot, isLoading } = useChatbot();

  useEffect(() => {
    loadChatbots();
  }, []);

  const loadChatbots = async () => {
    try {
      const data = await fetchChatbots();
      setChatbots(data);
    } catch (error) {
      toast.error('Failed to load chatbots');
    }
  };

  const handleDeleteChatbot = async (chatbotId: string, chatbotName: string) => {
    setDeletingId(chatbotId);
    
    try {
      const result = await deleteChatbot(chatbotId);
      
      if (result.success) {
        toast.success(`Chatbot "${chatbotName}" deleted successfully`);
        // Remove the deleted chatbot from local state
        setChatbots(prev => prev.filter(chatbot => chatbot.id !== chatbotId));
      } else {
        toast.error(result.error || 'Failed to delete chatbot');
      }
    } catch (error) {
      console.error('Error deleting chatbot:', error);
      toast.error('An unexpected error occurred while deleting');
    } finally {
      setDeletingId(null);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active':
        return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200';
      case 'draft':
        return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200';
      case 'inactive':
        return 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200';
      default:
        return 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200';
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background">
        <div className="max-w-7xl mx-auto px-6 py-8">
          <div className="animate-pulse space-y-4">
            <div className="h-8 bg-muted rounded w-1/4"></div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {[...Array(6)].map((_, i) => (
                <div key={i} className="h-64 bg-muted rounded-xl"></div>
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="border-b border-border bg-card">
        <div className="max-w-7xl mx-auto px-6 py-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-foreground">My Chatbots</h1>
              <p className="text-muted-foreground mt-2">
                Manage and monitor your AI chatbots
              </p>
            </div>
            <Link href="/dashboard/chatbots/create">
              <Button className="gap-2 bg-primary hover:bg-primary/90 text-primary-foreground">
                <Plus size={20} />
                Create Chatbot
              </Button>
            </Link>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-6 py-8">
        {chatbots.length === 0 ? (
          /* Empty State */
          <div className="text-center py-20">
            <Bot className="mx-auto mb-6 text-muted-foreground" size={64} />
            <h3 className="text-2xl font-semibold text-foreground mb-2">
              No chatbots yet
            </h3>
            <p className="text-muted-foreground mb-8 max-w-md mx-auto">
              Create your first AI chatbot to get started. It only takes a few minutes!
            </p>
            <Link href="/dashboard/chatbots/create">
              <Button className="gap-2 bg-primary hover:bg-primary/90 text-primary-foreground">
                <Plus size={20} />
                Create Your First Chatbot
              </Button>
            </Link>
          </div>
        ) : (
          /* Chatbots Grid */
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {chatbots.map((chatbot) => (
              <Card 
                key={chatbot.id} 
                className="hover:shadow-lg transition-shadow cursor-pointer group relative"
                onClick={(e) => {
                  // 1. Mencegah event dari React Portal (Dropdown Menu / Delete Dialog yang ter-render di luar DOM Card)
                  if (!e.currentTarget.contains(e.target as Node)) return;
                  
                  // 2. Mencegah trigger dari elemen interaktif di dalam Card (tombol atau link)
                  if ((e.target as Element).closest('button, a')) return;

                  window.location.href = `/dashboard/chatbots/${chatbot.id}`;
                }}
              >
                <CardHeader className="pb-4">
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-lg bg-gradient-to-r from-primary to-secondary flex items-center justify-center">
                        <Bot size={20} className="text-primary-foreground" />
                      </div>
                      <div className="min-w-0">
                        <CardTitle className="text-lg truncate">{chatbot.name}</CardTitle>
                        <CardDescription className="text-sm">
                          {chatbot.model}
                        </CardDescription>
                      </div>
                    </div>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button 
                          variant="ghost" 
                          size="sm" 
                          className="h-8 w-8 p-0"
                          onClick={(e) => e.stopPropagation()}
                        >
                          <MoreVertical size={16} />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem asChild>
                          <Link href={`/dashboard/chatbots/${chatbot.id}`} className="flex items-center">
                            <Eye size={16} className="mr-2" />
                            Details
                          </Link>
                        </DropdownMenuItem>
                        <DropdownMenuItem asChild>
                          <Link href={`/dashboard/chatbots/edit/${chatbot.id}`} className="flex items-center">
                            <Edit size={16} className="mr-2" />
                            Edit
                          </Link>
                        </DropdownMenuItem>
                        <DeleteConfirmDialog
                          title="Are you sure?"
                          description={`This will permanently delete "${chatbot.name}" and all its data. This action cannot be undone.`}
                          onConfirm={() => handleDeleteChatbot(chatbot.id, chatbot.name)}
                          isLoading={deletingId === chatbot.id}
                        >
                          <DropdownMenuItem 
                            className="text-destructive focus:text-destructive"
                            onSelect={(e) => e.preventDefault()}
                          >
                            <Trash2 size={16} className="mr-2" />
                            Delete
                          </DropdownMenuItem>
                        </DeleteConfirmDialog>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                </CardHeader>
                
                <CardContent className="space-y-4">
                  <div className="flex items-center justify-between">
                    <Badge className={getStatusColor(chatbot.status)}>
                      {chatbot.status}
                    </Badge>
                    <div className="flex items-center gap-1 text-sm text-muted-foreground">
                      {chatbot.is_public ? (
                        <>
                          <Globe size={14} />
                          Public
                        </>
                      ) : (
                        <>
                          <Lock size={14} />
                          Private
                        </>
                      )}
                    </div>
                  </div>

                  {chatbot.personality && (
                    <p className="text-sm text-muted-foreground line-clamp-2">
                      {chatbot.personality}
                    </p>
                  )}

                  <div className="pt-2 border-t border-border">
                    <div className="flex items-center justify-between text-xs text-muted-foreground">
                      <span>Created {formatDate(chatbot.created_at)}</span>
                      <div className="flex items-center gap-1">
                        <Users size={12} />
                        <span>{chatbot.chatbot_conversations?.[0]?.count || 0} messages</span>
                      </div>
                    </div>
                  </div>

                  <div className="flex gap-2 pt-2">
                    <Button 
                      variant="outline" 
                      size="sm" 
                      className="flex-1"
                      onClick={(e) => e.stopPropagation()}
                    >
                      View Analytics
                    </Button>
                    <Button 
                      size="sm" 
                      className="flex-1"
                      onClick={(e) => e.stopPropagation()}
                    >
                      Test Chat
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
