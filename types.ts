

export enum UserRole {
  Farmer = 'Farmer',
  Processor = 'Processor',
  Roaster = 'Roaster',
  HeadJudge = 'Head Judge',
  Cupper = 'Cupper',
  Admin = 'Admin',
  Consumer = 'Consumer',
}

export enum ProcessingBatchStatus {
  ToProcess = 'To Process',
  Drying = 'Drying',
  Completed = 'Completed',
}

export enum GAPActivityType {
  Fertilizer = 'Fertilizer',
  PestManagement = 'Pest Management',
  WaterManagement = 'Water Management',
}

export interface Farm {
  id: string;
  farmerName: string;
  location: string;
}

export interface HarvestLot {
  id: string;
  farmerName: string;
  cherryVariety: string;
  weightKg: number;
  farmPlotLocation: string;
  harvestDate: string;
  status: 'Ready for Processing' | 'Processing';
}

export interface DryingLogEntry {
  date: string;
  moistureContent: number;
  ambientTemp: number;
  relativeHumidity: number;
}

export interface ProcessingBatch {
  id: string;
  harvestLotId: string;
  status: ProcessingBatchStatus;
  processType: string;
  parchmentWeightKg?: number;
  moistureContent?: number;
  baggingDate?: string;
  dryingStartDate?: string;
  dryingEndDate?: string;
  dryingLog?: DryingLogEntry[];
}

export interface PhysicalTestResults {
    sampleWeightGrams: number;
    greenBeanWeightGrams: number;
    greenBeanMoisture: number;
    waterActivity: number;
    density: number;
    defectCount: number;
    notes?: string;
}

export interface ParchmentLot {
    id: string;
    processingBatchId: string;
    harvestLotId: string;
    initialWeightKg: number;
    currentWeightKg: number;
    moistureContent: number;
    processType: string;
    status: 'Awaiting Hulling' | 'Hulled';
    physicalTestResults?: PhysicalTestResults;
}

export interface GreenBeanLot {
    id:string;
    parchmentLotId: string;
    grade: string;
    initialWeightKg: number;
    currentWeightKg: number;
    availabilityStatus: 'Available' | 'Withdrawn';
    cuppingScores: { sessionId: string; score: number }[];
    withdrawalHistory?: {
        amountKg: number;
        purpose: string;
        date: string;
    }[];
}

export enum CuppingSessionType {
    QC = 'Standard QC',
    Competition = 'Competition',
}

export interface CuppingSample {
    id: string;
    blindCode: string;
    greenBeanLotId?: string; // Optional for external samples
    submitterInfo: { name: string };
    originInfo: { farm: string };
    lotInfo: { process: string };
}

export interface JudgeScore {
    judgeId: string; // Corresponds to user ID
    judgeName: string;
    scores: { [attribute: string]: number };
    notes: string;
    totalScore: number;
}

export interface CuppingSession {
    id: string;
    name: string;
    date: string;
    type: CuppingSessionType;
    samples: CuppingSample[];
    judges: { id: string, name: string, role: UserRole.Cupper | UserRole.HeadJudge | UserRole.Processor }[];
    scores: { [sampleId: string]: JudgeScore[] };
    status: 'Setup' | 'Scoring' | 'Adjudication' | 'Finalized';
    finalResults?: {
        [sampleId: string]: {
            avgScores: { [attribute: string]: number };
            totalScore: number;
            finalNotes: string;
            rank?: number;
        }
    }
}

export interface User {
  id: string;
  name: string;
  role: UserRole;
}

export interface GAPLogEntry {
  id: string;
  farmPlotLocation: string;
  activityType: GAPActivityType;
  date: string;
  productUsed: string;
  quantity: string;
  notes?: string;
}

export interface RoasterInventoryItem {
  id: string;
  roasterId: string;
  greenBeanLotId: string;
  claimedWeightKg: number;
  remainingWeightKg: number;
}

export interface RoastBatch {
  id: string;
  roasterId: string;
  roasterInventoryId: string;
  greenBeanLotId: string;
  roastDate: string;
  batchSizeKg: number;
  yieldPercentage: number;
  roastProfileNotes: string;
  flavorNotes?: string;
}

export interface PlatformInsight {
  topPerformingVariety: { variety: string; avgScore: number; };
  topPerformingProcess: { process: string; avgScore: number; };
  notableCorrelations: string[];
  overallSummary: string;
}

export interface ComprehensiveQualityReport {
    title: string;
    executiveSummary: string;
    topPerformingCoffees: Array<{
        lotId: string;
        variety: string;
        process: string;
        score: number;
        tastingNotes: string;
    }>;
    varietyAnalysis: {
        topVariety: string;
        averageScore: number;
        analysis: string;
    };
    processingAnalysis: {
        topProcess: string;
        averageScore: number;
        analysis: string;
    };
    keyTrends: string[];
    recommendations: {
        forFarmers: string;
        forProcessors: string;
        forRoasters: string;
    };
}

export interface AppData {
  users: User[];
  farms: Farm[];
  harvestLots: HarvestLot[];
  processingBatches: ProcessingBatch[];
  parchmentLots: ParchmentLot[];
  greenBeanLots: GreenBeanLot[];
  cuppingSessions: CuppingSession[];
  gapLogs: GAPLogEntry[];
  roasterInventory: RoasterInventoryItem[];
  roastBatches: RoastBatch[];
}

// Updated for clarity to match SCA form structure
export const SCA_SENSORY_ATTRIBUTES = [
  'Fragrance/Aroma', 'Flavor', 'Aftertaste', 'Acidity', 'Body', 'Balance', 'Overall'
];

export const SCA_CUP_ATTRIBUTES = [
  'Uniformity', 'Clean Cup', 'Sweetness'
];

// Maintained for backward compatibility with other components
export const SCA_ATTRIBUTES = [
  'Fragrance/Aroma', 'Flavor', 'Aftertaste', 'Acidity', 
  'Body', 'Uniformity', 'Balance', 'Clean Cup', 
  'Sweetness', 'Overall'
];