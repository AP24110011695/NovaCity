import { portfolioData } from './portfolio/portfolioData';

const destination = (buildingId, districtId, section) => ({ buildingId, districtId, section });

export const createSearchIndex = (data = portfolioData) => [
  ...data.projects.map((project) => ({ id: `project-${project.id}`, icon: '◇', title: project.title, subtitle: project.description, category: 'Projects', destination: destination('landmark-innovation', 'district-commercial', 'projects') })),
  ...data.skills.map((skill) => ({ id: `skill-${skill.id}`, icon: '◌', title: skill.name, subtitle: `${skill.category} · ${skill.proficiency}`, category: 'Skills', destination: destination('landmark-research', 'district-research', 'skills') })),
  ...data.education.map((education) => ({ id: `education-${education.id}`, icon: '◇', title: education.degree, subtitle: education.institution, category: 'Education', destination: destination('landmark-academy', 'district-residential', 'education') })),
  ...data.certifications.map((certification) => ({ id: `certification-${certification.id}`, icon: '✦', title: certification.title, subtitle: certification.issuer, category: 'Certifications', destination: destination('landmark-academy', 'district-residential', 'education') })),
  ...data.experience.map((experience) => ({ id: `experience-${experience.id}`, icon: '▣', title: experience.role, subtitle: experience.company, category: 'Experience', destination: destination('landmark-corporate', 'district-industrial', 'experience') })),
  ...data.internships.map((internship) => ({ id: `internship-${internship.id}`, icon: '▣', title: internship.role, subtitle: internship.company, category: 'Internships', destination: destination('landmark-corporate', 'district-industrial', 'experience') })),
  { id: 'resume', icon: '≡', title: data.resume.label, subtitle: data.resume.summary, category: 'Resume', destination: destination('landmark-corporate', 'district-industrial', 'resume') },
  { id: 'contact', icon: '@', title: data.contact.email, subtitle: data.contact.location, category: 'Contact', destination: destination('landmark-corporate', 'district-industrial', 'contact') },
];

export const filterSearchIndex = (items, query) => {
  const normalizedQuery = query.trim().toLocaleLowerCase();
  if (!normalizedQuery) return items;
  return items.filter((item) => [item.title, item.subtitle, item.category].some((value) => value.toLocaleLowerCase().includes(normalizedQuery)));
};
