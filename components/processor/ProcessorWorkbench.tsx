import React, { useState, useMemo, useEffect, useCallback, useRef } from 'react';
import ReactDOM from 'react-dom';
import { useDataContext } from '../../hooks/useDataContext';
import { ProcessingBatch, ProcessingBatchStatus, ParchmentLot, GreenBeanLot, HarvestLot, PhysicalTestResults, User, UserRole, CuppingSessionType, CuppingSession, JudgeScore, CuppingSample, SCA_SENSORY_ATTRIBUTES, SCA_CUP_ATTRIBUTES } from '../../types';
import { Coffee, Wind, PackageCheck, Sprout, ChevronsRight, CheckCircle, Archive, PlayCircle, TestTube, Beaker, Plus, Trash2, LayoutGrid, List, AlertCircle, History, Save, Search, ArrowUp, ArrowDown, ChevronDown, Check, Microscope, Star, TrendingUp, Box, Droplet, Scale } from 'lucide-react';

type ViewMode = 'kanban' | 'table';
type SortDirection = 'asc' | 'desc';
type ParchmentSortKeys = keyof ParchmentLot | 'id';
type GreenBeanSortKeys = keyof GreenBeanLot | 'id' | 'qcScore';

const ITEMS_PER_PAGE = 5;

// Custom Dropdown Component for Process Type Selection
const ProcessTypeDropdown: React.FC<{
  value: string;
  onChange: (value: string) => void;
}> = ({ value, onChange }) => {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const options = [
    { value: 'Washed', label: 'Washed Process' },
    { value: 'Natural', label: 'Natural Process' },
    { value: 'Honey', label: 'Honey Process' }
  ];

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const selectedOption = options.find(opt => opt.value === value) || options[0];

  return (
    <div ref={dropdownRef} className="relative">
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="w-full border border-gray-300 rounded-xl px-4 py-3 text-base font-medium bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all hover:border-gray-400 flex items-center justify-between gap-2 shadow-sm"
      >
        <span className="text-gray-900">{selectedOption.label}</span>
        <ChevronDown className={`h-5 w-5 text-gray-500 transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`} />
      </button>

      {isOpen && (
        <div className="absolute z-20 mt-3 left-0 right-0 bg-white border border-gray-300 rounded-xl shadow-2xl overflow-hidden">
          <div className="py-2">
            {options.filter(opt => opt.value !== value).map((option) => (
              <button
                key={option.value}
                type="button"
                onClick={() => {
                  onChange(option.value);
                  setIsOpen(false);
                }}
                className="w-full text-left px-5 py-3 transition-all text-base font-medium text-gray-900 hover:bg-indigo-50 hover:text-indigo-700"
              >
                {option.label}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

// Custom Dropdown Component for Grade Selection
const GradeDropdown: React.FC<{
  value: string;
  onChange: (value: string) => void;
  index: number;
}> = ({ value, onChange, index }) => {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const options = [
    { value: 'Grade A', label: 'Grade A' },
    { value: 'Grade B', label: 'Grade B' },
    { value: 'Grade C', label: 'Grade C' },
    { value: 'Peaberry', label: 'Peaberry' },
    { value: 'Screen 18', label: 'Screen 18' },
    { value: 'Screen 17', label: 'Screen 17' },
    { value: 'Screen 16', label: 'Screen 16' },
    { value: 'Screen 15', label: 'Screen 15' }
  ];

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const selectedOption = options.find(opt => opt.value === value);

  return (
    <div ref={dropdownRef} className="relative">
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm font-semibold bg-white focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-green-500 transition-all hover:border-gray-400 flex items-center justify-between gap-2"
      >
        <span className={value ? "text-gray-900" : "text-gray-400"}>{selectedOption ? selectedOption.label : 'Select Grade'}</span>
        <ChevronDown className={`h-4 w-4 text-gray-500 transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`} />
      </button>

      {isOpen && (
        <div className="absolute z-20 mt-2 left-0 right-0 bg-white border border-gray-300 rounded-lg shadow-2xl overflow-hidden max-h-60 overflow-y-auto">
          <div className="py-1">
            {options.map((option) => (
              <button
                key={option.value}
                type="button"
                onClick={() => {
                  onChange(option.value);
                  setIsOpen(false);
                }}
                className={`w-full text-left px-4 py-2.5 transition-all text-sm font-medium ${
                  value === option.value
                    ? 'bg-green-50 text-green-700'
                    : 'text-gray-900 hover:bg-green-50 hover:text-green-700'
                }`}
              >
                {option.label}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

// --- Detailed Scoring Helpers (adapted from CupperScoringSheet) ---
interface ScoreInput {
    value: string;
    error: string | null;
}

const validateScore = (value: string): { formattedValue: string, error: string | null } => {
    if (value.trim() === '') return { formattedValue: value, error: "Required." };
    const numValue = parseFloat(value);
    if (isNaN(numValue)) return { formattedValue: value, error: "Invalid number." };
    if (numValue < 6 || numValue > 10) return { formattedValue: value, error: "Must be 6-10." };
    return { formattedValue: numValue.toFixed(2), error: null };
};

const initialSensoryScores = SCA_SENSORY_ATTRIBUTES.reduce((acc, attr) => {
    acc[attr] = { value: '', error: null };
    return acc;
}, {} as Record<string, ScoreInput>);

const initialCupScores = SCA_CUP_ATTRIBUTES.reduce((acc, attr) => {
    acc[attr] = 5; // All 5 cups are good by default
    return acc;
}, {} as Record<string, number>);
// --- End Detailed Scoring Helpers ---

// Modal Portal Component
const ModalPortal: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    return ReactDOM.createPortal(children, document.body);
};

const KanbanCard: React.FC<{ batch: ProcessingBatch; onDragStart: (e: React.DragEvent<HTMLDivElement>, batchId: string) => void }> = ({ batch, onDragStart }) => {
  const processColors = {
    'Washed': { bg: 'bg-blue-50', border: 'border-blue-200', text: 'text-blue-700', label: 'text-blue-600' },
    'Natural': { bg: 'bg-orange-50', border: 'border-orange-200', text: 'text-orange-700', label: 'text-orange-600' },
    'Honey': { bg: 'bg-green-50', border: 'border-green-200', text: 'text-green-700', label: 'text-green-600' }
  };
  const colors = processColors[batch.processType as keyof typeof processColors] || processColors['Washed'];

  return (
    <div
      draggable
      onDragStart={(e) => onDragStart(e, batch.id)}
      className="bg-white p-4 mb-3 rounded-xl shadow-md hover:shadow-2xl cursor-grab active:cursor-grabbing border border-gray-200 hover:border-gray-300 transition-all duration-300 hover:-translate-y-2 hover:scale-[1.03]"
    >
      <div className="flex items-center justify-between mb-3">
        <p className="font-bold text-lg text-gray-900">#{batch.id}</p>
        <div className="p-2 bg-amber-100 rounded-lg transition-transform duration-300 hover:rotate-12 hover:scale-110">
          <Coffee className="h-4 w-4 text-amber-600" />
        </div>
      </div>
      <div className="space-y-2">
        <div className="bg-gray-50 p-3 rounded-lg hover:bg-gray-100 transition-colors duration-200">
          <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1">Harvest Lot</p>
          <p className="text-sm font-bold text-gray-800">{batch.harvestLotId}</p>
        </div>
        <div className={`${colors.bg} p-3 rounded-lg border ${colors.border} hover:shadow-md transition-all duration-300`}>
          <p className={`text-xs font-semibold ${colors.label} uppercase tracking-wide mb-1`}>Process</p>
          <p className={`text-sm font-bold ${colors.text}`}>{batch.processType}</p>
        </div>
      </div>
    </div>
  );
};

const KanbanColumn: React.FC<{ title: string; status: ProcessingBatchStatus; batches: ProcessingBatch[]; icon: React.ReactNode; color: string; onDrop: (e: React.DragEvent<HTMLDivElement>, status: ProcessingBatchStatus) => void; onDragOver: (e: React.DragEvent<HTMLDivElement>) => void; onDragStart: (e: React.DragEvent<HTMLDivElement>, batchId: string) => void }> = ({ title, status, batches, icon, color, onDrop, onDragOver, onDragStart }) => {
  const columnStyles = {
    'border-yellow-400': { bg: 'bg-yellow-50', iconBg: 'bg-yellow-500', borderColor: 'border-yellow-300', textColor: 'text-yellow-700', dotBg: 'bg-yellow-500' },
    'border-blue-400': { bg: 'bg-blue-50', iconBg: 'bg-blue-500', borderColor: 'border-blue-300', textColor: 'text-blue-700', dotBg: 'bg-blue-500' },
    'border-green-400': { bg: 'bg-green-50', iconBg: 'bg-green-500', borderColor: 'border-green-300', textColor: 'text-green-700', dotBg: 'bg-green-500' }
  };
  const styles = columnStyles[color as keyof typeof columnStyles] || columnStyles['border-yellow-400'];

  return (
    <div
      onDrop={(e) => onDrop(e, status)}
      onDragOver={onDragOver}
      className={`${styles.bg} rounded-2xl p-5 w-full md:w-1/3 flex flex-col border-2 ${styles.borderColor} shadow-lg hover:shadow-2xl transition-all duration-300 hover:scale-[1.02]`}
    >
      <div className="flex items-center justify-between mb-5 pb-4 border-b border-gray-200">
        <div className="flex items-center gap-3">
          <div className={`p-3 ${styles.iconBg} rounded-xl shadow-lg transition-transform duration-300 hover:rotate-6 hover:scale-110`}>
            {icon}
          </div>
          <div>
            <h3 className="font-bold text-xl text-gray-900">{title}</h3>
            <div className="flex items-center gap-2 mt-1">
              <div className={`w-2 h-2 rounded-full ${styles.dotBg} animate-pulse`}></div>
              <p className={`text-xs font-semibold ${styles.textColor}`}>{batches.length} {batches.length === 1 ? 'batch' : 'batches'}</p>
            </div>
          </div>
        </div>
      </div>
      <div className="flex-grow overflow-y-auto pr-2 custom-scrollbar" style={{maxHeight: '600px'}}>
        {batches.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 text-gray-400 bg-white/60 rounded-xl border-2 border-dashed border-gray-300 transition-all duration-300 hover:border-gray-400 hover:bg-white/80">
            <PackageCheck className="h-16 w-16 mb-3 opacity-30 animate-pulse" />
            <p className="text-sm font-medium">No batches yet</p>
            <p className="text-xs mt-1">Drag cards here</p>
          </div>
        ) : (
          batches.map(batch => (
            <KanbanCard key={batch.id} batch={batch} onDragStart={onDragStart} />
          ))
        )}
      </div>
    </div>
  );
};

interface ProcessorWorkbenchProps {
  currentUser: User;
}

const ProcessorWorkbench: React.FC<ProcessorWorkbenchProps> = ({ currentUser }) => {
  const { data, setData } = useDataContext();
  const [viewMode, setViewMode] = useState<ViewMode>('kanban');
  const isAdmin = currentUser.role === UserRole.Admin;

  // Modal States
  const [modal, setModal] = useState<string | null>(null);
  const [selectedBatch, setSelectedBatch] = useState<ProcessingBatch | null>(null);
  const [selectedParchment, setSelectedParchment] = useState<ParchmentLot | null>(null);
  const [selectedHarvestLot, setSelectedHarvestLot] = useState<HarvestLot | null>(null);
  const [selectedGreenBean, setSelectedGreenBean] = useState<GreenBeanLot | null>(null);
  const [selectedGreenBeanForHistory, setSelectedGreenBeanForHistory] = useState<GreenBeanLot | null>(null);
  const [scoringLot, setScoringLot] = useState<GreenBeanLot | null>(null);

  // Score Modal State
  const [scoringMode, setScoringMode] = useState<'simple' | 'detailed'>('simple');
  const [simpleQcScore, setSimpleQcScore] = useState('');
  const [notes, setNotes] = useState('');
  const [sensoryScores, setSensoryScores] = useState<Record<string, ScoreInput>>(initialSensoryScores);
  const [cupScores, setCupScores] = useState<Record<string, number>>(initialCupScores);
  const [defects, setDefects] = useState({ numCups: '0', intensity: 2 });
  
  // Table Control States
  const [parchmentSearch, setParchmentSearch] = useState('');
  const [parchmentSortConfig, setParchmentSortConfig] = useState<{ key: ParchmentSortKeys; direction: SortDirection }>({ key: 'id', direction: 'asc' });
  const [parchmentCurrentPage, setParchmentCurrentPage] = useState(1);
  
  const [greenBeanSearch, setGreenBeanSearch] = useState('');
  const [greenBeanSortConfig, setGreenBeanSortConfig] = useState<{ key: GreenBeanSortKeys; direction: SortDirection }>({ key: 'id', direction: 'asc' });
  const [greenBeanCurrentPage, setGreenBeanCurrentPage] = useState(1);


  const processorUser = useMemo(() => data.users.find(u => u.role === UserRole.Processor), [data.users]);
  
  // Hull & Grade Modal State
  const [gradedLots, setGradedLots] = useState<{grade: string; weight: string}[]>([{grade: 'Grade A', weight: ''}]);
  const [totalGreenWeight, setTotalGreenWeight] = useState('');

  // Process Type Selection State
  const [selectedProcessType, setSelectedProcessType] = useState<string>('Washed');

  const gradedWeightSum = useMemo(() => {
    return gradedLots.reduce((sum, lot) => sum + (parseFloat(lot.weight) || 0), 0);
  }, [gradedLots]);

  const resetAllScoreForms = useCallback(() => {
    setSimpleQcScore('');
    setNotes('');
    setSensoryScores(initialSensoryScores);
    setCupScores(initialCupScores);
    setDefects({ numCups: '0', intensity: 2 });
    setScoringMode('simple');
  }, []);

  useEffect(() => {
    if (scoringLot && processorUser) {
        const qcSessionId = `CS-QC-${processorUser.id}`;
        const qcSession = data.cuppingSessions.find(s => s.id === qcSessionId);
        if (qcSession) {
            const sampleInSession = qcSession.samples.find(s => s.greenBeanLotId === scoringLot.id);
            if (sampleInSession) {
                const scoreEntry = (qcSession.scores[sampleInSession.id] || []).find(s => s.judgeId === processorUser.id);
                if (scoreEntry) {
                    setNotes(scoreEntry.notes);
                    // Check if it's a detailed score
                    if (Object.keys(scoreEntry.scores).length > 1) {
                        setScoringMode('detailed');
                        const newSensoryScores = {...initialSensoryScores};
                        SCA_SENSORY_ATTRIBUTES.forEach(attr => {
                            if (scoreEntry.scores[attr] !== undefined) {
                                newSensoryScores[attr] = { value: scoreEntry.scores[attr].toFixed(2), error: null };
                            }
                        });
                        setSensoryScores(newSensoryScores);
                        
                        const newCupScores = {...initialCupScores};
                        SCA_CUP_ATTRIBUTES.forEach(attr => {
                            if (scoreEntry.scores[attr] !== undefined) {
                                newCupScores[attr] = scoreEntry.scores[attr] / 2;
                            }
                        });
                        setCupScores(newCupScores);
                        // Note: Defects are not saved in the score object, so they reset. This is a simplification.
                    } else { // It's a simple score
                        setScoringMode('simple');
                        setSimpleQcScore(scoreEntry.totalScore.toString());
                    }
                    return;
                }
            }
        }
        // If no score found, reset everything
        resetAllScoreForms();
    }
  }, [scoringLot, processorUser, data.cuppingSessions, resetAllScoreForms]);


  const detailedCalculations = useMemo(() => {
    const sensoryTotal = SCA_SENSORY_ATTRIBUTES.reduce((sum, attr) => {
        const numValue = parseFloat(sensoryScores[attr].value);
        return sum + (isNaN(numValue) ? 0 : numValue);
    }, 0);
    const cupsTotal = SCA_CUP_ATTRIBUTES.reduce((sum, attr) => sum + (cupScores[attr] * 2), 0);
    const subtotal = sensoryTotal + cupsTotal;
    const defectCups = parseInt(defects.numCups, 10);
    const defectsTotal = (isNaN(defectCups) || defectCups < 0) ? 0 : defectCups * defects.intensity;
    const finalScore = subtotal - defectsTotal;
    return { subtotal, defectsTotal, finalScore };
  }, [sensoryScores, cupScores, defects]);


  const handleDragStart = (e: React.DragEvent<HTMLDivElement>, batchId: string) => e.dataTransfer.setData('batchId', batchId);
  const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => e.preventDefault();

  const handleDrop = (e: React.DragEvent<HTMLDivElement>, newStatus: ProcessingBatchStatus) => {
    const batchId = e.dataTransfer.getData('batchId');
    const batch = data.processingBatches.find(b => b.id === batchId);
    if (!batch || batch.status === newStatus) return;

    if (newStatus === ProcessingBatchStatus.Completed) {
      setSelectedBatch(batch);
      setModal('completeBatch');
    } else {
      setData(prev => ({ ...prev, processingBatches: prev.processingBatches.map(b => b.id === batchId ? { ...b, status: newStatus } : b) }));
    }
  };

  const handleSaveScore = () => {
    if (!processorUser || !scoringLot) return;
    
    let totalScore: number;
    let scoresToSave: { [attribute: string]: number };

    if (scoringMode === 'simple') {
        totalScore = parseFloat(simpleQcScore);
        if (isNaN(totalScore) || totalScore < 0 || totalScore > 100) {
            alert("Please enter a valid score between 0 and 100.");
            return;
        }
        scoresToSave = { 'Overall': totalScore };
    } else { // detailed mode
        let isValid = true;
        const tempSensoryScores = { ...sensoryScores };
        SCA_SENSORY_ATTRIBUTES.forEach(attr => {
            const result = validateScore(tempSensoryScores[attr].value);
            tempSensoryScores[attr] = { ...tempSensoryScores[attr], error: result.error };
            if (result.error) isValid = false;
        });
        setSensoryScores(tempSensoryScores);
        if (!isValid) return alert("Please correct the errors in the detailed scores.");

        totalScore = detailedCalculations.finalScore;
        scoresToSave = {};
        SCA_SENSORY_ATTRIBUTES.forEach(attr => {
            scoresToSave[attr] = parseFloat(sensoryScores[attr].value);
        });
        SCA_CUP_ATTRIBUTES.forEach(attr => {
            scoresToSave[attr] = cupScores[attr] * 2;
        });
    }

    setData(prev => {
        const qcSessionId = `CS-QC-${processorUser.id}`;
        let qcSession = prev.cuppingSessions.find(s => s.id === qcSessionId);
        let newSessions = [...prev.cuppingSessions];

        if (!qcSession) {
            qcSession = {
                id: qcSessionId, name: `${processorUser.name}'s Internal QC`, date: new Date().toISOString().substring(0, 10),
                type: CuppingSessionType.QC, samples: [],
                judges: [{ id: processorUser.id, name: processorUser.name, role: UserRole.Processor }],
                scores: {}, status: 'Finalized',
            };
            newSessions.push(qcSession);
        } else {
            newSessions = newSessions.map(s => s.id === qcSessionId ? {...s} : s);
            qcSession = newSessions.find(s => s.id === qcSessionId)!;
        }

        let sampleInSession = qcSession.samples.find(s => s.greenBeanLotId === scoringLot.id);
        if (!sampleInSession) {
            const parchmentLot = prev.parchmentLots.find(p => p.id === scoringLot.parchmentLotId);
            const harvestLot = prev.harvestLots.find(h => h.id === parchmentLot?.harvestLotId);
            sampleInSession = {
                id: `S${qcSession.samples.length + 1}`, blindCode: scoringLot.id, greenBeanLotId: scoringLot.id,
                submitterInfo: { name: harvestLot?.farmerName || 'N/A' }, originInfo: { farm: harvestLot?.farmPlotLocation || 'N/A' },
                lotInfo: { process: parchmentLot?.processType || 'N/A' },
            };
            qcSession.samples.push(sampleInSession);
        }

        const newScoreEntry: JudgeScore = {
            judgeId: processorUser.id, judgeName: processorUser.name,
            scores: scoresToSave, notes: notes, totalScore,
        };
        
        const existingScores = qcSession.scores[sampleInSession.id] || [];
        const scoreIndex = existingScores.findIndex(s => s.judgeId === processorUser.id);
        if (scoreIndex > -1) existingScores[scoreIndex] = newScoreEntry;
        else existingScores.push(newScoreEntry);
        qcSession.scores[sampleInSession.id] = existingScores;

        const updatedGreenBeanLots = prev.greenBeanLots.map(gbl => {
            if (gbl.id === scoringLot.id) {
                const newCuppingScores = [...gbl.cuppingScores];
                const existingScoreIndex = newCuppingScores.findIndex(cs => cs.sessionId === qcSessionId);
                if (existingScoreIndex > -1) newCuppingScores[existingScoreIndex] = { sessionId: qcSessionId, score: totalScore };
                else newCuppingScores.push({ sessionId: qcSessionId, score: totalScore });
                return { ...gbl, cuppingScores: newCuppingScores };
            }
            return gbl;
        });

        return { ...prev, cuppingSessions: newSessions, greenBeanLots: updatedGreenBeanLots };
    });

    setScoringLot(null);
  };


  // Delete handlers for Admin
  const handleDeleteBatch = (batchId: string) => {
    if (window.confirm('Are you sure you want to delete this processing batch? This will also delete related parchment and green bean lots.')) {
      setData(prev => ({
        ...prev,
        processingBatches: prev.processingBatches.filter(b => b.id !== batchId),
        parchmentLots: prev.parchmentLots.filter(p => p.processingBatchId !== batchId),
        greenBeanLots: prev.greenBeanLots.filter(g => {
          const parchment = prev.parchmentLots.find(p => p.id === g.parchmentLotId);
          return parchment?.processingBatchId !== batchId;
        }),
      }));
    }
  };

  const handleDeleteParchmentLot = (lotId: string) => {
    if (window.confirm('Are you sure you want to delete this parchment lot? This will also delete related green bean lots.')) {
      setData(prev => ({
        ...prev,
        parchmentLots: prev.parchmentLots.filter(p => p.id !== lotId),
        greenBeanLots: prev.greenBeanLots.filter(g => g.parchmentLotId !== lotId),
      }));
    }
  };

  const handleDeleteGreenBeanLot = (lotId: string) => {
    if (window.confirm('Are you sure you want to delete this green bean lot?')) {
      setData(prev => ({
        ...prev,
        greenBeanLots: prev.greenBeanLots.filter(g => g.id !== lotId),
      }));
    }
  };

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);

    switch(modal) {
        case 'startProcessing':
            if (!selectedHarvestLot) return;
            const processType = formData.get('processType') as string;
            setData(prev => {
                const newBatchId = `PB${String(prev.processingBatches.length + 1).padStart(3, '0')}`;
                const newBatch: ProcessingBatch = { id: newBatchId, harvestLotId: selectedHarvestLot.id, status: ProcessingBatchStatus.ToProcess, processType };
                const updatedHarvestLots = prev.harvestLots.map((lot): HarvestLot => lot.id === selectedHarvestLot.id ? { ...lot, status: 'Processing' } : lot);
                return { ...prev, processingBatches: [newBatch, ...prev.processingBatches], harvestLots: updatedHarvestLots };
            });
            break;

        case 'completeBatch':
            if (!selectedBatch) return;
            const parchmentWeightKg = parseFloat(formData.get('parchmentWeightKg') as string);
            const moistureContent = parseFloat(formData.get('moistureContent') as string);
            const dryingStartDate = formData.get('dryingStartDate') as string;
            const dryingEndDate = formData.get('dryingEndDate') as string;

            if (new Date(dryingEndDate) < new Date(dryingStartDate)) {
                alert("Validation Error: Drying End Date cannot be before Drying Start Date.");
                return;
            }

            const details = { parchmentWeightKg, moistureContent, dryingStartDate, dryingEndDate, baggingDate: dryingEndDate };
            
            setData(prev => {
                const updatedBatches = prev.processingBatches.map(b => b.id === selectedBatch.id ? { ...b, status: ProcessingBatchStatus.Completed, ...details } : b);
                const newParchmentId = `PL${String(prev.parchmentLots.length + 1).padStart(3, '0')}`;
                const newParchmentLot: ParchmentLot = { id: newParchmentId, processingBatchId: selectedBatch.id, harvestLotId: selectedBatch.harvestLotId, initialWeightKg: parchmentWeightKg, currentWeightKg: parchmentWeightKg, moistureContent, processType: selectedBatch.processType, status: 'Awaiting Hulling' };
                return { ...prev, processingBatches: updatedBatches, parchmentLots: [newParchmentLot, ...prev.parchmentLots] };
            });
            break;
        
        case 'logTestResults':
             if (!selectedParchment) return;
             const results: PhysicalTestResults = {
                sampleWeightGrams: parseFloat(formData.get('sampleWeightGrams') as string),
                greenBeanWeightGrams: parseFloat(formData.get('greenBeanWeightGrams') as string),
                greenBeanMoisture: parseFloat(formData.get('greenBeanMoisture') as string),
                waterActivity: parseFloat(formData.get('waterActivity') as string),
                density: parseFloat(formData.get('density') as string),
                defectCount: parseInt(formData.get('defectCount') as string),
                notes: formData.get('notes') as string
             };
             setData(prev => ({
                ...prev,
                parchmentLots: prev.parchmentLots.map(p => p.id === selectedParchment.id ? { ...p, physicalTestResults: results, currentWeightKg: p.currentWeightKg - (results.sampleWeightGrams / 1000) } : p)
             }));
            break;
            
        case 'hullAndGrade':
            if (!selectedParchment) return;
            const greenWeight = parseFloat(totalGreenWeight);
             if (Math.abs(gradedWeightSum - greenWeight) > 0.01) {
                alert("Validation Error: The sum of the weights for the graded lots must exactly match the total green bean weight.");
                return;
            }
            
            setData(prev => {
                const newGreenBeanLots: GreenBeanLot[] = gradedLots.map((gl, index) => {
                    const newId = `GBL${String(prev.greenBeanLots.length + index + 1).padStart(3, '0')}`;
                    return {
                        id: newId,
                        parchmentLotId: selectedParchment.id,
                        grade: gl.grade,
                        initialWeightKg: parseFloat(gl.weight),
                        currentWeightKg: parseFloat(gl.weight),
                        availabilityStatus: 'Available',
                        cuppingScores: []
                    };
                });
                
                const updatedParchment = prev.parchmentLots.map(p => p.id === selectedParchment.id ? {...p, status: 'Hulled' as 'Hulled', currentWeightKg: 0 } : p)
                
                return {
                    ...prev,
                    greenBeanLots: [...newGreenBeanLots, ...prev.greenBeanLots],
                    parchmentLots: updatedParchment
                }
            });
            setTotalGreenWeight('');
            setGradedLots([{grade: 'Grade A', weight: ''}]);
            break;

        case 'withdrawStock':
            if(!selectedGreenBean) return;
            const amountKg = parseFloat(formData.get('amountKg') as string);
            const purpose = formData.get('purpose') as string;
            
            setData(prev => ({
                ...prev,
                greenBeanLots: prev.greenBeanLots.map(gbl => {
                    if (gbl.id !== selectedGreenBean.id) return gbl;
                    const withdrawal = { amountKg, purpose, date: new Date().toISOString().substring(0, 10) };
                    return {
                        ...gbl,
                        currentWeightKg: gbl.currentWeightKg - amountKg,
                        withdrawalHistory: [...(gbl.withdrawalHistory || []), withdrawal]
                    }
                })
            }));
            break;
    }
    setModal(null);
  };
  
  const openModal = (type: string, item: any) => {
      if (type === 'startProcessing') setSelectedHarvestLot(item);
      if (type === 'completeBatch') setSelectedBatch(item);
      if (type === 'logTestResults') setSelectedParchment(item);
      if (type === 'hullAndGrade') setSelectedParchment(item);
      if (type === 'withdrawStock') setSelectedGreenBean(item);
      setModal(type);
  }

  const handleToggleAvailability = (lotId: string) => {
    setData(prev => ({ ...prev, greenBeanLots: prev.greenBeanLots.map(lot => lot.id === lotId ? { ...lot, availabilityStatus: lot.availabilityStatus === 'Available' ? 'Withdrawn' : 'Available' } : lot) }));
  };

  const readyForProcessingLots = data.harvestLots.filter(lot => lot.status === 'Ready for Processing');
  
  const TableView = () => (
    <div className="bg-white shadow-lg rounded-2xl overflow-hidden border border-gray-100">
        <table className="min-w-full">
            <thead>
                <tr className="bg-gray-50 border-b border-gray-200">
                    <th scope="col" className="px-6 py-4 text-left text-xs font-bold text-gray-700 uppercase tracking-wider">Batch ID</th>
                    <th scope="col" className="px-6 py-4 text-left text-xs font-bold text-gray-700 uppercase tracking-wider">Harvest Lot</th>
                    <th scope="col" className="px-6 py-4 text-left text-xs font-bold text-gray-700 uppercase tracking-wider">Process</th>
                    <th scope="col" className="px-6 py-4 text-left text-xs font-bold text-gray-700 uppercase tracking-wider">Status</th>
                    <th scope="col" className="px-6 py-4 text-left text-xs font-bold text-gray-700 uppercase tracking-wider">Drying Duration</th>
                </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-100">
                {data.processingBatches.map(b => {
                    const duration = b.dryingStartDate && b.dryingEndDate ? `${(new Date(b.dryingEndDate).getTime() - new Date(b.dryingStartDate).getTime()) / (1000 * 3600 * 24)} days` : 'N/A';
                    return (
                        <tr key={b.id} className="hover:bg-gray-50 transition-colors">
                            <td className="px-6 py-4 whitespace-nowrap">
                                <span className="text-sm font-bold text-gray-900">{b.id}</span>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                                <span className="text-sm text-gray-700">{b.harvestLotId}</span>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                                <div className="flex items-center gap-2">
                                    <div className={`w-2 h-2 rounded-full ${b.processType === 'Washed' ? 'bg-blue-500' : b.processType === 'Natural' ? 'bg-amber-500' : 'bg-yellow-500'}`}></div>
                                    <span className="text-sm font-medium text-gray-900">{b.processType}</span>
                                </div>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                                <span className={`px-3 py-1.5 inline-flex items-center gap-1.5 text-xs font-bold rounded-lg ${
                                    b.status === 'Completed' ? 'bg-green-100 text-green-700 border border-green-200' :
                                    b.status === 'Drying' ? 'bg-blue-100 text-blue-700 border border-blue-200' :
                                    'bg-yellow-100 text-yellow-700 border border-yellow-200'
                                }`}>
                                    {b.status === 'Completed' && <CheckCircle className="h-3 w-3" />}
                                    {b.status === 'Drying' && <Wind className="h-3 w-3" />}
                                    {b.status === 'To Process' && <PlayCircle className="h-3 w-3" />}
                                    {b.status}
                                </span>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                                <span className="text-sm text-gray-700">{duration}</span>
                            </td>
                        </tr>
                    )
                })}
            </tbody>
        </table>
    </div>
  );
  
  const KanbanView = () => (
    <>
      <div className="bg-white shadow-xl rounded-2xl overflow-hidden border border-gray-100 mb-8">
          <div className="p-6 bg-green-50 border-b border-green-200">
              <div className="flex items-center gap-4">
                  <div className="p-4 bg-green-600 rounded-2xl shadow-lg">
                      <Coffee className="h-8 w-8 text-white"/>
                  </div>
                  <div>
                      <h3 className="text-2xl font-bold text-gray-900">Incoming Harvest Lots</h3>
                      <p className="text-sm text-gray-600 mt-1">Cherry ready for processing</p>
                  </div>
              </div>
          </div>
          {readyForProcessingLots.length > 0 ? (
              <div className="p-6 space-y-4">
                  {readyForProcessingLots.map(lot => (
                      <div key={lot.id} className="bg-gray-50 rounded-2xl p-6 border border-gray-200 hover:border-green-400 hover:shadow-lg transition-all duration-200">
                          <div className="flex items-center justify-between">
                              <div className="flex items-center gap-6 flex-1">
                                  <div className="text-center">
                                      <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1">Lot ID</p>
                                      <p className="text-2xl font-bold text-gray-900">{lot.id}</p>
                                  </div>
                                  <div className="h-12 w-px bg-gray-300"></div>
                                  <div>
                                      <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1">Variety</p>
                                      <p className="text-lg font-semibold text-gray-800">{lot.cherryVariety}</p>
                                  </div>
                                  <div className="h-12 w-px bg-gray-300"></div>
                                  <div>
                                      <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1">Weight</p>
                                      <p className="text-lg font-bold text-green-600">{lot.weightKg} kg</p>
                                  </div>
                              </div>
                              <button
                                  onClick={() => openModal('startProcessing', lot)}
                                  className="inline-flex items-center gap-3 px-6 py-3 text-base font-bold rounded-xl shadow-lg text-white bg-blue-600 hover:bg-blue-700 hover:shadow-xl transform hover:-translate-y-0.5 transition-all duration-200"
                              >
                                  <PlayCircle className="h-6 w-6"/>
                                  <span>Start Processing</span>
                              </button>
                          </div>
                      </div>
                  ))}
              </div>
          ) : (
              <div className="flex flex-col items-center justify-center py-16 text-gray-400">
                  <div className="p-6 bg-gray-100 rounded-full mb-4">
                      <Coffee className="h-20 w-20 opacity-30" />
                  </div>
                  <p className="text-lg font-semibold text-gray-600">No harvest lots available</p>
                  <p className="text-sm text-gray-500 mt-1">New lots will appear here when ready</p>
              </div>
          )}
      </div>
      <div className="flex flex-col md:flex-row space-y-4 md:space-y-0 md:space-x-6">
        {[
          { title: 'To Process', status: ProcessingBatchStatus.ToProcess, icon: <Coffee className="h-6 w-6 text-white" />, color: 'border-amber-400' },
          { title: 'Drying', status: ProcessingBatchStatus.Drying, icon: <Wind className="h-6 w-6 text-white" />, color: 'border-blue-400' },
          { title: 'Completed', status: ProcessingBatchStatus.Completed, icon: <PackageCheck className="h-6 w-6 text-white" />, color: 'border-green-400' },
        ].map(col => (
          <KanbanColumn key={col.status} {...col} batches={data.processingBatches.filter(b => b.status === col.status)} onDrop={handleDrop} onDragOver={handleDragOver} onDragStart={handleDragStart} />
        ))}
      </div>
      <style>{`
        .custom-scrollbar::-webkit-scrollbar {
          width: 6px;
        }
        .custom-scrollbar::-webkit-scrollbar-track {
          background: #f3f4f6;
          border-radius: 10px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb {
          background: #d97706;
          border-radius: 10px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover {
          background: #b45309;
        }
      `}</style>
    </>
  );

    // --- Table Logic ---
    const SortableHeader = <T,>({ column, label, sortConfig, requestSort }: { column: T, label: string, sortConfig: { key: T, direction: SortDirection }, requestSort: (key: T) => void }) => (
        <th scope="col" className="px-6 py-4 text-left text-xs font-bold text-gray-900 uppercase tracking-wider">
            <button onClick={() => requestSort(column)} className="flex items-center gap-1 hover:text-indigo-600 transition-colors">
                {label}
                {sortConfig.key === column && (sortConfig.direction === 'asc' ? <ArrowUp className="h-3 w-3" /> : <ArrowDown className="h-3 w-3" />)}
            </button>
        </th>
    );

    const Pagination = ({ currentPage, totalPages, onPageChange }: { currentPage: number, totalPages: number, onPageChange: (page: number) => void }) => {
        if (totalPages <= 1) return null;
        return (
            <div className="flex justify-between items-center px-6 py-4 bg-gray-50 border-t border-gray-200">
                <button
                    onClick={() => onPageChange(currentPage - 1)}
                    disabled={currentPage === 1}
                    className="px-4 py-2 text-sm font-medium border border-gray-300 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed hover:bg-white hover:shadow-sm transition-all"
                >
                    Previous
                </button>
                <span className="text-sm font-medium text-gray-700">
                    Page <span className="font-bold text-gray-900">{currentPage}</span> of <span className="font-bold text-gray-900">{totalPages}</span>
                </span>
                <button
                    onClick={() => onPageChange(currentPage + 1)}
                    disabled={currentPage === totalPages}
                    className="px-4 py-2 text-sm font-medium border border-gray-300 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed hover:bg-white hover:shadow-sm transition-all"
                >
                    Next
                </button>
            </div>
        );
    };

    const processedParchmentLots = useMemo(() => {
        const filtered = data.parchmentLots.filter(p =>
            p.id.toLowerCase().includes(parchmentSearch.toLowerCase()) ||
            p.status.toLowerCase().includes(parchmentSearch.toLowerCase())
        );

        return filtered.sort((a, b) => {
            const key = parchmentSortConfig.key;
            if (a[key] < b[key]) return parchmentSortConfig.direction === 'asc' ? -1 : 1;
            if (a[key] > b[key]) return parchmentSortConfig.direction === 'asc' ? 1 : -1;
            return 0;
        });
    }, [data.parchmentLots, parchmentSearch, parchmentSortConfig]);

    const parchmentPageCount = Math.ceil(processedParchmentLots.length / ITEMS_PER_PAGE);
    const paginatedParchmentLots = processedParchmentLots.slice((parchmentCurrentPage - 1) * ITEMS_PER_PAGE, parchmentCurrentPage * ITEMS_PER_PAGE);

    const enrichedGreenBeanLots = useMemo(() => {
        const qcSessionId = processorUser ? `CS-QC-${processorUser.id}` : '';
        return data.greenBeanLots.map(gbl => {
            const qcScoreData = gbl.cuppingScores.find(cs => cs.sessionId === qcSessionId);
            return { ...gbl, qcScore: qcScoreData?.score };
        });
    }, [data.greenBeanLots, processorUser]);

    const processedGreenBeanLots = useMemo(() => {
        const filtered = enrichedGreenBeanLots.filter(g =>
            g.id.toLowerCase().includes(greenBeanSearch.toLowerCase()) ||
            g.grade.toLowerCase().includes(greenBeanSearch.toLowerCase())
        );

        return filtered.sort((a, b) => {
            const key = greenBeanSortConfig.key as keyof typeof a;
            const aValue = a[key] ?? -1;
            const bValue = b[key] ?? -1;
            if (aValue < bValue) return greenBeanSortConfig.direction === 'asc' ? -1 : 1;
            if (aValue > bValue) return greenBeanSortConfig.direction === 'asc' ? 1 : -1;
            return 0;
        });
    }, [enrichedGreenBeanLots, greenBeanSearch, greenBeanSortConfig]);
    
    const greenBeanPageCount = Math.ceil(processedGreenBeanLots.length / ITEMS_PER_PAGE);
    const paginatedGreenBeanLots = processedGreenBeanLots.slice((greenBeanCurrentPage - 1) * ITEMS_PER_PAGE, greenBeanCurrentPage * ITEMS_PER_PAGE);

  return (
    <div className="space-y-6">
      {/* Header Section */}
      <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Processor Workbench</h1>
            <p className="text-gray-600 text-sm mt-1">Manage processing batches, parchment, and green bean inventory</p>
          </div>
          <div className="flex items-center gap-2 p-1 bg-gray-100 rounded-lg">
            <button onClick={() => setViewMode('kanban')} className={`flex items-center gap-2 px-4 py-2 text-sm font-semibold rounded-lg transition-colors ${viewMode === 'kanban' ? 'bg-white text-indigo-600 shadow-sm' : 'text-gray-600 hover:text-gray-900'}`}>
              <LayoutGrid className="h-4 w-4"/> Workflow
            </button>
            <button onClick={() => setViewMode('table')} className={`flex items-center gap-2 px-4 py-2 text-sm font-semibold rounded-lg transition-colors ${viewMode === 'table' ? 'bg-white text-indigo-600 shadow-sm' : 'text-gray-600 hover:text-gray-900'}`}>
              <List className="h-4 w-4"/> Data Grid
            </button>
          </div>
        </div>
      </div>
      
      {viewMode === 'kanban' ? <KanbanView/> : <TableView/>}

      <div className="mt-8 grid grid-cols-1 xl:grid-cols-2 gap-8">
        {/* Parchment Inventory */}
        <div className="bg-white shadow-xl rounded-2xl overflow-hidden flex flex-col border border-gray-100">
            <div className="p-6 bg-amber-50 border-b border-amber-200">
                <div className="flex items-center gap-3 mb-4">
                    <div className="p-3 bg-amber-600 rounded-xl shadow-md">
                        <Box className="h-6 w-6 text-white"/>
                    </div>
                    <div>
                        <h3 className="text-2xl font-bold text-gray-900">Parchment Stock</h3>
                        <p className="text-sm text-gray-600">Dried coffee ready for hulling</p>
                    </div>
                </div>
                <div className="relative">
                    <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400"/>
                    <input type="text" placeholder="Search lots..." value={parchmentSearch} onChange={e => { setParchmentSearch(e.target.value); setParchmentCurrentPage(1); }} className="pl-12 w-full border border-gray-300 rounded-xl py-3 px-4 text-sm focus:ring-2 focus:ring-amber-500 focus:border-amber-500 shadow-sm"/>
                </div>
            </div>
            <div className="p-6 space-y-4 flex-grow">
                {paginatedParchmentLots.length === 0 ? (
                    <div className="text-center py-12 text-gray-400">
                        <Box className="h-16 w-16 mx-auto mb-3 opacity-30" />
                        <p className="text-sm font-medium">No matching parchment lots found</p>
                    </div>
                ) : (
                    paginatedParchmentLots.map(p => (
                        <div key={p.id} className={`${p.status === 'Hulled' ? 'bg-gray-50' : 'bg-amber-50'} rounded-2xl p-4 sm:p-6 border ${p.status === 'Hulled' ? 'border-gray-200' : 'border-amber-200'} hover:shadow-xl transition-all duration-200`}>
                            {/* Card Header */}
                            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 mb-4">
                                <div className="flex items-center gap-3 sm:gap-4">
                                    <div className={`p-2 sm:p-3 ${p.status === 'Hulled' ? 'bg-gray-300' : 'bg-amber-500'} rounded-xl shadow-md`}>
                                        <Box className="h-5 w-5 sm:h-6 sm:w-6 text-white" />
                                    </div>
                                    <div>
                                        <p className="text-xl sm:text-2xl font-bold text-gray-900">{p.id}</p>
                                        <p className="text-xs sm:text-sm text-gray-600 mt-0.5">Parchment Lot</p>
                                    </div>
                                </div>
                                <div className={`px-3 sm:px-4 py-1.5 sm:py-2 rounded-xl text-xs sm:text-sm font-bold ${p.status === 'Hulled' ? 'bg-gray-200 text-gray-700' : 'bg-green-100 text-green-700 border border-green-400'}`}>
                                    {p.status}
                                </div>
                            </div>

                            {/* Card Body - Info Grid */}
                            <div className="grid grid-cols-2 gap-3 sm:gap-4 mb-4">
                                <div className="bg-white/80 backdrop-blur rounded-xl p-3 sm:p-4 border border-amber-200/50">
                                    <div className="flex items-center gap-1.5 sm:gap-2 mb-1 sm:mb-2">
                                        <Scale className="h-3 w-3 sm:h-4 sm:w-4 text-gray-500" />
                                        <p className="text-[10px] sm:text-xs font-bold text-gray-500 uppercase tracking-wider">Weight</p>
                                    </div>
                                    <p className="text-2xl sm:text-3xl font-bold text-amber-600">{p.currentWeightKg.toFixed(2)}</p>
                                    <p className="text-[10px] sm:text-xs text-gray-500 mt-0.5 sm:mt-1">kilograms</p>
                                </div>
                                <div className="bg-white/80 backdrop-blur rounded-xl p-3 sm:p-4 border border-amber-200/50">
                                    <div className="flex items-center gap-1.5 sm:gap-2 mb-1 sm:mb-2">
                                        <Droplet className="h-3 w-3 sm:h-4 sm:w-4 text-gray-500" />
                                        <p className="text-[10px] sm:text-xs font-bold text-gray-500 uppercase tracking-wider">Moisture</p>
                                    </div>
                                    <p className="text-2xl sm:text-3xl font-bold text-blue-600">{p.moistureContent}%</p>
                                    <p className="text-[10px] sm:text-xs text-gray-500 mt-0.5 sm:mt-1">content</p>
                                </div>
                            </div>

                            {/* Test Results (if available) */}
                            {p.physicalTestResults && (
                                <div className="bg-indigo-50/80 backdrop-blur rounded-xl p-3 sm:p-4 border border-indigo-200 mb-4">
                                    <div className="flex items-center gap-2 mb-2 sm:mb-3">
                                        <Microscope className="h-4 w-4 sm:h-5 sm:w-5 text-indigo-600" />
                                        <span className="text-xs sm:text-sm font-bold text-indigo-900 uppercase tracking-wide">Lab Analysis</span>
                                    </div>
                                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 sm:gap-3">
                                        <div className="text-center">
                                            <p className="text-[10px] sm:text-xs font-semibold text-gray-600 mb-0.5 sm:mb-1">Moisture</p>
                                            <p className="text-base sm:text-xl font-bold text-indigo-600">{p.physicalTestResults.greenBeanMoisture}%</p>
                                        </div>
                                        <div className="text-center">
                                            <p className="text-[10px] sm:text-xs font-semibold text-gray-600 mb-0.5 sm:mb-1">aW</p>
                                            <p className="text-base sm:text-xl font-bold text-indigo-600">{p.physicalTestResults.waterActivity}</p>
                                        </div>
                                        <div className="text-center">
                                            <p className="text-[10px] sm:text-xs font-semibold text-gray-600 mb-0.5 sm:mb-1">Density</p>
                                            <p className="text-base sm:text-xl font-bold text-indigo-600">{p.physicalTestResults.density}</p>
                                        </div>
                                        <div className="text-center">
                                            <p className="text-[10px] sm:text-xs font-semibold text-gray-600 mb-0.5 sm:mb-1">Defects</p>
                                            <p className="text-base sm:text-xl font-bold text-red-600">{p.physicalTestResults.defectCount}</p>
                                        </div>
                                    </div>
                                </div>
                            )}

                            {/* Actions */}
                            <div className="flex flex-col sm:flex-row gap-2 sm:gap-3">
                                <button
                                    onClick={() => openModal('logTestResults', p)}
                                    disabled={!!p.physicalTestResults || p.status === 'Hulled'}
                                    className="flex-1 inline-flex items-center justify-center gap-2 px-4 py-3 bg-white border border-indigo-300 text-indigo-700 text-sm font-bold rounded-xl shadow-sm hover:bg-indigo-50 hover:border-indigo-400 hover:shadow-md disabled:bg-gray-50 disabled:border-gray-200 disabled:cursor-not-allowed disabled:text-gray-400 transition-all duration-200"
                                >
                                    <Microscope className="h-5 w-5"/> <span className="hidden sm:inline">Lab Test</span><span className="sm:hidden">Test</span>
                                </button>
                                <button
                                    onClick={() => openModal('hullAndGrade', p)}
                                    disabled={p.status === 'Hulled'}
                                    className="flex-1 inline-flex items-center justify-center gap-2 px-4 py-3 text-sm font-bold rounded-xl shadow-md text-white bg-green-600 hover:bg-green-700 hover:shadow-lg disabled:bg-gray-300 disabled:text-gray-500 disabled:cursor-not-allowed transition-all duration-200 hover:scale-105"
                                >
                                    <ChevronsRight className="h-5 w-5"/> Hull & Grade
                                </button>
                            </div>
                        </div>
                    ))
                )}
            </div>
            <Pagination currentPage={parchmentCurrentPage} totalPages={parchmentPageCount} onPageChange={setParchmentCurrentPage} />
        </div>
        
        {/* Green Bean Inventory */}
        <div className="bg-white shadow-xl rounded-2xl overflow-hidden flex flex-col border border-gray-100">
            <div className="p-6 bg-green-50 border-b border-green-200">
                <div className="flex items-center gap-3 mb-4">
                    <div className="p-3 bg-green-600 rounded-xl shadow-md">
                        <Coffee className="h-6 w-6 text-white"/>
                    </div>
                    <div>
                        <h3 className="text-2xl font-bold text-gray-900">Green Bean Stock</h3>
                        <p className="text-sm text-gray-600">Hulled and graded inventory</p>
                    </div>
                </div>
                <div className="relative">
                    <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400"/>
                    <input type="text" placeholder="Search lots..." value={greenBeanSearch} onChange={e => { setGreenBeanSearch(e.target.value); setGreenBeanCurrentPage(1); }} className="pl-12 w-full border border-gray-300 rounded-xl py-3 px-4 text-sm focus:ring-2 focus:ring-green-500 focus:border-green-500 shadow-sm"/>
                </div>
            </div>
            <div className="p-6 space-y-4 flex-grow">
                {paginatedGreenBeanLots.length === 0 ? (
                    <div className="text-center py-12 text-gray-400">
                        <Coffee className="h-16 w-16 mx-auto mb-3 opacity-30" />
                        <p className="text-sm font-medium">No matching green bean lots found</p>
                    </div>
                ) : (
                    paginatedGreenBeanLots.map(g => (
                        <div key={g.id} className={`${g.availabilityStatus === 'Withdrawn' ? 'bg-gray-50' : 'bg-green-50'} rounded-2xl p-4 sm:p-6 border ${g.availabilityStatus === 'Withdrawn' ? 'border-gray-200' : 'border-green-200'} hover:shadow-xl transition-all duration-200`}>
                            {/* Card Header */}
                            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 mb-4">
                                <div className="flex items-center gap-3 sm:gap-4">
                                    <div className={`p-2 sm:p-3 ${g.availabilityStatus === 'Withdrawn' ? 'bg-gray-400' : 'bg-green-500'} rounded-xl shadow-md`}>
                                        <Coffee className="h-5 w-5 sm:h-6 sm:w-6 text-white" />
                                    </div>
                                    <div>
                                        <p className="text-xl sm:text-2xl font-bold text-gray-900">{g.id}</p>
                                        <p className="text-xs sm:text-sm text-gray-600 mt-0.5">Green Bean Lot</p>
                                    </div>
                                </div>
                                <button
                                    onClick={() => handleToggleAvailability(g.id)}
                                    className={`px-3 sm:px-4 py-1.5 sm:py-2 rounded-xl text-xs sm:text-sm font-bold inline-flex items-center gap-1.5 sm:gap-2 transition-all ${g.availabilityStatus === 'Available' ? 'bg-green-100 text-green-800 border border-green-400 hover:bg-green-200' : 'bg-gray-200 text-gray-700 border border-gray-400 hover:bg-gray-300'}`}
                                >
                                    {g.availabilityStatus === 'Available' ? <CheckCircle className="h-4 w-4 sm:h-5 sm:w-5" /> : <Archive className="h-4 w-4 sm:h-5 sm:w-5" />}
                                    <span className="hidden sm:inline">{g.availabilityStatus}</span>
                                    <span className="sm:hidden">{g.availabilityStatus === 'Available' ? 'Active' : 'Off'}</span>
                                </button>
                            </div>

                            {/* Card Body - Info Grid */}
                            <div className="grid grid-cols-3 gap-2 sm:gap-4 mb-4">
                                <div className="bg-white/80 backdrop-blur rounded-xl p-2 sm:p-4 border border-green-200/50">
                                    <div className="flex items-center gap-1 sm:gap-2 mb-1 sm:mb-2">
                                        <Star className="h-3 w-3 sm:h-4 sm:w-4 text-gray-500" />
                                        <p className="text-[10px] sm:text-xs font-bold text-gray-500 uppercase tracking-wider">Grade</p>
                                    </div>
                                    <p className="text-lg sm:text-3xl font-bold text-green-600">{g.grade}</p>
                                    <p className="text-[10px] sm:text-xs text-gray-500 mt-0.5 sm:mt-1">quality</p>
                                </div>
                                <div className="bg-white/80 backdrop-blur rounded-xl p-2 sm:p-4 border border-green-200/50">
                                    <div className="flex items-center gap-1 sm:gap-2 mb-1 sm:mb-2">
                                        <Scale className="h-3 w-3 sm:h-4 sm:w-4 text-gray-500" />
                                        <p className="text-[10px] sm:text-xs font-bold text-gray-500 uppercase tracking-wider">Weight</p>
                                    </div>
                                    <p className="text-lg sm:text-3xl font-bold text-emerald-600">{g.currentWeightKg.toFixed(2)}</p>
                                    <p className="text-[10px] sm:text-xs text-gray-500 mt-0.5 sm:mt-1">kg</p>
                                </div>
                                <div className="bg-white/80 backdrop-blur rounded-xl p-2 sm:p-4 border border-purple-200/50">
                                    <div className="flex items-center gap-1 sm:gap-2 mb-1 sm:mb-2">
                                        <TrendingUp className="h-3 w-3 sm:h-4 sm:w-4 text-gray-500" />
                                        <p className="text-[10px] sm:text-xs font-bold text-gray-500 uppercase tracking-wider">Score</p>
                                    </div>
                                    {g.qcScore ? (
                                        <>
                                            <p className="text-lg sm:text-3xl font-bold text-purple-600">{g.qcScore.toFixed(2)}</p>
                                            <p className="text-[10px] sm:text-xs text-gray-500 mt-0.5 sm:mt-1">/ 100</p>
                                        </>
                                    ) : (
                                        <>
                                            <p className="text-lg sm:text-3xl font-bold text-gray-400">N/A</p>
                                            <p className="text-[10px] sm:text-xs text-gray-400 mt-0.5 sm:mt-1">none</p>
                                        </>
                                    )}
                                </div>
                            </div>

                            {/* Actions */}
                            <div className="flex flex-col sm:flex-row gap-2 sm:gap-3">
                                {g.withdrawalHistory && g.withdrawalHistory.length > 0 && (
                                    <button
                                        onClick={() => setSelectedGreenBeanForHistory(g)}
                                        className="inline-flex items-center justify-center px-4 py-3 bg-white border border-gray-300 text-gray-700 text-sm font-bold rounded-xl shadow-sm hover:bg-gray-50 hover:border-gray-400 hover:shadow-md transition-all duration-200"
                                        title="View Withdrawal History"
                                    >
                                        <History className="h-5 w-5"/>
                                        <span className="ml-2 sm:hidden">History</span>
                                    </button>
                                )}
                                <button
                                    onClick={() => setScoringLot(g)}
                                    className="flex-1 inline-flex items-center justify-center gap-2 px-4 py-3 bg-white border border-amber-300 text-amber-700 text-sm font-bold rounded-xl shadow-sm hover:bg-amber-50 hover:border-amber-400 hover:shadow-md transition-all duration-200"
                                >
                                    <Star className="h-5 w-5"/> <span className="hidden sm:inline">QC Score</span><span className="sm:hidden">Score</span>
                                </button>
                                <button
                                    onClick={() => openModal('withdrawStock', g)}
                                    disabled={g.availabilityStatus === 'Withdrawn'}
                                    className="flex-1 inline-flex items-center justify-center gap-2 px-4 py-3 text-sm font-bold rounded-xl shadow-md text-white bg-indigo-600 hover:bg-indigo-700 hover:shadow-lg disabled:bg-gray-300 disabled:text-gray-500 disabled:cursor-not-allowed transition-all duration-200 hover:scale-105"
                                >
                                    <ChevronsRight className="h-5 w-5"/> Withdraw
                                </button>
                            </div>
                        </div>
                    ))
                )}
            </div>
             <Pagination currentPage={greenBeanCurrentPage} totalPages={greenBeanPageCount} onPageChange={setGreenBeanCurrentPage} />
        </div>
      </div>

      {modal && <ModalPortal><div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-hidden border border-gray-100 flex flex-col">
            <form onSubmit={handleSubmit} className="flex flex-col h-full overflow-y-auto p-8">
              { modal === 'startProcessing' && selectedHarvestLot && <>
                <div className="flex items-center gap-4 mb-8">
                  <div className="p-4 bg-blue-100 rounded-xl shadow-md">
                    <PlayCircle className="h-10 w-10 text-blue-600" />
                  </div>
                  <div>
                    <h2 className="text-3xl font-bold text-gray-900">Start Processing</h2>
                    <p className="text-base text-gray-600 mt-1">Lot #{selectedHarvestLot.id}</p>
                  </div>
                </div>
                <div className="bg-gray-50 rounded-2xl p-8 mb-8 border border-gray-200 shadow-sm">
                  <div className="grid grid-cols-3 gap-8">
                    <div className="text-center">
                      <p className="text-xs font-bold text-gray-500 uppercase mb-3 tracking-wider">Variety</p>
                      <p className="text-2xl font-bold text-gray-900">{selectedHarvestLot.cherryVariety}</p>
                    </div>
                    <div className="text-center border-l-2 border-gray-300">
                      <p className="text-xs font-bold text-gray-500 uppercase mb-3 tracking-wider">Weight</p>
                      <p className="text-2xl font-bold text-green-600">{selectedHarvestLot.weightKg} kg</p>
                    </div>
                    <div className="text-center border-l-2 border-gray-300">
                      <p className="text-xs font-bold text-gray-500 uppercase mb-3 tracking-wider">Farmer</p>
                      <p className="text-2xl font-bold text-gray-900">{selectedHarvestLot.farmerName}</p>
                    </div>
                  </div>
                </div>
                <div className="mb-6">
                  <label htmlFor="processType" className="block text-base font-bold text-gray-700 mb-3">Select Process Type</label>
                  <ProcessTypeDropdown
                    value={selectedProcessType}
                    onChange={setSelectedProcessType}
                  />
                  <input type="hidden" name="processType" value={selectedProcessType} />
                </div>
              </>}
              { modal === 'completeBatch' && selectedBatch && <>
                <h2 className="text-2xl font-bold mb-4">Log Parchment Data for Batch #{selectedBatch.id}</h2>
                <div className="space-y-4">
                    <div><label className="block text-sm font-medium">Parchment Weight (kg)</label><input type="number" step="0.1" name="parchmentWeightKg" required className="mt-1 block w-full border-gray-300 rounded-md py-2 px-3" /></div>
                    <div><label className="block text-sm font-medium">Moisture Content (%)</label><input type="number" step="0.1" name="moistureContent" required className="mt-1 block w-full border-gray-300 rounded-md py-2 px-3" /></div>
                    <div><label className="block text-sm font-medium">Drying Start Date</label><input type="date" name="dryingStartDate" required defaultValue={selectedBatch.dryingStartDate || ''} className="mt-1 block w-full border-gray-300 rounded-md py-2 px-3" /></div>
                    <div><label className="block text-sm font-medium">Drying End Date</label><input type="date" name="dryingEndDate" required className="mt-1 block w-full border-gray-300 rounded-md py-2 px-3" /></div>
                </div>
              </>}
              { modal === 'logTestResults' && selectedParchment && <>
                <h2 className="text-2xl font-bold mb-4 flex items-center"><Beaker className="mr-2"/> Log Physical Test Results</h2>
                <p className="text-sm text-gray-600 mb-4">For parchment lot <strong>{selectedParchment.id}</strong>. The sample weight will be deducted from the lot total.</p>
                <div className="space-y-3">
                    <div className="grid grid-cols-2 gap-3">
                        <div><label className="block text-xs font-medium">Sample Parchment Weight (g)</label><input type="number" name="sampleWeightGrams" required className="mt-1 block w-full border-gray-300 rounded-md text-sm p-2" /></div>
                        <div><label className="block text-xs font-medium">Resulting Green Weight (g)</label><input type="number" name="greenBeanWeightGrams" required className="mt-1 block w-full border-gray-300 rounded-md text-sm p-2" /></div>
                        <div><label className="block text-xs font-medium">Green Moisture (%)</label><input type="number" step="0.1" name="greenBeanMoisture" required className="mt-1 block w-full border-gray-300 rounded-md text-sm p-2" /></div>
                        <div><label className="block text-xs font-medium">Water Activity (aW)</label><input type="number" step="0.01" name="waterActivity" required className="mt-1 block w-full border-gray-300 rounded-md text-sm p-2" /></div>
                        <div><label className="block text-xs font-medium">Density</label><input type="number" step="0.01" name="density" required className="mt-1 block w-full border-gray-300 rounded-md text-sm p-2" /></div>
                        <div><label className="block text-xs font-medium">Defect Count</label><input type="number" name="defectCount" required className="mt-1 block w-full border-gray-300 rounded-md text-sm p-2" /></div>
                    </div>
                    <div><label className="block text-xs font-medium">Notes</label><textarea name="notes" rows={2} className="mt-1 block w-full border-gray-300 rounded-md text-sm p-2"></textarea></div>
                </div>
              </>}
              { modal === 'hullAndGrade' && selectedParchment && (() => {
                 const totalWeightNum = parseFloat(totalGreenWeight) || 0;
                 const weightMismatch = totalWeightNum > 0 && Math.abs(gradedWeightSum - totalWeightNum) > 0.01;
                 const weightLossPercent = totalGreenWeight ? (((selectedParchment.currentWeightKg - parseFloat(totalGreenWeight)) / selectedParchment.currentWeightKg) * 100).toFixed(1) : '0';

                 return <>
                    {/* Modal Header */}
                    <div className="flex items-center gap-4 mb-6">
                      <div className="p-4 bg-green-600 rounded-2xl shadow-lg">
                        <ChevronsRight className="h-10 w-10 text-white" />
                      </div>
                      <div>
                        <h2 className="text-3xl font-bold text-gray-900">Hull & Grade</h2>
                        <p className="text-base text-gray-600 mt-1">Parchment Lot #{selectedParchment.id}</p>
                      </div>
                    </div>

                    {/* Parchment Info Card */}
                    <div className="bg-amber-50 rounded-2xl p-6 mb-6 border border-amber-200">
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <p className="text-xs font-bold text-gray-500 uppercase tracking-wide mb-1">Parchment Weight</p>
                          <p className="text-3xl font-bold text-amber-600">{selectedParchment.currentWeightKg.toFixed(2)}</p>
                          <p className="text-xs text-gray-500 mt-1">kilograms</p>
                        </div>
                        <div>
                          <p className="text-xs font-bold text-gray-500 uppercase tracking-wide mb-1">Moisture</p>
                          <p className="text-3xl font-bold text-blue-600">{selectedParchment.moistureContent}%</p>
                          <p className="text-xs text-gray-500 mt-1">content</p>
                        </div>
                      </div>
                    </div>

                    {/* Total Green Bean Weight Input */}
                    <div className="mb-6">
                      <label className="block text-base font-bold text-gray-700 mb-3">
                        <div className="flex items-center gap-2">
                          <Scale className="h-5 w-5 text-green-600" />
                          Total Green Bean Weight
                        </div>
                      </label>
                      <input
                        type="number"
                        step="0.1"
                        value={totalGreenWeight}
                        onChange={e => setTotalGreenWeight(e.target.value)}
                        required
                        placeholder="Enter total weight in kg"
                        className="mt-1 block w-full border border-gray-300 rounded-xl py-3 px-4 text-lg font-semibold focus:ring-2 focus:ring-green-500 focus:border-green-500 shadow-sm transition-all"
                      />
                      {totalGreenWeight && (
                        <div className="mt-3 flex items-center justify-between bg-blue-50 rounded-xl p-4 border border-blue-200">
                          <span className="text-sm font-semibold text-gray-700">Weight Loss from Hulling</span>
                          <span className="text-2xl font-bold text-blue-600">{weightLossPercent}%</span>
                        </div>
                      )}
                    </div>

                    {/* Divider */}
                    <div className="relative my-6">
                      <div className="absolute inset-0 flex items-center">
                        <div className="w-full border-t-2 border-gray-300"></div>
                      </div>
                      <div className="relative flex justify-center">
                        <span className="bg-white px-4 text-sm font-bold text-gray-500 uppercase tracking-wider">Create Graded Lots</span>
                      </div>
                    </div>

                    {/* Graded Lots Section */}
                    <div className="space-y-3 mb-4">
                      {gradedLots.map((lot, index) => (
                        <div key={index} className="bg-green-50 rounded-xl p-4 border border-green-200">
                          <div className="flex items-center gap-3">
                            <div className="flex-shrink-0 w-10 h-10 bg-green-600 rounded-xl flex items-center justify-center">
                              <span className="text-white font-bold text-lg">#{index + 1}</span>
                            </div>
                            <div className="flex-1 grid grid-cols-2 gap-3">
                              <div>
                                <label className="block text-xs font-bold text-gray-600 mb-1 uppercase tracking-wide">Grade</label>
                                <GradeDropdown
                                  value={lot.grade}
                                  onChange={(value) => setGradedLots(gradedLots.map((l, i) => i === index ? {...l, grade: value} : l))}
                                  index={index}
                                />
                              </div>
                              <div>
                                <label className="block text-xs font-bold text-gray-600 mb-1 uppercase tracking-wide">Weight (kg)</label>
                                <input
                                  type="number"
                                  step="0.1"
                                  placeholder="0.00"
                                  value={lot.weight}
                                  onChange={e => setGradedLots(gradedLots.map((l, i) => i === index ? {...l, weight: e.target.value} : l))}
                                  required
                                  className="block w-full border border-gray-300 rounded-lg py-2 px-3 text-sm font-semibold focus:ring-2 focus:ring-green-500 focus:border-green-500"
                                />
                              </div>
                            </div>
                            <button
                              type="button"
                              onClick={() => setGradedLots(gradedLots.filter((_, i) => i !== index))}
                              disabled={gradedLots.length <= 1}
                              className="flex-shrink-0 p-2.5 rounded-lg text-red-600 hover:bg-red-50 disabled:opacity-30 disabled:cursor-not-allowed transition-all"
                              title="Remove this grade"
                            >
                              <Trash2 size={20}/>
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>

                    {/* Add Grade Button */}
                    <button
                      type="button"
                      onClick={() => setGradedLots([...gradedLots, {grade: '', weight: ''}])}
                      className="w-full py-3 px-4 border border-dashed border-green-300 rounded-xl text-sm font-bold text-green-600 hover:bg-green-50 hover:border-green-400 transition-all flex items-center justify-center gap-2"
                    >
                      <Plus size={18}/> Add Another Grade
                    </button>

                    {/* Total Summary Card */}
                    <div className={`mt-6 rounded-2xl p-6 border shadow-lg transition-all ${weightMismatch ? 'bg-red-50 border-red-300' : 'bg-green-50 border-green-300'}`}>
                      <div className="flex items-center justify-between mb-3">
                        <span className="text-sm font-bold text-gray-700 uppercase tracking-wide">Total Accounted For</span>
                        {weightMismatch ? (
                          <AlertCircle className="h-6 w-6 text-red-600" />
                        ) : (
                          <Check className="h-6 w-6 text-green-600" />
                        )}
                      </div>
                      <div className="flex items-baseline gap-2 mb-2">
                        <span className={`text-4xl font-extrabold ${weightMismatch ? 'text-red-600' : 'text-green-600'}`}>
                          {gradedWeightSum.toFixed(2)}
                        </span>
                        <span className="text-2xl font-bold text-gray-400">/</span>
                        <span className="text-2xl font-bold text-gray-600">{totalWeightNum.toFixed(2)} kg</span>
                      </div>
                      {weightMismatch && (
                        <div className="mt-3 flex items-start gap-2 bg-red-100 rounded-lg p-3 border border-red-200">
                          <AlertCircle size={16} className="text-red-600 flex-shrink-0 mt-0.5" />
                          <p className="text-xs font-semibold text-red-800">
                            The sum of graded lots must exactly match the total green bean weight.
                          </p>
                        </div>
                      )}
                      {!weightMismatch && totalWeightNum > 0 && (
                        <div className="mt-3 flex items-center gap-2 bg-green-100 rounded-lg p-3 border border-green-200">
                          <Check size={16} className="text-green-600 flex-shrink-0" />
                          <p className="text-xs font-semibold text-green-800">
                            Perfect! All weights are accounted for.
                          </p>
                        </div>
                      )}
                    </div>
                 </>
              })()}
              { modal === 'withdrawStock' && selectedGreenBean && <>
                {/* Modal Header */}
                <div className="flex items-center gap-4 mb-6">
                  <div className="p-4 bg-indigo-600 rounded-2xl shadow-lg">
                    <ChevronsRight className="h-10 w-10 text-white" />
                  </div>
                  <div>
                    <h2 className="text-3xl font-bold text-gray-900">Withdraw Stock</h2>
                    <p className="text-base text-gray-600 mt-1">Green Bean Lot #{selectedGreenBean.id}</p>
                  </div>
                </div>

                {/* Current Stock Info Card */}
                <div className="bg-green-50 rounded-2xl p-6 mb-6 border border-green-200">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-xs font-bold text-gray-500 uppercase tracking-wide mb-1">Current Stock</p>
                      <p className="text-4xl font-bold text-green-600">{selectedGreenBean.currentWeightKg.toFixed(2)}</p>
                      <p className="text-xs text-gray-500 mt-1">kilograms available</p>
                    </div>
                    <div className="text-right">
                      <p className="text-xs font-bold text-gray-500 uppercase tracking-wide mb-1">Grade</p>
                      <p className="text-2xl font-bold text-gray-900">{selectedGreenBean.grade}</p>
                    </div>
                  </div>
                </div>

                {/* Withdraw Amount Input */}
                <div className="mb-6">
                  <label className="block text-base font-bold text-gray-700 mb-3">
                    <div className="flex items-center gap-2">
                      <Scale className="h-5 w-5 text-indigo-600" />
                      Amount to Withdraw
                    </div>
                  </label>
                  <input
                    type="number"
                    max={selectedGreenBean.currentWeightKg}
                    step="0.1"
                    name="amountKg"
                    required
                    placeholder="Enter amount in kg"
                    className="mt-1 block w-full border border-gray-300 rounded-xl py-3 px-4 text-lg font-semibold focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 shadow-sm transition-all"
                  />
                  <p className="text-xs text-gray-500 mt-2">Maximum: {selectedGreenBean.currentWeightKg.toFixed(2)} kg</p>
                </div>

                {/* Purpose Input */}
                <div className="mb-6">
                  <label className="block text-base font-bold text-gray-700 mb-3">
                    Purpose of Withdrawal
                  </label>
                  <input
                    type="text"
                    name="purpose"
                    placeholder="e.g., Sample Roast, Sale to Roaster X, Export Order"
                    required
                    className="mt-1 block w-full border border-gray-300 rounded-xl py-3 px-4 text-base focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 shadow-sm transition-all"
                  />
                </div>
              </>}
              <div className="mt-8 flex justify-end space-x-3">
                <button type="button" onClick={() => setModal(null)} className="px-6 py-2.5 border border-gray-300 rounded-xl shadow-sm text-sm font-semibold text-gray-700 hover:bg-gray-50 hover:border-gray-400 transition-all">Cancel</button>
                <button type="submit" className="inline-flex items-center justify-center gap-2 px-6 py-2.5 border border-transparent shadow-lg text-sm font-semibold rounded-xl text-white bg-indigo-600 hover:bg-indigo-700 disabled:bg-indigo-300 disabled:cursor-not-allowed transition-all"
                 disabled={modal === 'hullAndGrade' && (Math.abs(gradedWeightSum - (parseFloat(totalGreenWeight) || 0)) > 0.01 || (parseFloat(totalGreenWeight) || 0) <= 0)}>
                  <Save className="h-4 w-4" />
                  Save
                </button>
              </div>
            </form>
          </div>
        </div></ModalPortal>}

        {scoringLot && <ModalPortal><div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-2xl shadow-2xl w-full max-w-4xl max-h-[90vh] overflow-hidden border border-gray-100 flex flex-col">
                <div className="p-6 sm:p-8 overflow-y-auto">
                    {/* Modal Header */}
                    <div className="flex items-center gap-4 mb-6">
                        <div className="p-4 bg-amber-600 rounded-2xl shadow-lg">
                            <Star className="h-10 w-10 text-white" />
                        </div>
                        <div>
                            <h2 className="text-3xl font-bold text-gray-900">QC Score</h2>
                            <p className="text-base text-gray-600 mt-1">Quality Control for Lot #{scoringLot.id}</p>
                        </div>
                    </div>

                    {/* Lot Info Card */}
                    <div className="bg-amber-50 rounded-2xl p-6 mb-6 border border-amber-200">
                        <div className="grid grid-cols-3 gap-4">
                            <div>
                                <p className="text-xs font-bold text-gray-500 uppercase tracking-wide mb-1">Grade</p>
                                <p className="text-2xl font-bold text-amber-600">{scoringLot.grade}</p>
                            </div>
                            <div>
                                <p className="text-xs font-bold text-gray-500 uppercase tracking-wide mb-1">Weight</p>
                                <p className="text-2xl font-bold text-gray-900">{scoringLot.currentWeightKg.toFixed(2)} kg</p>
                            </div>
                            <div>
                                <p className="text-xs font-bold text-gray-500 uppercase tracking-wide mb-1">Current Score</p>
                                <p className="text-2xl font-bold text-purple-600">{scoringLot.qcScore ? scoringLot.qcScore.toFixed(2) : 'N/A'}</p>
                            </div>
                        </div>
                    </div>

                    {/* Scoring Mode Toggle */}
                    <div className="flex bg-gray-100 p-1.5 rounded-xl mb-6 w-full sm:w-2/3 mx-auto">
                        <button type="button" onClick={() => setScoringMode('simple')} className={`w-1/2 py-3 text-sm font-bold rounded-lg transition-all ${scoringMode === 'simple' ? 'bg-white shadow-md text-amber-600' : 'text-gray-600 hover:text-gray-900'}`}>
                            Simple Score
                        </button>
                        <button type="button" onClick={() => setScoringMode('detailed')} className={`w-1/2 py-3 text-sm font-bold rounded-lg transition-all ${scoringMode === 'detailed' ? 'bg-white shadow-md text-amber-600' : 'text-gray-600 hover:text-gray-900'}`}>
                            Detailed (SCA)
                        </button>
                    </div>

                    {scoringMode === 'simple' ? (
                        <div className="max-w-md mx-auto">
                            <label className="block text-base font-bold text-gray-700 mb-3">
                                <div className="flex items-center gap-2">
                                    <Star className="h-5 w-5 text-amber-600" />
                                    Total Score (0-100)
                                </div>
                            </label>
                            <input
                                type="number"
                                step="0.25"
                                value={simpleQcScore}
                                onChange={e => setSimpleQcScore(e.target.value)}
                                required
                                placeholder="Enter score"
                                className="mt-1 block w-full border border-gray-300 rounded-xl py-3 px-4 text-lg font-semibold text-center focus:ring-2 focus:ring-amber-500 focus:border-amber-500 shadow-sm transition-all"
                            />
                            <p className="text-xs text-gray-500 mt-2 text-center">Score from 0 to 100 (increments of 0.25)</p>
                        </div>
                    ) : (
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                        <div>{SCA_SENSORY_ATTRIBUTES.map(attr => {
                             const { value, error } = sensoryScores[attr];
                             return (<div key={attr} className="mb-2">
                                <label htmlFor={attr} className="block text-sm font-medium text-gray-700 mb-1">{attr}</label>
                                <input type="number" id={attr} min="6" max="10" step="0.25" value={value}
                                    onChange={e => setSensoryScores(prev => ({ ...prev, [attr]: { ...prev[attr], value: e.target.value } }))}
                                    onBlur={() => setSensoryScores(prev => ({...prev, [attr]: { ...prev[attr], error: validateScore(value).error } }))}
                                    className={`w-full p-2 border rounded-md shadow-sm text-sm text-center ${error ? 'border-red-500' : 'border-gray-300'}`} />
                                {error && <p className="text-xs text-red-600 mt-1">{error}</p>}
                            </div>);
                        })}</div>
                        <div>
                            {SCA_CUP_ATTRIBUTES.map(attr => {
                                 const count = cupScores[attr];
                                 return (<div key={attr} className="mb-4">
                                     <div className="flex justify-between items-center mb-1">
                                         <label className="text-sm font-medium text-gray-700">{attr}</label>
                                         <span className="text-lg font-bold text-gray-800">{count * 2}</span>
                                     </div>
                                     <div className="flex items-center gap-2">
                                         {Array.from({ length: 5 }).map((_, i) => (
                                             <button type="button" key={i} onClick={() => setCupScores(prev => ({...prev, [attr]: i + 1 }))}
                                                 className={`flex-1 h-8 rounded-md border transition-colors ${i < count ? 'bg-indigo-600 border-indigo-600' : 'bg-white border-gray-400 hover:border-indigo-500'}`} />
                                         ))}
                                     </div>
                                 </div>);
                            })}
                             <div className="mt-6 p-4 bg-gray-50 rounded-lg border">
                                <label className="text-sm font-medium text-gray-700">Defects (subtract)</label>
                                <div className="flex items-center gap-4 mt-2">
                                    <div><label className="text-xs"># of cups</label><input type="number" min="0" value={defects.numCups} onChange={e => setDefects({...defects, numCups: e.target.value})} className="w-20 p-2 border rounded-md shadow-sm text-sm"/></div>
                                    <span>&times;</span>
                                    <div className="flex gap-2"><label className="flex items-center text-sm gap-1"><input type="radio" name="intensity" value="2" checked={defects.intensity === 2} onChange={() => setDefects({...defects, intensity: 2})}/> Taint</label><label className="flex items-center text-sm gap-1"><input type="radio" name="intensity" value="4" checked={defects.intensity === 4} onChange={() => setDefects({...defects, intensity: 4})}/> Fault</label></div>
                                    <span>=</span>
                                    <span className="text-2xl font-bold text-red-600">{detailedCalculations.defectsTotal}</span>
                                </div>
                            </div>
                            <div className="mt-6 p-4 bg-indigo-50 rounded-lg border border-indigo-200 space-y-2">
                                <div className="flex justify-between items-baseline"><span className="font-semibold text-gray-600">Subtotal</span><span className="font-bold text-xl text-gray-800">{detailedCalculations.subtotal.toFixed(2)}</span></div>
                                <div className="flex justify-between items-baseline"><span className="font-semibold text-red-600">Defects</span><span className="font-bold text-xl text-red-600">&minus; {detailedCalculations.defectsTotal.toFixed(2)}</span></div>
                                <hr className="border-gray-300"/>
                                <div className="flex justify-between items-center pt-2"><span className="text-xl font-bold text-indigo-800">Final Score</span><span className="text-4xl font-extrabold text-indigo-600">{detailedCalculations.finalScore.toFixed(2)}</span></div>
                            </div>
                        </div>
                    </div>
                )}

                    {/* Tasting Notes */}
                    <div className="mt-6">
                        <label className="block text-base font-bold text-gray-700 mb-3">
                            Tasting Notes & Comments
                        </label>
                        <textarea
                            rows={4}
                            value={notes}
                            onChange={e => setNotes(e.target.value)}
                            placeholder="Describe flavor notes, aroma, body, aftertaste..."
                            className="mt-1 block w-full border border-gray-300 rounded-xl py-3 px-4 text-base focus:ring-2 focus:ring-amber-500 focus:border-amber-500 shadow-sm transition-all resize-none"
                        ></textarea>
                    </div>

                    {/* Action Buttons */}
                    <div className="mt-8 flex justify-end space-x-3">
                        <button
                            type="button"
                            onClick={() => setScoringLot(null)}
                            className="px-6 py-2.5 border border-gray-300 rounded-xl shadow-sm text-sm font-semibold text-gray-700 hover:bg-gray-50 hover:border-gray-400 transition-all"
                        >
                            Cancel
                        </button>
                        <button
                            type="button"
                            onClick={handleSaveScore}
                            className="inline-flex items-center justify-center gap-2 px-6 py-2.5 border border-transparent shadow-lg text-sm font-semibold rounded-xl text-white bg-amber-600 hover:bg-amber-700 transition-all"
                        >
                            <Save className="h-4 w-4" />
                            Save Score
                        </button>
                    </div>
                </div>
            </div>
        </div></ModalPortal>}

        {selectedGreenBeanForHistory && (
            <ModalPortal><div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
                <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-hidden border border-gray-100 flex flex-col">
                    <div className="p-6 sm:p-8">
                        {/* Modal Header */}
                        <div className="flex items-center gap-4 mb-6">
                            <div className="p-4 bg-gray-600 rounded-2xl shadow-lg">
                                <History className="h-10 w-10 text-white" />
                            </div>
                            <div>
                                <h2 className="text-3xl font-bold text-gray-900">Withdrawal History</h2>
                                <p className="text-base text-gray-600 mt-1">Lot #{selectedGreenBeanForHistory.id}</p>
                            </div>
                        </div>

                        {/* Summary Card */}
                        <div className="bg-blue-50 rounded-2xl p-6 mb-6 border border-blue-200">
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <p className="text-xs font-bold text-gray-500 uppercase tracking-wide mb-1">Total Withdrawals</p>
                                    <p className="text-3xl font-bold text-blue-600">
                                        {selectedGreenBeanForHistory.withdrawalHistory?.length || 0}
                                    </p>
                                    <p className="text-xs text-gray-500 mt-1">transactions</p>
                                </div>
                                <div>
                                    <p className="text-xs font-bold text-gray-500 uppercase tracking-wide mb-1">Total Amount</p>
                                    <p className="text-3xl font-bold text-blue-600">
                                        {(selectedGreenBeanForHistory.withdrawalHistory?.reduce((sum, entry) => sum + entry.amountKg, 0) || 0).toFixed(2)}
                                    </p>
                                    <p className="text-xs text-gray-500 mt-1">kilograms</p>
                                </div>
                            </div>
                        </div>

                        {/* History List */}
                        <div className="overflow-y-auto max-h-96">
                            <div className="space-y-3">
                                {selectedGreenBeanForHistory.withdrawalHistory?.map((entry, index) => (
                                    <div key={index} className="bg-gray-50 rounded-xl p-4 border border-gray-200 hover:border-blue-300 hover:bg-blue-50 transition-all">
                                        <div className="flex items-center justify-between mb-2">
                                            <div className="flex items-center gap-3">
                                                <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center">
                                                    <span className="text-white font-bold text-sm">#{index + 1}</span>
                                                </div>
                                                <div>
                                                    <p className="text-xs font-bold text-gray-500 uppercase tracking-wide">Date</p>
                                                    <p className="text-sm font-bold text-gray-900">{entry.date}</p>
                                                </div>
                                            </div>
                                            <div className="text-right">
                                                <p className="text-xs font-bold text-gray-500 uppercase tracking-wide">Amount</p>
                                                <p className="text-2xl font-bold text-blue-600">{entry.amountKg.toFixed(2)} kg</p>
                                            </div>
                                        </div>
                                        <div className="mt-3 pt-3 border-t border-gray-200">
                                            <p className="text-xs font-bold text-gray-500 uppercase tracking-wide mb-1">Purpose</p>
                                            <p className="text-sm text-gray-900">{entry.purpose}</p>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>

                        {/* Close Button */}
                        <div className="mt-6 flex justify-end">
                            <button
                                type="button"
                                onClick={() => setSelectedGreenBeanForHistory(null)}
                                className="px-6 py-2.5 border border-gray-300 rounded-xl shadow-sm text-sm font-semibold text-gray-700 hover:bg-gray-50 hover:border-gray-400 transition-all"
                            >
                                Close
                            </button>
                        </div>
                    </div>
                </div>
            </div></ModalPortal>
        )}
    </div>
  );
};

export default ProcessorWorkbench;