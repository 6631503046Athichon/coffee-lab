

import React, { useState, useMemo } from 'react';
import { useParams } from 'react-router-dom';
import { useDataContext } from '../hooks/useDataContext';
import { Radar, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, ResponsiveContainer } from 'recharts';
import { SCA_ATTRIBUTES, User, CuppingSession } from '../types';
import { Thermometer, Droplets, QrCode, Printer, Flame, Copy, Check } from 'lucide-react';

const FlavorProfileChart: React.FC<{ data: any[] }> = ({ data }) => (
    <ResponsiveContainer width="100%" height={300}>
        <RadarChart cx="50%" cy="50%" outerRadius="80%" data={data}>
            <PolarGrid />
            <PolarAngleAxis dataKey="attribute" tick={{ fill: '#4A5568', fontSize: 12 }} />
            <PolarRadiusAxis angle={30} domain={[6, 10]} tickCount={5} />
            <Radar name="Score" dataKey="score" stroke="#4f46e5" fill="#6366f1" fillOpacity={0.6} />
        </RadarChart>
    </ResponsiveContainer>
);

const TraceabilityPage: React.FC = () => {
    const { lotId } = useParams<{ lotId: string }>();
    const { data } = useDataContext();
    const [isLinkCopied, setIsLinkCopied] = useState(false);

    const greenBeanLot = data.greenBeanLots.find(lot => lot.id === lotId);
    if (!greenBeanLot) return <div className="p-8 text-center"><h1>Lot not found</h1><p>The requested coffee lot could not be found.</p></div>;

    const parchmentLot = data.parchmentLots.find(p => p.id === greenBeanLot.parchmentLotId);
    const processingBatch = data.processingBatches.find(b => b.id === parchmentLot?.processingBatchId);
    const harvestLot = data.harvestLots.find(h => h.id === parchmentLot?.harvestLotId);
    
    const scoreInfo = greenBeanLot.cuppingScores[0];
    let cuppingResult: CuppingSession['finalResults'][string] | undefined;
    if (scoreInfo) {
        const session = data.cuppingSessions.find(s => s.id === scoreInfo.sessionId);
        const sample = session?.samples.find(s => s.greenBeanLotId === greenBeanLot.id);
        if (session && sample && session.finalResults && session.finalResults[sample.id]) {
            cuppingResult = session.finalResults[sample.id];
        }
    }
    
    const roastBatches = useMemo(() => data.roastBatches.filter(rb => rb.greenBeanLotId === lotId), [data.roastBatches, lotId]);
    
    let roaster: User | undefined;
    if (roastBatches.length > 0) {
        const roasterId = roastBatches[0].roasterId;
        roaster = data.users.find(u => u.id === roasterId);
    }
    
    const flavorNotes = useMemo(() => {
        const allNotes = roastBatches.flatMap(rb => 
            rb.flavorNotes ? rb.flavorNotes.split(',').map(n => n.trim().toLowerCase()) : []
        );
        const uniqueNotes = [...new Set(allNotes)].filter(Boolean);
        // Capitalize first letter of each note for display
// fix: Add explicit string type to 'note' to resolve TS error.
        return uniqueNotes.map((note: string) => note.charAt(0).toUpperCase() + note.slice(1));
    }, [roastBatches]);

    const chartData = cuppingResult ? SCA_ATTRIBUTES.map(attr => ({
        attribute: attr.split('/')[0], // Shorten label
        score: cuppingResult.avgScores[attr] || 0,
        fullMark: 10,
    })) : [];

    const pageUrl = window.location.href;
    const qrCodeUrl = `https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(pageUrl)}`;

    const handlePrint = () => {
        const qrCodeElement = document.getElementById('qr-code-container');
        if (qrCodeElement) {
            const printWindow = window.open('', '', 'height=400,width=400');
            if (printWindow) {
                printWindow.document.write('<html><head><title>Print QR Code</title></head><body style="text-align: center; margin-top: 50px;">');
                printWindow.document.write(qrCodeElement.innerHTML);
                printWindow.document.write('</body></html>');
                printWindow.document.close();
                printWindow.focus();
                printWindow.print();
                printWindow.close();
            }
        }
    };

    const handleCopyLink = () => {
        navigator.clipboard.writeText(pageUrl).then(() => {
            setIsLinkCopied(true);
            setTimeout(() => setIsLinkCopied(false), 2000); // Reset after 2 seconds
        });
    };
    
    const dryingDuration = processingBatch?.dryingStartDate && processingBatch?.dryingEndDate
        ? `${Math.round((new Date(processingBatch.dryingEndDate).getTime() - new Date(processingBatch.dryingStartDate).getTime()) / (1000 * 3600 * 24))} Days`
        : 'N/A';
    
    let avgTemp = 'N/A';
    let avgHumidity = 'N/A';
    if (processingBatch?.dryingLog && processingBatch.dryingLog.length > 0) {
        const tempSum = processingBatch.dryingLog.reduce((sum, log) => sum + log.ambientTemp, 0);
        const humiditySum = processingBatch.dryingLog.reduce((sum, log) => sum + log.relativeHumidity, 0);
        avgTemp = `${(tempSum / processingBatch.dryingLog.length).toFixed(0)}°C`;
        avgHumidity = `${(humiditySum / processingBatch.dryingLog.length).toFixed(0)}%`;
    }

    return (
        <div className="max-w-4xl mx-auto bg-white shadow-lg rounded-lg overflow-hidden my-8">
            {/* Section 1: Introduction */}
            <div>
                <img src="https://picsum.photos/1200/600?image=1060" alt="Coffee Farm" className="w-full h-64 object-cover" />
                <div className="p-6 md:p-8">
                    <h1 className="text-4xl font-extrabold text-gray-800 tracking-tight">{harvestLot?.cherryVariety || 'Specialty Coffee'} Lot {lotId}</h1>
                    <p className="mt-2 text-indigo-600 font-semibold">{harvestLot?.farmPlotLocation}</p>
                    <div className="mt-4 flex flex-wrap gap-2">
                        {flavorNotes.map(note => (
                            <span key={note} className="px-3 py-1 bg-yellow-100 text-yellow-800 text-sm font-medium rounded-full">{note}</span>
                        ))}
                    </div>
                    <p className="mt-6 text-gray-600 leading-relaxed">
                        This exceptional lot comes from {harvestLot?.farmerName}, a dedicated producer whose commitment to quality shines through in every cup. Grown in the rich volcanic soils of {harvestLot?.farmPlotLocation}, these {harvestLot?.cherryVariety} beans were carefully hand-picked and processed with meticulous attention to detail, resulting in a truly remarkable flavor experience.
                    </p>
                </div>
            </div>

            {/* Section 2: QR Code Share */}
            <div className="bg-indigo-50 p-6 md:p-8 border-t border-b border-gray-200">
                <h2 className="text-2xl font-bold text-gray-800 mb-4 text-center flex items-center justify-center gap-2"><QrCode /> Share This Coffee's Story</h2>
                <div className="flex flex-col md:flex-row items-center justify-center gap-8">
                    <div id="qr-code-container">
                        <img 
                            src={qrCodeUrl}
                            alt={`QR Code for Lot ${lotId}`}
                            className="rounded-lg shadow-md border-4 border-white"
                        />
                    </div>
                    <div>
                        <p className="text-gray-700 max-w-sm">
                            Roasters, add this QR code to your packaging to connect your customers directly to the farm-to-cup journey of this coffee. A simple scan with a smartphone camera will open this traceability page.
                        </p>
                        <div className="mt-4 flex flex-col sm:flex-row items-center gap-3">
                            <button
                                onClick={handlePrint}
                                className="w-full sm:w-auto inline-flex items-center justify-center rounded-md border border-transparent bg-indigo-600 px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-indigo-700"
                            >
                                <Printer className="h-4 w-4 mr-2" />
                                Print QR Code
                            </button>
                            <button
                                onClick={handleCopyLink}
                                className="w-full sm:w-auto inline-flex items-center justify-center rounded-md border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 shadow-sm hover:bg-gray-50"
                            >
                                {isLinkCopied ? (
                                    <>
                                        <Check className="h-4 w-4 mr-2 text-green-500" />
                                        Copied!
                                    </>
                                ) : (
                                    <>
                                        <Copy className="h-4 w-4 mr-2" />
                                        Copy Link
                                    </>
                                )}
                            </button>
                        </div>
                    </div>
                </div>
            </div>

            <div className="bg-gray-50 p-6 md:p-8 border-t border-b border-gray-200">
                {/* Section 3: Journey */}
                <h2 className="text-2xl font-bold text-gray-800 mb-4">The Journey from the Farm</h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-sm">
                    <div className="bg-white p-4 rounded-lg border">
                        <h3 className="font-bold text-gray-900">Origin Details</h3>
                        <p><strong>Producer:</strong> {harvestLot?.farmerName}</p>
                        <p><strong>Variety:</strong> {harvestLot?.cherryVariety}</p>
                        <p><strong>Harvest Date:</strong> {harvestLot?.harvestDate}</p>
                    </div>
                    <div className="bg-white p-4 rounded-lg border">
                        <h3 className="font-bold text-gray-900">Processing Details</h3>
                        <p><strong>Method:</strong> {processingBatch?.processType}</p>
                        <p><strong>Drying Duration:</strong> {dryingDuration}</p>
                        <p className="flex items-center gap-4 mt-2">
                            <span className="flex items-center" title="Avg Temp"><Thermometer size={16} className="text-red-500 mr-1"/> {avgTemp}</span>
                            <span className="flex items-center" title="Avg Humidity"><Droplets size={16} className="text-blue-500 mr-1"/> {avgHumidity}</span>
                        </p>
                    </div>
                </div>
            </div>

            {/* Section 4: Quality */}
            <div className="p-6 md:p-8">
                <h2 className="text-2xl font-bold text-gray-800 mb-6 text-center">Quality in the Cup</h2>
                <div className="flex flex-col md:flex-row items-center gap-8">
                    <div className="w-full md:w-1/2">
                        <h3 className="font-bold text-gray-900 text-lg mb-2">Flavor Profile</h3>
                        <FlavorProfileChart data={chartData} />
                    </div>
                    <div className="w-full md:w-1/2">
                         <div className="text-center mb-6">
                            <p className="text-sm text-gray-500 uppercase">Final Cupping Score</p>
                            <p className="text-7xl font-extrabold text-indigo-600">{cuppingResult?.totalScore.toFixed(2)}</p>
                            <p className="mt-1 font-semibold text-green-700 bg-green-100 rounded-full px-4 py-1 inline-block">Specialty Grade</p>
                        </div>
                        <div>
                            <h3 className="font-bold text-gray-900 text-lg mb-2">Cupper's Final Notes</h3>
                            <div className="bg-indigo-50 p-4 rounded-lg">
                                <p className="text-gray-700 italic">"{cuppingResult?.finalNotes}"</p>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
            
            {/* Section 5: Roaster Details */}
            {roastBatches.length > 0 && roaster && (
                <div className="bg-gray-50 p-6 md:p-8 border-t border-gray-200">
                    <h2 className="text-2xl font-bold text-gray-800 mb-4 text-center flex items-center justify-center gap-2">
                        <Flame className="text-orange-500" />
                        Roasted By: <span className="text-indigo-600">{roaster.name}</span>
                    </h2>
                    <div className="max-w-2xl mx-auto space-y-4">
                        {roastBatches.map(roast => (
                            <div key={roast.id} className="bg-white p-4 rounded-lg border border-gray-200">
                                <div className="flex justify-between items-center mb-2">
                                    <h3 className="font-bold text-gray-900">Roast Details</h3>
                                    <p className="text-sm text-gray-500">{roast.roastDate}</p>
                                </div>
                                <blockquote className="text-sm text-gray-700 italic border-l-4 border-gray-200 pl-4">
                                    {roast.roastProfileNotes}
                                </blockquote>
                                {roast.flavorNotes && (
                                    <div className="mt-3 flex flex-wrap items-center gap-2">
                                        <strong className="text-xs text-gray-900">Flavor Notes:</strong>
                                        {roast.flavorNotes.split(',').map(note => note.trim()).filter(Boolean).map((note, index) => (
                                            <span key={index} className="px-2 py-0.5 bg-yellow-100 text-yellow-800 text-xs font-medium rounded-full">{note}</span>
                                        ))}
                                    </div>
                                )}
                                <div className="mt-3 pt-3 border-t border-gray-100 flex gap-4 text-xs text-gray-500">
                                    <span><strong>Batch Size:</strong> {roast.batchSizeKg} kg</span>
                                    <span><strong>Yield:</strong> {roast.yieldPercentage}%</span>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            )}
        </div>
    );
};

export default TraceabilityPage;