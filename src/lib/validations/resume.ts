import * as z from 'zod';

export const personalSchema = z.object({
    fullName: z.string().min(2, 'Full name must be at least 2 characters'),
    email: z.string().email('Invalid email address'),
    phone: z.string().optional(),
    location: z.string().optional(),
    linkedin: z.string().url('Must be a valid URL').optional().or(z.literal('')),
    github: z.string().url('Must be a valid URL').optional().or(z.literal('')),
    portfolio: z.string().url('Must be a valid URL').optional().or(z.literal('')),
    profileImage: z.string().optional(),
});

export const educationSchema = z.object({
    id: z.string(),
    institution: z.string().min(2, 'Institution name is required'),
    degree: z.string().min(2, 'Degree/Program is required'),
    year: z.string().min(2, 'Year is required'),
    gpa: z.string().optional(),
    coursework: z.string().optional(),
    bullets: z.array(z.string()).optional(), // Add later if needed
});

export const workEntrySchema = z.object({
    id: z.string(),
    company: z.string().min(2, 'Company name is required'),
    jobTitle: z.string().min(2, 'Job title is required'),
    location: z.string().optional(),
    startDate: z.string().min(2, 'Start date is required'),
    endDate: z.string().min(2, 'End date is required'),
    bullets: z.array(z.string().min(10, 'Bullet must contain at least 10 characters')),
});

export const projectSchema = z.object({
    id: z.string(),
    name: z.string().min(2, 'Project name is required'),
    techStack: z.string().min(2, 'Tech stack is required'),
    description: z.string().min(10, 'Description must be at least 10 characters'),
    link: z.string().url('Must be a valid URL').optional().or(z.literal('')),
});

export const resumeSchema = z.object({
    id: z.string().optional(),
    title: z.string().min(2, 'Resume title is required'),
    personal: personalSchema,
    education: z.array(educationSchema),
    experience: z.array(workEntrySchema),
    projects: z.array(projectSchema),
    skills: z.array(z.string()),
    targetRole: z.string().optional(),
    jobDescription: z.string().optional(),
    themeColor: z.string(),
    fontFamily: z.string(),
    style: z.record(z.string(), z.any()).optional(),
    template: z.enum(['modern', 'classic', 'minimal']),
});

export type ResumeFormValues = z.infer<typeof resumeSchema>;
