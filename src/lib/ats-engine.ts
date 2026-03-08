/**
 * Deterministic ATS Scoring Engine — Universal Edition
 * 
 * Handles ANY role: Software, Marketing, Finance, Healthcare,
 * Design, Sales, HR, Legal, Education, Operations, and more.
 * 
 * Produces reproducible, auditable ATS compatibility scores
 * using keyword matching, section detection, bullet quality,
 * readability analysis, and format scoring.
 * 
 * This is NOT AI — it's pure algorithmic analysis.
 */

// ─── Types ────────────────────────────────────────────

export interface KeywordMatch {
    keyword: string;
    found: boolean;
    frequency: number;
    category: 'technical' | 'soft' | 'certification' | 'tool' | 'methodology' | 'domain' | 'general';
}

export interface SectionPresence {
    name: string;
    detected: boolean;
    quality: 'good' | 'weak' | 'missing';
    feedback: string;
}

export interface BulletAnalysis {
    totalBullets: number;
    actionVerbBullets: number;
    quantifiedBullets: number;
    avgBulletLength: number;
    actionVerbs: string[];
    metrics: string[];
}

export interface ATSEngineResult {
    overallScore: number;
    keywordScore: number;
    sectionScore: number;
    bulletScore: number;
    readabilityScore: number;
    formatScore: number;
    keywords: KeywordMatch[];
    sections: SectionPresence[];
    bulletAnalysis: BulletAnalysis;
    readabilityMetrics: {
        avgSentenceLength: number;
        totalWords: number;
        hasSpecialChars: boolean;
        hasTablesOrImages: boolean;
    };
    formatMetrics: {
        hasDates: boolean;
        dateConsistency: boolean;
        hasProperLength: boolean;
        wordCount: number;
        estimatedPages: number;
    };
}

// ─── Universal Action Verbs (200+, all industries) ───

const ACTION_VERBS = new Set([
    // Leadership & Management
    'achieved', 'administered', 'appointed', 'approved', 'assigned', 'authorized',
    'chaired', 'consolidated', 'contracted', 'coordinated', 'delegated', 'directed',
    'eliminated', 'enforced', 'established', 'executed', 'headed', 'hired', 'hosted',
    'initiated', 'inspected', 'instituted', 'led', 'managed', 'merged', 'motivated',
    'organized', 'oversaw', 'planned', 'presided', 'prioritized', 'recommended',
    'reorganized', 'replaced', 'restored', 'reviewed', 'supervised', 'terminated',

    // Communication & Collaboration
    'addressed', 'advertised', 'arbitrated', 'arranged', 'articulated', 'authored',
    'briefed', 'campaigned', 'co-authored', 'collaborated', 'communicated', 'composed',
    'consulted', 'contacted', 'conveyed', 'convinced', 'corresponded', 'debated',
    'defined', 'described', 'discussed', 'drafted', 'edited', 'elicited', 'enlisted',
    'explained', 'expressed', 'facilitated', 'formulated', 'furnished', 'incorporated',
    'influenced', 'interacted', 'interpreted', 'interviewed', 'involved', 'joined',
    'lectured', 'listened', 'lobbied', 'mediated', 'moderated', 'negotiated',
    'observed', 'outlined', 'participated', 'persuaded', 'presented', 'promoted',
    'proposed', 'publicized', 'published', 'reconciled', 'recruited', 'referred',
    'reinforced', 'reported', 'represented', 'responded', 'solicited', 'specified',
    'spoke', 'suggested', 'summarized', 'synthesized', 'translated', 'wrote',

    // Research & Analysis
    'analyzed', 'assessed', 'audited', 'benchmarked', 'calculated', 'clarified',
    'collected', 'compared', 'compiled', 'computed', 'concluded', 'conducted',
    'critiqued', 'detected', 'determined', 'diagnosed', 'dissected', 'evaluated',
    'examined', 'experimented', 'explored', 'extracted', 'forecasted', 'formalized',
    'gathered', 'identified', 'inspected', 'interpreted', 'investigated', 'mapped',
    'measured', 'modeled', 'monitored', 'probed', 'projected', 'qualified',
    'quantified', 'researched', 'resolved', 'reviewed', 'sampled', 'screened',
    'studied', 'surveyed', 'systematized', 'tested', 'tracked', 'verified',

    // Technical & Engineering
    'adapted', 'assembled', 'automated', 'built', 'coded', 'configured',
    'constructed', 'converted', 'customized', 'debugged', 'deployed', 'designed',
    'developed', 'devised', 'digitized', 'engineered', 'fabricated', 'implemented',
    'installed', 'integrated', 'maintained', 'manufactured', 'migrated', 'modernized',
    'modified', 'operated', 'optimized', 'overhauled', 'programmed', 'prototyped',
    'rebuilt', 'redesigned', 'refactored', 'remodeled', 'repaired', 'revamped',
    'scaled', 'simplified', 'solved', 'standardized', 'streamlined', 'troubleshot',
    'upgraded', 'validated',

    // Creative & Design
    'abstracted', 'brainstormed', 'conceptualized', 'crafted', 'curated', 'customized',
    'decorated', 'designed', 'developed', 'directed', 'drew', 'envisioned', 'fashioned',
    'founded', 'generated', 'illustrated', 'imagined', 'initiated', 'innovated',
    'inspired', 'invented', 'launched', 'modeled', 'originated', 'penned',
    'performed', 'photographed', 'pioneered', 'produced', 'revitalized', 'shaped',
    'sketched', 'styled', 'visualized',

    // Financial & Business
    'allocated', 'appraised', 'balanced', 'budgeted', 'closed', 'conserved',
    'controlled', 'decreased', 'disbursed', 'earned', 'estimated', 'financed',
    'forecasted', 'funded', 'generated', 'grew', 'increased', 'invested',
    'leveraged', 'marketed', 'maximized', 'minimized', 'netted', 'offset',
    'outsourced', 'procured', 'profited', 'projected', 'purchased', 'recouped',
    'reduced', 'restructured', 'retained', 'saved', 'secured', 'sold',
    'sourced', 'stabilized', 'yielded',

    // Teaching & Training
    'adapted', 'advised', 'clarified', 'coached', 'communicated', 'counseled',
    'critiqued', 'demonstrated', 'educated', 'empowered', 'enabled', 'encouraged',
    'evaluated', 'explained', 'graded', 'guided', 'informed', 'instructed',
    'mentored', 'motivated', 'persuaded', 'stimulated', 'taught', 'trained', 'tutored',

    // Healthcare / Science
    'administered', 'assessed', 'assisted', 'cared', 'charted', 'diagnosed',
    'dispensed', 'documented', 'examined', 'immunized', 'inoculated', 'nursed',
    'operated', 'prescribed', 'prevented', 'rehabilitated', 'screened',
    'stabilized', 'treated', 'triaged',

    // Helping & Support
    'accommodated', 'aided', 'answered', 'assisted', 'contributed', 'cooperated',
    'delivered', 'expedited', 'familiarized', 'fulfilled', 'guided', 'helped',
    'insured', 'intervened', 'provided', 'referred', 'rendered', 'resolved',
    'served', 'supported', 'sustained', 'volunteered',

    // Organization & Detail
    'approved', 'archived', 'cataloged', 'categorized', 'charted', 'classified',
    'coded', 'collected', 'compiled', 'dispatched', 'distributed', 'documented',
    'executed', 'filed', 'generated', 'implemented', 'logged', 'maintained',
    'mapped', 'obtained', 'ordered', 'organized', 'prepared', 'processed',
    'provided', 'purchased', 'recorded', 'registered', 'reserved', 'responded',
    'retrieved', 'routed', 'scheduled', 'sorted', 'stocked', 'submitted',
    'supplied', 'tabulated', 'updated', 'utilized', 'validated',

    // Achievement words
    'accomplished', 'advanced', 'attained', 'awarded', 'boosted', 'captured',
    'championed', 'completed', 'delivered', 'demonstrated', 'drove', 'earned',
    'enhanced', 'exceeded', 'expanded', 'improved', 'outpaced', 'outperformed',
    'pioneered', 'propelled', 'spearheaded', 'surpassed', 'transformed', 'won',
]);

