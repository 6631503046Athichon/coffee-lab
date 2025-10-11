

import { AppData, UserRole, ProcessingBatchStatus, CuppingSessionType, SCA_ATTRIBUTES, Farm, GAPActivityType } from './types';

export const MOCK_DATA: AppData = {
  users: [
    { id: 'user-headjudge', name: 'Artanis', role: UserRole.HeadJudge },
    { id: 'user-cupper1', name: 'Tassadar', role: UserRole.Cupper },
    { id: 'user-cupper2', name: 'Zeratul', role: UserRole.Cupper },
    { id: 'user-cupper3', name: 'Fenix', role: UserRole.Cupper },
    { id: 'user-roaster1', name: 'Jim Raynor', role: UserRole.Roaster },
    { id: 'user-processor1', name: 'Alarak', role: UserRole.Processor },
    { id: 'user-farmer1', name: 'Maria Rodriguez', role: UserRole.Farmer },
  ],
  farms: [
    { id: 'F001', farmerName: 'Maria Rodriguez', location: 'Finca La Esmeralda, Plot A' },
    { id: 'F002', farmerName: 'John Doe', location: 'Hacienda Elida, Plot C4' },
  ],
  harvestLots: [
    { id: 'HL001', farmerName: 'Maria Rodriguez', cherryVariety: 'Gesha', weightKg: 150, farmPlotLocation: 'Finca La Esmeralda, Plot A', harvestDate: '2025-08-15', status: 'Processing' },
    { id: 'HL002', farmerName: 'John Doe', cherryVariety: 'Caturra', weightKg: 300, farmPlotLocation: 'Hacienda Elida, Plot C4', harvestDate: '2025-08-16', status: 'Ready for Processing' },
  ],
  processingBatches: [
    { 
      id: 'PB001', 
      harvestLotId: 'HL001', 
      status: ProcessingBatchStatus.Drying, 
      processType: 'Washed', 
      dryingStartDate: '2025-08-16',
      dryingLog: [
        { date: '2025-08-16', moistureContent: 55.0, ambientTemp: 28, relativeHumidity: 75 },
        { date: '2025-08-17', moistureContent: 48.5, ambientTemp: 29, relativeHumidity: 72 },
        { date: '2025-08-18', moistureContent: 41.2, ambientTemp: 30, relativeHumidity: 68 },
        { date: '2025-08-19', moistureContent: 35.8, ambientTemp: 29, relativeHumidity: 70 },
      ]
    },
    { id: 'PB002', harvestLotId: 'HL002', status: ProcessingBatchStatus.ToProcess, processType: 'Natural' },
    { 
      id: 'PB003', 
      harvestLotId: 'HL001', 
      status: ProcessingBatchStatus.Completed, 
      processType: 'Honey', 
      parchmentWeightKg: 55, 
      moistureContent: 11.5, 
      baggingDate: '2025-08-25', 
      dryingStartDate: '2025-08-17', 
      dryingEndDate: '2025-08-25',
      dryingLog: [
        { date: '2025-08-17', moistureContent: 58.0, ambientTemp: 27, relativeHumidity: 78 },
        { date: '2025-08-18', moistureContent: 50.1, ambientTemp: 28, relativeHumidity: 75 },
        { date: '2025-08-19', moistureContent: 42.5, ambientTemp: 29, relativeHumidity: 71 },
        { date: '2025-08-20', moistureContent: 35.2, ambientTemp: 30, relativeHumidity: 65 },
        { date: '2025-08-21', moistureContent: 28.9, ambientTemp: 31, relativeHumidity: 62 },
        { date: '2025-08-22', moistureContent: 22.4, ambientTemp: 30, relativeHumidity: 64 },
        { date: '2025-08-23', moistureContent: 17.6, ambientTemp: 29, relativeHumidity: 68 },
        { date: '2025-08-24', moistureContent: 13.8, ambientTemp: 28, relativeHumidity: 70 },
        { date: '2025-08-25', moistureContent: 11.5, ambientTemp: 28, relativeHumidity: 72 },
      ]
    },
  ],
  parchmentLots: [
    { id: 'PL001', processingBatchId: 'PB003', harvestLotId: 'HL001', initialWeightKg: 55, currentWeightKg: 55, moistureContent: 11.5, processType: 'Honey', status: 'Hulled'},
    { 
      id: 'PL002', processingBatchId: 'PB001', harvestLotId: 'HL001', initialWeightKg: 60, currentWeightKg: 59.7, moistureContent: 11.2, processType: 'Washed', status: 'Awaiting Hulling',
      physicalTestResults: {
        sampleWeightGrams: 300,
        greenBeanWeightGrams: 255,
        greenBeanMoisture: 10.8,
        waterActivity: 0.58,
        density: 0.71,
        defectCount: 2,
        notes: 'Clean, no visible issues.'
      }
    }
  ],
  greenBeanLots: [
      { id: 'GBL001', parchmentLotId: 'PL001', grade: 'Grade A', initialWeightKg: 45, currentWeightKg: 32.5, availabilityStatus: 'Available', cuppingScores: [{sessionId: 'CS001', score: 88.5}],
        withdrawalHistory: [{ amountKg: 2.5, purpose: 'Sample Roast', date: '2025-09-01' }]
      },
      { id: 'GBL002', parchmentLotId: 'PL002', grade: 'Grade A', initialWeightKg: 50, currentWeightKg: 50, availabilityStatus: 'Available', cuppingScores: [{sessionId: 'CS001', score: 86.75}],
      }
  ],
  cuppingSessions: [
    {
      id: 'CS001',
      name: 'National Coffee Championship 2025',
      date: '2025-09-10',
      type: CuppingSessionType.Competition,
      status: 'Adjudication',
      judges: [
        { id: 'user-headjudge', name: 'Artanis', role: UserRole.HeadJudge },
        { id: 'user-cupper1', name: 'Tassadar', role: UserRole.Cupper },
        { id: 'user-cupper2', name: 'Zeratul', role: UserRole.Cupper },
      ],
      samples: [
        { id: 'S01', blindCode: '650', greenBeanLotId: 'GBL001', submitterInfo: { name: 'Maria Rodriguez' }, originInfo: { farm: 'Finca La Esmeralda' }, lotInfo: { process: 'Honey' } },
        { id: 'S02', blindCode: '503', greenBeanLotId: 'EXT01', submitterInfo: { name: 'External Producer' }, originInfo: { farm: 'Some Other Farm' }, lotInfo: { process: 'Natural' } },
      ],
      scores: {
        'S01': [
          { judgeId: 'user-cupper1', judgeName: 'Tassadar', scores: { 'Fragrance/Aroma': 8.75, 'Flavor': 8.5, 'Aftertaste': 8.25, 'Acidity': 8.75, 'Body': 8.0, 'Uniformity': 10, 'Balance': 8.5, 'Clean Cup': 10, 'Sweetness': 10, 'Overall': 8.5 }, totalScore: 89.25, notes: 'Bright citrus, floral notes of jasmine. Very clean and sweet. Elegant acidity.' },
          { judgeId: 'user-cupper2', judgeName: 'Zeratul', scores: { 'Fragrance/Aroma': 8.5, 'Flavor': 8.75, 'Aftertaste': 8.5, 'Acidity': 8.5, 'Body': 8.25, 'Uniformity': 10, 'Balance': 8.25, 'Clean Cup': 10, 'Sweetness': 10, 'Overall': 8.75 }, totalScore: 89.5, notes: 'Stone fruit, honey, and a hint of black tea. Silky body. Well-balanced.' },
          { judgeId: 'user-headjudge', judgeName: 'Artanis', scores: { 'Fragrance/Aroma': 8.75, 'Flavor': 8.5, 'Aftertaste': 8.25, 'Acidity': 8.75, 'Body': 8.0, 'Uniformity': 10, 'Balance': 8.25, 'Clean Cup': 10, 'Sweetness': 10, 'Overall': 8.5 }, totalScore: 89, notes: 'Tropical fruit notes, papaya and mango. A very complex and satisfying cup.' },
        ],
        'S02': [
          { judgeId: 'user-cupper1', judgeName: 'Tassadar', scores: { 'Fragrance/Aroma': 8.25, 'Flavor': 8.0, 'Aftertaste': 7.75, 'Acidity': 8.0, 'Body': 8.5, 'Uniformity': 10, 'Balance': 8.0, 'Clean Cup': 10, 'Sweetness': 10, 'Overall': 8.0 }, totalScore: 86.5, notes: 'Berry jam, winey notes. Full body.' },
          { judgeId: 'user-cupper2', judgeName: 'Zeratul', scores: { 'Fragrance/Aroma': 8.5, 'Flavor': 8.25, 'Aftertaste': 8.0, 'Acidity': 7.75, 'Body': 8.25, 'Uniformity': 10, 'Balance': 7.75, 'Clean Cup': 10, 'Sweetness': 10, 'Overall': 8.25 }, totalScore: 86.75, notes: 'Fermented fruit, dark chocolate. A bit rustic but enjoyable.' },
        ]
      },
      finalResults: {
        'S01': {
            avgScores: SCA_ATTRIBUTES.reduce((acc, attr) => ({ ...acc, [attr]: 8.5 }), {}),
            totalScore: 89.25,
            finalNotes: 'A consensus of bright citrus, floral jasmine, and tropical fruits like papaya and mango characterizes this complex and satisfying cup. It presents with a silky body, elegant acidity, and exceptional sweetness, often described as clean, balanced, and honey-like.'
        }
      }
    },
     {
      id: 'CS002',
      name: 'Regional Qualifiers 2025',
      date: '2025-08-20',
      type: CuppingSessionType.Competition,
      status: 'Scoring',
      judges: [
        { id: 'user-headjudge', name: 'Artanis', role: UserRole.HeadJudge },
        { id: 'user-cupper1', name: 'Tassadar', role: UserRole.Cupper },
        { id: 'user-cupper3', name: 'Fenix', role: UserRole.Cupper },
      ],
      samples: [
        { id: 'S01', blindCode: 'A11', greenBeanLotId: 'GBL002', submitterInfo: { name: 'John Doe' }, originInfo: { farm: 'Hacienda Elida' }, lotInfo: { process: 'Washed' } },
        { id: 'S02', blindCode: 'B22', greenBeanLotId: 'EXT02', submitterInfo: { name: 'Another Producer' }, originInfo: { farm: 'Finca Naranja' }, lotInfo: { process: 'Natural' } },
      ],
      scores: {
        'S01': [
           { judgeId: 'user-cupper1', judgeName: 'Tassadar', scores: { 'Fragrance/Aroma': 8.5, 'Flavor': 8.5, 'Aftertaste': 8.0, 'Acidity': 8.25, 'Body': 8.0, 'Uniformity': 10, 'Balance': 8.25, 'Clean Cup': 10, 'Sweetness': 10, 'Overall': 8.5 }, totalScore: 88, notes: 'Clean, balanced, classic washed profile.' },
        ],
         'S02': [
           { judgeId: 'user-cupper1', judgeName: 'Tassadar', scores: { 'Fragrance/Aroma': 8.0, 'Flavor': 8.25, 'Aftertaste': 8.0, 'Acidity': 8.0, 'Body': 8.5, 'Uniformity': 10, 'Balance': 8.0, 'Clean Cup': 10, 'Sweetness': 10, 'Overall': 8.0 }, totalScore: 86.75, notes: 'Fruity and sweet.' },
           { judgeId: 'user-cupper3', judgeName: 'Fenix', scores: { 'Fragrance/Aroma': 8.25, 'Flavor': 8.0, 'Aftertaste': 7.75, 'Acidity': 8.0, 'Body': 8.25, 'Uniformity': 10, 'Balance': 8.0, 'Clean Cup': 10, 'Sweetness': 10, 'Overall': 8.0 }, totalScore: 86.25, notes: 'Nice berry notes.' },
        ]
      }
    },
    {
      id: 'CS003',
      name: 'Producer Expo Showcase',
      date: '2025-10-01',
      type: CuppingSessionType.Competition,
      status: 'Setup',
      judges: [
        { id: 'user-headjudge', name: 'Artanis', role: UserRole.HeadJudge },
        { id: 'user-cupper2', name: 'Zeratul', role: UserRole.Cupper },
      ],
      samples: [
        { id: 'S01', blindCode: 'X99', greenBeanLotId: 'GBL001', submitterInfo: { name: 'Maria Rodriguez' }, originInfo: { farm: 'Finca La Esmeralda' }, lotInfo: { process: 'Honey' } },
      ],
      scores: {}
    },
    {
      id: 'CS004',
      name: 'Golden Bean Award 2024',
      date: '2024-12-15',
      type: CuppingSessionType.Competition,
      status: 'Finalized',
      judges: [
        { id: 'user-headjudge', name: 'Artanis', role: UserRole.HeadJudge },
        { id: 'user-cupper1', name: 'Tassadar', role: UserRole.Cupper },
        { id: 'user-cupper2', name: 'Zeratul', role: UserRole.Cupper },
      ],
      samples: [
        { id: 'S01', blindCode: '78A', greenBeanLotId: 'GBL001', submitterInfo: { name: 'Maria Rodriguez' }, originInfo: { farm: 'Finca La Esmeralda' }, lotInfo: { process: 'Honey' } },
        { id: 'S02', blindCode: '92B', greenBeanLotId: 'GBL002', submitterInfo: { name: 'John Doe' }, originInfo: { farm: 'Hacienda Elida' }, lotInfo: { process: 'Washed' } },
      ],
      scores: { 'S01': [], 'S02': [] },
      finalResults: {
        'S01': {
            avgScores: SCA_ATTRIBUTES.reduce((acc, attr) => ({ ...acc, [attr]: 8.75 }), {}),
            totalScore: 90.50,
            finalNotes: 'An absolutely stunning coffee, with remarkable complexity and clarity. Layers of tropical fruit, jasmine, and a honey-sweet finish.',
            rank: 1
        },
        'S02': {
            avgScores: SCA_ATTRIBUTES.reduce((acc, attr) => ({ ...acc, [attr]: 8.5 }), {}),
            totalScore: 88.25,
            finalNotes: 'A very clean and elegant washed coffee. Notes of citrus, green apple, and a delicate floral quality. Crisp acidity.',
            rank: 2
        }
      }
    }
  ],
  gapLogs: [
    { id: 'GAP001', farmPlotLocation: 'Finca La Esmeralda, Plot A', activityType: GAPActivityType.Fertilizer, date: '2025-06-15', productUsed: 'Organic Compost', quantity: '200 kg', notes: 'Applied around the base of the plants.' },
    { id: 'GAP002', farmPlotLocation: 'Finca La Esmeralda, Plot A', activityType: GAPActivityType.PestManagement, date: '2025-07-01', productUsed: 'Neem Oil Solution', quantity: '5 L', notes: 'Preventative spraying for coffee berry borer.' },
    { id: 'GAP003', farmPlotLocation: 'Hacienda Elida, Plot C4', activityType: GAPActivityType.WaterManagement, date: '2025-07-10', productUsed: 'Drip Irrigation', quantity: '2 hours', notes: 'Morning irrigation cycle.' },
    { id: 'GAP004', farmPlotLocation: 'Finca La Esmeralda, Plot A', activityType: GAPActivityType.WaterManagement, date: '2025-07-12', productUsed: 'Drip Irrigation', quantity: '1.5 hours', notes: 'Soil moisture was adequate.' },
  ],
  roasterInventory: [
    { id: 'RI001', roasterId: 'user-roaster1', greenBeanLotId: 'GBL001', claimedWeightKg: 10, remainingWeightKg: 7.5 }
  ],
  roastBatches: [
      { id: 'RB001', roasterId: 'user-roaster1', roasterInventoryId: 'RI001', greenBeanLotId: 'GBL001', roastDate: '2025-09-15', batchSizeKg: 2.5, yieldPercentage: 85, roastProfileNotes: 'Medium roast profile. First crack at 9:30. Dropped at 11:15.', flavorNotes: 'Chocolate, Orange Peel, Brown Sugar'}
  ]
};