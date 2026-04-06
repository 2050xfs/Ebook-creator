# AI Asset Sprint — CLAUDE.md

## What This Project Does
Transforms a single keyword into a complete commercial asset package:
- AI-written Ebook (6 chapters, Markdown)
- AI-generated Cover Art (Imagen 4)
- Value Stack (5 Bonuses + Workbook + OTO)
- PDF and DOCX export

## Stack
- **Frontend**: React 19 + TypeScript + Vite 6 + Tailwind CSS (CDN)
- **AI**: Google GenAI SDK (`@google/genai`) — Gemini 3 Pro + Imagen 4
- **Export**: jsPDF + docx
- **Charts**: Recharts (Admin Dashboard)
- **Tests**: Vitest (jsdom environment)

## Dev Setup
```bash
cp .env.example .env.local
# Add your GEMINI_API_KEY to .env.local
npm install
npm run dev       # http://localhost:3000
npm test          # run tests once
npm run test:watch
```

## Key Files
| File | Purpose |
|------|---------|
| `App.tsx` | Root app, generation pipeline, routing, localStorage library |
| `services/geminiService.ts` | All AI API calls (research, outline, chapters, image, value stack) |
| `components/Editor.tsx` | Post-generation editor, PDF/DOCX export |
| `components/AdminDashboard.tsx` | Usage analytics (mock data) |
| `types.ts` | Shared TypeScript interfaces |

## Environment Variables
| Variable | Description |
|----------|-------------|
| `GEMINI_API_KEY` | Google Gemini API key (required) |

Loaded via `vite.config.ts` → exposed as `process.env.API_KEY` in code.

## Generation Pipeline
1. `performMarketResearch` — pain points + Hormozi offer (Gemini 3 Pro, thinking)
2. `generateTitleAndOutline` — titles + 6-section outline (Gemini 3 Pro)
3. `generateCoverImage` — cover art (Imagen 4)
4. `writeChapter` × N — parallel chapter drafting (Gemini 2.5 Flash)
5. `generateValueStack` — bonuses + workbook + OTO (Gemini 3 Pro, thinking)

## Asset Persistence
Assets auto-save to `localStorage` under key `ai_asset_sprint_library`.
The Library view (book icon, navbar) lists all saved assets and supports deletion.

## Conventions
- Components in `components/`, UI primitives in `components/ui/`
- No prop drilling past 2 levels — state lifted to `App.tsx`
- Tailwind classes only (no CSS modules)
- Functional components + hooks only
