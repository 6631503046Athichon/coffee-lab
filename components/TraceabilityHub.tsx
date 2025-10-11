
import React, { useState, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { useDataContext } from '../hooks/useDataContext';
import { Search, ExternalLink, CheckCircle, Archive } from 'lucide-react';

const TraceabilityHub: React.FC = () => {
    const { data } = useDataContext();
    const [searchTerm, setSearchTerm] = useState('');

    const enrichedLots = useMemo(() => {
        return data.greenBeanLots.map(gbl => {
            const parchmentLot = data.parchmentLots.find(p => p.id === gbl.parchmentLotId);
            const processingBatch = data.processingBatches.find(b => b.id === parchmentLot?.processingBatchId);
            const harvestLot = data.harvestLots.find(h => h.id === parchmentLot?.harvestLotId);
            
            let finalScore: string | number = 'N/A';
            const scoreInfo = gbl.cuppingScores[0];
            if (scoreInfo) {
                const session = data.cuppingSessions.find(s => s.id === scoreInfo.sessionId);
                const sample = session?.samples.find(s => s.greenBeanLotId === gbl.id);
                if (session && sample && session.finalResults && session.finalResults[sample.id]) {
                    finalScore = session.finalResults[sample.id].totalScore.toFixed(2);
                } else if (scoreInfo.score) { // Fallback to score on GBL if final results not compiled
                    finalScore = scoreInfo.score.toFixed(2);
                }
            }

            return {
                ...gbl,
                processType: processingBatch?.processType || 'N/A',
                variety: harvestLot?.cherryVariety || 'N/A',
                finalScore,
            };
        });
    }, [data.greenBeanLots, data.parchmentLots, data.processingBatches, data.harvestLots, data.cuppingSessions]);

    const filteredLots = useMemo(() => {
        return enrichedLots.filter(lot => 
            lot.id.toLowerCase().includes(searchTerm.toLowerCase()) ||
            lot.grade.toLowerCase().includes(searchTerm.toLowerCase()) ||
            lot.processType.toLowerCase().includes(searchTerm.toLowerCase()) ||
            lot.variety.toLowerCase().includes(searchTerm.toLowerCase())
        ).sort((a, b) => a.id.localeCompare(b.id));
    }, [enrichedLots, searchTerm]);

    return (
        <div>
            <h1 className="text-3xl font-bold text-gray-900">Traceability Curation Hub</h1>
            <p className="text-gray-600 mt-1 mb-6">Manage and view public traceability pages for green bean lots.</p>

            <div className="mb-6">
                <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                        <Search className="h-5 w-5 text-gray-400" />
                    </div>
                    <input
                        type="text"
                        placeholder="Search by Lot ID, variety, process, or grade..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md leading-5 bg-white placeholder-gray-500 focus:outline-none focus:placeholder-gray-400 focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                    />
                </div>
            </div>

            <div className="bg-white shadow-md rounded-lg overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-gray-200">
                        <thead className="bg-gray-50">
                            <tr>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Lot ID</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Variety</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Process</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Grade</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Final Score</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Action</th>
                            </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-gray-200">
                            {filteredLots.map(lot => (
                                <tr key={lot.id}>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{lot.id}</td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{lot.variety}</td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{lot.processType}</td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{lot.grade}</td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm font-bold text-indigo-600">{lot.finalScore}</td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm">
                                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${lot.availabilityStatus === 'Available' ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'}`}>
                                            {lot.availabilityStatus === 'Available' ? <CheckCircle className="h-3 w-3 mr-1" /> : <Archive className="h-3 w-3 mr-1" />}
                                            {lot.availabilityStatus}
                                        </span>
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm">
                                        <Link 
                                            to={`/traceability/${lot.id}`}
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            className="inline-flex items-center text-indigo-600 hover:text-indigo-900 font-semibold"
                                        >
                                            View Page <ExternalLink className="h-4 w-4 ml-1.5" />
                                        </Link>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                     {filteredLots.length === 0 && (
                        <div className="text-center p-8 text-gray-500">
                            No lots match your search criteria.
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default TraceabilityHub;
