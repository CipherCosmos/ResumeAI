import React from 'react';
import { ResumeData } from '@/types/resume';

export function CreativeTemplate({ data }: { data: ResumeData }) {
  const { personal, summary, experience, education, projects, skills } = data;
  return (
    <div className="resume-paper flex flex-row bg-cover bg-center" style={{ fontFamily: data.fontFamily || 'sans-serif', backgroundImage: "url('/images/templates/creative_bg.png')" }}>
      <aside className="w-1/3 bg-amber-50/90 p-6 border-r border-amber-200 min-h-full backdrop-blur-[2px]">
        <h1 className="text-3xl font-black text-amber-900 mb-6 leading-tight uppercase tracking-tighter">{personal.fullName.split(' ').map((n, i) => <div key={i}>{n}</div>)}</h1>
        <div className="text-[0.8em] text-amber-800 space-y-2 mb-8 font-medium">
          {personal.location && <div>{personal.location}</div>}
          {personal.phone && <div>{personal.phone}</div>}
          {personal.email && <div className="break-all">{personal.email}</div>}
          {personal.portfolio && <div className="break-all font-bold text-amber-900">{personal.portfolio}</div>}
        </div>
        
        {skills && skills.length > 0 && (
          <div className="mb-8">
            <h2 className="text-[0.8em] font-bold uppercase text-amber-900 border-b-2 border-amber-300 pb-1 mb-3">Expertise</h2>
            <div className="flex flex-col gap-1.5 text-[0.8em] text-amber-800">
              {skills.map((s, i) => <span key={i} className="font-semibold">{s}</span>)}
            </div>
          </div>
        )}

        {education && education.length > 0 && (
          <div>
            <h2 className="text-[0.8em] font-bold uppercase text-amber-900 border-b-2 border-amber-300 pb-1 mb-3">Education</h2>
            <div className="flex flex-col gap-4 text-[0.8em] text-amber-800">
              {education.map(edu => (
                <div key={edu.id}>
                  <div className="font-bold text-amber-900">{edu.degree}</div>
                  <div>{edu.institution}</div>
                  <div className="opacity-70 mt-0.5">{edu.year}</div>
                </div>
              ))}
            </div>
          </div>
        )}
      </aside>

      <main className="w-2/3 p-6 bg-white/90 shrink-0 min-h-full backdrop-blur-[2px]">
        {summary && (
          <section className="mb-8">
            <h2 className="text-[0.9em] font-black uppercase tracking-wider text-slate-900 mb-2">Profile</h2>
            <p className="text-[0.85em] leading-relaxed text-slate-700 font-medium">{summary}</p>
          </section>
        )}

        {experience && experience.length > 0 && (
          <section className="mb-8">
            <h2 className="text-[0.9em] font-black uppercase tracking-wider text-slate-900 mb-4">Experience</h2>
            <div className="flex flex-col gap-6">
              {experience.map(exp => (
                <div key={exp.id}>
                  <div className="flex justify-between items-baseline mb-1">
                    <h3 className="text-[1em] font-black text-slate-900">{exp.jobTitle}</h3>
                    <span className="text-[0.75em] font-bold text-amber-600 bg-amber-100 px-2 py-0.5 rounded-full">{exp.startDate} - {exp.endDate || 'Present'}</span>
                  </div>
                  <div className="text-[0.85em] font-bold text-slate-500 mb-2">{exp.company}{exp.location && `, ${exp.location}`}</div>
                  {exp.bullets && (
                    <ul className="list-disc pl-4 text-[0.85em] text-slate-700 space-y-1">
                      {exp.bullets.filter(b => b.trim()).map((b, i) => <li key={i}>{b}</li>)}
                    </ul>
                  )}
                </div>
              ))}
            </div>
          </section>
        )}
      </main>
    </div>
  );
}
