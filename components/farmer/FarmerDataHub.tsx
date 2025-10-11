import React, { useState, useMemo } from 'react';
import { useDataContext } from '../../hooks/useDataContext';
import { HarvestLot } from '../../types';
import { Download, Filter } from 'lucide-react';

const FarmerDataHub: React.FC = () => {
    const { data } = useDataContext();
    const [yearFilter, setYearFilter] = useState<string>('All');
    const [plotFilter, setPlotFilter] = useState<string>('All');

    const uniqueYears = useMemo(() => {
        const years = new Set(data.harvestLots.map(lot => new Date(lot.harvestDate).getFullYear().toString()));
        // fix: Explicitly type sort callback parameters to resolve TS error
        return ['All', ...Array.from(years).sort((a: string, b: string) => parseInt(b) - parseInt(a))];
    }, [data.harvestLots]);

    const uniquePlots = useMemo(() => {
        const plots = new Set(data.harvestLots.map(lot => lot.farmPlotLocation));
        return ['All', ...Array.from(plots).sort()];
    }, [data.harvestLots]);
    
    const filteredLots = useMemo(() => {
        return data.harvestLots.filter(lot => {
            const lotYear = new Date(lot.harvestDate).getFullYear().toString();
            const yearMatch = yearFilter === 'All' || lotYear === yearFilter;
            const plotMatch = plotFilter === 'All' || lot.farmPlotLocation === plotFilter;
            return yearMatch && plotMatch;
        });
    }, [data.harvestLots, yearFilter, plotFilter]);

    const exportToCSV = () => {
        if (filteredLots.length === 0) {
            alert("No data to export.");
            return;
        }

        const headers = ['Lot ID', 'Farmer', 'Variety', 'Weight (kg)', 'Harvest Date', 'Location', 'Status'];
        const csvRows = [
            headers.join(','),
            ...filteredLots.map(lot => [
                lot.id,
                lot.farmerName,
                lot.cherryVariety,
                lot.weightKg,
                lot.harvestDate,
                `"${lot.farmPlotLocation.replace(/"/g, '""')}"`, // Handle quotes in location
                lot.status
            ].join(','))
        ];
        
        const csvString = csvRows.join('\n');
        const blob = new Blob([csvString], { type: 'text/csv;charset=utf-8;' });
        const link = document.createElement('a');
        const url = URL.createObjectURL(blob);
        link.setAttribute('href', url);
        link.setAttribute('download', 'harvest_data_export.csv');
        link.style.visibility = 'hidden';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };

    return (
        <div>
            <h1 className="text-3xl font-bold text-gray-900">Data Hub</h1>
            <p className="text-gray-600 mt-1 mb-6">Master table of all harvest data.</p>
            
            <div className="bg-white shadow-md rounded-lg p-4 border border-gray-200 mb-6">
                <div className="flex flex-wrap items-center gap-4">
                    <div className="flex items-center gap-2">
                        <Filter className="h-5 w-5 text-gray-500" />
                        <span className="font-semibold text-gray-700">Filters:</span>
                    </div>
                    <div>
                        <label htmlFor="yearFilter" className="sr-only">Year</label>
                        <select id="yearFilter" value={yearFilter} onChange={e => setYearFilter(e.target.value)} className="border-gray-300 rounded-md shadow-sm text-sm">
                            {uniqueYears.map(year => <option key={year} value={year}>{year}</option>)}
                        </select>
                    </div>
                    <div>
                        <label htmlFor="plotFilter" className="sr-only">Plot</label>
                        <select id="plotFilter" value={plotFilter} onChange={e => setPlotFilter(e.target.value)} className="border-gray-300 rounded-md shadow-sm text-sm">
                            {uniquePlots.map(plot => <option key={plot} value={plot}>{plot}</option>)}
                        </select>
                    </div>
                    <div className="ml-auto">
                         <button onClick={exportToCSV} className="inline-flex items-center justify-center rounded-md border border-transparent bg-green-600 px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-green-700">
                             <Download className="h-4 w-4 mr-2" />
                             Export CSV
                         </button>
                    </div>
                </div>
            </div>

            <div className="bg-white shadow-md rounded-lg overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-gray-200">
                        <thead className="bg-gray-50">
                            <tr>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Lot ID</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Farmer</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Variety</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Weight (kg)</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Harvest Date</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Location</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                            </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-gray-200">
                            {filteredLots.map((lot: HarvestLot) => (
                                <tr key={lot.id}>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{lot.id}</td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{lot.farmerName}</td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{lot.cherryVariety}</td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{lot.weightKg}</td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{lot.harvestDate}</td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{lot.farmPlotLocation}</td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm">
                                        <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${lot.status === 'Processing' ? 'bg-blue-100 text-blue-800' : 'bg-green-100 text-green-800'}`}>
                                            {lot.status}
                                        </span>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
};

export default FarmerDataHub;