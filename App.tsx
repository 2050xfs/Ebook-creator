import React, { useState } from 'react';
import { Rocket, Zap, Layout, Settings, PlusCircle } from 'lucide-react';
import { Button } from './components/ui/Button';
import { Card } from './components/ui/Card';
import { GenerationProgress } from './components/GenerationProgress';
import { Editor } from './components/Editor';
import { AdminDashboard } from './components/AdminDashboard';
import { AssetPackage, GenerationStatus, GenerationStep, AssetChapter } from './types';
import { generateAssetStrategy, generateChapterContent, generateCoverImage } from './services/geminiService';

const INITIAL_STEPS: GenerationStep[] = [
  { id: 1, label: 'Market Research & Strategy (Gemini 3 Pro Thinking)', status: 'pending' },
  { id: 2, label: 'Structuring $100M Offer', status: 'pending' },
  { id: 3, label: 'Drafting Core Chapters', status: 'pending' },
  { id: 4, label: 'Generating Cover Art (Imagen 4)', status: 'pending' },
  { id: 5, label: 'Compiling Asset Package', status: 'pending' },
];

function App() {
  const [view, setView] = useState<'home' | 'generating' | 'editor' | 'admin'>('home');
  const [keyword, setKeyword] = useState('');
  const [status, setStatus] = useState<GenerationStatus>(GenerationStatus.IDLE);
  const [activeStep, setActiveStep] = useState(1);
  const [generatedAsset, setGeneratedAsset] = useState<AssetPackage | null>(null);

  const handleGenerate = async () => {
    if (!keyword) return;
    
    setView('generating');
    setStatus(GenerationStatus.RESEARCHING);
    setActiveStep(1);

    try {
      // Step 1: Strategy (Thinking Mode)
      const strategy = await generateAssetStrategy(keyword);
      setActiveStep(2);
      setStatus(GenerationStatus.STRUCTURING);

      await new Promise(r => setTimeout(r, 1000)); // UX pause
      
      // Step 2 & 3: Drafting Content
      setActiveStep(3);
      setStatus(GenerationStatus.DRAFTING);
      
      const chapters: AssetChapter[] = [];
      const rawChapters = strategy.chapters || [];

      // Parallel generation for speed (chunking to avoid rate limits if needed, here we do simple parallel)
      const chapterPromises = rawChapters.map((chap: any) => 
        generateChapterContent(chap.title, chap.brief, strategy.targetAudience)
      );
      
      const contents = await Promise.all(chapterPromises);
      
      contents.forEach((content, index) => {
        chapters.push({
          title: rawChapters[index].title,
          content: content || "Content generation failed."
        });
      });

      // Step 4: Cover Image
      setActiveStep(4);
      setStatus(GenerationStatus.DESIGNING);
      
      const coverPrompt = strategy.coverImageIdea || `Minimalist cover for ${strategy.title}`;
      const coverImage = await generateCoverImage(coverPrompt, '3:4');

      // Step 5: Finalize
      setActiveStep(5);
      setStatus(GenerationStatus.FINALIZING);

      const newAsset: AssetPackage = {
        id: Date.now().toString(),
        keyword,
        title: strategy.title || "Untitled Asset",
        subtitle: strategy.subtitle || "A Complete Guide",
        targetAudience: strategy.targetAudience || "General Audience",
        coverImageBase64: coverImage,
        coverImagePrompt: coverPrompt,
        chapters,
        bonuses: strategy.bonuses || [],
        createdAt: new Date()
      };

      setGeneratedAsset(newAsset);
      await new Promise(r => setTimeout(r, 800));
      
      setView('editor');
      setStatus(GenerationStatus.COMPLETED);

    } catch (error) {
      console.error(error);
      setStatus(GenerationStatus.FAILED);
      alert("Generation failed. Please ensure API Key is set and valid.");
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
                POWERED BY GEMINI 2.5 FLASH & IMAGEN 4
             </div>
             
             <h1 className="text-5xl md:text-7xl font-bold mb-6 tracking-tight bg-clip-text text-transparent bg-gradient-to-b from-white via-slate-200 to-slate-500">
               Unleash Your Next <br/> Masterpiece.
             </h1>
             
             <p className="text-lg text-slate-400 mb-12 max-w-2xl mx-auto">
               Transform a single keyword into a fully designed lead magnet, ebook, or course asset in under 3 minutes. Strategy, content, and design—automated.
             </p>

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
                    placeholder="Enter a niche or topic (e.g. 'Keto Meal Prep', 'SaaS Marketing')..." 
                    className="flex-1 bg-transparent border-none focus:ring-0 text-lg text-white placeholder-slate-500 h-12"
                    onKeyDown={(e) => e.key === 'Enter' && handleGenerate()}
                  />
                  <Button size="lg" onClick={handleGenerate} disabled={!keyword}>
                    Generate Asset
                  </Button>
               </div>
             </div>

             {/* Templates / Examples */}
             <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-24 text-left">
                {[
                  { title: "Course Workbooks", desc: "Structured lessons & exercises", color: "from-blue-500/20 to-cyan-500/20" },
                  { title: "Lead Magnets", desc: "High-conversion PDF guides", color: "from-purple-500/20 to-pink-500/20" },
                  { title: "Strategy Docs", desc: "Action plans & checklists", color: "from-orange-500/20 to-red-500/20" }
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
            <GenerationProgress steps={INITIAL_STEPS} currentStepId={activeStep} />
          </div>
        )}

        {view === 'editor' && generatedAsset && (
          <Editor 
            asset={generatedAsset} 
            onUpdate={setGeneratedAsset}
          />
        )}

        {view === 'admin' && (
          <AdminDashboard />
        )}

      </main>
    </div>
  );
}

export default App;