ALTER TABLE `program_client_statuses` ADD `deletedAt` timestamp;--> statement-breakpoint
ALTER TABLE `program_client_statuses` ADD `purgeAfter` timestamp;