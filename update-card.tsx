import { Update } from '@shared/schema';
import { formatDate } from '@/lib/data-utils';
import { useLanguagePreference } from '@/lib/hooks';

interface UpdateCardProps {
  update: Update;
  onClick?: () => void;
}

export default function UpdateCard({ update, onClick }: UpdateCardProps) {
  const { language } = useLanguagePreference();
  
  return (
    <div className="bg-white rounded-lg shadow-md p-5">
      <span className="text-sm text-neutral-500">{formatDate(update.date)}</span>
      <h3 className="font-medium mt-1">
        {language === 'en' ? update.title : update.titleHindi}
      </h3>
      <p className="text-neutral-600 mt-2 text-sm">
        {language === 'en' ? update.description : update.descriptionHindi}
      </p>
      {update.link && (
        <button
          className="text-primary hover:text-primary-dark text-sm mt-3 flex items-center"
          onClick={() => {
            // If onClick handler is provided, use it
            if (onClick) {
              onClick();
            } else if (update.link) {
              // Create a proper detail page for this update
              const updateDetail = document.createElement('div');
              updateDetail.innerHTML = `
                <h2>${language === 'en' ? update.title : update.titleHindi}</h2>
                <p class="text-sm text-neutral-500">${new Date(update.date).toLocaleDateString()}</p>
                <div class="mt-4">
                  ${language === 'en' ? 
                    (update.description) : 
                    (update.descriptionHindi)}
                </div>
                ${update.link ? `<p class="mt-4"><a href="${update.link}" target="_blank" rel="noopener noreferrer" class="text-primary">Source</a></p>` : ''}
              `;
              
              // Show a modal or navigate to detail page
              const modal = document.createElement('div');
              modal.className = 'fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4';
              
              const modalContent = document.createElement('div');
              modalContent.className = 'bg-white rounded-lg p-6 max-w-2xl w-full max-h-[80vh] overflow-y-auto';
              modalContent.appendChild(updateDetail);
              
              const closeButton = document.createElement('button');
              closeButton.className = 'absolute top-4 right-4 text-neutral-500 hover:text-neutral-700';
              closeButton.innerHTML = '<span class="material-icons">close</span>';
              closeButton.onclick = () => document.body.removeChild(modal);
              
              modalContent.appendChild(closeButton);
              modal.appendChild(modalContent);
              document.body.appendChild(modal);
            }
          }}
        >
          <span>{language === 'en' ? 'Read more' : 'और पढ़ें'}</span>
          <span className="material-icons text-sm ml-1">arrow_forward</span>
        </button>
      )}
    </div>
  );
}
