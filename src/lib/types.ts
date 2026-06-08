export type RegionType = "EU" | "Bulgaria" | "International";
export type ProgramStatus = "open" | "upcoming" | "closed" | "rolling";
export type Difficulty = "Low" | "Medium" | "High" | "Very high";

export type Program = {
  id: string;
  title: string;
  provider: string;
  geography: string;
  regionType: RegionType;
  fundingType: string[];
  amount: string;
  maxFundingEur: number | null;
  deadline: string | null;
  status: ProgramStatus;
  startupStages: string[];
  sectors: string[];
  difficulty: Difficulty;
  eligibilitySummary: string;
  description: string;
  whoCanApply: string[];
  whoCannotApply: string[];
  eligibleCosts: string[];
  requiredDocuments: string[];
  evaluationCriteria: string[];
  applicationFocus: string[];
  officialUrl: string;
  sourceId: string;
  sourceNotes: string;
  lastChecked: string;
};

export type SourceStatus = {
  id: string;
  name: string;
  url: string;
  method: string;
  lastChecked: string;
  status: "ok" | "failed" | "seeded";
  newPrograms: number;
  lastError: string;
  notes: string;
};

export type FounderProfile = {
  companyCountry: "Bulgaria" | "EU" | "Horizon associated" | "Non-EU" | "";
  isSme: "yes" | "no" | "unknown" | "";
  sector: string;
  stage: "Idea" | "Prototype" | "MVP" | "Early revenue" | "Scaleup" | "R&D" | "";
  hasRevenue: "none" | "some" | "growth" | "unknown" | "";
  hasPrototype: "yes" | "no" | "unknown" | "";
  ownsIp: "yes" | "licensed" | "no" | "unknown" | "";
  fundingNeed: "grant" | "equity" | "both" | "support" | "";
  applicationMode: "alone" | "partners" | "unknown" | "";
  previousEuFunding: "yes" | "no" | "unknown" | "";
  projectType: "R&D" | "Commercialisation" | "Digitalisation" | "Market expansion" | "Administrative support" | "";
  projectDescription: string;
};

export type EligibilityStatus = "eligible" | "possibly eligible" | "not eligible" | "missing information";

export type EligibilityResult = {
  status: EligibilityStatus;
  score: number;
  reasons: string[];
  risks: string[];
  missing: string[];
  nextSteps: string[];
};

export type ApplicationTip = {
  title: string;
  detail: string;
  sourceRequirement: string;
  sourceUrl: string;
};

export type DocumentSection = {
  heading: string;
  prompt: string;
  programSpecificNotes: string[];
};

export type GeneratedDocument = {
  title: string;
  purpose: string;
  sections: DocumentSection[];
};

export type SectionDraftResult = {
  draft: string;
};

export type SectionReviewResult = {
  strengths: string[];
  gaps: string[];
  rewrite: string;
};

export type ApplicationPack = {
  programId: string;
  programTitle: string;
  generatedAt: string;
  aiProvider: "ollama" | "fallback";
  model: string;
  eligibility: EligibilityResult;
  applicationTips: ApplicationTip[];
  documents: GeneratedDocument[];
  checklist: string[];
  warning?: string;
};
