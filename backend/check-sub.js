const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function checkSubmissions() {
  const submissions = await prisma.quizSubmission.findMany({
    include: {
      quiz: {
        include: {
          questions: {
            include: {
              question: true
            }
          }
        }
      },
      answers: true
    }
  });

  console.log('=== ALL SUBMISSIONS IN DB ===');
  for (const s of submissions) {
    console.log(`Submission ID: ${s.id}`);
    console.log(`Quiz Title: ${s.quiz?.title}`);
    console.log(`Quiz ID: ${s.quizId}`);
    console.log(`Stored Score in DB: ${s.score}`);
    console.log(`Quiz passingMarks: ${s.quiz?.passingMarks}`);
    console.log(`Number of questions in Quiz: ${s.quiz?.questions?.length}`);
    let sumLinkMarks = 0;
    s.quiz?.questions?.forEach((q, idx) => {
      console.log(`  Q[${idx}]: link.marks=${q.marks}, qBank.id=${q.questionId}`);
      sumLinkMarks += (q.marks || 1);
    });
    console.log(`Calculated sumLinkMarks: ${sumLinkMarks}`);
    console.log('------------------------------------');
  }

  await prisma.$disconnect();
}

checkSubmissions().catch(err => {
  console.error(err);
  prisma.$disconnect();
});
