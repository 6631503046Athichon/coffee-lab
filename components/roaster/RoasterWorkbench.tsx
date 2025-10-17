

import React, { useState, useMemo } from 'react';
import { useDataContext } from '../../hooks/useDataContext';
import { User, GreenBeanLot, RoasterInventoryItem, RoastBatch } from '../../types';
import { Flame, Package, BookText, PlusCircle, ChevronsRight, Award, X } from 'lucide-react';


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


const RoasterWorkbench: React.FC<RoasterWorkbenchProps> = ({ currentUser }) => {
    const { data, setData } = useDataContext();

    const [isClaimModalOpen, setIsClaimModalOpen] = useState(false);
    const [isLogRoastModalOpen, setIsLogRoastModalOpen] = useState(false);
    const [selectedLot, setSelectedLot] = useState<(GreenBeanLot & { variety: string, process: string, finalScore: string | number }) | null>(null);
    const [selectedInventoryItem, setSelectedInventoryItem] = useState<(RoasterInventoryItem & { variety: string, process: string }) | null>(null);
    const [claimAmount, setClaimAmount] = useState('');
    const [roastForm, setRoastForm] = useState({ batchSize: '', roastedWeight: '', notes: '', flavorNotes: '' });
    const [selectedCategory, setSelectedCategory] = useState<keyof typeof FLAVOR_GROUPS>('Sweet');
    const [selectedNote, setSelectedNote] = useState<string>(FLAVOR_GROUPS['Sweet'][0]);
    const [selectedFlavorTags, setSelectedFlavorTags] = useState<string[]>([]);


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


    return (
        <div>
            <h1 className="text-3xl font-bold text-gray-900">Roaster's Workbench</h1>
            <p className="text-gray-600 mt-1 mb-8">Claim green bean lots, manage inventory, and log your roasts.</p>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                <div className="lg:col-span-2 space-y-8">
                    {/* Available Lots */}
                    <div className="bg-gray-900 text-white shadow-md rounded-lg overflow-hidden">
                        <div className="p-4 border-b"><h3 className="text-lg font-semibold flex items-center"><Package className="mr-2 text-green-600" /> Available Green Bean Lots</h3></div>
                        <div className="overflow-x-auto"><table className="min-w-full divide-y divide-gray-200">
                            <thead className="bg-gray-50"><tr><th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Lot</th><th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Info</th><th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Score</th><th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Available</th><th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Action</th></tr></thead>
                            <tbody className="bg-white divide-y divide-gray-200">
                                {availableLots.map(lot => (
                                    <tr key={lot.id}>
                                        <td className="px-4 py-2 text-black font-medium">{lot.id}</td>
                                        <td className="px-4 py-2 text-black text-sm">{lot.variety} / {lot.process}</td>
                                        <td className="px-4 py-2 text-black text-sm font-bold">{lot.finalScore}</td>
                                        <td className="px-4 py-2 text-black text-sm">{lot.currentWeightKg.toFixed(2)} kg</td>
                                        <td className="px-4 py-2"><button onClick={() => openClaimModal(lot)} className="inline-flex items-center px-2 py-1 border text-xs rounded shadow-sm text-white bg-green-600 hover:bg-green-700">Claim Stock</button></td>
                                    </tr>
                                ))}
                            </tbody>
                        </table></div>
                    </div>

                    {/* My Inventory */}
                    <div className="bg-gray-900 text-white shadow-md rounded-lg overflow-hidden">
                        <div className="p-4 border-b"><h3 className="text-lg font-semibold flex items-center"><Flame className="mr-2 text-orange-500" /> My Green Bean Inventory</h3></div>
                        <div className="overflow-x-auto"><table className="min-w-full divide-y divide-gray-200">
                            <thead className="bg-gray-50"><tr><th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Lot</th><th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Info</th><th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Remaining</th><th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Action</th></tr></thead>
                            <tbody className="bg-white divide-y divide-gray-200">
                                {myInventory.map(item => (
                                    <tr key={item.id}>
                                        <td className="px-4 py-2 text-black font-medium">{item.greenBeanLotId}</td>
                                        <td className="px-4 py-2 text-black text-sm">{item.variety} / {item.process}</td>
                                        <td className="px-4 py-2 text-black text-sm">{item.remainingWeightKg.toFixed(2)} kg</td>
                                        <td className="px-4 py-2 "><button onClick={() => openLogRoastModal(item)} className="inline-flex items-center px-2 py-1 border text-xs rounded shadow-sm text-white bg-orange-600 hover:bg-orange-700"><PlusCircle className="h-4 w-4 mr-1" /> Log Roast</button></td>
                                    </tr>
                                ))}
                            </tbody>
                        </table></div>
                    </div>
                </div>

                {/* Roast Log */}
                <div className="bg-white text-gray-900 shadow-md rounded-lg overflow-hidden">
                    <div className="p-4 bg-gray-900 text-white border-b border-gray-700">
                        <h3 className="text-lg font-semibold flex items-center">
                            <BookText className="mr-2 text-indigo-400" /> My Roast Log
                        </h3>
                    </div>
                    {/* Content */}
                    <div className="overflow-y-auto max-h-[70vh]">
                        <ul className="divide-y divide-gray-200">
                            {myRoasts.map((roast) => (
                                <li key={roast.id} className="p-4 hover:bg-gray-50 transition">
                                    <p className="font-semibold text-gray-900">
                                        {roast.roastDate} - Lot {roast.greenBeanLotId}
                                    </p>
                                    <p className="text-sm text-gray-600">
                                        {roast.batchSizeKg} kg roasted,{' '}
                                        {typeof roast.weightLossPct === 'number'
                                            ? `${roast.weightLossPct.toFixed(1)}% weight loss`
                                            : `${roast.yieldPercentage.toFixed(1)}% yield`}
                                    </p>
                                    {roast.roastProfileNotes && (
                                        <p className="text-sm text-gray-500 mt-1 italic">
                                            "{roast.roastProfileNotes}"
                                        </p>
                                    )}
                                    {roast.flavorNotes && (
                                        <div className="mt-2 flex flex-wrap gap-1">
                                            {roast.flavorNotes
                                                .split(',')
                                                .map((note) => note.trim())
                                                .filter(Boolean)
                                                .map((note, index) => (
                                                    <span
                                                        key={index}
                                                        className="px-2 py-0.5 bg-yellow-100 text-yellow-800 text-xs font-medium rounded-full"
                                                    >
                                                        {note}
                                                    </span>
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
                <div><label className="block text-sm font-medium">Amount to Claim (kg)</label><input type="number" step="0.1" max={selectedLot.currentWeightKg} value={claimAmount} onChange={e => setClaimAmount(e.target.value)} required className="mt-1 block w-full border-gray-300 rounded-md py-2 px-3" /></div>
                <div className="mt-6 flex justify-end gap-3"><button type="button" onClick={() => setIsClaimModalOpen(false)} className="bg-white py-2 px-4 border rounded-md">Cancel</button><button type="submit" className="py-2 px-4 border rounded-md text-white bg-indigo-600">Claim</button></div>
            </form></div></div>}

            {isLogRoastModalOpen && selectedInventoryItem && <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4"><div className="bg-white rounded-lg p-8 shadow-2xl w-full max-w-xl"><form onSubmit={handleLogRoastSubmit}>
                <h2 className="text-xl font-bold mb-2">Log Roast for Lot {selectedInventoryItem.greenBeanLotId}</h2>
                <p className="text-sm text-gray-600 mb-4">Inventory remaining: {selectedInventoryItem.remainingWeightKg.toFixed(2)} kg</p>
                <div className="space-y-4">
                    <div className="grid grid-cols-3 gap-4">
                        <div>
                            <label className="block text-sm font-medium">Batch Size (kg)</label>
                            <input
                                type="number"
                                min={0.01}
                                step="0.01"
                                required
                                // จำกัดไม่ให้เกินสต็อกคงเหลือ
                                max={selectedInventoryItem.remainingWeightKg}
                                value={roastForm.batchSize}
                                onChange={(e) => setRoastForm({ ...roastForm, batchSize: e.target.value })}
                                // ข้อความเตือนของเบราว์เซอร์เมื่อ invalid
                                onInvalid={(e) =>
                                    (e.currentTarget as HTMLInputElement).setCustomValidity(
                                        `Batch size must be between 0.01 and ${selectedInventoryItem.remainingWeightKg.toFixed(2)} kg`
                                    )
                                }
                                onInput={(e) => (e.currentTarget as HTMLInputElement).setCustomValidity('')}
                                className="mt-1 block w-full border-gray-300 rounded-md py-2 px-3 bg-gray-50"
                            />
                        </div>

                        <div>
                            <label className="block text-sm font-medium">Roasted Weight (kg)</label>
                            <input
                                type="number"
                                min={0.01}
                                step="0.01"
                                required
                                // จำกัดไม่ให้เกิน batch ที่กรอกไว้ (ทำให้เกิด bubble ทันทีเวลาใส่เกิน)
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
                                className="mt-1 block w-full border-gray-300 rounded-md py-2 px-3 bg-gray-50"
                            />
                        </div>

                        <div>
                            <label className="block text-sm font-medium">Weight Loss / Yield</label>
                            <div className="mt-1 text-sm text-gray-900 rounded-md py-2 px-3 bg-gray-50">
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

                    <div>{/* Roast Profile Notes */}
                        <div>
                            <label className="block text-sm font-medium">Roast Profile Notes</label>
                            <textarea
                                rows={3}
                                value={roastForm.notes}
                                onChange={e => setRoastForm({ ...roastForm, notes: e.target.value })}
                                onInput={e => {
                                    const el = e.currentTarget;
                                    el.style.height = 'auto';
                                    el.style.height = el.scrollHeight + 'px';
                                }}
                                className="mt-1 block w-full border-gray-300 rounded-md bg-gray-50 resize-none overflow-y-auto max-h-40 focus:outline-none focus:ring-2 focus:ring-gray-900 focus:border-transparent py-2 px-3"
                            />
                        </div>
                    </div>
                    <div>
                        <label className="block text-sm font-medium">Flavor Notes</label>

                        <div className="mt-1 grid grid-cols-1 sm:grid-cols-3 gap-3">
                            {/* Aroma Types */}
                            <div className="relative">
                                <span className="block text-xs text-gray-500 mb-1">Aroma Types</span>
                                <select
                                    aria-label="Aroma Types"
                                    value={selectedCategory}
                                    onChange={(e) => {
                                        const cat = e.target.value as keyof typeof FLAVOR_GROUPS;
                                        setSelectedCategory(cat);
                                        setSelectedNote(FLAVOR_GROUPS[cat][0]);
                                    }}
                                    className="block w-full rounded-lg border border-gray-300 bg-white py-2 px-3 pr-10
                 appearance-none focus:outline-none focus:ring-2 focus:ring-indigo-500
                 focus:border-transparent"
                                >
                                    {Object.keys(FLAVOR_GROUPS).map((cat) => (
                                        <option key={cat} value={cat}>{cat}</option>
                                    ))}
                                </select>
                                {/* ลูกศร */}
                                <svg
                                    className="pointer-events-none absolute right-3 top-[38px] -translate-y-1/2 h-4 w-4 text-gray-500"
                                    viewBox="0 0 20 20" fill="currentColor"
                                >
                                    <path d="M5.25 7.5L10 12.25 14.75 7.5H5.25z" />
                                </svg>
                            </div>

                            {/* Aroma */}
                            <div className="relative">
                                <span className="block text-xs text-gray-500 mb-1">Aroma</span>
                                <select
                                    aria-label="Aroma"
                                    value={selectedNote}
                                    onChange={(e) => setSelectedNote(e.target.value)}
                                    className="block w-full rounded-lg border border-gray-300 bg-white py-2 px-3 pr-10
                 appearance-none focus:outline-none focus:ring-2 focus:ring-indigo-500
                 focus:border-transparent"
                                >
                                    {FLAVOR_GROUPS[selectedCategory].map((note) => (
                                        <option key={note} value={note}>{note}</option>
                                    ))}
                                </select>
                                <svg
                                    className="pointer-events-none absolute right-3 top-[38px] -translate-y-1/2 h-4 w-4 text-gray-500"
                                    viewBox="0 0 20 20" fill="currentColor"
                                >
                                    <path d="M5.25 7.5L10 12.25 14.75 7.5H5.25z" />
                                </svg>
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
                                    className="inline-flex items-center justify-center rounded-lg bg-orange-500
                 text-white px-3 py-2 w-full hover:bg-orange-600"
                                >
                                    Add
                                </button>
                            </div>
                        </div>

                        {/* แสดงแท็กกลิ่นที่เลือกแล้ว */}
                        <div className="mt-3 flex flex-wrap gap-2">
                            {selectedFlavorTags.map((tag) => (
                                <span
                                    key={tag}
                                    className="inline-flex items-center gap-2 rounded-full bg-yellow-100
                 text-yellow-800 text-xs font-medium px-3 py-1"
                                >
                                    {tag}
                                    <button
                                        type="button"
                                        onClick={() => setSelectedFlavorTags((prev) => prev.filter(t => t !== tag))}
                                        className="ml-1 text-yellow-900/70 hover:text-yellow-900"
                                        aria-label={`ลบ ${tag}`}
                                    >
                                        ✕
                                    </button>
                                </span>
                            ))}
                        </div>

                    </div>

                </div>
                <div className="mt-6 flex justify-end gap-3"><button type="button" onClick={() => setIsLogRoastModalOpen(false)} className="bg-white py-2 px-4 border rounded-md">Cancel</button><button type="submit" className="py-2 px-4 border rounded-md bg-orange-500 text-white px-3 py-2 hover:bg-orange-700">Log Roast</button></div>
            </form></div></div>}
        </div>
    );
};

export default RoasterWorkbench;