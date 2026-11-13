import { addDays, setHours, setMinutes } from 'date-fns';
import type {
  Activity,
  AppNotification,
  Customer,
  Deal,
  Lead,
  LeadStatus,
  Task,
  User,
} from '@/types';

/** Deterministic PRNG so the demo data is stable between reloads. */
const mulberry32 = (seed: number) => () => {
  let t = (seed += 0x6d2b79f5);
  t = Math.imul(t ^ (t >>> 15), t | 1);
  t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
  return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
};

const at = (days: number, hour = 10, min = 0) =>
  setMinutes(setHours(addDays(new Date(), days), hour), min).toISOString();

const defaultPrefs = {
  emailAlerts: true,
  leadAssignments: true,
  taskReminders: true,
  meetingReminders: true,
  weeklyDigest: false,
};

export const buildUsers = (): User[] => [
  {
    id: 'u1', name: 'Arjun Mehta', email: 'manager@enterprisecrm.com', password: 'Manager@123', role: 'manager',
    phone: '+1 415 555 0142', title: 'Head of Sales', department: 'Sales', timezone: 'America/Los_Angeles',
    bio: 'Leads the enterprise sales team and owns quarterly revenue targets.', monthlyTarget: 120000,
    joinedAt: at(-1260), preferences: { ...defaultPrefs, weeklyDigest: true },
  },
  {
    id: 'u2', name: 'Sofia Alvarez', email: 'sales@enterprisecrm.com', password: 'Sales@123', role: 'sales_rep',
    phone: '+1 512 555 0188', title: 'Senior Account Executive', department: 'Sales', timezone: 'America/Chicago',
    bio: 'Focused on mid-market software and logistics accounts. Loves a clean pipeline.', monthlyTarget: 60000,
    joinedAt: at(-730), preferences: { ...defaultPrefs },
  },
  {
    id: 'u3', name: 'Daniel Kim', email: 'daniel@enterprisecrm.com', password: 'Sales@123', role: 'sales_rep',
    phone: '+1 303 555 0119', title: 'Account Executive', department: 'Sales', timezone: 'America/Denver',
    bio: 'Education and retail accounts.', monthlyTarget: 50000, joinedAt: at(-420), preferences: { ...defaultPrefs },
  },
  {
    id: 'u4', name: 'Meera Iyer', email: 'employee@enterprisecrm.com', password: 'Employee@123', role: 'employee',
    phone: '+91 98765 43210', title: 'Sales Operations Associate', department: 'Operations', timezone: 'Asia/Kolkata',
    bio: 'Keeps follow-ups, documentation and customer records tidy.', monthlyTarget: 0, joinedAt: at(-300),
    preferences: { ...defaultPrefs },
  },
  {
    id: 'u5', name: "Liam O'Connor", email: 'liam@enterprisecrm.com', password: 'Employee@123', role: 'employee',
    phone: '+44 20 7946 0958', title: 'Customer Success Associate', department: 'Customer Success',
    timezone: 'Europe/London', bio: 'Onboarding and renewals support.', monthlyTarget: 0, joinedAt: at(-210),
    preferences: { ...defaultPrefs },
  },
];

