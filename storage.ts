import { 
  users, type User, type InsertUser,
  lawCategories, type LawCategory, type InsertLawCategory,
  acts, type Act, type InsertAct,
  sections, type Section, type InsertSection,
  updates, type Update, type InsertUpdate,
  history, type History, type InsertHistory,
  cases, type Case, type InsertCase,
  caseHearings, type CaseHearing, type InsertCaseHearing
} from "@shared/schema";

export interface IStorage {
  // User methods
  getUser(id: number): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;

  // Law Category methods
  getLawCategories(): Promise<LawCategory[]>;
  getLawCategory(id: number): Promise<LawCategory | undefined>;
  createLawCategory(category: InsertLawCategory): Promise<LawCategory>;

  // Act methods
  getActs(): Promise<Act[]>;
  getActsByCategoryId(categoryId: number): Promise<Act[]>;
  getAct(id: number): Promise<Act | undefined>;
  createAct(act: InsertAct): Promise<Act>;

  // Section methods
  getSections(): Promise<Section[]>;
  getSectionsByActId(actId: number): Promise<Section[]>;
  getSection(id: number): Promise<Section | undefined>;
  getSectionByActAndNumber(actId: number, number: string): Promise<Section | undefined>;
  searchSections(query: string): Promise<Section[]>;
  createSection(section: InsertSection): Promise<Section>;

  // Update methods
  getUpdates(): Promise<Update[]>;
  getUpdate(id: number): Promise<Update | undefined>;
  createUpdate(update: InsertUpdate): Promise<Update>;

  // History methods
  getUserHistory(userId: number): Promise<(History & { section: Section })[]>;
  addToHistory(history: InsertHistory): Promise<History>;
  
  // Case Workbook methods
  getCases(userId: number): Promise<Case[]>;
  getCase(id: number): Promise<Case | undefined>;
  createCase(caseData: InsertCase): Promise<Case>;
  updateCase(id: number, caseData: Partial<InsertCase>): Promise<Case>;
  deleteCase(id: number): Promise<boolean>;
  
  // Case Hearing methods
  getCaseHearings(caseId: number): Promise<CaseHearing[]>;
  getCaseHearing(id: number): Promise<CaseHearing | undefined>;
  createCaseHearing(hearingData: InsertCaseHearing): Promise<CaseHearing>;
  updateCaseHearing(id: number, hearingData: Partial<InsertCaseHearing>): Promise<CaseHearing>;
  deleteCaseHearing(id: number): Promise<boolean>;
}

export class MemStorage implements IStorage {
  private users: Map<number, User>;
  private lawCategories: Map<number, LawCategory>;
  private acts: Map<number, Act>;
  private sections: Map<number, Section>;
  private updates: Map<number, Update>;
  private history: Map<number, History>;
  private cases: Map<number, Case>;
  private caseHearings: Map<number, CaseHearing>;
  
  private userIdCounter: number;
  private categoryIdCounter: number;
  private actIdCounter: number;
  private sectionIdCounter: number;
  private updateIdCounter: number;
  private historyIdCounter: number;
  private caseIdCounter: number;
  private caseHearingIdCounter: number;

  constructor() {
    this.users = new Map();
    this.lawCategories = new Map();
    this.acts = new Map();
    this.sections = new Map();
    this.updates = new Map();
    this.history = new Map();
    this.cases = new Map();
    this.caseHearings = new Map();
    
    this.userIdCounter = 1;
    this.categoryIdCounter = 1;
    this.actIdCounter = 1;
    this.sectionIdCounter = 1;
    this.updateIdCounter = 1;
    this.historyIdCounter = 1;
    this.caseIdCounter = 1;
    this.caseHearingIdCounter = 1;

    this.seedData();
  }

  // User methods
  async getUser(id: number): Promise<User | undefined> {
    return this.users.get(id);
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    return Array.from(this.users.values()).find(
      (user) => user.username === username
    );
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const id = this.userIdCounter++;
    const user: User = { ...insertUser, id };
    this.users.set(id, user);
    return user;
  }

  // Law Category methods
  async getLawCategories(): Promise<LawCategory[]> {
    return Array.from(this.lawCategories.values());
  }

  async getLawCategory(id: number): Promise<LawCategory | undefined> {
    return this.lawCategories.get(id);
  }

  async createLawCategory(category: InsertLawCategory): Promise<LawCategory> {
    const id = this.categoryIdCounter++;
    const newCategory: LawCategory = { ...category, id };
    this.lawCategories.set(id, newCategory);
    return newCategory;
  }

  // Act methods
  async getActs(): Promise<Act[]> {
    return Array.from(this.acts.values());
  }

  async getActsByCategoryId(categoryId: number): Promise<Act[]> {
    return Array.from(this.acts.values()).filter(
      (act) => act.categoryId === categoryId
    );
  }

  async getAct(id: number): Promise<Act | undefined> {
    return this.acts.get(id);
  }

  async createAct(act: InsertAct): Promise<Act> {
    const id = this.actIdCounter++;
    const newAct: Act = { ...act, id };
    this.acts.set(id, newAct);
    return newAct;
  }

  // Section methods
  async getSections(): Promise<Section[]> {
    return Array.from(this.sections.values());
  }

  async getSectionsByActId(actId: number): Promise<Section[]> {
    return Array.from(this.sections.values()).filter(
      (section) => section.actId === actId
    );
  }

  async getSection(id: number): Promise<Section | undefined> {
    return this.sections.get(id);
  }

  async getSectionByActAndNumber(actId: number, number: string): Promise<Section | undefined> {
    return Array.from(this.sections.values()).find(
      (section) => section.actId === actId && section.number === number
    );
  }

  async searchSections(query: string): Promise<Section[]> {
    if (!query.trim()) return [];
    
    const lowercaseQuery = query.toLowerCase();
    return Array.from(this.sections.values()).filter((section) => {
      return (
        section.title.toLowerCase().includes(lowercaseQuery) ||
        section.titleHindi.toLowerCase().includes(lowercaseQuery) ||
        section.content.toLowerCase().includes(lowercaseQuery) ||
        section.contentHindi.toLowerCase().includes(lowercaseQuery) ||
        section.number.toLowerCase().includes(lowercaseQuery)
      );
    });
  }

