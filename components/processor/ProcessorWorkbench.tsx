import React, { useState, useMemo, useEffect, useCallback } from 'react';
import { useDataContext } from '../../hooks/useDataContext';
import { ProcessingBatch, ProcessingBatchStatus, ParchmentLot, GreenBeanLot, HarvestLot, PhysicalTestResults, UserRole, CuppingSessionType, CuppingSession, JudgeScore, CuppingSample, SCA_SENSORY_ATTRIBUTES, SCA_CUP_ATTRIBUTES } from '../../types';
import { Coffee, Wind, PackageCheck, Sprout, ChevronsRight, CheckCircle, Archive, PlayCircle, TestTube, Beaker, Plus, Trash2, LayoutGrid, List, AlertCircle, History, Award, Save, Search, ArrowUp, ArrowDown } from 'lucide-react';

type ViewMode = 'kanban' | 'table';
type SortDirection = 'asc' | 'desc';
type ParchmentSortKeys = keyof ParchmentLot | 'id';
type GreenBeanSortKeys = keyof GreenBeanLot | 'id' | 'qcScore';

const ITEMS_PER_PAGE = 5;

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

const KanbanCard: React.FC<{ batch: ProcessingBatch; onDragStart: (e: React.DragEvent<HTMLDivElement>, batchId: string) => void }> = ({ batch, onDragStart }) => (
  <div
    draggable
    onDragStart={(e) => onDragStart(e, batch.id)}
    className="bg-white p-4 mb-3 rounded-lg shadow cursor-grab active:cursor-grabbing border border-gray-200"
  >
    <p className="font-semibold text-gray-800">Batch #{batch.id}</p>
    <p className="text-sm text-gray-600">Harvest Lot: {batch.harvestLotId}</p>
    <p className="text-sm text-gray-500">Process: {batch.processType}</p>
  </div>
);

const KanbanColumn: React.FC<{ title: string; status: ProcessingBatchStatus; batches: ProcessingBatch[]; icon: React.ReactNode; onDrop: (e: React.DragEvent<HTMLDivElement>, status: ProcessingBatchStatus) => void; onDragOver: (e: React.DragEvent<HTMLDivElement>) => void; onDragStart: (e: React.DragEvent<HTMLDivElement>, batchId: string) => void }> = ({ title, status, batches, icon, onDrop, onDragOver, onDragStart }) => (
  <div
    onDrop={(e) => onDrop(e, status)}
    onDragOver={onDragOver}
    className="bg-gray-100 rounded-lg p-4 w-full md:w-1/3 flex flex-col"
  >
    <div className="flex items-center mb-4">
      {icon}
      <h3 className="font-bold text-lg ml-2 text-gray-700">{title}</h3>
      <span className="ml-auto text-sm font-semibold bg-gray-200 text-gray-600 rounded-full px-2 py-0.5">{batches.length}</span>
    </div>
    <div className="flex-grow overflow-y-auto">
      {batches.map(batch => (
        <KanbanCard key={batch.id} batch={batch} onDragStart={onDragStart} />
      ))}
    </div>
  </div>
);

