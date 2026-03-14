import crypto from 'crypto';

/**
 * Generates a SHA-256 fingerprint for a job posting.
 * Uses title, company, location, and the first 500 characters of the description.
 */
export function generateJobFingerprint(job: {
    title: string;
    company: string;
    location?: string | null;
    description: string;
}): string {
    const normalize = (str?: string | null) => str ? str.trim().toLowerCase().replace(/\s+/g, ' ') : '';
    
    // Normalize core attributes
    const title = normalize(job.title);
    const company = normalize(job.company);
    const location = normalize(job.location);
    
    // Use first 500 chars to catch minor formatting differences while keeping core content
    const descSnippet = normalize(job.description).substring(0, 500);

    const payload = `${title}|${company}|${location}|${descSnippet}`;
    
    return crypto.createHash('sha256').update(payload).digest('hex');
}
