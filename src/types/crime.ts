
export interface WantedIndividual {
  id: string;
  name: string;
  age: number;
  description: string;
  imageUrl: string;
  crimeDescription: string;
  lastSeenLocation?: string;
  lastSeenDate?: Date | string;
  status: 'wanted' | 'found' | 'inactive';
  dangerLevel: 'low' | 'medium' | 'high';
}

export interface CrimeTip {
  id: string;
  userId: string;
  subject: string;
  description: string;
  location?: string;
  date?: Date | string;
  imageUrls?: string[];
  status: 'submitted' | 'under_review' | 'verified' | 'rejected';
  anonymous: boolean;
}

export interface Advisory {
  id: string;
  title: string;
  description: string;
  area: string;
  date: Date | string;
  severity: 'low' | 'medium' | 'high' | 'urgent';
  category: 'traffic' | 'safety' | 'weather' | 'crime' | 'other';
  imageUrl?: string;
}