const ProcessorWorkbench: React.FC = () => {
  const { data, setData } = useDataContext();
  const [viewMode, setViewMode] = useState<ViewMode>('kanban');

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
    <div className="bg-white shadow-md rounded-lg overflow-hidden mt-8">
        <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
                <tr>
                    <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Batch ID</th>
                    <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Harvest Lot</th>
                    <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Process</th>
                    <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                    <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Drying Duration</th>
                </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
                {data.processingBatches.map(b => {
                    const duration = b.dryingStartDate && b.dryingEndDate ? `${(new Date(b.dryingEndDate).getTime() - new Date(b.dryingStartDate).getTime()) / (1000 * 3600 * 24)} days` : 'N/A';
                    return (
                        <tr key={b.id}>
                            <td className="px-4 py-2 whitespace-nowrap text-sm font-medium">{b.id}</td>
                            <td className="px-4 py-2 whitespace-nowrap text-sm">{b.harvestLotId}</td>
                            <td className="px-4 py-2 whitespace-nowrap text-sm">{b.processType}</td>
                            <td className="px-4 py-2 whitespace-nowrap text-sm">
                                <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${ b.status === 'Completed' ? 'bg-green-100 text-green-800' : b.status === 'Drying' ? 'bg-blue-100 text-blue-800' : 'bg-yellow-100 text-yellow-800' }`}>
                                    {b.status}
                                </span>
                            </td>
                             <td className="px-4 py-2 whitespace-nowrap text-sm">{duration}</td>
                        </tr>
                    )
                })}
            </tbody>
        </table>
    </div>
  );
  
  const KanbanView = () => (
    <>
      <div className="bg-white shadow-md rounded-lg p-4 border mb-8">
          <h3 className="text-lg font-semibold flex items-center mb-3"><Coffee className="mr-2 text-green-600"/> Incoming Harvest Lots</h3>
          {readyForProcessingLots.length > 0 ? (
              <div className="overflow-x-auto">
                  <table className="min-w-full">
                      <tbody>
                          {readyForProcessingLots.map(lot => (
                              <tr key={lot.id}>
                                  <td className="px-4 py-2 text-sm font-medium">{lot.id}</td>
                                  <td className="px-4 py-2 text-sm">{lot.cherryVariety}</td>
                                  <td className="px-4 py-2 text-sm">{lot.weightKg} kg</td>
                                  <td><button onClick={() => openModal('startProcessing', lot)} className="inline-flex items-center px-2.5 py-1.5 border border-transparent text-xs font-medium rounded shadow-sm text-white bg-blue-600 hover:bg-blue-700"><PlayCircle className="h-4 w-4 mr-1"/> Start Processing</button></td>
                              </tr>
                          ))}
                      </tbody>
                  </table>
              </div>
          ) : <p className="text-sm text-gray-500">No new harvest lots are ready for processing.</p>}
      </div>
      <div className="flex flex-col md:flex-row space-y-4 md:space-y-0 md:space-x-4 h-[calc(50vh)]">
        {[
          { title: 'To Process', status: ProcessingBatchStatus.ToProcess, icon: <Coffee className="text-yellow-600" /> },
          { title: 'Drying', status: ProcessingBatchStatus.Drying, icon: <Wind className="text-blue-500" /> },
          { title: 'Completed', status: ProcessingBatchStatus.Completed, icon: <PackageCheck className="text-green-600" /> },
        ].map(col => (
          <KanbanColumn key={col.status} {...col} batches={data.processingBatches.filter(b => b.status === col.status)} onDrop={handleDrop} onDragOver={handleDragOver} onDragStart={handleDragStart} />
        ))}
      </div>
    </>
  );

    // --- Table Logic ---
    const SortableHeader = <T,>({ column, label, sortConfig, requestSort }: { column: T, label: string, sortConfig: { key: T, direction: SortDirection }, requestSort: (key: T) => void }) => (
        <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">
            <button onClick={() => requestSort(column)} className="flex items-center gap-1 hover:text-gray-700">
                {label}
                {sortConfig.key === column && (sortConfig.direction === 'asc' ? <ArrowUp className="h-3 w-3" /> : <ArrowDown className="h-3 w-3" />)}
            </button>
        </th>
    );

    const Pagination = ({ currentPage, totalPages, onPageChange }: { currentPage: number, totalPages: number, onPageChange: (page: number) => void }) => {
        if (totalPages <= 1) return null;
        return (
            <div className="flex justify-between items-center px-4 py-2">
                <button onClick={() => onPageChange(currentPage - 1)} disabled={currentPage === 1} className="px-3 py-1 text-sm border rounded disabled:opacity-50">Previous</button>
                <span className="text-sm">Page {currentPage} of {totalPages}</span>
                <button onClick={() => onPageChange(currentPage + 1)} disabled={currentPage === totalPages} className="px-3 py-1 text-sm border rounded disabled:opacity-50">Next</button>
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
    <div>
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold text-gray-900 mb-6">Processor Workbench</h1>
         <div className="flex items-center gap-2 p-1 bg-gray-200 rounded-lg">
            <button onClick={() => setViewMode('kanban')} className={`px-3 py-1 text-sm font-semibold rounded-md transition-colors ${viewMode === 'kanban' ? 'bg-white text-indigo-600 shadow' : 'text-gray-600'}`}><LayoutGrid className="inline h-4 w-4 mr-1"/> Workflow</button>
            <button onClick={() => setViewMode('table')} className={`px-3 py-1 text-sm font-semibold rounded-md transition-colors ${viewMode === 'table' ? 'bg-white text-indigo-600 shadow' : 'text-gray-600'}`}><List className="inline h-4 w-4 mr-1"/> Data Grid</button>
        </div>
      </div>
      
      {viewMode === 'kanban' ? <KanbanView/> : <TableView/>}

      <div className="mt-8 grid grid-cols-1 xl:grid-cols-2 gap-8">
        {/* Parchment Inventory */}
        <div className="bg-white shadow-md rounded-lg overflow-hidden flex flex-col">
            <div className="p-4 border-b">
                <h3 className="text-lg font-semibold flex items-center"><PackageCheck className="mr-2 text-yellow-700"/> Parchment Stock</h3>
                <div className="relative mt-2">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400"/>
                    <input type="text" placeholder="Search lots..." value={parchmentSearch} onChange={e => { setParchmentSearch(e.target.value); setParchmentCurrentPage(1); }} className="pl-9 w-full border-gray-300 rounded-md text-sm"/>
                </div>
            </div>
            <div className="overflow-x-auto flex-grow">
                <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50"><tr>
                        <SortableHeader column="id" label="ID" sortConfig={parchmentSortConfig} requestSort={(key) => setParchmentSortConfig(prev => ({ key, direction: prev.key === key && prev.direction === 'asc' ? 'desc' : 'asc' }))} />
                        <SortableHeader column="currentWeightKg" label="Weight" sortConfig={parchmentSortConfig} requestSort={(key) => setParchmentSortConfig(prev => ({ key, direction: prev.key === key && prev.direction === 'asc' ? 'desc' : 'asc' }))} />
                        <SortableHeader column="status" label="Status" sortConfig={parchmentSortConfig} requestSort={(key) => setParchmentSortConfig(prev => ({ key, direction: prev.key === key && prev.direction === 'asc' ? 'desc' : 'asc' }))} />
                        <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Actions</th>
                    </tr></thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                        {paginatedParchmentLots.map(p => (
                            <React.Fragment key={p.id}>
                            <tr>
                                <td className="px-4 py-2 text-sm font-medium">{p.id}</td>
                                <td className="px-4 py-2 text-sm">{p.currentWeightKg.toFixed(2)} kg</td>
                                <td className="px-4 py-2 text-sm"><span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${p.status === 'Hulled' ? 'bg-gray-200 text-gray-700' : 'bg-green-100 text-green-800'}`}>{p.status}</span></td>
                                <td className="px-4 py-2 text-sm space-x-2">
                                    <button onClick={() => openModal('logTestResults', p)} disabled={!!p.physicalTestResults || p.status === 'Hulled'} className="inline-flex items-center px-2 py-1 border text-xs rounded shadow-sm disabled:bg-gray-200 disabled:cursor-not-allowed"><TestTube className="h-4 w-4 mr-1"/> Test Sample</button>
                                    <button onClick={() => openModal('hullAndGrade', p)} disabled={p.status === 'Hulled'} className="inline-flex items-center px-2 py-1 border text-xs rounded shadow-sm text-white bg-green-600 hover:bg-green-700 disabled:bg-gray-200"><ChevronsRight className="h-4 w-4 mr-1"/> Hull</button>
                                </td>
                            </tr>
                            {p.physicalTestResults && (
                                <tr className="bg-indigo-50"><td colSpan={4} className="p-3 text-xs">
                                    <div className="flex gap-4 flex-wrap">
                                    <strong>Test Results:</strong>
                                    <span>Moisture: <strong>{p.physicalTestResults.greenBeanMoisture}%</strong></span>
                                    <span>aW: <strong>{p.physicalTestResults.waterActivity}</strong></span>
                                    <span>Density: <strong>{p.physicalTestResults.density}</strong></span>
                                    <span>Defects: <strong>{p.physicalTestResults.defectCount}</strong></span>
                                    </div>
                                </td></tr>
                            )}
                            </React.Fragment>
                        ))}
                    </tbody>
                </table>
                 {paginatedParchmentLots.length === 0 && <div className="text-center p-4 text-sm text-gray-500">No matching parchment lots found.</div>}
            </div>
            <Pagination currentPage={parchmentCurrentPage} totalPages={parchmentPageCount} onPageChange={setParchmentCurrentPage} />
        </div>
        
        {/* Green Bean Inventory */}
        <div className="bg-white shadow-md rounded-lg overflow-hidden flex flex-col">
            <div className="p-4 border-b">
                <h3 className="text-lg font-semibold flex items-center"><Sprout className="mr-2 text-green-600"/> Green Bean Stock</h3>
                <div className="relative mt-2">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400"/>
                    <input type="text" placeholder="Search lots..." value={greenBeanSearch} onChange={e => { setGreenBeanSearch(e.target.value); setGreenBeanCurrentPage(1); }} className="pl-9 w-full border-gray-300 rounded-md text-sm"/>
                </div>
            </div>
            <div className="overflow-x-auto flex-grow">
                <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50"><tr>
                        <SortableHeader column="id" label="ID" sortConfig={greenBeanSortConfig} requestSort={(key) => setGreenBeanSortConfig(prev => ({ key, direction: prev.key === key && prev.direction === 'asc' ? 'desc' : 'asc' }))} />
                        <SortableHeader column="grade" label="Grade" sortConfig={greenBeanSortConfig} requestSort={(key) => setGreenBeanSortConfig(prev => ({ key, direction: prev.key === key && prev.direction === 'asc' ? 'desc' : 'asc' }))} />
                        <SortableHeader column="currentWeightKg" label="Weight" sortConfig={greenBeanSortConfig} requestSort={(key) => setGreenBeanSortConfig(prev => ({ key, direction: prev.key === key && prev.direction === 'asc' ? 'desc' : 'asc' }))} />
                        <SortableHeader column="qcScore" label="QC Score" sortConfig={greenBeanSortConfig} requestSort={(key) => setGreenBeanSortConfig(prev => ({ key, direction: prev.key === key && prev.direction === 'asc' ? 'desc' : 'asc' }))} />
                        <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                        <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Actions</th>
                    </tr></thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                        {paginatedGreenBeanLots.map(g => (
                            <tr key={g.id} className={g.availabilityStatus === 'Withdrawn' ? 'bg-gray-50' : ''}>
                                <td className="px-4 py-2 text-sm font-medium">{g.id}</td>
                                <td className="px-4 py-2 text-sm">{g.grade}</td>
                                <td className="px-4 py-2 text-sm">{g.currentWeightKg.toFixed(2)} kg</td>
                                <td className="px-4 py-2 text-sm font-bold text-indigo-600">{g.qcScore ? g.qcScore.toFixed(2) : 'N/A'}</td>
                                <td className="px-4 py-2 text-sm"><button onClick={() => handleToggleAvailability(g.id)} className={`inline-flex items-center px-3 py-1 text-xs font-semibold rounded-full ${g.availabilityStatus === 'Available' ? 'bg-green-100 text-green-800' : 'bg-gray-200 text-gray-700'}`}>{g.availabilityStatus === 'Available' ? <CheckCircle className="h-4 w-4 mr-1.5" /> : <Archive className="h-4 w-4 mr-1.5" />} {g.availabilityStatus}</button></td>
                                <td className="px-4 py-2 text-sm space-x-2">
                                    {g.withdrawalHistory && g.withdrawalHistory.length > 0 && (
                                        <button onClick={() => setSelectedGreenBeanForHistory(g)} className="inline-flex items-center p-1.5 border text-xs rounded shadow-sm hover:bg-gray-100" title="View Withdrawal History">
                                            <History className="h-4 w-4"/>
                                        </button>
                                    )}
                                    <button onClick={() => setScoringLot(g)} className="inline-flex items-center px-2 py-1 border text-xs rounded shadow-sm hover:bg-gray-100"><Award className="h-4 w-4 mr-1"/> Score</button>
                                    <button onClick={() => openModal('withdrawStock', g)} disabled={g.availabilityStatus === 'Withdrawn'} className="inline-flex items-center px-2 py-1 border text-xs rounded shadow-sm disabled:opacity-50 disabled:cursor-not-allowed"><ChevronsRight className="h-4 w-4 mr-1"/> Withdraw</button>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
                {paginatedGreenBeanLots.length === 0 && <div className="text-center p-4 text-sm text-gray-500">No matching green bean lots found.</div>}
            </div>
             <Pagination currentPage={greenBeanCurrentPage} totalPages={greenBeanPageCount} onPageChange={setGreenBeanCurrentPage} />
        </div>
      </div>
      
      {modal && <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg p-8 shadow-2xl w-full max-w-md max-h-[90vh] overflow-y-auto">
            <form onSubmit={handleSubmit}>
              { modal === 'startProcessing' && selectedHarvestLot && <>
                <h2 className="text-2xl font-bold mb-4">Start Processing Lot #{selectedHarvestLot.id}</h2>
                <label htmlFor="processType" className="block text-sm font-medium text-gray-700">Select Process Type</label>
                <select name="processType" id="processType" required className="mt-1 block w-full border-gray-300 rounded-md py-2 px-3"><option>Washed</option><option>Natural</option><option>Honey</option></select>
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
                 return <>
                    <h2 className="text-2xl font-bold mb-4">Hull & Grade Lot #{selectedParchment.id}</h2>
                    <div><label className="block text-sm font-medium">Total Green Bean Weight (kg)</label><input type="number" step="0.1" value={totalGreenWeight} onChange={e => setTotalGreenWeight(e.target.value)} required className="mt-1 block w-full border-gray-300 rounded-md py-2 px-3" /></div>
                    <p className="text-xs text-gray-500 mt-1">Weight Loss: {totalGreenWeight ? `${(((selectedParchment.currentWeightKg - parseFloat(totalGreenWeight)) / selectedParchment.currentWeightKg) * 100).toFixed(1)}%` : 'N/A'}</p>
                    <hr className="my-4"/>
                    <h3 className="text-lg font-semibold mb-2">Create Graded Lots</h3>
                    <div className="space-y-2">
                    {gradedLots.map((lot, index) => (
                        <div key={index} className="flex items-center gap-2">
                            <input type="text" placeholder="Grade (e.g., Grade A)" value={lot.grade} onChange={e => setGradedLots(gradedLots.map((l, i) => i === index ? {...l, grade: e.target.value} : l))} required className="block w-full border-gray-300 rounded-md py-2 px-3 text-sm"/>
                            <input type="number" placeholder="Weight (kg)" value={lot.weight} onChange={e => setGradedLots(gradedLots.map((l, i) => i === index ? {...l, weight: e.target.value} : l))} required className="block w-full border-gray-300 rounded-md py-2 px-3 text-sm"/>
                            <button type="button" onClick={() => setGradedLots(gradedLots.filter((_, i) => i !== index))} className="text-red-500 hover:text-red-700 disabled:opacity-50" disabled={gradedLots.length <= 1}><Trash2 size={16}/></button>
                        </div>
                    ))}
                    </div>
                    <button type="button" onClick={() => setGradedLots([...gradedLots, {grade: '', weight: ''}])} className="text-sm text-indigo-600 mt-2 flex items-center gap-1 hover:text-indigo-800"><Plus size={16}/> Add Grade</button>
                    <div className={`mt-3 p-2 rounded-md text-sm ${weightMismatch ? 'bg-red-100 text-red-800' : 'bg-green-100 text-green-800'}`}>
                        Total Accounted For: <strong>{gradedWeightSum.toFixed(2)} kg</strong> / {totalWeightNum.toFixed(2)} kg
                    </div>
                    {weightMismatch && <p className="text-xs text-red-600 mt-1 flex items-center gap-1"><AlertCircle size={12}/> Sum of graded lots must equal total green bean weight.</p>}
                 </>
              })()}
              { modal === 'withdrawStock' && selectedGreenBean && <>
                <h2 className="text-2xl font-bold mb-4">Withdraw from Lot #{selectedGreenBean.id}</h2>
                <p className="text-sm mb-4">Current stock: {selectedGreenBean.currentWeightKg.toFixed(2)} kg</p>
                <div><label className="block text-sm font-medium">Amount to Withdraw (kg)</label><input type="number" max={selectedGreenBean.currentWeightKg} step="0.1" name="amountKg" required className="mt-1 block w-full border-gray-300 rounded-md py-2 px-3" /></div>
                <div><label className="block text-sm font-medium mt-2">Purpose</label><input type="text" name="purpose" placeholder="e.g., Sample Roast, Sale to Roaster X" required className="mt-1 block w-full border-gray-300 rounded-md py-2 px-3" /></div>
              </>}
              <div className="mt-6 flex justify-end space-x-3">
                <button type="button" onClick={() => setModal(null)} className="bg-white py-2 px-4 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 hover:bg-gray-50">Cancel</button>
                <button type="submit" className="inline-flex justify-center py-2 px-4 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 disabled:bg-indigo-300 disabled:cursor-not-allowed"
                 disabled={modal === 'hullAndGrade' && (Math.abs(gradedWeightSum - (parseFloat(totalGreenWeight) || 0)) > 0.01 || (parseFloat(totalGreenWeight) || 0) <= 0)}>Save</button>
              </div>
            </form>
          </div>
        </div>}
        
        {scoringLot && <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-lg p-8 shadow-2xl w-full max-w-3xl max-h-[90vh] overflow-y-auto">
                <h2 className="text-2xl font-bold mb-2">Log QC Score for Lot {scoringLot.id}</h2>
                <p className="text-sm text-gray-500 mb-4">Enter your internal quality control score and notes.</p>
                
                <div className="flex bg-gray-100 p-1 rounded-lg mb-4 w-full sm:w-2/3 mx-auto">
                    <button type="button" onClick={() => setScoringMode('simple')} className={`w-1/2 py-2 text-sm font-semibold rounded-md transition-colors ${scoringMode === 'simple' ? 'bg-white shadow text-indigo-600' : 'text-gray-600'}`}>Simple Score</button>
                    <button type="button" onClick={() => setScoringMode('detailed')} className={`w-1/2 py-2 text-sm font-semibold rounded-md transition-colors ${scoringMode === 'detailed' ? 'bg-white shadow text-indigo-600' : 'text-gray-600'}`}>Detailed (SCA)</button>
                </div>
                
                {scoringMode === 'simple' ? (
                    <div>
                        <label className="block text-sm font-medium text-gray-700">Total Score (0-100)</label>
                        <input type="number" step="0.25" value={simpleQcScore} onChange={e => setSimpleQcScore(e.target.value)} required className="mt-1 block w-full border-gray-300 rounded-md py-2 px-3" />
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
                                                 className={`flex-1 h-8 rounded-md border-2 transition-colors ${i < count ? 'bg-indigo-600 border-indigo-600' : 'bg-white border-gray-400 hover:border-indigo-500'}`} />
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
                 <div className="mt-4">
                    <label className="block text-sm font-medium text-gray-700">Tasting Notes</label>
                    <textarea rows={4} value={notes} onChange={e => setNotes(e.target.value)} className="mt-1 block w-full border-gray-300 rounded-md py-2 px-3"></textarea>
                </div>
                 <div className="mt-6 flex justify-end space-x-3">
                    <button type="button" onClick={() => setScoringLot(null)} className="bg-white py-2 px-4 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 hover:bg-gray-50">Cancel</button>
                    <button type="button" onClick={handleSaveScore} className="inline-flex items-center justify-center py-2 px-4 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700"><Save className="h-4 w-4 mr-2" />Save Score</button>
                </div>
            </div>
        </div>}

        {selectedGreenBeanForHistory && (
            <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
                <div className="bg-white rounded-lg p-8 shadow-2xl w-full max-w-lg">
                    <h2 className="text-2xl font-bold mb-4">Withdrawal History for Lot #{selectedGreenBeanForHistory.id}</h2>
                    <div className="overflow-y-auto max-h-96 border rounded-md">
                        <table className="min-w-full divide-y divide-gray-200">
                            <thead className="bg-gray-50">
                                <tr>
                                    <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Date</th>
                                    <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Amount (kg)</th>
                                    <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Purpose</th>
                                </tr>
                            </thead>
                            <tbody className="bg-white divide-y divide-gray-200">
                                {selectedGreenBeanForHistory.withdrawalHistory?.map((entry, index) => (
                                    <tr key={index}>
                                        <td className="px-4 py-3 whitespace-nowrap text-sm">{entry.date}</td>
                                        <td className="px-4 py-3 whitespace-nowrap text-sm">{entry.amountKg.toFixed(2)}</td>
                                        <td className="px-4 py-3 whitespace-nowrap text-sm">{entry.purpose}</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                    <div className="mt-6 flex justify-end">
                        <button type="button" onClick={() => setSelectedGreenBeanForHistory(null)} className="bg-white py-2 px-4 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 hover:bg-gray-50">
                            Close
                        </button>
                    </div>
                </div>
            </div>
        )}
    </div>
  );
};

export default ProcessorWorkbench;