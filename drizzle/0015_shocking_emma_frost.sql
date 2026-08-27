CREATE TABLE `program_rc_catalogue_entries` (
	`id` int AUTO_INCREMENT NOT NULL,
	`accountId` int NOT NULL,
	`familyCode` varchar(10) NOT NULL,
	`activityCode` varchar(16) NOT NULL,
	`label` varchar(320) NOT NULL,
	`sourceFilename` varchar(255) NOT NULL,
	`importedAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `program_rc_catalogue_entries_id` PRIMARY KEY(`id`),
	CONSTRAINT `program_rc_catalogue_account_activity_unique` UNIQUE(`accountId`,`activityCode`)
);
--> statement-breakpoint
CREATE INDEX `program_rc_catalogue_account_family_idx` ON `program_rc_catalogue_entries` (`accountId`,`familyCode`);