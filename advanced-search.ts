import { GoogleGenerativeAI } from "@google/generative-ai";
import { Section, Act } from "@shared/schema";
import { storage } from "../storage";

// Initialize Gemini AI with API key from environment
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || "");

// Set to store recently generated embeddings for caching
const termCache = new Map<string, string[]>();

interface SearchResult {
  section: Section;
  relevance: number;
  matchedTerms: string[];
  act?: Act;
}

/**
 * Perform advanced NLP search using Gemini AI
 * @param query Natural language query
 * @param language Language code ('en' or 'hi')
 * @returns Relevant search results
 */
export async function performAdvancedSearch(
  query: string,
  language: 'en' | 'hi' = 'en'
): Promise<SearchResult[]> {
  try {
    // Step 1: Extract key legal concepts and terms from the query using Gemini
    const extractedTerms = await extractKeyLegalTerms(query, language);
    
    // Step 2: Perform base search to get initial results
    let allSections = await storage.getSections();
    
    // Step 3: Get all acts for reference
    const allActs = await storage.getActs();
    const actsMap = new Map(allActs.map(act => [act.id, act]));
    
    // Step 4: Score and rank the results
    const scoredResults: SearchResult[] = await rankSearchResults(
      allSections,
      extractedTerms,
      query,
      language
    );
    
    // Step 5: Add act information to the results
    const enrichedResults = scoredResults.map(result => {
      const act = actsMap.get(result.section.actId as number);
      return {
        ...result,
        act: act || undefined
      };
    });
    
    // Return the top results
    return enrichedResults.slice(0, 10);
  } catch (error) {
    console.error("Error in advanced search:", error);
    throw new Error(`Advanced search failed: ${error instanceof Error ? error.message : String(error)}`);
  }
}

/**
 * Extract key legal terms from a natural language query
 * @param query User's natural language query
 * @param language Language code
 * @returns Array of extracted legal terms
 */
async function extractKeyLegalTerms(
  query: string,
  language: 'en' | 'hi'
): Promise<string[]> {
  try {
    const model = genAI.getGenerativeModel({ model: "gemini-1.5-pro" });
    
    // Prepare the prompt based on language
    const prompt = language === 'en'
      ? `Extract the key legal terms and concepts from this query: "${query}".
         Return only a JSON array of strings with the terms, nothing else.
         Example: ["criminal negligence", "manslaughter", "intent"]`
      : `इस खोज से मुख्य कानूनी शब्दों और अवधारणाओं को निकालें: "${query}".
         केवल एक JSON एरे में शब्दों को वापस करें, अन्य कुछ नहीं।
         उदाहरण: ["आपराधिक लापरवाही", "मानव वध", "इरादा"]`;
         
    const result = await model.generateContent(prompt);
    const text = result.response.text();
    
    // Parse the JSON array from the response
    try {
      // Extract the JSON array from the text
      const jsonMatch = text.match(/\[([\s\S]*)\]/);
      if (jsonMatch && jsonMatch[0]) {
        const jsonStr = jsonMatch[0].replace(/'/g, '"');
        const terms = JSON.parse(jsonStr);
        
        if (Array.isArray(terms) && terms.length > 0) {
          return terms;
        }
      }
      
      // If JSON parsing fails, extract terms using regex
      const terms = text.match(/"([^"]+)"/g);
      if (terms) {
        return terms.map(term => term.replace(/"/g, ''));
      }
      
      return [query];  // Fallback to using original query
    } catch (parseError) {
      console.warn("Failed to parse terms from Gemini response:", parseError);
      // Fallback to using the original query
      return [query];
    }
  } catch (error) {
    console.error("Error extracting legal terms:", error);
    // Fallback to basic term extraction
    return query.split(/\s+/).filter(term => term.length > 3);
  }
}

/**
 * Score and rank search results
 * @param sections All available sections
 * @param terms Extracted legal terms
 * @param originalQuery Original user query
 * @param language Language code
 * @returns Scored and ranked search results
 */
async function rankSearchResults(
  sections: Section[],
  terms: string[],
  originalQuery: string,
  language: 'en' | 'hi'
): Promise<SearchResult[]> {
  // Choose which fields to search in based on language
  const titleField = language === 'en' ? 'title' : 'titleHindi';
  const contentField = language === 'en' ? 'content' : 'contentHindi';
  
  const results: SearchResult[] = [];
  
  // Precompute regular expressions for more efficient searching
  const termRegexes = terms.map(term => new RegExp(escapeRegExp(term), 'i'));
  
  // Process each section
  for (const section of sections) {
    const title = section[titleField] || '';
    const content = section[contentField] || '';
    
    const matchedTerms: string[] = [];
    let relevanceScore = 0;
    
    // Check for term matches
    for (let i = 0; i < terms.length; i++) {
      const term = terms[i];
      const regex = termRegexes[i];
      
      // Check title (higher weight)
      if (regex.test(title)) {
        relevanceScore += 3;
        matchedTerms.push(term);
      }
      
      // Check content
      if (regex.test(content)) {
        relevanceScore += 1;
        if (!matchedTerms.includes(term)) {
          matchedTerms.push(term);
        }
      }
    }
    
    // Add exact phrase match bonus
    const fullTextRegex = new RegExp(escapeRegExp(originalQuery), 'i');
    if (fullTextRegex.test(title)) {
      relevanceScore += 5;
    }
    if (fullTextRegex.test(content)) {
      relevanceScore += 2;
    }
    
    // Only include results that match at least one term
    if (matchedTerms.length > 0) {
      results.push({
        section,
        relevance: relevanceScore,
        matchedTerms
      });
    }
  }
  
  // Sort by relevance (descending)
  return results.sort((a, b) => b.relevance - a.relevance);
}

/**
 * Escape special characters in string for use in regex
 */
function escapeRegExp(string: string): string {
  return string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

/**
 * Generate search highlights for content
 * @param content Original content text
 * @param matchTerms Terms to highlight
 * @returns Content with highlighted terms
 */
export function generateHighlights(content: string, matchTerms: string[]): string {
  if (!content || matchTerms.length === 0) return content;
  
  let highlightedContent = content;
  const termRegexes = matchTerms.map(term => new RegExp(`(${escapeRegExp(term)})`, 'gi'));
  
  for (const regex of termRegexes) {
    highlightedContent = highlightedContent.replace(regex, '<mark>$1</mark>');
  }
  
  return highlightedContent;
}