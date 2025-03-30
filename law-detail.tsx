import { useState, useEffect } from "react";
import { useRoute, useLocation } from "wouter";
import { useQuery } from "@tanstack/react-query";
import { Section, Act } from "@shared/schema";
import Header from "@/components/header";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { useLanguagePreference } from "@/lib/hooks";
import { useToast } from "@/hooks/use-toast";
import NotFound from "@/pages/not-found";

export default function LawDetail() {
  const [isLawRoute, lawParams] = useRoute("/law/:id");
  const [isActRoute, actParams] = useRoute("/act/:id");
  const [, navigate] = useLocation();
  const { language } = useLanguagePreference();
  const { toast } = useToast();
  
  // Determine if we're viewing a section or an act
  const isViewingAct = isActRoute;
  const isViewingSection = isLawRoute;
  
  // Get the appropriate ID based on route
  const sectionId = isViewingSection && lawParams?.id ? parseInt(lawParams.id) : 0;
  const actId = isViewingAct && actParams?.id ? parseInt(actParams.id) : 0;
  
  // State for sections list when viewing an act
  const [actSections, setActSections] = useState<Section[]>([]);

  // Fetch section details if viewing a section
  const { data: section, isLoading: isLoadingSection, error: sectionError } = useQuery<Section>({
    queryKey: [`/api/sections/${sectionId}`],
    enabled: isViewingSection && !!sectionId
  });

  // Fetch act details
  const { data: act, isLoading: isLoadingAct, error: actError } = useQuery<Act>({
    queryKey: [`/api/acts/${isViewingSection ? section?.actId : actId}`],
    enabled: (isViewingSection && !!section?.actId) || (isViewingAct && !!actId)
  });
  
  // Fetch all sections for the act if viewing an act
  const { data: sections, isLoading: isLoadingSections } = useQuery<Section[]>({
    queryKey: [`/api/acts/${actId}/sections`],
    enabled: isViewingAct && !!actId
  });
  
  // Update actSections when sections data changes
  useEffect(() => {
    if (sections) {
      setActSections(sections);
    }
  }, [sections]);
  
  // Combined loading state
  const isLoading = (isViewingSection && isLoadingSection) || 
                    (isViewingAct && (isLoadingAct || isLoadingSections));

  if (isLoading) {
    return (
      <div className="min-h-screen flex flex-col">
        <Header />
        <div className="flex-1 flex items-center justify-center">
          <div className="text-center">
            <span className="material-icons text-4xl animate-spin text-primary">cached</span>
            <p className="mt-2">{language === "en" ? "Loading..." : "लोड हो रहा है..."}</p>
          </div>
        </div>
      </div>
    );
  }

  // Error handling
  if ((isViewingSection && (sectionError || !section)) || 
      (isViewingAct && (actError || !act))) {
    return (
      <div className="min-h-screen flex flex-col">
        <Header />
        <div className="flex-1 flex items-center justify-center">
          <Card className="w-full max-w-md mx-4">
            <CardContent className="pt-6">
              <div className="text-center">
                <span className="material-icons text-red-500 text-4xl">error_outline</span>
                <h2 className="text-xl font-medium mt-2">
                  {isViewingSection ?
                    (language === "en" ? "Section not found" : "धारा नहीं मिली") :
                    (language === "en" ? "Act not found" : "अधिनियम नहीं मिला")
                  }
                </h2>
                <p className="mt-2 text-neutral-600">
                  {isViewingSection ?
                    (language === "en" 
                      ? "The section you're looking for couldn't be found." 
                      : "आप जिस धारा की तलाश कर रहे हैं वह नहीं मिल सकी।") :
                    (language === "en"
                      ? "The act you're looking for couldn't be found."
                      : "आप जिस अधिनियम की तलाश कर रहे हैं वह नहीं मिल सका।")
                  }
                </p>
                <Button 
                  className="mt-4" 
                  onClick={() => navigate("/")}
                >
                  {language === "en" ? "Go back to home" : "होम पेज पर वापस जाएं"}
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  // Viewing a specific section
  if (isViewingSection && section) {
    return (
      <div className="min-h-screen flex flex-col">
        <Header />
        
        <main className="flex-1 bg-neutral-100 py-6">
          <div className="container mx-auto px-4">
            <Card className="mb-6">
              <CardContent className="p-6">
                <div className="flex justify-between items-start mb-4">
                  <div>
                    <span className="text-sm text-neutral-500">
                      {act ? (language === "en" ? act.name : act.nameHindi) : ""}
                    </span>
                    <h2 className="text-2xl font-serif font-bold text-neutral-900">
                      {language === "en" 
                        ? `${act?.shortName || ""} Section ${section.number} - ${section.title}`
                        : `${act?.shortName || ""} धारा ${section.number} - ${section.titleHindi}`
                      }
                    </h2>
                  </div>
                  <button 
                    onClick={() => navigate("/")}
                    className="text-neutral-400 hover:text-neutral-600"
                  >
                    <span className="material-icons">close</span>
                  </button>
                </div>
                
                <div className="border-b pb-4 mb-4">
                  <h3 className="font-medium text-lg mb-2">
                    {language === "en" ? "Description" : "विवरण"}
                  </h3>
                  <p className="text-neutral-700">
                    {language === "en" ? section.title : section.titleHindi}
                  </p>
                </div>
                
                <div className="border-b pb-4 mb-4">
                  <h3 className="font-medium text-lg mb-2">
                    {language === "en" ? "Content" : "सामग्री"}
                  </h3>
                  <p className="text-neutral-700 bg-neutral-50 p-3 rounded border">
                    {language === "en" ? section.content : section.contentHindi}
                  </p>
                </div>
                
                {section.interpretations && section.interpretations.length > 0 && (
                  <div className="border-b pb-4 mb-4">
                    <h3 className="font-medium text-lg mb-2">
                      {language === "en" ? "Interpretations" : "व्याख्याएँ"}
                    </h3>
                    <ul className="list-disc pl-5 space-y-2">
                      {(language === "en" ? section.interpretations : section.interpretationsHindi)?.map((interpretation, index) => (
                        <li key={index} className="text-neutral-700">
                          {interpretation}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
                
                <div className="grid md:grid-cols-2 gap-6 mb-4">
                  {section.relatedSections && section.relatedSections.length > 0 && (
                    <div>
                      <h3 className="font-medium text-lg mb-2">
                        {language === "en" ? "Related Sections" : "संबंधित धाराएँ"}
                      </h3>
                      <ul className="space-y-1">
                        {section.relatedSections?.map((relatedSection, index) => (
                          <li key={index}>
                            <button
                              onClick={() => {
                                // Extract section number or article reference from the text
                                let query = relatedSection;
                                const sectionMatch = relatedSection.match(/(?:Section|Article)\s+(\d+[A-Za-z]*)/i);
                                if (sectionMatch && sectionMatch[1]) {
                                  query = sectionMatch[1];
                                }
                                
                                // Find section with this number
                                fetch(`/api/search?q=${encodeURIComponent(query)}`)
                                  .then(response => response.json())
                                  .then(sections => {
                                    if (sections && sections.length > 0) {
                                      navigate(`/law/${sections[0].id}`);
                                      
                                      // Add to history
                                      fetch('/api/history', {
                                        method: 'POST',
                                        headers: { 'Content-Type': 'application/json' },
                                        body: JSON.stringify({
                                          userId: 1, // Default user ID
                                          sectionId: sections[0].id
                                        })
                                      }).catch(err => console.error("Error adding to history:", err));
                                    } else {
                                      toast({
                                        title: language === "en" ? "Section not found" : "धारा नहीं मिली",
                                        description: language === "en" 
                                          ? "We couldn't find that specific section in our database" 
                                          : "हम उस विशिष्ट धारा को हमारे डेटाबेस में नहीं ढूंढ सके",
                                        variant: "destructive"
                                      });
                                    }
                                  })
                                  .catch(err => {
                                    console.error("Error finding related section:", err);
                                    toast({
                                      title: language === "en" ? "Error" : "त्रुटि",
                                      description: language === "en"
                                        ? "There was an error searching for the related section"
                                        : "संबंधित धारा की खोज में एक त्रुटि हुई थी",
                                      variant: "destructive"
                                    });
                                  });
                              }}
                              className="text-primary hover:underline cursor-pointer"
                            >
                              {relatedSection}
                            </button>
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                  
                  {section.caseReferences && section.caseReferences.length > 0 && (
                    <div>
                      <h3 className="font-medium text-lg mb-2">
                        {language === "en" ? "Key Cases" : "प्रमुख मामले"}
                      </h3>
                      <ul className="space-y-1">
                        {section.caseReferences?.map((caseRef, index) => (
                          <li key={index}>
                            <button
                              onClick={() => {
                                // Open a search for this case name
                                fetch(`/api/search?q=${encodeURIComponent(caseRef)}`)
                                  .then(response => response.json())
                                  .then(results => {
                                    // Redirect to first result or show search results
                                    if (results && results.length > 0) {
                                      navigate(`/law/${results[0].id}`);
                                      
                                      // Add to history
                                      fetch('/api/history', {
                                        method: 'POST',
                                        headers: { 'Content-Type': 'application/json' },
                                        body: JSON.stringify({
                                          userId: 1, // Default user ID
                                          sectionId: results[0].id
                                        })
                                      }).catch(err => console.error("Error adding to history:", err));
                                    } else {
                                      // Create a modal to display the case information
                                      const modal = document.createElement('div');
                                      modal.className = 'fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4';
                                      
                                      const modalContent = document.createElement('div');
                                      modalContent.className = 'bg-white rounded-lg p-6 max-w-2xl w-full max-h-[80vh] overflow-y-auto';
                                      
                                      const caseDetail = document.createElement('div');
                                      caseDetail.innerHTML = `
                                        <h2 class="text-xl font-bold mb-4">${caseRef}</h2>
                                        <p class="text-sm text-neutral-600 mb-6">
                                          ${language === 'en' 
                                            ? 'This case reference is not fully available in our database. You can search for it online using the button below.' 
                                            : 'यह केस संदर्भ हमारे डेटाबेस में पूरी तरह से उपलब्ध नहीं है। आप नीचे दिए गए बटन का उपयोग करके इसे ऑनलाइन खोज सकते हैं।'}
                                        </p>
                                        <div class="flex justify-end space-x-2">
                                          <button id="close-case-modal" class="px-4 py-2 border border-neutral-300 rounded-md hover:bg-neutral-100">
                                            ${language === 'en' ? 'Close' : 'बंद करें'}
                                          </button>
                                          <button id="search-online" class="px-4 py-2 bg-primary text-white rounded-md hover:bg-primary-dark">
                                            ${language === 'en' ? 'Search Online' : 'ऑनलाइन खोजें'}
                                          </button>
                                        </div>
                                      `;
                                      
                                      modalContent.appendChild(caseDetail);
                                      modal.appendChild(modalContent);
                                      document.body.appendChild(modal);
                                      
                                      // Add event listeners
                                      document.getElementById('close-case-modal')?.addEventListener('click', () => {
                                        document.body.removeChild(modal);
                                      });
                                      
                                      document.getElementById('search-online')?.addEventListener('click', () => {
                                        window.open(`https://indiankanoon.org/search/?formInput=${encodeURIComponent(caseRef)}`, '_blank');
                                        document.body.removeChild(modal);
                                      });
                                    }
                                  })
                                  .catch(err => {
                                    console.error("Error searching for case:", err);
                                    toast({
                                      title: language === "en" ? "Error" : "त्रुटि",
                                      description: language === "en"
                                        ? "There was an error searching for the case reference"
                                        : "केस संदर्भ की खोज में एक त्रुटि हुई थी",
                                      variant: "destructive"
                                    });
                                  });
                              }}
                              className="text-primary hover:underline cursor-pointer"
                            >
                              {caseRef}
                            </button>
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>
                
                <div className="mt-6 flex justify-between">
                  <Button
                    variant="ghost"
                    className="text-neutral-700 hover:text-primary"
                    onClick={() => {
                      const content = language === "en" ? section.content : section.contentHindi;
                      const title = language === "en" ? `${section.number} - ${section.title}` : `${section.number} - ${section.titleHindi}`;
                      const blob = new Blob([`${title}\n\n${content}`], { type: 'text/plain' });
                      const url = URL.createObjectURL(blob);
                      const a = document.createElement('a');
                      a.href = url;
                      a.download = `section_${section.number}.txt`;
                      document.body.appendChild(a);
                      a.click();
                      document.body.removeChild(a);
                      URL.revokeObjectURL(url);
                    }}
                  >
                    <span className="material-icons mr-1">file_download</span>
                    <span>{language === "en" ? "Download" : "डाउनलोड"}</span>
                  </Button>
                  
                  <Button
                    variant="ghost"
                    className="text-neutral-700 hover:text-primary"
                    onClick={() => {
                      const text = language === "en" 
                        ? `Section ${section.number} - ${section.title}\n${section.content}` 
                        : `धारा ${section.number} - ${section.titleHindi}\n${section.contentHindi}`;
                      
                      if (navigator.share) {
                        navigator.share({
                          title: language === "en" ? "Shared from Indian Law Reference" : "भारतीय कानून संदर्भ से साझा किया गया",
                          text: text,
                          url: window.location.href
                        }).catch(err => console.error("Could not share:", err));
                      } else {
                        // Fallback for browsers that don't support the Web Share API
                        navigator.clipboard.writeText(text + "\n\n" + window.location.href)
                          .then(() => {
                            toast({
                              title: language === "en" ? "Copied to clipboard" : "क्लिपबोर्ड पर कॉपी किया गया",
                              description: language === "en" ? "Text and link copied to clipboard" : "टेक्स्ट और लिंक क्लिपबोर्ड पर कॉपी किया गया"
                            });
                          })
                          .catch(err => console.error("Could not copy text:", err));
                      }
                    }}
                  >
                    <span className="material-icons mr-1">share</span>
                    <span>{language === "en" ? "Share" : "शेयर"}</span>
                  </Button>
                  
                  <Button
                    variant="ghost"
                    className="text-neutral-700 hover:text-primary"
                    onClick={() => {
                      // Get existing bookmarks
                      const storedBookmarks = localStorage.getItem('lawBookmarks');
                      const bookmarks = storedBookmarks ? JSON.parse(storedBookmarks) : [];
                      
                      // Check if this section is already bookmarked
                      const isBookmarked = bookmarks.some((b: any) => b.id === section.id);
                      
                      if (isBookmarked) {
                        // Remove from bookmarks
                        const updatedBookmarks = bookmarks.filter((b: any) => b.id !== section.id);
                        localStorage.setItem('lawBookmarks', JSON.stringify(updatedBookmarks));
                        
                        toast({
                          title: language === "en" ? "Bookmark removed" : "बुकमार्क हटाया गया",
                          description: language === "en" ? "This section has been removed from bookmarks" : "यह धारा बुकमार्क से हटा दी गई है"
                        });
                      } else {
                        // Add to bookmarks
                        const newBookmark = {
                          id: section.id,
                          actId: section.actId,
                          number: section.number,
                          title: section.title,
                          titleHindi: section.titleHindi,
                          timestamp: new Date().toISOString()
                        };
                        
                        bookmarks.push(newBookmark);
                        localStorage.setItem('lawBookmarks', JSON.stringify(bookmarks));
                        
                        toast({
                          title: language === "en" ? "Bookmarked" : "बुकमार्क किया गया",
                          description: language === "en" ? "This section has been added to bookmarks" : "यह धारा बुकमार्क में जोड़ दी गई है"
                        });
                      }
                    }}
                  >
                    <span className="material-icons mr-1">bookmark_border</span>
                    <span>{language === "en" ? "Bookmark" : "बुकमार्क"}</span>
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        </main>
      </div>
    );
  }
  
  // Viewing an act with all its sections
  if (isViewingAct && act) {
    return (
      <div className="min-h-screen flex flex-col">
        <Header />
        
        <main className="flex-1 bg-neutral-100 py-6">
          <div className="container mx-auto px-4">
            <Card className="mb-6">
              <CardContent className="p-6">
                <div className="flex justify-between items-start mb-4">
                  <div>
                    <h2 className="text-2xl font-serif font-bold text-neutral-900">
                      {language === "en" ? act.name : act.nameHindi}
                    </h2>
                    <p className="text-sm text-neutral-500 mt-1">
                      {language === "en" 
                        ? `${actSections.length} sections` 
                        : `${actSections.length} धाराएँ`}
                    </p>
                  </div>
                  <button 
                    onClick={() => navigate("/")}
                    className="text-neutral-400 hover:text-neutral-600"
                  >
                    <span className="material-icons">close</span>
                  </button>
                </div>
                
                <div className="mt-6">
                  <h3 className="font-medium text-lg mb-3">
                    {language === "en" ? "All Sections" : "सभी धाराएँ"}
                  </h3>
                  
                  {actSections.length > 0 ? (
                    <div className="space-y-3">
                      {actSections.map((section) => (
                        <Card key={section.id} className="overflow-hidden hover:shadow-md transition-shadow">
                          <div
                            className="p-4 cursor-pointer"
                            onClick={() => navigate(`/law/${section.id}`)}
                          >
                            <h4 className="font-medium">
                              {language === "en" 
                                ? `Section ${section.number} - ${section.title}`
                                : `धारा ${section.number} - ${section.titleHindi}`
                              }
                            </h4>
                            <p className="text-sm text-neutral-600 mt-1 line-clamp-2">
                              {language === "en" ? section.content : section.contentHindi}
                            </p>
                            <div className="flex justify-end mt-2">
                              <button className="text-primary text-sm flex items-center">
                                <span>{language === "en" ? "View details" : "विवरण देखें"}</span>
                                <span className="material-icons text-sm ml-1">arrow_forward</span>
                              </button>
                            </div>
                          </div>
                        </Card>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-10">
                      <span className="material-icons text-4xl text-neutral-300 mb-2">folder_off</span>
                      <h3 className="font-medium text-lg">
                        {language === "en" ? "No sections found" : "कोई धारा नहीं मिली"}
                      </h3>
                      <p className="text-neutral-500 mt-1">
                        {language === "en" 
                          ? "There are no sections available for this act." 
                          : "इस अधिनियम के लिए कोई धारा उपलब्ध नहीं है।"
                        }
                      </p>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>
        </main>
      </div>
    );
  }
  
  // Fallback (should never happen with the conditions above)
  return <NotFound />;
}
