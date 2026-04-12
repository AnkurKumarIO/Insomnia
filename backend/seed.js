require('dotenv').config();
const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

// ─── Data ────────────────────────────────────────────────────────────────────

const ALUMNI = [
  {
    email: 'priya.sharma@google.com',
    name: 'Priya Sharma',
    department: 'Computer Science',
    company: 'Google',
    batch_year: 2019,
    profile_data: {
      bio: 'Senior Software Engineer at Google with 5+ years in distributed systems and backend infrastructure. Love mentoring students on system design and cracking FAANG interviews.',
      linkedin: 'https://linkedin.com/in/priya-sharma',
      github: 'https://github.com/priyasharma',
      skills: ['System Design', 'Go', 'Python', 'Kubernetes', 'Distributed Systems', 'SQL'],
      targetRoles: ['Software Engineer', 'Backend Engineer'],
      openTo: ['Mock Interviews', 'Resume Review', 'Career Guidance'],
    },
  },
  {
    email: 'rahul.verma@microsoft.com',
    name: 'Rahul Verma',
    department: 'Electrical Engineering',
    company: 'Microsoft',
    batch_year: 2018,
    profile_data: {
      bio: 'Principal Engineer at Microsoft Azure. Specialise in cloud infrastructure, DevOps, and platform engineering. Happy to help with technical interviews and career transitions.',
      linkedin: 'https://linkedin.com/in/rahul-verma',
      github: 'https://github.com/rahulverma',
      skills: ['Azure', 'DevOps', 'C#', '.NET', 'Terraform', 'CI/CD', 'Microservices'],
      openTo: ['Mock Interviews', 'Career Guidance'],
    },
  },
  {
    email: 'ananya.iyer@stripe.com',
    name: 'Ananya Iyer',
    department: 'Computer Science',
    company: 'Stripe',
    batch_year: 2020,
    profile_data: {
      bio: 'Full Stack Engineer at Stripe working on payment infrastructure. Passionate about frontend performance and developer experience. Ex-intern at Flipkart.',
      linkedin: 'https://linkedin.com/in/ananya-iyer',
      github: 'https://github.com/ananyaiyer',
      skills: ['React', 'TypeScript', 'Node.js', 'Ruby on Rails', 'PostgreSQL', 'GraphQL'],
      openTo: ['Mock Interviews', 'Resume Review', 'Portfolio Review'],
    },
  },
  {
    email: 'karan.mehta@amazon.com',
    name: 'Karan Mehta',
    department: 'Information Technology',
    company: 'Amazon',
    batch_year: 2017,
    profile_data: {
      bio: 'Engineering Manager at Amazon Retail. 7 years of experience scaling teams and systems. Can help with leadership interviews, system design, and navigating big tech culture.',
      linkedin: 'https://linkedin.com/in/karan-mehta',
      skills: ['Leadership', 'System Design', 'Java', 'AWS', 'Agile', 'Team Management'],
      openTo: ['Mock Interviews', 'Career Guidance', 'Leadership Coaching'],
    },
  },
  {
    email: 'sneha.patel@atlassian.com',
    name: 'Sneha Patel',
    department: 'Computer Science',
    company: 'Atlassian',
    batch_year: 2021,
    profile_data: {
      bio: 'Product Engineer at Atlassian working on Jira. Recent grad with strong experience in frontend and product thinking. Great at helping students with internship prep.',
      linkedin: 'https://linkedin.com/in/sneha-patel',
      github: 'https://github.com/snehapatel',
      skills: ['React', 'JavaScript', 'Product Thinking', 'Figma', 'REST APIs', 'Jest'],
      openTo: ['Mock Interviews', 'Resume Review', 'Internship Guidance'],
    },
  },
  {
    email: 'arjun.nair@uber.com',
    name: 'Arjun Nair',
    department: 'Electronics & Communication',
    company: 'Uber',
    batch_year: 2016,
    profile_data: {
      bio: 'Staff Engineer at Uber Maps. Expert in geospatial systems, real-time data pipelines, and large-scale backend services. Mentor for competitive programming and DSA.',
      linkedin: 'https://linkedin.com/in/arjun-nair',
      skills: ['C++', 'Python', 'Kafka', 'Spark', 'Geospatial', 'DSA', 'Competitive Programming'],
      openTo: ['Mock Interviews', 'DSA Coaching'],
    },
  },
];

