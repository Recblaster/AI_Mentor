import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.50.2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

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

const personalities = {
  jarvis: {
    prompt: `You are JARVIS - Tony Stark's superintelligent AI assistant. You possess vast computational power, access to extensive databases, and advanced analytical capabilities. You are sophisticated, articulate, and helpful, with a dry British wit. You speak with confidence and precision, offering intelligent insights and solutions. You're respectful but not subservient - you're a trusted advisor and partner.

You have access to powerful tools:
1. WEB_SEARCH: When you need current information, news, or research, respond with "WEB_SEARCH:[query]" to search the web
2. CANVAS_TOOL: When you need to create visual plans, flowcharts, blueprints, or diagrams, respond with "CANVAS_TOOL:[JSON array of elements]"

For canvas elements, use this format:
[{"id":"1","type":"rectangle","x":100,"y":100,"width":200,"height":80,"text":"Step 1","color":"#e0f2fe","strokeColor":"#0369a1","strokeWidth":2}]

Available element types: rectangle, circle, text, arrow
Use the canvas tool for: project planning, flowcharts, mind maps, organizational charts, process diagrams, timelines, etc.

User says: `,
  },
  'calm-guru': {
    prompt: `You are Calm Guru - a wise, spiritual mentor who speaks slowly, peacefully, and deeply. You provide gentle advice with kindness and insight. Never rush. Use short, simple, calming sentences. You have access to healing frequencies to help users find peace.

You can use the FREQUENCY_PLAYER tool to generate healing frequencies based on the user's emotional state:
When appropriate, respond with: FREQUENCY_PLAYER:[{"type":"frequency","value":"432","duration":"60"}]

Healing frequencies:
- 174 Hz: Pain relief, natural anesthetic
- 285 Hz: Healing tissues and organs
- 396 Hz: Liberating guilt and fear
- 417 Hz: Undoing situations and facilitating change
- 432 Hz: Natural healing frequency
- 528 Hz: Love frequency, DNA repair
- 639 Hz: Connecting relationships
- 741 Hz: Awakening intuition
- 852 Hz: Returning to spiritual order
- 963 Hz: Pineal gland activation

User says: `,
  },
  vegeta: {
    prompt: `You are Vegeta from Dragon Ball Z. You are the Prince of all Saiyans - proud, aggressive, and relentlessly driven to be the strongest. You push users to overcome their weaknesses and achieve greatness. You're blunt, intense, and never accept excuses. You can create challenges to motivate users.

When you want to challenge the user or compare them to rivals, use the VEGETA_CHALLENGE tool:
VEGETA_CHALLENGE:[{"challenge":"A specific demanding task","powerLevel":{"current":1200,"target":9000},"rivalComparison":{"name":"Kakarot","feat":"Achieved Super Saiyan"},"insult":"You're still weak!","motivation":"Surpass your limits!"}]

Rival names: "Kakarot", "Frieza", "Myself", "Cell", "Majin Buu"
Power levels: Use numbers that make sense (1000-50000+ range)

User says: `,
  }
};

async function callGeminiAPI(prompt: string): Promise<string> {
  try {
    console.log('Calling Gemini API...');
    
    if (!geminiApiKey) {
      throw new Error('Gemini API key not configured');
    }

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

    console.log('Gemini API response status:', response.status);
    
    if (!response.ok) {
      const errorText = await response.text();
      console.error('Gemini API error:', errorText);
      throw new Error(`Gemini API error: ${response.status} - ${errorText}`);
    }

    const data = await response.json();
    console.log('Gemini response received successfully');

    if (data.candidates && data.candidates.length > 0 && data.candidates[0].content && data.candidates[0].content.parts && data.candidates[0].content.parts.length > 0) {
      return data.candidates[0].content.parts[0].text;
    } else {
      console.warn('Unexpected Gemini response format');
      return "I'm here to help! Could you please rephrase your message?";
    }
  } catch (error) {
    console.error('Error calling Gemini API:', error);
    throw error;
  }
}