  async createSection(section: InsertSection): Promise<Section> {
    const id = this.sectionIdCounter++;
    const newSection: Section = { ...section, id };
    this.sections.set(id, newSection);
    return newSection;
  }

  // Update methods
  async getUpdates(): Promise<Update[]> {
    return Array.from(this.updates.values()).sort((a, b) => 
      new Date(b.date).getTime() - new Date(a.date).getTime()
    );
  }

  async getUpdate(id: number): Promise<Update | undefined> {
    return this.updates.get(id);
  }

  async createUpdate(update: InsertUpdate): Promise<Update> {
    const id = this.updateIdCounter++;
    const newUpdate: Update = { ...update, id };
    this.updates.set(id, newUpdate);
    return newUpdate;
  }

  // History methods
  async getUserHistory(userId: number): Promise<(History & { section: Section })[]> {
    const userHistory = Array.from(this.history.values())
      .filter((h) => h.userId === userId)
      .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());

    return userHistory.map((h) => {
      const section = this.sections.get(h.sectionId);
      if (!section) {
        throw new Error(`Section with id ${h.sectionId} not found`);
      }
      return { ...h, section };
    });
  }

  async addToHistory(historyItem: InsertHistory): Promise<History> {
    const id = this.historyIdCounter++;
    const timestamp = new Date();
    const newHistory: History = { ...historyItem, id, timestamp };
    this.history.set(id, newHistory);
    return newHistory;
  }
  
  // Case Workbook methods
  async getCases(userId: number): Promise<Case[]> {
    return Array.from(this.cases.values())
      .filter(c => c.userId === userId)
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  }

  async getCase(id: number): Promise<Case | undefined> {
    return this.cases.get(id);
  }

  async createCase(caseData: InsertCase): Promise<Case> {
    const id = this.caseIdCounter++;
    const now = new Date();
    const newCase: Case = {
      ...caseData,
      id,
      createdAt: now,
      updatedAt: now,
      reminderDate: caseData.reminderDate || null,
      reminderSet: caseData.reminderSet || false,
      documents: caseData.documents || []
    };
    this.cases.set(id, newCase);
    return newCase;
  }

  async updateCase(id: number, caseData: Partial<InsertCase>): Promise<Case> {
    const existingCase = this.cases.get(id);
    if (!existingCase) {
      throw new Error(`Case with id ${id} not found`);
    }
    
    const updatedCase: Case = {
      ...existingCase,
      ...caseData,
      id,
      updatedAt: new Date()
    };
    
    this.cases.set(id, updatedCase);
    return updatedCase;
  }

  async deleteCase(id: number): Promise<boolean> {
    // Delete all hearings associated with this case
    const hearingsToDelete = Array.from(this.caseHearings.values())
      .filter(hearing => hearing.caseId === id);
      
    for (const hearing of hearingsToDelete) {
      this.caseHearings.delete(hearing.id);
    }
    
    // Delete the case
    return this.cases.delete(id);
  }
  
  // Case Hearing methods
  async getCaseHearings(caseId: number): Promise<CaseHearing[]> {
    return Array.from(this.caseHearings.values())
      .filter(hearing => hearing.caseId === caseId)
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  }

  async getCaseHearing(id: number): Promise<CaseHearing | undefined> {
    return this.caseHearings.get(id);
  }

  async createCaseHearing(hearingData: InsertCaseHearing): Promise<CaseHearing> {
    const id = this.caseHearingIdCounter++;
    const now = new Date();
    const newHearing: CaseHearing = {
      ...hearingData,
      id,
      createdAt: now
    };
    this.caseHearings.set(id, newHearing);
    
    // Update case with next hearing date
    const relatedCase = this.cases.get(hearingData.caseId);
    if (relatedCase) {
      const hearingDate = new Date(hearingData.date);
      
      // If this is a future hearing, update the case's next hearing date
      if (hearingDate > new Date()) {
        this.updateCase(relatedCase.id, {
          nextHearingDate: hearingDate
        });
      }
    }
    
    return newHearing;
  }

  async updateCaseHearing(id: number, hearingData: Partial<InsertCaseHearing>): Promise<CaseHearing> {
    const existingHearing = this.caseHearings.get(id);
    if (!existingHearing) {
      throw new Error(`Case hearing with id ${id} not found`);
    }
    
    const updatedHearing: CaseHearing = {
      ...existingHearing,
      ...hearingData,
      id
    };
    
    this.caseHearings.set(id, updatedHearing);
    return updatedHearing;
  }

  async deleteCaseHearing(id: number): Promise<boolean> {
    return this.caseHearings.delete(id);
  }

  // Seed data for testing
  private seedData() {
    // Seed categories
    const constitutionCategory = this.createLawCategory({
      name: "Constitution",
      nameHindi: "संविधान",
      icon: "menu_book",
      description: "The Constitution of India",
      descriptionHindi: "भारत का संविधान"
    });

    const criminalCategory = this.createLawCategory({
      name: "Criminal Law",
      nameHindi: "आपराधिक कानून",
      icon: "gavel",
      description: "Laws related to criminal offenses",
      descriptionHindi: "आपराधिक अपराधों से संबंधित कानून"
    });
    
    const bnsCategory = this.createLawCategory({
      name: "Bharatiya Nyaya Sanhita",
      nameHindi: "भारतीय न्याय संहिता",
      icon: "library_books",
      description: "The new criminal code replacing the Indian Penal Code",
      descriptionHindi: "भारतीय दंड संहिता को प्रतिस्थापित करने वाली नई आपराधिक संहिता"
    });

    const civilCategory = this.createLawCategory({
      name: "Civil Law",
      nameHindi: "नागरिक कानून",
      icon: "account_balance",
      description: "Laws related to civil matters",
      descriptionHindi: "नागरिक मामलों से संबंधित कानून"
    });

    const corporateCategory = this.createLawCategory({
      name: "Corporate Law",
      nameHindi: "कॉर्पोरेट कानून",
      icon: "business",
      description: "Laws related to businesses and corporations",
      descriptionHindi: "व्यवसायों और निगमों से संबंधित कानून"
    });

    const propertyCategory = this.createLawCategory({
      name: "Property Law",
      nameHindi: "संपत्ति कानून",
      icon: "home",
      description: "Laws related to property and real estate",
      descriptionHindi: "संपत्ति और रियल एस्टेट से संबंधित कानून"
    });

    const familyCategory = this.createLawCategory({
      name: "Family Law",
      nameHindi: "पारिवारिक कानून",
      icon: "family_restroom",
      description: "Laws related to family matters",
      descriptionHindi: "पारिवारिक मामलों से संबंधित कानून"
    });

    const laborCategory = this.createLawCategory({
      name: "Labor Law",
      nameHindi: "श्रम कानून",
      icon: "work",
      description: "Laws related to employment and labor",
      descriptionHindi: "रोजगार और श्रम से संबंधित कानून"
    });

    const taxationCategory = this.createLawCategory({
      name: "Taxation",
      nameHindi: "कराधान",
      icon: "receipt_long",
      description: "Laws related to taxation",
      descriptionHindi: "कराधान से संबंधित कानून"
    });

    const environmentalCategory = this.createLawCategory({
      name: "Environmental",
      nameHindi: "पर्यावरण",
      icon: "park",
      description: "Laws related to environmental protection",
      descriptionHindi: "पर्यावरण संरक्षण से संबंधित कानून"
    });

    // Seed acts
    const ipcAct = this.createAct({
      name: "Indian Penal Code",
      nameHindi: "भारतीय दंड संहिता",
      shortName: "IPC",
      categoryId: 2, // Criminal Law
      description: "The Indian Penal Code is the official criminal code of India.",
      descriptionHindi: "भारतीय दंड संहिता भारत की आधिकारिक आपराधिक संहिता है।",
      year: "1860"
    });

    const crpcAct = this.createAct({
      name: "Code of Criminal Procedure",
      nameHindi: "दंड प्रक्रिया संहिता",
      shortName: "CrPC",
      categoryId: 2, // Criminal Law
      description: "The main legislation on procedure for administration of criminal law in India.",
      descriptionHindi: "भारत में आपराधिक कानून के प्रशासन के लिए प्रक्रिया पर मुख्य कानून।",
      year: "1973"
    });

    const constitutionAct = this.createAct({
      name: "Constitution of India",
      nameHindi: "भारत का संविधान",
      shortName: "Constitution",
      categoryId: 1, // Constitution
      description: "The supreme law of India.",
      descriptionHindi: "भारत का सर्वोच्च कानून।",
      year: "1950"
    });
    
    const bnsAct = this.createAct({
      name: "Bharatiya Nyaya Sanhita",
      nameHindi: "भारतीय न्याय संहिता",
      shortName: "BNS",
      categoryId: 3, // BNS Category
      description: "The new criminal code of India replacing the Indian Penal Code, with 358 sections in 20 chapters.",
      descriptionHindi: "भारतीय दंड संहिता की जगह लेने वाली भारत की नई आपराधिक संहिता, जिसमें 20 अध्यायों में 358 धाराएं हैं।",
      year: "2023"
    });
    
    const bnssAct = this.createAct({
      name: "Bharatiya Nagarik Suraksha Sanhita",
      nameHindi: "भारतीय नागरिक सुरक्षा संहिता",
      shortName: "BNSS",
      categoryId: 3, // BNS Category
      description: "The new procedural law replacing the Code of Criminal Procedure (CrPC).",
      descriptionHindi: "दंड प्रक्रिया संहिता (CrPC) की जगह लेने वाली नई प्रक्रियात्मक कानून।",
      year: "2023"
    });
    
    const bsaAct = this.createAct({
      name: "Bharatiya Sakshya Adhiniyam",
      nameHindi: "भारतीय साक्ष्य अधिनियम",
      shortName: "BSA",
      categoryId: 3, // BNS Category
      description: "The new evidence law replacing the Indian Evidence Act of 1872.",
      descriptionHindi: "1872 के भारतीय साक्ष्य अधिनियम की जगह लेने वाला नया साक्ष्य कानून।",
      year: "2023"
    });

    // Seed sections
    const section302 = this.createSection({
      actId: 1, // IPC
      number: "302",
      title: "Punishment for murder",
      titleHindi: "हत्या के लिए दंड",
      content: "Whoever commits murder shall be punished with death, or imprisonment for life, and shall also be liable to fine.",
      contentHindi: "जो कोई हत्या करेगा, उसे मृत्युदंड, या आजीवन कारावास से दंडित किया जाएगा, और वह जुर्माने का भी दायी होगा।",
      interpretations: [
        "The Supreme Court has held that this section applies when the act is done with the intention of causing death or with the intention of causing such bodily injury as the offender knows to be likely to cause the death of the person.",
        "The punishment prescribed is death or imprisonment for life, and also fine."
      ],
      interpretationsHindi: [
        "सर्वोच्च न्यायालय ने माना है कि यह धारा तब लागू होती है जब कार्य मृत्यु का कारण बनने के इरादे से या ऐसी शारीरिक चोट पहुंचाने के इरादे से किया जाता है जिससे अपराधी जानता है कि व्यक्ति की मृत्यु होने की संभावना है।",
        "निर्धारित दंड मृत्युदंड या आजीवन कारावास, और जुर्माना भी है।"
      ],
      relatedSections: ["IPC Section 300", "IPC Section 304", "IPC Section 307"],
      amendments: ["No significant amendments since enactment"],
      caseReferences: [
        "Bachan Singh v. State of Punjab (1980)",
        "Machhi Singh v. State of Punjab (1983)"
      ]
    });

    const section304 = this.createSection({
      actId: 1, // IPC
      number: "304",
      title: "Punishment for culpable homicide not amounting to murder",
      titleHindi: "गैर-इरादतन हत्या के लिए दंड",
      content: "Whoever commits culpable homicide not amounting to murder shall be punished with imprisonment for life, or imprisonment of either description for a term which may extend to 10 years, and shall also be liable to fine.",
      contentHindi: "जो कोई गैर-इरादतन हत्या करेगा, उसे आजीवन कारावास, या किसी भी प्रकार के कारावास से दंडित किया जाएगा जिसकी अवधि 10 वर्ष तक बढ़ सकती है, और वह जुर्माने का भी दायी होगा।",
      interpretations: [
        "This section deals with culpable homicide not amounting to murder.",
        "The punishment is less severe than for murder under Section 302."
      ],
      interpretationsHindi: [
        "यह धारा गैर-इरादतन हत्या से संबंधित है।",
        "इसका दंड धारा 302 के तहत हत्या की तुलना में कम गंभीर है।"
      ],
      relatedSections: ["IPC Section 300", "IPC Section 302", "IPC Section 304A"],
      amendments: ["No significant amendments since enactment"],
      caseReferences: [
        "K.M. Nanavati v. State of Maharashtra (1962)",
        "State of Andhra Pradesh v. Rayavarapu Punnayya (1976)"
      ]
    });

    const section161 = this.createSection({
      actId: 2, // CrPC
      number: "161",
      title: "Examination of witnesses by police",
      titleHindi: "पुलिस द्वारा गवाहों की जांच",
      content: "Any police officer making an investigation may examine orally any person supposed to be acquainted with the facts and circumstances of the case.",
      contentHindi: "जांच करने वाला कोई भी पुलिस अधिकारी किसी भी व्यक्ति को मौखिक रूप से परीक्षण कर सकता है जो मामले के तथ्यों और परिस्थितियों से परिचित होने का अनुमान है।",
      interpretations: [
        "This section empowers police officers to examine witnesses during investigation.",
        "Statements recorded under this section cannot be used as evidence during trial."
      ],
      interpretationsHindi: [
        "यह धारा पुलिस अधिकारियों को जांच के दौरान गवाहों की परीक्षा करने का अधिकार देती है।",
        "इस धारा के तहत दर्ज किए गए बयानों का उपयोग परीक्षण के दौरान साक्ष्य के रूप में नहीं किया जा सकता है।"
      ],
      relatedSections: ["CrPC Section 162", "CrPC Section 164"],
      amendments: ["Amended in 2009 to include provisions for audio-video recording"],
      caseReferences: [
        "Tehseen Poonawalla v. Union of India (2018)",
        "Shafhi Mohammad v. State of Himachal Pradesh (2018)"
      ]
    });

    const article21 = this.createSection({
      actId: 3, // Constitution
      number: "21",
      title: "Protection of life and personal liberty",
      titleHindi: "जीवन और व्यक्तिगत स्वतंत्रता का संरक्षण",
      content: "No person shall be deprived of his life or personal liberty except according to procedure established by law.",
      contentHindi: "किसी व्यक्ति को उसके जीवन या व्यक्तिगत स्वतंत्रता से कानून द्वारा स्थापित प्रक्रिया के अनुसार ही वंचित किया जाएगा।",
      interpretations: [
        "Article 21 is considered to be the heart and soul of the Indian Constitution.",
        "The Supreme Court has expanded the scope of Article 21 to include right to privacy, right to clean environment, right to education, etc."
      ],
      interpretationsHindi: [
        "अनुच्छेद 21 को भारतीय संविधान का हृदय और आत्मा माना जाता है।",
        "सर्वोच्च न्यायालय ने अनुच्छेद 21 के दायरे को निजता के अधिकार, स्वच्छ पर्यावरण के अधिकार, शिक्षा के अधिकार आदि को शामिल करने के लिए विस्तारित किया है।"
      ],
      relatedSections: ["Article 14", "Article 19", "Article 22"],
      amendments: ["No direct amendments, but interpretation has evolved through judicial decisions"],
      caseReferences: [
        "Maneka Gandhi v. Union of India (1978)",
        "K.S. Puttaswamy v. Union of India (2017)"
      ]
    });
    
    // BNS Sections - New Criminal Code
    const bnsSection103 = this.createSection({
      actId: 4, // BNS Act
      number: "103",
      title: "Punishment for murder",
      titleHindi: "हत्या के लिए दंड",
      content: "Whoever commits murder shall be punished with death, or imprisonment for life, and shall also be liable to fine which may extend to ₹10 lakh.",
      contentHindi: "जो कोई हत्या करेगा, उसे मृत्युदंड, या आजीवन कारावास से दंडित किया जाएगा, और वह ₹10 लाख तक के जुर्माने का भी दायी होगा।",
      interpretations: [
        "Section 103 of BNS is the counterpart to Section 302 of the old IPC.",
        "The punishment now includes a specific upper limit on fine (₹10 lakh), which was not specified in the IPC."
      ],
      interpretationsHindi: [
        "BNS की धारा 103 पुरानी IPC की धारा 302 का समकक्ष है।",
        "अब सजा में जुर्माने की एक विशिष्ट ऊपरी सीमा (₹10 लाख) शामिल है, जो IPC में निर्दिष्ट नहीं थी।"
      ],
      relatedSections: ["BNS Section 102", "BNS Section 104", "IPC Section 302"],
      amendments: ["New section under Bharatiya Nyaya Sanhita, 2023"],
      caseReferences: []
    });
    
    const bnsSection104 = this.createSection({
      actId: 4, // BNS Act
      number: "104",
      title: "Punishment for culpable homicide not amounting to murder",
      titleHindi: "गैर-इरादतन हत्या के लिए दंड",
      content: "Whoever commits culpable homicide not amounting to murder shall be punished with imprisonment for life, or imprisonment for a term which may extend to 10 years, and shall also be liable to fine.",
      contentHindi: "जो कोई गैर-इरादतन हत्या करेगा, उसे आजीवन कारावास, या 10 वर्ष तक के कारावास से दंडित किया जाएगा, और वह जुर्माने का भी दायी होगा।",
      interpretations: [
        "Section 104 of BNS replaces Section 304 of the old IPC with similar provisions.",
        "The gradation of punishment remains similar to the old law."
      ],
      interpretationsHindi: [
        "BNS की धारा 104 समान प्रावधानों के साथ पुरानी IPC की धारा 304 को प्रतिस्थापित करती है।",
        "दंड का वर्गीकरण पुराने कानून के समान ही रहता है।"
      ],
      relatedSections: ["BNS Section 103", "BNS Section 105", "IPC Section 304"],
      amendments: ["New section under Bharatiya Nyaya Sanhita, 2023"],
      caseReferences: []
    });
    
    const bnsSection63 = this.createSection({
      actId: 4, // BNS Act
      number: "63",
      title: "Punishment for sexual assault",
      titleHindi: "यौन हिंसा के लिए दंड",
      content: "Whoever, with sexual intent, touches the vagina, penis, anus or breast of the person, or makes the person touch the vagina, penis, anus or breast of that person or any other person, or does any other act with sexual intent which involves physical contact without penetration is said to commit sexual assault. Whoever commits sexual assault shall be punished with imprisonment of either description for a term which may extend to five years, and shall also be liable to fine.",
      contentHindi: "जो कोई, यौन इरादे से, व्यक्ति की योनि, लिंग, गुदा या स्तन को छूता है, या व्यक्ति को उस व्यक्ति या किसी अन्य व्यक्ति की योनि, लिंग, गुदा या स्तन को छूने के लिए बनाता है, या यौन इरादे से कोई अन्य कार्य करता है जिसमें प्रवेश के बिना शारीरिक संपर्क शामिल है, वह यौन हिंसा करने वाला कहा जाता है। जो कोई यौन हिंसा करेगा, उसे किसी भी विवरण के कारावास से दंडित किया जाएगा, जिसकी अवधि पांच वर्ष तक हो सकती है, और वह जुर्माने का भी दायी होगा।",
      interpretations: [
        "Section 63 of BNS provides a more detailed definition of sexual assault compared to the old IPC.",
        "It specifically includes touching with sexual intent and other physical contact without penetration."
      ],
      interpretationsHindi: [
        "BNS की धारा 63 पुरानी IPC की तुलना में यौन हिंसा की अधिक विस्तृत परिभाषा प्रदान करती है।",
        "इसमें विशेष रूप से यौन इरादे से छूना और बिना प्रवेश के अन्य शारीरिक संपर्क शामिल हैं।"
      ],
      relatedSections: ["BNS Section 64", "BNS Section 65", "IPC Section 354"],
      amendments: ["New section under Bharatiya Nyaya Sanhita, 2023"],
      caseReferences: []
    });
    
    const bnsSection121 = this.createSection({
      actId: 4, // BNS Act
      number: "121",
      title: "Terrorist acts",
      titleHindi: "आतंकवादी कृत्य",
      content: "Whoever with intent to threaten or likely to threaten the unity, integrity, sovereignty, security, or economic security of India or with intent to strike terror or likely to strike terror in the people or any section of the people in India or in any foreign country, commits any act using bombs, dynamite, explosive substances, inflammable substances, firearms, other lethal weapons, poisonous chemicals, biological, radiological, nuclear material or any other substances of a hazardous nature likely to cause death or injury to persons or loss or damage to property or disruption of essential supplies or services, commits a terrorist act.",
      contentHindi: "जो कोई भारत की एकता, अखंडता, संप्रभुता, सुरक्षा, या आर्थिक सुरक्षा को धमकी देने या धमकी देने की संभावना के इरादे से या भारत या किसी विदेशी देश में लोगों या लोगों के किसी वर्ग में आतंक फैलाने या आतंक फैलाने की संभावना के इरादे से, बम, डायनामाइट, विस्फोटक पदार्थ, ज्वलनशील पदार्थ, आग्नेयास्त्र, अन्य घातक हथियार, जहरीले रसायन, जैविक, रेडियोलॉजिकल, परमाणु सामग्री या किसी अन्य खतरनाक प्रकृति के पदार्थों का उपयोग करके कोई कार्य करता है, जिससे व्यक्तियों की मृत्यु या चोट या संपत्ति की हानि या क्षति या आवश्यक आपूर्ति या सेवाओं में व्यवधान की संभावना होती है, वह आतंकवादी कृत्य करता है।",
      interpretations: [
        "Section 121 of BNS significantly expands the definition of terrorist acts compared to the old IPC.",
        "It now includes threats to economic security and acts causing disruption of essential supplies or services."
      ],
      interpretationsHindi: [
        "BNS की धारा 121 पुरानी IPC की तुलना में आतंकवादी कृत्यों की परिभाषा का काफी विस्तार करती है।",
        "अब इसमें आर्थिक सुरक्षा के लिए खतरे और आवश्यक आपूर्ति या सेवाओं में व्यवधान डालने वाले कृत्य शामिल हैं।"
      ],
      relatedSections: ["BNS Section 122", "BNS Section 123", "UAPA Sections"],
      amendments: ["New section under Bharatiya Nyaya Sanhita, 2023"],
      caseReferences: []
    });
    
    const bnssSection91 = this.createSection({
      actId: 5, // BNSS Act
      number: "91",
      title: "Video recording of search and seizure proceeding",
      titleHindi: "तलाशी और जब्ती कार्यवाही की वीडियो रिकॉर्डिंग",
      content: "The officer-in-charge of a police station or an officer not below the rank of a sub-inspector or officer in equivalent rank or any person authorized in this behalf, while conducting search and seizure under the provisions of this Sanhita shall mandatorily take a video recording of such proceeding, through electronic devices in the presence of one or more persons residing in the locality whose presence is appropriate, if available, to witness the proceeding. A copy of the video recording of such proceeding shall be shared with the owner or occupier of the premises so searched, as the case may be, in such manner as may be prescribed.",
      contentHindi: "पुलिस थाने का प्रभारी अधिकारी या उप-निरीक्षक से नीचे के रैंक का कोई अधिकारी या समकक्ष रैंक का अधिकारी या इस संबंध में अधिकृत कोई व्यक्ति, इस संहिता के प्रावधानों के तहत तलाशी और जब्ती करते समय, अनिवार्य रूप से इलेक्ट्रॉनिक उपकरणों के माध्यम से ऐसी कार्यवाही की वीडियो रिकॉर्डिंग करेगा, उस इलाके में रहने वाले एक या अधिक व्यक्तियों की उपस्थिति में, जिनकी उपस्थिति कार्यवाही का गवाह बनने के लिए उपयुक्त है, यदि उपलब्ध हो। ऐसी कार्यवाही की वीडियो रिकॉर्डिंग की एक प्रति मालिक या परिसर के कब्जेदार को, जैसा भी मामला हो, ऐसे तरीके से साझा की जाएगी जैसा कि निर्धारित किया जा सकता है।",
      interpretations: [
        "Section 91 of BNSS introduces mandatory video recording of search and seizure proceedings.",
        "This is a new provision aimed at ensuring transparency and accountability in police actions."
      ],
      interpretationsHindi: [
        "BNSS की धारा 91 तलाशी और जब्ती कार्यवाही की अनिवार्य वीडियो रिकॉर्डिंग की शुरुआत करती है।",
        "यह पुलिस कार्यों में पारदर्शिता और जवाबदेही सुनिश्चित करने के उद्देश्य से एक नया प्रावधान है।"
      ],
      relatedSections: ["BNSS Section 92", "BNSS Section 93", "CrPC Section 165"],
      amendments: ["New section under Bharatiya Nagarik Suraksha Sanhita, 2023"],
      caseReferences: []
    });
    
    const bnssSection57 = this.createSection({
      actId: 5, // BNSS Act
      number: "57",
      title: "Zero FIR",
      titleHindi: "जीरो एफआईआर",
      content: "The officer in charge of a police station shall, without any delay, register a First Information Report regarding cognizable offences, irrespective of the area where the offence is committed, and this First Information Report shall be called a 'Zero FIR' and shall be transferred forthwith to the police station within whose local jurisdiction the offence is committed.",
      contentHindi: "पुलिस थाने का प्रभारी अधिकारी, बिना किसी देरी के, संज्ञेय अपराधों के संबंध में प्रथम सूचना रिपोर्ट दर्ज करेगा, चाहे अपराध किसी भी क्षेत्र में किया गया हो, और इस प्रथम सूचना रिपोर्ट को 'जीरो एफआईआर' कहा जाएगा और तुरंत उस पुलिस थाने को स्थानांतरित कर दिया जाएगा जिसके स्थानीय अधिकार क्षेत्र में अपराध किया गया है।",
      interpretations: [
        "Section 57 of BNSS gives statutory recognition to Zero FIR concept.",
        "This ensures that victims can report crimes at any police station regardless of jurisdiction."
      ],
      interpretationsHindi: [
        "BNSS की धारा 57 जीरो एफआईआर अवधारणा को वैधानिक मान्यता देती है।",
        "यह सुनिश्चित करता है कि पीड़ित अधिकार क्षेत्र की परवाह किए बिना किसी भी पुलिस स्टेशन पर अपराध की रिपोर्ट कर सकते हैं।"
      ],
      relatedSections: ["BNSS Section 58", "BNSS Section 59", "CrPC Section 154"],
      amendments: ["New section under Bharatiya Nagarik Suraksha Sanhita, 2023"],
      caseReferences: ["Lalita Kumari v. Govt. of U.P. (2014)"]
    });
    
    const bnssSection106 = this.createSection({
      actId: 5, // BNSS Act
      number: "106", 
      title: "Summons for electronic appearance",
      titleHindi: "इलेक्ट्रॉनिक उपस्थिति के लिए समन",
      content: "Notwithstanding anything contained in this Sanhita or any other law for the time being in force, the Court may allow any person to appear before it through audio-video electronic means or any other electronic means, in such manner as may be prescribed.",
      contentHindi: "इस संहिता या अभी प्रचलित किसी अन्य कानून में निहित किसी भी बात के बावजूद, न्यायालय किसी भी व्यक्ति को ऑडियो-वीडियो इलेक्ट्रॉनिक माध्यम या किसी अन्य इलेक्ट्रॉनिक माध्यम के माध्यम से अपने सामने उपस्थित होने की अनुमति दे सकता है, जैसा कि निर्धारित किया जा सकता है।",
      interpretations: [
        "Section 106 of BNSS introduces provisions for virtual court appearances.",
        "This modernizes the criminal procedure to embrace technology and improves accessibility of justice."
      ],
      interpretationsHindi: [
        "BNSS की धारा 106 आभासी न्यायालय उपस्थिति के लिए प्रावधान प्रस्तुत करती है।",
        "यह आपराधिक प्रक्रिया को प्रौद्योगिकी अपनाने के लिए आधुनिक बनाता है और न्याय की पहुंच में सुधार करता है।"
      ],
      relatedSections: ["BNSS Section 107", "BNSS Section 108", "IT Act Provisions"],
      amendments: ["New section under Bharatiya Nagarik Suraksha Sanhita, 2023"],
      caseReferences: []
    });
    
    const bnssSection272 = this.createSection({
      actId: 5, // BNSS Act
      number: "272",
      title: "Witness protection scheme",
      titleHindi: "गवाह संरक्षण योजना",
      content: "The State Government shall implement a witness protection scheme for the protection of witnesses and their family members, which may provide for the following, namely:— (a) protection of identity of witnesses; (b) protection to witnesses from threats; (c) change of identity of witnesses; (d) confidentiality and protection of witnesses in legal proceedings; (e) any other protection measures as may be necessary.",
      contentHindi: "राज्य सरकार गवाहों और उनके परिवार के सदस्यों की सुरक्षा के लिए एक गवाह संरक्षण योजना लागू करेगी, जिसमें निम्नलिखित प्रावधान हो सकते हैं, अर्थात्:— (क) गवाहों की पहचान की सुरक्षा; (ख) धमकियों से गवाहों की सुरक्षा; (ग) गवाहों की पहचान में बदलाव; (घ) कानूनी कार्यवाही में गवाहों की गोपनीयता और सुरक्षा; (ङ) कोई अन्य सुरक्षा उपाय जो आवश्यक हो सकते हैं।",
      interpretations: [
        "Section 272 of BNSS statutorily recognizes the witness protection scheme.",
        "This addresses a major gap in the criminal justice system regarding witness safety and testimony reliability."
      ],
      interpretationsHindi: [
        "BNSS की धारा 272 गवाह संरक्षण योजना को वैधानिक मान्यता देती है।",
        "यह गवाह सुरक्षा और गवाही की विश्वसनीयता के संबंध में आपराधिक न्याय प्रणाली में एक प्रमुख अंतर को संबोधित करता है।"
      ],
      relatedSections: ["BNSS Section 273", "BNSS Section 274", "Supreme Court Guidelines on Witness Protection"],
      amendments: ["New section under Bharatiya Nagarik Suraksha Sanhita, 2023"],
      caseReferences: ["Mahender Chawla & Ors v. Union of India & Ors (2018)"]
    });
    
    const bsaSection33 = this.createSection({
      actId: 6, // BSA Act
      number: "33",
      title: "Electronic or digital record",
      titleHindi: "इलेक्ट्रॉनिक या डिजिटल रिकॉर्ड",
      content: "In case of electronic or digital records, in addition to other requirements under this Adhiniyam, the genuineness, truthfulness and reliability of such record shall also be considered.",
      contentHindi: "इलेक्ट्रॉनिक या डिजिटल रिकॉर्ड के मामले में, इस अधिनियम के तहत अन्य आवश्यकताओं के अतिरिक्त, ऐसे रिकॉर्ड की वास्तविकता, सत्यता और विश्वसनीयता पर भी विचार किया जाएगा।",
      interpretations: [
        "Section 33 of BSA specifically deals with electronic or digital records as evidence.",
        "It adds additional criteria for admissibility compared to the old Indian Evidence Act."
      ],
      interpretationsHindi: [
        "BSA की धारा 33 विशेष रूप से साक्ष्य के रूप में इलेक्ट्रॉनिक या डिजिटल रिकॉर्ड से संबंधित है।",
        "यह पुराने भारतीय साक्ष्य अधिनियम की तुलना में स्वीकार्यता के लिए अतिरिक्त मानदंड जोड़ता है।"
      ],
      relatedSections: ["BSA Section 34", "BSA Section 35", "Indian Evidence Act Section 65B"],
      amendments: ["New section under Bharatiya Sakshya Adhiniyam, 2023"],
      caseReferences: []
    });
    
    const bsaSection45 = this.createSection({
      actId: 6, // BSA Act
      number: "45",
      title: "Opinion of experts",
      titleHindi: "विशेषज्ञों की राय",
      content: "When the Court has to form an opinion upon a point of foreign law or of science or art, or as to identity of handwriting or finger impressions or any other identification marks, the opinions upon that point of persons specially skilled in such foreign law, science or art, or in questions as to identity of handwriting or finger impressions or other identification marks, are relevant facts. Such persons are called experts.",
      contentHindi: "जब न्यायालय को विदेशी कानून या विज्ञान या कला के किसी बिंदु पर, या हस्ताक्षर या अंगुली के निशान या किसी अन्य पहचान चिह्नों की पहचान के संबंध में राय बनानी होती है, तो उस बिंदु पर ऐसे विदेशी कानून, विज्ञान या कला में, या हस्ताक्षर या अंगुली के निशान या अन्य पहचान चिह्नों की पहचान के संबंध में विशेष रूप से कुशल व्यक्तियों की रायें प्रासंगिक तथ्य हैं। ऐसे व्यक्तियों को विशेषज्ञ कहा जाता है।",
      interpretations: [
        "Section 45 of BSA modernizes the concept of expert testimony.",
        "It expands the scope to include new forms of identification marks and scientific evidence."
      ],
      interpretationsHindi: [
        "BSA की धारा 45 विशेषज्ञ गवाही की अवधारणा को आधुनिक बनाती है।",
        "यह दायरे को नए प्रकार के पहचान चिह्नों और वैज्ञानिक साक्ष्यों को शामिल करने के लिए विस्तारित करती है।"
      ],
      relatedSections: ["BSA Section 46", "BSA Section 47", "Indian Evidence Act Sections on Expert Testimony"],
      amendments: ["New section under Bharatiya Sakshya Adhiniyam, 2023"],
      caseReferences: ["Daubert v. Merrell Dow Pharmaceuticals (1993) - International reference"]
    });
    
    const bsaSection84 = this.createSection({
      actId: 6, // BSA Act
      number: "84",
      title: "Admissibility of DNA evidence",
      titleHindi: "डीएनए साक्ष्य की स्वीकार्यता",
      content: "In any proceeding, the report of a DNA profiling expert shall be relevant, if the Court is satisfied that— (a) the biological material was collected, stored and tested according to the specified protocol; (b) the specified laboratory where the DNA was tested is a certified laboratory; and (c) the DNA profile is prepared in accordance with the specified protocol.",
      contentHindi: "किसी भी कार्यवाही में, डीएनए प्रोफाइलिंग विशेषज्ञ की रिपोर्ट प्रासंगिक होगी, यदि न्यायालय संतुष्ट है कि— (क) जैविक सामग्री निर्दिष्ट प्रोटोकॉल के अनुसार एकत्र, संग्रहीत और परीक्षण की गई थी; (ख) निर्दिष्ट प्रयोगशाला जहां डीएनए का परीक्षण किया गया था, एक प्रमाणित प्रयोगशाला है; और (ग) डीएनए प्रोफाइल निर्दिष्ट प्रोटोकॉल के अनुसार तैयार किया गया है।",
      interpretations: [
        "Section 84 of BSA provides clear guidelines for the admissibility of DNA evidence.",
        "This is a significant advancement in forensic evidence standards in Indian legal proceedings."
      ],
      interpretationsHindi: [
        "BSA की धारा 84 डीएनए साक्ष्य की स्वीकार्यता के लिए स्पष्ट दिशानिर्देश प्रदान करती है।",
        "यह भारतीय कानूनी कार्यवाहियों में फोरेंसिक साक्ष्य मानकों में एक महत्वपूर्ण प्रगति है।"
      ],
      relatedSections: ["BSA Section 85", "BSA Section 86", "DNA Technology Regulation Act Provisions"],
      amendments: ["New section under Bharatiya Sakshya Adhiniyam, 2023"],
      caseReferences: ["State of Himachal Pradesh v. Jai Lal (2021)"]
    });
    
    const bsaSection136 = this.createSection({
      actId: 6, // BSA Act
      number: "136",
      title: "Recording of evidence through video-conferencing",
      titleHindi: "वीडियो-कॉन्फ्रेंसिंग के माध्यम से साक्ष्य का अभिलेखन",
      content: "The evidence of a person may be recorded through video-conferencing in such manner as may be prescribed. For the purposes of this section, 'video-conferencing' means audio-visual electronic communication facility under which persons at different locations are able to communicate with each other in real-time.",
      contentHindi: "किसी व्यक्ति के साक्ष्य को वीडियो-कॉन्फ्रेंसिंग के माध्यम से ऐसे तरीके से अभिलेखित किया जा सकता है जैसा कि निर्धारित किया जा सकता है। इस धारा के प्रयोजनों के लिए, 'वीडियो-कॉन्फ्रेंसिंग' का अर्थ ऑडियो-विजुअल इलेक्ट्रॉनिक संचार सुविधा है, जिसके तहत विभिन्न स्थानों पर व्यक्ति वास्तविक समय में एक-दूसरे के साथ संवाद करने में सक्षम होते हैं।",
      interpretations: [
        "Section 136 of BSA formalizes the use of video conferencing for evidence recording.",
        "This provision accommodates technological advancements in judicial proceedings."
      ],
      interpretationsHindi: [
        "BSA की धारा 136 साक्ष्य अभिलेखन के लिए वीडियो कॉन्फ्रेंसिंग के उपयोग को औपचारिक बनाती है।",
        "यह प्रावधान न्यायिक कार्यवाहियों में तकनीकी प्रगति को समायोजित करता है।"
      ],
      relatedSections: ["BSA Section 137", "BSA Section 138", "IT Act Provisions on Electronic Communication"],
      amendments: ["New section under Bharatiya Sakshya Adhiniyam, 2023"],
      caseReferences: ["State of Maharashtra v. Praful Desai (2003)"]
    });

    // Seed updates
    this.createUpdate({
      title: "Bharatiya Nyaya Sanhita (BNS) 2023 Implementation",
      titleHindi: "भारतीय न्याय संहिता (बीएनएस) 2023 का कार्यान्वयन",
      description: "The new Bharatiya Nyaya Sanhita has replaced the Indian Penal Code (IPC), bringing significant changes to criminal law in India.",
      descriptionHindi: "नई भारतीय न्याय संहिता ने भारतीय दंड संहिता (आईपीसी) को प्रतिस्थापित किया है, जिससे भारत में आपराधिक कानून में महत्वपूर्ण बदलाव आए हैं।",
      date: new Date("2025-03-01"),
      link: "https://example.com/bns-implementation"
    });
    
    this.createUpdate({
      title: "Bharatiya Nagarik Suraksha Sanhita (BNSS) in effect",
      titleHindi: "भारतीय नागरिक सुरक्षा संहिता (बीएनएसएस) लागू",
      description: "The BNSS replaces the Criminal Procedure Code (CrPC) and introduces major reforms including mandatory recording of search proceedings and Zero FIR provisions.",
      descriptionHindi: "बीएनएसएस ने दंड प्रक्रिया संहिता (सीआरपीसी) को प्रतिस्थापित किया है और तलाशी कार्यवाही की अनिवार्य रिकॉर्डिंग और जीरो एफआईआर प्रावधानों सहित प्रमुख सुधारों की शुरुआत की है।",
      date: new Date("2025-02-15"),
      link: "https://example.com/bnss-implementation"
    });
    
    this.createUpdate({
      title: "Bharatiya Sakshya Adhiniyam (BSA) enacted",
      titleHindi: "भारतीय साक्ष्य अधिनियम (बीएसए) अधिनियमित",
      description: "The BSA replaces the Indian Evidence Act of 1872 with modern provisions for electronic evidence, DNA testing and remote testimony.",
      descriptionHindi: "बीएसए ने 1872 के भारतीय साक्ष्य अधिनियम को इलेक्ट्रॉनिक साक्ष्य, डीएनए परीक्षण और दूरस्थ गवाही के लिए आधुनिक प्रावधानों के साथ प्रतिस्थापित किया है।",
      date: new Date("2025-02-01"),
      link: "https://example.com/bsa-implementation"
    });
    
    this.createUpdate({
      title: "New Amendment to IT Act 2000",
      titleHindi: "आईटी अधिनियम 2000 में नया संशोधन",
      description: "Changes in regulations regarding data privacy and protection.",
      descriptionHindi: "डेटा गोपनीयता और सुरक्षा के संबंध में नियमों में परिवर्तन।",
      date: new Date("2023-07-24"),
      link: "https://example.com/it-act-amendment"
    });

    this.createUpdate({
      title: "Supreme Court Ruling on Section 497",
      titleHindi: "धारा 497 पर सर्वोच्च न्यायालय का फैसला",
      description: "Major interpretation update on adultery laws.",
      descriptionHindi: "व्यभिचार कानूनों पर प्रमुख व्याख्या अपडेट।",
      date: new Date("2023-07-22"),
      link: "https://example.com/sc-section-497"
    });

    this.createUpdate({
      title: "Ministry of Law Circular",
      titleHindi: "कानून मंत्रालय का परिपत्र",
      description: "Guidelines for implementation of new corporate governance rules.",
      descriptionHindi: "नए कॉर्पोरेट गवर्नेंस नियमों के कार्यान्वयन के लिए दिशानिर्देश।",
      date: new Date("2023-07-20"),
      link: "https://example.com/law-ministry-circular"
    });

    // Create a demo user
    this.createUser({
      username: "demo",
      password: "password"
    });

    // Add some history for demo user
    this.addToHistory({
      userId: 1,
      sectionId: 1
    });

    this.addToHistory({
      userId: 1,
      sectionId: 3
    });

    this.addToHistory({
      userId: 1,
      sectionId: 4
    });
  }
}

export const storage = new MemStorage();