// ─── Universal Soft Skills ───────────────────────────

const SOFT_SKILLS = new Set([
    // Core
    'leadership', 'communication', 'teamwork', 'problem-solving', 'critical thinking',
    'adaptability', 'collaboration', 'time management', 'project management',
    'analytical', 'attention to detail', 'decision-making', 'strategic',
    'mentoring', 'organizational', 'interpersonal',
    // Work ethic
    'self-motivated', 'self-starter', 'proactive', 'initiative', 'accountability',
    'multitasking', 'prioritization', 'reliability', 'work ethic', 'deadline-driven',
    // People
    'stakeholder management', 'client relations', 'customer service', 'empathy',
    'conflict resolution', 'cross-functional', 'team building', 'relationship building',
    'presentation skills', 'public speaking', 'active listening', 'emotional intelligence',
    // Business
    'strategic planning', 'business acumen', 'process improvement', 'change management',
    'risk management', 'vendor management', 'budget management', 'resource management',
    'performance management', 'talent management', 'negotiation', 'persuasion',
    // Creative
    'creativity', 'innovation', 'design thinking', 'user-centric', 'storytelling',
    'visual communication', 'brand awareness', 'content strategy',
]);

// ─── Domain Keyword Dictionaries (multi-industry) ────

const DOMAIN_KEYWORDS: Record<string, Set<string>> = {
    // Software & Tech
    tech: new Set([
        'python', 'java', 'javascript', 'typescript', 'react', 'angular', 'vue',
        'node', 'nodejs', 'express', 'django', 'flask', 'spring', 'spring boot',
        'sql', 'nosql', 'html', 'css', 'c++', 'c#', '.net', 'ruby', 'go', 'golang',
        'rust', 'swift', 'kotlin', 'php', 'scala', 'r', 'matlab', 'perl',
        'graphql', 'rest', 'restful', 'api', 'apis', 'microservices', 'saas',
        'mongodb', 'postgres', 'postgresql', 'mysql', 'redis', 'kafka',
        'elasticsearch', 'dynamodb', 'cassandra', 'oracle', 'sqlite',
        'aws', 'azure', 'gcp', 'cloud', 'serverless', 'lambda',
        'docker', 'kubernetes', 'k8s', 'terraform', 'ansible', 'jenkins',
        'ci/cd', 'cicd', 'devops', 'devsecops', 'sre', 'mlops',
        'git', 'github', 'gitlab', 'bitbucket', 'svn',
        'machine learning', 'deep learning', 'nlp', 'computer vision', 'generative ai', 'llms',
        'tensorflow', 'pytorch', 'pandas', 'numpy', 'scikit-learn', 'opencv',
        'data science', 'data engineering', 'data pipeline', 'etl', 'elt',
        'data warehouse', 'data lake', 'big data', 'hadoop', 'spark',
        'frontend', 'backend', 'full stack', 'fullstack', 'full-stack',
        'mobile', 'android', 'ios', 'react native', 'flutter',
        'agile', 'scrum', 'kanban', 'jira', 'confluence', 'sprints',
        'tdd', 'bdd', 'unit testing', 'integration testing', 'e2e',
        'linux', 'unix', 'windows', 'macos', 'shell', 'bash',
        'blockchain', 'web3', 'solidity', 'smart contracts',
        'cybersecurity', 'penetration testing', 'encryption', 'oauth',
        'sso', 'jwt', 'ldap', 'rbac', 'iam',
        'next.js', 'nextjs', 'tailwind', 'tailwindcss', 'prisma', 'supabase',
        'vercel', 'zustand', 'trpc', 'vite', 'webpack', 'babel', 'drizzle'
    ]),

    // Marketing & Digital
    marketing: new Set([
        'seo', 'sem', 'ppc', 'cpc', 'cpm', 'ctr', 'roas', 'roi',
        'google ads', 'google analytics', 'ga4', 'gtm', 'tag manager',
        'facebook ads', 'instagram', 'tiktok', 'linkedin ads', 'twitter ads',
        'social media', 'social media marketing', 'smm', 'content marketing',
        'email marketing', 'mailchimp', 'hubspot', 'marketo', 'pardot',
        'salesforce', 'crm', 'marketing automation', 'lead generation',
        'conversion rate', 'conversion optimization', 'cro', 'a/b testing',
        'landing page', 'funnel', 'customer journey', 'buyer persona',
        'brand strategy', 'brand management', 'brand identity',
        'copywriting', 'content writing', 'blogging', 'editorial',
        'pr', 'public relations', 'press release', 'media relations',
        'influencer marketing', 'affiliate marketing', 'performance marketing',
        'demand generation', 'inbound marketing', 'outbound marketing',
        'market research', 'competitive analysis', 'swot',
        'analytics', 'data-driven', 'kpi', 'metrics', 'dashboard',
        'wordpress', 'shopify', 'wix', 'squarespace', 'webflow',
        'canva', 'adobe creative suite', 'photoshop', 'illustrator',
        'video marketing', 'youtube', 'podcast', 'webinar',
    ]),

    // Finance & Accounting
    finance: new Set([
        'financial modeling', 'financial analysis', 'financial reporting',
        'financial planning', 'fp&a', 'budgeting', 'forecasting',
        'accounting', 'bookkeeping', 'accounts payable', 'accounts receivable',
        'gaap', 'ifrs', 'sox', 'sec', 'audit', 'internal audit', 'external audit',
        'tax', 'taxation', 'tax compliance', 'tax planning', 'cpa',
        'investment banking', 'private equity', 'venture capital', 'hedge fund',
        'portfolio management', 'asset management', 'wealth management',
        'risk assessment', 'credit analysis', 'due diligence', 'valuation',
        'dcf', 'lbo', 'p&l', 'balance sheet', 'income statement', 'cash flow',
        'erp', 'sap', 'oracle', 'quickbooks', 'netsuite', 'xero',
        'bloomberg', 'reuters', 'capital iq', 'factset', 'pitchbook',
        'excel', 'financial modeling', 'pivot tables', 'vlookup', 'macros', 'vba',
        'treasury', 'liquidity', 'derivatives', 'equities', 'fixed income',
        'compliance', 'regulatory', 'aml', 'kyc', 'bsa',
        'banking', 'lending', 'underwriting', 'insurance', 'actuarial',
        'cryptocurrency', 'fintech', 'payments', 'stripe', 'paypal',
    ]),

    // Healthcare & Medical
    healthcare: new Set([
        'patient care', 'clinical', 'diagnosis', 'treatment', 'prognosis',
        'ehr', 'emr', 'epic', 'cerner', 'meditech', 'athenahealth',
        'hipaa', 'phi', 'medical records', 'health information',
        'nursing', 'rn', 'lpn', 'np', 'pa', 'md', 'do',
        'pharmacy', 'pharmacology', 'prescription', 'medication',
        'surgery', 'surgical', 'operating room', 'icu', 'er', 'or',
        'radiology', 'imaging', 'mri', 'ct', 'x-ray', 'ultrasound',
        'laboratory', 'lab', 'pathology', 'microbiology', 'hematology',
        'physical therapy', 'occupational therapy', 'rehabilitation',
        'mental health', 'psychiatry', 'psychology', 'counseling',
        'public health', 'epidemiology', 'biostatistics',
        'fda', 'clinical trials', 'gcp', 'irb', 'informed consent',
        'icd-10', 'cpt', 'drg', 'medical coding', 'medical billing',
        'telemedicine', 'telehealth', 'remote patient monitoring',
        'vital signs', 'triage', 'discharge planning', 'care coordination',
        'infection control', 'quality improvement', 'patient safety',
        'bls', 'acls', 'pals', 'cpr', 'first aid',
    ]),

    // Design & Creative
    design: new Set([
        'ui', 'ux', 'ui/ux', 'user interface', 'user experience',
        'figma', 'sketch', 'adobe xd', 'invision', 'zeplin', 'principle',
        'photoshop', 'illustrator', 'indesign', 'after effects', 'premiere pro',
        'lightroom', 'blender', '3ds max', 'cinema 4d', 'maya',
        'graphic design', 'visual design', 'web design', 'product design',
        'interaction design', 'motion design', 'motion graphics',
        'typography', 'color theory', 'layout', 'grid systems', 'iconography',
        'wireframe', 'wireframing', 'mockup', 'prototype', 'prototyping',
        'user research', 'usability testing', 'user testing', 'a/b testing',
        'information architecture', 'design systems', 'component library',
        'responsive design', 'mobile design', 'adaptive design',
        'accessibility', 'wcag', 'ada', 'inclusive design',
        'branding', 'logo design', 'brand guidelines', 'style guide',
        'illustration', 'animation', 'video editing', 'photography',
        'print design', 'packaging', 'signage', 'exhibition design',
    ]),

    // Sales & Business Development
    sales: new Set([
        'sales', 'revenue', 'quota', 'pipeline', 'funnel', 'forecast',
        'b2b', 'b2c', 'saas sales', 'enterprise sales', 'inside sales',
        'outside sales', 'field sales', 'channel sales', 'direct sales',
        'account management', 'account executive', 'key accounts',
        'business development', 'bdr', 'sdr', 'lead qualification',
        'cold calling', 'cold email', 'outreach', 'prospecting',
        'crm', 'salesforce', 'hubspot', 'pipedrive', 'zoho',
        'negotiation', 'closing', 'objection handling', 'upselling',
        'cross-selling', 'renewals', 'churn', 'retention',
        'solution selling', 'consultative selling', 'value selling',
        'territory management', 'market expansion', 'go-to-market',
        'rfp', 'rfq', 'rfi', 'proposal', 'pricing', 'contracts',
        'customer success', 'customer experience', 'nps', 'csat',
        'partner management', 'channel partners', 'resellers',
    ]),

    // Human Resources
    hr: new Set([
        'recruiting', 'recruitment', 'talent acquisition', 'sourcing',
        'onboarding', 'offboarding', 'employee engagement', 'retention',
        'hris', 'workday', 'bamboohr', 'adp', 'successfactors', 'paycom',
        'compensation', 'benefits', 'payroll', 'total rewards',
        'performance management', 'performance review', 'okr', 'kpi',
        'learning and development', 'l&d', 'training', 'upskilling',
        'employee relations', 'labor relations', 'union', 'collective bargaining',
        'dei', 'diversity', 'equity', 'inclusion', 'belonging',
        'hr policy', 'employment law', 'fmla', 'ada', 'eeoc', 'flsa',
        'workforce planning', 'succession planning', 'org design',
        'culture', 'employer branding', 'evp', 'candidate experience',
        'background check', 'reference check', 'offer letter',
        'ats', 'greenhouse', 'lever', 'icims', 'taleo', 'linkedin recruiter',
    ]),

    // Legal
    legal: new Set([
        'litigation', 'arbitration', 'mediation', 'dispute resolution',
        'contract', 'contracts', 'contract law', 'commercial law',
        'corporate law', 'securities', 'mergers', 'acquisitions', 'm&a',
        'intellectual property', 'ip', 'patent', 'trademark', 'copyright',
        'compliance', 'regulatory', 'governance', 'risk',
        'real estate', 'property law', 'zoning', 'title',
        'employment law', 'labor law', 'immigration',
        'criminal law', 'civil law', 'family law', 'tax law',
        'legal research', 'westlaw', 'lexisnexis', 'pacer',
        'legal writing', 'brief', 'memorandum', 'pleading', 'motion',
        'discovery', 'deposition', 'subpoena', 'trial', 'appellate',
        'due diligence', 'legal review', 'privilege', 'confidentiality',
        'bar', 'jd', 'llm', 'paralegal', 'notary',
    ]),

    // Education
    education: new Set([
        'curriculum', 'lesson plan', 'instruction', 'pedagogy',
        'assessment', 'grading', 'rubric', 'evaluation',
        'classroom management', 'differentiation', 'scaffolding',
        'iep', 'special education', 'sped', 'gifted',
        'stem', 'steam', 'literacy', 'numeracy',
        'lms', 'canvas', 'blackboard', 'moodle', 'google classroom',
        'e-learning', 'online learning', 'blended learning', 'distance learning',
        'student engagement', 'parent communication',
        'accreditation', 'state standards', 'common core',
        'tutoring', 'mentoring', 'advising', 'counseling',
        'k-12', 'higher education', 'early childhood',
        'professional development', 'continuing education',
    ]),

    // Operations & Supply Chain
    operations: new Set([
        'operations management', 'process improvement', 'process optimization',
        'lean', 'six sigma', 'kaizen', 'tqm', 'continuous improvement',
        'supply chain', 'procurement', 'sourcing', 'purchasing',
        'logistics', 'warehousing', 'distribution', 'fulfillment',
        'inventory management', 'demand planning', 'capacity planning',
        'manufacturing', 'production', 'assembly', 'quality control', 'qc', 'qa',
        'iso 9001', 'iso 14001', 'iso 27001', 'osha',
        'vendor management', 'supplier relations', 'contract negotiation',
        'fleet management', 'transportation', 'shipping', 'freight',
        'erp', 'sap', 'oracle', 'netsuite',
        'kpi', 'sla', 'metrics', 'dashboard', 'reporting',
        'business continuity', 'disaster recovery',
        'facilities management', 'space planning', 'maintenance',
    ]),

    // Data & Analytics
    data: new Set([
        'data analysis', 'data analytics', 'business intelligence', 'bi',
        'sql', 'excel', 'tableau', 'power bi', 'looker', 'metabase',
        'python', 'r', 'sas', 'spss', 'stata', 'matlab',
        'statistics', 'statistical analysis', 'hypothesis testing',
        'regression', 'classification', 'clustering', 'time series',
        'data visualization', 'data storytelling', 'dashboards',
        'data governance', 'data quality', 'data integrity',
        'database', 'data modeling', 'schema design',
        'reporting', 'ad hoc', 'self-service analytics',
        'a/b testing', 'experimentation', 'causal inference',
        'predictive analytics', 'prescriptive analytics',
    ]),
};