export const buildCustomers = (): Customer[] => [
  { id: 'c1', name: 'Helena Brooks', company: 'Aurora Systems', email: 'helena@aurorasystems.io', phone: '+1 512 555 0101', industry: 'Software', location: 'Austin, TX', website: 'aurorasystems.io', status: 'active', ownerId: 'u2', tags: ['Enterprise', 'Upsell'], notes: 'Champion for the platform rollout. Prefers email summaries after every call.', since: at(-540) },
  { id: 'c2', name: 'Marcus Chen', company: 'Northwind Logistics', email: 'marcus@northwind.co', phone: '+1 312 555 0123', industry: 'Logistics', location: 'Chicago, IL', website: 'northwind.co', status: 'active', ownerId: 'u2', tags: ['Mid-market'], notes: 'Expanding into two new regional warehouses next quarter.', since: at(-390) },
  { id: 'c3', name: 'Priya Raman', company: 'Helix Health', email: 'priya@helixhealth.org', phone: '+1 617 555 0176', industry: 'Healthcare', location: 'Boston, MA', website: 'helixhealth.org', status: 'at_risk', ownerId: 'u2', tags: ['Compliance', 'Renewal'], notes: 'Usage dropped 22% last month. Needs an exec check-in.', since: at(-610) },
  { id: 'c4', name: 'Tom Reyes', company: 'BrightPath Education', email: 'tom@brightpath.edu', phone: '+1 720 555 0165', industry: 'Education', location: 'Denver, CO', website: 'brightpath.edu', status: 'active', ownerId: 'u3', tags: ['Campus'], notes: 'Budget cycle closes in January.', since: at(-250) },
  { id: 'c5', name: 'Ayesha Khan', company: 'Vertex Energy', email: 'ayesha@vertexenergy.com', phone: '+1 713 555 0190', industry: 'Energy', location: 'Houston, TX', website: 'vertexenergy.com', status: 'active', ownerId: 'u2', tags: ['Enterprise', 'Renewal'], notes: 'Annual renewal approaching. Procurement requires a security review.', since: at(-800) },
  { id: 'c6', name: 'Carla Souza', company: 'Lumen Retail Group', email: 'carla@lumenretail.com', phone: '+1 305 555 0144', industry: 'Retail', location: 'Miami, FL', website: 'lumenretail.com', status: 'inactive', ownerId: 'u3', tags: ['Win-back'], notes: 'Churned in Q2 after leadership change.', since: at(-500) },
  { id: 'c7', name: 'Nikhil Rao', company: 'Orbit Fintech', email: 'nikhil@orbitfin.io', phone: '+91 80 5550 1177', industry: 'Fintech', location: 'Bengaluru, IN', website: 'orbitfin.io', status: 'active', ownerId: 'u1', tags: ['Strategic'], notes: 'Executive sponsor of the integration project.', since: at(-320) },
  { id: 'c8', name: 'Sarah Whitfield', company: 'Meridian Media', email: 'sarah@meridianmedia.co.uk', phone: '+44 20 7946 0321', industry: 'Media', location: 'London, UK', website: 'meridianmedia.co.uk', status: 'active', ownerId: 'u2', tags: ['Pilot'], notes: 'Pilot approved by marketing; waiting on legal.', since: at(-150) },
  { id: 'c9', name: 'Johan Berg', company: 'Ironclad Manufacturing', email: 'johan@ironclad.se', phone: '+46 8 555 0192', industry: 'Manufacturing', location: 'Stockholm, SE', website: 'ironclad.se', status: 'at_risk', ownerId: 'u3', tags: ['Retention'], notes: 'Competitor demo scheduled on their side.', since: at(-700) },
  { id: 'c11', name: 'Rhea Banerjee', company: 'Lotus Wellness', email: 'rhea@lotuswellness.in', phone: '+91 20 5550 3345', industry: 'Healthcare', location: 'Pune, IN', website: 'lotuswellness.in', status: 'active', ownerId: 'u4', tags: ['SMB'], notes: 'Small clinic chain, onboarding in progress.', since: at(-70) },
  { id: 'c12', name: 'Gareth Hughes', company: 'Brecon Outdoor', email: 'gareth@breconoutdoor.co.uk', phone: '+44 29 5550 8821', industry: 'Retail', location: 'Cardiff, UK', website: 'breconoutdoor.co.uk', status: 'active', ownerId: 'u5', tags: ['Renewal'], notes: 'Renewal in six weeks. Happy with support.', since: at(-330) },
  { id: 'c10', name: 'Elena Petrova', company: 'Skyline Realty', email: 'elena@skylinerealty.ae', phone: '+971 4 555 0134', industry: 'Real estate', location: 'Dubai, UAE', website: 'skylinerealty.ae', status: 'active', ownerId: 'u1', tags: ['New logo'], notes: 'Fast mover; decision maker is the COO.', since: at(-90) },
];

const DEAL_TITLES = ['Platform licence', 'Annual renewal', 'Analytics add-on', 'Seat expansion', 'Onboarding bundle', 'Premium support', 'Integration suite', 'Training package'];

