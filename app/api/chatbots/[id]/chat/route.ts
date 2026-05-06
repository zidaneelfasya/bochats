import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

// Configuration
const LLM_SERVICE_URL = process.env.LLM_SERVICE_URL || 'http://localhost:8000';
const RAG_SERVICE_URL = process.env.RAG_SERVICE_URL || process.env.RAG_BASE_URL;

// Decision types
const DECISION_TYPES = {
  NO_RAG: 'NO_RAG',
  RAG: 'RAG',
  CLARIFY: 'CLARIFY'
};

// Decision Router - sama seperti di server.js
export async function OPTIONS() {
  return new NextResponse(null, {
    status: 200,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    },
  });
}

async function decisionRouter(message: string, chatbotData: any) {
  try {
    console.log(`🔍 Decision Router: Analyzing intent for message: "${message}"`);
    
    const response = await fetch(`${LLM_SERVICE_URL}/decision`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        message: message,
        config: {
          bot_name: chatbotData.name || 'Assistant',
          bot_role: chatbotData.personality || 'helpful AI assistant',
          domain_context: chatbotData.personality,
          response_language: 'Indonesian',
        }
      }),
    });

    if (!response.ok) {
      console.error(`❌ Decision Router LLM service error: ${response.status}`);
      return DECISION_TYPES.RAG;
    }

    const data = await response.json();
    const decision = data.decision?.toUpperCase() || 'RAG';

    if (Object.values(DECISION_TYPES).includes(decision)) {
      console.log(`✅ Decision Router: ${decision}`);
      return decision;
    }

    console.warn(`⚠️  Invalid decision: "${decision}", using RAG as fallback`);
    return DECISION_TYPES.RAG;

  } catch (error: any) {
    console.error(`❌ Decision Router Exception: ${error.message}`);
    return DECISION_TYPES.RAG;
  }
}

// Generate response without RAG
async function generateResponseWithoutRAG(message: string, chatbotData: any) {
  try {
    console.log('💬 Generating conversational response (NO_RAG)');
    
    const response = await fetch(`${LLM_SERVICE_URL}/generate`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        message: message,
        mode: 'NO_RAG',
        config: {
          bot_name: chatbotData.name || 'Assistant',
          bot_role: chatbotData.personality || 'helpful AI assistant',
          domain_context: chatbotData.personality,
          greeting_style: 'friendly and professional',
          response_language: 'Indonesian',
          max_response_length: '2-3 sentences',
          use_emojis: true,
        }
      }),
    });

    if (!response.ok) {
      console.error(`❌ No RAG Response error: ${response.status}`);
      return chatbotData.welcome_message || "Halo! Ada yang bisa saya bantu? 😊";
    }

    const data = await response.json();
    console.log('✅ No RAG Response generated successfully');
    return data.reply || "Halo! Ada yang bisa saya bantu? 😊";
    
  } catch (error: any) {
    console.error(`❌ No RAG Response Exception: ${error.message}`);
    return chatbotData.welcome_message || "Halo! Ada yang bisa saya bantu? 😊";
  }
}

// Generate clarification response
async function generateClarificationResponse(message: string, chatbotData: any) {
  try {
    console.log('🤔 Generating clarification request');
    
    const response = await fetch(`${LLM_SERVICE_URL}/generate`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        message: message,
        mode: 'CLARIFY',
        config: {
          bot_name: chatbotData.name || 'Assistant',
          bot_role: chatbotData.personality || 'helpful AI assistant',
          domain_context: chatbotData.personality,
          response_language: 'Indonesian',
          use_emojis: true,
        }
      }),
    });

    if (!response.ok) {
      console.error(`❌ Clarification error: ${response.status}`);
      return "Maaf, pertanyaan Anda masih terlalu umum. Bisa lebih spesifik? 🤔\n\nSilakan tanyakan pertanyaan yang lebih detail agar saya bisa membantu dengan lebih baik. 🙏";
    }

    const data = await response.json();
    console.log('✅ Clarification generated successfully');
    return data.reply || "Maaf, pertanyaan Anda masih terlalu umum. Bisa lebih spesifik? 🤔";
    
  } catch (error: any) {
    console.error(`❌ Clarification Exception: ${error.message}`);
    return "Maaf, pertanyaan Anda masih terlalu umum. Bisa lebih spesifik? 🤔\n\nSilakan tanyakan pertanyaan yang lebih detail agar saya bisa membantu dengan lebih baik. 🙏";
  }
}

// Get context from RAG
async function getContextFromRAG(message: string, chatbotId: string) {
  try {
    console.log(`📚 Fetching RAG context for chatbot: ${chatbotId}`);
    
    const apiUrl = `${RAG_SERVICE_URL}/api/v1/ragly/chatbots/${chatbotId}/query`;
    
    const formData = new URLSearchParams();
    formData.append('query', message);
    formData.append('k', '5');

    const response = await fetch(apiUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: formData.toString(),
    });

    if (!response.ok) {
      console.error(`❌ RAG service error: ${response.status}`);
      return [];
    }

    const data = await response.json();
    const resultCount = data.results?.length || 0;
    console.log(`✅ RAG context retrieved: ${resultCount} chunks`);
    return data.results || [];
    
  } catch (error: any) {
    console.error(`❌ RAG Exception: ${error.message}`);
    return [];
  }
}

