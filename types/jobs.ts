export type TranslationJob = {
  id: number;
  storeHash: string;
  jobType: 'import' | 'export';
  status: 'pending' | 'processing' | 'completed' | 'failed';
  channelId: number;
  locale: string;
  fileUrl: string | null;
  error: string | null;
  createdAt: Date;
  updatedAt: Date;
  metadata?: unknown;
}; 