
import React, { useState, useMemo, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useDataContext } from '../../hooks/useDataContext';
import { HarvestLot, Farm } from '../../types';
import { ChevronRight, PlusCircle, CheckCircle, ArrowUp, ArrowDown, BarChart, Weight, Wind, Coffee, Award, ChevronDown, Check } from 'lucide-react';

type SortableKeys = keyof HarvestLot;

// Coffee varieties list
const COFFEE_VARIETIES = [
  'Gesha',
  'Caturra',
  'Bourbon',
  'Typica',
  'SL28',
  'SL34',
  'Pacamara',
  'Catuai',
  'Mundo Novo',
  'Maragogype',
  'Kent',
  'Blue Mountain',
  'Ethiopian Heirloom',
  'Java',
  'Tekisic',
];

// Custom Dropdown Component for Farms
const CustomFarmDropdown: React.FC<{
  value: string;
  onChange: (value: string) => void;
  options: Farm[];
  placeholder: string;
}> = ({ value, onChange, options, placeholder }) => {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const selectedFarm = options.find(farm => farm.id === value);

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
        className="block w-full border border-gray-300 rounded-lg shadow-sm py-2.5 px-3 bg-white text-left focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all hover:border-gray-400"
      >
        <div className="flex items-center justify-between">
          <span className={selectedFarm ? "text-gray-900 font-medium" : "text-gray-500"}>
            {selectedFarm ? `${selectedFarm.farmerName} - ${selectedFarm.location}` : placeholder}
          </span>
          <ChevronDown className={`h-5 w-5 text-gray-400 transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`} />
        </div>
      </button>

      {isOpen && (
        <div className="absolute z-10 w-full mt-2 bg-white border border-gray-200 rounded-lg shadow-lg max-h-60 overflow-auto">
          <div className="py-2">
            {options.length === 0 ? (
              <div className="px-4 py-3 text-sm text-gray-500 text-center">
                No farms available
              </div>
            ) : (
              options.map((farm) => (
                <button
                  key={farm.id}
                  type="button"
                  onClick={() => {
                    onChange(farm.id);
                    setIsOpen(false);
                  }}
                  className={`w-full text-left px-4 py-3 hover:bg-indigo-50 transition-colors ${
                    value === farm.id ? 'bg-indigo-50' : ''
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-semibold text-gray-900">{farm.farmerName}</p>
                      <p className="text-xs text-gray-500">{farm.location}</p>
                    </div>
                    {value === farm.id && (
                      <Check className="h-5 w-5 text-indigo-600" />
                    )}
                  </div>
                </button>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
};

// Custom Dropdown Component for Varieties
const CustomVarietyDropdown: React.FC<{
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
        className="block w-full border border-gray-300 rounded-lg shadow-sm py-2.5 px-3 bg-white text-left focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all hover:border-gray-400"
      >
        <div className="flex items-center justify-between">
          <span className={value ? "text-gray-900 font-medium" : "text-gray-500"}>
            {value || placeholder}
          </span>
          <ChevronDown className={`h-5 w-5 text-gray-400 transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`} />
        </div>
      </button>

      {isOpen && (
        <div className="absolute z-10 w-full mt-2 bg-white border border-gray-200 rounded-lg shadow-lg max-h-60 overflow-auto">
          <div className="py-1">
            {options.map((variety) => (
              <button
                key={variety}
                type="button"
                onClick={() => {
                  onChange(variety);
                  setIsOpen(false);
                }}
                className={`w-full text-left px-4 py-3 hover:bg-green-50 transition-colors flex items-center justify-between ${
                  value === variety ? 'bg-green-50' : ''
                }`}
              >
                <span className="text-sm font-medium text-gray-900">{variety}</span>
                {value === variety && (
                  <Check className="h-5 w-5 text-green-600" />
                )}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

const StatCard: React.FC<{ icon: React.ElementType, title: string, value: string | number, bgColor: string, iconColor: string }> = ({ icon: Icon, title, value, bgColor, iconColor }) => (
    <div className={`${bgColor} p-6 rounded-xl shadow-sm border border-gray-200 hover:shadow-md transition-shadow duration-200`}>
        <div className="flex items-center justify-between">
            <div className="flex-1">
                <p className="text-xs font-semibold text-gray-600 uppercase tracking-wide mb-2">{title}</p>
                <p className="text-3xl font-bold text-gray-900">{value}</p>
            </div>
            <div className={`p-3 rounded-lg ${iconColor}`}>
                <Icon className="h-7 w-7" />
            </div>
        </div>
    </div>
);

const FarmerDashboard: React.FC = () => {
  const { data, setData } = useDataContext();
  const navigate = useNavigate();

  // Form States
  const [newFarmerName, setNewFarmerName] = useState('');
  const [newFarmLocation, setNewFarmLocation] = useState('');
  const [showFarmSuccess, setShowFarmSuccess] = useState(false);
  const [selectedFarmId, setSelectedFarmId] = useState('');
  const [cherryVariety, setCherryVariety] = useState('');
  const [weightKg, setWeightKg] = useState('');
  const [harvestDate, setHarvestDate] = useState(new Date().toISOString().substring(0, 10));
  const [showLotSuccess, setShowLotSuccess] = useState(false);
  
  // Table State
  const [statusFilter, setStatusFilter] = useState<'All' | 'Ready for Processing' | 'Processing'>('All');
  const [sortColumn, setSortColumn] = useState<SortableKeys>('id');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('desc');

  const handleRowClick = (lotId: string) => {
    navigate(`/farmer-dashboard/${lotId}`);
  };
  
  const handleFarmSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const newIdNumber = Math.max(...data.farms.map(farm => parseInt(farm.id.replace('F', ''))), 0) + 1;
    const newId = `F${String(newIdNumber).padStart(3, '0')}`;
    const newFarm: Farm = { id: newId, farmerName: newFarmerName, location: newFarmLocation };
    setData(prevData => ({ ...prevData, farms: [newFarm, ...prevData.farms] }));
    setNewFarmerName('');
    setNewFarmLocation('');
    setShowFarmSuccess(true);
    setTimeout(() => setShowFarmSuccess(false), 3000);
  };

  const handleLotSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const selectedFarm = data.farms.find(f => f.id === selectedFarmId);
    if (!selectedFarm) return alert("Please select a valid farm.");
    
    const newIdNumber = Math.max(...data.harvestLots.map(lot => parseInt(lot.id.replace('HL', ''))), 0) + 1;
    const newId = `HL${String(newIdNumber).padStart(3, '0')}`;
    const newLot: HarvestLot = {
      id: newId,
      farmerName: selectedFarm.farmerName,
      cherryVariety,
      weightKg: parseFloat(weightKg),
      farmPlotLocation: selectedFarm.location,
      harvestDate,
      status: 'Ready for Processing',
    };
    setData(prevData => ({ ...prevData, harvestLots: [newLot, ...prevData.harvestLots] }));
    setSelectedFarmId('');
    setCherryVariety('');
    setWeightKg('');
    setHarvestDate(new Date().toISOString().substring(0, 10));
    setShowLotSuccess(true);
    setTimeout(() => setShowLotSuccess(false), 3000);
  };

  const handleSort = (column: SortableKeys) => {
    if (sortColumn === column) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortColumn(column);
      setSortDirection('asc');
    }
  };
  
  const qualityFeedbackData = useMemo(() => {
    // Assuming current farmer is 'Maria Rodriguez' for mock data context
    const farmerLots = data.harvestLots.filter(hl => hl.farmerName === 'Maria Rodriguez');
    
    const scoredLots = farmerLots.map(hl => {
        const relatedBatches = data.processingBatches.filter(b => b.harvestLotId === hl.id);
        const relatedParchmentLots = data.parchmentLots.filter(p => relatedBatches.some(b => b.id === p.processingBatchId));
        const relatedGreenBeanLots = data.greenBeanLots.filter(g => relatedParchmentLots.some(p => p.id === g.parchmentLotId));

        if (relatedGreenBeanLots.length === 0) return null;
        
        const gbl = relatedGreenBeanLots[0];
        const scoreInfo = gbl.cuppingScores[0];
        if (!scoreInfo) return null;

        const session = data.cuppingSessions.find(s => s.id === scoreInfo.sessionId);
        const sample = session?.samples.find(s => s.greenBeanLotId === gbl.id);

        if (session && sample && session.finalResults && session.finalResults[sample.id]) {
            return {
                lotId: hl.id,
                variety: hl.cherryVariety,
                score: session.finalResults[sample.id].totalScore,
            };
        }
        return null;
    }).filter(Boolean) as { lotId: string; variety: string; score: number }[];
    
    return scoredLots.sort((a, b) => b.score - a.score).slice(0, 3);

  }, [data]);

  const sortedAndFilteredLots = useMemo(() => {
    const filtered = data.harvestLots.filter(lot => statusFilter === 'All' || lot.status === statusFilter);
    return filtered.sort((a, b) => {
        const aValue = a[sortColumn];
        const bValue = b[sortColumn];
        if (aValue > bValue) return sortDirection === 'asc' ? 1 : -1;
        if (aValue < bValue) return sortDirection === 'asc' ? -1 : 1;
        return 0;
    });
  }, [data.harvestLots, statusFilter, sortColumn, sortDirection]);

  const stats = useMemo(() => ({
    totalLots: data.harvestLots.length,
    totalWeight: data.harvestLots.reduce((sum, lot) => sum + lot.weightKg, 0),
    inProcessing: data.harvestLots.filter(l => l.status === 'Processing').length,
    readyForProcessing: data.harvestLots.filter(l => l.status === 'Ready for Processing').length,
  }), [data.harvestLots]);

  const filterStatuses: Array<'All' | 'Ready for Processing' | 'Processing'> = ['All', 'Ready for Processing', 'Processing'];

  const SortableHeader: React.FC<{ column: SortableKeys; label: string }> = ({ column, label }) => (
    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
      <button onClick={() => handleSort(column)} className="flex items-center gap-1 hover:text-gray-700">
        {label}
        {sortColumn === column && (sortDirection === 'asc' ? <ArrowUp className="h-3 w-3" /> : <ArrowDown className="h-3 w-3" />)}
      </button>
    </th>
  );

  return (
    <div className="space-y-8">
        <div className="bg-white rounded-xl p-8 shadow-sm border border-gray-200">
            <h1 className="text-3xl font-bold text-gray-900 mb-2">Farmer Dashboard</h1>
            <p className="text-gray-600">Your command center for farm and harvest management.</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <StatCard icon={BarChart} title="Total Harvest Lots" value={stats.totalLots} bgColor="bg-indigo-50" iconColor="bg-indigo-100 text-indigo-600"/>
            <StatCard icon={Weight} title="Total Weight (kg)" value={stats.totalWeight.toLocaleString()} bgColor="bg-green-50" iconColor="bg-green-100 text-green-600"/>
            <StatCard icon={Wind} title="Lots in Processing" value={stats.inProcessing} bgColor="bg-blue-50" iconColor="bg-blue-100 text-blue-600"/>
            <StatCard icon={Coffee} title="Ready for Processing" value={stats.readyForProcessing} bgColor="bg-amber-50" iconColor="bg-amber-100 text-amber-600"/>
        </div>
        
        {qualityFeedbackData.length > 0 && (
            <div className="bg-white shadow-sm rounded-xl p-8 border border-gray-200">
                <div className="flex items-center gap-3 mb-2">
                    <div className="p-3 bg-amber-100 rounded-lg">
                        <Award className="text-amber-600 h-6 w-6" />
                    </div>
                    <h2 className="text-2xl font-bold text-gray-900">Quality Feedback</h2>
                </div>
                <p className="text-gray-600 mb-6 ml-1">Here are the latest cupping results for your top-performing lots.</p>
                <div className="space-y-3">
                    {qualityFeedbackData.map(item => (
                        <div
                            key={item.lotId}
                            onClick={() => handleRowClick(item.lotId)}
                            className="bg-gray-50 rounded-lg p-5 border border-gray-200 hover:border-amber-300 hover:shadow-md cursor-pointer transition-all duration-200"
                        >
                            <div className="flex items-center justify-between">
                                <div>
                                    <p className="font-semibold text-base text-gray-900">Lot {item.lotId} <span className="font-normal text-gray-600">• {item.variety}</span></p>
                                </div>
                                <div className="flex items-center gap-3">
                                    <div className="text-right">
                                        <p className="font-bold text-2xl text-amber-600">{item.score.toFixed(2)}</p>
                                        <p className="text-xs text-gray-500 font-medium">Final Score</p>
                                    </div>
                                    <ChevronRight className="h-5 w-5 text-gray-400" />
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <div className="bg-white shadow-sm rounded-xl p-8 border border-gray-200">
          <h2 className="text-2xl font-bold text-gray-900 mb-6 flex items-center gap-2">
            <div className="p-2 bg-indigo-100 rounded-lg">
              <PlusCircle className="h-5 w-5 text-indigo-600" />
            </div>
            Register New Farm
          </h2>
          <form onSubmit={handleFarmSubmit} className="space-y-5">
              <div>
                  <label htmlFor="newFarmerName" className="block text-sm font-semibold text-gray-700 mb-2">Farmer Name</label>
                  <input type="text" id="newFarmerName" value={newFarmerName} onChange={e => setNewFarmerName(e.target.value)} required className="block w-full border border-gray-300 rounded-lg shadow-sm py-2.5 px-3 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all" placeholder="Enter farmer name" />
              </div>
              <div>
                  <label htmlFor="newFarmLocation" className="block text-sm font-semibold text-gray-700 mb-2">Farm Location / Plot</label>
                  <input type="text" id="newFarmLocation" value={newFarmLocation} onChange={e => setNewFarmLocation(e.target.value)} required className="block w-full border border-gray-300 rounded-lg shadow-sm py-2.5 px-3 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all" placeholder="Enter location" />
              </div>
              <div className="flex items-end justify-between h-12 pt-2">
                  {showFarmSuccess && (
                    <div className="flex items-center text-green-600 transition-opacity duration-300">
                      <CheckCircle className="h-5 w-5 mr-2" /> <span className="font-semibold">Farm registered!</span>
                    </div>
                  )}
                  <button type="submit" className="inline-flex items-center justify-center rounded-lg border border-transparent bg-indigo-600 px-5 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-indigo-700 ml-auto transition-colors">
                      <PlusCircle className="h-4 w-4 mr-2" /> Register Farm
                  </button>
              </div>
          </form>
        </div>

        <div className="bg-white shadow-sm rounded-xl p-8 border border-gray-200">
          <h2 className="text-2xl font-bold text-gray-900 mb-6 flex items-center gap-2">
            <div className="p-2 bg-green-100 rounded-lg">
              <Coffee className="h-5 w-5 text-green-600" />
            </div>
            Register New Harvest Lot
          </h2>
          <form onSubmit={handleLotSubmit} className="space-y-5">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">Select Farm</label>
                <CustomFarmDropdown
                  value={selectedFarmId}
                  onChange={setSelectedFarmId}
                  options={data.farms}
                  placeholder="Select a farm..."
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">Cherry Variety</label>
                    <CustomVarietyDropdown
                      value={cherryVariety}
                      onChange={setCherryVariety}
                      options={COFFEE_VARIETIES}
                      placeholder="Select variety..."
                    />
                </div>
                <div>
                    <label htmlFor="weightKg" className="block text-sm font-semibold text-gray-700 mb-2">Weight (kg)</label>
                    <input type="number" id="weightKg" value={weightKg} onChange={e => setWeightKg(e.target.value)} required className="block w-full border border-gray-300 rounded-lg shadow-sm py-2.5 px-3 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all" placeholder="0" />
                </div>
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">Harvest Date</label>
                <input
                  type="date"
                  value={harvestDate}
                  onChange={(e) => setHarvestDate(e.target.value)}
                  required
                  className="block w-full border-2 border-gray-300 rounded-xl shadow-sm py-2.5 px-3 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all"
                />
              </div>
              <div className="flex items-end justify-between h-12 pt-2">
                  {showLotSuccess && (
                    <div className="flex items-center text-green-600 transition-opacity duration-300">
                      <CheckCircle className="h-5 w-5 mr-2" /> <span className="font-semibold">Harvest lot registered!</span>
                    </div>
                  )}
                  <button type="submit" className="inline-flex items-center justify-center rounded-lg border border-transparent bg-indigo-600 px-5 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-indigo-700 ml-auto transition-colors">
                      <PlusCircle className="h-4 w-4 mr-2" /> Submit Lot
                  </button>
              </div>
          </form>
        </div>
      </div>

      <div className="bg-white shadow-sm rounded-xl overflow-hidden border border-gray-200">
        <div className="bg-gray-50 p-6 border-b border-gray-200">
          <div className="flex flex-wrap justify-between items-center gap-4">
            <h3 className="text-2xl font-bold text-gray-900">Active Harvest Lots</h3>
            <div className="flex items-center space-x-3">
              <span className="text-sm font-semibold text-gray-700">Filter:</span>
              {filterStatuses.map(status => (
                <button
                  key={status}
                  onClick={() => setStatusFilter(status)}
                  className={`px-4 py-2 text-xs font-semibold rounded-lg transition-all ${
                    statusFilter === status
                      ? 'bg-indigo-600 text-white shadow-sm'
                      : 'bg-white text-gray-700 hover:bg-gray-100 border border-gray-300'
                  }`}
                >
                  {status}
                </button>
              ))}
            </div>
          </div>
        </div>
        <div className="space-y-4 p-6 bg-gray-50">
          {sortedAndFilteredLots.length === 0 ? (
            <div className="text-center py-12">
              <Coffee className="h-16 w-16 text-gray-300 mx-auto mb-4" />
              <p className="text-gray-500 text-lg font-medium">No harvest lots found</p>
              <p className="text-gray-400 text-sm">Try adjusting your filters or add a new harvest lot</p>
            </div>
          ) : (
            sortedAndFilteredLots.map((lot: HarvestLot) => (
              <div
                key={lot.id}
                onClick={() => handleRowClick(lot.id)}
                className="bg-white border border-gray-200 rounded-lg p-5 hover:shadow-md hover:border-indigo-300 cursor-pointer transition-all duration-200 group"
              >
                <div className="flex items-start justify-between gap-6">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-4">
                      <h4 className="text-xl font-bold text-gray-900">{lot.id}</h4>
                      <span className={`px-3 py-1 text-xs font-medium rounded-full ${
                        lot.status === 'Processing'
                          ? 'bg-blue-100 text-blue-800'
                          : 'bg-green-100 text-green-800'
                      }`}>
                        {lot.status}
                      </span>
                    </div>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                      <div className="bg-gray-50 rounded-lg p-3 border border-gray-100">
                        <p className="text-gray-500 text-xs uppercase font-semibold mb-1 tracking-wide">Farmer</p>
                        <p className="text-gray-900 font-medium text-sm">{lot.farmerName}</p>
                      </div>
                      <div className="bg-gray-50 rounded-lg p-3 border border-gray-100">
                        <p className="text-gray-500 text-xs uppercase font-semibold mb-1 tracking-wide">Variety</p>
                        <p className="text-gray-900 font-medium text-sm">{lot.cherryVariety}</p>
                      </div>
                      <div className="bg-gray-50 rounded-lg p-3 border border-gray-100">
                        <p className="text-gray-500 text-xs uppercase font-semibold mb-1 tracking-wide">Weight</p>
                        <p className="text-gray-900 font-medium text-sm">{lot.weightKg} kg</p>
                      </div>
                      <div className="bg-gray-50 rounded-lg p-3 border border-gray-100">
                        <p className="text-gray-500 text-xs uppercase font-semibold mb-1 tracking-wide">Harvest Date</p>
                        <p className="text-gray-900 font-medium text-sm">{lot.harvestDate}</p>
                      </div>
                    </div>
                  </div>
                  <div className="flex-shrink-0">
                    <div className="p-2 bg-gray-50 rounded-lg group-hover:bg-indigo-50 transition-colors">
                      <ChevronRight className="h-5 w-5 text-gray-400 group-hover:text-indigo-600 group-hover:translate-x-0.5 transition-all" />
                    </div>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
};

export default FarmerDashboard;
