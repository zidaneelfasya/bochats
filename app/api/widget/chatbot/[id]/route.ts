import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export async function OPTIONS() {
  return new NextResponse(null, {
    status: 200,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    },
  });
}

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: chatbotId } = await params;

    // Fetch chatbot data from Supabase
    const supabase = await createClient();
    
    const { data: chatbot, error } = await supabase
      .from('chatbots')
      .select('id, name, welcome_message, personality, is_public')
      .eq('id', chatbotId)
      .single();

    if (error || !chatbot) {
      return NextResponse.json(
        { success: false, error: 'Chatbot not found' },
        { 
          status: 404,
          headers: {
            'Access-Control-Allow-Origin': '*',
          }
        }
      );
    }

    // Only return data for public chatbots or provide limited info
    return NextResponse.json({
      success: true,
      chatbot: {
        id: chatbot.id,
        name: chatbot.name,
        welcome_message: chatbot.welcome_message,
        is_public: chatbot.is_public,
      },
    }, {
      headers: {
        'Access-Control-Allow-Origin': '*',
      }
    });

  } catch (error: any) {
    console.error('Widget API error:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { 
        status: 500,
        headers: {
          'Access-Control-Allow-Origin': '*',
        }
      }
    );
  }
}
