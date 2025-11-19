
import React, { useState } from 'react';
import { AssetPackage, AspectRatio } from '../types';
import { Button } from './ui/Button';
import { Card } from './ui/Card';
import { Download, Sparkles, RefreshCw, Type, FileText, FileType, Gift, Crown, BookOpen } from 'lucide-react';
import { editImageWithPrompt, quickTitleBrainstorm, generateCoverImage } from '../services/geminiService';
import { jsPDF, GState } from "jspdf";
import { Document, Packer, Paragraph, TextRun, ImageRun, HeadingLevel, AlignmentType, PageBreak, Header, Footer, PageNumber } from "docx";

interface EditorProps {
  asset: AssetPackage;
  onUpdate: (updatedAsset: AssetPackage) => void;
}

export const Editor: React.FC<EditorProps> = ({ asset, onUpdate }) => {
  const [activeChapter, setActiveChapter] = useState<number>(0);
  const [isEditingImage, setIsEditingImage] = useState(false);
  const [imagePrompt, setImagePrompt] = useState('');
  const [isRegeneratingTitle, setIsRegeneratingTitle] = useState(false);
  const [isExporting, setIsExporting] = useState(false);
  const [aspectRatio, setAspectRatio] = useState<AspectRatio>('3:4');
  const [activeTab, setActiveTab] = useState<'content' | 'commercial'>('content');
  
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

  const base64ToUint8Array = (base64: string) => {
    const binaryString = window.atob(base64.split(',')[1]);
    const len = binaryString.length;
    const bytes = new Uint8Array(len);
    for (let i = 0; i < len; i++) {
      bytes[i] = binaryString.charCodeAt(i);
    }
    return bytes;
  };

  const getImageType = (base64: string) => {
      if (base64.startsWith('data:image/png')) return 'PNG';
      return 'JPEG';
  };

  const handleExportDOCX = async () => {
    setIsExporting(true);
    try {
        const children: any[] = [];

        // 1. Cover Page
        if (asset.coverImageBase64) {
             try {
                const imageBytes = base64ToUint8Array(asset.coverImageBase64);
                children.push(new Paragraph({
                    children: [
                        new ImageRun({
                            data: imageBytes,
                            transformation: { width: 500, height: 660 }, 
                            type: getImageType(asset.coverImageBase64) === 'PNG' ? 'png' : 'jpg'
                        })
                    ],
                    alignment: AlignmentType.CENTER
                }));
             } catch (e) {
                 console.warn("Could not add image to DOCX", e);
             }
        }

        children.push(new Paragraph({ children: [new PageBreak()] }));

        // 2. Title Page / Offer Info
        children.push(new Paragraph({
            text: asset.title,
            heading: HeadingLevel.TITLE,
            alignment: AlignmentType.CENTER,
            spacing: { before: 400, after: 200 }
        }));

        children.push(new Paragraph({
            text: asset.subtitle || "",
            heading: HeadingLevel.HEADING_2,
            alignment: AlignmentType.CENTER,
            spacing: { after: 800 }
        }));

        // Dream Outcome
        if (asset.dreamOutcome) {
             children.push(new Paragraph({
                text: "Dream Outcome: " + asset.dreamOutcome,
                heading: HeadingLevel.HEADING_3,
                spacing: { after: 400 }
             }));
        }

        children.push(new Paragraph({ children: [new PageBreak()] }));

        // 3. Chapters
        asset.chapters.forEach((chapter) => {
            children.push(new Paragraph({
                text: chapter.title,
                heading: HeadingLevel.HEADING_1,
                spacing: { before: 400, after: 200 }
            }));

            const lines = chapter.content.split('\n');
            lines.forEach(line => {
                const trimmed = line.trim();
                if (!trimmed) return;

                if (trimmed.startsWith('## ')) {
                    children.push(new Paragraph({
                        text: trimmed.replace(/^##\s+/, ''),
                        heading: HeadingLevel.HEADING_2,
                        spacing: { before: 200, after: 100 }
                    }));
                } else if (trimmed.startsWith('- ') || trimmed.startsWith('* ')) {
                    children.push(new Paragraph({
                        text: trimmed.replace(/^[-*]\s+/, ''),
                        bullet: { level: 0 }
                    }));
                } else {
                     children.push(new Paragraph({
                        text: trimmed.replace(/\*\*/g, ''),
                        spacing: { after: 120 }
                    }));
                }
            });
            
            children.push(new Paragraph({ children: [new PageBreak()] }));
        });

        // 4. Commercial Assets (Value Stack)
        children.push(new Paragraph({ text: "COMMERCIAL VALUE STACK", heading: HeadingLevel.HEADING_1, alignment: AlignmentType.CENTER }));
        children.push(new Paragraph({ children: [new PageBreak()] }));

        // Workbook
        children.push(new Paragraph({ text: "Workbook: " + asset.valueStack.workbook.title, heading: HeadingLevel.HEADING_2 }));
        children.push(new Paragraph({ text: asset.valueStack.workbook.description }));
        children.push(new Paragraph({ text: "Valued at: " + asset.valueStack.workbook.value, spacing: { after: 200 } }));
        asset.valueStack.workbook.sections.forEach(section => {
             children.push(new Paragraph({ text: section, bullet: { level: 0 } }));
        });
        children.push(new Paragraph({ spacing: { after: 400 } }));

        // Bonuses
        children.push(new Paragraph({ text: "Exclusive Bonuses", heading: HeadingLevel.HEADING_2 }));
        asset.valueStack.bonuses.forEach(bonus => {
             children.push(new Paragraph({ text: bonus.title + " (" + bonus.value + ")", heading: HeadingLevel.HEADING_3 }));
             children.push(new Paragraph({ text: bonus.description, spacing: { after: 200 } }));
        });

        // OTO
        children.push(new Paragraph({ children: [new PageBreak()] }));
        children.push(new Paragraph({ text: "One-Time Offer (OTO): " + asset.valueStack.oto.title, heading: HeadingLevel.HEADING_1 }));
        children.push(new Paragraph({ text: asset.valueStack.oto.description, spacing: { after: 200 } }));
        children.push(new Paragraph({ text: "Price: " + asset.valueStack.oto.price + " (Regular: " + asset.valueStack.oto.originalPrice + ")", spacing: { after: 200 } }));
        asset.valueStack.oto.bullets.forEach(bullet => {
             children.push(new Paragraph({ text: bullet, bullet: { level: 0 } }));
        });

        // Document Export
        const doc = new Document({
            sections: [{
                properties: {},
                children: children,
                headers: {
                    default: new Header({
                        children: [new Paragraph({ 
                            children: [new TextRun({ text: asset.title, size: 18, color: "888888" })],
                            alignment: AlignmentType.RIGHT
                        })]
                    })
                },
                footers: {
                    default: new Footer({
                        children: [new Paragraph({ 
                            children: [new TextRun({ children: ["Page ", PageNumber.CURRENT] })],
                            alignment: AlignmentType.CENTER
                         })]
                    })
                }
            }]
        });

        const blob = await Packer.toBlob(doc);
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = `${asset.keyword.replace(/[^a-z0-9]/gi, '_')}_package.docx`;
        a.click();
        window.URL.revokeObjectURL(url);

    } catch (e) {
        console.error("DOCX Export Error", e);
        alert("DOCX Export failed");
    } finally {
        setIsExporting(false);
    }
  };

  const handleExportPDF = async () => {
    setIsExporting(true);
    try {
      const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });
      const pageWidth = doc.internal.pageSize.getWidth();
      const pageHeight = doc.internal.pageSize.getHeight();
      const margin = 20;
      const contentWidth = pageWidth - (margin * 2);

      // --- PAGE 1: COVER ---
      if (asset.coverImageBase64) {
        try {
          const format = getImageType(asset.coverImageBase64);
          doc.addImage(asset.coverImageBase64, format, 0, 0, pageWidth, pageHeight);
          doc.setFillColor(0, 0, 0);
          doc.setGState(new GState({ opacity: 0.5 }));
          doc.rect(0, 0, pageWidth, pageHeight, 'F');
          doc.setGState(new GState({ opacity: 1 }));
        } catch (e) { console.warn("Image error", e); }
      } else {
        doc.setFillColor(23, 32, 51);
        doc.rect(0, 0, pageWidth, pageHeight, 'F');
      }

      doc.setTextColor(255, 255, 255);
      doc.setFont("helvetica", "bold");
      doc.setFontSize(32);
      const titleLines = doc.splitTextToSize(asset.title, pageWidth - 40);
      doc.text(titleLines, pageWidth / 2, pageHeight / 2 - 20, { align: 'center' });

      doc.setFont("helvetica", "normal");
      doc.setFontSize(16);
      doc.text(asset.subtitle || "", pageWidth / 2, pageHeight / 2 + 20, { align: 'center' });
      
      // --- CONTENT PAGES ---
      let pageNumber = 2;
      const addPageDecorations = (pageNum: number) => {
        doc.setDrawColor(200, 200, 200);
        doc.setLineWidth(0.1);
        doc.setFont("helvetica", "normal");
        doc.setFontSize(9);
        doc.setTextColor(150, 150, 150);
        doc.text(asset.title.substring(0, 50), margin, 15);
        doc.line(margin, 18, pageWidth - margin, 18);
        doc.text(`Page ${pageNum}`, pageWidth / 2, pageHeight - 10, { align: 'center' });
      };

      for (const chapter of asset.chapters) {
        doc.addPage();
        addPageDecorations(pageNumber++);
        let cursorY = 40;

        doc.setFont("helvetica", "bold");
        doc.setFontSize(22);
        doc.setTextColor(0, 0, 0);
        doc.text(chapter.title, margin, cursorY);
        cursorY += 15;

        const cleanContent = chapter.content.replace(/#{1,6}\s/g, '').replace(/\*\*/g, '').replace(/\*/g, '- ');
        doc.setFont("helvetica", "normal");
        doc.setFontSize(11);
        doc.setTextColor(40, 40, 40);
        
        const splitText = doc.splitTextToSize(cleanContent, contentWidth);
        for (let i = 0; i < splitText.length; i++) {
          if (cursorY > pageHeight - margin - 10) {
            doc.addPage();
            addPageDecorations(pageNumber++);
            cursorY = 30;
          }
          doc.text(splitText[i], margin, cursorY);
          cursorY += 6;
        }
      }

      // --- VALUE STACK PAGES ---
      doc.addPage();
      addPageDecorations(pageNumber++);
      doc.setFont("helvetica", "bold");
      doc.setFontSize(24);
      doc.setTextColor(0, 0, 0);
      doc.text("The Value Stack", margin, 40);
      
      let y = 60;

      // Workbook
      doc.setFontSize(16);
      doc.text(`Workbook: ${asset.valueStack.workbook.title}`, margin, y);
      y += 10;
      doc.setFontSize(12);
      doc.setFont("helvetica", "normal");
      doc.text(asset.valueStack.workbook.description, margin, y);
      y += 15;
      doc.setFont("helvetica", "bold");
      doc.text(`Valued at: ${asset.valueStack.workbook.value}`, margin, y);
      y += 15;

      // Bonuses
      doc.setFontSize(16);
      doc.text("Bonuses:", margin, y);
      y += 10;
      asset.valueStack.bonuses.forEach(b => {
          doc.setFontSize(12);
          doc.setFont("helvetica", "bold");
          doc.text(`• ${b.title} (${b.value})`, margin + 5, y);
          y += 7;
          doc.setFont("helvetica", "normal");
          doc.setFontSize(10);
          doc.text(b.description, margin + 10, y);
          y += 10;
      });

      // OTO
      y += 10;
      doc.setDrawColor(99, 102, 241);
      doc.setLineWidth(1);
      doc.rect(margin, y, contentWidth, 60);
      doc.setFontSize(14);
      doc.setFont("helvetica", "bold");
      doc.text(`OTO: ${asset.valueStack.oto.title}`, margin + 5, y + 10);
      doc.setFontSize(12);
      doc.text(`Price: ${asset.valueStack.oto.price}`, margin + 5, y + 20);
      doc.setFont("helvetica", "normal");
      doc.text(asset.valueStack.oto.description, margin + 5, y + 30);

      doc.save(`${asset.keyword}_full_package.pdf`);

    } catch (error) {
      console.error("PDF Generation failed", error);
      alert("PDF Error");
    } finally {
      setIsExporting(false);
    }
  };

  return (
    <div className="flex h-[calc(100vh-80px)] gap-4 p-4">
      {/* Left: Content Editor */}
      <div className="w-3/5 flex flex-col gap-4">
        <Card className="flex-1 flex flex-col h-full overflow-hidden">
          <div className="flex justify-between items-center mb-4 pb-4 border-b border-slate-800">
            <div className="flex items-center gap-2">
              <Type className="text-indigo-400" size={20} />
              <h2 className="text-xl font-bold text-white outline-none focus:border-b border-indigo-500" contentEditable 
                onBlur={(e) => onUpdate({...asset, title: e.currentTarget.textContent || asset.title})}
              >
                {asset.title}
              </h2>
              <button onClick={handleMagicTitle} disabled={isRegeneratingTitle} className="p-1 hover:bg-slate-800 rounded-full text-yellow-400 transition-colors">
                <Sparkles size={16} className={isRegeneratingTitle ? "animate-spin" : ""} />
              </button>
            </div>
            <div className="flex gap-2">
               <Button variant="secondary" size="sm" onClick={handleExportDOCX} isLoading={isExporting} className="border-indigo-500/30 hover:bg-indigo-900/20 text-indigo-200">
                 <FileType size={16} className="mr-2" /> DOCX
               </Button>
               <Button variant="primary" size="sm" onClick={handleExportPDF} isLoading={isExporting} className="bg-indigo-600 hover:bg-indigo-500">
                 <FileText size={16} className="mr-2" /> PDF
               </Button>
            </div>
          </div>

          {/* Tabs */}
          <div className="flex gap-4 mb-4 border-b border-slate-800">
              <button 
                onClick={() => setActiveTab('content')}
                className={`pb-2 text-sm font-medium transition-colors ${activeTab === 'content' ? 'text-indigo-400 border-b-2 border-indigo-400' : 'text-slate-400 hover:text-white'}`}
              >
                  Ebook Content
              </button>
              <button 
                onClick={() => setActiveTab('commercial')}
                className={`pb-2 text-sm font-medium transition-colors ${activeTab === 'commercial' ? 'text-indigo-400 border-b-2 border-indigo-400' : 'text-slate-400 hover:text-white'}`}
              >
                  Commercial Assets
              </button>
          </div>

          {activeTab === 'content' ? (
             <>
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
             </>
          ) : (
             <div className="flex-1 overflow-y-auto space-y-6 pr-2">
                 {/* OTO Section */}
                 <div className="bg-slate-950/50 p-4 rounded-lg border border-yellow-500/20">
                    <div className="flex items-center gap-2 mb-3 text-yellow-400">
                        <Crown size={20} />
                        <h3 className="font-bold">One-Time Offer (OTO)</h3>
                    </div>
                    <div className="space-y-2">
                        <input className="w-full bg-slate-900 border border-slate-800 rounded p-2 text-white text-sm" value={asset.valueStack.oto.title} onChange={(e) => {
                             const newVal = {...asset.valueStack, oto: {...asset.valueStack.oto, title: e.target.value}};
                             onUpdate({...asset, valueStack: newVal});
                        }} />
                        <textarea className="w-full bg-slate-900 border border-slate-800 rounded p-2 text-slate-300 text-sm h-20" value={asset.valueStack.oto.description} onChange={(e) => {
                             const newVal = {...asset.valueStack, oto: {...asset.valueStack.oto, description: e.target.value}};
                             onUpdate({...asset, valueStack: newVal});
                        }} />
                        <div className="flex justify-between text-sm">
                            <span className="text-slate-400">Price: {asset.valueStack.oto.price}</span>
                            <span className="text-slate-500 line-through">{asset.valueStack.oto.originalPrice}</span>
                        </div>
                    </div>
                 </div>

                 {/* Workbook Section */}
                 <div className="bg-slate-950/50 p-4 rounded-lg border border-blue-500/20">
                    <div className="flex items-center gap-2 mb-3 text-blue-400">
                        <BookOpen size={20} />
                        <h3 className="font-bold">Workbook</h3>
                    </div>
                    <div className="space-y-2">
                         <input className="w-full bg-slate-900 border border-slate-800 rounded p-2 text-white text-sm" value={asset.valueStack.workbook.title} onChange={(e) => {
                             const newVal = {...asset.valueStack, workbook: {...asset.valueStack.workbook, title: e.target.value}};
                             onUpdate({...asset, valueStack: newVal});
                        }} />
                         <p className="text-xs text-slate-500">Includes {asset.valueStack.workbook.sections.length} actionable sections.</p>
                    </div>
                 </div>
             </div>
          )}
        </Card>
      </div>

      {/* Right: Preview & Media */}
      <div className="w-2/5 flex flex-col gap-4 overflow-y-auto">
        {/* Cover Image Editor */}
        <Card title="Cover Asset" className="shrink-0">
          <div className="relative group rounded-lg overflow-hidden border border-slate-700 bg-slate-950 aspect-[3/4] max-h-80 mx-auto">
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

        {/* Bonuses Preview List */}
        <Card title="Included Bonuses">
          <div className="space-y-3">
            {asset.valueStack.bonuses.map((bonus, i) => (
                <div key={i} className="flex items-start gap-3 p-2 rounded bg-slate-800/30 border border-slate-800">
                    <div className="bg-indigo-500/20 p-1.5 rounded text-indigo-400">
                        <Gift size={16} />
                    </div>
                    <div>
                        <p className="text-sm font-medium text-white">{bonus.title}</p>
                        <p className="text-xs text-slate-400">{bonus.description.substring(0, 60)}...</p>
                        <p className="text-xs text-emerald-400 mt-1">Value: {bonus.value}</p>
                    </div>
                </div>
            ))}
          </div>
        </Card>
      </div>
    </div>
  );
};
