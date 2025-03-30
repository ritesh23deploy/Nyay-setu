import { useState, useEffect } from "react";
import { NAV_ITEMS } from "@/lib/constants";
import { useLanguagePreference } from "@/lib/hooks";

interface SidebarProps {
  activeTab: string;
  onTabChange: (tabId: string) => void;
}

export default function Sidebar({ activeTab, onTabChange }: SidebarProps) {
  const [isOpen, setIsOpen] = useState(window.innerWidth >= 1024);
  const { language } = useLanguagePreference();

  useEffect(() => {
    const handleResize = () => {
      setIsOpen(window.innerWidth >= 1024);
    };

    const handleToggle = () => {
      setIsOpen(prev => !prev);
    };

    window.addEventListener('resize', handleResize);
    document.addEventListener('toggle-sidebar', handleToggle);

    return () => {
      window.removeEventListener('resize', handleResize);
      document.removeEventListener('toggle-sidebar', handleToggle);
    };
  }, []);

  return (
    <aside 
      className={`bg-white shadow-lg fixed inset-y-0 left-0 z-10 w-64 transform top-16 bottom-0 transition-transform duration-300 ease-in-out lg:translate-x-0 lg:static lg:h-auto ${
        isOpen ? 'translate-x-0' : '-translate-x-full'
      }`}
    >
      <div className="h-full flex flex-col overflow-y-auto pb-16 lg:pb-0">
        <nav className="flex-1 px-2 py-4 space-y-1">
          {NAV_ITEMS.map(item => (
            <button 
              key={item.id}
              onClick={() => onTabChange(item.id)} 
              className={`w-full flex items-center px-3 py-2 rounded-md transition ${
                activeTab === item.id 
                  ? 'bg-primary text-white' 
                  : 'text-neutral-700 hover:bg-neutral-100'
              }`}
            >
              <span className="material-icons mr-3">{item.icon}</span>
              <span>{language === 'en' ? item.label : item.labelHindi}</span>
            </button>
          ))}
        </nav>
        
        <div className="px-3 py-4 border-t">
          <button className="flex items-center text-neutral-700 hover:text-primary transition">
            <span className="material-icons mr-3">help_outline</span>
            <span>{language === 'en' ? 'Help & Support' : 'सहायता'}</span>
          </button>
          <button className="flex items-center text-neutral-700 hover:text-primary transition mt-3">
            <span className="material-icons mr-3">settings</span>
            <span>{language === 'en' ? 'Settings' : 'सेटिंग्स'}</span>
          </button>
        </div>
      </div>
    </aside>
  );
}
