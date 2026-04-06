
import React, { useState, useEffect } from 'react';
import { Rocket, Zap, Layout, PlusCircle, BookOpen, Trash2, AlertCircle, X } from 'lucide-react';
import { Button } from './components/ui/Button';
import { GenerationProgress } from './components/GenerationProgress';
import { Editor } from './components/Editor';
import { AdminDashboard } from './components/AdminDashboard';
import { AssetPackage, GenerationStatus, GenerationStep, AssetChapter } from './types';
import {
  performMarketResearch,
  generateTitleAndOutline,
  writeChapter,
  generateCoverImage,
  generateValueStack
} from './services/geminiService';

const PIPELINE_STEPS: GenerationStep[] = [
  { id: 1, label: 'Analyzing Market Pain Points (Gemini 3 Pro)', status: 'pending' },
  { id: 2, label: 'Engineering $100M Hormozi Offer', status: 'pending' },
  { id: 3, label: 'Constructing Strategic Outline', status: 'pending' },
  { id: 4, label: 'Designing Premium Cover Art (Imagen 4)', status: 'pending' },
  { id: 5, label: 'Drafting High-Conversion Content', status: 'pending' },
  { id: 6, label: 'Building Value Stack (Bonuses & OTO)', status: 'pending' },
  { id: 7, label: 'Finalizing Asset Package', status: 'pending' },
];

const LIBRARY_KEY = 'ai_asset_sprint_library';

