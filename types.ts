
export enum GenerationStatus {
  IDLE = 'IDLE',
  RESEARCHING = 'RESEARCHING', // Gemini 3 Pro Thinking
  STRUCTURING = 'STRUCTURING', // Gemini Flash Lite
  DRAFTING = 'DRAFTING', // Gemini Flash / Pro
  DESIGNING = 'DESIGNING', // Imagen 4
  FINALIZING = 'FINALIZING',
  COMPLETED = 'COMPLETED',
  FAILED = 'FAILED'
}

export interface AssetChapter {
  title: string;
  content: string;
}

export interface BonusItem {
  title: string;
  description: string;
  icon: string;
  value: string;
}

export interface Workbook {
  title: string;
  description: string;
  icon: string;
  value: string;
  sections: string[];
}

export interface OTO {
  title: string;
  description: string;
  icon: string;
  price: string;
  originalPrice: string;
  bullets: string[];
}

export interface ValueStack {
  bonuses: BonusItem[];
  workbook: Workbook;
  oto: OTO;
}

export interface AssetPackage {
  id: string;
  keyword: string;
  title: string;
  subtitle: string;
  targetAudience: string;
  // Hormozi Offer Details
  painPoints: string[];
  dreamOutcome: string;
  coverImageBase64: string | null;
  coverImagePrompt: string;
  chapters: AssetChapter[];
  valueStack: ValueStack; // New complex structure
  createdAt: Date;
}

export interface User {
  id: string;
  email: string;
  credits: number;
}

export interface GenerationStep {
  id: number;
  label: string;
  status: 'pending' | 'active' | 'completed';
}

export type AspectRatio = '1:1' | '3:4' | '4:3' | '16:9' | '9:16';

export interface ImageEditRequest {
  image: string; // base64
  prompt: string;
  mimeType: string;
}