const STUDENTS = [
  {
    email: 'stu1001@alumniconnect.edu',
    college_id: 'STU1001',
    name: 'Alice Johnson',
    department: 'Computer Science',
    profile_data: {
      bio: 'Final year CS student passionate about full-stack development and open source. Looking for SWE roles at product companies.',
      skills: ['React', 'Node.js', 'Python', 'MongoDB', 'Git'],
      cgpa: '8.7',
      college: 'BITS Pilani',
      year: '4th Year',
      targetRoles: ['Software Engineer', 'Full Stack Developer'],
      preferredCompanies: ['Google', 'Stripe', 'Atlassian'],
      openTo: ['Full-time', 'Remote'],
      gradMonth: 'May',
      gradYear: 2026,
      linkedin: 'https://linkedin.com/in/alice-johnson',
      github: 'https://github.com/alicejohnson',
      projects: [
        { title: 'DevCollab', desc: 'Real-time collaborative code editor', stack: 'React, Node.js, Socket.io', link: 'https://github.com/alicejohnson/devcollab' },
        { title: 'ShopSmart', desc: 'E-commerce platform with AI recommendations', stack: 'Next.js, Python, PostgreSQL', link: '' },
      ],
    },
  },
  {
    email: 'stu1002@alumniconnect.edu',
    college_id: 'STU1002',
    name: 'Bob Smith',
    department: 'Electrical Engineering',
    profile_data: {
      bio: 'EE student with a strong interest in embedded systems and IoT. Exploring roles in hardware-software co-design and firmware engineering.',
      skills: ['C', 'C++', 'MATLAB', 'Arduino', 'VHDL', 'Python'],
      cgpa: '7.9',
      college: 'NIT Trichy',
      year: '3rd Year',
      targetRoles: ['Embedded Engineer', 'Firmware Developer'],
      preferredCompanies: ['Texas Instruments', 'Qualcomm', 'Intel'],
      openTo: ['Internship', 'Full-time'],
      gradMonth: 'June',
      gradYear: 2027,
      linkedin: 'https://linkedin.com/in/bob-smith',
      github: 'https://github.com/bobsmith',
      projects: [
        { title: 'SmartHome Hub', desc: 'IoT home automation controller', stack: 'Raspberry Pi, C++, MQTT', link: '' },
      ],
    },
  },
  {
    email: 'stu1003@alumniconnect.edu',
    college_id: 'STU1003',
    name: 'Charlie Davis',
    department: 'Mechanical Engineering',
    profile_data: {
      bio: 'Mech Eng student pivoting into data science and ML. Completed 2 ML courses and built projects in predictive maintenance.',
      skills: ['Python', 'Pandas', 'Scikit-learn', 'TensorFlow', 'SQL', 'Tableau'],
      cgpa: '8.2',
      college: 'VIT Vellore',
      year: '4th Year',
      targetRoles: ['Data Scientist', 'ML Engineer'],
      preferredCompanies: ['Microsoft', 'Amazon', 'Flipkart'],
      openTo: ['Full-time', 'Hybrid'],
      gradMonth: 'May',
      gradYear: 2026,
      linkedin: 'https://linkedin.com/in/charlie-davis',
      github: 'https://github.com/charliedavis',
      projects: [
        { title: 'PredictMaint', desc: 'ML model for industrial equipment failure prediction', stack: 'Python, Scikit-learn, Flask', link: '' },
      ],
    },
  },
  {
    email: 'stu1004@alumniconnect.edu',
    college_id: 'STU1004',
    name: 'Riya Kapoor',
    department: 'Computer Science',
    profile_data: {
      bio: 'CS undergrad focused on UI/UX and frontend engineering. Strong design sensibility with hands-on React experience. Looking for product-focused roles.',
      skills: ['React', 'Figma', 'TypeScript', 'CSS', 'User Research', 'Framer'],
      cgpa: '9.1',
      college: 'IIIT Hyderabad',
      year: '3rd Year',
      targetRoles: ['Frontend Developer', 'UI/UX Designer', 'Product Engineer'],
      preferredCompanies: ['Atlassian', 'Notion', 'Figma', 'Razorpay'],
      openTo: ['Internship', 'Remote'],
      gradMonth: 'May',
      gradYear: 2027,
      linkedin: 'https://linkedin.com/in/riya-kapoor',
      github: 'https://github.com/riyakapoor',
      projects: [
        { title: 'DesignOS', desc: 'Design system component library', stack: 'React, Storybook, TypeScript', link: 'https://github.com/riyakapoor/designos' },
        { title: 'Moodboard AI', desc: 'AI-powered mood board generator', stack: 'React, OpenAI API, Tailwind', link: '' },
      ],
    },
  },
  {
    email: 'stu1005@alumniconnect.edu',
    college_id: 'STU1005',
    name: 'Vikram Singh',
    department: 'Information Technology',
    profile_data: {
      bio: 'IT student with deep interest in cybersecurity and backend systems. CTF player and bug bounty hunter in free time.',
      skills: ['Python', 'Linux', 'Networking', 'Burp Suite', 'Node.js', 'Docker'],
      cgpa: '8.0',
      college: 'DTU Delhi',
      year: '4th Year',
      targetRoles: ['Security Engineer', 'Backend Developer', 'DevOps Engineer'],
      preferredCompanies: ['Cloudflare', 'Zerodha', 'CRED'],
      openTo: ['Full-time', 'On-site'],
      gradMonth: 'June',
      gradYear: 2026,
      linkedin: 'https://linkedin.com/in/vikram-singh',
      github: 'https://github.com/vikramsingh',
      projects: [
        { title: 'VaultScan', desc: 'Automated vulnerability scanner for web apps', stack: 'Python, Docker, PostgreSQL', link: 'https://github.com/vikramsingh/vaultscan' },
      ],
    },
  },
];

