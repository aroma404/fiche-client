ALTER TABLE `cabinet_finance_entries` ADD `deletedAt` timestamp;--> statement-breakpoint
ALTER TABLE `cabinet_finance_entries` ADD `purgeAfter` timestamp;--> statement-breakpoint
CREATE INDEX `cabinet_finance_account_deleted_date_idx` ON `cabinet_finance_entries` (`accountId`,`deletedAt`,`entryDate`);--> statement-breakpoint
CREATE INDEX `cabinet_finance_purge_after_idx` ON `cabinet_finance_entries` (`purgeAfter`);