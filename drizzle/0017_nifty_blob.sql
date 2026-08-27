CREATE TABLE `program_rc_catalogue_families` (
	`id` int AUTO_INCREMENT NOT NULL,
	`accountId` int NOT NULL,
	`code` varchar(10) NOT NULL,
	`label` varchar(180) NOT NULL,
	`sourceFilename` varchar(255) NOT NULL,
	`deletedAt` timestamp,
	`purgeAfter` timestamp,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `program_rc_catalogue_families_id` PRIMARY KEY(`id`),
	CONSTRAINT `program_rc_catalogue_families_account_code_unique` UNIQUE(`accountId`,`code`)
);
--> statement-breakpoint
ALTER TABLE `program_rc_catalogue_entries` ADD `deletedAt` timestamp;--> statement-breakpoint
ALTER TABLE `program_rc_catalogue_entries` ADD `purgeAfter` timestamp;--> statement-breakpoint
CREATE INDEX `program_rc_catalogue_families_account_deleted_idx` ON `program_rc_catalogue_families` (`accountId`,`deletedAt`);--> statement-breakpoint
CREATE INDEX `program_rc_catalogue_families_purge_after_idx` ON `program_rc_catalogue_families` (`purgeAfter`);--> statement-breakpoint
CREATE INDEX `program_rc_catalogue_account_family_deleted_idx` ON `program_rc_catalogue_entries` (`accountId`,`familyCode`,`deletedAt`);--> statement-breakpoint
CREATE INDEX `program_rc_catalogue_purge_after_idx` ON `program_rc_catalogue_entries` (`purgeAfter`);