// ─── Seed function ────────────────────────────────────────────────────────────

async function seed() {
  console.log('🌱 Seeding Supabase...\n');

  // ── College registry ──────────────────────────────────────────────────────
  console.log('📚 Updating college registry...');
  const registryRows = STUDENTS.map(s => ({
    college_id: s.college_id,
    name: s.name,
    department: s.department,
  }));
  const { error: regErr } = await supabase
    .from('college_registry')
    .upsert(registryRows, { onConflict: 'college_id' });
  if (regErr) console.error('  ❌ Registry error:', regErr.message);
  else console.log(`  ✅ ${registryRows.length} students in registry`);

  // ── Alumni ────────────────────────────────────────────────────────────────
  console.log('\n👩‍💼 Seeding alumni...');
  for (const alumni of ALUMNI) {
    // Create auth user
    const { data: authData, error: authErr } = await supabase.auth.admin.createUser({
      email: alumni.email,
      password: 'Alumni@123',
      email_confirm: true,
    });

    if (authErr && !authErr.message.includes('already been registered')) {
      console.error(`  ❌ Auth error for ${alumni.name}:`, authErr.message);
      continue;
    }

    const userId = authData?.user?.id;
    if (!userId) {
      // User already exists — fetch their id
      const { data: existing } = await supabase
        .from('users')
        .select('id')
        .eq('email', alumni.email)
        .single();
      if (!existing) { console.log(`  ⚠️  Skipping ${alumni.name} (already exists)`); continue; }

      await supabase.from('users').update({
        profile_data: alumni.profile_data,
        company: alumni.company,
        batch_year: alumni.batch_year,
      }).eq('id', existing.id);
      console.log(`  ↻  Updated ${alumni.name}`);
      continue;
    }

    const { error: insertErr } = await supabase.from('users').insert({
      id: userId,
      role: 'ALUMNI',
      name: alumni.name,
      email: alumni.email,
      department: alumni.department,
      company: alumni.company,
      batch_year: alumni.batch_year,
      verification_status: 'VERIFIED',
      profile_data: alumni.profile_data,
    });

    if (insertErr) console.error(`  ❌ Insert error for ${alumni.name}:`, insertErr.message);
    else console.log(`  ✅ ${alumni.name} — ${alumni.company}`);
  }

  // ── Students ──────────────────────────────────────────────────────────────
  console.log('\n🎓 Seeding students...');
  for (const student of STUDENTS) {
    const { data: authData, error: authErr } = await supabase.auth.admin.createUser({
      email: student.email,
      password: 'Student@123',
      email_confirm: true,
    });

    if (authErr && !authErr.message.includes('already been registered')) {
      console.error(`  ❌ Auth error for ${student.name}:`, authErr.message);
      continue;
    }

    const userId = authData?.user?.id;
    if (!userId) {
      const { data: existing } = await supabase
        .from('users')
        .select('id')
        .eq('email', student.email)
        .single();
      if (!existing) { console.log(`  ⚠️  Skipping ${student.name} (already exists)`); continue; }

      await supabase.from('users').update({
        profile_data: student.profile_data,
      }).eq('id', existing.id);
      console.log(`  ↻  Updated ${student.name}`);
      continue;
    }

    const { error: insertErr } = await supabase.from('users').insert({
      id: userId,
      role: 'STUDENT',
      name: student.name,
      email: student.email,
      department: student.department,
      college_id: student.college_id,
      verification_status: 'VERIFIED',
      profile_data: student.profile_data,
    });

    if (insertErr) console.error(`  ❌ Insert error for ${student.name}:`, insertErr.message);
    else console.log(`  ✅ ${student.name} — ${student.department}`);
  }

  // ── TNP Coordinator ───────────────────────────────────────────────────────
  console.log('\n🏢 Seeding TNP coordinator...');
  const { data: tnpAuth, error: tnpAuthErr } = await supabase.auth.admin.createUser({
    email: 'tnp@alumniconnect.edu',
    password: 'tnp_secure_123',
    email_confirm: true,
  });

  if (tnpAuthErr && !tnpAuthErr.message.includes('already been registered')) {
    console.error('  ❌ TNP auth error:', tnpAuthErr.message);
  } else if (tnpAuth?.user?.id) {
    const { error } = await supabase.from('users').insert({
      id: tnpAuth.user.id,
      role: 'TNP',
      name: 'TNP Coordinator',
      email: 'tnp@alumniconnect.edu',
      verification_status: 'VERIFIED',
    });
    if (error) console.error('  ❌ TNP insert error:', error.message);
    else console.log('  ✅ TNP Coordinator');
  } else {
    console.log('  ↻  TNP already exists');
  }

  console.log('\n✅ Seeding complete!\n');
  console.log('─────────────────────────────────────────');
  console.log('Alumni login password:  Alumni@123');
  console.log('Student login password: Student@123');
  console.log('TNP login:              admin / tnp_secure_123');
  console.log('─────────────────────────────────────────\n');
}

seed().catch(console.error);