export const buildDeals = (customers: Customer[]): Deal[] => {
  const open: Deal[] = [
    { id: 'd1', title: 'Platform expansion', customerId: 'c1', value: 48000, stage: 'negotiation', probability: 75, ownerId: 'u2', expectedClose: at(9), createdAt: at(-48) },
    { id: 'd2', title: 'Fleet analytics add-on', customerId: 'c2', value: 26500, stage: 'proposal', probability: 55, ownerId: 'u2', expectedClose: at(16), createdAt: at(-30) },
    { id: 'd3', title: 'Compliance module', customerId: 'c3', value: 72000, stage: 'qualification', probability: 30, ownerId: 'u2', expectedClose: at(35), createdAt: at(-14) },
    { id: 'd4', title: 'Annual renewal 2027', customerId: 'c5', value: 39000, stage: 'negotiation', probability: 80, ownerId: 'u2', expectedClose: at(21), createdAt: at(-40) },
    { id: 'd5', title: 'Content hub pilot', customerId: 'c8', value: 18000, stage: 'prospecting', probability: 10, ownerId: 'u2', expectedClose: at(45), createdAt: at(-6) },
    { id: 'd6', title: 'Premium support tier', customerId: 'c1', value: 12400, stage: 'proposal', probability: 55, ownerId: 'u2', expectedClose: at(12), createdAt: at(-20) },
    { id: 'd7', title: 'Campus rollout', customerId: 'c4', value: 54000, stage: 'proposal', probability: 50, ownerId: 'u3', expectedClose: at(28), createdAt: at(-33) },
    { id: 'd8', title: 'Win-back package', customerId: 'c6', value: 21000, stage: 'qualification', probability: 25, ownerId: 'u3', expectedClose: at(40), createdAt: at(-12) },
    { id: 'd9', title: 'Retention bundle', customerId: 'c9', value: 33000, stage: 'negotiation', probability: 70, ownerId: 'u3', expectedClose: at(14), createdAt: at(-36) },
    { id: 'd10', title: 'API integration suite', customerId: 'c7', value: 61000, stage: 'proposal', probability: 55, ownerId: 'u1', expectedClose: at(25), createdAt: at(-27) },
    { id: 'd11', title: 'CRM onboarding', customerId: 'c10', value: 15500, stage: 'prospecting', probability: 10, ownerId: 'u1', expectedClose: at(50), createdAt: at(-4) },
    { id: 'd12', title: 'Warehouse module', customerId: 'c2', value: 29000, stage: 'prospecting', probability: 15, ownerId: 'u2', expectedClose: at(55), createdAt: at(-2) },
    { id: 'd14', title: 'Starter plan', customerId: 'c11', value: 12000, stage: 'qualification', probability: 30, ownerId: 'u4', expectedClose: at(30), createdAt: at(-9) },
    { id: 'd15', title: 'Renewal bundle', customerId: 'c12', value: 9500, stage: 'proposal', probability: 55, ownerId: 'u5', expectedClose: at(20), createdAt: at(-15) },
    { id: 'd13', title: 'Pilot extension', customerId: 'c3', value: 14000, stage: 'lost', probability: 0, ownerId: 'u2', expectedClose: at(-20), createdAt: at(-70), closedAt: at(-20) },
  ];

  const rand = mulberry32(42);
  const generated: Deal[] = [];
  const owners: [string, number, number][] = [['u2', 1.6, 1], ['u3', 1.2, 0.8], ['u1', 1, 1.6]];
  let n = 100;
  owners.forEach(([ownerId, perMonth, scale]) => {
    const pool = customers.filter((c) => c.ownerId === ownerId);
    for (let m = 0; m < 12; m += 1) {
      const count = Math.max(1, Math.round(perMonth + rand() * 1.2 - 0.4));
      for (let k = 0; k < count; k += 1) {
        const daysAgo = m === 0 ? Math.floor(rand() * 11) + 1 : m * 30 + Math.floor(rand() * 26);
        const value = Math.round((9000 + rand() * 34000) * scale / 500) * 500;
        const lost = k > 0 && rand() < 0.22; // first deal each month is always a win so trend charts have no empty months
        generated.push({
          id: `d${n++}`,
          title: DEAL_TITLES[Math.floor(rand() * DEAL_TITLES.length)],
          customerId: pool[Math.floor(rand() * pool.length)].id,
          value,
          stage: lost ? 'lost' : 'won',
          probability: lost ? 0 : 100,
          ownerId,
          expectedClose: at(-daysAgo),
          createdAt: at(-daysAgo - 25 - Math.floor(rand() * 30)),
          closedAt: at(-daysAgo, 11 + Math.floor(rand() * 6)),
        });
      }
    }
  });
  return [...open, ...generated];
};