// ─── Certification Patterns (multi-industry) ─────────

const CERTIFICATION_PATTERNS = /\b(aws\s*(certified|solutions|developer|sysops|devops)|azure\s*(certified|fundamentals|administrator|developer)|gcp\s*(certified|associate|professional)|pmp|pmi|capm|prince2|itil|comptia\s*(a\+|network\+|security\+|cloud\+)|cissp|cism|cisa|ccna|ccnp|ccie|cka|ckad|scrum\s*master|csm|psm|cspo|safe|togaf|cpa|cfa|cfp|cma|acca|frm|series\s*\d+|finra|cphq|rn|bsn|msn|acls|bls|pals|phr|sphr|shrm|rhia|rhit|bar\s*exam|leed|osha\s*\d+|lean\s*six\s*sigma|black\s*belt|green\s*belt|yellow\s*belt|google\s*(analytics|ads)|hubspot|salesforce\s*(certified|administrator|developer)|tableau\s*(certified|desktop)|seo\s*cert)/i;

// ─── Tool & Platform Patterns (multi-industry) ───────

const TOOL_PATTERNS = /\b(jira|git|github|gitlab|docker|kubernetes|jenkins|slack|figma|sketch|notion|confluence|terraform|ansible|trello|asana|monday|clickup|basecamp|airtable|zapier|hubspot|salesforce|marketo|pardot|mailchimp|intercom|zendesk|freshdesk|servicenow|datadog|splunk|grafana|newrelic|pagerduty|tableau|power\s*bi|looker|metabase|excel|powerpoint|word|outlook|teams|zoom|google\s*(workspace|docs|sheets|slides|drive|meet|analytics|ads|search\s*console|tag\s*manager)|adobe\s*(creative\s*suite|photoshop|illustrator|indesign|premiere|after\s*effects|lightroom|xd|acrobat)|canva|wordpress|shopify|webflow|squarespace|wix|sap|oracle|netsuite|workday|bamboohr|adp|quickbooks|xero|stripe|paypal|twilio|sendgrid|aws|azure|gcp|heroku|vercel|netlify|firebase|supabase|postman|swagger|vs\s*code|intellij|pycharm|xcode|android\s*studio|vitest|jest|cypress|playwright|selenium|webpack|vite|rollup|turborepo)\b/i;

