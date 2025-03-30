// Law Categories
export const LAW_CATEGORIES = [
  { id: 'constitution', name: 'Constitution', nameHindi: 'संविधान', icon: 'menu_book' },
  { id: 'bns', name: 'Bharatiya Nyaya Sanhita', nameHindi: 'भारतीय न्याय संहिता', icon: 'library_books' }, 
  { id: 'criminal', name: 'Criminal Law', nameHindi: 'आपराधिक कानून', icon: 'gavel' },
  { id: 'civil', name: 'Civil Law', nameHindi: 'नागरिक कानून', icon: 'account_balance' },
  { id: 'corporate', name: 'Corporate Law', nameHindi: 'कॉर्पोरेट कानून', icon: 'business' },
  { id: 'property', name: 'Property Law', nameHindi: 'संपत्ति कानून', icon: 'home' },
  { id: 'family', name: 'Family Law', nameHindi: 'पारिवारिक कानून', icon: 'family_restroom' },
  { id: 'labor', name: 'Labor Law', nameHindi: 'श्रम कानून', icon: 'work' },
  { id: 'taxation', name: 'Taxation', nameHindi: 'कराधान', icon: 'receipt_long' },
  { id: 'environmental', name: 'Environmental', nameHindi: 'पर्यावरण', icon: 'park' }
];

// Navigation items
export const NAV_ITEMS = [
  { id: 'home', label: 'Home', labelHindi: 'होम', icon: 'home' },
  { id: 'history', label: 'History', labelHindi: 'इतिहास', icon: 'history' },
  { id: 'updates', label: 'Updates', labelHindi: 'अपडेट', icon: 'update' },
  { id: 'gemini', label: 'Gemini', labelHindi: 'जेमिनी', icon: 'auto_awesome' },
  { id: 'workbook', label: 'Workbook', labelHindi: 'कार्यपुस्तिका', icon: 'folder' },
];

// Default user
export const DEFAULT_USER_ID = 1;

// Popular Acts (for static display)
export const POPULAR_ACTS = [
  { 
    id: 'bns', 
    name: 'Bharatiya Nyaya Sanhita (BNS)', 
    nameHindi: 'भारतीय न्याय संहिता',
    icon: 'gavel',
    sections: [
      { id: 5, title: 'Section 103 - Punishment for murder', titleHindi: 'धारा 103 - हत्या के लिए दंड' },
      { id: 6, title: 'Section 104 - Culpable homicide not amounting to murder', titleHindi: 'धारा 104 - गैर-इरादतन हत्या के लिए दंड' },
      { id: 7, title: 'Section 63 - Punishment for sexual assault', titleHindi: 'धारा 63 - यौन हिंसा के लिए दंड' },
      { id: 8, title: 'Section 121 - Terrorist acts', titleHindi: 'धारा 121 - आतंकवादी कृत्य' }
    ]
  },
  { 
    id: 'bnss', 
    name: 'Bharatiya Nagarik Suraksha Sanhita (BNSS)', 
    nameHindi: 'भारतीय नागरिक सुरक्षा संहिता',
    icon: 'description',
    sections: [
      { id: 9, title: 'Section 91 - Video recording of search and seizure proceeding', titleHindi: 'धारा 91 - तलाशी और जब्ती कार्यवाही की वीडियो रिकॉर्डिंग' },
      { id: 11, title: 'Section 57 - Zero FIR', titleHindi: 'धारा 57 - जीरो एफआईआर' },
      { id: 12, title: 'Section 106 - Summons for electronic appearance', titleHindi: 'धारा 106 - इलेक्ट्रॉनिक उपस्थिति के लिए समन' },
      { id: 13, title: 'Section 272 - Witness protection scheme', titleHindi: 'धारा 272 - गवाह संरक्षण योजना' }
    ]
  },
  { 
    id: 'bsa', 
    name: 'Bharatiya Sakshya Adhiniyam (BSA)', 
    nameHindi: 'भारतीय साक्ष्य अधिनियम',
    icon: 'scale_balance',
    sections: [
      { id: 10, title: 'Section 33 - Electronic or digital record', titleHindi: 'धारा 33 - इलेक्ट्रॉनिक या डिजिटल रिकॉर्ड' },
      { id: 14, title: 'Section 45 - Opinion of experts', titleHindi: 'धारा 45 - विशेषज्ञों की राय' },
      { id: 15, title: 'Section 84 - Admissibility of DNA evidence', titleHindi: 'धारा 84 - डीएनए साक्ष्य की स्वीकार्यता' },
      { id: 16, title: 'Section 136 - Recording of evidence through video-conferencing', titleHindi: 'धारा 136 - वीडियो-कॉन्फ्रेंसिंग के माध्यम से साक्ष्य का अभिलेखन' }
    ]
  },
  { 
    id: 'constitution', 
    name: 'Constitution of India', 
    nameHindi: 'भारत का संविधान',
    icon: 'menu_book',
    sections: [
      { id: 4, title: 'Article 21 - Protection of life and personal liberty', titleHindi: 'अनुच्छेद 21 - जीवन और व्यक्तिगत स्वतंत्रता का संरक्षण' }
    ]
  }
];

// Grid Layout Options
export const GRID_LAYOUTS = [
  { id: 'comfortable', label: 'Comfortable', labelHindi: 'आरामदायक', cols: 'md:grid-cols-3', gap: 'gap-4' },
  { id: 'compact', label: 'Compact', labelHindi: 'सघन', cols: 'md:grid-cols-4', gap: 'gap-3' },
  { id: 'list', label: 'List View', labelHindi: 'सूची दृश्य', cols: 'md:grid-cols-1', gap: 'gap-2' }
];

// Legal Terms with Definitions (for tooltips)
export const LEGAL_TERMS = [
  { 
    term: 'Writ', 
    definition: 'A written court order directing a person to do or refrain from doing a specified act',
    definitionHindi: 'एक लिखित न्यायालय आदेश जो किसी व्यक्ति को एक निर्दिष्ट कार्य करने या न करने का निर्देश देता है' 
  },
  { 
    term: 'Suo motu', 
    definition: 'Action taken by a court of its own accord, without any request by the parties involved',
    definitionHindi: 'न्यायालय द्वारा अपने आप से की गई कार्रवाई, बिना संबंधित पक्षों के अनुरोध के' 
  },
  { 
    term: 'Ex parte', 
    definition: 'A legal proceeding brought by one person in the absence of and without representation or notification of other parties',
    definitionHindi: 'एक कानूनी कार्यवाही जो एक व्यक्ति द्वारा अन्य पक्षों की अनुपस्थिति में और बिना प्रतिनिधित्व या सूचना के लाई जाती है' 
  },
  { 
    term: 'Habeas corpus', 
    definition: 'A writ requiring a person under arrest to be brought before a judge or into court',
    definitionHindi: 'एक रिट जिसके तहत गिरफ्तार व्यक्ति को न्यायाधीश के सामने या अदालत में लाने की आवश्यकता होती है' 
  }
];