const FIRST = ['Aarav', 'Maya', 'Noah', 'Zara', 'Ethan', 'Leila', 'Kenji', 'Anika', 'Pablo', 'Ingrid', 'Tariq', 'Naomi'];
const LAST = ['Shah', 'Fernandez', 'Walker', 'Nasser', 'Cole', 'Haddad', 'Sato', 'Menon', 'Ortiz', 'Larsen', 'Bashir', 'Kline'];
const ORG = ['Pioneer', 'Solstice', 'Granite', 'Cascade', 'Atlas', 'Beacon', 'Quartz', 'Harbor', 'Summit', 'Evergreen', 'Nimbus', 'Catalyst'];
const ORG_TYPE = ['Labs', 'Partners', 'Group', 'Systems', 'Works', 'Holdings'];
const SOURCES = ['website', 'referral', 'linkedin', 'cold_call', 'event', 'email_campaign'] as const;

export const buildLeads = (): Lead[] => {
  const fu = (id: string, d: number, note: string, done = false) => ({ id, date: at(d, 11), note, done });
  const base: Lead[] = [
    { id: 'l1', name: 'Rohan Kapoor', company: 'Zenith Labs', email: 'rohan@zenithlabs.io', phone: '+91 98200 11122', status: 'new', source: 'website', value: 22000, ownerId: 'u2', notes: 'Requested a demo through the pricing page.', followUps: [fu('f1', 1, 'Intro call to qualify needs')], createdAt: at(-1), updatedAt: at(-1) },
    { id: 'l2', name: 'Emily Carter', company: 'Cobalt Dynamics', email: 'emily@cobaltdyn.com', phone: '+1 206 555 0111', status: 'contacted', source: 'linkedin', value: 35000, ownerId: 'u2', notes: 'Replied to the LinkedIn outreach. Interested in analytics.', followUps: [fu('f2', 2, 'Send case study and pricing')], createdAt: at(-6), updatedAt: at(-2) },
    { id: 'l3', name: 'Hiroshi Tanaka', company: 'Kaizen Robotics', email: 'hiroshi@kaizenrobotics.jp', phone: '+81 3 5550 1234', status: 'qualified', source: 'referral', value: 58000, ownerId: 'u2', notes: 'Referred by Aurora Systems. Budget confirmed.', followUps: [fu('f3', 3, 'Technical walkthrough with their CTO')], createdAt: at(-14), updatedAt: at(-3) },
    { id: 'l4', name: 'Fatima Zahra', company: 'Sahara Foods', email: 'fatima@saharafoods.ma', phone: '+212 5 2255 0177', status: 'proposal', source: 'event', value: 27000, ownerId: 'u2', notes: 'Met at the logistics summit. Proposal sent Monday.', followUps: [fu('f4', -1, 'Chase proposal feedback'), fu('f5', 4, 'Schedule pricing discussion')], createdAt: at(-21), updatedAt: at(-4) },
    { id: 'l5', name: 'Lucas Meyer', company: 'Alpen Software', email: 'lucas@alpensoft.ch', phone: '+41 44 555 01 22', status: 'negotiation', source: 'email_campaign', value: 44000, ownerId: 'u2', notes: 'Negotiating multi-year discount.', followUps: [fu('f6', 0, 'Send revised terms')], createdAt: at(-32), updatedAt: at(-1) },
    { id: 'l6', name: 'Olivia Grant', company: 'Brightside Clinics', email: 'olivia@brightsideclinics.com', phone: '+1 646 555 0140', status: 'new', source: 'cold_call', value: 16000, ownerId: 'u4', notes: 'Picked up on second attempt. Open to a follow-up.', followUps: [], createdAt: at(0, 9), updatedAt: at(0, 9) },
    { id: 'l7', name: 'Vikram Sethi', company: 'Praxis Capital', email: 'vikram@praxiscap.com', phone: '+91 22 5550 9988', status: 'contacted', source: 'referral', value: 80000, ownerId: 'u2', notes: 'High-value referral from Orbit Fintech.', followUps: [fu('f7', 1, 'Discovery call')], createdAt: at(-2), updatedAt: at(0, 8) },
    { id: 'l8', name: 'Chloe Dubois', company: 'Maison Verte', email: 'chloe@maisonverte.fr', phone: '+33 1 55 50 01 33', status: 'lost', source: 'website', value: 12000, ownerId: 'u2', notes: 'Chose an in-house build.', followUps: [], createdAt: at(-45), updatedAt: at(-18) },
    { id: 'l9', name: 'Samuel Adeyemi', company: 'Lagos Freight', email: 'samuel@lagosfreight.ng', phone: '+234 1 555 0199', status: 'won', source: 'referral', value: 31000, ownerId: 'u2', notes: 'Closed after a successful pilot.', followUps: [fu('f8', -9, 'Kick-off call', true)], createdAt: at(-60), updatedAt: at(-9) },
    { id: 'l10', name: 'Grace Liu', company: 'Pinecrest Labs', email: 'grace@pinecrestlabs.com', phone: '+1 415 555 0166', status: 'qualified', source: 'linkedin', value: 47000, ownerId: 'u3', notes: 'Looking to consolidate three tools.', followUps: [fu('f9', 2, 'Share ROI model')], createdAt: at(-12), updatedAt: at(-2) },
    { id: 'l11', name: 'Mateo Silva', company: 'Andes Mining', email: 'mateo@andesmining.cl', phone: '+56 2 2555 0100', status: 'new', source: 'event', value: 90000, ownerId: 'u3', notes: 'Large enterprise prospect from the expo.', followUps: [fu('f10', 1, 'Book intro meeting')], createdAt: at(-1), updatedAt: at(-1) },
    { id: 'l12', name: 'Hannah Fischer', company: 'Rhine Analytics', email: 'hannah@rhineanalytics.de', phone: '+49 69 5550 1234', status: 'contacted', source: 'website', value: 24000, ownerId: 'u5', notes: 'Downloaded the whitepaper twice.', followUps: [], createdAt: at(-5), updatedAt: at(-3) },
    { id: 'l13', name: 'Omar Haddad', company: 'Dune Hospitality', email: 'omar@dunehospitality.ae', phone: '+971 4 555 0177', status: 'proposal', source: 'cold_call', value: 38000, ownerId: 'u1', notes: 'Waiting on board approval.', followUps: [fu('f11', 5, 'Check in on board decision')], createdAt: at(-26), updatedAt: at(-5) },
    { id: 'l14', name: 'Isabella Rossi', company: 'Tuscany Wines', email: 'isabella@tuscanywines.it', phone: '+39 06 5550 1122', status: 'new', source: 'email_campaign', value: 19000, ownerId: 'u4', notes: 'Clicked through the Q4 campaign.', followUps: [], createdAt: at(-2), updatedAt: at(-2) },
  ];

  const rand = mulberry32(7);
  const history: Lead[] = [];
  const owners = ['u2', 'u3', 'u1'];
  let n = 100;
  owners.forEach((ownerId) => {
    for (let i = 0; i < 12; i += 1) {
      const r = rand();
      const status: LeadStatus = r < 0.36 ? 'won' : r < 0.72 ? 'lost' : 'contacted';
      const first = FIRST[Math.floor(rand() * FIRST.length)];
      const last = LAST[Math.floor(rand() * LAST.length)];
      const org = `${ORG[Math.floor(rand() * ORG.length)]} ${ORG_TYPE[Math.floor(rand() * ORG_TYPE.length)]}`;
      const daysAgo = 35 + Math.floor(rand() * 320);
      history.push({
        id: `l${n++}`, name: `${first} ${last}`, company: org,
        email: `${first}.${last}@${org.split(' ')[0].toLowerCase()}.com`.toLowerCase(),
        phone: '+1 555 010 0000', status, source: SOURCES[Math.floor(rand() * SOURCES.length)],
        value: Math.round((8000 + rand() * 40000) / 500) * 500, ownerId,
        notes: 'Historical record.', followUps: [], createdAt: at(-daysAgo), updatedAt: at(-daysAgo + 20),
      });
    }
  });
  return [...base, ...history];
};

