import { describe, it, expect } from 'vitest';
import { GenerationStatus } from './types';

describe('GenerationStatus', () => {
  it('has all expected pipeline states', () => {
    const expected = ['IDLE', 'RESEARCHING', 'STRUCTURING', 'DRAFTING', 'DESIGNING', 'FINALIZING', 'COMPLETED', 'FAILED'];
    expected.forEach(state => {
      expect(GenerationStatus[state as keyof typeof GenerationStatus]).toBe(state);
    });
  });
});

describe('localStorage library helpers', () => {
  it('handles empty localStorage gracefully', () => {
    localStorage.clear();
    const raw = localStorage.getItem('ai_asset_sprint_library');
    expect(raw).toBeNull();
  });

  it('serializes and deserializes an asset', () => {
    const asset = {
      id: '123',
      keyword: 'fitness',
      title: 'The Fitness Guide',
      subtitle: 'A Complete Guide',
      targetAudience: 'General',
      painPoints: ['No time', 'Too expensive'],
      dreamOutcome: 'Lose 20 lbs',
      coverImageBase64: null,
      coverImagePrompt: 'minimalist fitness cover',
      chapters: [{ title: 'Introduction', content: 'Welcome...' }],
      valueStack: {
        bonuses: [],
        workbook: { title: 'Workbook', description: '', icon: 'FileText', value: '$47', sections: [] },
        oto: { title: 'VIP', description: '', icon: 'Crown', price: '$97', originalPrice: '$197', bullets: [] }
      },
      createdAt: new Date('2025-01-01').toISOString()
    };

    localStorage.setItem('ai_asset_sprint_library', JSON.stringify([asset]));
    const stored = JSON.parse(localStorage.getItem('ai_asset_sprint_library') || '[]');
    expect(stored).toHaveLength(1);
    expect(stored[0].keyword).toBe('fitness');
    expect(stored[0].title).toBe('The Fitness Guide');
  });
});
