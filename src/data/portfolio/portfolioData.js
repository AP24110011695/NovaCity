const EDUCATION_TIMELINE = [
  {
    id: 'btech-cse',
    institution: 'Computer Science & Engineering Program',
    degree: 'Bachelor of Technology in Computer Science Engineering',
    duration: '2022 - Present',
    cgpa: 'In progress',
    coursework: ['Data Structures', 'Algorithms', 'Database Systems', 'Web Technologies', 'Artificial Intelligence'],
    description: 'Developing a strong foundation in software engineering while applying it through full-stack, AI, and immersive web projects.',
  },
];

/**
 * Portfolio content is intentionally kept separate from the hologram UI so
 * additional tower sections can be enabled without embedding content in views.
 */
export const portfolioData = {
  projects: [
    {
      id: 'nova-city',
      title: 'Nova City',
      description: 'An interactive cinematic portfolio that turns a first civilization beyond Earth into an explorable 3D experience.',
      technologies: ['React', 'Three.js', 'React Three Fiber', 'GSAP'],
      githubUrl: 'https://github.com/AP24110011695/NovaCity',
      demoUrl: null,
      status: 'Active development',
      featured: true,
    },
    {
      id: 'studymate-ai',
      title: 'StudyMate AI',
      description: 'An AI-powered study workspace for PDF conversations, smart notes, and adaptive quiz generation.',
      technologies: ['React', 'Node.js', 'AI', 'PDF Processing'],
      githubUrl: 'https://github.com/AP24110011695',
      demoUrl: null,
      status: 'In research',
      featured: false,
    },
    {
      id: 'smart-data-analytics',
      title: 'Smart Data Analytics',
      description: 'A customer review analytics platform that combines visual reporting with AI-assisted insight discovery.',
      technologies: ['Python', 'Pandas', 'Data Visualization', 'AI'],
      githubUrl: 'https://github.com/AP24110011695',
      demoUrl: null,
      status: 'Completed',
      featured: false,
    },
  ],
  skills: [
    { id: 'react', icon: 'react', name: 'React', category: 'Frontend', proficiency: 'Advanced', years: 3, description: 'Component-driven interfaces and application architecture.' },
    { id: 'threejs', icon: 'cube', name: 'Three.js', category: 'Frontend', proficiency: 'Intermediate', years: 1, description: 'Interactive 3D scenes, shaders, and immersive web experiences.' },
    { id: 'tailwind', icon: 'style', name: 'Tailwind CSS', category: 'Frontend', proficiency: 'Advanced', years: 2, description: 'Responsive interfaces built with purposeful design systems.' },
    { id: 'nodejs', icon: 'server', name: 'Node.js', category: 'Backend', proficiency: 'Advanced', years: 2, description: 'Scalable APIs, services, and full-stack application backends.' },
    { id: 'express', icon: 'api', name: 'Express.js', category: 'Backend', proficiency: 'Advanced', years: 2, description: 'RESTful services with structured routing and middleware.' },
    { id: 'javascript', icon: 'code', name: 'JavaScript', category: 'Programming Languages', proficiency: 'Advanced', years: 3, description: 'Modern ES modules, asynchronous patterns, and browser APIs.' },
    { id: 'python', icon: 'terminal', name: 'Python', category: 'Programming Languages', proficiency: 'Intermediate', years: 2, description: 'Data workflows, automation, and applied AI experiments.' },
    { id: 'cpp', icon: 'brackets', name: 'C++', category: 'Programming Languages', proficiency: 'Intermediate', years: 2, description: 'Core programming concepts, data structures, and algorithms.' },
    { id: 'mongodb', icon: 'database', name: 'MongoDB', category: 'Databases', proficiency: 'Intermediate', years: 2, description: 'Document modeling and data access for web applications.' },
    { id: 'sql', icon: 'database', name: 'SQL', category: 'Databases', proficiency: 'Intermediate', years: 2, description: 'Relational queries, schemas, and data analysis.' },
    { id: 'pandas', icon: 'chart', name: 'Pandas', category: 'AI / ML', proficiency: 'Intermediate', years: 1, description: 'Data cleaning, exploration, and analytics pipelines.' },
    { id: 'ai-integration', icon: 'spark', name: 'AI Integration', category: 'AI / ML', proficiency: 'Intermediate', years: 1, description: 'Product-focused AI features and intelligent user workflows.' },
    { id: 'firebase', icon: 'cloud', name: 'Firebase', category: 'Cloud', proficiency: 'Intermediate', years: 1, description: 'Hosted application services, authentication, and deployment.' },
    { id: 'git', icon: 'branch', name: 'Git & GitHub', category: 'Tools', proficiency: 'Advanced', years: 3, description: 'Version control, collaboration, and repository workflows.' },
    { id: 'vite', icon: 'bolt', name: 'Vite', category: 'Tools', proficiency: 'Advanced', years: 2, description: 'Fast development environments and optimized web builds.' },
    { id: 'figma', icon: 'layout', name: 'Figma', category: 'Tools', proficiency: 'Intermediate', years: 1, description: 'Interface exploration and developer-ready design handoff.' },
    { id: 'rest-api', icon: 'network', name: 'REST APIs', category: 'Other', proficiency: 'Advanced', years: 2, description: 'Clear client-server contracts and third-party integrations.' },
  ],
  experience: [
    {
      id: 'personal-projects',
      company: 'Personal Projects',
      role: 'AI & Full-Stack Developer',
      duration: '2025 - Present',
      location: 'Remote',
      technologies: ['React', 'Node.js', 'MongoDB', 'Three.js', 'AI'],
      responsibilities: ['Design and ship AI-powered web experiences', 'Build immersive 3D interfaces and full-stack workflows'],
      achievements: ['Created Nova City, a cinematic portfolio experience', 'Developed product prototypes across web and data domains'],
    },
    {
      id: 'academic-projects',
      company: 'Academic Projects',
      role: 'Software Developer',
      duration: '2024 - Present',
      location: 'India',
      technologies: ['JavaScript', 'Python', 'SQL', 'REST APIs'],
      responsibilities: ['Translate coursework into production-style applications', 'Collaborate through version-controlled development workflows'],
      achievements: ['Delivered projects spanning databases, analytics, and web technologies'],
    },
  ],
  internships: [
    {
      id: 'internship-readiness',
      company: 'Internship Readiness Program',
      role: 'Software Development Trainee',
      duration: '2025',
      location: 'Remote',
      technologies: ['React', 'Git', 'REST APIs'],
      responsibilities: ['Practice production-oriented development through focused project work', 'Strengthen collaboration, communication, and delivery habits'],
      achievements: ['Built a portfolio of deployable full-stack and interactive web projects'],
    },
  ],
  education: EDUCATION_TIMELINE,
  certifications: [
    { id: 'web-development', issuer: 'Professional Learning Track', title: 'Modern Web Development', completionDate: '2025', credentialId: 'Available on request', verificationUrl: null, badge: 'WEB', description: 'Focused study in modern web application design and development workflows.' },
    { id: 'ai-foundations', issuer: 'Applied AI Learning Track', title: 'AI Foundations', completionDate: '2025', credentialId: 'Available on request', verificationUrl: null, badge: 'AI', description: 'Foundational study in applied artificial intelligence and product integration.' },
  ],
  achievements: [
    { id: 'immersive-portfolio', icon: '◇', title: 'Immersive Portfolio', description: 'Designed and built a cinematic, interactive 3D portfolio experience.', date: '2025' },
    { id: 'full-stack-builder', icon: '◈', title: 'Full-Stack Builder', description: 'Delivered projects across frontend, backend, data, and AI workflows.', date: '2025' },
    { id: 'continuous-learning', icon: '✦', title: 'Continuous Learning', description: 'Built a practice of turning new technical concepts into working prototypes.', date: 'Ongoing' },
  ],
  timeline: EDUCATION_TIMELINE,
  contact: {
    email: 'ayushkumarsaha32@gmail.com',
    location: 'India',
    portfolioUrl: 'https://github.com/AP24110011695/NovaCity',
  },
  socialLinks: [
    { id: 'linkedin', label: 'LinkedIn', icon: 'in', url: 'https://linkedin.com/in/ayush-kumar-saha' },
    { id: 'github', label: 'GitHub', icon: 'gh', url: 'https://github.com/AP24110011695' },
    { id: 'portfolio', label: 'Portfolio', icon: '◈', url: 'https://github.com/AP24110011695/NovaCity' },
  ],
  resume: {
    url: '/resume.html',
    label: 'Resume',
    summary: 'Full-stack developer and AI enthusiast focused on modern, high-impact web experiences.',
    skillsOverview: ['React & JavaScript', 'Node.js & APIs', 'Python & Data', 'Three.js & GSAP'],
    recruiterCta: 'Open to internship and early-career software development opportunities.',
  },
};

export const innovationTowerPortfolio = {
  projects: portfolioData.projects,
};

export const researchNexusPortfolio = {
  skills: portfolioData.skills,
};

export const academySpirePortfolio = {
  education: portfolioData.education,
  certifications: portfolioData.certifications,
  achievements: portfolioData.achievements,
  timeline: portfolioData.timeline,
};

export const corporateHubPortfolio = {
  experience: portfolioData.experience,
  internships: portfolioData.internships,
  resume: portfolioData.resume,
  contact: portfolioData.contact,
  socialLinks: portfolioData.socialLinks,
};
