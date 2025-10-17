import React, { useState, useMemo, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useDataContext } from '../../hooks/useDataContext';
import { HarvestLot, User, UserRole } from '../../types';
import { Download, Filter, ChevronRight, Database, ChevronDown, Check, Edit, Trash2 } from 'lucide-react';

// Custom Dropdown Component
const CustomFilterDropdown: React.FC<{
  value: string;
  onChange: (value: string) => void;
  options: string[];
  label: (value: string) => string;
}> = ({ value, onChange, options, label }) => {
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
        className="border border-gray-300 rounded-lg px-3 py-2 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all hover:border-gray-400 min-w-[140px] flex items-center justify-between gap-2"
      >
        <span className="font-medium text-gray-900">{label(value)}</span>
        <ChevronDown className={`h-4 w-4 text-gray-400 transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`} />
      </button>

      {isOpen && (
        <div className="absolute z-10 mt-2 bg-white border border-gray-200 rounded-lg shadow-lg max-h-60 overflow-auto min-w-full">
          <div className="py-1">
            {options.map((option) => (
              <button
                key={option}
                type="button"
                onClick={() => {
                  onChange(option);
                  setIsOpen(false);
                }}
                className={`w-full text-left px-4 py-2 hover:bg-indigo-50 transition-colors flex items-center justify-between text-sm ${
                  value === option ? 'bg-indigo-50' : ''
                }`}
              >
                <span className="font-medium text-gray-900">{label(option)}</span>
                {value === option && (
                  <Check className="h-4 w-4 text-indigo-600" />
                )}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

interface FarmerDataHubProps {
    currentUser: User;
}

const FarmerDataHub: React.FC<FarmerDataHubProps> = ({ currentUser }) => {
    const { data, setData } = useDataContext();
    const navigate = useNavigate();
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

    const handleDelete = (lotId: string, e: React.MouseEvent) => {
        e.stopPropagation(); // Prevent row click
        if (window.confirm('Are you sure you want to delete this harvest lot? This action cannot be undone.')) {
            setData(prev => ({
                ...prev,
                harvestLots: prev.harvestLots.filter(lot => lot.id !== lotId),
            }));
        }
    };

    const handleEdit = (lotId: string, e: React.MouseEvent) => {
        e.stopPropagation(); // Prevent row click
        navigate(`/farmer-dashboard/${lotId}`);
    };

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

    const isAdmin = currentUser.role === UserRole.Admin;

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
                        <CustomFilterDropdown
                            value={yearFilter}
                            onChange={setYearFilter}
                            options={uniqueYears}
                            label={(year) => year === 'All' ? 'All Years' : year}
                        />
                        <CustomFilterDropdown
                            value={plotFilter}
                            onChange={setPlotFilter}
                            options={uniquePlots}
                            label={(plot) => plot === 'All' ? 'All Locations' : plot}
                        />
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
                        <thead className="bg-gray-900">
                            <tr>
                                <th scope="col" className="px-6 py-4 text-left text-xs font-bold text-white uppercase tracking-wider">Lot ID</th>
                                <th scope="col" className="px-6 py-4 text-left text-xs font-bold text-white uppercase tracking-wider">Farmer</th>
                                <th scope="col" className="px-6 py-4 text-left text-xs font-bold text-white uppercase tracking-wider">Variety</th>
                                <th scope="col" className="px-6 py-4 text-left text-xs font-bold text-white uppercase tracking-wider">Weight (kg)</th>
                                <th scope="col" className="px-6 py-4 text-left text-xs font-bold text-white uppercase tracking-wider">Harvest Date</th>
                                <th scope="col" className="px-6 py-4 text-left text-xs font-bold text-white uppercase tracking-wider">Status</th>
                                <th scope="col" className="px-6 py-4 text-center text-xs font-bold text-white uppercase tracking-wider">
                                    {isAdmin ? 'Actions' : <span className="sr-only">View</span>}
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
                                    <tr
                                        key={lot.id}
                                        onClick={() => navigate(`/farmer-dashboard/${lot.id}`)}
                                        className="hover:bg-gray-50 transition-colors cursor-pointer"
                                    >
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
                                            {isAdmin ? (
                                                <div className="flex items-center justify-center gap-2">
                                                    <button
                                                        onClick={(e) => handleEdit(lot.id, e)}
                                                        className="text-indigo-600 hover:text-indigo-900 p-1 rounded-md hover:bg-indigo-50 transition-colors"
                                                        title="Edit"
                                                    >
                                                        <Edit className="h-4 w-4" />
                                                    </button>
                                                    <button
                                                        onClick={(e) => handleDelete(lot.id, e)}
                                                        className="text-red-600 hover:text-red-900 p-1 rounded-md hover:bg-red-50 transition-colors"
                                                        title="Delete"
                                                    >
                                                        <Trash2 className="h-4 w-4" />
                                                    </button>
                                                </div>
                                            ) : (
                                                <button
                                                    className="text-indigo-600 hover:text-indigo-900 font-semibold hover:underline transition-colors"
                                                >
                                                    View
                                                </button>
                                            )}
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