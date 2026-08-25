CREATE TABLE `program_client_statuses` (
	`id` int AUTO_INCREMENT NOT NULL,
	`accountId` int NOT NULL,
	`label` varchar(60) NOT NULL,
	`isOperational` boolean NOT NULL DEFAULT true,
	`sortOrder` int NOT NULL DEFAULT 0,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `program_client_statuses_id` PRIMARY KEY(`id`),
	CONSTRAINT `program_client_statuses_account_label_unique` UNIQUE(`accountId`,`label`)
);
--> statement-breakpoint
CREATE INDEX `program_client_statuses_account_idx` ON `program_client_statuses` (`accountId`);