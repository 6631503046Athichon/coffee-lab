

import React, { useState, useMemo } from 'react';
import { useDataContext } from '../../hooks/useDataContext';
import { User, GreenBeanLot, RoasterInventoryItem, RoastBatch } from '../../types';
import { Flame, Package, BookText, PlusCircle, ChevronsRight, Award, X } from 'lucide-react';

interface RoasterWorkbenchProps {
    currentUser: User;
}

const RoasterWorkbench: React.FC<RoasterWorkbenchProps> = ({ currentUser }) => {
    const { data, setData } = useDataContext();

    const [isClaimModalOpen, setIsClaimModalOpen] = useState(false);
    const [isLogRoastModalOpen, setIsLogRoastModalOpen] = useState(false);
    const [selectedLot, setSelectedLot] = useState<(GreenBeanLot & { variety: string, process: string, finalScore: string | number }) | null>(null);
    const [selectedInventoryItem, setSelectedInventoryItem] = useState<(RoasterInventoryItem & { variety: string, process: string }) | null>(null);
    const [claimAmount, setClaimAmount] = useState('');
    const [roastForm, setRoastForm] = useState({ batchSize: '', yieldPercentage: '85', notes: '', flavorNotes: '' });

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

    const handleLogRoastSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        const batchSize = parseFloat(roastForm.batchSize);
        if (!selectedInventoryItem || !batchSize || batchSize <= 0 || batchSize > selectedInventoryItem.remainingWeightKg) return alert('Invalid batch size.');

        setData(prev => {
            const updatedInventory = prev.roasterInventory.map(item => item.id === selectedInventoryItem.id ? { ...item, remainingWeightKg: item.remainingWeightKg - batchSize } : item);
            const newRoast: RoastBatch = { 
                id: `RB${String(prev.roastBatches.length + 1).padStart(3, '0')}`, 
                roasterId: currentUser.id, 
                roasterInventoryId: selectedInventoryItem.id, 
                greenBeanLotId: selectedInventoryItem.greenBeanLotId, 
                roastDate: new Date().toISOString().substring(0, 10), 
                batchSizeKg: batchSize, 
                yieldPercentage: parseFloat(roastForm.yieldPercentage), 
                roastProfileNotes: roastForm.notes,
                flavorNotes: roastForm.flavorNotes,
            };
            return { ...prev, roasterInventory: updatedInventory, roastBatches: [...prev.roastBatches, newRoast] };
        });
        setIsLogRoastModalOpen(false);
    };

    return (
        <div>
            <h1 className="text-3xl font-bold text-gray-900">Roaster's Workbench</h1>
            <p className="text-gray-600 mt-1 mb-8">Claim green bean lots, manage inventory, and log your roasts.</p>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                <div className="lg:col-span-2 space-y-8">
                    {/* Available Lots */}
                    <div className="bg-white shadow-md rounded-lg overflow-hidden">
                        <div className="p-4 border-b"><h3 className="text-lg font-semibold flex items-center"><Package className="mr-2 text-green-600"/> Available Green Bean Lots</h3></div>
                        <div className="overflow-x-auto"><table className="min-w-full divide-y divide-gray-200">
                            <thead className="bg-gray-50"><tr><th className="px-4 py-4 text-left text-xs font-bold text-gray-700 uppercase tracking-wider">Lot</th><th className="px-4 py-4 text-left text-xs font-bold text-gray-700 uppercase tracking-wider">Info</th><th className="px-4 py-4 text-left text-xs font-bold text-gray-700 uppercase tracking-wider">Score</th><th className="px-4 py-4 text-left text-xs font-bold text-gray-700 uppercase tracking-wider">Available</th><th className="px-4 py-4 text-left text-xs font-bold text-gray-700 uppercase tracking-wider">Action</th></tr></thead>
                            <tbody className="bg-white divide-y divide-gray-200">
                                {availableLots.map(lot => (
                                    <tr key={lot.id}>
                                        <td className="px-4 py-2 font-medium">{lot.id}</td>
                                        <td className="px-4 py-2 text-sm">{lot.variety} / {lot.process}</td>
                                        <td className="px-4 py-2 text-sm font-bold text-indigo-600">{lot.finalScore}</td>
                                        <td className="px-4 py-2 text-sm">{lot.currentWeightKg.toFixed(2)} kg</td>
                                        <td className="px-4 py-2"><button onClick={() => openClaimModal(lot)} className="inline-flex items-center px-2 py-1 border text-xs rounded shadow-sm text-white bg-blue-600 hover:bg-blue-700">Claim Stock</button></td>
                                    </tr>
                                ))}
                            </tbody>
                        </table></div>
                    </div>

                    {/* My Inventory */}
                    <div className="bg-white shadow-md rounded-lg overflow-hidden">
                        <div className="p-4 border-b"><h3 className="text-lg font-semibold flex items-center"><Flame className="mr-2 text-orange-500"/> My Green Bean Inventory</h3></div>
                        <div className="overflow-x-auto"><table className="min-w-full divide-y divide-gray-200">
                            <thead className="bg-gray-50"><tr><th className="px-4 py-4 text-left text-xs font-bold text-gray-700 uppercase tracking-wider">Lot</th><th className="px-4 py-4 text-left text-xs font-bold text-gray-700 uppercase tracking-wider">Info</th><th className="px-4 py-4 text-left text-xs font-bold text-gray-700 uppercase tracking-wider">Remaining</th><th className="px-4 py-4 text-left text-xs font-bold text-gray-700 uppercase tracking-wider">Action</th></tr></thead>
                            <tbody className="bg-white divide-y divide-gray-200">
                                {myInventory.map(item => (
                                    <tr key={item.id}>
                                        <td className="px-4 py-2 font-medium">{item.greenBeanLotId}</td>
                                        <td className="px-4 py-2 text-sm">{item.variety} / {item.process}</td>
                                        <td className="px-4 py-2 text-sm">{item.remainingWeightKg.toFixed(2)} kg</td>
                                        <td className="px-4 py-2"><button onClick={() => openLogRoastModal(item)} className="inline-flex items-center px-2 py-1 border text-xs rounded shadow-sm text-white bg-green-600 hover:bg-green-700"><PlusCircle className="h-4 w-4 mr-1"/> Log Roast</button></td>
                                    </tr>
                                ))}
                            </tbody>
                        </table></div>
                    </div>
                </div>

                {/* Roast Log */}
                <div className="bg-white shadow-md rounded-lg overflow-hidden">
                    <div className="p-4 border-b"><h3 className="text-lg font-semibold flex items-center"><BookText className="mr-2 text-indigo-600"/> My Roast Log</h3></div>
                    <div className="overflow-y-auto max-h-[70vh]">
                        <ul className="divide-y divide-gray-200">
                            {myRoasts.map(roast => (
                                <li key={roast.id} className="p-4">
                                    <p className="font-semibold">{roast.roastDate} - Lot {roast.greenBeanLotId}</p>
                                    <p className="text-sm text-gray-600">{roast.batchSizeKg} kg roasted, {roast.yieldPercentage}% yield</p>
                                    <p className="text-sm text-gray-500 mt-1 italic">"{roast.roastProfileNotes}"</p>
                                    {roast.flavorNotes && (
                                        <div className="mt-2 flex flex-wrap gap-1">
                                            {roast.flavorNotes.split(',').map(note => note.trim()).filter(Boolean).map((note, index) => (
                                                <span key={index} className="px-2 py-0.5 bg-yellow-100 text-yellow-800 text-xs font-medium rounded-full">{note}</span>
                                            ))}
                                        </div>
                                    )}
                                </li>
                            ))}
                        </ul>
                    </div>
                </div>
            </div>

            {/* Modals */}
            {isClaimModalOpen && selectedLot && <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4"><div className="bg-white rounded-lg p-8 shadow-2xl w-full max-w-sm"><form onSubmit={handleClaimSubmit}>
                <h2 className="text-xl font-bold mb-2">Claim Stock from Lot {selectedLot.id}</h2>
                <p className="text-sm text-gray-600 mb-4">Available: {selectedLot.currentWeightKg.toFixed(2)} kg</p>
                <div><label className="block text-sm font-medium">Amount to Claim (kg)</label><input type="number" step="0.1" max={selectedLot.currentWeightKg} value={claimAmount} onChange={e => setClaimAmount(e.target.value)} required className="mt-1 block w-full border-gray-300 rounded-md py-2 px-3"/></div>
                <div className="mt-6 flex justify-end gap-3"><button type="button" onClick={() => setIsClaimModalOpen(false)} className="bg-white py-2 px-4 border rounded-md">Cancel</button><button type="submit" className="py-2 px-4 border rounded-md text-white bg-indigo-600">Claim</button></div>
            </form></div></div>}

            {isLogRoastModalOpen && selectedInventoryItem && <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4"><div className="bg-white rounded-lg p-8 shadow-2xl w-full max-w-md"><form onSubmit={handleLogRoastSubmit}>
                <h2 className="text-xl font-bold mb-2">Log Roast for Lot {selectedInventoryItem.greenBeanLotId}</h2>
                <p className="text-sm text-gray-600 mb-4">Inventory remaining: {selectedInventoryItem.remainingWeightKg.toFixed(2)} kg</p>
                <div className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                        <div><label className="block text-sm font-medium">Batch Size (kg)</label><input type="number" step="0.1" max={selectedInventoryItem.remainingWeightKg} value={roastForm.batchSize} onChange={e => setRoastForm({...roastForm, batchSize: e.target.value})} required className="mt-1 block w-full border-gray-300 rounded-md py-2 px-3"/></div>
                        <div><label className="block text-sm font-medium">Yield (%)</label><input type="number" step="1" value={roastForm.yieldPercentage} onChange={e => setRoastForm({...roastForm, yieldPercentage: e.target.value})} required className="mt-1 block w-full border-gray-300 rounded-md py-2 px-3"/></div>
                    </div>
                    <div><label className="block text-sm font-medium">Roast Profile Notes</label><textarea rows={3} value={roastForm.notes} onChange={e => setRoastForm({...roastForm, notes: e.target.value})} className="mt-1 block w-full border-gray-300 rounded-md"></textarea></div>
                    <div>
                        <label className="block text-sm font-medium">Flavor Notes</label>
                        <input
                            type="text"
                            placeholder="e.g., chocolate, citrus, floral"
                            value={roastForm.flavorNotes}
                            onChange={e => setRoastForm({ ...roastForm, flavorNotes: e.target.value })}
                            className="mt-1 block w-full border-gray-300 rounded-md py-2 px-3"
                        />
                    </div>
                </div>
                <div className="mt-6 flex justify-end gap-3"><button type="button" onClick={() => setIsLogRoastModalOpen(false)} className="bg-white py-2 px-4 border rounded-md">Cancel</button><button type="submit" className="py-2 px-4 border rounded-md text-white bg-indigo-600">Log Roast</button></div>
            </form></div></div>}
        </div>
    );
};

export default RoasterWorkbench;