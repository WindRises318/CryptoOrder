import { JournalDetail, JournalListResponse, UpdateJournalNoteRequest } from '../types';

const wait = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

const mockJournals: JournalDetail[] = [
  {
    id: 'j-1',
    symbol: 'BTCUSDT',
    side: 'long',
    entryPrice: 62000,
    exitPrice: 62320,
    qty: 0.12,
    fee: 4.32,
    realizedPnl: 34.08,
    durationSec: 1880,
    mae: -40.5,
    mfe: 88.0,
    status: 'draft',
    createdAt: Date.now() - 3600_000,
    updatedAt: Date.now() - 3600_000,
    note: {
      setupTags: ['breakout'],
      entryReason: '',
      emotion: null,
      executionScore: null,
      lessonsLearned: '',
      planSl: null,
      actualSl: null
    }
  }
];

export async function listJournals(): Promise<JournalListResponse> {
  await wait(120);
  return {
    items: mockJournals,
    page: 1,
    pageSize: 20,
    total: mockJournals.length,
    summary: {
      winRate: 1,
      netPnl: 34.08,
      avgPnl: 34.08,
      maxDrawdown: 0
    }
  };
}

export async function updateJournalNote(id: string, payload: UpdateJournalNoteRequest): Promise<JournalDetail | null> {
  await wait(120);
  const journal = mockJournals.find(x => x.id === id);
  if (!journal) return null;
  journal.note = {
    setupTags: payload.setupTags,
    entryReason: payload.entryReason ?? '',
    emotion: payload.emotion ?? null,
    executionScore: payload.executionScore,
    lessonsLearned: payload.lessonsLearned ?? '',
    planSl: payload.planSl ?? null,
    actualSl: payload.actualSl ?? null
  };
  journal.status = 'completed';
  journal.updatedAt = Date.now();
  return journal;
}
