import { format, formatDistanceToNow } from 'date-fns';
import { Section, LawCategory, Act, Update } from '@shared/schema';
import { apiRequest } from './queryClient';

// Format date for display
export function formatDate(date: Date | string): string {
  if (!date) return '';
  const dateObj = typeof date === 'string' ? new Date(date) : date;
  return format(dateObj, 'MMMM d, yyyy');
}

// Format date as relative time
export function formatRelativeTime(date: Date | string): string {
  if (!date) return '';
  const dateObj = typeof date === 'string' ? new Date(date) : date;
  return formatDistanceToNow(dateObj, { addSuffix: true });
}

// Helper to create a search result object from a section
export function createSearchResult(section: Section, act?: Act) {
  return {
    id: section.id,
    title: `${act?.shortName || ''} Section ${section.number}`,
    snippet: section.title,
    category: act?.name || 'Law Section',
  };
}

// Format section display title
export function formatSectionTitle(section: Section, act?: Act): string {
  if (!section) return '';
  if (act) {
    return `${act.shortName} Section ${section.number} - ${section.title}`;
  }
  return `Section ${section.number} - ${section.title}`;
}

// Add a section to user history
export async function addToHistory(userId: number, sectionId: number): Promise<void> {
  try {
    await apiRequest('POST', '/api/history', { userId, sectionId });
  } catch (error) {
    console.error('Failed to add to history:', error);
  }
}

// Helper to get icon component from icon name
export function getIconForCategory(categoryName: string): string {
  // Map category names to material icons
  const iconMap: Record<string, string> = {
    'Constitution': 'menu_book',
    'Criminal Law': 'gavel',
    'Civil Law': 'account_balance',
    'Corporate Law': 'business',
    'Property Law': 'home',
    'Family Law': 'family_restroom',
    'Labor Law': 'work',
    'Taxation': 'receipt_long',
    'Environmental': 'park',
    // Default icon for unknown categories
    'default': 'description'
  };

  return iconMap[categoryName] || iconMap.default;
}
