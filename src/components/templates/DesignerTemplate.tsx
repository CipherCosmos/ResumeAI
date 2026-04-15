import React from 'react';
import { ResumeData } from '@/types/resume';

export function DesignerTemplate({ data }: { data: ResumeData }) {
  const { personal, summary, experience, education, projects, skills } = data;
  return (
    <div className="resume-paper" style={{ fontFamily: data.fontFamily || 'sans-serif' }}>
      <header className="mb-6 bg-purple-50 p-8 rounded-2xl relative overflow-hidden text-center">
        <div className="absolute top-0 right-0 w-32 h-32 bg-purple-200 rounded-full blur-3xl opacity-50 -mr-10 -mt-10"></div>
        <div className="absolute bottom-0 left-0 w-24 h-24 bg-purple-300 rounded-full blur-2xl opacity-50 -ml-10 -mb-10"></div>
        <img src="/images/templates/designer_accent.png" className="absolute top-0 right-0 w-64 opacity-20 transform -rotate-12 -mt-8 -mr-8 pointer-events-none mix-blend-multiply" alt="" />
        
        <h1 className="text-4xl font-extrabold text-purple-900 mb-2 relative z-10">{personal.fullName}</h1>
        {data.targetRole && <h2 className="text-xl font-medium text-purple-700 relative z-10">{data.targetRole}</h2>}
        <div className="mt-4 flex flex-wrap justify-center gap-4 text-sm font-medium text-purple-800/70 relative z-10">
          {personal.portfolio && <a href={personal.portfolio} className="px-3 py-1 bg-white rounded-full shadow-sm text-purple-900 font-bold border border-purple-100">{personal.portfolio}</a>}
          {personal.email && <span className="px-3 py-1 bg-purple-100/50 rounded-full">{personal.email}</span>}
          {personal.linkedin && <span className="px-3 py-1 bg-purple-100/50 rounded-full">{personal.linkedin.replace(/^https?:\/\/(www\.)?/, '')}</span>}
        </div>
      </header>

      {summary && (
        <section className="mb-8 text-center max-w-2xl mx-auto">
          <p className="text-[0.95em] leading-relaxed text-slate-800 font-medium italic">"{summary}"</p>
        </section>
      )}

      {skills && skills.length > 0 && (
        <section className="mb-10 text-center">
          <div className="flex flex-wrap justify-center gap-2">
            {skills.map((s, i) => <span key={i} className="px-4 py-1.5 bg-slate-900 text-white rounded-full text-[0.8em] font-bold tracking-wide">{s}</span>)}
          </div>
        </section>
      )}

      <div className="grid grid-cols-2 gap-8">
        {experience && experience.length > 0 && (
          <section>
            <h2 className="text-xs font-black uppercase tracking-widest text-slate-400 mb-6 flex items-center gap-3">
              <span className="h-px bg-slate-200 flex-1"></span> Experience
            </h2>
            <div className="flex flex-col gap-6">
              {experience.map(exp => (
                <div key={exp.id}>
                  <div className="text-[0.95em] font-extrabold text-slate-900">{exp.jobTitle}</div>
                  <div className="text-[0.85em] font-bold text-purple-600 mb-2">{exp.company} <span className="text-slate-400 font-medium ml-2">{exp.startDate} - {exp.endDate || 'Present'}</span></div>
                  {exp.bullets && (
                    <ul className="text-[0.85em] text-slate-600 space-y-1.5">
                      {exp.bullets.filter(b => b.trim()).map((b, i) => <li key={i} className="flex gap-2"><span className="text-purple-400 font-bold">»</span> {b}</li>)}
                    </ul>
                  )}
                </div>
              ))}
            </div>
          </section>
        )}

        {education && education.length > 0 && (
          <section>
            <h2 className="text-xs font-black uppercase tracking-widest text-slate-400 mb-6 flex items-center gap-3">
               Education <span className="h-px bg-slate-200 flex-1"></span>
            </h2>
            <div className="flex flex-col gap-5">
              {education.map(edu => (
                <div key={edu.id} className="p-5 border-2 border-slate-100 rounded-xl">
                  <div className="text-[0.9em] font-extrabold text-slate-900">{edu.degree}</div>
                  <div className="text-[0.85em] font-medium text-slate-600 mt-1">{edu.institution}</div>
                  <div className="text-[0.75em] font-bold text-purple-500 mt-3 bg-purple-50 inline-block px-2 py-1 rounded">{edu.year}</div>
                </div>
              ))}
            </div>
          </section>
        )}
      </div>
    </div>
  );
}