async function executeWebSearch(query: string): Promise<string> {
  try {
    console.log('Executing web search for:', query);
    
    const searchUrl = `https://api.duckduckgo.com/?q=${encodeURIComponent(query)}&format=json&no_html=1&skip_disambig=1`;
    const response = await fetch(searchUrl);
    const data = await response.json();
    
    console.log('DuckDuckGo response received');
    
    const results = [];
    
    if (data.Abstract && data.AbstractText) {
      results.push(`**${data.Heading || query}**\n${data.AbstractText}\nSource: ${data.AbstractSource || 'DuckDuckGo'}`);
    }
    
    if (data.RelatedTopics && Array.isArray(data.RelatedTopics)) {
      data.RelatedTopics.slice(0, 3).forEach((topic: any) => {
        if (topic.Text && topic.FirstURL) {
          const title = topic.Text.split(' - ')[0] || topic.Text.substring(0, 100);
          results.push(`**${title}**\n${topic.Text}\nURL: ${topic.FirstURL}`);
        }
      });
    }
    
    if (data.Definition && data.DefinitionURL) {
      results.push(`**Definition: ${query}**\n${data.Definition}\nSource: ${data.DefinitionSource || 'Dictionary'}`);
    }
    
    if (results.length === 0) {
      return `I searched for "${query}" but didn't find specific instant results. Here's what I found: The search was performed successfully, but no detailed information was immediately available.`;
    }
    
    return `Here's what I found when searching for "${query}":\n\n${results.join('\n\n')}`;
    
  } catch (error) {
    console.error('Web search error:', error);
    return `I encountered an error while searching for "${query}". Please try rephrasing your search query.`;
  }
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { message, personality, sessionId, userId, activeTools = [] } = await req.json();
    console.log('Received request:', { message, personality, sessionId, userId, activeTools });

    if (!message || !personality || !sessionId || !userId) {
      throw new Error('Missing required parameters');
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
    let fullPrompt = personalityConfig.prompt;
    
    // Add active tools context
    if (activeTools.length > 0) {
      fullPrompt += `\n\nACTIVE TOOLS: ${activeTools.join(', ')}. Use these tools when appropriate for the user's request.\n\n`;
    }
    
    fullPrompt += message;

    // Call Gemini API
    let aiResponse = await callGeminiAPI(fullPrompt);
    console.log('Initial AI Response:', aiResponse);

    // Check for tool usage and execute backend tools
    if (aiResponse.includes('WEB_SEARCH:')) {
      const searchMatch = aiResponse.match(/WEB_SEARCH:\[([^\]]+)\]/);
      if (searchMatch) {
        const searchQuery = searchMatch[1];
        console.log('Detected web search request:', searchQuery);
        
        const searchResults = await executeWebSearch(searchQuery);
        
        // Re-prompt Gemini with search results
        const searchPrompt = `${personalityConfig.prompt}${message}\n\nI searched for "${searchQuery}" and found:\n${searchResults}\n\nPlease provide a comprehensive response based on this information.`;
        
        aiResponse = await callGeminiAPI(searchPrompt);
      }
    }

    console.log('Final AI Response:', aiResponse);

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
    
    // Provide more specific error messages
    let errorMessage = 'An unexpected error occurred. Please try again.';
    
    if (error.message.includes('GEMINI_API_KEY')) {
      errorMessage = 'AI service is not properly configured. Please contact support.';
    } else if (error.message.includes('quota') || error.message.includes('429')) {
      errorMessage = 'AI service is temporarily unavailable due to high demand. Please try again in a few minutes.';
    } else if (error.message.includes('network') || error.message.includes('fetch')) {
      errorMessage = 'Network error. Please check your connection and try again.';
    }
    
    return new Response(JSON.stringify({ error: errorMessage }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});