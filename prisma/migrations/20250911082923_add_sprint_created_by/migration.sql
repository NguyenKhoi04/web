/*
  Warnings:

  - Added the required column `updatedAt` to the `Sprint` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE `Sprint` ADD COLUMN `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    ADD COLUMN `createdById` VARCHAR(191) NULL,
    ADD COLUMN `updatedAt` DATETIME(3) NOT NULL;

-- CreateIndex
CREATE INDEX `Sprint_projectId_status_idx` ON `Sprint`(`projectId`, `status`);

-- AddForeignKey
ALTER TABLE `Sprint` ADD CONSTRAINT `Sprint_createdById_fkey` FOREIGN KEY (`createdById`) REFERENCES `User`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;
