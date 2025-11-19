import React, { useState, useRef, useEffect } from 'react';
import { AssetPackage, AspectRatio } from '../types';
import { Button } from './ui/Button';
import { Card } from './ui/Card';
import { Download, Image as ImageIcon, Sparkles, RefreshCw, Save, Type } from 'lucide-react';
import { editImageWithPrompt, quickTitleBrainstorm, generateCoverImage } from '../services/geminiService';

interface EditorProps {
  asset: AssetPackage;
  onUpdate: (updatedAsset: AssetPackage) => void;
}

export const Editor: React.FC<EditorProps> = ({ asset, onUpdate }) => {
  const [activeChapter, setActiveChapter] = useState<number>(0);
  const [isEditingImage, setIsEditingImage] = useState(false);
  const [imagePrompt, setImagePrompt] = useState('');
  const [isRegeneratingTitle, setIsRegeneratingTitle] = useState(false);
  const [aspectRatio, setAspectRatio] = useState<AspectRatio>('3:4');
  
  const handleContentChange = (newContent: string) => {
    const updatedChapters = [...asset.chapters];
    updatedChapters[activeChapter].content = newContent;
    onUpdate({ ...asset, chapters: updatedChapters });
  };

  const handleEditImage = async () => {
    if (!asset.coverImageBase64 || !imagePrompt) return;
    setIsEditingImage(true);
    try {
      const newImage = await editImageWithPrompt(asset.coverImageBase64, imagePrompt);
      if (newImage) {
        onUpdate({ ...asset, coverImageBase64: newImage });
        setImagePrompt('');
      }
    } catch (e) {
      alert("Failed to edit image");
    } finally {
      setIsEditingImage(false);
    }
  };

  const handleRegenerateCover = async () => {
      setIsEditingImage(true);
      try {
          const newImage = await generateCoverImage(asset.coverImagePrompt || asset.title, aspectRatio);
          if (newImage) {
              onUpdate({...asset, coverImageBase64: newImage});
          }
      } catch(e) {
          alert("Failed to generate new cover");
      } finally {
          setIsEditingImage(false);
      }
  }

  const handleMagicTitle = async () => {
    setIsRegeneratingTitle(true);
    const newTitle = await quickTitleBrainstorm(asset.title);
    if (newTitle) {
      onUpdate({ ...asset, title: newTitle });
    }
    setIsRegeneratingTitle(false);
  };

  const exportToDoc = () => {
    // Mock export functionality
    const element = document.createElement("a");
    const file = new Blob([
      `Title: ${asset.title}\nSubtitle: ${asset.subtitle}\n\n` + 
      asset.chapters.map(c => `## ${c.title}\n\n${c.content}`).join('\n\n')
    ], {type: 'text/plain'});
    element.href = URL.createObjectURL(file);
    element.download = `${asset.keyword.replace(/\s/g, '_')}_asset.txt`;
    document.body.appendChild(element);
    element.click();
  };

  return (
    <div className="flex h-[calc(100vh-80px)] gap-4 p-4">
      {/* Left: Content Editor */}
      <div className="w-1/2 flex flex-col gap-4">
        <Card className="flex-1 flex flex-col h-full overflow-hidden">
          <div className="flex justify-between items-center mb-4 pb-4 border-b border-slate-800">
            <div className="flex items-center gap-2">
              <Type className="text-indigo-400" size={20} />
              <h2 className="text-xl font-bold text-white outline-none focus:border-b border-indigo-500" contentEditable 
                onBlur={(e) => onUpdate({...asset, title: e.currentTarget.textContent || asset.title})}
              >
                {asset.title}
              </h2>
              <button 
                onClick={handleMagicTitle} 
                disabled={isRegeneratingTitle}
                className="p-1 hover:bg-slate-800 rounded-full text-yellow-400 transition-colors" 
                title="AI Rewrite Title"
              >
                <Sparkles size={16} className={isRegeneratingTitle ? "animate-spin" : ""} />
              </button>
            </div>
            <div className="flex gap-2">
               <Button variant="ghost" size="sm" onClick={exportToDoc}>
                 <Download size={16} className="mr-2" /> Export
               </Button>
            </div>
          </div>

          <div className="flex gap-2 mb-4 overflow-x-auto pb-2 scrollbar-thin">
            {asset.chapters.map((chap, idx) => (
              <button
                key={idx}
                onClick={() => setActiveChapter(idx)}
                className={`px-3 py-1.5 text-sm whitespace-nowrap rounded-full transition-colors ${
                  activeChapter === idx 
                    ? 'bg-indigo-600 text-white' 
                    : 'bg-slate-800 text-slate-400 hover:bg-slate-700'
                }`}
              >
                {idx + 1}. {chap.title.substring(0, 15)}...
              </button>
            ))}
          </div>

          <textarea 
            className="flex-1 w-full bg-slate-950 p-4 rounded-lg text-slate-300 focus:outline-none focus:ring-1 focus:ring-indigo-500 resize-none font-mono text-sm leading-relaxed"
            value={asset.chapters[activeChapter].content}
            onChange={(e) => handleContentChange(e.target.value)}
          />
        </Card>
      </div>

      {/* Right: Preview & Media */}
      <div className="w-1/2 flex flex-col gap-4 overflow-y-auto">
        {/* Cover Image Editor */}
        <Card title="Cover Asset" className="shrink-0">
          <div className="relative group rounded-lg overflow-hidden border border-slate-700 bg-slate-950 aspect-[3/4] max-h-96 mx-auto">
            {asset.coverImageBase64 ? (
              <img src={asset.coverImageBase64} alt="Cover" className="w-full h-full object-cover" />
            ) : (
               <div className="w-full h-full flex items-center justify-center text-slate-600">No Image</div>
            )}
            
            {/* Overlay Controls */}
            <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col items-center justify-center p-6 gap-3">
               <div className="w-full">
                 <label className="text-xs text-slate-400 mb-1 block">Magic Edit (Nano Banana)</label>
                 <div className="flex gap-2">
                    <input 
                        type="text" 
                        placeholder="e.g. Add a retro filter..." 
                        className="flex-1 bg-slate-800 border border-slate-700 rounded px-3 py-1.5 text-sm text-white focus:outline-none"
                        value={imagePrompt}
                        onChange={(e) => setImagePrompt(e.target.value)}
                    />
                    <Button size="sm" onClick={handleEditImage} isLoading={isEditingImage}>
                        <Sparkles size={14} />
                    </Button>
                 </div>
               </div>
               
               <div className="w-full mt-2 pt-2 border-t border-slate-700">
                   <label className="text-xs text-slate-400 mb-1 block">Re-Generate (Imagen 4)</label>
                   <div className="flex gap-2 items-center justify-between">
                        <select 
                            value={aspectRatio} 
                            onChange={(e) => setAspectRatio(e.target.value as AspectRatio)}
                            className="bg-slate-800 text-xs text-white border border-slate-700 rounded p-1"
                        >
                            <option value="1:1">1:1 Square</option>
                            <option value="3:4">3:4 Portrait</option>
                            <option value="16:9">16:9 Landscape</option>
                        </select>
                        <Button size="sm" variant="secondary" onClick={handleRegenerateCover} isLoading={isEditingImage}>
                            <RefreshCw size={14} className="mr-1" /> New
                        </Button>
                   </div>
               </div>
            </div>
          </div>
        </Card>

        {/* Bonuses Preview */}
        <Card title="Value Stack (Bonuses)">
          <ul className="space-y-2">
            {asset.bonuses.map((bonus, i) => (
                <li key={i} className="flex items-start gap-2 text-sm text-slate-300">
                    <span className="text-indigo-400 mt-1">✓</span>
                    {bonus}
                </li>
            ))}
          </ul>
        </Card>
      </div>
    </div>
  );
};