import React from 'react';
import { ResumeData } from '@/types/resume';

interface TemplateProps {
  data: ResumeData;
}

export function ModernTemplate({ data }: TemplateProps) {
  const { personal, summary, experience, education, projects, skills, certifications, languages } = data;

  return (
    <div className="resume-paper template-modern font-sans text-slate-800">
      <header className="flex items-center justify-between mb-8 pb-6 border-b-4 border-indigo-700">
        <div className="flex-1">
          <h1 className="text-4xl font-extrabold text-indigo-700 mb-1 tracking-tight">{personal.fullName}</h1>
          {data.targetRole && (
             <h2 className="text-xl font-medium text-slate-600 tracking-wide uppercase mb-3">{data.targetRole}</h2>
          )}
          <div className="text-base font-semibold text-slate-600 flex flex-wrap gap-x-4 gap-y-2">
            {personal.location && <span className="flex items-center gap-1">{personal.location}</span>}
            {personal.phone && <span className="flex items-center gap-1">{personal.phone}</span>}
            {personal.email && (
              <a href={`mailto:${personal.email}`} className="flex items-center gap-1 hover:text-indigo-700 transition-colors">
                {personal.email}
              </a>
            )}
            {personal.linkedin && (
              <a href={personal.linkedin.startsWith('http') ? personal.linkedin : `https://${personal.linkedin}`} target="_blank" rel="noopener" className="flex items-center gap-1 hover:text-indigo-700 transition-colors">
                LinkedIn
              </a>
            )}
            {personal.github && (
              <a href={personal.github.startsWith('http') ? personal.github : `https://${personal.github}`} target="_blank" rel="noopener" className="flex items-center gap-1 hover:text-indigo-700 transition-colors">
                GitHub
              </a>
            )}
            {personal.portfolio && (
              <a href={personal.portfolio.startsWith('http') ? personal.portfolio : `https://${personal.portfolio}`} target="_blank" rel="noopener" className="flex items-center gap-1 hover:text-indigo-700 transition-colors">
                Portfolio
              </a>
            )}
          </div>
        </div>
        {personal.profileImage && (
          <img src={personal.profileImage} alt="Profile" className="w-24 h-24 rounded-full object-cover border-2 border-indigo-700 shadow-sm ml-6" />
        )}
      </header>

      <div className="grid grid-cols-1 md:grid-cols-[1fr_250px] gap-8">
        
        {/* Main Column */}
        <div>
          {summary && (
            <section className="mb-6">
              <h2 className="text-lg font-bold text-indigo-700 mb-2 uppercase tracking-wide bg-indigo-50 px-3 py-1 rounded inline-block">Profile</h2>
              <p className="text-[0.9em] leading-relaxed text-slate-700">{summary}</p>
            </section>
          )}

          {experience && experience.length > 0 && (
            <section className="mb-6">
              <h2 className="text-lg font-bold text-indigo-700 mb-4 uppercase tracking-wide bg-indigo-50 px-3 py-1 rounded inline-block">Experience</h2>
              <div className="flex flex-col gap-5">
                {experience.map(exp => (
                  <div key={exp.id} className="relative pl-4 border-l-2 border-slate-200">
                    <div className="absolute w-2 h-2 bg-indigo-700 rounded-full -left-[5px] top-1.5" />
                    <div className="flex flex-col sm:flex-row sm:justify-between sm:items-baseline mb-1">
                      <h3 className="text-[1.05em] font-bold text-slate-900">{exp.jobTitle}</h3>
                      <span className="text-[0.85em] font-medium text-indigo-700">{exp.startDate} – {exp.endDate || 'Present'}</span>
                    </div>
                    <div className="text-[0.9em] font-medium text-slate-600 mb-2">{exp.company}{exp.location && `, ${exp.location}`}</div>
                    {exp.bullets && exp.bullets.length > 0 && (
                      <ul className="list-disc pl-5 text-[0.85em] text-slate-700 space-y-1">
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
            <section className="mb-6">
              <h2 className="text-lg font-bold text-indigo-700 mb-4 uppercase tracking-wide bg-indigo-50 px-3 py-1 rounded inline-block">Projects</h2>
              <div className="flex flex-col gap-4">
                {projects.map(proj => (
                  <div key={proj.id} className="relative pl-4 border-l-2 border-slate-200">
                    <div className="absolute w-2 h-2 bg-slate-400 rounded-full -left-[5px] top-1.5" />
                    <div className="flex justify-between items-baseline mb-1">
                      <h3 className="text-[1em] font-bold text-slate-900">
                        {proj.name}
                        {proj.link && (
                          <a href={proj.link.startsWith('http') ? proj.link : `https://${proj.link}`} target="_blank" rel="noopener" className="ml-2 text-indigo-700 hover:underline font-normal text-sm">
                            [Link]
                          </a>
                        )}
                      </h3>
                      <span className="text-[0.85em] font-medium text-slate-500 bg-slate-100 px-2 py-0.5 rounded">{proj.techStack}</span>
                    </div>
                    <p className="text-[0.85em] leading-relaxed text-slate-700 mt-1">{proj.description}</p>
                  </div>
                ))}
              </div>
            </section>
          )}
        </div>

        {/* Sidebar Column */}
        <div className="flex flex-col gap-6">
          {skills && skills.length > 0 && (
            <section>
              <h2 className="text-lg font-bold text-indigo-700 mb-3 uppercase tracking-wide border-b-2 border-slate-100 pb-1">Skills</h2>
              <div className="flex flex-wrap gap-2">
                {skills.map((skill, i) => (
                  <span key={i} className="text-[0.8em] font-medium bg-slate-100 text-slate-700 px-2.5 py-1 rounded-md border border-slate-200">
                    {skill}
                  </span>
                ))}
              </div>
            </section>
          )}

          {education && education.length > 0 && (
            <section>
              <h2 className="text-lg font-bold text-indigo-700 mb-3 uppercase tracking-wide border-b-2 border-slate-100 pb-1">Education</h2>
              <div className="flex flex-col gap-3">
                {education.map(edu => (
                  <div key={edu.id}>
                    <h3 className="text-[0.9em] font-bold text-slate-900 leading-tight mb-1">{edu.degree}</h3>
                    <div className="text-[0.85em] text-slate-600 mb-0.5">{edu.institution}</div>
                    <div className="text-[0.8em] font-medium text-indigo-700 mb-1">{edu.year}</div>
                    {edu.gpa && <div className="text-[0.8em] text-slate-500">GPA: {edu.gpa}</div>}
                    {(edu as any).coursework && <div className="text-[0.8em] text-slate-500 mt-1">Coursework: {(edu as any).coursework}</div>}
                  </div>
                ))}
              </div>
            </section>
          )}

          {certifications.length > 0 && (
            <section>
              <h2 className="text-lg font-bold text-indigo-700 mb-3 uppercase tracking-wide border-b-2 border-slate-100 pb-1">Certifications</h2>
              <ul className="list-none text-[0.85em] text-slate-700 space-y-2">
                {certifications.map((cert, i) => (
                  <li key={i} className="flex items-start gap-2">
                    <span className="text-indigo-700 mt-0.5">•</span>
                    <span>{cert}</span>
                  </li>
                ))}
              </ul>
            </section>
          )}

          {languages.length > 0 && (
            <section>
              <h2 className="text-lg font-bold text-indigo-700 mb-3 uppercase tracking-wide border-b-2 border-slate-100 pb-1">Languages</h2>
              <ul className="list-none text-[0.85em] text-slate-700 space-y-2">
                {languages.map((lang, i) => (
                  <li key={i} className="flex items-start gap-2">
                    <span className="text-indigo-700 mt-0.5">•</span>
                    <span>{lang}</span>
                  </li>
                ))}
              </ul>
            </section>
          )}
        </div>

      </div>
    </div>
  );
}
