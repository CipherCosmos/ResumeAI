import { NextResponse } from 'next/server';
import { CrawlerService } from '@/lib/jobs/crawler';
import { updateMarketDemandStats } from '@/lib/jobs/skill-gap';

export async function POST(req: Request) {
    try {
        const authHeader = req.headers.get('Authorization');
        if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const results = await CrawlerService.search('software engineer jobs', 10);
        await updateMarketDemandStats();

        return NextResponse.json({ success: true, count: results.length });
    } catch (err) {
        console.error('Crawl error:', err);
        return NextResponse.json({ error: 'Failed' }, { status: 500 });
    }
}
