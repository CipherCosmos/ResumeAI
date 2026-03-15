import { logger } from '../logger';

export interface CrawlerResult {
    url: string;
    title?: string;
    description?: string;
    markdown?: string;
    json?: any;
    metadata?: any;
}

export interface SearchResult extends CrawlerResult {
    snippet?: string;
}

export interface ScrapeOptions {
    formats?: string[];
    jsonOptions?: { schema: any };
    waitFor?: number;
}

export interface CrawlerProvider {
    name: string;
    search(query: string, limit?: number): Promise<SearchResult[]>;
    scrape(url: string, options?: ScrapeOptions): Promise<CrawlerResult | null>;
    isAvailable(): boolean;
}

// ─── Firecrawl Provider ──────────────────────────────────────────
class FirecrawlProvider implements CrawlerProvider {
    name = 'firecrawl';
    private apiKey = process.env.FIRECRAWL_API;

    isAvailable() { return !!this.apiKey; }

    async search(query: string, limit = 10): Promise<SearchResult[]> {
        if (!this.apiKey) return [];
        try {
            const res = await fetch('https://api.firecrawl.dev/v1/search', {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${this.apiKey}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ query, limit })
            });

            if (res.status === 402) {
                logger.warn('Firecrawl Provider: Credits exhausted (402)');
                return [];
            }

            if (!res.ok) throw new Error(`Firecrawl Search Error: ${res.status}`);
            
            const data = await res.json();
            return (data.data || data.results || []).map((r: any) => ({
                url: r.url || r.link,
                title: r.title,
                snippet: r.snippet
            }));
        } catch (err) {
            logger.error('Firecrawl Search failed', err);
            return [];
        }
    }

    async scrape(url: string, options?: ScrapeOptions): Promise<CrawlerResult | null> {
        if (!this.apiKey) return null;
        try {
            const res = await fetch('https://api.firecrawl.dev/v1/scrape', {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${this.apiKey}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    url,
                    formats: options?.formats || ["markdown"],
                    jsonOptions: options?.jsonOptions,
                    waitFor: options?.waitFor
                })
            });

            if (res.status === 402) {
                logger.warn('Firecrawl Provider: Credits exhausted (402)');
                return null;
            }

            if (!res.ok) throw new Error(`Firecrawl Scrape Error: ${res.status}`);
            
            const data = await res.json();
            return {
                url,
                markdown: data.data?.markdown,
                json: data.data?.json,
                metadata: data.data?.metadata
            };
        } catch (err) {
            logger.error(`Firecrawl Scrape failed for ${url}`, err);
            return null;
        }
    }
}

// ─── Spider Provider (Spider.cloud) ─────────────────────────────
class SpiderProvider implements CrawlerProvider {
    name = 'spider';
    private apiKey = process.env.SPIDER_API_KEY;

    isAvailable() { return !!this.apiKey && this.apiKey !== ""; }

    async search(query: string, limit = 10): Promise<SearchResult[]> {
        if (!this.apiKey) return [];
        try {
            const res = await fetch('https://api.spider.cloud/search', {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${this.apiKey}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ 
                    search: query, 
                    search_limit: limit,
                    fetch_page_content: false // Just get results for now
                })
            });

            if (!res.ok) return [];
            const data = await res.json();
            return (data.results || []).map((r: any) => ({
                url: r.url,
                title: r.title,
                snippet: r.description || r.snippet
            }));
        } catch (err) {
            logger.error('Spider Search failed', err);
            return [];
        }
    }

    async scrape(url: string, options?: ScrapeOptions): Promise<CrawlerResult | null> {
        if (!this.apiKey) return null;
        try {
            const res = await fetch('https://api.spider.cloud/scrape', {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${this.apiKey}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ 
                    url, 
                    return_format: 'markdown',
                    metadata: true
                })
            });

            if (!res.ok) return null;
            const data = await res.json();
            // Spider returns an array of results for batch/crawl, or direct object for scrape
            const content = Array.isArray(data) ? data[0] : data;
            return {
                url,
                markdown: content.content || content.markdown || content.text,
                metadata: content.metadata
            };
        } catch (err) {
            logger.error(`Spider Scrape failed for ${url}`, err);
            return null;
        }
    }
}

