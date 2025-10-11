
import React, { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useDataContext } from '../../hooks/useDataContext';
import { HarvestLot, Farm } from '../../types';
import { ChevronRight, PlusCircle, CheckCircle, ArrowUp, ArrowDown, BarChart, Weight, Wind, Coffee, Award } from 'lucide-react';

type SortableKeys = keyof HarvestLot;

const StatCard: React.FC<{ icon: React.ElementType, title: string, value: string | number, color: string }> = ({ icon: Icon, title, value, color }) => (
    <div className="bg-white p-5 rounded-lg shadow-md border flex items-center">
        <div className={`p-3 rounded-full ${color}`}>
            <Icon className="h-6 w-6 text-white" />
        </div>
        <div className="ml-4">
            <p className="text-sm font-medium text-gray-500">{title}</p>
            <p className="text-2xl font-bold text-gray-800">{value}</p>
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
    <div>
        <h1 className="text-3xl font-bold text-gray-900">Farmer Dashboard</h1>
        <p className="text-gray-600 mt-1 mb-6">Your command center for farm and harvest management.</p>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            <StatCard icon={BarChart} title="Total Harvest Lots" value={stats.totalLots} color="bg-indigo-500"/>
            <StatCard icon={Weight} title="Total Weight (kg)" value={stats.totalWeight.toLocaleString()} color="bg-green-500"/>
            <StatCard icon={Wind} title="Lots in Processing" value={stats.inProcessing} color="bg-blue-500"/>
            <StatCard icon={Coffee} title="Ready for Processing" value={stats.readyForProcessing} color="bg-yellow-500"/>
        </div>
        
        {qualityFeedbackData.length > 0 && (
            <div className="bg-white shadow-md rounded-lg p-6 border border-gray-200 mb-8">
                <h2 className="text-xl font-bold text-gray-800 mb-4 flex items-center"><Award className="text-yellow-500 mr-2"/> Quality Feedback</h2>
                <p className="text-sm text-gray-600 mb-4">Here are the latest cupping results for your top-performing lots.</p>
                <ul className="space-y-3">
                    {qualityFeedbackData.map(item => (
                        <li
                            key={item.lotId}
                            onClick={() => handleRowClick(item.lotId)}
                            className="flex items-center justify-between p-3 bg-gray-50 rounded-md border hover:bg-gray-100 cursor-pointer transition-colors"
                        >
                            <div>
                                <p className="font-semibold text-gray-800">Lot {item.lotId} <span className="font-normal text-gray-500">- {item.variety}</span></p>
                            </div>
                            <div className="text-right">
                                <p className="font-bold text-lg text-indigo-600">{item.score.toFixed(2)}</p>
                                <p className="text-xs text-gray-500">Final Score</p>
                            </div>
                        </li>
                    ))}
                </ul>
            </div>
        )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
        <div className="bg-white shadow-md rounded-lg p-6 border border-gray-200">
          <h2 className="text-xl font-bold text-gray-800 mb-4">Register New Farm</h2>
          <form onSubmit={handleFarmSubmit} className="space-y-4">
              <div>
                  <label htmlFor="newFarmerName" className="block text-sm font-medium text-gray-700">Farmer Name</label>
                  <input type="text" id="newFarmerName" value={newFarmerName} onChange={e => setNewFarmerName(e.target.value)} required className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm" />
              </div>
              <div>
                  <label htmlFor="newFarmLocation" className="block text-sm font-medium text-gray-700">Farm Location / Plot</label>
                  <input type="text" id="newFarmLocation" value={newFarmLocation} onChange={e => setNewFarmLocation(e.target.value)} required className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm" />
              </div>
              <div className="flex items-end justify-between h-10">
                  {showFarmSuccess && (
                    <div className="flex items-center text-green-600 transition-opacity duration-300">
                      <CheckCircle className="h-5 w-5 mr-2" /> <span className="font-semibold">Farm registered!</span>
                    </div>
                  )}
                  <button type="submit" className="inline-flex items-center justify-center rounded-md border border-transparent bg-indigo-600 px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-indigo-700 ml-auto">
                      <PlusCircle className="h-5 w-5 mr-2" /> Register Farm
                  </button>
              </div>
          </form>
        </div>

        <div className="bg-white shadow-md rounded-lg p-6 border border-gray-200">
          <h2 className="text-xl font-bold text-gray-800 mb-4">Register New Harvest Lot</h2>
          <form onSubmit={handleLotSubmit} className="space-y-4">
              <div>
                <label htmlFor="farm" className="block text-sm font-medium text-gray-700">Select Farm</label>
                <select id="farm" value={selectedFarmId} onChange={e => setSelectedFarmId(e.target.value)} required className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm">
                  <option value="" disabled>Select a farm...</option>
                  {data.farms.map(farm => <option key={farm.id} value={farm.id}>{farm.farmerName} - {farm.location}</option>)}
                </select>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                    <label htmlFor="cherryVariety" className="block text-sm font-medium text-gray-700">Cherry Variety</label>
                    <input type="text" id="cherryVariety" value={cherryVariety} onChange={e => setCherryVariety(e.target.value)} required className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm" />
                </div>
                <div>
                    <label htmlFor="weightKg" className="block text-sm font-medium text-gray-700">Weight (kg)</label>
                    <input type="number" id="weightKg" value={weightKg} onChange={e => setWeightKg(e.target.value)} required className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm" />
                </div>
              </div>
              <div className="flex items-end justify-between h-10">
                  {showLotSuccess && (
                    <div className="flex items-center text-green-600 transition-opacity duration-300">
                      <CheckCircle className="h-5 w-5 mr-2" /> <span className="font-semibold">Harvest lot registered!</span>
                    </div>
                  )}
                  <button type="submit" className="inline-flex items-center justify-center rounded-md border border-transparent bg-indigo-600 px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-indigo-700 ml-auto">
                      <PlusCircle className="h-5 w-5 mr-2" /> Submit Lot
                  </button>
              </div>
          </form>
        </div>
      </div>

      <div className="bg-white shadow-md rounded-lg overflow-hidden">
        <div className="p-4 border-b flex flex-wrap justify-between items-center gap-4">
          <h3 className="text-lg font-semibold">Active Harvest Lots</h3>
          <div className="flex items-center space-x-2">
            <span className="text-sm font-medium text-gray-600">Filter:</span>
            {filterStatuses.map(status => (
              <button key={status} onClick={() => setStatusFilter(status)} className={`px-3 py-1 text-xs font-semibold rounded-full transition-colors ${statusFilter === status ? 'bg-indigo-600 text-white' : 'bg-gray-200 text-gray-700 hover:bg-gray-300'}`}>
                {status}
              </button>
            ))}
          </div>
        </div>
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <SortableHeader column="id" label="Lot ID" />
                <SortableHeader column="farmerName" label="Farmer" />
                <SortableHeader column="cherryVariety" label="Variety" />
                <SortableHeader column="weightKg" label="Weight (kg)" />
                <SortableHeader column="harvestDate" label="Harvest Date" />
                <SortableHeader column="status" label="Status" />
                <th scope="col" className="relative px-6 py-3"><span className="sr-only">View</span></th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {sortedAndFilteredLots.map((lot: HarvestLot) => (
                <tr key={lot.id} onClick={() => handleRowClick(lot.id)} className="hover:bg-gray-50 cursor-pointer">
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{lot.id}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{lot.farmerName}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{lot.cherryVariety}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{lot.weightKg}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{lot.harvestDate}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm">
                     <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${lot.status === 'Processing' ? 'bg-blue-100 text-blue-800' : 'bg-green-100 text-green-800'}`}>
                      {lot.status}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                    <ChevronRight className="h-5 w-5 text-gray-400" />
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

export default FarmerDashboard;
