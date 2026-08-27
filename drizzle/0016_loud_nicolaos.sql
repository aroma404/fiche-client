CREATE TABLE `client_files` (
	`id` int AUTO_INCREMENT NOT NULL,
	`accountId` int NOT NULL,
	`clientId` int NOT NULL,
	`documentId` int,
	`displayName` varchar(180) NOT NULL,
	`category` varchar(100) NOT NULL DEFAULT 'Autre',
	`originalName` varchar(255) NOT NULL,
	`storageKey` varchar(600) NOT NULL,
	`mimeType` varchar(180) NOT NULL DEFAULT 'application/octet-stream',
	`sizeBytes` int NOT NULL,
	`deletedAt` timestamp,
	`purgeAfter` timestamp,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `client_files_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
ALTER TABLE `client_documents` MODIFY COLUMN `status` varchar(100) NOT NULL DEFAULT 'À demander';--> statement-breakpoint
ALTER TABLE `cabinet_finance_entries` ADD `documentId` int;--> statement-breakpoint
ALTER TABLE `cabinet_finance_entries` ADD `updatedAt` timestamp DEFAULT (now()) NOT NULL ON UPDATE CURRENT_TIMESTAMP;--> statement-breakpoint
ALTER TABLE `client_documents` ADD `deletedAt` timestamp;--> statement-breakpoint
ALTER TABLE `client_documents` ADD `purgeAfter` timestamp;--> statement-breakpoint
ALTER TABLE `clients` ADD `referenceNumber` int;--> statement-breakpoint
ALTER TABLE `clients` ADD `cacobatphAffiliated` boolean DEFAULT false NOT NULL;--> statement-breakpoint
ALTER TABLE `clients` ADD CONSTRAINT `clients_account_reference_number_unique` UNIQUE(`accountId`,`referenceNumber`);--> statement-breakpoint
CREATE INDEX `client_files_account_client_deleted_idx` ON `client_files` (`accountId`,`clientId`,`deletedAt`);--> statement-breakpoint
CREATE INDEX `client_files_document_idx` ON `client_files` (`documentId`);--> statement-breakpoint
CREATE INDEX `client_files_purge_after_idx` ON `client_files` (`purgeAfter`);--> statement-breakpoint
CREATE INDEX `cabinet_finance_document_idx` ON `cabinet_finance_entries` (`documentId`);--> statement-breakpoint
CREATE INDEX `client_documents_client_deleted_idx` ON `client_documents` (`clientId`,`deletedAt`);--> statement-breakpoint
CREATE INDEX `client_documents_purge_after_idx` ON `client_documents` (`purgeAfter`);