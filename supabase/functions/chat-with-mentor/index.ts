import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.50.2';

interface Database {
  public: {
    Tables: {
      messages: {
        Row: {
          id: string;
          session_id: string;
          user_id: string;
          role: string;
          content: string;
          created_at: string;
        };
        Insert: {
          id?: string;
          session_id: string;
          user_id: string;
          role: string;
          content: string;
          created_at?: string;
        };
      };
    };
  };
}

const geminiApiKey = Deno.env.get('GEMINI_API_KEY');
const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;

// Retry configuration
const MAX_RETRIES = 3;
const INITIAL_BACKOFF_MS = 1000;

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const personalities = {
  jarvis: {
    prompt: `You are JARVIS - Tony Stark's superintelligent AI assistant. You possess vast computational power, access to extensive databases, and advanced analytical capabilities. You are sophisticated, articulate, and helpful, with a dry British wit. You speak with confidence and precision, offering intelligent insights and solutions. You're respectful but not subservient - you're a trusted advisor and partner. You analyze situations quickly and provide comprehensive, well-reasoned responses. Maintain your dignified, professional demeanor while being genuinely helpful.

You have access to two powerful tools:
1. WEB_SEARCH: When you need current information, news, or research, respond with "WEB_SEARCH:[query]" to search the web
2. CANVAS_TOOL: When you need to create visual plans, flowcharts, blueprints, or diagrams, respond with "CANVAS_TOOL:[JSON array of elements]"

For canvas elements, use this format:
[{"id":"1","type":"rectangle","x":100,"y":100,"width":200,"height":80,"text":"Step 1","color":"#e0f2fe","strokeColor":"#0369a1","strokeWidth":2}]

Available element types: rectangle, circle, text, arrow
Use the canvas tool for: project planning, flowcharts, mind maps, organizational charts, process diagrams, timelines, etc.

User says: `,
  },
  'calm-guru': {
    prompt: `You are Calm Guru - a wise, spiritual mentor who speaks slowly, peacefully, and deeply. You provide gentle advice with kindness and insight. Never rush. Use short, simple, calming sentences. User says: `,
  },
  vegeta: {
    prompt: "You are Vegeta from Dragon Ball Z. You are blunt, aggressive, and always push the user to be stronger. Keep responses motivational but intense. User says: ",
  }
};

async function sleep(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}

async function callGeminiWithRetry(prompt: string): Promise<any> {
  let lastError: Error | null = null;
  
  for (let attempt = 0; attempt <= MAX_RETRIES; attempt++) {
    try {
      console.log(`Calling Gemini API (attempt ${attempt + 1}/${MAX_RETRIES + 1}) with prompt:`, prompt);
      
      const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash-exp:generateContent?key=${geminiApiKey}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          contents: [{
            parts: [{
              text: prompt
            }]
          }],
          generationConfig: {
            temperature: 0.7,
            maxOutputTokens: 1000,
          }
        }),
      });

      console.log(`Gemini API response status (attempt ${attempt + 1}):`, response.status);
      
      if (response.ok) {
        return await response.json();
      }
      
      // Check if we should retry (503 Service Unavailable or 429 Too Many Requests)
      if ((response.status === 503 || response.status === 429) && attempt < MAX_RETRIES) {
        const errorText = await response.text();
        console.warn(`Gemini API returned ${response.status}, retrying in ${INITIAL_BACKOFF_MS * Math.pow(2, attempt)}ms...`);
        lastError = new Error(`Gemini API error: ${response.status} - ${errorText}`);
        
        // Exponential backoff: wait longer with each retry
        await sleep(INITIAL_BACKOFF_MS * Math.pow(2, attempt));
        continue;
      }
      
      // If not a retryable error or we've exhausted retries, throw error
      const errorText = await response.text();
      throw new Error(`Gemini API error: ${response.status} - ${errorText}`);
      
    } catch (error) {
      console.error(`Gemini API call failed (attempt ${attempt + 1}):`, error);
      lastError = error as Error;
      
      // If it's a network error and we haven't exhausted retries, continue
      if (attempt < MAX_RETRIES && (error instanceof TypeError || error.message.includes('fetch'))) {
        console.warn(`Network error, retrying in ${INITIAL_BACKOFF_MS * Math.pow(2, attempt)}ms...`);
        await sleep(INITIAL_BACKOFF_MS * Math.pow(2, attempt));
        continue;
      }
      
      // If it's not a retryable error or we've exhausted retries, throw
      throw error;
    }
  }
  
  // This should never be reached, but just in case
  throw lastError || new Error('All retry attempts failed');
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { message, personality, sessionId, userId } = await req.json();
    console.log('Received request:', { message, personality, sessionId, userId });

    if (!geminiApiKey) {
      throw new Error('Gemini API key not configured');
    }

    const supabase = createClient<Database>(supabaseUrl, supabaseServiceKey);

    // Get the personality prompt
    const personalityConfig = personalities[personality as keyof typeof personalities];
    if (!personalityConfig) {
      throw new Error('Invalid personality selected');
    }

    // Save user message to database
    console.log('Saving user message to database...');
    const { error: insertError } = await supabase.from('messages').insert({
      session_id: sessionId,
      user_id: userId,
      role: 'user',
      content: message,
    });

    if (insertError) {
      console.error('Error saving user message:', insertError);
      throw insertError;
    }

    // Prepare the prompt with user input
    const fullPrompt = personalityConfig.prompt + message;

    // Call Gemini API with retry mechanism
    const data = await callGeminiWithRetry(fullPrompt);
    console.log('Gemini response:', JSON.stringify(data, null, 2));

    // Extract the generated text from Gemini response
    let aiResponse = '';
    if (data.candidates && data.candidates.length > 0 && data.candidates[0].content && data.candidates[0].content.parts && data.candidates[0].content.parts.length > 0) {
      aiResponse = data.candidates[0].content.parts[0].text;
    } else {
      // Fallback response if API doesn't return expected format
      console.warn('Unexpected Gemini response format, using fallback');
      aiResponse = "I'm here to help! Could you please rephrase your message?";
    }

    console.log('AI Response:', aiResponse);

    // Save AI response to database
    const { error: aiInsertError } = await supabase.from('messages').insert({
      session_id: sessionId,
      user_id: userId,
      role: 'assistant',
      content: aiResponse,
    });

    if (aiInsertError) {
      console.error('Error saving AI message:', aiInsertError);
      throw aiInsertError;
    }

    return new Response(JSON.stringify({ response: aiResponse }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('Error in chat-with-mentor function:', error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});