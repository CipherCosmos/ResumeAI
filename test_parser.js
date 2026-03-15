import { parseJobDescription } from './src/lib/jobs/parser.js';

const mockJD = `
# Senior Fullstack Engineer
**Company:** TechNova Solutions
**Location:** Berlin, Germany (Hybrid)
**Employment Type:** Full-time
**Salary:** €80,000 - €110,000 per year

We are looking for an experienced engineer to join our Fintech team. 
Skills: React, Node.js, PostgreSQL, Kubernetes.
Benefits: 30 days vacation, Pension plan, Gym membership.
Posted: 2 days ago.
`;

async function test() {
    console.log('Testing Parser...');
    const result = await parseJobDescription(mockJD);
    console.log('Result:', JSON.stringify(result, null, 2));
}

test();
