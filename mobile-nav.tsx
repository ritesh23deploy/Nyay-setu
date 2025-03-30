import { NAV_ITEMS } from "@/lib/constants";
import { useLanguagePreference } from "@/lib/hooks";

interface MobileNavProps {
  activeTab: string;
  onTabChange: (tabId: string) => void;
}

export default function MobileNav({ activeTab, onTabChange }: MobileNavProps) {
  const { language } = useLanguagePreference();

  return (
    <nav className="MobileNav fixed bottom-0 inset-x-0 bg-white border-t z-10 shadow-[0_-2px_10px_rgba(0,0,0,0.05)]">
      <div className="flex justify-around py-1">
        {NAV_ITEMS.map(item => (
          <button 
            key={item.id}
            onClick={() => onTabChange(item.id)} 
            className={`flex flex-col items-center py-2 px-4 transition-all duration-200 rounded-lg ${
              activeTab === item.id 
                ? 'text-primary font-medium' 
                : 'text-gray-500'
            }`}
          >
            <div className={`p-1 rounded-full ${activeTab === item.id ? 'bg-primary/10' : ''}`}>
              <span className={`material-icons transform transition-transform duration-300 ${
                activeTab === item.id ? 'scale-110' : ''
              }`}>
                {item.icon}
              </span>
            </div>
            <span className="text-xs mt-1 font-medium">
              {language === 'en' ? item.label : item.labelHindi}
            </span>
          </button>
        ))}
      </div>
    </nav>
  );
}