export const buildTasks = (): Task[] => [
  { id: 't1', title: 'Send revised terms to Alpen Software', description: 'Include the multi-year discount tier and updated SLA.', priority: 'urgent', status: 'pending', dueDate: at(0, 17), ownerId: 'u2', leadId: 'l5', createdAt: at(-3) },
  { id: 't2', title: 'Prepare Aurora expansion proposal', description: 'Final pricing sheet and implementation timeline.', priority: 'high', status: 'in_progress', dueDate: at(1, 12), ownerId: 'u2', customerId: 'c1', createdAt: at(-5) },
  { id: 't3', title: 'Security questionnaire for Vertex Energy', description: 'Procurement needs it before renewal sign-off.', priority: 'high', status: 'pending', dueDate: at(2, 15), ownerId: 'u2', customerId: 'c5', createdAt: at(-4) },
  { id: 't4', title: 'Chase proposal feedback from Sahara Foods', description: 'Call Fatima and confirm decision timeline.', priority: 'medium', status: 'pending', dueDate: at(-1, 16), ownerId: 'u2', leadId: 'l4', createdAt: at(-8) },
  { id: 't5', title: 'Update CRM notes after Helix check-in', description: '', priority: 'low', status: 'pending', dueDate: at(3, 10), ownerId: 'u2', customerId: 'c3', createdAt: at(-1) },
  { id: 't6', title: 'Book discovery call with Praxis Capital', description: 'High-value referral — prioritise.', priority: 'high', status: 'pending', dueDate: at(1, 10), ownerId: 'u2', leadId: 'l7', createdAt: at(0, 8) },
  { id: 't7', title: 'Draft Q4 account plan', description: 'Top 5 accounts, expansion plays, risks.', priority: 'medium', status: 'in_progress', dueDate: at(6, 14), ownerId: 'u2', createdAt: at(-9) },
  { id: 't8', title: 'Log call notes for Northwind', description: '', priority: 'low', status: 'completed', dueDate: at(-2, 12), ownerId: 'u2', customerId: 'c2', createdAt: at(-6), completedAt: at(-2, 11) },
  { id: 't9', title: 'Share case study with Cobalt Dynamics', description: '', priority: 'medium', status: 'completed', dueDate: at(-3, 12), ownerId: 'u2', leadId: 'l2', createdAt: at(-7), completedAt: at(-3, 9) },
  { id: 't10', title: 'Send onboarding checklist to Lagos Freight', description: '', priority: 'medium', status: 'completed', dueDate: at(-8, 12), ownerId: 'u2', createdAt: at(-12), completedAt: at(-8, 10) },
  { id: 't11', title: 'Prepare campus rollout deck', description: 'Tailor for the BrightPath board.', priority: 'high', status: 'in_progress', dueDate: at(4, 11), ownerId: 'u3', customerId: 'c4', createdAt: at(-6) },
  { id: 't12', title: 'Competitive brief for Ironclad', description: 'Cover the rival demo and our differentiators.', priority: 'urgent', status: 'pending', dueDate: at(1, 9), ownerId: 'u3', customerId: 'c9', createdAt: at(-2) },
  { id: 't13', title: 'Clean up duplicate customer records', description: 'Merge the three duplicates found last week.', priority: 'medium', status: 'in_progress', dueDate: at(2, 16), ownerId: 'u4', createdAt: at(-4) },
  { id: 't14', title: 'Schedule follow-ups for new web leads', description: '', priority: 'high', status: 'pending', dueDate: at(0, 15), ownerId: 'u4', createdAt: at(-1) },
  { id: 't15', title: 'Renewal reminder emails', description: 'Batch of 12 accounts renewing this month.', priority: 'medium', status: 'pending', dueDate: at(3, 12), ownerId: 'u5', createdAt: at(-2) },
  { id: 't16', title: 'Review Orbit integration SOW', description: '', priority: 'high', status: 'pending', dueDate: at(5, 12), ownerId: 'u1', customerId: 'c7', createdAt: at(-3) },
];

