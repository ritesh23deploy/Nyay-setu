import { useState, useEffect } from 'react';

// Custom hook for storing and retrieving recent searches from localStorage
export function useRecentSearches(limit: number = 5) {
  const [recentSearches, setRecentSearches] = useState<string[]>(() => {
    const saved = localStorage.getItem('recentSearches');
    return saved ? JSON.parse(saved) : [];
  });

  const addSearch = (search: string) => {
    if (!search.trim()) return;
    
    setRecentSearches(prev => {
      // Remove if it already exists (to avoid duplicates)
      const filtered = prev.filter(s => s !== search);
      // Add to the beginning and limit the number
      const updated = [search, ...filtered].slice(0, limit);
      
      // Save to localStorage
      localStorage.setItem('recentSearches', JSON.stringify(updated));
      
      return updated;
    });
  };

  const clearSearches = () => {
    localStorage.removeItem('recentSearches');
    setRecentSearches([]);
  };

  return { recentSearches, addSearch, clearSearches };
}

// Custom hook to manage language preference
export function useLanguagePreference() {
  const [language, setLanguage] = useState<'en' | 'hi'>(() => {
    const saved = localStorage.getItem('language');
    return (saved === 'en' || saved === 'hi') ? saved : 'en';
  });

  const toggleLanguage = () => {
    const newLanguage = language === 'en' ? 'hi' : 'en';
    localStorage.setItem('language', newLanguage);
    setLanguage(newLanguage);
  };

  return { language, toggleLanguage };
}

// Custom hook to detect mobile screens
export function useMobileDetect() {
  const [isMobile, setIsMobile] = useState(
    typeof window !== 'undefined' ? window.innerWidth < 768 : false
  );

  useEffect(() => {
    const handleResize = () => {
      setIsMobile(window.innerWidth < 768);
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  return isMobile;
}
