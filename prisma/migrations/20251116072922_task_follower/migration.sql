-- AlterTable
ALTER TABLE `Task` ADD COLUMN `followerId` VARCHAR(191) NULL;

-- CreateIndex
CREATE INDEX `Task_followerId_idx` ON `Task`(`followerId`);

-- AddForeignKey
ALTER TABLE `Task` ADD CONSTRAINT `Task_followerId_fkey` FOREIGN KEY (`followerId`) REFERENCES `User`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;
