import { callAI } from '@/lib/ai';
import { logger } from '@/lib/logger';

export async function parseJobDescription(content: string) {
    const currentDate = new Date().toISOString().split('T')[0];
    try {
        const prompt = `Extract structured job information from the following job description.
Current Date: ${currentDate}

Return ONLY a JSON object with this schema:
{
  "title": "Job Title (CRITICAL: Be specific, e.g. 'Senior Fullstack Engineer')",
  "company": "Company Name",
  "location": "City, Country or Remote",
  "skills": ["Skill1", "Skill2"],
  "salary": "Salary string or range",
  "salaryMin": number | null,
  "salaryMax": number | null,
  "currency": "USD, EUR, etc.",
  "experienceLevel": "Entry" | "Mid" | "Senior" | "Lead" | "Exec",
  "employmentType": "Full-time" | "Part-time" | "Contract" | "Internship",
  "industry": "e.g. Fintech, Healthcare, Robotics",
  "postedAt": "ISO date string (YYYY-MM-DD)",
  "benefits": ["Benefit1", "Benefit2"],
  "isClosed": boolean,
  "metadata": {
    "isEntryLevel": boolean,
    "isRemoteFriendly": boolean,
    "hasVisaSponsorship": boolean | null
  }
}

CRITICAL: For 'postedAt', if the text says '2 days ago', calculate the date from ${currentDate}. If it says '3 months ago', use a date roughly 90 days back.

Job Description (HTML stripped):
${content.replace(/<[^>]*>?/gm, '').substring(0, 8000)}`;

        const result = await callAI({
            messages: [
                { role: 'system', content: 'You are an elite technical recruiter parsing complex job data. Be precise and identify seniority levels and industries accurately.' },
                { role: 'user', content: prompt }
            ],
            temperature: 0,
            max_tokens: 1500,
        });

        let text = result.content;

        // Extraction logic
        const jsonMatch = text.match(/```(?:json)?\s*([\s\S]*?)```/i);
        if (jsonMatch) {
            text = jsonMatch[1].trim();
        } else {
            const start = text.indexOf('{');
            const end = text.lastIndexOf('}');
            if (start !== -1 && end !== -1) {
                text = text.substring(start, end + 1);
            }
        }

        const parsed = JSON.parse(text);
        
        // Ensure postedAt is a valid Date string or null
        if (parsed.postedAt && isNaN(Date.parse(parsed.postedAt))) {
            parsed.postedAt = null; 
        }

        return parsed;
    } catch (err) {
        logger.error('Failed to parse job description with AI', err);
        return {
            title: 'Unknown Role',
            company: 'Unknown Company',
            location: 'Remote',
            skills: [],
            salary: 'Unknown',
            salaryMin: null,
            salaryMax: null,
            experienceLevel: 'Mid',
            employmentType: 'Full-time',
            postedAt: null,
            isClosed: false,
            metadata: {}
        };
    }
}
