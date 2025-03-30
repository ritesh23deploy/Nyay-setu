import React, { useState } from 'react';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Loader2 } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useLocation } from "wouter";

interface AdvancedSearchProps {
  language: 'en' | 'hi';
}

interface SearchResult {
  section: {
    id: number;
    actId: number;
    number: string;
    title: string;
    titleHindi: string;
    content: string;
    contentHindi: string;
  };
  act?: {
    id: number;
    name: string;
    nameHindi: string;
    categoryId: number;
  };
  relevance: number;
  matchedTerms: string[];
  highlightedContent: string;
}

export default function AdvancedSearch({ language }: AdvancedSearchProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [searchPerformed, setSearchPerformed] = useState(false);
  const [, navigate] = useLocation();

  // Use react-query for data fetching with proper typing
  const { 
    data, 
    isLoading, 
    isError, 
    error, 
    refetch 
  } = useQuery<SearchResult[]>({
    queryKey: ['advanced-search', searchQuery, language],
    queryFn: async () => {
      if (!searchQuery) return [] as SearchResult[];
      
      try {
        const response = await fetch(
          `/api/advanced-search?q=${encodeURIComponent(searchQuery)}&lang=${language}`
        );
        
        if (!response.ok) {
          throw new Error(`Search error: ${response.statusText}`);
        }
        
        return await response.json() as SearchResult[];
      } catch (error) {
        console.error('Advanced search error:', error);
        return [] as SearchResult[];
      }
    },
    enabled: false // Don't run query automatically
  });
  
  // Safely extract search results with proper typing
  const searchResults: SearchResult[] = data || [];

  const handleSearch = async () => {
    if (!searchQuery.trim()) return;
    setSearchPerformed(true);
    await refetch();
  };

  const handleKeyPress = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      handleSearch();
    }
  };

  const handleResultClick = (sectionId: number) => {
    navigate(`/section/${sectionId}`);
  };

  const renderHighlightedContent = (html: string) => {
    return { __html: html };
  };

  // Localized text based on language
  const searchPlaceholder = language === 'en' 
    ? 'Search for legal terms (e.g., "criminal negligence in homicide cases")' 
    : 'कानूनी शब्द खोजें (उदाहरण: "हत्या के मामलों में आपराधिक लापरवाही")';
  
  const searchButton = language === 'en' ? 'Search' : 'खोजें';
  const noResultsText = language === 'en' ? 'No results found' : 'कोई परिणाम नहीं मिला';
  const relevanceText = language === 'en' ? 'Relevance' : 'प्रासंगिकता';
  const fromActText = language === 'en' ? 'From' : 'से';
  const sectionText = language === 'en' ? 'Section' : 'धारा';
  const matchedTermsText = language === 'en' ? 'Matched terms' : 'मिले हुए शब्द';
  const errorText = language === 'en' ? 'Error performing search' : 'खोज करने में त्रुटि';
  const advancedSearchText = language === 'en' ? 'Advanced Search' : 'उन्नत खोज';
  const advancedSearchDescText = language === 'en' 
    ? 'Search using natural language processing to find relevant legal sections' 
    : 'प्रासंगिक कानूनी अनुभागों को खोजने के लिए प्राकृतिक भाषा प्रसंस्करण का उपयोग करके खोजें';

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle>{advancedSearchText}</CardTitle>
        <CardDescription>
          {advancedSearchDescText}
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="flex space-x-2 mb-4">
          <Input
            type="text"
            placeholder={searchPlaceholder}
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            onKeyPress={handleKeyPress}
            className="flex-grow"
          />
          <Button 
            onClick={handleSearch} 
            disabled={isLoading || !searchQuery.trim()}
          >
            {isLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
            {searchButton}
          </Button>
        </div>

        {isError && (
          <div className="text-red-500 p-4 rounded-md bg-red-50 my-4">
            {errorText}: {error instanceof Error ? error.message : String(error)}
          </div>
        )}

        {searchPerformed && !isLoading && searchResults && searchResults.length === 0 && (
          <div className="text-center p-8 text-gray-500">
            {noResultsText}
          </div>
        )}

        {!isLoading && searchResults && searchResults.length > 0 && (
          <div className="space-y-4 mt-4">
            {searchResults.map((result) => {
              const title = language === 'en' ? result.section.title : result.section.titleHindi;
              const actName = result.act 
                ? (language === 'en' ? result.act.name : result.act.nameHindi)
                : "";
              
              return (
                <Card 
                  key={result.section.id} 
                  className="cursor-pointer hover:shadow-md transition-shadow"
                  onClick={() => handleResultClick(result.section.id)}
                >
                  <CardHeader className="pb-2">
                    <div className="flex justify-between items-start">
                      <CardTitle className="text-lg font-bold">
                        {sectionText} {result.section.number}: {title}
                      </CardTitle>
                      <Badge variant="outline" className="ml-2">
                        {relevanceText}: {result.relevance}
                      </Badge>
                    </div>
                    {actName && (
                      <CardDescription>
                        {fromActText} {actName}
                      </CardDescription>
                    )}
                  </CardHeader>
                  <CardContent className="pt-0">
                    <div 
                      className="text-sm text-gray-700 mb-3"
                      dangerouslySetInnerHTML={renderHighlightedContent(result.highlightedContent)}
                    />
                    
                    <Separator className="my-2" />
                    
                    <div className="flex flex-wrap gap-1 mt-2">
                      <span className="text-xs text-gray-500 mr-1">{matchedTermsText}:</span>
                      {result.matchedTerms.map((term: string, i: number) => (
                        <Badge key={i} variant="secondary" className="text-xs">
                          {term}
                        </Badge>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}
      </CardContent>
    </Card>
  );
}