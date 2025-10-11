
import * as React from 'react';
import { useDataContext } from '../../hooks/useDataContext';
import { GAPActivityType, GAPLogEntry } from '../../types';
import { PlusCircle, Filter, FileText, Printer, X, CheckCircle } from 'lucide-react';

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
        <div>
            <h1 className="text-3xl font-bold text-gray-900">GAP Compliance Helper</h1>
            <p className="text-gray-600 mt-1 mb-6">Log and report agricultural activities for certification.</p>

            <div className="bg-white shadow-md rounded-lg p-6 border border-gray-200 mb-8">
                <h2 className="text-xl font-bold text-gray-800 mb-4">Log New Activity</h2>
                <form onSubmit={handleLogSubmit} className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-700">Farm/Plot</label>
                             <select value={farmPlotLocation} onChange={e => setFarmPlotLocation(e.target.value)} required className="mt-1 block w-full border-gray-300 rounded-md shadow-sm">
                                <option value="" disabled>Select a plot...</option>
                                {uniquePlots.slice(1).map(p => <option key={p} value={p}>{p}</option>)}
                            </select>
                        </div>
                         <div>
                            <label className="block text-sm font-medium text-gray-700">Activity Type</label>
                             <select value={activityType} onChange={e => setActivityType(e.target.value as GAPActivityType)} required className="mt-1 block w-full border-gray-300 rounded-md shadow-sm">
                                {Object.values(GAPActivityType).map(t => <option key={t} value={t}>{t}</option>)}
                            </select>
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700">Date</label>
                            <input type="date" value={date} onChange={e => setDate(e.target.value)} required className="mt-1 block w-full border-gray-300 rounded-md shadow-sm" />
                        </div>
                    </div>
                     <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-700">Product/Method Used</label>
                            <input type="text" value={productUsed} onChange={e => setProductUsed(e.target.value)} required placeholder="e.g., Organic Compost, Neem Oil" className="mt-1 block w-full border-gray-300 rounded-md shadow-sm" />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700">Quantity</label>
                            <input type="text" value={quantity} onChange={e => setQuantity(e.target.value)} required placeholder="e.g., 200 kg, 5 L, 2 hours" className="mt-1 block w-full border-gray-300 rounded-md shadow-sm" />
                        </div>
                    </div>
                    <div>
                         <label className="block text-sm font-medium text-gray-700">Notes</label>
                         <textarea value={notes} onChange={e => setNotes(e.target.value)} rows={2} className="mt-1 block w-full border-gray-300 rounded-md shadow-sm"></textarea>
                    </div>
                     <div className="flex items-end justify-between h-10">
                        {showSuccess && <div className="flex items-center text-green-600"><CheckCircle className="h-5 w-5 mr-2" /> Activity logged!</div>}
                        <button type="submit" className="inline-flex items-center justify-center rounded-md border border-transparent bg-indigo-600 px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-indigo-700 ml-auto"><PlusCircle className="h-5 w-5 mr-2" /> Log Activity</button>
                    </div>
                </form>
            </div>

            <div className="bg-white shadow-md rounded-lg overflow-hidden">
                <div className="p-4 border-b flex flex-wrap justify-between items-center gap-4">
                    <div className="flex items-center gap-2"><Filter className="h-5 w-5 text-gray-500" /><span className="font-semibold">Filter Logs:</span>
                        <select value={plotFilter} onChange={e => setPlotFilter(e.target.value)} className="border-gray-300 rounded-md shadow-sm text-sm"><option value="All">All Plots</option>{uniquePlots.slice(1).map(p => <option key={p} value={p}>{p}</option>)}</select>
                        <select value={activityFilter} onChange={e => setActivityFilter(e.target.value)} className="border-gray-300 rounded-md shadow-sm text-sm"><option value="All">All Activities</option>{Object.values(GAPActivityType).map(t => <option key={t} value={t}>{t}</option>)}</select>
                    </div>
                    <button onClick={() => setIsReportModalOpen(true)} className="inline-flex items-center justify-center rounded-md border border-transparent bg-green-600 px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-green-700"><FileText className="h-4 w-4 mr-2" /> Generate Report</button>
                </div>
                <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-gray-200">
                        <thead className="bg-gray-50"><tr><th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Plot</th><th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Date</th><th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Type</th><th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Product/Method</th><th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Quantity</th><th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Notes</th></tr></thead>
                        <tbody className="bg-white divide-y divide-gray-200">
                            {filteredLogs.map(log => <tr key={log.id}><td className="px-6 py-4 whitespace-nowrap text-sm font-medium">{log.farmPlotLocation}</td><td className="px-6 py-4 whitespace-nowrap text-sm">{log.date}</td><td className="px-6 py-4 whitespace-nowrap text-sm">{log.activityType}</td><td className="px-6 py-4 whitespace-nowrap text-sm">{log.productUsed}</td><td className="px-6 py-4 whitespace-nowrap text-sm">{log.quantity}</td><td className="px-6 py-4 text-sm text-gray-500">{log.notes}</td></tr>)}
                        </tbody>
                    </table>
                </div>
            </div>

            {isReportModalOpen && <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
                <div className="bg-white rounded-lg p-8 shadow-2xl w-full max-w-4xl max-h-[90vh] flex flex-col">
                    <div className="flex justify-between items-center mb-4 flex-shrink-0">
                        <h2 className="text-2xl font-bold">GAP Compliance Report</h2>
                        <div className="space-x-2"><button onClick={handlePrint} className="inline-flex items-center text-sm p-2 rounded-md bg-blue-600 text-white hover:bg-blue-700"><Printer className="h-4 w-4 mr-1"/> Print</button><button onClick={() => setIsReportModalOpen(false)} className="p-2 rounded-md hover:bg-gray-200"><X size={20}/></button></div>
                    </div>
                    <div ref={reportContentRef} className="overflow-y-auto">
                        <h1 className="text-xl font-bold mb-2">Summary of Agricultural Practices</h1>
                        <p className="text-sm text-gray-600 mb-4">Report generated on: {new Date().toLocaleDateString()}</p>
                        {Object.entries(reportData).map(([plot, logs]) => (
                           <div key={plot} className="mb-6 border-t pt-4">
                               <h2 className="text-lg font-semibold text-indigo-700">Plot: {plot}</h2>
                                {Object.values(GAPActivityType).map(type => {
                                   const typeLogs = logs.filter(l => l.activityType === type);
                                   if (typeLogs.length === 0) return null;
                                   return <div key={type} className="mt-3">
                                        <h3 className="font-semibold">{type}</h3>
                                        <table className="min-w-full text-sm mt-1">
                                            <thead><tr><th className="text-left p-1 font-medium w-1/4">Date</th><th className="text-left p-1 font-medium w-1/2">Product/Method</th><th className="text-left p-1 font-medium w-1/4">Quantity</th></tr></thead>
                                            <tbody>{typeLogs.map(log => <tr key={log.id}><td className="p-1 border-t">{log.date}</td><td className="p-1 border-t">{log.productUsed}</td><td className="p-1 border-t">{log.quantity}</td></tr>)}</tbody>
                                        </table>
                                   </div>
                                })}
                           </div>
                        ))}
                    </div>
                </div>
            </div>}
        </div>
    );
};

export default GAPComplianceHelper;