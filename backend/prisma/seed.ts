import { PrismaClient } from '@prisma/client';
import * as bcrypt from 'bcrypt';

const prisma = new PrismaClient();

async function main() {
  console.log('Seeding database...');

  // 1. Create Default Admin User
  const passwordHash = await bcrypt.hash('admin123', 10);
  const admin = await prisma.admin.upsert({
    where: { email: 'admin@edinz.com' },
    update: {},
    create: {
      name: 'Edinz Admin',
      email: 'admin@edinz.com',
      passwordHash,
      role: 'admin',
    },
  });
  console.log('Seeded Admin:', admin.email);

  // 2. Create Default Course
  const course = await prisma.course.upsert({
    where: { courseId: 'devops' },
    update: {},
    create: {
      courseId: 'devops',
      courseName: 'Cloud and Devops',
      duration: '4 Months',
      status: 'Active',
    },
  });
  console.log('Seeded Course:', course.courseName);

  // 3. Create Default Categories
  const categoriesData = [
    { name: 'DevOps', description: 'Cloud, CI/CD, Containerization, and Deployment' },
    { name: 'Frontend', description: 'Angular, React, Vue, HTML, CSS, JavaScript' },
    { name: 'Database', description: 'PostgreSQL, MongoDB, SQL, NoSQL' },
  ];

  for (const cat of categoriesData) {
    const category = await prisma.category.upsert({
      where: { name: cat.name },
      update: {},
      create: cat,
    });
    console.log('Seeded Category:', category.name);
  }

  // Retrieve DevOps category for linking questions
  const devopsCategory = await prisma.category.findUnique({
    where: { name: 'DevOps' },
  });

  // 4. Create Question Bank Pool
  const questionsData = [
    {
      question: 'Which of the following is a containerization platform?',
      questionType: 'MCQ_SINGLE',
      difficulty: 'Easy',
      explanation: 'Docker is a widely used containerization platform.',
      options: {
        create: [
          { optionText: 'Docker', isCorrect: true },
          { optionText: 'Kubernetes', isCorrect: false },
          { optionText: 'Jenkins', isCorrect: false },
          { optionText: 'Git', isCorrect: false },
        ],
      },
    },
    {
      question: 'What is the main purpose of Kubernetes?',
      questionType: 'MCQ_SINGLE',
      difficulty: 'Medium',
      explanation: 'Kubernetes orchestrates containerized applications.',
      options: {
        create: [
          { optionText: 'Container Orchestration', isCorrect: true },
          { optionText: 'Source Code Version Control', isCorrect: false },
          { optionText: 'Continuous Integration', isCorrect: false },
          { optionText: 'Load Testing', isCorrect: false },
        ],
      },
    },
    {
      question: 'What are key pillars of DevOps? (Select all that apply)',
      questionType: 'MCQ_MULTIPLE',
      difficulty: 'Hard',
      explanation: 'Automation and Collaboration are key pillars of DevOps.',
      options: {
        create: [
          { optionText: 'Automation', isCorrect: true },
          { optionText: 'Collaboration', isCorrect: true },
          { optionText: 'Manual deployments', isCorrect: false },
          { optionText: 'Siloed teams', isCorrect: false },
        ],
      },
    },
    {
      question: 'Docker images are immutable.',
      questionType: 'TF',
      difficulty: 'Easy',
      explanation: 'Once built, a Docker image cannot be changed. You must rebuild to apply updates.',
      options: {
        create: [
          { optionText: 'True', isCorrect: true },
          { optionText: 'False', isCorrect: false },
        ],
      },
    },
    {
      question: 'Describe the role of continuous integration (CI) in a software development lifecycle.',
      questionType: 'ESSAY',
      difficulty: 'Medium',
      explanation: 'CI automates building and testing of codebase changes.',
      sampleAnswer: 'Continuous integration (CI) ensures team members push code to a central branch frequently. Each commit triggers automated builds and tests to identify failures early.',
    },
  ];

  for (const q of questionsData) {
    const qCount = await prisma.questionBank.count({
      where: { question: q.question },
    });
    if (qCount === 0) {
      await prisma.questionBank.create({
        data: {
          courseId: course.id,
          question: q.question,
          questionType: q.questionType,
          difficulty: q.difficulty,
          explanation: q.explanation,
          sampleAnswer: q.sampleAnswer,
          options: q.options,
        },
      });
      console.log('Seeded Question:', q.question.substring(0, 30) + '...');
    }
  }

  console.log('Seeding completed successfully!');
}

main()
  .catch((e) => {
    console.error('Error seeding database:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
