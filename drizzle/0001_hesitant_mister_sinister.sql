CREATE TABLE `client_work_cases` (
	`id` int AUTO_INCREMENT NOT NULL,
	`clientId` int NOT NULL,
	`label` varchar(160) NOT NULL,
	`caseType` enum('CDI','CPI','CASNOS','Autre') NOT NULL,
	`status` enum('À préparer','En cours','Terminé') NOT NULL DEFAULT 'À préparer',
	`note` varchar(500) DEFAULT '',
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `client_work_cases_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
ALTER TABLE `clients` ADD `initialBalance` decimal(14,2) DEFAULT '0.00' NOT NULL;--> statement-breakpoint
CREATE INDEX `client_work_cases_client_idx` ON `client_work_cases` (`clientId`);