// Generate response with context
async function generateResponseWithContext(message: string, contextualChunks: any[], chatbotData: any) {
  console.log(`📖 Generating response with context (${contextualChunks?.length || 0} chunks)`);
  
  if (!contextualChunks || contextualChunks.length === 0) {
    console.warn('⚠️  No context from RAG, refusing to answer');
    return "Maaf, informasi tersebut belum tersedia dalam knowledge base saya saat ini. 😔\n\n" +
           "Untuk informasi lebih detail, silakan hubungi admin atau coba tanyakan pertanyaan lain yang lebih spesifik. 🙏";
  }

  const contextChunks = contextualChunks
    .map(chunk => chunk?.content || chunk?.text || '')
    .filter(text => text.trim() !== '');

  if (contextChunks.length === 0) {
    console.warn('⚠️  Context is empty after filtering');
    return "Maaf, informasi tersebut belum tersedia dalam knowledge base saya saat ini. 😔\n\n" +
           "Untuk informasi lebih detail, silakan hubungi admin atau coba tanyakan pertanyaan lain yang lebih spesifik. 🙏";
  }

  try {
    const response = await fetch(`${LLM_SERVICE_URL}/generate`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        message: message,
        mode: 'RAG',
        context: contextChunks,
        config: {
          bot_name: chatbotData.name || 'Assistant',
          bot_role: chatbotData.personality || 'helpful AI assistant',
          domain_context: chatbotData.personality,
          greeting_style: 'friendly and professional',
          response_language: 'Indonesian',
          max_response_length: '3-6 sentences',
          use_emojis: true,
          fallback_message: "Maaf, informasi tersebut belum tersedia dalam knowledge base saya saat ini. 😔\n\nUntuk informasi lebih detail, silakan hubungi admin atau coba tanyakan pertanyaan lain yang lebih spesifik. 🙏"
        }
      }),
    });

    if (!response.ok) {
      console.error(`❌ RAG Response error: ${response.status}`);
      return "Maaf, saya belum bisa menjawab pertanyaan tersebut.";
    }

    const data = await response.json();
    console.log('✅ RAG Response generated successfully');
    return data.reply || "Maaf, saya belum bisa menjawab pertanyaan tersebut.";
    
  } catch (error: any) {
    console.error(`❌ RAG Response Exception: ${error.message}`);
    throw error;
  }
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const startTime = Date.now();
  console.log('\n' + '='.repeat(80));
  console.log('💬 CHATBOT TEST - PROCESSING MESSAGE');
  console.log('='.repeat(80));

  try {
    const { id: chatbotId } = await params;
    const { message, sessionId = 'widget-session' } = await request.json();

    console.log('📋 Chatbot ID:', chatbotId);
    console.log('📨 Message:', message);
    console.log('🔑 Session ID:', sessionId);

    // Get chatbot data, we allow public access for chat
    const supabase = await createClient();
    const { data: chatbotData, error: chatbotError } = await supabase
      .from('chatbots')
      .select('*')
      .eq('id', chatbotId)
      .single();

    if (chatbotError || !chatbotData) {
      return NextResponse.json(
        { error: 'Chatbot not found' },
        { 
          status: 404,
          headers: {
            'Access-Control-Allow-Origin': '*',
          } 
        }
      );
    }

    console.log('✅ Chatbot data retrieved:', chatbotData.name);

    let aiResponse: string;

    try {
      // Step 1: Decision Routing
      console.log('📍 STEP 1: Analyzing intent');
      const decision = await decisionRouter(message, chatbotData);
      console.log(`📊 Decision: ${decision}`);

      // Step 2: Generate response based on decision
      console.log('📍 STEP 2: Generating response');
      
      switch (decision) {
        case DECISION_TYPES.NO_RAG:
          aiResponse = await generateResponseWithoutRAG(message, chatbotData);
          break;

        case DECISION_TYPES.CLARIFY:
          aiResponse = await generateClarificationResponse(message, chatbotData);
          break;

        case DECISION_TYPES.RAG:
        default:
          const contextualChunks = await getContextFromRAG(message, chatbotId);
          aiResponse = await generateResponseWithContext(message, contextualChunks, chatbotData);
          break;
      }

      const duration = Date.now() - startTime;
      console.log('✅ Response generated successfully');
      console.log(`⏱️  Total Duration: ${duration}ms`);
      console.log('='.repeat(80) + '\n');
      
      // Save conversation to database
      const { error: insertError } = await supabase
        .from('chatbot_conversations')
        .insert({
          chatbot_id: chatbotId,
          session_id: sessionId,
          source: 'widget',
          user_message: message,
          ai_response: aiResponse,
        });
        
      if (insertError) {
        console.error('❌ Error saving conversation:', insertError);
      }

      return NextResponse.json({
        success: true,
        reply: aiResponse,
        decision: decision,
        duration: duration
      });

    } catch (aiError: any) {
      console.error('❌ AI Processing Error:', aiError.message);
      
      // Fallback response
      aiResponse = chatbotData.fallback_message || 
        "Maaf, terjadi kesalahan saat memproses pertanyaan Anda. Silakan coba lagi.";
      
      return NextResponse.json({
        success: true,
        reply: aiResponse,
        decision: 'ERROR',
        error: aiError.message
      });
    }

  } catch (error: any) {
    const duration = Date.now() - startTime;
    console.error('\n' + '='.repeat(80));
    console.error('❌ CHATBOT TEST ERROR');
    console.error('='.repeat(80));
    console.error('  - Error:', error.message);
    console.error('  - Duration:', duration, 'ms');
    console.error('='.repeat(80) + '\n');

    return NextResponse.json(
      { 
        error: 'Internal server error',
        details: error.message 
      },
      { status: 500 }
    );
  }
}
