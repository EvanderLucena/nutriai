export interface ExtractionItem {
  name: string;
  kcal: number;
  prot: number;
  carb: number;
  fat: number;
  grams: number | null;
  sortOrder: number;
}

export interface Extraction {
  id: string;
  mealLabel: string;
  extractionRaw: string;
  items: ExtractionItem[];
  totalKcal: number;
  totalProt: number;
  totalCarb: number;
  totalFat: number;
  extractedAt: string;
}

export interface ActivationLink {
  link: string;
  phone: string;
  isActivated: boolean;
}

export interface WhatsAppStatus {
  connected: boolean;
  extractionsToday: number;
  activePatientsCount: number;
  lastWebhookAt: string | null;
}

export interface PatchExtractionPayload {
  items: Array<{
    name: string;
    kcal: number;
    prot: number;
    carb: number;
    fat: number;
    grams?: number | null;
  }>;
}
