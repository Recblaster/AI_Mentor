import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface SearchResult {
  title: string;
  url: string;
  snippet: string;
  displayUrl: string;
  datePublished?: string;
}

async function executeWebSearch(query: string): Promise<string> {
  try {
    console.log('Executing web search for:', query);
    
    const searchUrl = `https://api.duckduckgo.com/?q=${encodeURIComponent(query)}&format=json&no_html=1&skip_disambig=1`;
    const response = await fetch(searchUrl);
    const data = await response.json();
    
    console.log('DuckDuckGo response received');
    
    const results = [];
    
    // Add abstract if available
    if (data.Abstract && data.AbstractText) {
      results.push(`**${data.Heading || query}**\n${data.AbstractText}\nSource: ${data.AbstractSource || 'DuckDuckGo'}`);
    }
    
    // Add related topics
    if (data.RelatedTopics && Array.isArray(data.RelatedTopics)) {
      data.RelatedTopics.slice(0, 3).forEach((topic: any) => {
        if (topic.Text && topic.FirstURL) {
          const title = topic.Text.split(' - ')[0] || topic.Text.substring(0, 100);
          results.push(`**${title}**\n${topic.Text}\nURL: ${topic.FirstURL}`);
        }
      });
    }
    
    // Add definition if available
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
    const { tool, params } = await req.json();
    console.log('Tools function called with:', { tool, params });

    let result = '';

    switch (tool) {
      case 'web_search':
        if (!params.query) {
          throw new Error('Query parameter is required for web search');
        }
        result = await executeWebSearch(params.query);
        break;
      
      case 'canvas':
        // Canvas tool doesn't need backend processing, just return success
        result = 'Canvas tool activated - frontend will handle rendering';
        break;
      
      case 'frequency_player':
        // Frequency player doesn't need backend processing, just return success
        result = 'Frequency player tool activated - frontend will handle audio generation';
        break;
      
      case 'vegeta_challenge':
        // Vegeta challenge doesn't need backend processing, just return success
        result = 'Vegeta challenge tool activated - frontend will handle challenge display';
        break;
      
      default:
        throw new Error(`Unknown tool: ${tool}`);
    }

    return new Response(JSON.stringify({ result }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('Error in tools function:', error);
    return new Response(JSON.stringify({ 
      error: error.message 
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});