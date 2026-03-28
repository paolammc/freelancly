// Predefined skills for tech freelancers (UX Designers, UX Engineers, Software Developers)
export const TECH_SKILLS = [
  // Programming Languages
  "JavaScript",
  "TypeScript",
  "Python",
  "Java",
  "C#",
  "C++",
  "Go",
  "Rust",
  "Ruby",
  "PHP",
  "Swift",
  "Kotlin",
  "Scala",
  "R",
  "SQL",
  "HTML",
  "CSS",
  "Sass",
  "LESS",

  // Frontend Frameworks & Libraries
  "React",
  "Next.js",
  "Vue.js",
  "Nuxt.js",
  "Angular",
  "Svelte",
  "SvelteKit",
  "Remix",
  "Astro",
  "Solid.js",
  "jQuery",
  "Redux",
  "Zustand",
  "TanStack Query",
  "GraphQL",

  // CSS & Styling
  "Tailwind CSS",
  "Bootstrap",
  "Material UI",
  "Chakra UI",
  "Styled Components",
  "Emotion",
  "Framer Motion",
  "GSAP",
  "CSS Animations",
  "Responsive Design",

  // Backend & APIs
  "Node.js",
  "Express.js",
  "NestJS",
  "FastAPI",
  "Django",
  "Flask",
  "Ruby on Rails",
  "Spring Boot",
  "ASP.NET",
  "Laravel",
  "REST APIs",
  "GraphQL APIs",
  "tRPC",
  "WebSockets",
  "Microservices",

  // Databases
  "PostgreSQL",
  "MySQL",
  "MongoDB",
  "Redis",
  "SQLite",
  "Firebase",
  "Supabase",
  "Prisma",
  "Drizzle",
  "DynamoDB",
  "Elasticsearch",

  // Cloud & DevOps
  "AWS",
  "Google Cloud",
  "Azure",
  "Vercel",
  "Netlify",
  "Docker",
  "Kubernetes",
  "CI/CD",
  "GitHub Actions",
  "Terraform",
  "Linux",

  // Mobile Development
  "React Native",
  "Flutter",
  "iOS Development",
  "Android Development",
  "Expo",
  "Swift UI",
  "Jetpack Compose",

  // UX/UI Design
  "Figma",
  "Sketch",
  "Adobe XD",
  "InVision",
  "Framer",
  "Principle",
  "Zeplin",
  "Abstract",
  "Miro",
  "FigJam",

  // UX Research & Strategy
  "User Research",
  "Usability Testing",
  "A/B Testing",
  "User Interviews",
  "Surveys",
  "Personas",
  "User Journey Mapping",
  "Information Architecture",
  "Card Sorting",
  "Heuristic Evaluation",

  // UX Skills
  "Wireframing",
  "Prototyping",
  "Interaction Design",
  "Visual Design",
  "Design Systems",
  "Component Libraries",
  "Accessibility (WCAG)",
  "Mobile-First Design",
  "Design Tokens",
  "Atomic Design",

  // Design Tools & Methods
  "Adobe Creative Suite",
  "Photoshop",
  "Illustrator",
  "After Effects",
  "Premiere Pro",
  "Canva",
  "Lottie Animations",
  "SVG Animation",
  "3D Design",
  "Blender",

  // Product & Management
  "Agile",
  "Scrum",
  "Kanban",
  "Jira",
  "Asana",
  "Trello",
  "Linear",
  "Notion",
  "Product Strategy",
  "Roadmapping",

  // Testing
  "Jest",
  "Vitest",
  "Cypress",
  "Playwright",
  "React Testing Library",
  "Unit Testing",
  "E2E Testing",
  "Test-Driven Development",

  // AI & Data
  "Machine Learning",
  "OpenAI API",
  "LangChain",
  "TensorFlow",
  "PyTorch",
  "Data Analysis",
  "Data Visualization",
  "Pandas",
  "NumPy",

  // Other Technical Skills
  "Git",
  "GitHub",
  "GitLab",
  "Bitbucket",
  "VS Code",
  "Vim",
  "Terminal/CLI",
  "API Integration",
  "OAuth",
  "JWT",
  "WebRTC",
  "PWA",
  "SEO",
  "Performance Optimization",
  "Web Security",
  "Authentication",
  "Stripe Integration",
  "Payment Systems",
  "CMS Development",
  "WordPress",
  "Shopify",
  "Webflow",
  "Sanity",
  "Contentful",
  "Storybook",
  "Monorepos",
  "Turborepo",
  "pnpm",
] as const;

export type TechSkill = (typeof TECH_SKILLS)[number];

export const MAX_SKILLS = 10;

// Helper function to search skills
export function searchSkills(query: string): string[] {
  if (!query.trim()) return [];

  const normalizedQuery = query.toLowerCase().trim();

  return TECH_SKILLS.filter((skill) =>
    skill.toLowerCase().includes(normalizedQuery)
  ).slice(0, 10); // Limit suggestions to 10
}