// ─── Methodology Patterns ────────────────────────────

const METHODOLOGY_PATTERNS = /\b(agile|scrum|kanban|waterfall|lean|six\s*sigma|kaizen|tqm|devops|devsecops|ci\/?cd|tdd|bdd|design\s*thinking|human[- ]centered\s*design|ux\s*research|a\/b\s*testing|okr|kpi|smart\s*goals|prince2|safe|less|crystal|xp|rapid\s*prototyping|mvp|product\s*discovery|sprint|standup|retrospective|backlog\s*grooming|user\s*stories)/i;

// ─── Section Detection (enhanced) ────────────────────

const SECTION_PATTERNS: { name: string; patterns: RegExp[] }[] = [
    {
        name: 'Contact Info',
        patterns: [
            /\b[\w.-]+@[\w.-]+\.\w+\b/,
            /\b\d{3}[-.]?\d{3}[-.]?\d{4}\b/,
            /\+\d{1,3}\s*\d/,
            /linkedin\.com/i,
            /github\.com/i,
            /portfolio|website|behance|dribbble/i,
        ]
    },
    {
        name: 'Professional Summary',
        patterns: [/\b(summary|objective|profile|about\s*me|professional\s*summary|career\s*summary|executive\s*summary|career\s*objective)\b/i]
    },
    {
        name: 'Work Experience',
        patterns: [/\b(experience|employment|work\s*history|professional\s*experience|career\s*history|relevant\s*experience)\b/i]
    },
    {
        name: 'Education',
        patterns: [/\b(education|academic|degree|university|college|bachelor|master|phd|diploma|coursework|gpa|honors|dean)/i]
    },
    {
        name: 'Skills',
        patterns: [/\b(skills|technologies|tech\s*stack|proficien|competenc|technical\s*skills|core\s*competencies|areas\s*of\s*expertise|key\s*skills|skill\s*set)/i]
    },
    {
        name: 'Projects',
        patterns: [/\b(projects?|portfolio|key\s*achievements|selected\s*works?)\b/i]
    },
    {
        name: 'Certifications',
        patterns: [/\b(certif|licens|credential|accredit|professional\s*development|training)/i]
    },
    {
        name: 'Awards & Publications',
        patterns: [/\b(awards?|honors?|publications?|papers?|patents?|recognit|achievements?)\b/i]
    },
    {
        name: 'Volunteer & Activities',
        patterns: [/\b(volunteer|community|extracurricular|activit|leadership\s*experience|organizations?|involvement)\b/i]
    },
];

