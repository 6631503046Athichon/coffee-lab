import React, { useState, useMemo, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useDataContext } from '../../hooks/useDataContext';
import { HarvestLot, User, UserRole } from '../../types';
import { Download, Filter, ChevronRight, Database, ChevronDown, Check, Edit, Trash2, X } from 'lucide-react';

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

    // Edit Modal State
    const [isEditModalOpen, setIsEditModalOpen] = useState(false);
    const [editingLot, setEditingLot] = useState<HarvestLot | null>(null);
    const [editFormData, setEditFormData] = useState({
        farmerName: '',
        cherryVariety: '',
        weightKg: '',
        harvestDate: '',
        farmPlotLocation: '',
        status: 'Ready for Processing'
    });

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

    const openEditModal = (lot: HarvestLot, e: React.MouseEvent) => {
        e.stopPropagation(); // Prevent row click
        setEditingLot(lot);
        setEditFormData({
            farmerName: lot.farmerName,
            cherryVariety: lot.cherryVariety,
            weightKg: lot.weightKg.toString(),
            harvestDate: lot.harvestDate,
            farmPlotLocation: lot.farmPlotLocation,
            status: lot.status
        });
        setIsEditModalOpen(true);
    };

    const closeEditModal = () => {
        setIsEditModalOpen(false);
        setEditingLot(null);
    };

    const handleEditSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (!editingLot) return;

        setData(prev => ({
            ...prev,
            harvestLots: prev.harvestLots.map(lot =>
                lot.id === editingLot.id
                    ? {
                        ...lot,
                        farmerName: editFormData.farmerName,
                        cherryVariety: editFormData.cherryVariety,
                        weightKg: parseFloat(editFormData.weightKg),
                        harvestDate: editFormData.harvestDate,
                        farmPlotLocation: editFormData.farmPlotLocation,
                        status: editFormData.status as 'Ready for Processing' | 'Processing'
                    }
                    : lot
            )
        }));
        closeEditModal();
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
                                                        onClick={(e) => openEditModal(lot, e)}
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

            {/* Edit Modal */}
            {isEditModalOpen && editingLot && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4" aria-modal="true" role="dialog">
                    <div className="bg-white rounded-xl p-8 shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
                        <div className="flex justify-between items-center mb-6">
                            <h2 className="text-2xl font-bold text-gray-800">Edit Harvest Lot</h2>
                            <button onClick={closeEditModal} className="text-gray-500 hover:text-gray-800 transition-colors">
                                <X className="h-6 w-6" />
                            </button>
                        </div>
                        <form onSubmit={handleEditSubmit}>
                            <div className="space-y-5">
                                <div>
                                    <label htmlFor="edit-lotId" className="block text-sm font-semibold text-gray-700 mb-2">Lot ID</label>
                                    <input
                                        type="text"
                                        id="edit-lotId"
                                        value={editingLot.id}
                                        disabled
                                        className="block w-full border-2 border-gray-200 rounded-xl shadow-sm py-2.5 px-3 bg-gray-50 text-gray-500 cursor-not-allowed"
                                    />
                                </div>
                                <div>
                                    <label htmlFor="edit-farmerName" className="block text-sm font-semibold text-gray-700 mb-2">Farmer Name</label>
                                    <input
                                        type="text"
                                        id="edit-farmerName"
                                        value={editFormData.farmerName}
                                        onChange={e => setEditFormData({ ...editFormData, farmerName: e.target.value })}
                                        required
                                        className="block w-full border-2 border-gray-300 rounded-xl shadow-sm py-2.5 px-3 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all"
                                    />
                                </div>
                                <div>
                                    <label htmlFor="edit-cherryVariety" className="block text-sm font-semibold text-gray-700 mb-2">Cherry Variety</label>
                                    <input
                                        type="text"
                                        id="edit-cherryVariety"
                                        value={editFormData.cherryVariety}
                                        onChange={e => setEditFormData({ ...editFormData, cherryVariety: e.target.value })}
                                        required
                                        className="block w-full border-2 border-gray-300 rounded-xl shadow-sm py-2.5 px-3 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all"
                                    />
                                </div>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <div>
                                        <label htmlFor="edit-weightKg" className="block text-sm font-semibold text-gray-700 mb-2">Weight (kg)</label>
                                        <input
                                            type="number"
                                            id="edit-weightKg"
                                            value={editFormData.weightKg}
                                            onChange={e => setEditFormData({ ...editFormData, weightKg: e.target.value })}
                                            required
                                            min="0"
                                            step="0.01"
                                            className="block w-full border-2 border-gray-300 rounded-xl shadow-sm py-2.5 px-3 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all"
                                        />
                                    </div>
                                    <div>
                                        <label htmlFor="edit-harvestDate" className="block text-sm font-semibold text-gray-700 mb-2">Harvest Date</label>
                                        <input
                                            type="date"
                                            id="edit-harvestDate"
                                            value={editFormData.harvestDate}
                                            onChange={e => setEditFormData({ ...editFormData, harvestDate: e.target.value })}
                                            required
                                            className="block w-full border-2 border-gray-300 rounded-xl shadow-sm py-2.5 px-3 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all"
                                        />
                                    </div>
                                </div>
                                <div>
                                    <label htmlFor="edit-farmPlotLocation" className="block text-sm font-semibold text-gray-700 mb-2">Farm Plot Location</label>
                                    <input
                                        type="text"
                                        id="edit-farmPlotLocation"
                                        value={editFormData.farmPlotLocation}
                                        onChange={e => setEditFormData({ ...editFormData, farmPlotLocation: e.target.value })}
                                        required
                                        className="block w-full border-2 border-gray-300 rounded-xl shadow-sm py-2.5 px-3 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all"
                                    />
                                </div>
                                <div>
                                    <label htmlFor="edit-status" className="block text-sm font-semibold text-gray-700 mb-2">Status</label>
                                    <select
                                        id="edit-status"
                                        value={editFormData.status}
                                        onChange={e => setEditFormData({ ...editFormData, status: e.target.value })}
                                        required
                                        className="block w-full border-2 border-gray-300 rounded-xl shadow-sm py-2.5 px-3 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all"
                                    >
                                        <option value="Ready for Processing">Ready for Processing</option>
                                        <option value="Processing">Processing</option>
                                    </select>
                                </div>
                            </div>
                            <div className="mt-8 flex justify-end space-x-3">
                                <button
                                    type="button"
                                    onClick={closeEditModal}
                                    className="bg-white py-2.5 px-5 border-2 border-gray-300 rounded-lg shadow-sm text-sm font-semibold text-gray-700 hover:bg-gray-50 transition-colors"
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    className="inline-flex justify-center py-2.5 px-5 border border-transparent shadow-sm text-sm font-semibold rounded-lg text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 transition-colors"
                                >
                                    Save Changes
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};

export default FarmerDataHub;