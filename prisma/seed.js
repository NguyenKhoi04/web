/* eslint-disable @typescript-eslint/no-require-imports */
const { PrismaClient } = require('../app/generated/prisma');
const prisma = new PrismaClient();

async function main() {
  const count = await prisma.helpArticle.count();
  if (count > 0) {
    console.log('HelpArticle already seeded, skip.');
    return;
  }

  await prisma.helpArticle.createMany({
    data: [
      {
        slug: 'tao-du-an-moi',
        title: 'Cách tạo dự án mới',
        contentMd: `
## Tạo dự án mới

1. Vào menu **Projects**.
2. Bấm nút **New Project** hoặc **Tạo dự án**.
3. Nhập tên dự án, chọn tổ chức (org).
4. Bấm **Create** để lưu.
      `,
        category: 'projects',
        tags: 'project,tạo dự án,new project',
        isPublished: true,
      },
      {
        slug: 'tao-task-tren-kanban',
        title: 'Tạo task trên Kanban',
        contentMd: `
## Tạo task trên Kanban

1. Mở dự án.
2. Ở cột **To Do**, bấm **+ New Task**.
3. Nhập tên task, assignee, deadline.
4. Bấm **Create**.
      `,
        category: 'tasks',
        tags: 'task,kanban,công việc',
        isPublished: true,
      },
      {
        slug: 'moi-thanh-vien-vao-du-an',
        title: 'Mời thành viên vào dự án',
        contentMd: `
## Mời thành viên

1. Vào trang **Project Settings**.
2. Chọn tab **Members**.
3. Nhập email & chọn role.
4. Bấm **Send Invite**.
      `,
        category: 'members',
        tags: 'invite,members,mời thành viên',
        isPublished: true,
      },
    ],
  });

  console.log('Seeded HelpArticle successfully.');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
