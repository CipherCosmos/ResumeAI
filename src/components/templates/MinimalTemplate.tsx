import React from 'react';
import { ResumeData } from '@/types/resume';

interface TemplateProps {
  data: ResumeData;
}

export function MinimalTemplate({ data }: TemplateProps) {
  const { personal, summary, experience, education, projects, skills, certifications, languages } = data;

  return (
    <div className="resume-paper template-minimal font-mono text-slate-900 bg-white">
      <header className="mb-6">
        <h1 className="text-2xl font-black uppercase tracking-tight mb-1 border-b-2 border-black pb-1">{personal.fullName}</h1>
        {data.targetRole && (
          <h2 className="text-[1.1rem] font-bold tracking-widest uppercase mb-3 text-slate-700">{data.targetRole}</h2>
        )}
        <div className="text-[0.8em] font-medium flex flex-wrap gap-x-3 gap-y-1">
          {personal.email && <span>{personal.email}</span>}
          {personal.phone && <span>{personal.phone}</span>}
          {personal.location && <span>{personal.location}</span>}
          {personal.linkedin && <span>{personal.linkedin.replace(/^https?:\/\/(www\.)?/, '')}</span>}
          {personal.github && <span>{personal.github.replace(/^https?:\/\/(www\.)?/, '')}</span>}
          {personal.portfolio && <span>{personal.portfolio.replace(/^https?:\/\/(www\.)?/, '')}</span>}
        </div>
      </header>

      {summary && (
        <section className="mb-5">
          <h2 className="text-[0.85em] font-black uppercase tracking-widest bg-black text-white px-2 py-0.5 inline-block mb-2">Summary</h2>
          <p className="text-[0.85em] leading-snug">{summary}</p>
        </section>
      )}

      {skills && skills.length > 0 && (
        <section className="mb-5">
          <h2 className="text-[0.85em] font-black uppercase tracking-widest bg-black text-white px-2 py-0.5 inline-block mb-2">Skills</h2>
          <p className="text-[0.85em] leading-snug font-medium">{skills.join(', ')}</p>
        </section>
      )}

      {experience && experience.length > 0 && (
        <section className="mb-5">
          <h2 className="text-[0.85em] font-black uppercase tracking-widest bg-black text-white px-2 py-0.5 inline-block mb-3">Experience</h2>
          <div className="flex flex-col gap-4">
            {experience.map(exp => (
              <div key={exp.id}>
                <div className="flex justify-between items-baseline border-b border-slate-200 mb-1 pb-0.5">
                  <h3 className="text-[0.9em] font-bold">
                    {exp.jobTitle} <span className="font-normal mx-1">@</span> {exp.company}
                  </h3>
                  <span className="text-[0.8em]">{exp.startDate} - {exp.endDate || 'Present'}</span>
                </div>
                {exp.bullets && exp.bullets.length > 0 && (
                  <ul className="list-square pl-4 text-[0.85em] space-y-1 mt-1">
                    {exp.bullets.filter(b => b.trim()).map((bullet, i) => (
                      <li key={i}>{bullet}</li>
                    ))}
                  </ul>
                )}
              </div>
            ))}
          </div>
        </section>
      )}

      {projects && projects.length > 0 && (
        <section className="mb-5">
          <h2 className="text-[0.85em] font-black uppercase tracking-widest bg-black text-white px-2 py-0.5 inline-block mb-3">Projects</h2>
          <div className="flex flex-col gap-4">
            {projects.map(proj => (
              <div key={proj.id}>
                <div className="flex justify-between items-baseline border-b border-slate-200 mb-1 pb-0.5">
                  <h3 className="text-[0.9em] font-bold">
                    {proj.name}
                    {proj.techStack && <span className="font-normal text-[0.85em] ml-2">[{proj.techStack}]</span>}
                  </h3>
                  {proj.link && <span className="text-[0.8em]">{proj.link.replace(/^https?:\/\/(www\.)?/, '')}</span>}
                </div>
                <p className="text-[0.85em] leading-snug mt-1">{proj.description}</p>
              </div>
            ))}
          </div>
        </section>
      )}

      {education && education.length > 0 && (
        <section className="mb-5">
          <h2 className="text-[0.85em] font-black uppercase tracking-widest bg-black text-white px-2 py-0.5 inline-block mb-3">Education</h2>
          <div className="flex flex-col gap-2">
            {education.map(edu => (
              <div key={edu.id} className="flex justify-between items-baseline">
                <div className="text-[0.85em]">
                  <span className="font-bold">{edu.degree}</span>, {edu.institution}
                  {edu.gpa && <span className="ml-2">GPA: {edu.gpa}</span>}
                </div>
                <span className="text-[0.8em]">{edu.year}</span>
              </div>
            ))}
          </div>
        </section>
      )}

      {(certifications.length > 0 || languages.length > 0) && (
        <section className="mb-5">
          <h2 className="text-[0.85em] font-black uppercase tracking-widest bg-black text-white px-2 py-0.5 inline-block mb-3">Additional Information</h2>
          <div className="flex flex-col gap-1 text-[0.85em] leading-snug">
            {certifications.length > 0 && <div><span className="font-bold">Certifications:</span> {certifications.join(', ')}</div>}
            {languages.length > 0 && <div><span className="font-bold">Languages:</span> {languages.join(', ')}</div>}
          </div>
        </section>
      )}
    </div>
  );
}
