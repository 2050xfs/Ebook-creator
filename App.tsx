
import React, { useState } from 'react';
import { Rocket, Zap, Layout, PlusCircle } from 'lucide-react';
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
      // --- STEP 1 & 2: Research & Offer ---
      // We combine these into one heavy "Thinking" call for coherence
      const researchData = await performMarketResearch(keyword);
      
      setActiveStep(3);
      setStatus(GenerationStatus.STRUCTURING);
      await new Promise(r => setTimeout(r, 800)); // UX pacing

      // --- STEP 3: Title & Outline ---
      const structureData = await generateTitleAndOutline(keyword, researchData);
      
      setActiveStep(4);
      setStatus(GenerationStatus.DESIGNING);

      // --- STEP 4: Cover Art ---
      const coverPrompt = structureData.coverImagePrompt || `Minimalist cover for ${structureData.selectedTitle}, ${keyword}`;
      // Start cover generation in background while we do other things? No, keep it linear for the progress bar drama.
      const coverImage = await generateCoverImage(coverPrompt, '3:4');

      setActiveStep(5);
      setStatus(GenerationStatus.DRAFTING);

      // --- STEP 5: Drafting Content ---
      const chapters: AssetChapter[] = [];
      const outline = structureData.outline || [];

      // Parallel generation for speed
      const chapterPromises = outline.map((section: any) => 
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
                POWERED BY GEMINI 3 PRO & IMAGEN 4
             </div>
             
             <h1 className="text-5xl md:text-7xl font-bold mb-6 tracking-tight bg-clip-text text-transparent bg-gradient-to-b from-white via-slate-200 to-slate-500">
               Build a $100M Offer <br/> in 3 Minutes.
             </h1>
             
             <p className="text-lg text-slate-400 mb-12 max-w-2xl mx-auto">
               Transforms a single keyword into a complete commercial asset: Ebook, Cover Art, Value Stack (Bonuses + Workbook + OTO), and Sales Strategy.
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
