const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');
const prisma = new PrismaClient();

async function main() {
  // Get admin credentials from environment variables
  const adminUsername = process.env.ADMIN_USER || 'admin';
  const adminPassword = process.env.ADMIN_PASSWORD || '7237';
  const hashedPassword = await bcrypt.hash(adminPassword, 10);

  console.log(`Setting up admin user: ${adminUsername}`);

  // Check if admin user exists
  const existingAdmin = await prisma.user.findFirst({
    where: { role: 'ADMIN' }
  });

  if (existingAdmin) {
    // Update existing admin with new credentials
    await prisma.user.update({
      where: { id: existingAdmin.id },
      data: {
        username: adminUsername,
        password: hashedPassword,
      }
    });
    console.log(`Admin user updated: username=${adminUsername}`);

    // Check if we have sample data already
    const projectCount = await prisma.project.count();
    if (projectCount > 0) {
      console.log('Sample data already exists. Skipping seed data creation.');
      return;
    }
  }

  // If no admin exists, create one
  let adminUser;
  if (!existingAdmin) {
    adminUser = await prisma.user.create({
      data: {
        username: adminUsername,
        password: hashedPassword,
        name: 'Administrator',
        email: 'admin@fshc.com',
        role: 'ADMIN',
      }
    });
    console.log(`Admin user created: username=${adminUsername}`);
  } else {
    adminUser = existingAdmin;
  }

  // Check if we need to create sample data
  const projectCount = await prisma.project.count();
  if (projectCount > 0) {
    console.log('Sample data already exists. Skipping seed data creation.');
    return;
  }

  console.log('Creating sample data...');

  // Create sample regular users
  const user1 = await prisma.user.create({
    data: {
      username: 'jsolema',
      password: await bcrypt.hash('password123', 10),
      name: 'Jay Solema',
      email: 'jay@fshc.com',
      role: 'USER',
    }
  });

  const user2 = await prisma.user.create({
    data: {
      username: 'khahn',
      password: await bcrypt.hash('password123', 10),
      name: 'Kolby Hahn',
      email: 'kolby@fshc.com',
      role: 'USER',
    }
  });

  // Create Projects
  const project1 = await prisma.project.create({
    data: {
      name: 'FSHC Revenue Cycle Dashboard',
      description: 'Healthcare revenue cycle management dashboard for skilled nursing facilities',
      color: '#6c8cff',
      icon: '🏥',
    }
  });

  const project2 = await prisma.project.create({
    data: {
      name: 'Website Redesign',
      description: 'Corporate website redesign project',
      color: '#10b981',
      icon: '🌐',
    }
  });

  // Assign users to projects
  await prisma.userProject.createMany({
    data: [
      { userId: adminUser.id, projectId: project1.id, role: 'OWNER' },
      { userId: adminUser.id, projectId: project2.id, role: 'OWNER' },
      { userId: user1.id, projectId: project1.id, role: 'MEMBER' },
      { userId: user2.id, projectId: project1.id, role: 'MEMBER' },
      { userId: user2.id, projectId: project2.id, role: 'MEMBER' },
    ]
  });

  // Create Phases for Project 1
  const phases = await Promise.all([
    prisma.phase.create({ data: { name: 'Prototype & Prep', icon: '📋', color: '#f59e0b', duration: 'Week 1-2', order: 0, projectId: project1.id } }),
    prisma.phase.create({ data: { name: 'Corporate Discovery', icon: '🏢', color: '#6c8cff', duration: 'Week 2-4', order: 1, projectId: project1.id } }),
    prisma.phase.create({ data: { name: 'Site Discovery', icon: '🏥', color: '#10b981', duration: 'Week 4-10', order: 2, projectId: project1.id } }),
    prisma.phase.create({ data: { name: 'Synthesis & Sign-off', icon: '🔍', color: '#10b981', duration: 'Week 10-12', order: 3, projectId: project1.id } }),
    prisma.phase.create({ data: { name: 'Build in Retool', icon: '🔧', color: '#8b5cf6', duration: 'Week 12-15', order: 4, projectId: project1.id } }),
    prisma.phase.create({ data: { name: 'Deploy & Train', icon: '🚀', color: '#ec4899', duration: 'Week 15-17', order: 5, projectId: project1.id } }),
    prisma.phase.create({ data: { name: 'Expand Payers', icon: '📈', color: '#14b8a6', duration: 'Week 20+', order: 6, projectId: project1.id } }),
  ]);

  // Create Phases for Project 2
  await Promise.all([
    prisma.phase.create({ data: { name: 'Research', icon: '🔍', color: '#6c8cff', duration: 'Week 1', order: 0, projectId: project2.id } }),
    prisma.phase.create({ data: { name: 'Design', icon: '🎨', color: '#8b5cf6', duration: 'Week 2-3', order: 1, projectId: project2.id } }),
    prisma.phase.create({ data: { name: 'Development', icon: '💻', color: '#10b981', duration: 'Week 4-6', order: 2, projectId: project2.id } }),
    prisma.phase.create({ data: { name: 'Launch', icon: '🚀', color: '#ec4899', duration: 'Week 7', order: 3, projectId: project2.id } }),
  ]);

  // Create Assignees for Project 1
  const assignees = await Promise.all([
    prisma.assignee.create({ data: { name: 'Jay Solema', initials: 'JS', color: '#6c8cff', role: 'Project Lead', projectId: project1.id } }),
    prisma.assignee.create({ data: { name: 'Kolby Hahn', initials: 'KH', color: '#8b5cf6', role: 'Stakeholder', projectId: project1.id } }),
    prisma.assignee.create({ data: { name: 'Leandra Eberhardt', initials: 'LE', color: '#10b981', role: 'Central Intake', projectId: project1.id } }),
    prisma.assignee.create({ data: { name: 'Lauren Yzaguirre', initials: 'LY', color: '#ec4899', role: 'CBO Billing', projectId: project1.id } }),
    prisma.assignee.create({ data: { name: 'Teri Farmer', initials: 'TF', color: '#f59e0b', role: 'Revenue Cycle', projectId: project1.id } }),
    prisma.assignee.create({ data: { name: 'Pam Fitzsimmons', initials: 'PF', color: '#14b8a6', role: 'Clinical Reimb', projectId: project1.id } }),
    prisma.assignee.create({ data: { name: 'Harold Hammond', initials: 'HH', color: '#ef4444', role: 'Compliance', projectId: project1.id } }),
    prisma.assignee.create({ data: { name: 'Claude AI', initials: 'AI', color: '#8892a4', role: 'AI Assistant', projectId: project1.id } }),
  ]);

  // Create Assignees for Project 2
  await Promise.all([
    prisma.assignee.create({ data: { name: 'Designer', initials: 'DS', color: '#8b5cf6', role: 'UI/UX', projectId: project2.id } }),
    prisma.assignee.create({ data: { name: 'Developer', initials: 'DV', color: '#10b981', role: 'Frontend Dev', projectId: project2.id } }),
  ]);

  const [JS, KH, LE, LY, TF, PF, HH, AI] = assignees;

  // Create Tasks - Phase 0: Prototype & Prep
  await prisma.task.create({
    data: {
      title: 'Deploy HTML prototype — share public URL with Kolby',
      status: 'IN_PROGRESS',
      priority: 'HIGH',
      dueDate: new Date('2026-02-14'),
      description: 'Prototype has 7 views: Dashboard, Claims, EOM, Appeals, AR Aging, Denials, plus resident detail panel.',
      phaseId: phases[0].id,
      assigneeId: JS.id,
      subtasks: {
        create: [
          { title: 'Set up hosting account' },
          { title: 'Deploy prototype' },
          { title: 'Configure custom domain' },
          { title: 'Share URL with Kolby' },
        ]
      },
      deliverables: {
        create: [{ label: 'Live prototype URL', type: 'Web' }]
      }
    }
  });

  await prisma.task.create({
    data: {
      title: 'Walk Kolby through the prototype and collect feedback',
      status: 'NOT_STARTED',
      priority: 'HIGH',
      dueDate: new Date('2026-02-17'),
      description: 'Schedule 30-min screen share. Walk through all 7 views. Capture what resonates and what is missing.',
      phaseId: phases[0].id,
      assigneeId: JS.id,
      subtasks: {
        create: [
          { title: 'Schedule call with Kolby' },
          { title: 'Prepare demo script' },
          { title: 'Capture feedback notes' },
          { title: 'Update prototype based on feedback' },
        ]
      }
    }
  });

  await prisma.task.create({
    data: {
      title: 'Upload source files to NotebookLM notebook (Medicare + Medicaid)',
      status: 'DONE',
      priority: 'MEDIUM',
      dueDate: new Date('2026-02-10'),
      description: '4 source files uploaded: project overview, 11-step workflow, personnel roster, Medicare gaps.',
      phaseId: phases[0].id,
      assigneeId: JS.id,
      subtasks: {
        create: [
          { title: 'Create NotebookLM notebook', completed: true },
          { title: 'Upload 4 source files', completed: true },
          { title: 'Verify AI can reference all data', completed: true },
        ]
      },
      deliverables: {
        create: [{ label: 'NotebookLM notebook (loaded)', type: 'Google' }]
      }
    }
  });

  await prisma.task.create({
    data: {
      title: 'Create Medicaid source files for NotebookLM',
      status: 'NOT_STARTED',
      priority: 'MEDIUM',
      dueDate: new Date('2026-02-21'),
      description: 'Need to research Medicaid-specific workflows, personnel, and compliance requirements for SNFs.',
      phaseId: phases[0].id,
      assigneeId: JS.id,
      subtasks: {
        create: [
          { title: 'Research TX Medicaid SNF billing' },
          { title: 'Document Medicaid workflow differences' },
          { title: 'Upload to NotebookLM' },
        ]
      },
      deliverables: {
        create: [{ label: 'Medicaid source docs', type: 'NotebookLM' }]
      }
    }
  });

  await prisma.task.create({
    data: {
      title: 'Review interview questions — add Medicaid-specific questions',
      status: 'NOT_STARTED',
      priority: 'MEDIUM',
      dueDate: new Date('2026-02-18'),
      description: 'Interview template created as docx. Need to add Medicaid questions for each role.',
      phaseId: phases[0].id,
      assigneeId: JS.id,
      subtasks: {
        create: [
          { title: 'Review current interview template' },
          { title: 'Add Medicaid-specific questions' },
          { title: 'Validate with Kolby' },
        ]
      },
      deliverables: {
        create: [{ label: 'Updated interview guide', type: 'Document' }]
      }
    }
  });

  await prisma.task.create({
    data: {
      title: 'Work with Kolby to identify 2-3 representative sites for deep discovery',
      status: 'NOT_STARTED',
      priority: 'HIGH',
      dueDate: new Date('2026-02-21'),
      description: 'Need sites that represent different workflows — one strong, one struggling, one average.',
      phaseId: phases[0].id,
      assigneeId: KH.id,
      subtasks: {
        create: [
          { title: 'Discuss site selection criteria' },
          { title: 'Get Kolby recommendation' },
          { title: 'Confirm site contacts' },
        ]
      },
      deliverables: {
        create: [{ label: '2-3 deep-dive sites selected', type: 'Strategy' }]
      }
    }
  });

  // Phase 1: Corporate Discovery
  await prisma.task.create({
    data: {
      title: 'Interview Central Intake (Leandra Eberhardt) — Step 1: Admission',
      status: 'NOT_STARTED',
      priority: 'HIGH',
      dueDate: new Date('2026-03-06'),
      description: 'Covers Medicare + Medicaid admission process. Ask about PCC screens, insurance verification, bed-hold rules.',
      phaseId: phases[1].id,
      assigneeId: JS.id,
      subtasks: {
        create: [
          { title: 'Prepare admission questions' },
          { title: 'Conduct interview' },
          { title: 'Capture PCC screenshots' },
          { title: 'Upload notes to NotebookLM' },
        ]
      }
    }
  });

  await prisma.task.create({
    data: {
      title: 'Interview CBO Billing (Lauren, Stacey, Regina) — Steps 4-8',
      status: 'NOT_STARTED',
      priority: 'HIGH',
      dueDate: new Date('2026-03-10'),
      description: 'Covers EOM, Triple Check, Claim Submission, DDE Tracking, 835 Posting for both payers.',
      phaseId: phases[1].id,
      assigneeId: JS.id,
      subtasks: {
        create: [
          { title: 'Prepare billing questions' },
          { title: 'Interview Lauren' },
          { title: 'Interview Stacey' },
          { title: 'Interview Regina' },
          { title: 'Document Excel workarounds' },
          { title: 'Upload notes to NotebookLM' },
        ]
      }
    }
  });

  // Phase 2: Site Discovery
  await prisma.task.create({
    data: {
      title: 'Deep Discovery — Site 1: Full interviews (DON, MDS, Nursing, Social Svcs, Admin)',
      status: 'NOT_STARTED',
      priority: 'HIGH',
      dueDate: new Date('2026-04-03'),
      description: 'First deep-dive site. Full day on-site. Cover both Medicare and Medicaid at every interview.',
      phaseId: phases[2].id,
      assigneeId: JS.id,
      subtasks: {
        create: [
          { title: 'Interview DON / Med Director' },
          { title: 'Interview MDS Nurses' },
          { title: 'Interview Nursing staff' },
          { title: 'Interview Social Services' },
          { title: 'Interview Facility Admin' },
          { title: 'Screenshot every PCC screen' },
          { title: 'Upload all notes to NotebookLM' },
        ]
      },
      deliverables: {
        create: [{ label: 'Deep-dive site report #1', type: 'NotebookLM' }]
      }
    }
  });

  // Phase 3: Synthesis
  await prisma.task.create({
    data: {
      title: 'Present findings to Kolby — get sign-off on standard workflows',
      status: 'NOT_STARTED',
      priority: 'HIGH',
      dueDate: new Date('2026-05-25'),
      description: 'Key milestone. Kolby must approve the documented workflows before we build.',
      phaseId: phases[3].id,
      assigneeId: JS.id,
      subtasks: {
        create: [
          { title: 'Prepare presentation' },
          { title: 'Schedule review meeting' },
          { title: 'Present findings' },
          { title: 'Get written sign-off' },
        ]
      },
      deliverables: {
        create: [{ label: 'Kolby sign-off', type: 'Approval' }]
      }
    }
  });

  // Phase 4: Build
  await prisma.task.create({
    data: {
      title: 'Create Supabase account and run SQL setup script',
      status: 'NOT_STARTED',
      priority: 'HIGH',
      dueDate: new Date('2026-06-01'),
      description: 'SQL script already created. Need to extend for multi-payer and multi-site support.',
      phaseId: phases[4].id,
      assigneeId: JS.id,
      subtasks: {
        create: [
          { title: 'Create Supabase project' },
          { title: 'Run base SQL script' },
          { title: 'Extend schema for Medicaid' },
          { title: 'Add multi-site tables' },
        ]
      },
      deliverables: {
        create: [{ label: 'Supabase database (live)', type: 'Backend' }]
      }
    }
  });

  // Phase 5: Deploy
  await prisma.task.create({
    data: {
      title: 'Deploy Retool app to CBO team (corporate)',
      status: 'NOT_STARTED',
      priority: 'HIGH',
      dueDate: new Date('2026-07-01'),
      description: 'First production deployment to the central billing office.',
      phaseId: phases[5].id,
      assigneeId: JS.id,
      subtasks: {
        create: [
          { title: 'Set up user accounts' },
          { title: 'Deploy to production' },
          { title: 'Verify access for all CBO staff' },
        ]
      }
    }
  });

  // Phase 6: Expand
  await prisma.task.create({
    data: {
      title: 'Insurance discovery (Rebecca McNeely, Lauren Yzaguirre)',
      status: 'NOT_STARTED',
      priority: 'MEDIUM',
      dueDate: new Date('2026-08-15'),
      description: 'Third payer type. Framework exists, relationships built. Should be faster.',
      phaseId: phases[6].id,
      assigneeId: JS.id,
      subtasks: {
        create: [
          { title: 'Interview Rebecca on insurance workflows' },
          { title: 'Interview Lauren on insurance billing' },
          { title: 'Document insurance-specific steps' },
          { title: 'Add to Retool app' },
        ]
      }
    }
  });

  console.log('Seed completed successfully!');
}

main()
  .catch((e) => {
    console.error('Seed error:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
