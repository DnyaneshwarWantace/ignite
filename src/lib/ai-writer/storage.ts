// LocalStorage fallback for when Supabase is not configured

export interface DNA {
  id: string;
  name: string;
  is_default: boolean;
  created_at: string;
  updated_at: string;
}

export interface DNASection {
  id: string;
  dna_id: string;
  section_id: string;
  content: string;
  completed: boolean;
  last_edit?: string;
}

// DNA Storage
export const dnaStorage = {
  getAll: (): DNA[] => {
    if (typeof window === 'undefined') return [];
    const stored = localStorage.getItem('dnas');
    return stored ? JSON.parse(stored) : [];
  },

  getById: (id: string): DNA | null => {
    const dnas = dnaStorage.getAll();
    return dnas.find(d => d.id === id) || null;
  },

  create: (dna: Omit<DNA, 'id' | 'created_at' | 'updated_at'>): DNA => {
    const newDNA: DNA = {
      ...dna,
      id: `dna-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };
    const dnas = dnaStorage.getAll();
    dnas.push(newDNA);
    localStorage.setItem('dnas', JSON.stringify(dnas));
    return newDNA;
  },

  update: (id: string, updates: Partial<DNA>): void => {
    const dnas = dnaStorage.getAll();
    const index = dnas.findIndex(d => d.id === id);
    if (index !== -1) {
      dnas[index] = {
        ...dnas[index],
        ...updates,
        updated_at: new Date().toISOString(),
      };
      localStorage.setItem('dnas', JSON.stringify(dnas));
    }
  },

  delete: (id: string): void => {
    const dnas = dnaStorage.getAll();
    const filtered = dnas.filter(d => d.id !== id);
    localStorage.setItem('dnas', JSON.stringify(filtered));
    // Also delete all sections for this DNA
    dnaSectionStorage.deleteByDnaId(id);
  },
};

// DNA Section Storage
export const dnaSectionStorage = {
  getByDnaId: (dnaId: string): DNASection[] => {
    if (typeof window === 'undefined') return [];
    const stored = localStorage.getItem(`dna-sections-${dnaId}`);
    return stored ? JSON.parse(stored) : [];
  },

  getByDnaIdAndSectionId: (dnaId: string, sectionId: string): DNASection | null => {
    const sections = dnaSectionStorage.getByDnaId(dnaId);
    return sections.find(s => s.section_id === sectionId) || null;
  },

  upsert: (dnaId: string, sectionId: string, data: Partial<DNASection>): DNASection => {
    const sections = dnaSectionStorage.getByDnaId(dnaId);
    const existing = sections.find(s => s.section_id === sectionId);

    const sectionData: DNASection = {
      id: existing?.id || `section-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      dna_id: dnaId,
      section_id: sectionId,
      content: data.content || '',
      completed: data.completed || false,
      last_edit: data.last_edit || new Date().toISOString(),
      ...data,
    };

    if (existing) {
      const index = sections.findIndex(s => s.section_id === sectionId);
      sections[index] = sectionData;
    } else {
      sections.push(sectionData);
    }

    localStorage.setItem(`dna-sections-${dnaId}`, JSON.stringify(sections));
    return sectionData;
  },

  deleteByDnaId: (dnaId: string): void => {
    localStorage.removeItem(`dna-sections-${dnaId}`);
  },
};

// DocOS Storage
export interface DocOSDocument {
  id: string;
  title: string;
  content: string;
  agentId?: string;
  agentName?: string;
  dnaId?: string;
  created_at: string;
  updated_at: string;
}

export const docOSStorage = {
  getAll: (): DocOSDocument[] => {
    if (typeof window === 'undefined') return [];
    const stored = localStorage.getItem('docos-documents');
    return stored ? JSON.parse(stored) : [];
  },

  getById: (id: string): DocOSDocument | null => {
    const docs = docOSStorage.getAll();
    return docs.find(d => d.id === id) || null;
  },

  create: (doc: Omit<DocOSDocument, 'id' | 'created_at' | 'updated_at'>): DocOSDocument => {
    const newDoc: DocOSDocument = {
      ...doc,
      id: `doc-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };
    const docs = docOSStorage.getAll();
    docs.push(newDoc);
    localStorage.setItem('docos-documents', JSON.stringify(docs));
    return newDoc;
  },

  update: (id: string, updates: Partial<DocOSDocument>): void => {
    const docs = docOSStorage.getAll();
    const index = docs.findIndex(d => d.id === id);
    if (index !== -1) {
      docs[index] = {
        ...docs[index],
        ...updates,
        updated_at: new Date().toISOString(),
      };
      localStorage.setItem('docos-documents', JSON.stringify(docs));
    }
  },

  delete: (id: string): void => {
    const docs = docOSStorage.getAll();
    const filtered = docs.filter(d => d.id !== id);
    localStorage.setItem('docos-documents', JSON.stringify(filtered));
  },
};

