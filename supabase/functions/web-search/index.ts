import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

// CORS headers for secure cross-origin requests
const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// All search operations happen server-side to protect against abuse
interface SearchResult {
  title: string;
  url: string;
  snippet: string;
  displayUrl: string;
  datePublished?: string;
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Server-side web search to prevent client-side API exposure
    const { query } = await req.json();
    console.log('Web search request for:', query);

    if (!query) {
      throw new Error('Search query is required');
    }

    // Use DuckDuckGo Instant Answer API (free, no API key required)
    const searchUrl = `https://api.duckduckgo.com/?q=${encodeURIComponent(query)}&format=json&no_html=1&skip_disambig=1`;
    
    const response = await fetch(searchUrl);
    const data = await response.json();
    
    console.log('DuckDuckGo response received');

    const results: SearchResult[] = [];

    // Add abstract if available
    if (data.Abstract && data.AbstractText) {
      results.push({
        title: data.Heading || query,
        url: data.AbstractURL || '#',
        snippet: data.AbstractText,
        displayUrl: data.AbstractSource || 'DuckDuckGo',
        datePublished: undefined
      });
    }

    // Add related topics
    if (data.RelatedTopics && Array.isArray(data.RelatedTopics)) {
      data.RelatedTopics.slice(0, 5).forEach((topic: any) => {
        if (topic.Text && topic.FirstURL) {
          results.push({
            title: topic.Text.split(' - ')[0] || topic.Text.substring(0, 100),
            url: topic.FirstURL,
            snippet: topic.Text,
            displayUrl: new URL(topic.FirstURL).hostname,
            datePublished: undefined
          });
        }
      });
    }

    // Add definition if available
    if (data.Definition && data.DefinitionURL) {
      results.push({
        title: `Definition: ${query}`,
        url: data.DefinitionURL,
        snippet: data.Definition,
        displayUrl: data.DefinitionSource || 'Dictionary',
        datePublished: undefined
      });
    }

    // If no results from DuckDuckGo, create a fallback response
    if (results.length === 0) {
      results.push({
        title: `Search results for "${query}"`,
        url: `https://duckduckgo.com/?q=${encodeURIComponent(query)}`,
        snippet: `I searched for "${query}" but didn't find specific instant results. You can click the link to see full search results on DuckDuckGo.`,
        displayUrl: 'duckduckgo.com',
        datePublished: undefined
      });
    }

    console.log('Processed results:', results.length);

    return new Response(JSON.stringify({ results }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('Error in web-search function:', error);
    return new Response(JSON.stringify({ 
      error: error.message,
      results: [{
        title: 'Search Error',
        url: '#',
        snippet: 'Unable to perform web search at this time. Please try again later.',
        displayUrl: 'Error',
        datePublished: undefined
      }]
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});