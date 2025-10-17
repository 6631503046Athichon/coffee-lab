

import React, { useState, useMemo, useRef, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useDataContext } from '../../hooks/useDataContext';
import { User, GreenBeanLot, RoasterInventoryItem, RoastBatch } from '../../types';
import { Flame, Package, BookText, PlusCircle, Award, X, ChevronDown, Check } from 'lucide-react';


interface RoasterWorkbenchProps {
    currentUser: User;
}

const FLAVOR_GROUPS: Record<string, string[]> = {
    Sweet: ['Brown Sugar', 'Honey', 'Caramel', 'Vanilla'],
    Fruity: ['Citrus', 'Orange Peel', 'Berry', 'Apple', 'Tropical'],
    Floral: ['Jasmine', 'Rose', 'Lavender'],
    'Nutty/Chocolatey': ['Almond', 'Hazelnut', 'Chocolate', 'Cocoa'],
    Spicy: ['Cinnamon', 'Clove', 'Black Pepper'],
    Roasted: ['Toasted', 'Smoky'],
    Other: ['Earthy', 'Woody', 'Herbal'],
};

// Custom Dropdown Component
const CustomDropdown: React.FC<{
    value: string;
    onChange: (value: string) => void;
    options: string[];
    placeholder: string;
}> = ({ value, onChange, options, placeholder }) => {
    const [isOpen, setIsOpen] = useState(false);
    const dropdownRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
                setIsOpen(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    return (
        <div ref={dropdownRef} className="relative">
            <button
                type="button"
                onClick={() => setIsOpen(!isOpen)}
                className="block w-full border-2 border-orange-300 rounded-xl shadow-sm py-2.5 px-3 bg-white text-left focus:outline-none focus:ring-2 focus:ring-orange-400 focus:border-orange-500 transition-all hover:border-orange-400"
            >
                <div className="flex items-center justify-between">
                    <span className={value ? "text-gray-900 font-semibold" : "text-gray-500"}>
                        {value || placeholder}
                    </span>
                    <ChevronDown className={`h-5 w-5 text-orange-500 transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`} />
                </div>
            </button>

            {isOpen && (
                <div className="absolute z-10 w-full mt-2 bg-white border-2 border-orange-200 rounded-xl shadow-xl max-h-60 overflow-auto">
                    <div className="py-1">
                        {options.map((option) => (
                            <button
                                key={option}
                                type="button"
                                onClick={() => {
                                    onChange(option);
                                    setIsOpen(false);
                                }}
                                className={`w-full text-left px-4 py-3 hover:bg-orange-50 transition-colors flex items-center justify-between ${
                                    value === option ? 'bg-orange-50' : ''
                                }`}
                            >
                                <span className="text-sm font-semibold text-gray-900">{option}</span>
                                {value === option && (
                                    <Check className="h-5 w-5 text-orange-600" />
                                )}
                            </button>
                        ))}
                    </div>
                </div>
            )}
        </div>
    );
};


const RoasterWorkbench: React.FC<RoasterWorkbenchProps> = ({ currentUser }) => {
    const { data, setData } = useDataContext();
    const location = useLocation();
    const navigate = useNavigate();

    const [isClaimModalOpen, setIsClaimModalOpen] = useState(false);
    const [isLogRoastModalOpen, setIsLogRoastModalOpen] = useState(false);
    const [selectedLot, setSelectedLot] = useState<(GreenBeanLot & { variety: string, process: string, finalScore: string | number }) | null>(null);
    const [selectedInventoryItem, setSelectedInventoryItem] = useState<(RoasterInventoryItem & { variety: string, process: string }) | null>(null);
    const [claimAmount, setClaimAmount] = useState('');
    const [roastForm, setRoastForm] = useState({ batchSize: '', roastedWeight: '', notes: '', flavorNotes: '' });
    const [selectedCategory, setSelectedCategory] = useState<keyof typeof FLAVOR_GROUPS>('Sweet');
    const [selectedNote, setSelectedNote] = useState<string>(FLAVOR_GROUPS['Sweet'][0]);
    const [selectedFlavorTags, setSelectedFlavorTags] = useState<string[]>([]);
    const availableLotsRef = useRef<HTMLDivElement>(null);
    const inventoryRef = useRef<HTMLDivElement>(null);
    const roastLogRef = useRef<HTMLDivElement>(null);


    const getFinalScore = (gbl: GreenBeanLot) => {
        let finalScore: string | number = 'N/A';
        const scoreInfo = gbl.cuppingScores[0];
        if (scoreInfo) {
            const session = data.cuppingSessions.find(s => s.id === scoreInfo.sessionId);
            const sample = session?.samples.find(s => s.greenBeanLotId === gbl.id);
            if (session && sample && session.finalResults && session.finalResults[sample.id]) {
                finalScore = session.finalResults[sample.id].totalScore.toFixed(2);
            } else if (scoreInfo.score) {
                finalScore = scoreInfo.score.toFixed(2);
            }
        }
        return finalScore;
    };

    const availableLots = useMemo(() =>
        data.greenBeanLots
            .filter(lot => lot.availabilityStatus === 'Available' && lot.currentWeightKg > 0)
            .map(gbl => {
                const parchmentLot = data.parchmentLots.find(p => p.id === gbl.parchmentLotId);
                const harvestLot = data.harvestLots.find(h => h.id === parchmentLot?.harvestLotId);
                return {
                    ...gbl,
                    variety: harvestLot?.cherryVariety || 'N/A',
                    process: parchmentLot?.processType || 'N/A',
                    finalScore: getFinalScore(gbl),
                };
            }),
        [data]
    );

    const myInventory = useMemo(() =>
        data.roasterInventory
            .filter(item => item.roasterId === currentUser.id && item.remainingWeightKg > 0.01)
            .map(item => {
                const gbl = data.greenBeanLots.find(lot => lot.id === item.greenBeanLotId);
                const parchmentLot = data.parchmentLots.find(p => p.id === gbl?.parchmentLotId);
                const harvestLot = data.harvestLots.find(h => h.id === parchmentLot?.harvestLotId);
                return {
                    ...item,
                    variety: harvestLot?.cherryVariety || 'N/A',
                    process: parchmentLot?.processType || 'N/A',
                };
            }),
        [data, currentUser.id]
    );

    const myRoasts = useMemo(() =>
        data.roastBatches
            .filter(roast => roast.roasterId === currentUser.id)
            .sort((a, b) => new Date(b.roastDate).getTime() - new Date(a.roastDate).getTime()),
        [data.roastBatches, currentUser.id]
    );

    const openClaimModal = (lot: GreenBeanLot & { variety: string, process: string, finalScore: string | number }) => {
        setSelectedLot(lot);
        setClaimAmount('');
        setIsClaimModalOpen(true);
    };

    const openLogRoastModal = (inventoryItem: RoasterInventoryItem & { variety: string, process: string }) => {
        setSelectedInventoryItem(inventoryItem);
        setRoastForm({ batchSize: '', yieldPercentage: '85', notes: '', flavorNotes: '' });

        const existing = (data.roastBatches
            .filter(r => r.roasterId === currentUser.id && r.roasterInventoryId === inventoryItem.id)
            .at(-1)?.flavorNotes || '')
            .split(',')
            .map(s => s.trim())
            .filter(Boolean);

        setSelectedFlavorTags(existing);
        setSelectedCategory('Sweet');
        setSelectedNote(FLAVOR_GROUPS['Sweet'][0]);
        setIsLogRoastModalOpen(true);
    };


    const handleClaimSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        const amount = parseFloat(claimAmount);
        if (!selectedLot || !amount || amount <= 0 || amount > selectedLot.currentWeightKg) return alert('Invalid claim amount.');

        setData(prev => {
            const updatedGreenBeanLots = prev.greenBeanLots.map(gbl => gbl.id === selectedLot.id ? { ...gbl, currentWeightKg: gbl.currentWeightKg - amount } : gbl);
            const existingInvIndex = prev.roasterInventory.findIndex(item => item.roasterId === currentUser.id && item.greenBeanLotId === selectedLot.id);
            let updatedRoasterInventory;

            if (existingInvIndex > -1) {
                updatedRoasterInventory = [...prev.roasterInventory];
                const item = updatedRoasterInventory[existingInvIndex];
                updatedRoasterInventory[existingInvIndex] = { ...item, claimedWeightKg: item.claimedWeightKg + amount, remainingWeightKg: item.remainingWeightKg + amount };
            } else {
                updatedRoasterInventory = [...prev.roasterInventory, { id: `RI${String(prev.roasterInventory.length + 1).padStart(3, '0')}`, roasterId: currentUser.id, greenBeanLotId: selectedLot.id, claimedWeightKg: amount, remainingWeightKg: amount }];
            }
            return { ...prev, greenBeanLots: updatedGreenBeanLots, roasterInventory: updatedRoasterInventory };
        });
        setIsClaimModalOpen(false);
    };

    const to2 = (n: number) => +Number(n).toFixed(2);
    const clamp = (n: number, min: number, max: number) => Math.min(max, Math.max(min, n));

    const handleLogRoastSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (!selectedInventoryItem) return;

        const batchRaw = parseFloat(roastForm.batchSize);
        const roastedRaw = parseFloat(roastForm.roastedWeight);

        if (!batchRaw || batchRaw <= 0) return alert('Enter a valid batch size (kg).');
        if (!roastedRaw || roastedRaw <= 0) return alert('Enter a valid roasted weight (kg).');
        if (batchRaw > selectedInventoryItem.remainingWeightKg) return alert('Batch exceeds inventory.');
        if (roastedRaw > batchRaw) return alert('Roasted weight cannot be greater than batch size.');

        const batch = to2(clamp(batchRaw, 0.01, selectedInventoryItem.remainingWeightKg));
        const roasted = to2(clamp(roastedRaw, 0.01, batch));
        const yieldPct = to2((roasted / batch) * 100);
        const weightLossPct = to2(100 - yieldPct);

        setData(prev => {
            const updatedInventory = prev.roasterInventory.map(item =>
                item.id === selectedInventoryItem.id
                    ? { ...item, remainingWeightKg: to2(item.remainingWeightKg - batch) }
                    : item
            );

            const newRoast: RoastBatch = {
                id: `RB${String(prev.roastBatches.length + 1).padStart(3, '0')}`,
                roasterId: currentUser.id,
                roasterInventoryId: selectedInventoryItem.id,
                greenBeanLotId: selectedInventoryItem.greenBeanLotId,
                roastDate: new Date().toISOString().substring(0, 10),
                batchSizeKg: batch,
                yieldPercentage: yieldPct,     // คงเก็บไว้เพื่อ compatibility
                roastedWeightKg: roasted,      // NEW
                weightLossPct: weightLossPct,  // NEW
                roastProfileNotes: roastForm.notes?.trim(),
                flavorNotes: selectedFlavorTags.join(', '),

            };

            return { ...prev, roasterInventory: updatedInventory, roastBatches: [...prev.roastBatches, newRoast] };
        });

        setIsLogRoastModalOpen(false);
    };

    const handleQuickClaim = () => {
        if (availableLots.length === 0) {
            alert('No green bean lots are available to claim right now.');
            return;
        }
        availableLotsRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
        openClaimModal(availableLots[0]);
    };

    const handleQuickLogRoast = () => {
        if (myInventory.length === 0) {
            alert('You do not have inventory to log a roast. Claim a lot first.');
            return;
        }
        inventoryRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
        openLogRoastModal(myInventory[0]);
    };

    const scrollToRoastLog = () => {
        roastLogRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    };


    const quickActionHandlers = useRef({
        claim: handleQuickClaim,
        logRoast: handleQuickLogRoast,
        viewLog: scrollToRoastLog,
    });
    quickActionHandlers.current = {
        claim: handleQuickClaim,
        logRoast: handleQuickLogRoast,
        viewLog: scrollToRoastLog,
    };

    useEffect(() => {
        const state = location.state as { quickAction?: 'claim' | 'logRoast' | 'viewLog' } | null;
        if (!state?.quickAction) return;
        const action = quickActionHandlers.current[state.quickAction];
        if (action) action();
        navigate(location.pathname, { replace: true });
    }, [location, navigate]);

    return (
        <div>
            {/* Header Section */}
            <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-200 mb-8">
                <h1 className="text-3xl font-bold text-gray-900">Roaster's Workbench</h1>
                <p className="text-gray-600 mt-2">Claim green bean lots, manage inventory, and log your roasts.</p>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                <div className="lg:col-span-2 space-y-8">
                    {/* Available Lots */}
                    <div ref={availableLotsRef} className="bg-white shadow-lg rounded-2xl overflow-hidden border border-gray-100">
                        <div className="p-5 border-b border-gray-200">
                            <h3 className="text-xl font-bold flex items-center text-gray-900">
                                <div className="p-2 bg-green-100 rounded-lg mr-3">
                                    <Package className="h-5 w-5 text-green-600" />
                                </div>
                                Available Green Bean Lots
                            </h3>
                        </div>
                        <div className="overflow-x-auto">
                            <table className="min-w-full divide-y divide-gray-200">
                                <thead className="bg-gray-900">
                                    <tr>
                                        <th scope="col" className="px-6 py-4 text-left text-xs font-bold text-white uppercase tracking-wider">Lot</th>
                                        <th scope="col" className="px-6 py-4 text-left text-xs font-bold text-white uppercase tracking-wider">Info</th>
                                        <th scope="col" className="px-6 py-4 text-left text-xs font-bold text-white uppercase tracking-wider">Score</th>
                                        <th scope="col" className="px-6 py-4 text-left text-xs font-bold text-white uppercase tracking-wider">Available</th>
                                        <th scope="col" className="px-6 py-4 text-left text-xs font-bold text-white uppercase tracking-wider">Action</th>
                                    </tr>
                                </thead>
                                <tbody className="bg-white divide-y divide-gray-200">
                                    {availableLots.map((lot, index) => (
                                        <tr key={lot.id} className="bg-white hover:bg-gray-50 transition-colors duration-150">
                                            <td className="px-6 py-4 whitespace-nowrap">
                                                <span className="text-sm font-bold text-gray-900">{lot.id}</span>
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap">
                                                <div className="text-sm">
                                                    <span className="text-gray-700 font-medium">{lot.variety}</span>
                                                    <span className="text-gray-500 mx-1">/</span>
                                                    <span className="text-gray-600">{lot.process}</span>
                                                </div>
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap">
                                                <span className="text-sm font-bold text-indigo-600">{lot.finalScore}</span>
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap">
                                                <span className="text-sm text-gray-700 font-semibold">{lot.currentWeightKg.toFixed(2)} kg</span>
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap">
                                                <button
                                                    onClick={() => openClaimModal(lot)}
                                                    className="inline-flex items-center px-4 py-2 text-sm font-bold rounded-lg text-white bg-blue-600 hover:bg-blue-700 transition-all duration-200 shadow-sm hover:shadow-md"
                                                >
                                                    Claim Stock
                                                </button>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>

                    {/* My Inventory */}
                    <div ref={inventoryRef} className="bg-white shadow-lg rounded-2xl overflow-hidden border border-gray-100">
                        <div className="p-5 border-b border-gray-200">
                            <h3 className="text-xl font-bold flex items-center text-gray-900">
                                <div className="p-2 bg-orange-100 rounded-lg mr-3">
                                    <Flame className="h-5 w-5 text-orange-600" />
                                </div>
                                My Green Bean Inventory
                            </h3>
                        </div>
                        <div className="overflow-x-auto">
                            <table className="min-w-full divide-y divide-gray-200">
                                <thead className="bg-gray-900">
                                    <tr>
                                        <th scope="col" className="px-6 py-4 text-left text-xs font-bold text-white uppercase tracking-wider">Lot</th>
                                        <th scope="col" className="px-6 py-4 text-left text-xs font-bold text-white uppercase tracking-wider">Info</th>
                                        <th scope="col" className="px-6 py-4 text-left text-xs font-bold text-white uppercase tracking-wider">Remaining</th>
                                        <th scope="col" className="px-6 py-4 text-left text-xs font-bold text-white uppercase tracking-wider">Action</th>
                                    </tr>
                                </thead>
                                <tbody className="bg-white divide-y divide-gray-200">
                                    {myInventory.map((item, index) => (
                                        <tr key={item.id} className="bg-white hover:bg-gray-50 transition-colors duration-150">
                                            <td className="px-6 py-4 whitespace-nowrap">
                                                <span className="text-sm font-bold text-gray-900">{item.greenBeanLotId}</span>
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap">
                                                <div className="text-sm">
                                                    <span className="text-gray-700 font-medium">{item.variety}</span>
                                                    <span className="text-gray-500 mx-1">/</span>
                                                    <span className="text-gray-600">{item.process}</span>
                                                </div>
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap">
                                                <span className="text-sm text-gray-700 font-semibold">{item.remainingWeightKg.toFixed(2)} kg</span>
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap">
                                                <button
                                                    onClick={() => openLogRoastModal(item)}
                                                    className="inline-flex items-center px-4 py-2 text-sm font-bold rounded-lg text-white bg-green-600 hover:bg-green-700 transition-all duration-200 shadow-sm hover:shadow-md"
                                                >
                                                    <PlusCircle className="h-4 w-4 mr-1.5" />
                                                    Log Roast
                                                </button>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>
                </div>

                {/* Roast Log */}
                <div ref={roastLogRef} className="bg-white shadow-lg rounded-2xl overflow-hidden border border-gray-100">
                    <div className="p-5 border-b border-gray-200">
                        <h3 className="text-xl font-bold flex items-center text-gray-900">
                            <div className="p-2 bg-indigo-100 rounded-lg mr-3">
                                <BookText className="h-5 w-5 text-indigo-600" />
                            </div>
                            My Roast Log
                        </h3>
                    </div>
                    {/* Content */}
                    <div className="overflow-y-auto max-h-[70vh] bg-gray-50 p-4">
                        {myRoasts.length === 0 ? (
                            <div className="text-center py-12">
                                <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-gray-200 mb-4">
                                    <BookText className="h-8 w-8 text-gray-400" />
                                </div>
                                <p className="text-gray-500 font-medium">No roasts logged yet</p>
                                <p className="text-sm text-gray-400 mt-1">Start roasting to see your log here</p>
                            </div>
                        ) : (
                            <div className="space-y-3">
                                {myRoasts.map((roast) => (
                                    <div key={roast.id} className="bg-white rounded-xl p-4 border border-gray-200 hover:border-orange-300 hover:shadow-lg transition-all duration-200 group">
                                        {/* Header */}
                                        <div className="flex items-start justify-between mb-3">
                                            <div className="flex-1">
                                                <div className="flex items-center gap-2 mb-2">
                                                    <span className="inline-flex items-center px-2.5 py-1 rounded-lg text-xs font-bold bg-blue-50 text-blue-700 border border-blue-200">
                                                        {roast.roastDate}
                                                    </span>
                                                    <span className="text-sm font-bold text-gray-900">Lot {roast.greenBeanLotId}</span>
                                                </div>
                                                <div className="flex items-center gap-2 flex-wrap">
                                                    <span className="inline-flex items-center px-2.5 py-1 rounded-lg text-xs font-semibold bg-gray-100 text-gray-700">
                                                        <span className="font-bold text-gray-900">{roast.batchSizeKg.toFixed(2)}</span>&nbsp;kg
                                                    </span>
                                                    <span className="inline-flex items-center px-2.5 py-1 rounded-lg text-xs font-semibold bg-orange-50 text-orange-700 border border-orange-200">
                                                        {typeof roast.weightLossPct === 'number'
                                                            ? `${roast.yieldPercentage.toFixed(1)}% yield`
                                                            : `${roast.yieldPercentage.toFixed(1)}% yield`}
                                                    </span>
                                                </div>
                                            </div>
                                            <div className="p-2 bg-orange-50 rounded-lg group-hover:bg-orange-100 transition-colors">
                                                <Flame className="h-5 w-5 text-orange-600" />
                                            </div>
                                        </div>

                                        {/* Notes */}
                                        {roast.roastProfileNotes && (
                                            <div className="mb-3 bg-gray-50 rounded-lg p-3 border border-gray-200">
                                                <p className="text-sm text-gray-700 italic leading-relaxed">
                                                    "{roast.roastProfileNotes}"
                                                </p>
                                            </div>
                                        )}

                                        {/* Flavor Tags */}
                                        {roast.flavorNotes && (
                                            <div className="flex flex-wrap gap-1.5">
                                                {roast.flavorNotes
                                                    .split(',')
                                                    .map((note) => note.trim())
                                                    .filter(Boolean)
                                                    .map((note, index) => (
                                                        <span
                                                            key={index}
                                                            className="inline-flex items-center px-2.5 py-1 bg-yellow-50 text-yellow-800 text-xs font-semibold rounded-md border border-yellow-200"
                                                        >
                                                            {note}
                                                        </span>
                                                    ))}
                                            </div>
                                        )}
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                </div>

            </div>

            {/* Modals */}
            {isClaimModalOpen && selectedLot && (
                <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
                    <div className="bg-white rounded-3xl p-8 shadow-2xl w-full max-w-md border border-gray-200">
                        <form onSubmit={handleClaimSubmit}>
                            <div className="flex items-center gap-3 mb-4">
                                <div className="p-3 bg-green-100 rounded-xl">
                                    <Package className="h-6 w-6 text-green-600" />
                                </div>
                                <div>
                                    <h2 className="text-2xl font-bold text-gray-900">Claim Stock</h2>
                                    <p className="text-sm text-gray-500">from Lot {selectedLot.id}</p>
                                </div>
                            </div>

                            <div className="bg-green-50 border border-green-200 rounded-xl p-4 mb-6">
                                <p className="text-sm font-medium text-green-900">Available Stock</p>
                                <p className="text-3xl font-bold text-green-700">{selectedLot.currentWeightKg.toFixed(2)} kg</p>
                            </div>

                            <div className="mb-6">
                                <label className="block text-sm font-bold text-gray-700 mb-2">Amount to Claim (kg)</label>
                                <input
                                    type="number"
                                    step="0.1"
                                    max={selectedLot.currentWeightKg}
                                    value={claimAmount}
                                    onChange={e => setClaimAmount(e.target.value)}
                                    required
                                    className="block w-full border-2 border-gray-300 focus:border-green-500 focus:ring-2 focus:ring-green-200 rounded-xl py-3 px-4 text-lg font-semibold transition-all duration-200"
                                    placeholder="0.00"
                                />
                            </div>

                            <div className="flex justify-end gap-3">
                                <button
                                    type="button"
                                    onClick={() => setIsClaimModalOpen(false)}
                                    className="bg-gray-100 hover:bg-gray-200 text-gray-700 font-semibold py-3 px-6 rounded-xl transition-all duration-200"
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    className="bg-green-600 hover:bg-green-700 text-white font-semibold py-3 px-8 rounded-xl shadow-lg hover:shadow-xl transition-all duration-200 transform hover:-translate-y-0.5"
                                >
                                    Claim Stock
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {isLogRoastModalOpen && selectedInventoryItem && (
                <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
                    <div className="bg-white rounded-3xl p-8 shadow-2xl w-full max-w-2xl border border-gray-200 max-h-[90vh] overflow-y-auto">
                        <form onSubmit={handleLogRoastSubmit}>
                            <div className="flex items-center gap-3 mb-4">
                                <div className="p-3 bg-orange-100 rounded-xl">
                                    <Flame className="h-6 w-6 text-orange-600" />
                                </div>
                                <div>
                                    <h2 className="text-2xl font-bold text-gray-900">Log Roast</h2>
                                    <p className="text-sm text-gray-500">for Lot {selectedInventoryItem.greenBeanLotId}</p>
                                </div>
                            </div>

                            <div className="bg-orange-50 border border-orange-200 rounded-xl p-4 mb-6">
                                <p className="text-sm font-medium text-orange-900">Inventory Remaining</p>
                                <p className="text-3xl font-bold text-orange-700">{selectedInventoryItem.remainingWeightKg.toFixed(2)} kg</p>
                            </div>
                            <div className="space-y-6">
                                <div className="grid grid-cols-3 gap-4">
                                    <div>
                                        <label className="block text-sm font-bold text-gray-700 mb-2">Batch Size (kg)</label>
                                        <input
                                            type="number"
                                            min={0.01}
                                            step="0.01"
                                            required
                                            max={selectedInventoryItem.remainingWeightKg}
                                            value={roastForm.batchSize}
                                            onChange={(e) => setRoastForm({ ...roastForm, batchSize: e.target.value })}
                                            onInvalid={(e) =>
                                                (e.currentTarget as HTMLInputElement).setCustomValidity(
                                                    `Batch size must be between 0.01 and ${selectedInventoryItem.remainingWeightKg.toFixed(2)} kg`
                                                )
                                            }
                                            onInput={(e) => (e.currentTarget as HTMLInputElement).setCustomValidity('')}
                                            className="block w-full border-2 border-gray-300 focus:border-orange-500 focus:ring-2 focus:ring-orange-200 rounded-xl py-2.5 px-3 font-semibold transition-all duration-200"
                                            placeholder="0.00"
                                        />
                                    </div>

                                    <div>
                                        <label className="block text-sm font-bold text-gray-700 mb-2">Roasted Weight (kg)</label>
                                        <input
                                            type="number"
                                            min={0.01}
                                            step="0.01"
                                            required
                                            max={parseFloat(roastForm.batchSize) || undefined}
                                            value={roastForm.roastedWeight}
                                            onChange={(e) => setRoastForm({ ...roastForm, roastedWeight: e.target.value })}
                                            onInvalid={(e) =>
                                                (e.currentTarget as HTMLInputElement).setCustomValidity(
                                                    parseFloat(roastForm.batchSize)
                                                        ? `Roasted weight cannot exceed batch size (${parseFloat(roastForm.batchSize).toFixed(2)} kg)`
                                                        : 'Please enter batch size first'
                                                )
                                            }
                                            onInput={(e) => (e.currentTarget as HTMLInputElement).setCustomValidity('')}
                                            className="block w-full border-2 border-gray-300 focus:border-orange-500 focus:ring-2 focus:ring-orange-200 rounded-xl py-2.5 px-3 font-semibold transition-all duration-200"
                                            placeholder="0.00"
                                        />
                                    </div>

                                    <div>
                                        <label className="block text-sm font-bold text-gray-700 mb-2">Weight Loss / Yield</label>
                                        <div className="bg-gray-100 border-2 border-gray-300 rounded-xl py-2.5 px-3 text-sm font-bold text-gray-700">
                                            {(() => {
                                                const b = parseFloat(roastForm.batchSize || '0');
                                                const r = parseFloat(roastForm.roastedWeight || '0');
                                                if (!b || !r) return '—';
                                                const yieldPct = (r / b) * 100;
                                                const lossPct = 100 - yieldPct;
                                                return `${lossPct.toFixed(1)}% loss • ${yieldPct.toFixed(1)}% yield`;
                                            })()}
                                        </div>
                                    </div>
                                </div>

                                <div>
                                    <label className="block text-sm font-bold text-gray-700 mb-2">Roast Profile Notes</label>
                                    <textarea
                                        rows={3}
                                        value={roastForm.notes}
                                        onChange={e => setRoastForm({ ...roastForm, notes: e.target.value })}
                                        onInput={e => {
                                            const el = e.currentTarget;
                                            el.style.height = 'auto';
                                            el.style.height = el.scrollHeight + 'px';
                                        }}
                                        className="block w-full border-2 border-gray-300 focus:border-orange-500 focus:ring-2 focus:ring-orange-200 rounded-xl py-3 px-4 resize-none overflow-y-auto max-h-40 transition-all duration-200"
                                        placeholder="e.g., Medium roast profile. First crack at 9:30. Dropped at 11:15."
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-bold text-gray-700 mb-2">Flavor Notes</label>

                                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                                        {/* Aroma Types */}
                                        <div>
                                            <span className="block text-xs font-medium text-gray-600 mb-1">Aroma Types</span>
                                            <CustomDropdown
                                                value={selectedCategory}
                                                onChange={(cat) => {
                                                    const category = cat as keyof typeof FLAVOR_GROUPS;
                                                    setSelectedCategory(category);
                                                    setSelectedNote(FLAVOR_GROUPS[category][0]);
                                                }}
                                                options={Object.keys(FLAVOR_GROUPS)}
                                                placeholder="Select type..."
                                            />
                                        </div>

                                        {/* Aroma */}
                                        <div>
                                            <span className="block text-xs font-medium text-gray-600 mb-1">Aroma</span>
                                            <CustomDropdown
                                                value={selectedNote}
                                                onChange={setSelectedNote}
                                                options={FLAVOR_GROUPS[selectedCategory]}
                                                placeholder="Select aroma..."
                                            />
                                        </div>

                                        {/* ปุ่มเพิ่ม */}
                                        <div className="flex items-end">
                                            <button
                                                type="button"
                                                aria-label="เพิ่มกลิ่น"
                                                onClick={() => {
                                                    if (selectedNote && !selectedFlavorTags.includes(selectedNote)) {
                                                        setSelectedFlavorTags((prev) => [...prev, selectedNote]);
                                                    }
                                                }}
                                                className="inline-flex items-center justify-center rounded-xl bg-orange-500 text-white font-semibold px-4 py-2.5 w-full hover:bg-orange-600 transition-all duration-200 shadow-md hover:shadow-lg"
                                            >
                                                Add
                                            </button>
                                        </div>
                                    </div>

                                    {/* แสดงแท็กกลิ่นที่เลือกแล้ว */}
                                    <div className="mt-4 flex flex-wrap gap-2">
                                        {selectedFlavorTags.map((tag) => (
                                            <span
                                                key={tag}
                                                className="inline-flex items-center gap-2 rounded-full bg-yellow-100 text-yellow-800 text-sm font-semibold px-4 py-1.5 border border-yellow-200"
                                            >
                                                {tag}
                                                <button
                                                    type="button"
                                                    onClick={() => setSelectedFlavorTags((prev) => prev.filter(t => t !== tag))}
                                                    className="ml-1 text-yellow-700 hover:text-yellow-900 font-bold"
                                                    aria-label={`ลบ ${tag}`}
                                                >
                                                    ✕
                                                </button>
                                            </span>
                                        ))}
                                    </div>
                                </div>

                            </div>
                            <div className="mt-8 flex justify-end gap-3">
                                <button
                                    type="button"
                                    onClick={() => setIsLogRoastModalOpen(false)}
                                    className="bg-gray-100 hover:bg-gray-200 text-gray-700 font-semibold py-3 px-6 rounded-xl transition-all duration-200"
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    className="bg-orange-600 hover:bg-orange-700 text-white font-semibold py-3 px-8 rounded-xl shadow-lg hover:shadow-xl transition-all duration-200 transform hover:-translate-y-0.5"
                                >
                                    Log Roast
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};

export default RoasterWorkbench;