function loadLibrary(): AssetPackage[] {
  try {
    const raw = localStorage.getItem(LIBRARY_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return parsed.map((a: AssetPackage) => ({ ...a, createdAt: new Date(a.createdAt) }));
  } catch {
    return [];
  }
}

function saveLibrary(assets: AssetPackage[]) {
  try {
    localStorage.setItem(LIBRARY_KEY, JSON.stringify(assets));
  } catch {
    // Storage quota exceeded — silently skip
  }
}

function App() {
  const [view, setView] = useState<'home' | 'generating' | 'editor' | 'admin' | 'library'>('home');
  const [keyword, setKeyword] = useState('');
  const [status, setStatus] = useState<GenerationStatus>(GenerationStatus.IDLE);
  const [activeStep, setActiveStep] = useState(1);
  const [generatedAsset, setGeneratedAsset] = useState<AssetPackage | null>(null);
  const [library, setLibrary] = useState<AssetPackage[]>(loadLibrary);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Persist library to localStorage whenever it changes
  useEffect(() => {
    saveLibrary(library);
  }, [library]);

  const addToLibrary = (asset: AssetPackage) => {
    setLibrary(prev => {
      // Replace if same id, otherwise prepend
      const exists = prev.some(a => a.id === asset.id);
      if (exists) return prev.map(a => a.id === asset.id ? asset : a);
      return [asset, ...prev];
    });
  };

  const deleteFromLibrary = (id: string) => {
    setLibrary(prev => prev.filter(a => a.id !== id));
  };

  const handleAssetUpdate = (updatedAsset: AssetPackage) => {
    setGeneratedAsset(updatedAsset);
    addToLibrary(updatedAsset);
  };

  const handleGenerate = async () => {
    if (!keyword) return;

    setErrorMessage(null);
    setView('generating');
    setStatus(GenerationStatus.RESEARCHING);
    setActiveStep(1);

    try {
      // --- STEP 1 & 2: Research & Offer ---
      const researchData = await performMarketResearch(keyword);

      setActiveStep(3);
      setStatus(GenerationStatus.STRUCTURING);
      await new Promise(r => setTimeout(r, 800));

      // --- STEP 3: Title & Outline ---
      const structureData = await generateTitleAndOutline(keyword, researchData);

      setActiveStep(4);
      setStatus(GenerationStatus.DESIGNING);

      // --- STEP 4: Cover Art ---
      const coverPrompt = structureData.coverImagePrompt || `Minimalist cover for ${structureData.selectedTitle}, ${keyword}`;
      const coverImage = await generateCoverImage(coverPrompt, '3:4');

      setActiveStep(5);
      setStatus(GenerationStatus.DRAFTING);

      // --- STEP 5: Drafting Content ---
      const chapters: AssetChapter[] = [];
      const outline = structureData.outline || [];

      const chapterPromises = outline.map((section: { title: string; bullets: string[] }) =>
        writeChapter(section.title, section.bullets, structureData.selectedTitle)
      );

      const contents = await Promise.all(chapterPromises);

      contents.forEach((content, index) => {
        chapters.push({
          title: outline[index].title,
          content: content || "Content generation failed."
        });
      });

      setActiveStep(6);
      // --- STEP 6: Value Stack ---
      const valueStack = await generateValueStack(structureData.selectedTitle, keyword);

      setActiveStep(7);
      setStatus(GenerationStatus.FINALIZING);
      await new Promise(r => setTimeout(r, 1000));

      const newAsset: AssetPackage = {
        id: Date.now().toString(),
        keyword,
        title: structureData.selectedTitle || "Untitled Asset",
        subtitle: structureData.subtitle || "A Complete Guide",
        targetAudience: researchData.hormoziOffer?.dreamOutcome || "General Audience",
        painPoints: researchData.painPoints || [],
        dreamOutcome: researchData.hormoziOffer?.dreamOutcome || "",
        coverImageBase64: coverImage,
        coverImagePrompt: coverPrompt,
        chapters,
        valueStack: valueStack,
        createdAt: new Date()
      };

      setGeneratedAsset(newAsset);
      addToLibrary(newAsset);
      setView('editor');
      setStatus(GenerationStatus.COMPLETED);

    } catch (error) {
      console.error(error);
      setStatus(GenerationStatus.FAILED);
      setErrorMessage(
        error instanceof Error
          ? error.message
          : "Generation failed. Please ensure your GEMINI_API_KEY is set and valid."
      );
      setView('home');
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans selection:bg-indigo-500/30">
      {/* Navbar */}
      <nav className="h-16 border-b border-slate-800 bg-slate-950/80 backdrop-blur fixed w-full top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 h-full flex items-center justify-between">
          <div className="flex items-center gap-2 cursor-pointer" onClick={() => setView('home')}>
            <div className="bg-gradient-to-br from-indigo-500 to-purple-600 p-2 rounded-lg">
              <Rocket size={20} className="text-white" />
            </div>
            <span className="font-bold text-xl tracking-tight">AI Asset Sprint</span>
          </div>

          <div className="flex items-center gap-4">
            <button
              onClick={() => setView('library')}
              className="text-slate-400 hover:text-white transition-colors flex items-center gap-1.5 text-sm"
              title="Asset Library"
            >
              <BookOpen size={18} />
              {library.length > 0 && (
                <span className="bg-indigo-600 text-white text-xs rounded-full px-1.5 py-0.5 leading-none">
                  {library.length}
                </span>
              )}
            </button>
            <button onClick={() => setView('admin')} className="text-slate-400 hover:text-white transition-colors">
              <Layout size={20} />
            </button>
            <div className="w-8 h-8 rounded-full bg-gradient-to-r from-pink-500 to-orange-400 ring-2 ring-slate-800"></div>
          </div>
        </div>
      </nav>

      {/* Main Content */}
      <main className="pt-20 flex-1 relative overflow-hidden">

        {/* Background Ambience */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[500px] bg-indigo-600/20 rounded-full blur-[120px] -z-10 pointer-events-none" />

        {view === 'home' && (
          <div className="max-w-4xl mx-auto px-6 py-20 text-center">
             <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 text-xs font-medium mb-8">
                <Zap size={12} fill="currentColor" />
                POWERED BY GEMINI 3 PRO & IMAGEN 4
             </div>

             <h1 className="text-5xl md:text-7xl font-bold mb-6 tracking-tight bg-clip-text text-transparent bg-gradient-to-b from-white via-slate-200 to-slate-500">
               Build a $100M Offer <br/> in 3 Minutes.
             </h1>

             <p className="text-lg text-slate-400 mb-12 max-w-2xl mx-auto">
               Transforms a single keyword into a complete commercial asset: Ebook, Cover Art, Value Stack (Bonuses + Workbook + OTO), and Sales Strategy.
             </p>

             {/* Error Banner */}
             {errorMessage && (
               <div className="max-w-2xl mx-auto mb-6 flex items-start gap-3 p-4 rounded-lg bg-red-500/10 border border-red-500/30 text-red-300 text-sm text-left">
                 <AlertCircle size={18} className="shrink-0 mt-0.5" />
                 <span className="flex-1">{errorMessage}</span>
                 <button onClick={() => setErrorMessage(null)} className="shrink-0 text-red-400 hover:text-red-200">
                   <X size={16} />
                 </button>
               </div>
             )}

             <div className="max-w-2xl mx-auto relative group">
               <div className="absolute -inset-1 bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500 rounded-xl blur opacity-25 group-hover:opacity-50 transition duration-1000"></div>
               <div className="relative bg-slate-900 p-2 rounded-xl border border-slate-800 flex items-center gap-2 shadow-2xl">
                  <div className="pl-4">
                    <PlusCircle className="text-slate-500" />
                  </div>
                  <input
                    type="text"
                    value={keyword}
                    onChange={(e) => setKeyword(e.target.value)}
                    placeholder="Enter your niche (e.g. 'Wedding Photography', 'Keto Diet')..."
                    className="flex-1 bg-transparent border-none focus:ring-0 text-lg text-white placeholder-slate-500 h-12"
                    onKeyDown={(e) => e.key === 'Enter' && handleGenerate()}
                  />
                  <Button size="lg" onClick={handleGenerate} disabled={!keyword}>
                    Start Sprint
                  </Button>
               </div>
             </div>

             {/* Templates / Examples */}
             <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-24 text-left">
                {[
                  { title: "Pain Point Analysis", desc: "Deep dive into customer psychology", color: "from-blue-500/20 to-cyan-500/20" },
                  { title: "Value Stacking", desc: "Bonuses, OTOs & Workbooks included", color: "from-purple-500/20 to-pink-500/20" },
                  { title: "Commercial License", desc: "Sell directly to your audience", color: "from-orange-500/20 to-red-500/20" }
                ].map((item, i) => (
                  <div key={i} className={`p-6 rounded-xl border border-slate-800 bg-gradient-to-br ${item.color} backdrop-blur hover:border-slate-600 transition-colors cursor-pointer`}>
                    <h3 className="text-lg font-bold text-white mb-2">{item.title}</h3>
                    <p className="text-slate-400 text-sm">{item.desc}</p>
                  </div>
                ))}
             </div>
          </div>
        )}

        {view === 'generating' && (
          <div className="flex items-center justify-center min-h-[80vh]">
            <GenerationProgress steps={PIPELINE_STEPS} currentStepId={activeStep} />
          </div>
        )}

        {view === 'editor' && generatedAsset && (
          <Editor
            asset={generatedAsset}
            onUpdate={handleAssetUpdate}
          />
        )}

        {view === 'admin' && (
          <AdminDashboard />
        )}

        {view === 'library' && (
          <div className="max-w-5xl mx-auto px-6 py-10">
            <div className="flex items-center justify-between mb-8">
              <h2 className="text-3xl font-bold text-white">Asset Library</h2>
              <Button variant="secondary" size="sm" onClick={() => setView('home')}>
                + New Asset
              </Button>
            </div>

            {library.length === 0 ? (
              <div className="text-center py-20 text-slate-500">
                <BookOpen size={48} className="mx-auto mb-4 opacity-30" />
                <p className="text-lg">No assets yet. Generate your first one!</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {library.map(asset => (
                  <div
                    key={asset.id}
                    className="group relative bg-slate-900/50 border border-slate-800 rounded-xl overflow-hidden hover:border-indigo-500/50 transition-colors cursor-pointer"
                    onClick={() => {
                      setGeneratedAsset(asset);
                      setView('editor');
                    }}
                  >
                    {/* Cover thumbnail */}
                    <div className="aspect-[3/2] bg-slate-800 overflow-hidden">
                      {asset.coverImageBase64 ? (
                        <img src={asset.coverImageBase64} alt={asset.title} className="w-full h-full object-cover" />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-slate-600">
                          <BookOpen size={32} />
                        </div>
                      )}
                    </div>

                    <div className="p-4">
                      <p className="text-xs text-indigo-400 mb-1 uppercase tracking-wide">{asset.keyword}</p>
                      <h3 className="font-bold text-white text-sm leading-snug line-clamp-2">{asset.title}</h3>
                      <p className="text-xs text-slate-500 mt-2">
                        {asset.chapters.length} chapters · {new Date(asset.createdAt).toLocaleDateString()}
                      </p>
                    </div>

                    {/* Delete button */}
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        deleteFromLibrary(asset.id);
                      }}
                      className="absolute top-2 right-2 p-1.5 rounded-lg bg-slate-900/80 text-slate-500 hover:text-red-400 opacity-0 group-hover:opacity-100 transition-all"
                      title="Delete asset"
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

      </main>
    </div>
  );
}

export default App;