// ─── Crawlbase Provider ──────────────────────────────────────────
class CrawlbaseProvider implements CrawlerProvider {
    name = 'crawlbase';
    private apiKey = process.env.CRAWLBASE_API_KEY;

    isAvailable() { return !!this.apiKey && this.apiKey !== ""; }

    async search(query: string, limit = 10): Promise<SearchResult[]> {
        if (!this.apiKey) return [];
        try {
            // Use Google Scraper for search-like behavior
            const apiUrl = `https://api.crawlbase.com/?token=${this.apiKey}&url=${encodeURIComponent(`https://www.google.com/search?q=${encodeURIComponent(query)}`)}&scraper=google-search`;
            const res = await fetch(apiUrl);
            
            if (!res.ok) return [];
            const data = await res.json();
            
            return (data.body?.results || []).slice(0, limit).map((r: any) => ({
                url: r.url || r.link,
                title: r.title,
                snippet: r.description || r.snippet
            }));
        } catch (err) {
            logger.error('Crawlbase Search failed', err);
            return [];
        }
    }

    async scrape(url: string, options?: ScrapeOptions): Promise<CrawlerResult | null> {
        if (!this.apiKey) return null;
        try {
            const apiUrl = `https://api.crawlbase.com/?token=${this.apiKey}&url=${encodeURIComponent(url)}&format=json`;
            const res = await fetch(apiUrl);
            
            if (!res.ok) return null;
            const data = await res.json();
            return {
                url,
                markdown: data.body, // This is raw HTML usually
                metadata: data.metadata
            };
        } catch (err) {
            logger.error(`Crawlbase Scrape failed for ${url}`, err);
            return null;
        }
    }
}

// ─── Scrape.do Provider ──────────────────────────────────────────
class ScrapeDoProvider implements CrawlerProvider {
    name = 'scrapedo';
    private apiKey = process.env.SCRAPEDO_API_KEY;

    isAvailable() { return !!this.apiKey; }

    async search(query: string, limit = 10): Promise<SearchResult[]> {
        return []; // Scrape.do is a direct scraper
    }

    async scrape(url: string, options?: ScrapeOptions): Promise<CrawlerResult | null> {
        if (!this.apiKey) return null;
        try {
            const apiUrl = `https://api.scrape.do/?token=${this.apiKey}&url=${encodeURIComponent(url)}`;
            const res = await fetch(apiUrl);
            
            if (!res.ok) return null;
            const text = await res.text();
            return {
                url,
                markdown: text // Normalizing to markdown via Jina or other might be needed later
            };
        } catch (err) {
            logger.error(`Scrape.do failed for ${url}`, err);
            return null;
        }
    }
}

// ─── Unified Crawler Service ─────────────────────────────────────
export class CrawlerService {
    private static providers: CrawlerProvider[] = [
        new FirecrawlProvider(),
        new SpiderProvider(),
        new CrawlbaseProvider(),
        new ScrapeDoProvider()
    ];

    /**
     * Executes a search query across available providers with failover.
     */
    static async search(query: string, limit = 10): Promise<SearchResult[]> {
        for (const provider of this.providers) {
            if (!provider.isAvailable()) continue;
            
            logger.info(`CrawlerService: Trying search with ${provider.name}...`);
            const results = await provider.search(query, limit);
            
            if (results.length > 0) {
                logger.info(`CrawlerService: Success with ${provider.name} (${results.length} results)`);
                return results;
            }
            
            logger.warn(`CrawlerService: ${provider.name} failed or returned empty. Falling back...`);
        }
        
        logger.error('CrawlerService: All search providers failed.');
        return [];
    }

    /**
     * Scrapes a URL with failover protection.
     */
    static async scrape(url: string, options?: ScrapeOptions): Promise<CrawlerResult | null> {
        for (const provider of this.providers) {
            if (!provider.isAvailable()) continue;
            
            logger.info(`CrawlerService: Trying scrape with ${provider.name} for ${url}...`);
            const result = await provider.scrape(url, options);
            
            if (result && (result.markdown || result.json)) {
                return result;
            }
            
            logger.warn(`CrawlerService: ${provider.name} scrape failed for ${url}. Falling back...`);
        }
        
        return null;
    }
}
