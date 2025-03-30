import { Section } from '@shared/schema';
import { formatRelativeTime } from '@/lib/data-utils';
import { useLanguagePreference } from '@/lib/hooks';

interface SectionCardProps {
  section: Section;
  category?: string;
  timestamp?: Date | string;
  onClick: (id: number) => void;
}

export default function SectionCard({ section, category, timestamp, onClick }: SectionCardProps) {
  const { language } = useLanguagePreference();
  
  return (
    <div 
      className="bg-white rounded-lg shadow-md p-4 hover:shadow-lg transition cursor-pointer"
      onClick={() => onClick(section.id)}
    >
      <div className="flex justify-between">
        <div>
          <h3 className="font-medium">
            {language === 'en' 
              ? `Section ${section.number} - ${section.title}`
              : `धारा ${section.number} - ${section.titleHindi}`
            }
          </h3>
          {category && (
            <span className="text-xs bg-neutral-100 text-neutral-600 px-2 py-0.5 rounded-full mt-1 inline-block">
              {category}
            </span>
          )}
        </div>
        {timestamp && (
          <span className="text-sm text-neutral-500">
            {formatRelativeTime(timestamp)}
          </span>
        )}
      </div>
    </div>
  );
}
