import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { 
  FolderHeart, 
  FileText, 
  Download, 
  Tag, 
  Search,
  Share2,
  Copy,
  CheckCircle2,
  Clock,
  X
} from 'lucide-react';

export const HealthRecordsPage = () => {
  const { authFetch } = useAuth();
  const [records, setRecords] = useState([]);
  const [activeCategory, setActiveCategory] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedRecord, setSelectedRecord] = useState(null);
  const [loading, setLoading] = useState(true);
  
  // 24h Doctor Share Link state
  const [isShareModalOpen, setIsShareModalOpen] = useState(false);
  const [shareData, setShareData] = useState(null);
  const [copied, setCopied] = useState(false);
  const [generatingLink, setGeneratingLink] = useState(false);

  const categories = [
    { id: 'all', label: 'All Folders' },
    { id: 'lab', label: 'Lab Reports' },
    { id: 'consultation', label: 'Doctor Notes' },
    { id: 'prescription', label: 'Prescriptions' },
    { id: 'imaging', label: 'Imaging / ECG' },
  ];

  const fetchRecords = async (cat = 'all') => {
    try {
      const url = cat === 'all' ? '/api/records' : `/api/records?category=${cat}`;
      const res = await authFetch(url);
      if (res.ok) {
        const data = await res.json();
        setRecords(data);
        if (data.length > 0 && !selectedRecord) {
          setSelectedRecord(data[0]);
        }
      }
    } catch (e) {
      console.error('Error fetching records:', e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRecords(activeCategory);
  }, [activeCategory]);

  const handleGenerateShareLink = async () => {
    setGeneratingLink(true);
    try {
      const res = await authFetch('/api/consultations/share-link', {
        method: 'POST',
        body: JSON.stringify({ notes: 'Patient-shared 24h record link' })
      });
      if (res.ok) {
        const data = await res.json();
        setShareData(data);
        setIsShareModalOpen(true);
      }
    } catch (e) {
      console.error('Error creating share link:', e);
    } finally {
      setGeneratingLink(false);
    }
  };

  const handleCopy = () => {
    const fullUrl = `${window.location.origin}${shareData?.share_url}`;
    navigator.clipboard.writeText(fullUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  };

  const filteredRecords = records.filter(r => {
    if (!searchQuery) return true;
    const q = searchQuery.toLowerCase();
    return r.title.toLowerCase().includes(q) || 
           (r.tags && r.tags.toLowerCase().includes(q)) || 
           (r.provider_name && r.provider_name.toLowerCase().includes(q));
  });

  return (
    <div className="space-y-6">
      
      {/* Header with Search and "Share with New Doctor" CTA */}
      <div className="bg-canvas-card rounded-card p-6 border border-teal-dark/10 shadow-soft">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-full bg-mint text-teal-dark flex items-center justify-center shadow-pill">
              <FolderHeart className="w-6 h-6 text-teal-dark" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-teal-dark">Unified Health Records</h1>
              <p className="text-sm text-teal-dark/70">
                You own your records. Download or share with a new doctor with a single click.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {/* 24-Hour Doctor Share Button */}
            <button
              onClick={handleGenerateShareLink}
              disabled={generatingLink}
              className="inline-flex items-center gap-1.5 px-4 py-2 rounded-full bg-teal-dark hover:bg-teal-light text-white text-xs font-bold shadow-pill transition-all"
            >
              <Share2 className="w-3.5 h-3.5 text-mint" />
              <span>{generatingLink ? 'Creating...' : 'Share with New Doctor (24h)'}</span>
            </button>

            {/* Search */}
            <div className="relative min-w-[200px]">
              <Search className="w-4 h-4 text-teal-dark/40 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Search files..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-9 pr-4 py-2 rounded-full bg-canvas-subtle border border-teal-dark/15 text-xs text-teal-dark focus:outline-none focus:ring-2 focus:ring-mint font-medium"
              />
            </div>
          </div>
        </div>

        {/* Category Filter Chips */}
        <div className="flex flex-wrap gap-2 mt-5 pt-4 border-t border-teal-dark/10">
          {categories.map((c) => (
            <button
              key={c.id}
              onClick={() => setActiveCategory(c.id)}
              className={`px-4 py-1.5 rounded-full text-xs font-bold transition-all ${
                activeCategory === c.id
                  ? 'bg-teal-dark text-white shadow-pill'
                  : 'bg-canvas-subtle text-teal-dark/70 hover:text-teal-dark hover:bg-canvas-subtle/80'
              }`}
            >
              {c.label}
            </button>
          ))}
        </div>
      </div>

      {/* Main Grid: Folder List & Detailed Viewer */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* Left Column: Folder Cards */}
        <div className="lg:col-span-5 space-y-3">
          {filteredRecords.length === 0 ? (
            <div className="bg-white rounded-card p-8 text-center text-teal-dark/60 text-sm">
              No clinical records found matching your filter.
            </div>
          ) : (
            filteredRecords.map((rec) => {
              const isSelected = selectedRecord?.id === rec.id;
              return (
                <div
                  key={rec.id}
                  onClick={() => setSelectedRecord(rec)}
                  className={`p-4 rounded-2xl cursor-pointer transition-all border ${
                    isSelected
                      ? 'bg-mint/40 border-mint shadow-soft ring-2 ring-teal-dark/20'
                      : 'bg-white border-teal-dark/10 hover:border-teal-dark/30 hover:shadow-sm'
                  }`}
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex items-center gap-2.5">
                      <div className="w-9 h-9 rounded-xl bg-teal-dark text-mint flex items-center justify-center flex-shrink-0">
                        <FileText className="w-5 h-5 text-mint" />
                      </div>
                      <div>
                        <h2 className="text-sm font-bold text-teal-dark line-clamp-1">{rec.title}</h2>
                        <span className="text-[11px] text-teal-dark/60 font-medium">
                          {new Date(rec.record_date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                        </span>
                      </div>
                    </div>
                    <span className="text-[10px] uppercase font-bold px-2 py-0.5 rounded-full bg-white text-teal-dark border border-teal-dark/10">
                      {rec.category}
                    </span>
                  </div>

                  <p className="text-xs text-teal-dark/80 mt-2 line-clamp-2">
                    {rec.summary}
                  </p>

                  <div className="mt-3 flex items-center justify-between text-[11px] text-teal-dark/60 pt-2 border-t border-teal-dark/5">
                    <span>{rec.provider_name || rec.facility}</span>
                    <span className="font-semibold">{rec.file_size_kb} KB PDF</span>
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Right Column: Detailed Document Viewer Card */}
        <div className="lg:col-span-7">
          {selectedRecord ? (
            <div className="bg-white rounded-card p-6 border border-teal-dark/10 shadow-soft space-y-5 sticky top-24">
              <div className="flex items-start justify-between gap-4 pb-4 border-b border-teal-dark/10">
                <div>
                  <span className="text-xs font-bold uppercase tracking-wider text-teal-dark bg-mint px-3 py-1 rounded-full inline-block mb-2">
                    {selectedRecord.category} Report
                  </span>
                  <h2 className="text-xl font-bold text-teal-dark">{selectedRecord.title}</h2>
                  <p className="text-xs text-teal-dark/70 mt-1">
                    Encounter date: {new Date(selectedRecord.record_date).toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' })}
                  </p>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    onClick={() => alert(`Downloading record: ${selectedRecord.title}`)}
                    className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-full bg-canvas-subtle hover:bg-mint text-teal-dark text-xs font-bold transition-all border border-teal-dark/10"
                    title="Download Official Record"
                  >
                    <Download className="w-3.5 h-3.5" />
                    <span>Download</span>
                  </button>
                </div>
              </div>

              {/* Provider & Facility Box */}
              <div className="grid grid-cols-2 gap-3 text-xs bg-canvas-subtle p-3 rounded-2xl border border-teal-dark/5">
                <div>
                  <span className="text-teal-dark/60 block font-medium">Doctor / Facility:</span>
                  <span className="font-bold text-teal-dark">{selectedRecord.provider_name}</span>
                </div>
                <div>
                  <span className="text-teal-dark/60 block font-medium">Clinical Location:</span>
                  <span className="font-bold text-teal-dark">{selectedRecord.facility}</span>
                </div>
              </div>

              {/* Clinical Summary */}
              <div>
                <h4 className="text-xs font-bold text-teal-dark uppercase tracking-wider mb-1.5">
                  Summary & Notes
                </h4>
                <p className="text-sm text-teal-dark/85 leading-relaxed bg-canvas-subtle/50 p-4 rounded-2xl border border-teal-dark/5">
                  {selectedRecord.summary}
                </p>
              </div>

              {/* Key Findings Box */}
              {selectedRecord.key_findings && (
                <div>
                  <h4 className="text-xs font-bold text-teal-dark uppercase tracking-wider mb-1.5">
                    Key Findings
                  </h4>
                  <div className="p-4 rounded-2xl bg-mint-light/60 border border-mint text-xs text-teal-dark font-medium leading-relaxed">
                    {selectedRecord.key_findings}
                  </div>
                </div>
              )}

              {/* Tags */}
              {selectedRecord.tags && (
                <div className="pt-2">
                  <div className="flex flex-wrap items-center gap-1.5">
                    <Tag className="w-3.5 h-3.5 text-teal-dark/50" />
                    {selectedRecord.tags.split(',').map((t, idx) => (
                      <span key={idx} className="text-[11px] font-semibold bg-canvas-subtle text-teal-dark/70 px-2.5 py-0.5 rounded-full">
                        #{t.trim()}
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </div>
          ) : (
            <div className="bg-white rounded-card p-12 text-center text-teal-dark/60">
              Select a record from the list to preview details.
            </div>
          )}
        </div>

      </div>

      {/* 24-Hour Doctor Share Modal */}
      {isShareModalOpen && shareData && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-teal-dark/60 backdrop-blur-sm">
          <div className="bg-white rounded-card w-full max-w-md p-6 shadow-float border border-teal-dark/10 relative space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-teal-dark/10">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-full bg-mint text-teal-dark flex items-center justify-center">
                  <Share2 className="w-4 h-4 text-teal-dark" />
                </div>
                <h3 className="text-base font-bold text-teal-dark">Doctor Read-Only Link</h3>
              </div>
              <button onClick={() => setIsShareModalOpen(false)} className="p-1 rounded-full hover:bg-canvas-subtle">
                <X className="w-4 h-4 text-teal-dark" />
              </button>
            </div>

            <p className="text-xs text-teal-dark/80 leading-relaxed">
              Send this secure link to any new doctor or specialist. They can view your consultation comparison, vitals trends, and lab reports <strong>with no login required</strong>.
            </p>

            <div className="p-3 bg-canvas-subtle rounded-2xl border border-teal-dark/15 flex items-center justify-between gap-2">
              <span className="text-xs font-mono text-teal-dark truncate">
                {window.location.origin}{shareData.share_url}
              </span>
              <button
                onClick={handleCopy}
                className="px-3 py-1.5 bg-teal-dark text-white text-xs font-bold rounded-full flex items-center gap-1 shadow-pill flex-shrink-0"
              >
                {copied ? <CheckCircle2 className="w-3.5 h-3.5 text-mint" /> : <Copy className="w-3.5 h-3.5" />}
                <span>{copied ? 'Copied' : 'Copy'}</span>
              </button>
            </div>

            <div className="flex items-center gap-1.5 text-[11px] text-teal-dark/70 font-semibold bg-mint/40 p-2.5 rounded-xl border border-mint">
              <Clock className="w-3.5 h-3.5 text-teal-dark" />
              <span>Link automatically expires in 24 hours. You can revoke it anytime.</span>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};