export const buildActivities = (): Activity[] => {
  const base: Activity[] = [
    { id: 'a1', type: 'call', title: 'Discovery call with Zenith Labs', description: 'Walked through current stack and pain points. They want automated reporting.', date: at(-1, 15), duration: 35, outcome: 'positive', leadId: 'l1', ownerId: 'u2' },
    { id: 'a2', type: 'email', title: 'Sent proposal to Sahara Foods', description: 'Proposal v2 with phased rollout pricing.', date: at(-4, 10), outcome: 'neutral', leadId: 'l4', ownerId: 'u2' },
    { id: 'a3', type: 'meeting', title: 'Quarterly business review — Aurora Systems', description: 'Reviewed adoption metrics. Helena wants SSO and advanced roles.', date: at(-3, 14), duration: 60, outcome: 'positive', customerId: 'c1', dealId: 'd1', ownerId: 'u2' },
    { id: 'a4', type: 'note', title: 'Helix usage dip', description: 'Admin mentioned team reorg. Suggest executive check-in next week.', date: at(-2, 16), customerId: 'c3', ownerId: 'u2' },
    { id: 'a5', type: 'follow_up', title: 'Follow-up with Alpen Software', description: 'Confirmed they are comparing us to one competitor on price.', date: at(-1, 11), duration: 15, outcome: 'neutral', leadId: 'l5', ownerId: 'u2' },
    { id: 'a6', type: 'call', title: 'Renewal call — Vertex Energy', description: 'Ayesha will loop in procurement. Security review is the only blocker.', date: at(-5, 13), duration: 25, outcome: 'positive', customerId: 'c5', dealId: 'd4', ownerId: 'u2' },
    { id: 'a7', type: 'email', title: 'Case study shared with Cobalt Dynamics', description: 'Shared the logistics analytics case study.', date: at(-3, 9), outcome: 'positive', leadId: 'l2', ownerId: 'u2' },
    { id: 'a8', type: 'meeting', title: 'Product demo — Vertex Energy', description: 'Live demo of the reporting suite for the operations team.', date: at(1, 11), duration: 45, customerId: 'c5', ownerId: 'u2' },
    { id: 'a9', type: 'call', title: 'Discovery call — Praxis Capital', description: 'Intro call with the head of operations.', date: at(1, 16), duration: 30, leadId: 'l7', ownerId: 'u2' },
    { id: 'a10', type: 'meeting', title: 'Pricing workshop — Northwind Logistics', description: 'Scope the warehouse module.', date: at(3, 10), duration: 60, customerId: 'c2', ownerId: 'u2' },
    { id: 'a11', type: 'meeting', title: 'Campus rollout board prep', description: 'Rehearse deck with Tom.', date: at(2, 13), duration: 45, customerId: 'c4', ownerId: 'u3' },
    { id: 'a12', type: 'call', title: 'Check-in with Ironclad', description: 'Johan hinted at a competing evaluation.', date: at(-2, 12), duration: 20, outcome: 'negative', customerId: 'c9', ownerId: 'u3' },
    { id: 'a13', type: 'meeting', title: 'Pipeline review', description: 'Weekly review with the team.', date: at(2, 9), duration: 60, ownerId: 'u1' },
    { id: 'a14', type: 'email', title: 'Welcome email to Skyline Realty', description: 'Introduced onboarding specialist.', date: at(-6, 10), outcome: 'positive', customerId: 'c10', ownerId: 'u1' },
  ];

  const rand = mulberry32(21);
  const types = ['call', 'email', 'meeting', 'follow_up', 'note'] as const;
  const titles: Record<(typeof types)[number], string> = {
    call: 'Account call', email: 'Email thread', meeting: 'Sync meeting', follow_up: 'Follow-up touchpoint', note: 'Account note',
  };
  const outcomes = ['positive', 'neutral', 'negative'] as const;
  const custs: [string, string][] = [['c1', 'u2'], ['c2', 'u2'], ['c3', 'u2'], ['c5', 'u2'], ['c8', 'u2'], ['c4', 'u3'], ['c9', 'u3'], ['c6', 'u3'], ['c7', 'u1']];
  const extra: Activity[] = [];
  for (let i = 0; i < 70; i += 1) {
    const [customerId, ownerId] = custs[Math.floor(rand() * custs.length)];
    const type = types[Math.floor(rand() * types.length)];
    extra.push({
      id: `a${100 + i}`, type, title: titles[type], description: 'Logged touchpoint with the customer.',
      date: at(-(8 + Math.floor(rand() * 85)), 9 + Math.floor(rand() * 8)),
      duration: type === 'note' || type === 'email' ? undefined : 10 + Math.floor(rand() * 5) * 10,
      outcome: type === 'note' ? undefined : outcomes[Math.floor(rand() * 3)], customerId, ownerId,
    });
  }
  return [...base, ...extra];
};

