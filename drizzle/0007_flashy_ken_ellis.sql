CREATE TABLE `client_contacts` (
	`id` int AUTO_INCREMENT NOT NULL,
	`clientId` int NOT NULL,
	`label` varchar(100) DEFAULT '',
	`type` varchar(20) NOT NULL,
	`value` varchar(320) NOT NULL,
	`isPrimary` boolean NOT NULL DEFAULT false,
	`deletedAt` timestamp,
	`purgeAfter` timestamp,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `client_contacts_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `program_client_options` (
	`id` int AUTO_INCREMENT NOT NULL,
	`accountId` int NOT NULL,
	`kind` varchar(40) NOT NULL,
	`code` varchar(80) NOT NULL,
	`label` varchar(100) NOT NULL,
	`sortOrder` int NOT NULL DEFAULT 0,
	`deletedAt` timestamp,
	`purgeAfter` timestamp,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `program_client_options_id` PRIMARY KEY(`id`),
	CONSTRAINT `program_client_options_account_kind_code_unique` UNIQUE(`accountId`,`kind`,`code`)
);
--> statement-breakpoint
ALTER TABLE `clients` MODIFY COLUMN `initialBalance` decimal(14,2);--> statement-breakpoint
ALTER TABLE `clients` ADD `deletedAt` timestamp;--> statement-breakpoint
ALTER TABLE `clients` ADD `purgeAfter` timestamp;--> statement-breakpoint
CREATE INDEX `client_contacts_client_idx` ON `client_contacts` (`clientId`);--> statement-breakpoint
CREATE INDEX `program_client_options_account_kind_idx` ON `program_client_options` (`accountId`,`kind`);