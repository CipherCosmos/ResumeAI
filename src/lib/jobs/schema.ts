import { z } from 'zod';

export const JobDataSchema = z.object({
    title: z.string().optional().nullable(),
    company: z.string().optional().nullable(),
    skills: z.array(z.string()).optional().default([]),
    salary: z.string().optional().nullable(),
    salaryMin: z.number().optional().nullable(),
    salaryMax: z.number().optional().nullable(),
    location: z.string().optional().nullable(),
    postedAt: z.string().optional().nullable(),
    isClosed: z.boolean().optional().default(false),
    experienceLevel: z.enum(['Junior', 'Entry', 'Mid', 'Senior', 'Lead', 'Executive']).optional().nullable(),
    employmentType: z.enum(['Full-time', 'Part-time', 'Contract', 'Internship', 'Freelance']).optional().nullable(),
});

export type JobData = z.infer<typeof JobDataSchema>;
