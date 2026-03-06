import React from 'react';
import { ResumeData } from '@/types/resume';

interface TemplateProps {
  data: ResumeData;
}

export function ProfessionalTemplate({ data }: TemplateProps) {
  const { personal, summary, experience, education, projects, skills, certifications, languages } = data;

  return (
    <div className="resume-paper template-professional">
      <header className="text-center mb-6 border-b-2 border-slate-800 pb-4">
        <h1 className="text-3xl font-bold uppercase tracking-wider text-slate-900 mb-1">{personal.fullName}</h1>
        {data.targetRole && (
          <h2 className="text-[1.1rem] font-medium tracking-widest text-slate-800 uppercase mb-3">{data.targetRole}</h2>
        )}
        <div className="text-base font-semibold text-slate-700 flex flex-wrap justify-center gap-x-4 gap-y-1">
          {personal.location && <span>{personal.location}</span>}
          {personal.phone && (
            <>
              <span className="text-slate-400">|</span>
              <span>{personal.phone}</span>
            </>
          )}
          {personal.email && (
            <>
              <span className="text-slate-400">|</span>
              <a href={`mailto:${personal.email}`} className="hover:text-slate-900">{personal.email}</a>
            </>
          )}
          {personal.linkedin && (
            <>
              <span className="text-slate-400">|</span>
              <a href={personal.linkedin.startsWith('http') ? personal.linkedin : `https://${personal.linkedin}`} target="_blank" rel="noopener" className="hover:text-slate-900">
                {personal.linkedin.replace(/^https?:\/\/(www\.)?/, '')}
              </a>
            </>
          )}
          {personal.github && (
            <>
              <span className="text-slate-400">|</span>
              <a href={personal.github.startsWith('http') ? personal.github : `https://${personal.github}`} target="_blank" rel="noopener" className="hover:text-slate-900">
                {personal.github.replace(/^https?:\/\/(www\.)?/, '')}
              </a>
            </>
          )}
          {personal.portfolio && (
            <>
              <span className="text-slate-400">|</span>
              <a href={personal.portfolio.startsWith('http') ? personal.portfolio : `https://${personal.portfolio}`} target="_blank" rel="noopener" className="hover:text-slate-900">
                Portfolio
              </a>
            </>
          )}
        </div>
      </header>

      {summary && (
        <section className="mb-5">
          <h2 className="text-sm font-bold uppercase tracking-widest text-slate-900 mb-2 border-b border-slate-300 pb-1">Professional Summary</h2>
          <p className="text-[0.85em] leading-relaxed text-slate-800">{summary}</p>
        </section>
      )}

      {skills && skills.length > 0 && (
        <section className="mb-5">
          <h2 className="text-sm font-bold uppercase tracking-widest text-slate-900 mb-2 border-b border-slate-300 pb-1">Core Competencies</h2>
          <p className="text-[0.85em] leading-relaxed text-slate-800">{skills.join(' • ')}</p>
        </section>
      )}

      {experience && experience.length > 0 && (
        <section className="mb-5">
          <h2 className="text-sm font-bold uppercase tracking-widest text-slate-900 mb-3 border-b border-slate-300 pb-1">Professional Experience</h2>
          <div className="flex flex-col gap-4">
            {experience.map(exp => (
              <div key={exp.id}>
                <div className="flex justify-between items-baseline mb-1">
                  <h3 className="text-[0.9em] font-bold text-slate-900">{exp.company}{exp.location && <span className="font-normal text-slate-600">, {exp.location}</span>}</h3>
                  <span className="text-[0.85em] font-medium text-slate-700">{exp.startDate} – {exp.endDate || 'Present'}</span>
                </div>
                <div className="text-[0.85em] italic text-slate-700 mb-2">{exp.jobTitle}</div>
                {exp.bullets && exp.bullets.length > 0 && (
                  <ul className="list-disc pl-5 text-[0.85em] text-slate-800 space-y-1">
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
          <h2 className="text-sm font-bold uppercase tracking-widest text-slate-900 mb-3 border-b border-slate-300 pb-1">Technical Projects</h2>
          <div className="flex flex-col gap-3">
            {projects.map(proj => (
              <div key={proj.id}>
                <div className="flex justify-between items-baseline mb-1">
                  <h3 className="text-[0.9em] font-bold text-slate-900">
                    {proj.name}
                    {proj.link && (
                      <a href={proj.link.startsWith('http') ? proj.link : `https://${proj.link}`} target="_blank" rel="noopener" className="ml-2 text-slate-500 hover:text-slate-900 font-normal underline">
                        [Link]
                      </a>
                    )}
                  </h3>
                  <span className="text-[0.85em] italic text-slate-700">{proj.techStack}</span>
                </div>
                <p className="text-[0.85em] leading-relaxed text-slate-800">{proj.description}</p>
              </div>
            ))}
          </div>
        </section>
      )}

      {education && education.length > 0 && (
        <section className="mb-5">
          <h2 className="text-sm font-bold uppercase tracking-widest text-slate-900 mb-3 border-b border-slate-300 pb-1">Education</h2>
          <div className="flex flex-col gap-3">
            {education.map(edu => (
              <div key={edu.id} className="flex justify-between items-baseline">
                <div>
                  <h3 className="text-[0.9em] font-bold text-slate-900">{edu.institution}</h3>
                  <div className="text-[0.85em] text-slate-800">
                    {edu.degree}
                  </div>
                  {edu.gpa && <div className="text-[0.85em] text-slate-600 mt-0.5">GPA: <span className="font-medium text-slate-800">{edu.gpa}</span></div>}
                  {(edu as any).coursework && <div className="text-[0.85em] text-slate-600 mt-1"><span className="font-medium text-slate-800">Relevant Coursework:</span> {(edu as any).coursework}</div>}
                </div>
                <span className="text-[0.85em] font-medium text-slate-700">{edu.year}</span>
              </div>
            ))}
          </div>
        </section>
      )}

      {(certifications.length > 0 || languages.length > 0) && (
        <section className="mb-5">
          <h2 className="text-sm font-bold uppercase tracking-widest text-slate-900 mb-2 border-b border-slate-300 pb-1">Additional Information</h2>
          <div className="text-[0.85em] text-slate-800 space-y-1">
            {certifications.length > 0 && <div><span className="font-bold">Certifications:</span> {certifications.join(', ')}</div>}
            {languages.length > 0 && <div><span className="font-bold">Languages:</span> {languages.join(', ')}</div>}
          </div>
        </section>
      )}
    </div>
  );
}
