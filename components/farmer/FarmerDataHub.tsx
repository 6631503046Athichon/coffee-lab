import React, { useState, useMemo } from 'react';
import { useDataContext } from '../../hooks/useDataContext';
import { HarvestLot } from '../../types';
import { Download, Filter, ChevronRight, Database } from 'lucide-react';

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
        <div className="space-y-6">
            {/* Header Section */}
            <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200">
                <div className="flex items-center gap-3">
                    <div className="p-3 bg-indigo-100 rounded-lg">
                        <Database className="h-7 w-7 text-indigo-600" />
                    </div>
                    <div>
                        <h1 className="text-3xl font-bold text-gray-900">Data Hub</h1>
                        <p className="text-gray-600 text-sm">Master table of all harvest data</p>
                    </div>
                </div>
            </div>

            {/* Filters and Actions Bar */}
            <div className="bg-white shadow-sm rounded-xl p-4 border border-gray-200">
                <div className="flex flex-wrap items-center justify-between gap-3">
                    <div className="flex flex-wrap items-center gap-3">
                        <span className="text-sm font-semibold text-gray-700 flex items-center gap-2">
                            <Filter className="h-4 w-4" />
                            Filters
                        </span>
                        <select
                            id="yearFilter"
                            value={yearFilter}
                            onChange={e => setYearFilter(e.target.value)}
                            className="border border-gray-300 rounded-lg px-3 py-2 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all hover:border-gray-400"
                        >
                            {uniqueYears.map(year => <option key={year} value={year}>{year === 'All' ? 'All Years' : year}</option>)}
                        </select>
                        <select
                            id="plotFilter"
                            value={plotFilter}
                            onChange={e => setPlotFilter(e.target.value)}
                            className="border border-gray-300 rounded-lg px-3 py-2 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all hover:border-gray-400"
                        >
                            {uniquePlots.map(plot => <option key={plot} value={plot}>{plot === 'All' ? 'All Locations' : plot}</option>)}
                        </select>
                    </div>
                    <button
                        onClick={exportToCSV}
                        className="inline-flex items-center gap-2 rounded-lg bg-green-600 px-4 py-2 text-sm font-semibold text-white hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2 transition-colors"
                    >
                        <Download className="h-4 w-4" />
                        Export CSV
                    </button>
                </div>
            </div>

            <div className="bg-white shadow-sm rounded-xl overflow-hidden border border-gray-200">
                <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-gray-200">
                        <thead className="bg-gray-50">
                            <tr>
                                <th scope="col" className="px-6 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">Lot ID</th>
                                <th scope="col" className="px-6 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">Farmer</th>
                                <th scope="col" className="px-6 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">Variety</th>
                                <th scope="col" className="px-6 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">Weight</th>
                                <th scope="col" className="px-6 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">Harvest Date</th>
                                <th scope="col" className="px-6 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">Status</th>
                                <th scope="col" className="px-6 py-3 text-center text-xs font-semibold text-gray-700 uppercase tracking-wider">
                                    <span className="sr-only">View</span>
                                </th>
                            </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-gray-100">
                            {filteredLots.length === 0 ? (
                                <tr>
                                    <td colSpan={7} className="px-6 py-12 text-center">
                                        <Database className="h-16 w-16 text-gray-300 mx-auto mb-4" />
                                        <p className="text-gray-500 text-lg font-medium">No harvest data found</p>
                                        <p className="text-gray-400 text-sm">Try adjusting your filters</p>
                                    </td>
                                </tr>
                            ) : (
                                filteredLots.map((lot: HarvestLot) => (
                                    <tr key={lot.id} className="hover:bg-gray-50 transition-colors">
                                        <td className="px-6 py-4 whitespace-nowrap text-sm font-semibold text-gray-900">
                                            {lot.id}
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">
                                            {lot.farmerName}
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">
                                            {lot.cherryVariety}
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                                            {lot.weightKg} kg
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                                            {lot.harvestDate}
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                                                lot.status === 'Processing'
                                                    ? 'bg-blue-100 text-blue-800'
                                                    : 'bg-green-100 text-green-800'
                                            }`}>
                                                {lot.status}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-center text-sm">
                                            <button className="text-indigo-600 hover:text-indigo-900 font-medium">
                                                View
                                            </button>
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
};

export default FarmerDataHub;