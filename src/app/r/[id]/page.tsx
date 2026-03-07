import prisma from '@/lib/prisma';
import { notFound } from 'next/navigation';
import { Metadata } from 'next';
import ReactMarkdown from 'react-markdown';
import { ProfessionalTemplate } from '@/components/templates/ProfessionalTemplate';
import { ModernTemplate } from '@/components/templates/ModernTemplate';
import { MinimalTemplate } from '@/components/templates/MinimalTemplate';

interface Props {
  params: Promise<{ id: string }>;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { id } = await params;
  const resume = await prisma.resume.findUnique({ where: { id }, select: { title: true } });
  return {
    title: resume ? `${resume.title} — ORBITAL` : 'Resume Not Found',
    description: resume ? `View ${resume.title} on ORBITAL SYSTEMS` : 'This resume could not be found.',
  };
}

function RenderResume({ data, markdown }: { data: any; markdown: string | null }) {
  // Prefer JSON template rendering
  if (data && typeof data === 'object' && data.personal) {
    const template = data.template || 'professional';
    switch (template) {
      case 'modern': return <ModernTemplate data={data} />;
      case 'minimal': return <MinimalTemplate data={data} />;
      default: return <ProfessionalTemplate data={data} />;
    }
  }
  // Fallback to markdown
  if (markdown) {
    return <ReactMarkdown>{markdown}</ReactMarkdown>;
  }
  return <p>This resume could not be rendered.</p>;
}

export default async function PublicResumePage({ params }: Props) {
  const { id } = await params;

  const resume = await prisma.resume.findUnique({
    where: { id },
    select: {
      id: true,
      title: true,
      data: true,
      markdown: true,
      createdAt: true,
      user: { select: { name: true } },
    },
  });

  if (!resume || (!resume.markdown && !resume.data)) {
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
        <RenderResume data={resume.data} markdown={resume.markdown} />
      </div>
      <div className="public-resume-footer">
        <p>
          Generated with ✨{' '}
          <a href="/" style={{ color: 'var(--primary)', fontWeight: 600 }}>
            ORBITAL SYSTEMS
          </a>
        </p>
      </div>
    </div>
  );
}
