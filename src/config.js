// ============================================================
//  EDIT YOUR CONTENT HERE — everything on the site reads from
//  this file. Content sourced from LinkedIn (Jul 2026).
// ============================================================

export const site = {
  name: 'Saifullah Muhamad',
  role: 'AI-Driven Engineer',
  tagline: 'I turn manual QA into self-healing robots.',
  location: 'Selangor, Malaysia',
  email: 'mrsaifullahmuhamad23@gmail.com',
  resumeUrl: '#', // link to your CV PDF
  socials: {
    linkedin: 'https://www.linkedin.com/in/saifullah-muhamad-4437211ba/',
    github: '#', // TODO: add your GitHub profile
    whatsapp: '#', // TODO: add wa.me link if you want
  },
}

export const about = {
  heading: 'From requirements to release — I own the whole loop.',
  body: [
    'I\'ve spent 4+ years across the full SDLC — as a System Analyst writing URS/SRS/SDS specs, as a Business Analyst getting government eProcurement modules through UAT and sign-off, and as the founder of a software house shipping client-ready systems end to end.',
    'That analyst\'s eye for how systems break is now pointed at automation: I build AI-assisted test suites with Appium and Playwright — regression tests that self-heal when the UI shifts, instead of waking someone up to babysit them.',
  ],
  stats: [
    { value: '4+', label: 'Years across the SDLC' },
    { value: '4', label: 'Organisations served' },
    { value: '1', label: 'Software house founded' },
    { value: 'E2E', label: 'Requirements → release' },
  ],
}

export const expertise = [
  {
    title: 'Mobile Automation',
    tool: 'Appium',
    desc: 'End-to-end mobile test automation for Android & iOS — gestures, real devices, cross-platform flows.',
    tags: ['Android', 'iOS', 'Real devices', 'Cross-platform'],
  },
  {
    title: 'Web Automation',
    tool: 'Playwright',
    desc: 'Fast, flake-resistant web E2E tests with auto-waits, network mocking, and parallel execution.',
    tags: ['E2E', 'Parallel', 'Network mock', 'Trace viewer'],
  },
  {
    title: 'UAT, PAT & FAT',
    tool: 'Quality process',
    desc: 'Planned and ran acceptance testing for government and enterprise systems — test scripts, bug tracking, user training, and SME sign-off.',
    tags: ['UAT sessions', 'Test scripts', 'Bug tracking', 'Sign-off'],
  },
  {
    title: 'Business & System Analysis',
    tool: 'URS · SRS · SDS',
    desc: 'Requirements gathering, functional specs, and low-fidelity prototyping in Figma — the analyst\'s eye that knows where systems break.',
    tags: ['Requirements', 'Figma', 'SAP ERP', 'Stakeholders'],
  },
]

export const projects = [
  {
    name: 'ePPP — Government eProcurement',
    blurb: 'Business Analyst on a national eProcurement platform: ran UAT sessions for the Perolehan module with end users and secured SME sign-off for the Perkhidmatan module.',
    stack: ['UAT', 'Test scripts', 'Stakeholder management'],
    link: '#',
  },
  {
    name: 'Tealaga Ventures — Software House',
    blurb: 'Founder of an outsourced SDLC hub delivering government eProcurement systems, customised ERP modules, and high-fidelity mobile prototypes — from requirements to deployment.',
    stack: ['Full SDLC', 'SAP ERP', 'Project management'],
    link: '#',
  },
  {
    name: 'Enterprise Systems — Pipeline Network',
    blurb: 'System Analyst across two years of enterprise projects: URS/SRS/SDS documentation, Figma prototypes, UAT/PAT/FAT cycles, user training, and testing scripts.',
    stack: ['URS/SRS/SDS', 'Figma', 'UAT/PAT/FAT'],
    link: '#',
  },
  {
    name: 'Self-Healing Test Lab',
    blurb: 'Ongoing R&D: Appium + Playwright suites with AI-assisted locators that recover from UI changes automatically — the future of regression testing.',
    stack: ['Appium', 'Playwright', 'AI locators'],
    link: '#',
  },
]

export const techStack = [
  'Appium', 'Playwright', 'Selenium',
  'JavaScript', 'TypeScript', 'Python', 'Java',
  'Figma', 'SAP ERP', 'Jira', 'Excel',
  'GitHub Actions', 'Docker', 'Git',
]
