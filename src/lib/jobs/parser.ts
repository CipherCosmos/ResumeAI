import { callAI } from '@/lib/ai';
import { logger } from '@/lib/logger';

export async function parseJobDescription(content: string) {
    const currentDate = new Date().toISOString().split('T')[0];
    try {
        const prompt = `Extract structured job information from the following job description.
Current Date: ${currentDate}

Return ONLY a JSON object with this schema:
{
  "title": "Job Title",
  "company": "Company Name",
  "location": "City, Country or Remote",
  "skills": ["Skill1", "Skill2"],
  "salary": "Salary string or range",
  "salaryMin": number | null,
  "salaryMax": number | null,
  "experienceLevel": "Junior" | "Entry" | "Mid" | "Senior" | "Lead" | "Executive",
  "employmentType": "Full-time" | "Part-time" | "Contract" | "Internship",
  "postedAt": "YYYY-MM-DD or relative description like '2 days ago'",
  "isClosed": boolean (true if the text mentions job is closed, filled, or no longer accepting applications)
}

Job Description:
${content.substring(0, 6000)}`;

        const result = await callAI({
            messages: [
                { role: 'system', content: 'You are an expert technical recruiter parsing job descriptions.' },
                { role: 'user', content: prompt }
            ],
            temperature: 0,
            max_tokens: 1000,
        });

        let text = result.content;

        // More robust JSON extraction
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

        return JSON.parse(text);
    } catch (err) {
        logger.error('Failed to parse job description with AI', err);
        // Fallback
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
            isClosed: false
        };
    }
}
