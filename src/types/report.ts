
export interface Report {
  id: string;
  title: string;
  description: string;
  location: string;
  date: Date | string;
  status: ReportStatus;
  evidenceUrls?: string[];
  userId: string;
  crimeType?: string;
  aiAnalysisResults?: AiAnalysisResult;
}

export type ReportStatus = 
  | 'submitted'
  | 'under_review'
  | 'investigating'
  | 'resolved'
  | 'closed'
  | 'rejected';

export interface AiAnalysisResult {
  crimeType?: string;
  confidence?: number;
  description?: string;
  objects?: DetectedObject[];
  persons?: DetectedPerson[];
}

export interface DetectedObject {
  name: string;
  confidence: number;
  boundingBox?: BoundingBox;
}

export interface DetectedPerson {
  id: string;
  confidence: number;
  boundingBox?: BoundingBox;
  age?: number;
  gender?: string;
  clothing?: string[];
}

export interface BoundingBox {
  x: number;
  y: number;
  width: number;
  height: number;
}