// ─── Keyword Extraction (universal) ──────────────────

function extractKeywords(jdText: string): KeywordMatch[] {
    const text = jdText.toLowerCase();
    const wordFreq = new Map<string, number>();

    // Tokenize
    // Strip trailing punctuation from words (e.g., "applications." -> "applications")
    const cleanText = text.replace(/[^a-z0-9+#/.&\s-]/g, ' ');
    const words = cleanText.split(/\s+/)
        .map(w => w.replace(/^[^a-z0-9]+|[^a-z0-9+#]+$/g, '')) // remove leading/trailing punctuation except # and + (like c++, c#)
        .filter(w => w.length > 1);

    // 3-grams (for multi-word terms like "machine learning engineer")
    for (let i = 0; i < words.length - 2; i++) {
        const trigram = `${words[i]} ${words[i + 1]} ${words[i + 2]}`;
        wordFreq.set(trigram, (wordFreq.get(trigram) || 0) + 1);
    }

    // Bi-grams
    for (let i = 0; i < words.length - 1; i++) {
        const bigram = `${words[i]} ${words[i + 1]}`;
        wordFreq.set(bigram, (wordFreq.get(bigram) || 0) + 1);
    }

    // Unigrams
    for (const w of words) {
        wordFreq.set(w, (wordFreq.get(w) || 0) + 1);
    }

    // Expanded stop words (job posting boilerplate)
    const stopWords = new Set([
        'the', 'and', 'for', 'are', 'but', 'not', 'you', 'all', 'can', 'had',
        'her', 'was', 'one', 'our', 'out', 'day', 'get', 'has', 'him', 'his',
        'how', 'its', 'may', 'new', 'now', 'old', 'see', 'way', 'who', 'did',
        'got', 'let', 'say', 'she', 'too', 'use', 'with', 'have', 'this', 'will',
        'your', 'from', 'they', 'been', 'that', 'than', 'them', 'then', 'what',
        'when', 'make', 'like', 'time', 'just', 'know', 'take', 'come', 'year',
        'their', 'would', 'there', 'could', 'about', 'other', 'which', 'able',
        'work', 'role', 'must', 'should', 'will', 'also', 'such', 'into', 'over',
        'well', 'join', 'team', 'looking', 'looking for', 'including', 'working',
        'strong', 'required', 'requirements', 'preferred', 'experience', 'years',
        'minimum', 'plus', 'salary', 'benefits', 'location', 'responsible',
        'responsibilities', 'qualifications', 'apply', 'equal', 'opportunity',
        'employer', 'company', 'position', 'candidate', 'ideal', 'skills',
        'need', 'need to', 'want', 'help', 'more', 'most', 'very', 'much',
        'being', 'both', 'each', 'only', 'some', 'same', 'every', 'through',
        'between', 'while', 'during', 'before', 'after', 'above', 'below',
        'those', 'these', 'does', 'doing', 'done', 'been', 'were', 'being',
        'within', 'across', 'among', 'along', 'upon', 'based', 'related',
        'ability', 'proven', 'record', 'track', 'track record', 'ensure',
        'using', 'used', 'level', 'high', 'best', 'open', 'full', 'part',
        'great', 'good', 'relevant', 'demonstrate', 'demonstrated',
        'job', 'type', 'description', 'title', 'date', 'posted', 'deadline',
        "we're", "we'll", "you'll", "you're", "we've", 'etc', 'e.g', 'i.e',
        'build', 'building', 'create', 'creating', 'develop', 'developing',
        'maintain', 'maintaining', 'support', 'supporting', 'deliver', 'delivering',
        'design', 'designing', 'implement', 'implementing', 'environment', 'tools',
        'stack', 'status', 'various', 'multiple', 'complex', 'ensure', 'ensuring',
        'provide', 'providing', 'participate', 'participating', 'contribute', 'contributing',
        'excellent', 'understanding', 'knowledge', 'familiarity', 'to', 'in', 'of', 'is', 'on', 'at',
        'seeking', 'highly', 'setting', 'an', 'active', 'detailed', 'compassionate', 'collaborate'
    ]);

    // Build keyword list
    const keywords: KeywordMatch[] = [];
    const seen = new Set<string>();

    // Sort by frequency (higher = more important in JD)
    const sorted = [...wordFreq.entries()]
        .filter(([word]) => {
            const tokens = word.split(' ');
            if (tokens.length === 1) return !stopWords.has(tokens[0]);

            // For n-grams: 
            // - Ensure starting and ending words are NOT stop words.
            // - Reject if ANY word is purely punctuation/numbers.
            // This prevents "with python" or "designing the" from slipping through.
            const first = tokens[0];
            const last = tokens[tokens.length - 1];
            if (stopWords.has(first) || stopWords.has(last)) return false;

            // Reject if every token is a stop word (failsafe)
            if (tokens.every(t => stopWords.has(t))) return false;

            // Further strict filtering for n-grams to prevent phrases like "applications requirements 5+" 
            // or "technologies in" from passing
            const hasInnerStopWord = tokens.some(t => stopWords.has(t));
            if (hasInnerStopWord && tokens.length > 2) return false;

            return true;
        })
        .sort((a, b) => b[1] - a[1]);

    // Prefer longer multi-word matches (more specific)
    const addedSubstrings = new Set<string>();

    for (const [word, freq] of sorted) {
        if (seen.has(word)) continue;
        if (freq < 1) continue;

        // Skip if a longer phrase containing this word was already added
        if (word.split(' ').length === 1) {
            let isSubstring = false;
            for (const added of addedSubstrings) {
                if (added.includes(word)) { isSubstring = true; break; }
            }
            if (isSubstring) continue;
        }

        // Categorize using domain dictionaries
        const category = categorizeKeyword(word);

        // Filtering rules
        if (word.length < 2 && category === 'general') continue;
        if (word.split(' ').length === 1 && word.length < 3 && category === 'general') continue;

        // Keep if: it's a domain term, appears 2+ times, or is a multi-word phrase
        // BUT strict restriction: skip 'general' multi-word phrases that just made it through stopword filters
        if (category === 'general' && word.includes(' ') && !word.match(/^[a-z0-9+#]+ [a-z0-9+#]+$/)) continue;

        if (category !== 'general' || freq >= 2 || (word.includes(' ') && freq >= 1)) {
            seen.add(word);
            if (word.includes(' ')) addedSubstrings.add(word);
            keywords.push({ keyword: word, found: false, frequency: 0, category });
        }
    }

    return keywords.slice(0, 50);
}

function categorizeKeyword(word: string): KeywordMatch['category'] {
    // Check soft skills first (exact match)
    if (SOFT_SKILLS.has(word)) return 'soft';

    // Certifications
    if (CERTIFICATION_PATTERNS.test(word)) return 'certification';

    // Methodologies
    if (METHODOLOGY_PATTERNS.test(word)) return 'methodology';

    // Tools & platforms
    if (TOOL_PATTERNS.test(word)) return 'tool';

    // Check all domain dictionaries for direct matches
    for (const [, dict] of Object.entries(DOMAIN_KEYWORDS)) {
        if (dict.has(word)) return 'technical';
    }

    // Check partial domain matches (e.g. "react developer" contains "react")
    const wordTokens = word.split(' ');
    for (const token of wordTokens) {
        for (const [, dict] of Object.entries(DOMAIN_KEYWORDS)) {
            if (dict.has(token)) return 'domain';
        }
    }

    return 'general';
}

function matchKeywords(keywords: KeywordMatch[], resumeText: string): KeywordMatch[] {
    const resume = resumeText.toLowerCase();

    return keywords.map(kw => {
        const escaped = kw.keyword.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

        // Custom word boundary that allows for #, +, ., etc. in tech terms
        // e.g., Next.js, C++, C#
        const boundaryBefore = `(^|[^a-z0-9_+#.])`;
        const boundaryAfter = `([^a-z0-9_+#.]|$)`;

        // Allow basic plurals (s, es) for single word terms
        const pattern = kw.keyword.includes(' ')
            ? escaped
            : `${boundaryBefore}${escaped}(s|es)?${boundaryAfter}`;

        const regex = new RegExp(pattern, 'gi');
        const matches = resume.match(regex);

        return {
            ...kw,
            found: !!matches,
            frequency: matches?.length || 0,
        };
    });
}

// ─── Section Detection ───────────────────────────────

function detectSections(resumeText: string): SectionPresence[] {
    const text = resumeText;

    return SECTION_PATTERNS.map(({ name, patterns }) => {
        const matches = patterns.filter(p => p.test(text));

        if (matches.length === 0) {
            return { name, detected: false, quality: 'missing' as const, feedback: `No ${name} section detected` };
        }

        if (name === 'Contact Info') {
            const hasEmail = /[\w.-]+@[\w.-]+\.\w+/.test(text);
            const hasPhone = /\d{3}[-.]?\d{3}[-.]?\d{4}/.test(text) || /\+\d{1,3}\s*\d/.test(text);
            const hasLinkedIn = /linkedin\.com/i.test(text);
            const hasPortfolio = /github\.com|portfolio|behance|dribbble/i.test(text);
            const count = [hasEmail, hasPhone, hasLinkedIn, hasPortfolio].filter(Boolean).length;
            if (count >= 3) return { name, detected: true, quality: 'good' as const, feedback: `Found ${count}/4 contact elements — excellent` };
            if (count >= 2) return { name, detected: true, quality: 'good' as const, feedback: `Found ${count}/4 contact elements` };
            return { name, detected: true, quality: 'weak' as const, feedback: `Only ${count}/4 contact elements. Consider adding more.` };
        }

        if (name === 'Work Experience') {
            const expLines = text.split('\n').filter(l => /\d{4}\s*[-–]\s*(present|\d{4})/i.test(l));
            if (expLines.length >= 2) return { name, detected: true, quality: 'good' as const, feedback: `${expLines.length} positions with date ranges` };
            if (expLines.length === 1) return { name, detected: true, quality: 'weak' as const, feedback: 'Only 1 position detected. Add more experience or detail.' };
            return { name, detected: true, quality: 'weak' as const, feedback: 'Experience section found but no clear date ranges.' };
        }

        if (name === 'Education') {
            const hasDegree = /\b(bachelor|master|phd|associate|diploma|b\.?s\.?|b\.?a\.?|m\.?s\.?|m\.?a\.?|m\.?b\.?a\.?|b\.?tech|m\.?tech|b\.?e\.?|m\.?e\.?)\b/i.test(text);
            const hasInstitution = /\b(university|college|institute|school|academy)\b/i.test(text);
            if (hasDegree && hasInstitution) return { name, detected: true, quality: 'good' as const, feedback: 'Degree and institution present' };
            return { name, detected: true, quality: 'weak' as const, feedback: 'Education section found but may be incomplete. Include degree, institution, and year.' };
        }

        return { name, detected: true, quality: 'good' as const, feedback: `${name} section present` };
    });
}

// ─── Bullet Quality Analysis ─────────────────────────

function analyzeBullets(resumeText: string): BulletAnalysis {
    const lines = resumeText.split('\n').map(l => l.trim()).filter(l => l.length > 10);

    const bulletLines = lines.filter(l =>
        /^[-•*▪►→✓✔☑■◆▸]/.test(l) ||
        /^\d+[.)]\s/.test(l) ||
        (l.length > 20 && l.length < 300 && /^[A-Z]/.test(l) && !/:$/.test(l) && !/^(education|experience|skills|summary|objective|projects?|certif|awards?|volunteer)/i.test(l))
    );

    const totalBullets = bulletLines.length;

    const foundActionVerbs: string[] = [];
    let actionVerbBullets = 0;
    for (const bullet of bulletLines) {
        const firstWord = bullet.replace(/^[-•*▪►→✓✔☑■◆▸\d.)]\s*/, '').split(/\s+/)[0].toLowerCase();
        if (ACTION_VERBS.has(firstWord)) {
            actionVerbBullets++;
            if (!foundActionVerbs.includes(firstWord)) foundActionVerbs.push(firstWord);
        }
    }

    const foundMetrics: string[] = [];
    let quantifiedBullets = 0;
    for (const bullet of bulletLines) {
        const metricMatches = bullet.match(
            /\d+[%+]?\s*(?:users?|customers?|clients?|patients?|students?|members?|employees?|increase|decrease|revenue|reduction|improvement|faster|slower|hours?|days?|weeks?|months?|accounts?|deals?|leads?|tickets?|orders?|units?|projects?|transactions?|concurrent|annually|monthly|daily|weekly)?|\$[\d,.]+[KMBkmb]?|[£€¥]\s*[\d,.]+[KMBkmb]?/gi
        );
        if (metricMatches) {
            quantifiedBullets++;
            foundMetrics.push(...metricMatches.slice(0, 2));
        }
    }

    const avgBulletLength = totalBullets > 0
        ? Math.round(bulletLines.reduce((sum, b) => sum + b.length, 0) / totalBullets)
        : 0;

    return {
        totalBullets,
        actionVerbBullets,
        quantifiedBullets,
        avgBulletLength,
        actionVerbs: foundActionVerbs.slice(0, 12),
        metrics: [...new Set(foundMetrics)].slice(0, 10),
    };
}

// ─── Readability Metrics ─────────────────────────────

function analyzeReadability(resumeText: string) {
    const sentences = resumeText.split(/[.!?]+/).filter(s => s.trim().length > 5);
    const words = resumeText.split(/\s+/).filter(w => w.length > 0);
    const avgSentenceLength = sentences.length > 0
        ? Math.round(words.length / sentences.length)
        : 0;

    const hasSpecialChars = /[│\t═║╗╔╚╝┌┐└┘]/.test(resumeText);
    const hasTablesOrImages = /(<table|<img|!\[|<svg)/i.test(resumeText);

    return {
        avgSentenceLength,
        totalWords: words.length,
        hasSpecialChars,
        hasTablesOrImages,
    };
}

// ─── Format Metrics ──────────────────────────────────

function analyzeFormat(resumeText: string) {
    const datePatterns = resumeText.match(
        /\b(Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec|January|February|March|April|May|June|July|August|September|October|November|December)\s*\.?\s*\d{4}\b|\b\d{4}\s*[-–]\s*(present|current|\d{4})\b|\b\d{1,2}\/\d{4}\b|\b\d{1,2}\/\d{1,2}\/\d{2,4}\b/gi
    );
    const hasDates = !!datePatterns && datePatterns.length > 0;

    let dateConsistency = true;
    if (datePatterns && datePatterns.length > 2) {
        const formats = datePatterns.map(d => {
            if (/\b[A-Z][a-z]+\s+\d{4}/.test(d)) return 'MonthYear';
            if (/\d{1,2}\/\d{4}/.test(d)) return 'MM/YYYY';
            if (/\d{1,2}\/\d{1,2}\/\d{2,4}/.test(d)) return 'MM/DD/YYYY';
            if (/\d{4}\s*[-–]/.test(d)) return 'YYYY-range';
            return 'Other';
        });
        const uniqueFormats = new Set(formats);
        dateConsistency = uniqueFormats.size <= 2;
    }

    const words = resumeText.split(/\s+/).length;
    const estimatedPages = Math.ceil(words / 500);
    const hasProperLength = words >= 150 && words <= 1500;

    return {
        hasDates,
        dateConsistency,
        hasProperLength,
        wordCount: words,
        estimatedPages,
    };
}

// ─── Score Computation ───────────────────────────────

export function runATSAnalysis(resumeText: string, jobDescription: string): ATSEngineResult {
    // 1. Extract & match keywords
    const rawKeywords = extractKeywords(jobDescription);
    const keywords = matchKeywords(rawKeywords, resumeText);

    const matched = keywords.filter(k => k.found);
    const keywordScore = keywords.length > 0
        ? Math.round((matched.length / keywords.length) * 100)
        : 50;

    // 2. Section detection
    const sections = detectSections(resumeText);
    const detectedSections = sections.filter(s => s.detected);
    const goodSections = sections.filter(s => s.quality === 'good');
    const sectionScore = Math.round(
        (detectedSections.length / sections.length) * 70 +
        (goodSections.length / sections.length) * 30
    );

    // 3. Bullet quality
    const bulletAnalysis = analyzeBullets(resumeText);
    let bulletScore = 40; // Generous baseline for having any content
    if (bulletAnalysis.totalBullets >= 3) bulletScore += 8;
    if (bulletAnalysis.totalBullets >= 6) bulletScore += 7;
    if (bulletAnalysis.totalBullets >= 10) bulletScore += 5;
    if (bulletAnalysis.totalBullets >= 15) bulletScore += 5;
    if (bulletAnalysis.actionVerbBullets >= 1) bulletScore += 5;
    if (bulletAnalysis.actionVerbBullets >= 3) bulletScore += 7;
    if (bulletAnalysis.actionVerbBullets >= 5) bulletScore += 8;
    if (bulletAnalysis.quantifiedBullets >= 1) bulletScore += 5;
    if (bulletAnalysis.quantifiedBullets >= 3) bulletScore += 5;
    if (bulletAnalysis.avgBulletLength >= 25 && bulletAnalysis.avgBulletLength <= 180) bulletScore += 5;
    bulletScore = Math.min(100, bulletScore);

    // 4. Readability
    const readabilityMetrics = analyzeReadability(resumeText);
    let readabilityScore = 65;
    if (readabilityMetrics.avgSentenceLength < 25) readabilityScore += 15;
    else if (readabilityMetrics.avgSentenceLength < 35) readabilityScore += 5;
    if (readabilityMetrics.avgSentenceLength > 40) readabilityScore -= 20;
    if (readabilityMetrics.hasSpecialChars) readabilityScore -= 15;
    if (readabilityMetrics.hasTablesOrImages) readabilityScore -= 20;
    if (readabilityMetrics.totalWords >= 200 && readabilityMetrics.totalWords <= 1000) readabilityScore += 15;
    else if (readabilityMetrics.totalWords >= 100) readabilityScore += 5;
    readabilityScore = Math.max(0, Math.min(100, readabilityScore));

    // 5. Format
    const formatMetrics = analyzeFormat(resumeText);
    let formatScore = 50; // Generous baseline
    if (formatMetrics.hasDates) formatScore += 15;
    if (formatMetrics.dateConsistency) formatScore += 10;
    if (formatMetrics.hasProperLength) formatScore += 20;
    if (formatMetrics.estimatedPages <= 2) formatScore += 5;
    formatScore = Math.min(100, formatScore);

    // Weighted overall score
    const overallScore = Math.round(
        keywordScore * 0.35 +
        sectionScore * 0.20 +
        bulletScore * 0.15 +
        readabilityScore * 0.15 +
        formatScore * 0.15
    );

    return {
        overallScore,
        keywordScore,
        sectionScore,
        bulletScore,
        readabilityScore,
        formatScore,
        keywords,
        sections,
        bulletAnalysis,
        readabilityMetrics,
        formatMetrics,
    };
}
