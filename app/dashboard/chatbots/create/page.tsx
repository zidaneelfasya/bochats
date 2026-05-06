'use client';

import { useState } from 'react';
import { ChevronRight, CheckCircle2, Circle, Loader2 } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import BasicInfoStep from '@/components/wizard/basic-info-step';
import KnowledgeBaseStep from '@/components/wizard/knowledge-base-step';
import ChatConfigStep from '@/components/wizard/chat-config-step';
import PreviewPanel from '@/components/wizard/preview-panel';
import { Button } from '@/components/ui/button';
import { useChatbot } from '@/hooks/useChatbot';
import { useRAGSystem } from '@/hooks/useRAGSystem';

export default function CreateChatbotPage() {
  const [currentStep, setCurrentStep] = useState(0);
  const [isCreating, setIsCreating] = useState(false);
  const [chatbotId, setChatbotId] = useState<string | null>(null);
  const router = useRouter();
  const { createChatbot, updateChatbot, isLoading, error } = useChatbot();
  const { getDocuments, rebuildVectorstore, getRAGStats, isLoading: isRAGLoading } = useRAGSystem();
  
  const [formData, setFormData] = useState({
    name: '',
    model: 'Gemini',
    language: 'en',
    isPublic: false,
    personality: '',
    files: [],
    manualKnowledge: '',
    knowledgeUrl: '',
    commands: [],
    welcomeMessage: 'Hello! How can I help you today?',
    fallbackMessage: 'I apologize, but I could not find an answer to your question.',
    tone: 'Friendly',
    temperature: 0.7,
  });

  const steps = [
    { title: 'Basic Info', icon: Circle },
    { title: 'Knowledge Base', icon: Circle },
    { title: 'Configuration', icon: Circle },
  ];

  const handleNext = async () => {
    if (!validateCurrentStep()) {
      return;
    }

    // Create chatbot after step 1 (Basic Info)
    if (currentStep === 0 && !chatbotId) {
      setIsCreating(true);
      try {
        const result = await createChatbot({
          ...formData,
          status: 'draft' // Create as draft initially
        });
        
        if (result.success && result.chatbot) {
          setChatbotId(result.chatbot.id);
          toast.success('Basic information saved!');
          setCurrentStep(currentStep + 1);
        } else {
          toast.error(result.error || 'Failed to save chatbot');
        }
      } catch (error) {
        console.error('Error creating chatbot:', error);
        toast.error('An unexpected error occurred');
      } finally {
        setIsCreating(false);
      }
    } 
    // Build vectorstore when moving from step 2 (Knowledge Base) to step 3 (Configuration)
    else if (currentStep === 1 && chatbotId) {
      setIsCreating(true);
      try {
        // Check if there are any documents uploaded
        console.log('Checking documents for chatbot:', chatbotId);
        const documents = await getDocuments(chatbotId);
        console.log('Documents found:', documents.length, documents);
        
        if (documents.length > 0) {
          toast.info('Building vectorstore for your knowledge base... This may take a few moments.');
          
          try {
            const result = await rebuildVectorstore(chatbotId);
            console.log('Vectorstore rebuild result:', result);
            
            if (result.documents_processed !== undefined) {
              toast.success(
                `Vectorstore built successfully! Processed ${result.documents_processed} documents in ${result.processing_time?.toFixed(1) || 0}s`
              );
            } else {
              toast.success('Vectorstore built successfully!');
            }
            
            // Verify vectorstore was created
            const stats = await getRAGStats(chatbotId);
            console.log('RAG Stats after rebuild:', stats);
            
            if (stats && stats.total_chunks > 0) {
              toast.success(`Knowledge base ready with ${stats.total_chunks} chunks!`);
            }
          } catch (rebuildError) {
            console.error('Error rebuilding vectorstore:', rebuildError);
            toast.error('Failed to build vectorstore. You can rebuild it later from the dashboard.');
          }
        } else {
          console.log('No documents uploaded, skipping vectorstore build');
          toast.info('No documents uploaded. You can add documents later from the dashboard.');
        }
        
        setCurrentStep(currentStep + 1);
      } catch (error) {
        console.error('Error in knowledge base validation:', error);
        toast.error('An error occurred while validating knowledge base.');
        // Still proceed to next step
        setCurrentStep(currentStep + 1);
      } finally {
        setIsCreating(false);
      }
    } 
    else if (currentStep < steps.length - 1) {
      setCurrentStep(currentStep + 1);
    }
  };

  const handlePrevious = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
    }
  };

  const validateCurrentStep = () => {
    switch (currentStep) {
      case 0:
        if (!formData.name.trim()) {
          toast.error('Please enter a chatbot name');
          return false;
        }
        if (!formData.model) {
          toast.error('Please select an AI model');
          return false;
        }
        break;
      case 1:
        // Knowledge base is optional, so no validation needed
        break;
      case 2:
        // Configuration has defaults, so no validation needed
        break;
    }
    return true;
  };

  const handleCreateChatbot = async () => {
    if (!validateCurrentStep()) {
      return;
    }

    if (!chatbotId) {
      toast.error('Chatbot ID not found. Please restart the creation process.');
      return;
    }

    setIsCreating(true);
    
    try {
      console.log('Form data being sent:', formData);
      console.log('Commands specifically:', formData.commands);
      
      // Update chatbot with final configuration and set status to active
      const result = await updateChatbot(chatbotId, {
        ...formData,
        status: 'active'
      });
      
      if (result.success) {
        toast.success('Chatbot created successfully!');
        router.push('/dashboard/chatbots');
      } else {
        toast.error(result.error || 'Failed to update chatbot');
      }
    } catch (error) {
      console.error('Error updating chatbot:', error);
      toast.error('An unexpected error occurred');
    } finally {
      setIsCreating(false);
    }
  };

  const renderStepContent = () => {
    switch (currentStep) {
      case 0:
        return <BasicInfoStep data={formData} setData={setFormData} />;
      case 1:
        return <KnowledgeBaseStep data={formData} setData={setFormData} chatbotId={chatbotId} />;
      case 2:
        return <ChatConfigStep data={formData} setData={setFormData} />;
      default:
        return null;
    }
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="border-b border-border bg-card">
        <div className="max-w-7xl mx-auto px-6 py-4">
          <h1 className="text-2xl font-bold text-foreground">Create New Chatbot</h1>
          <p className="text-muted-foreground mt-1">Build your AI-powered chatbot in 3 simple steps</p>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-6 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Left: Wizard */}
          <div className="lg:col-span-2">
            {/* Step Navigation */}
            <div className="mb-8 space-y-2">
              {steps.map((step, index) => {
                const isActive = index === currentStep;
                const isCompleted = index < currentStep;
                const Icon = step.icon;

                return (
                  <div key={index} className="flex items-start gap-4">
                    <div className="flex flex-col items-center pt-1">
                      <div
                        className={`flex items-center justify-center w-8 h-8 rounded-full text-sm font-semibold transition-all ${
                          isCompleted
                            ? 'bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-200'
                            : isActive
                            ? 'bg-primary text-primary-foreground ring-2 ring-primary/30'
                            : 'bg-muted text-muted-foreground'
                        }`}
                      >
                        {isCompleted ? <CheckCircle2 size={20} /> : index + 1}
                      </div>
                      {index < steps.length - 1 && (
                        <div className={`w-1 h-12 mt-2 ${isCompleted ? 'bg-green-200 dark:bg-green-800' : 'bg-border'}`} />
                      )}
                    </div>
                    <div className="flex-1">
                      <h3 className={`font-semibold ${isActive ? 'text-primary' : isCompleted ? 'text-green-700 dark:text-green-200' : 'text-muted-foreground'}`}>
                        {step.title}
                      </h3>
                      <p className="text-sm text-muted-foreground mt-1">
                        {index === 0 && 'Set up your chatbot basic information'}
                        {index === 1 && 'Upload your knowledge base'}
                        {index === 2 && 'Configure chatbot behavior'}
                      </p>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Step Content */}
            <div className="bg-card rounded-xl border border-border p-8 shadow-sm min-h-[500px] animate-in fade-in duration-300">
              {renderStepContent()}
            </div>

            {/* Footer Actions */}
            <div className="flex items-center gap-4 mt-8">
              <Button
                onClick={handlePrevious}
                disabled={currentStep === 0}
                variant="outline"
                className="px-6"
              >
                Previous
              </Button>

              {currentStep < steps.length - 1 ? (
                <Button 
                  onClick={handleNext} 
                  disabled={isCreating || isLoading || isRAGLoading} 
                  className="px-6 bg-primary hover:bg-primary/90 text-primary-foreground gap-2"
                >
                  {isCreating || isLoading || isRAGLoading ? (
                    <>
                      <Loader2 size={18} className="animate-spin" />
                      {currentStep === 1 ? 'Building Vectorstore...' : 'Saving...'}
                    </>
                  ) : (
                    <>
                      Next <ChevronRight size={18} />
                    </>
                  )}
                </Button>
              ) : (
                <Button
                  onClick={handleCreateChatbot}
                  disabled={isCreating || isLoading}
                  className="px-8 bg-accent hover:bg-accent/90 text-accent-foreground font-semibold gap-2"
                >
                  {isCreating || isLoading ? (
                    <>
                      <Loader2 size={18} className="animate-spin" />
                      Creating...
                    </>
                  ) : (
                    'Create Chatbot'
                  )}
                </Button>
              )}
            </div>
          </div>

          {/* Right: Preview Panel (Sticky) */}
          <div className="lg:col-span-1">
            <PreviewPanel data={formData} />
          </div>
        </div>
      </div>
    </div>
  );
}
