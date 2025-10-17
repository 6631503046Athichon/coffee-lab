
import * as React from 'react';
import { useDataContext } from '../../hooks/useDataContext';
import { GAPActivityType, GAPLogEntry } from '../../types';
import { PlusCircle, Filter, FileText, Printer, X, CheckCircle, ChevronDown, Check } from 'lucide-react';

// Custom Dropdown Component for Plot Selection
const CustomPlotDropdown: React.FC<{
  value: string;
  onChange: (value: string) => void;
  options: string[];
  placeholder: string;
  required?: boolean;
}> = ({ value, onChange, options, placeholder, required = false }) => {
  const [isOpen, setIsOpen] = React.useState(false);
  const dropdownRef = React.useRef<HTMLDivElement>(null);

  React.useEffect(() => {
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
            {options.map((option) => (
              <button
                key={option}
                type="button"
                onClick={() => {
                  onChange(option);
                  setIsOpen(false);
                }}
                className={`w-full text-left px-4 py-3 hover:bg-indigo-50 transition-colors flex items-center justify-between ${
                  value === option ? 'bg-indigo-50' : ''
                }`}
              >
                <span className="text-sm font-medium text-gray-900">{option}</span>
                {value === option && (
                  <Check className="h-5 w-5 text-indigo-600" />
                )}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

// Custom Dropdown Component for Activity Type
const CustomActivityTypeDropdown: React.FC<{
  value: string;
  onChange: (value: string) => void;
  options: string[];
  required?: boolean;
}> = ({ value, onChange, options, required = false }) => {
  const [isOpen, setIsOpen] = React.useState(false);
  const dropdownRef = React.useRef<HTMLDivElement>(null);

  React.useEffect(() => {
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
          <span className="text-gray-900 font-medium">{value}</span>
          <ChevronDown className={`h-5 w-5 text-gray-400 transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`} />
        </div>
      </button>

      {isOpen && (
        <div className="absolute z-10 w-full mt-2 bg-white border border-gray-200 rounded-lg shadow-lg max-h-60 overflow-auto">
          <div className="py-1">
            {options.map((option) => (
              <button
                key={option}
                type="button"
                onClick={() => {
                  onChange(option);
                  setIsOpen(false);
                }}
                className={`w-full text-left px-4 py-3 hover:bg-indigo-50 transition-colors flex items-center justify-between ${
                  value === option ? 'bg-indigo-50' : ''
                }`}
              >
                <span className="text-sm font-medium text-gray-900">{option}</span>
                {value === option && (
                  <Check className="h-5 w-5 text-indigo-600" />
                )}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

const GAPComplianceHelper: React.FC = () => {
    const { data, setData } = useDataContext();
    const [farmPlotLocation, setFarmPlotLocation] = React.useState('');
    const [activityType, setActivityType] = React.useState<GAPActivityType>(GAPActivityType.Fertilizer);
    const [date, setDate] = React.useState(new Date().toISOString().substring(0, 10));
    const [productUsed, setProductUsed] = React.useState('');
    const [quantity, setQuantity] = React.useState('');
    const [notes, setNotes] = React.useState('');
    const [showSuccess, setShowSuccess] = React.useState(false);
    
    const [plotFilter, setPlotFilter] = React.useState('All');
    const [activityFilter, setActivityFilter] = React.useState('All');
    const [isReportModalOpen, setIsReportModalOpen] = React.useState(false);
    
    const reportContentRef = React.useRef<HTMLDivElement>(null);

    const uniquePlots = React.useMemo(() => {
        const plots = new Set(data.farms.map(f => f.location));
        return ['All', ...Array.from(plots).sort()];
    }, [data.farms]);

    const handleLogSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        const newId = `GAP${String(data.gapLogs.length + 1).padStart(3, '0')}`;
        const newLog: GAPLogEntry = {
            id: newId, farmPlotLocation, activityType, date, productUsed, quantity, notes
        };
        setData(prev => ({ ...prev, gapLogs: [newLog, ...prev.gapLogs] }));
        
        // Reset form
        setFarmPlotLocation('');
        setActivityType(GAPActivityType.Fertilizer);
        setDate(new Date().toISOString().substring(0, 10));
        setProductUsed('');
        setQuantity('');
        setNotes('');
        setShowSuccess(true);
        setTimeout(() => setShowSuccess(false), 3000);
    };
    
    const filteredLogs = React.useMemo(() => {
        return data.gapLogs.filter(log => {
            const plotMatch = plotFilter === 'All' || log.farmPlotLocation === plotFilter;
            const activityMatch = activityFilter === 'All' || log.activityType === activityFilter;
            return plotMatch && activityMatch;
        });
    }, [data.gapLogs, plotFilter, activityFilter]);
    
    const reportData = React.useMemo(() => {
        // fix: Explicitly type the initial value for the reduce function to ensure
        // TypeScript correctly infers the type of `reportData`.
        return filteredLogs.reduce((acc, log) => {
            (acc[log.farmPlotLocation] = acc[log.farmPlotLocation] || []).push(log);
            return acc;
        }, {} as Record<string, GAPLogEntry[]>);
    }, [filteredLogs]);

    const handlePrint = () => {
        const printContents = reportContentRef.current?.innerHTML;
        const originalContents = document.body.innerHTML;
        const printWindow = window.open('', '', 'height=600,width=800');
        
        if (printWindow && printContents) {
            printWindow.document.write('<html><head><title>GAP Compliance Report</title>');
            printWindow.document.write('<style>body{font-family:sans-serif;line-height:1.5;}h1,h2,h3{margin-bottom:0.5rem;}table{width:100%;border-collapse:collapse;margin-top:1rem;}th,td{border:1px solid #ddd;padding:8px;text-align:left;}th{background-color:#f2f2f2;}</style>');
            printWindow.document.write('</head><body >');
            printWindow.document.write(printContents);
            printWindow.document.write('</body></html>');
            printWindow.document.close();
            printWindow.print();
        }
    };


    return (
        <div className="space-y-8">
            {/* Header Section */}
            <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-200">
                <div className="flex items-center gap-3">
                    <div className="p-3 bg-green-100 rounded-lg">
                        <FileText className="h-7 w-7 text-green-600" />
                    </div>
                    <div>
                        <h1 className="text-3xl font-bold text-gray-900">GAP Compliance Helper</h1>
                        <p className="text-gray-600 text-sm">Log and report agricultural activities for certification.</p>
                    </div>
                </div>
            </div>

                {/* Log New Activity Card */}
                <div className="bg-white shadow-sm rounded-xl p-8 border border-gray-200">
                    <div className="flex items-center gap-2 mb-6">
                        <div className="p-2 bg-indigo-100 rounded-lg">
                            <PlusCircle className="h-5 w-5 text-indigo-600" />
                        </div>
                        <h2 className="text-2xl font-bold text-gray-900">Log New Activity</h2>
                    </div>

                    <form onSubmit={handleLogSubmit} className="space-y-6">
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                            <div>
                                <label className="block text-sm font-semibold text-gray-700 mb-2">Farm/Plot</label>
                                <CustomPlotDropdown
                                    value={farmPlotLocation}
                                    onChange={setFarmPlotLocation}
                                    options={uniquePlots.slice(1)}
                                    placeholder="Select a plot..."
                                    required
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-semibold text-gray-700 mb-2">Activity Type</label>
                                <CustomActivityTypeDropdown
                                    value={activityType}
                                    onChange={(val) => setActivityType(val as GAPActivityType)}
                                    options={Object.values(GAPActivityType)}
                                    required
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-semibold text-gray-700 mb-2">Date</label>
                                <input
                                    type="date"
                                    value={date}
                                    onChange={e => setDate(e.target.value)}
                                    required
                                    className="block w-full px-3 py-2.5 border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all bg-white hover:border-gray-400 [&::-webkit-calendar-picker-indicator]:cursor-pointer [&::-webkit-calendar-picker-indicator]:opacity-60 [&::-webkit-calendar-picker-indicator]:hover:opacity-100"
                                />
                            </div>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div>
                                <label className="block text-sm font-semibold text-gray-700 mb-2">Product/Method Used</label>
                                <input
                                    type="text"
                                    value={productUsed}
                                    onChange={e => setProductUsed(e.target.value)}
                                    required
                                    placeholder="e.g., Organic Compost, Neem Oil"
                                    className="block w-full px-3 py-2.5 border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all bg-white hover:border-gray-400 placeholder-gray-400"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-semibold text-gray-700 mb-2">Quantity</label>
                                <input
                                    type="text"
                                    value={quantity}
                                    onChange={e => setQuantity(e.target.value)}
                                    required
                                    placeholder="e.g., 200 kg, 5 L, 2 hours"
                                    className="block w-full px-3 py-2.5 border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all bg-white hover:border-gray-400 placeholder-gray-400"
                                />
                            </div>
                        </div>

                        <div>
                            <label className="block text-sm font-semibold text-gray-700 mb-2">Notes</label>
                            <textarea
                                value={notes}
                                onChange={e => setNotes(e.target.value)}
                                rows={4}
                                placeholder="Optional notes about this activity..."
                                className="block w-full px-3 py-2.5 border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all bg-white hover:border-gray-400 resize-none placeholder-gray-400"
                            ></textarea>
                        </div>

                        <div className="flex items-center justify-between pt-2">
                            {showSuccess && (
                                <div className="flex items-center gap-2 bg-green-50 text-green-700 px-4 py-2 rounded-lg border border-green-200">
                                    <CheckCircle className="h-5 w-5" />
                                    <span className="font-semibold">Activity logged successfully!</span>
                                </div>
                            )}
                            <button
                                type="submit"
                                className="ml-auto inline-flex items-center gap-2 justify-center rounded-lg bg-indigo-600 px-5 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-indigo-700 transition-colors"
                            >
                                <PlusCircle className="h-4 w-4" />
                                Log Activity
                            </button>
                        </div>
                    </form>
                </div>

                {/* Activity Logs Table */}
                <div className="bg-white shadow-sm rounded-xl overflow-hidden border border-gray-200">
                    <div className="bg-gray-50 p-6 border-b border-gray-200 flex flex-wrap justify-between items-center gap-4">
                        <div className="flex items-center gap-3 flex-wrap">
                            <span className="text-sm font-semibold text-gray-700 flex items-center gap-2">
                                <Filter className="h-4 w-4" />
                                Filter Logs:
                            </span>
                            <div className="w-48">
                                <CustomPlotDropdown
                                    value={plotFilter}
                                    onChange={setPlotFilter}
                                    options={uniquePlots}
                                    placeholder="All Plots"
                                />
                            </div>
                            <div className="w-48">
                                <CustomActivityTypeDropdown
                                    value={activityFilter}
                                    onChange={setActivityFilter}
                                    options={['All', ...Object.values(GAPActivityType)]}
                                />
                            </div>
                        </div>
                        <button
                            onClick={() => setIsReportModalOpen(true)}
                            className="inline-flex items-center gap-2 justify-center rounded-lg bg-green-600 px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2 transition-colors"
                        >
                            <FileText className="h-4 w-4" />
                            Generate Report
                        </button>
                    </div>

                    <div className="overflow-x-auto">
                        <table className="min-w-full divide-y divide-gray-200">
                            <thead className="bg-gray-900">
                                <tr>
                                    <th scope="col" className="px-6 py-4 text-left text-xs font-bold text-white uppercase tracking-wider">Plot</th>
                                    <th scope="col" className="px-6 py-4 text-left text-xs font-bold text-white uppercase tracking-wider">Date</th>
                                    <th scope="col" className="px-6 py-4 text-left text-xs font-bold text-white uppercase tracking-wider">Type</th>
                                    <th scope="col" className="px-6 py-4 text-left text-xs font-bold text-white uppercase tracking-wider">Product/Method</th>
                                    <th scope="col" className="px-6 py-4 text-left text-xs font-bold text-white uppercase tracking-wider">Quantity</th>
                                    <th scope="col" className="px-6 py-4 text-left text-xs font-bold text-white uppercase tracking-wider">Notes</th>
                                </tr>
                            </thead>
                            <tbody className="bg-white divide-y divide-gray-100">
                                {filteredLogs.map((log, idx) => (
                                    <tr key={log.id} className="hover:bg-gray-50 transition-colors">
                                        <td className="px-6 py-4 whitespace-nowrap text-sm font-semibold text-gray-900">{log.farmPlotLocation}</td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">{log.date}</td>
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-indigo-100 text-indigo-800">
                                                {log.activityType}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">{log.productUsed}</td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{log.quantity}</td>
                                        <td className="px-6 py-4 text-sm text-gray-600">{log.notes}</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>

            {isReportModalOpen && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
                    <div className="bg-white rounded-xl p-8 shadow-xl w-full max-w-5xl max-h-[90vh] flex flex-col border border-gray-200">
                        {/* Modal Header */}
                        <div className="flex justify-between items-center mb-6 pb-4 border-b border-gray-200 flex-shrink-0">
                            <div className="flex items-center gap-3">
                                <div className="p-2 bg-indigo-100 rounded-lg">
                                    <FileText className="h-5 w-5 text-indigo-600" />
                                </div>
                                <h2 className="text-2xl font-bold text-gray-900">
                                    GAP Compliance Report
                                </h2>
                            </div>
                            <div className="flex items-center gap-2">
                                <button
                                    onClick={handlePrint}
                                    className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-indigo-600 text-white font-semibold hover:bg-indigo-700 shadow-sm transition-colors"
                                >
                                    <Printer className="h-4 w-4" />
                                    Print
                                </button>
                                <button
                                    onClick={() => setIsReportModalOpen(false)}
                                    className="p-2 rounded-lg hover:bg-gray-100 text-gray-500 hover:text-gray-700 transition-colors"
                                >
                                    <X size={20} />
                                </button>
                            </div>
                        </div>

                        {/* Modal Content */}
                        <div ref={reportContentRef} className="overflow-y-auto pr-2">
                            <div className="bg-indigo-50 rounded-lg p-6 mb-6 border border-indigo-200">
                                <h1 className="text-xl font-bold text-gray-900 mb-2">Summary of Agricultural Practices</h1>
                                <p className="text-sm text-gray-600 flex items-center gap-2">
                                    <span className="font-semibold">Report generated on:</span>
                                    <span className="bg-white px-3 py-1 rounded-md border border-gray-200 text-gray-700">
                                        {new Date().toLocaleDateString()}
                                    </span>
                                </p>
                            </div>

                            {Object.entries(reportData).map(([plot, logs]: [string, GAPLogEntry[]]) => (
                                <div key={plot} className="mb-6 bg-white rounded-lg shadow-sm p-6 border-l-4 border-indigo-500">
                                    <div className="flex items-center gap-2 mb-4">
                                        <div className="w-8 h-8 bg-indigo-100 rounded-lg flex items-center justify-center">
                                            <span className="text-indigo-600 font-bold text-lg">📍</span>
                                        </div>
                                        <h2 className="text-lg font-bold text-gray-900">
                                            Plot: <span className="text-indigo-600">{plot}</span>
                                        </h2>
                                    </div>

                                    {Object.values(GAPActivityType).map(type => {
                                        const typeLogs = logs.filter((l: GAPLogEntry) => l.activityType === type);
                                        if (typeLogs.length === 0) return null;
                                        return (
                                            <div key={type} className="mt-4 bg-gray-50 rounded-lg p-4 border border-gray-200">
                                                <div className="flex items-center gap-2 mb-3">
                                                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-indigo-100 text-indigo-800">
                                                        {type}
                                                    </span>
                                                    <span className="text-xs text-gray-500 font-medium">
                                                        ({typeLogs.length} {typeLogs.length === 1 ? 'entry' : 'entries'})
                                                    </span>
                                                </div>
                                                <div className="overflow-x-auto">
                                                    <table className="min-w-full text-sm border border-gray-200 rounded-lg overflow-hidden">
                                                        <thead className="bg-gray-900">
                                                            <tr>
                                                                <th className="text-left px-4 py-4 font-bold text-white w-1/4 border-b border-gray-200 tracking-wider">Date</th>
                                                                <th className="text-left px-4 py-4 font-bold text-white w-1/2 border-b border-gray-200 tracking-wider">Product/Method</th>
                                                                <th className="text-left px-4 py-4 font-bold text-white w-1/4 border-b border-gray-200 tracking-wider">Quantity</th>
                                                            </tr>
                                                        </thead>
                                                        <tbody className="bg-white">
                                                            {typeLogs.map((log, idx) => (
                                                                <tr key={log.id} className={`${idx % 2 === 0 ? 'bg-white' : 'bg-gray-50'} hover:bg-indigo-50 transition-colors`}>
                                                                    <td className="px-4 py-2 border-b border-gray-100 text-gray-700">{log.date}</td>
                                                                    <td className="px-4 py-2 border-b border-gray-100 text-gray-800 font-medium">{log.productUsed}</td>
                                                                    <td className="px-4 py-2 border-b border-gray-100 text-gray-700 font-medium">{log.quantity}</td>
                                                                </tr>
                                                            ))}
                                                        </tbody>
                                                    </table>
                                                </div>
                                            </div>
                                        );
                                    })}
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default GAPComplianceHelper;