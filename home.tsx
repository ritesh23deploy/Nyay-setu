import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useLocation } from "wouter";
import { Section, LawCategory, Update } from "@shared/schema";
import Sidebar from "@/components/sidebar";
import MobileNav from "@/components/mobile-nav";
import Header from "@/components/header";
import SectionCard from "@/components/ui/section-card";
import UpdateCard from "@/components/ui/update-card";
import GeminiAnalysis from "@/components/gemini";
import CaseWorkbook from "@/components/case-workbook";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Separator } from "@/components/ui/separator";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { Switch } from "@/components/ui/switch";
import { Slider } from "@/components/ui/slider";
import { Label } from "@/components/ui/label";
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from "@/components/ui/select";
import { useLanguagePreference, useRecentSearches } from "@/lib/hooks";
import { apiRequest } from "@/lib/queryClient";
import { DEFAULT_USER_ID, LAW_CATEGORIES, POPULAR_ACTS, GRID_LAYOUTS, LEGAL_TERMS } from "@/lib/constants";
import { addToHistory } from "@/lib/data-utils";

export default function Home() {
  const [activeTab, setActiveTab] = useState("home");
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<Section[]>([]);
  const [searching, setSearching] = useState(false);
  const [openSection, setOpenSection] = useState<string | null>(null);
  const [gridLayout, setGridLayout] = useState("comfortable");
  const [showTooltips, setShowTooltips] = useState(true);
  const { language } = useLanguagePreference();
  const { recentSearches, addSearch } = useRecentSearches(5);
  const [, setLocation] = useLocation();

  // Fetch categories
  const { data: categories } = useQuery({
    queryKey: ["/api/categories"],
    enabled: true
  });

  // Fetch updates
  const { data: updates } = useQuery<Update[]>({
    queryKey: ["/api/updates"],
    enabled: activeTab === "updates"
  });

  // Fetch user history
  const { data: history } = useQuery({
    queryKey: [`/api/history/${DEFAULT_USER_ID}`],
    enabled: activeTab === "history"
  });

  const performSearch = async () => {
    if (!searchQuery.trim()) return;
    
    setSearching(true);
    try {
      // Check if search query is a category name
      const matchingCategory = LAW_CATEGORIES.find(
        cat => cat.name.toLowerCase() === searchQuery.toLowerCase() || 
               cat.name.toLowerCase() + " कानून" === searchQuery.toLowerCase() ||
               cat.nameHindi?.toLowerCase() === searchQuery.toLowerCase()
      );

      if (matchingCategory) {
        // Get acts for this category
        const categoryId = matchingCategory.id;
        const actsResponse = await fetch(`/api/categories/${categoryId}/acts`);
        
        if (!actsResponse.ok) {
          throw new Error(`Failed to get acts: ${actsResponse.statusText}`);
        }
        
        const acts = await actsResponse.json();
        
        // Get first few sections for each act to show as results
        let allSections: Section[] = [];
        
        for (const act of acts) {
          const sectionsResponse = await fetch(`/api/acts/${act.id}/sections`);
          
          if (sectionsResponse.ok) {
            const sections = await sectionsResponse.json();
            allSections = [...allSections, ...sections.slice(0, 3)]; // Take first 3 sections per act
          }
        }
        
        setSearchResults(allSections);
        addSearch(searchQuery);
      } else {
        // Regular search by keywords
        const response = await fetch(`/api/search?q=${encodeURIComponent(searchQuery)}`);
        if (!response.ok) {
          throw new Error(`Search failed: ${response.statusText}`);
        }
        
        const data = await response.json();
        setSearchResults(data);
        addSearch(searchQuery);
      }
    } catch (error) {
      console.error("Search error:", error);
      setSearchResults([]);
    } finally {
      setSearching(false);
    }
  };

  const clearSearch = () => {
    setSearchQuery("");
    setSearchResults([]);
  };
  
  // Fetch acts for a specific category and then get sections for the first act
  const fetchCategoryActs = async (categoryId: string) => {
    setSearching(true);
    setSearchResults([]);
    
    try {
      // Convert string category ID to numeric ID for API
      const numericId = LAW_CATEGORIES.findIndex(cat => cat.id === categoryId) + 1;
      if (numericId <= 0) return;
      
      const response = await fetch(`/api/categories/${numericId}/acts`);
      if (!response.ok) {
        throw new Error(`Failed to get acts: ${response.statusText}`);
      }
      
      const acts = await response.json();
      
      // Show category name in search box
      const categoryName = LAW_CATEGORIES.find(cat => cat.id === categoryId)?.name || '';
      setSearchQuery(categoryName);
      
      if (acts && acts.length > 0) {
        // Get sections for acts
        let allSections: Section[] = [];
        
        for (const act of acts.slice(0, 3)) { // Limit to first 3 acts for performance
          const sectionsResponse = await fetch(`/api/acts/${act.id}/sections`);
          
          if (sectionsResponse.ok) {
            const sections = await sectionsResponse.json();
            allSections = [...allSections, ...sections];
          }
        }
        
        // Display the sections
        setSearchResults(allSections);
        
        if (categoryName) {
          addSearch(categoryName);
        }
      }
    } catch (error) {
      console.error("Error fetching category acts:", error);
    } finally {
      setSearching(false);
    }
  };

  const viewSectionDetail = async (id: number) => {
    try {
      // Add to history
      await addToHistory(DEFAULT_USER_ID, id);
      // Navigate to section detail page
      setLocation(`/law/${id}`);
    } catch (error) {
      console.error("Error navigating to section:", error);
    }
  };

  const toggleSection = (id: string) => {
    setOpenSection(openSection === id ? null : id);
  };

  // Get the current layout settings
  const currentLayout = GRID_LAYOUTS.find(layout => layout.id === gridLayout) || GRID_LAYOUTS[0];

  // Function to render legal term tooltip
  const renderLegalTerm = (text: string) => {
    if (!showTooltips) return text;
    
    // Check if the text contains any legal terms and wrap them in tooltips
    let result = text;
    LEGAL_TERMS.forEach(term => {
      const regex = new RegExp(`\\b${term.term}\\b`, 'g');
      result = result.replace(regex, `<span class="legal-term">${term.term}</span>`);
    });
    
    return result;
  };

  return (
    <div className="min-h-screen flex flex-col">
      <Header />
      
      <div className="flex flex-1 relative">
        <main className="flex-1 overflow-x-hidden bg-neutral-100 pb-16 lg:pb-0">
          <div className="container mx-auto px-4 py-6">
            {/* App Title */}
            <div className="flex items-center justify-between mb-6">
              <h1 className="text-2xl font-serif font-bold bg-gradient-to-r from-primary to-primary/60 text-transparent bg-clip-text">
                {language === "en" ? "Indian Law Reference" : "भारतीय कानून संदर्भ"}
              </h1>
              
              <div className="flex items-center">
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Label htmlFor="show-tooltips" className="flex items-center cursor-pointer">
                        <Switch
                          id="show-tooltips"
                          checked={showTooltips}
                          onCheckedChange={setShowTooltips}
                          className="mr-2"
                        />
                        <span className="material-icons text-primary">info</span>
                      </Label>
                    </TooltipTrigger>
                    <TooltipContent>
                      {language === "en" ? "Show legal term tooltips" : "कानूनी शब्दों के टूलटिप्स दिखाएं"}
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>
              </div>
            </div>
            {/* Home Tab */}
            {activeTab === "home" && (
              <>
                {/* Search Section */}
                <Card className="mb-6">
                  <CardContent className="pt-6">
                    <h2 className="text-xl font-serif font-bold mb-4">
                      {language === "en" ? "Search Indian Law" : "भारतीय कानून खोजें"}
                    </h2>
                    
                    <div className="relative">
                      <span className="absolute inset-y-0 left-0 flex items-center pl-3">
                        <span className="material-icons text-neutral-400">search</span>
                      </span>
                      <Input
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        onKeyDown={(e) => e.key === "Enter" && performSearch()}
                        className="w-full pl-10 pr-10"
                        placeholder={language === "en" 
                          ? "Search by section, act or keywords..." 
                          : "धारा, अधिनियम या कीवर्ड द्वारा खोजें..."
                        }
                      />
                      {searchQuery && (
                        <button 
                          onClick={clearSearch}
                          className="absolute inset-y-0 right-0 flex items-center pr-3"
                        >
                          <span className="material-icons text-neutral-400 hover:text-neutral-600">close</span>
                        </button>
                      )}
                    </div>
                    
                    {recentSearches.length > 0 && (
                      <div className="mt-4">
                        <p className="text-sm text-neutral-500 mb-2">
                          {language === "en" ? "Recent Searches:" : "हाल की खोजें:"}
                        </p>
                        <div className="flex flex-wrap gap-2">
                          {recentSearches.map((search, index) => (
                            <button 
                              key={index}
                              onClick={() => {
                                setSearchQuery(search);
                                performSearch();
                              }}
                              className="px-3 py-1 bg-neutral-100 text-neutral-700 rounded-full text-sm hover:bg-neutral-200 transition"
                            >
                              {search}
                            </button>
                          ))}
                        </div>
                      </div>
                    )}
                  </CardContent>
                </Card>
                
                {/* Search Results */}
                {searchResults.length > 0 && (
                  <Card className="overflow-hidden mb-6">
                    <div className="border-b px-6 py-3 bg-neutral-50">
                      <h3 className="font-medium">
                        <span>{language === "en" ? "Search Results" : "खोज परिणाम"}</span>
                        <span className="text-neutral-500 text-sm ml-2">{`(${searchResults.length})`}</span>
                      </h3>
                    </div>
                    
                    <ul className="divide-y divide-neutral-100">
                      {searchResults.map((result) => (
                        <li 
                          key={result.id} 
                          className="px-6 py-4 hover:bg-neutral-50 cursor-pointer" 
                          onClick={() => viewSectionDetail(result.id)}
                        >
                          <div className="flex items-start">
                            <span className="material-icons text-primary mr-3 mt-1">description</span>
                            <div>
                              <h4 className="font-medium">
                                {language === "en" 
                                  ? `Section ${result.number} - ${result.title}`
                                  : `धारा ${result.number} - ${result.titleHindi}`
                                }
                              </h4>
                              <p className="text-sm text-neutral-600 mt-1">
                                {showTooltips ? (
                                  <TooltipProvider>
                                    <div dangerouslySetInnerHTML={{ 
                                      __html: language === "en" 
                                        ? result.content.substring(0, 100).replace(/\b(Writ|Suo motu|Ex parte|Habeas corpus)\b/g, (match) => {
                                            const term = LEGAL_TERMS.find(t => t.term === match);
                                            return term ? `<span class="legal-term cursor-help border-b border-dotted border-primary">${match}</span>` : match;
                                          }) + "..."
                                        : result.contentHindi.substring(0, 100) + "..."
                                    }} />
                                  </TooltipProvider>
                                ) : (
                                  language === "en" ? result.content.substring(0, 100) + "..." : result.contentHindi.substring(0, 100) + "..."
                                )}
                              </p>
                            </div>
                          </div>
                        </li>
                      ))}
                    </ul>
                  </Card>
                )}
                
                {/* No Results State */}
                {searchQuery && searchResults.length === 0 && (
                  <Card className="p-6 text-center mb-6">
                    <span className="material-icons text-4xl text-neutral-300 mb-2">search_off</span>
                    <h3 className="font-medium text-lg">
                      {language === "en" ? "No results found" : "कोई परिणाम नहीं मिला"}
                    </h3>
                    <p className="text-neutral-500 mt-1">
                      {language === "en" 
                        ? "Try different keywords or browse categories" 
                        : "अलग कीवर्ड आज़माएं या श्रेणियां ब्राउज़ करें"
                      }
                    </p>
                  </Card>
                )}
                
                {/* Categories Section */}
                <h2 className="text-xl font-serif font-bold mb-4">
                  {language === "en" ? "Law Categories" : "कानून श्रेणियाँ"}
                </h2>
                
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-5 mb-8">
                  {LAW_CATEGORIES.map((category) => (
                    <button 
                      key={category.id} 
                      onClick={() => {
                        // Get acts for this category directly
                        fetchCategoryActs(category.id);
                      }}
                      className="category-card group flex flex-col items-center justify-center p-6 border rounded-xl bg-gradient-to-b from-white to-gray-50 hover:from-primary/5 hover:to-primary/10 transition-all duration-300 transform hover:scale-102 shadow hover:shadow-lg"
                    >
                      <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center mb-4 group-hover:bg-primary/20 transition-all duration-300">
                        <span className="material-icons text-3xl text-primary group-hover:text-primary-dark">{category.icon}</span>
                      </div>
                      <h3 className="font-medium text-center text-gray-800 group-hover:text-primary-dark transition-colors">
                        {language === "en" ? category.name : category.nameHindi}
                      </h3>
                    </button>
                  ))}
                </div>
                
                {/* Popular Acts */}
                <div className="mt-10">
                  <h2 className="text-xl font-serif font-bold mb-4 flex items-center">
                    <span className="material-icons text-primary mr-2">library_books</span>
                    {language === "en" ? "Popular Acts" : "लोकप्रिय अधिनियम"}
                  </h2>
                  
                  <div className="grid grid-cols-1 gap-4 mb-4">
                    {POPULAR_ACTS.map((act) => (
                      <div key={act.id} className="rounded-xl overflow-hidden border shadow-sm bg-white hover:shadow-md transition-all">
                        <div 
                          onClick={() => toggleSection(act.id)}
                          className="px-6 py-5 flex items-center justify-between cursor-pointer bg-gradient-to-r from-primary/5 to-transparent"
                        >
                          <div className="flex items-center">
                            <div className="bg-primary/10 p-2 rounded-full mr-4">
                              <span className="material-icons text-primary">{act.icon}</span>
                            </div>
                            <div>
                              <h3 className="font-medium text-gray-800">
                                {language === "en" ? act.name : act.nameHindi}
                              </h3>
                              <p className="text-xs text-gray-500 mt-1">
                                {language === "en" ? "View sections and clauses" : "धाराएँ और खंड देखें"}
                              </p>
                            </div>
                          </div>
                          <span 
                            className={`material-icons bg-white h-8 w-8 flex items-center justify-center rounded-full shadow-sm text-primary transform transition-transform ${
                              openSection === act.id ? "rotate-180" : ""
                            }`}
                          >
                            expand_more
                          </span>
                        </div>
                        
                        {openSection === act.id && (
                          <div className="px-6 py-4 border-t">
                            {act.sections.length > 0 ? (
                              <div className="space-y-2">
                                {act.sections.map((section) => (
                                  <button 
                                    key={section.id}
                                    onClick={() => viewSectionDetail(section.id)}
                                    className="block w-full text-left px-4 py-3 rounded-lg hover:bg-primary/5 text-sm transition-colors border border-gray-100 hover:border-primary/20 group"
                                  >
                                    <div className="flex items-center justify-between">
                                      <span className="group-hover:text-primary-dark font-medium">{section.title}</span>
                                      <span className="material-icons text-gray-400 text-sm group-hover:text-primary">arrow_forward</span>
                                    </div>
                                  </button>
                                ))}
                                <div className="text-center pt-3">
                                  <Button 
                                    variant="outline" 
                                    size="sm" 
                                    className="w-full"
                                    onClick={() => {
                                      // Get the act ID and fetch all sections
                                      const numericActId = POPULAR_ACTS.findIndex(a => a.id === act.id) + 1;
                                      if (numericActId > 0) {
                                        setLocation(`/act/${numericActId}`);
                                      }
                                    }}
                                  >
                                    <span className="material-icons mr-2 text-sm">list</span>
                                    <span>{language === "en" ? "View all sections" : "सभी धाराएँ देखें"}</span>
                                  </Button>
                                </div>
                              </div>
                            ) : (
                              <div className="text-center py-4">
                                <span className="text-sm text-gray-500 flex items-center justify-center">
                                  <span className="material-icons mr-2 text-sm">info</span>
                                  {language === "en" ? "Loading sections..." : "धाराएँ लोड हो रही हैं..."}
                                </span>
                              </div>
                            )}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              </>
            )}
            
            {/* History Tab */}
            {activeTab === "history" && (
              <>
                <h2 className="text-xl font-serif font-bold mb-4">
                  {language === "en" ? "Recently Viewed" : "हाल ही में देखे गए"}
                </h2>
                
                {history && Array.isArray(history) && history.length > 0 ? (
                  <div className="space-y-4">
                    {history.map((item: any) => (
                      <SectionCard
                        key={item.id}
                        section={item.section}
                        category={language === "en" ? "Criminal Law" : "आपराधिक कानून"}
                        timestamp={item.timestamp}
                        onClick={viewSectionDetail}
                      />
                    ))}
                  </div>
                ) : (
                  <Card className="p-6 text-center">
                    <span className="material-icons text-4xl text-neutral-300 mb-2">history</span>
                    <h3 className="font-medium text-lg">
                      {language === "en" ? "No history yet" : "अभी तक कोई इतिहास नहीं"}
                    </h3>
                    <p className="text-neutral-500 mt-1">
                      {language === "en" 
                        ? "Your recently viewed sections will appear here" 
                        : "आपकी हाल ही में देखी गई धाराएँ यहां दिखाई देंगी"
                      }
                    </p>
                  </Card>
                )}
              </>
            )}
            
            {/* Updates Tab */}
            {activeTab === "updates" && (
              <>
                <h2 className="text-xl font-serif font-bold mb-4">
                  {language === "en" ? "Recent Legal Updates" : "हालिया कानूनी अपडेट"}
                </h2>
                
                {updates && updates.length > 0 ? (
                  <div className="space-y-4">
                    {updates.map((update) => (
                      <UpdateCard key={update.id} update={update} />
                    ))}
                  </div>
                ) : (
                  <Card className="p-6 text-center">
                    <span className="material-icons text-4xl text-neutral-300 mb-2">update</span>
                    <h3 className="font-medium text-lg">
                      {language === "en" ? "Loading updates..." : "अपडेट लोड हो रहे हैं..."}
                    </h3>
                    <p className="text-neutral-500 mt-1">
                      {language === "en" 
                        ? "Recent legal updates will appear here" 
                        : "हालिया कानूनी अपडेट यहां दिखाई देंगे"
                      }
                    </p>
                  </Card>
                )}
              </>
            )}
            
            {/* Gemini AI Tab */}
            {activeTab === "gemini" && (
              <GeminiAnalysis />
            )}
            
            {/* Case Workbook Tab */}
            {activeTab === "workbook" && (
              <CaseWorkbook />
            )}
            

          </div>
        </main>
      </div>
      
      <MobileNav activeTab={activeTab} onTabChange={setActiveTab} />
    </div>
  );
}