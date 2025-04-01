import { NextRequest, NextResponse } from 'next/server';
import { dbClient } from '@/lib/db';
import { getSessionFromContext } from '@/lib/auth';

export async function GET(req: NextRequest, { params }: { params: Promise<{ jobId: string }> }) {
  const { jobId } = await params;
  const { searchParams } = req.nextUrl;
  const context = searchParams.get('context');

  if (!context) {
    return NextResponse.json({ error: 'Context is required' }, { status: 400 });
  }

  try {
    const { storeHash } = await getSessionFromContext(context);
    const errors = await dbClient.getTranslationErrors(Number(jobId), storeHash);
    return NextResponse.json({ errors });
  } catch (error) {
    console.error('Error fetching translation errors:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
} 