export const buildNotifications = (): AppNotification[] => [
  { id: 'n_unread_1', userId: 'all', type: 'lead_assigned', title: 'High-value enterprise lead assigned', message: 'Elena Rostova (Apex Global Solutions) — $125,000 potential — was assigned to your pipeline.', createdAt: at(0, 11, 45), read: false, link: '/leads' },
  { id: 'n_unread_2', userId: 'all', type: 'deal', title: 'Deal moved to Proposal stage', message: 'Enterprise Tech Expansion ($94,000) advanced to Proposal with approved executive budget.', createdAt: at(0, 10, 20), read: false, link: '/pipeline' },
  { id: 'n_unread_3', userId: 'all', type: 'meeting', title: 'Executive demo in 45 minutes', message: 'Product walkthrough with Meridian Financial leadership team scheduled for today.', createdAt: at(0, 9, 15), read: false, link: '/activities' },
  { id: 'n_unread_4', userId: 'all', type: 'task_reminder', title: 'Urgent task due today', message: 'Send customized pricing proposal and revised SLA to Alpen Software by 4:00 PM.', createdAt: at(0, 8, 30), read: false, link: '/tasks' },
  { id: 'n_unread_5', userId: 'all', type: 'update', title: 'Monthly revenue milestone reached', message: 'Team achieved 88% of this month target ($420,000). 4 closed deals ahead of schedule.', createdAt: at(0, 7, 0), read: false, link: '/reports' },
  { id: 'n_unread_6', userId: 'all', type: 'deal', title: 'Contract signed & deal won!', message: 'Starlight Logistics signed the annual multi-year enterprise agreement ($68,000).', createdAt: at(-1, 16, 30), read: false, link: '/pipeline' },
  { id: 'n1', userId: 'u2', type: 'lead_assigned', title: 'New lead assigned', message: 'Vikram Sethi (Praxis Capital) — $80,000 potential — was assigned to you.', createdAt: at(0, 8, 10), read: false, link: '/leads' },
  { id: 'n2', userId: 'u2', type: 'meeting', title: 'Meeting tomorrow at 11:00 AM', message: 'Product demo with Vertex Energy (45 min).', createdAt: at(0, 9, 0), read: false, link: '/activities' },
  { id: 'n3', userId: 'u2', type: 'task_reminder', title: 'Task due today', message: 'Send revised terms to Alpen Software is due at 5:00 PM.', createdAt: at(0, 7, 30), read: false, link: '/tasks' },
  { id: 'n4', userId: 'u2', type: 'deal', title: 'Deal moved to Negotiation', message: 'Aurora Systems — Platform expansion advanced to Negotiation.', createdAt: at(-1, 14), read: true, link: '/pipeline' },
  { id: 'n5', userId: 'u2', type: 'update', title: 'Q4 targets updated', message: 'Your monthly revenue target was reviewed by your manager.', createdAt: at(-2, 10), read: true, link: '/reports' },
  { id: 'n6', userId: 'u2', type: 'task_reminder', title: 'Task overdue', message: 'Chase proposal feedback from Sahara Foods was due yesterday.', createdAt: at(0, 6, 0), read: false, link: '/tasks' },
  { id: 'n7', userId: 'u2', type: 'lead_assigned', title: 'Lead reassigned', message: 'Olivia Grant (Brightside Clinics) is now in your queue.', createdAt: at(-3, 11), read: true, link: '/leads' },
  { id: 'n8', userId: 'u1', type: 'deal', title: 'Large deal at risk', message: 'Ironclad Manufacturing — Retention bundle has a competing evaluation.', createdAt: at(0, 9, 30), read: false, link: '/pipeline' },
  { id: 'n9', userId: 'u1', type: 'update', title: 'Team pipeline review', message: 'Pipeline review is scheduled for the day after tomorrow at 9:00 AM.', createdAt: at(-1, 17), read: false, link: '/activities' },
  { id: 'n10', userId: 'u3', type: 'task_reminder', title: 'Task due tomorrow', message: 'Competitive brief for Ironclad is due tomorrow at 9:00 AM.', createdAt: at(0, 8), read: false, link: '/tasks' },
  { id: 'n11', userId: 'u3', type: 'lead_assigned', title: 'New lead assigned', message: 'Mateo Silva (Andes Mining) — $90,000 potential.', createdAt: at(-1, 10), read: false, link: '/leads' },
  { id: 'n12', userId: 'u4', type: 'task_reminder', title: 'Task due today', message: 'Schedule follow-ups for new web leads is due at 3:00 PM.', createdAt: at(0, 8), read: false, link: '/tasks' },
  { id: 'n13', userId: 'u5', type: 'update', title: 'Renewals this month', message: '12 accounts are renewing this month. Reminder emails are queued.', createdAt: at(-1, 9), read: false, link: '/tasks' },
];

export const buildSeed = () => {
  const users = buildUsers();
  const customers = buildCustomers();
  return {
    users,
    customers,
    leads: buildLeads(),
    deals: buildDeals(customers),
    tasks: buildTasks(),
    activities: buildActivities(),
    notifications: buildNotifications(),
  };
};
