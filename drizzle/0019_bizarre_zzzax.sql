ALTER TABLE `accounts` ADD `archiveRetentionDays` int DEFAULT 30 NOT NULL;--> statement-breakpoint
ALTER TABLE `accounts` ADD `allowImmediateArchiveDeletion` boolean DEFAULT false NOT NULL;