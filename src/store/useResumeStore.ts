import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import {
    ResumeData,
    emptyResumeData,
    WorkEntry,
    ProjectEntry,
    EducationEntry,
    createWorkEntry,
    createProjectEntry,
    createEducationEntry,
} from '@/types/resume';

interface ResumeState {
    data: ResumeData;
    step: number;
    currentResumeId: string | null;

    // Actions
    setStep: (step: number) => void;
    setCurrentResumeId: (id: string | null) => void;
    updatePersonal: (field: keyof ResumeData['personal'], value: string) => void;
    updateField: <K extends keyof ResumeData>(field: K, value: ResumeData[K]) => void;

    // Array management
    addChip: (field: 'skills' | 'certifications' | 'languages', value: string) => void;
    removeChip: (field: 'skills' | 'certifications' | 'languages', idx: number) => void;

    // Entries
    addWorkEntry: () => void;
    removeWorkEntry: (id: string) => void;
    updateWork: (id: string, field: keyof WorkEntry, value: string | string[]) => void;
    addBullet: (entryId: string) => void;
    updateBullet: (entryId: string, bulletIdx: number, value: string) => void;
    removeBullet: (entryId: string, bulletIdx: number) => void;

    addProject: () => void;
    removeProject: (id: string) => void;
    updateProject: (id: string, field: keyof ProjectEntry, value: string) => void;

    addEducation: () => void;
    removeEducation: (id: string) => void;
    updateEducation: (id: string, field: keyof EducationEntry, value: string) => void;

    // Bulk update (e.g., from parse)
    setResumeData: (data: Partial<ResumeData>) => void;
    resetForm: () => void;

    // Element Sorting
    moveWorkEntry: (id: string, direction: 'up' | 'down') => void;
    moveProject: (id: string, direction: 'up' | 'down') => void;
    moveEducation: (id: string, direction: 'up' | 'down') => void;
}

export const useResumeStore = create<ResumeState>()(
    persist(
        (set) => ({
            data: emptyResumeData,
            step: 0,
            currentResumeId: null,

            setStep: (step) => set({ step }),
            setCurrentResumeId: (id) => set({ currentResumeId: id }),

            updatePersonal: (field, value) =>
                set((state) => ({
                    data: {
                        ...state.data,
                        personal: { ...state.data.personal, [field]: value },
                    },
                })),

            updateField: (field, value) =>
                set((state) => ({
                    data: { ...state.data, [field]: value },
                })),

            addChip: (field, value) =>
                set((state) => {
                    const arr = state.data[field] as string[];
                    if (!value.trim() || arr.some((s) => s.toLowerCase() === value.trim().toLowerCase())) {
                        return state;
                    }
                    return { data: { ...state.data, [field]: [...arr, value.trim()] } };
                }),

            removeChip: (field, idx) =>
                set((state) => {
                    const arr = state.data[field] as string[];
                    return { data: { ...state.data, [field]: arr.filter((_, i) => i !== idx) } };
                }),

            // Work Experience
            addWorkEntry: () =>
                set((state) => ({
                    data: { ...state.data, experience: [...state.data.experience, createWorkEntry()] },
                })),

            removeWorkEntry: (id) =>
                set((state) => ({
                    data: { ...state.data, experience: state.data.experience.filter((e) => e.id !== id) },
                })),

            updateWork: (id, field, value) =>
                set((state) => ({
                    data: {
                        ...state.data,
                        experience: state.data.experience.map((e) =>
                            e.id === id ? { ...e, [field]: value } : e
                        ),
                    },
                })),

            addBullet: (entryId) =>
                set((state) => ({
                    data: {
                        ...state.data,
                        experience: state.data.experience.map((e) =>
                            e.id === entryId ? { ...e, bullets: [...e.bullets, ''] } : e
                        ),
                    },
                })),

            updateBullet: (entryId, bulletIdx, value) =>
                set((state) => ({
                    data: {
                        ...state.data,
                        experience: state.data.experience.map((e) =>
                            e.id === entryId
                                ? { ...e, bullets: e.bullets.map((b, i) => (i === bulletIdx ? value : b)) }
                                : e
                        ),
                    },
                })),

            removeBullet: (entryId, bulletIdx) =>
                set((state) => ({
                    data: {
                        ...state.data,
                        experience: state.data.experience.map((e) =>
                            e.id === entryId
                                ? { ...e, bullets: e.bullets.filter((_, i) => i !== bulletIdx) }
                                : e
                        ),
                    },
                })),

            // Projects
            addProject: () =>
                set((state) => ({
                    data: { ...state.data, projects: [...state.data.projects, createProjectEntry()] },
                })),

            removeProject: (id) =>
                set((state) => ({
                    data: { ...state.data, projects: state.data.projects.filter((p) => p.id !== id) },
                })),

            updateProject: (id, field, value) =>
                set((state) => ({
                    data: {
                        ...state.data,
                        projects: state.data.projects.map((p) =>
                            p.id === id ? { ...p, [field]: value } : p
                        ),
                    },
                })),

            // Education
            addEducation: () =>
                set((state) => ({
                    data: { ...state.data, education: [...state.data.education, createEducationEntry()] },
                })),

            removeEducation: (id) =>
                set((state) => ({
                    data: { ...state.data, education: state.data.education.filter((e) => e.id !== id) },
                })),

            updateEducation: (id, field, value) =>
                set((state) => ({
                    data: {
                        ...state.data,
                        education: state.data.education.map((e) =>
                            e.id === id ? { ...e, [field]: value } : e
                        ),
                    },
                })),

            setResumeData: (newData) =>
                set((state) => ({
                    data: { ...state.data, ...newData },
                })),

            moveWorkEntry: (id, direction) => set((state) => {
                const arr = [...state.data.experience];
                const index = arr.findIndex((x) => x.id === id);
                if ((direction === 'up' && index === 0) || (direction === 'down' && index === arr.length - 1) || index === -1) return state;
                const newIndex = direction === 'up' ? index - 1 : index + 1;
                [arr[index], arr[newIndex]] = [arr[newIndex], arr[index]];
                return { data: { ...state.data, experience: arr } };
            }),

            moveProject: (id, direction) => set((state) => {
                const arr = [...state.data.projects];
                const index = arr.findIndex((x) => x.id === id);
                if ((direction === 'up' && index === 0) || (direction === 'down' && index === arr.length - 1) || index === -1) return state;
                const newIndex = direction === 'up' ? index - 1 : index + 1;
                [arr[index], arr[newIndex]] = [arr[newIndex], arr[index]];
                return { data: { ...state.data, projects: arr } };
            }),

            moveEducation: (id, direction) => set((state) => {
                const arr = [...state.data.education];
                const index = arr.findIndex((x) => x.id === id);
                if ((direction === 'up' && index === 0) || (direction === 'down' && index === arr.length - 1) || index === -1) return state;
                const newIndex = direction === 'up' ? index - 1 : index + 1;
                [arr[index], arr[newIndex]] = [arr[newIndex], arr[index]];
                return { data: { ...state.data, education: arr } };
            }),

            resetForm: () => set({ data: emptyResumeData, step: 0 }),
        }),
        {
            name: 'resume-storage', // saves to localStorage
        }
    )
);
