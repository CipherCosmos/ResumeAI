import prisma from '@/lib/prisma';
import { notFound } from 'next/navigation';
import { Metadata } from 'next';
import ReactMarkdown from 'react-markdown';

interface Props {
  params: Promise<{ id: string }>;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { id } = await params;
  const resume = await prisma.resume.findUnique({ where: { id }, select: { title: true } });
  return {
    title: resume ? `${resume.title} — ResumeAI` : 'Resume Not Found',
    description: resume ? `View ${resume.title} on ResumeAI` : 'This resume could not be found.',
  };
}

export default async function PublicResumePage({ params }: Props) {
  const { id } = await params;

  const resume = await prisma.resume.findUnique({
    where: { id },
    select: {
      id: true,
      title: true,
      markdown: true,
      createdAt: true,
      user: { select: { name: true } },
    },
  });

  if (!resume || !resume.markdown) {
    notFound();
  }

  return (
    <div className="public-resume-page">
      <div className="public-resume-header">
        <h1>{resume.title}</h1>
        <p>
          {resume.user?.name ? `By ${resume.user.name}` : 'Anonymous'} ·{' '}
          {new Date(resume.createdAt).toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'long',
            day: 'numeric',
          })}
        </p>
      </div>
      <div className="public-resume-body glass-panel">
        <ReactMarkdown>{resume.markdown}</ReactMarkdown>
      </div>
      <div className="public-resume-footer">
        <p>
          Generated with ✨{' '}
          <a href="/" style={{ color: 'var(--primary)', fontWeight: 600 }}>
            ResumeAI
          </a>
        </p>
      </div>
    </div>
  );
}
