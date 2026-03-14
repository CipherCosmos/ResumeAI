import { generateJobFingerprint } from './dedup';

describe('Job Deduplication', () => {
    it('generates consistent fingerprints for identical jobs', () => {
        const job = {
            title: 'Senior Engineer',
            company: 'TechCorp ',
            location: ' Remote',
            description: 'We are looking for a senior engineer with 5 years of nextjs experience.          Enjoy our benefits.',
        };
        
        const hash1 = generateJobFingerprint(job);
        const hash2 = generateJobFingerprint(job);
        
        expect(hash1).toEqual(hash2);
    });

    it('generates same fingerprint despite minor whitespace changes', () => {
        const job1 = {
            title: 'Senior Engineer',
            company: 'TechCorp',
            location: 'Remote',
            description: 'We are looking for a senior engineer   with 5 years of nextjs experience.\n Enjoy our benefits.',
        };
        const job2 = {
            title: 'Senior Engineer',
            company: ' TechCorp ',
            location: 'Remote',
            description: 'We are looking for a senior engineer with 5 years of nextjs experience. Enjoy our benefits.',
        };
        
        expect(generateJobFingerprint(job1)).toEqual(generateJobFingerprint(job2));
    });

    it('generates different fingerprints for different companies', () => {
        const base = {
            title: 'Engineer',
            location: 'Remote',
            description: 'Same role.',
        };
        
        expect(generateJobFingerprint({ ...base, company: 'A' }))
            .not.toEqual(generateJobFingerprint({ ...base, company: 'B' }));
    });
});
