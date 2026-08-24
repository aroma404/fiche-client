CREATE TABLE `account_sessions` (
	`id` varchar(64) NOT NULL,
	`accountId` int NOT NULL,
	`expiresAt` timestamp NOT NULL,
	`revokedAt` timestamp,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `account_sessions_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `accounts` (
	`id` int AUTO_INCREMENT NOT NULL,
	`fullName` varchar(180) NOT NULL,
	`email` varchar(320) NOT NULL,
	`passwordHash` varchar(255) NOT NULL,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `accounts_id` PRIMARY KEY(`id`),
	CONSTRAINT `accounts_email_unique` UNIQUE(`email`)
);
--> statement-breakpoint
CREATE TABLE `client_cash_entries` (
	`id` int AUTO_INCREMENT NOT NULL,
	`clientId` int NOT NULL,
	`entryDate` varchar(30) NOT NULL,
	`label` varchar(180) NOT NULL,
	`direction` enum('Entrée','Sortie') NOT NULL,
	`amount` decimal(14,2) NOT NULL,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `client_cash_entries_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `client_compliance` (
	`id` int AUTO_INCREMENT NOT NULL,
	`clientId` int NOT NULL,
	`label` varchar(120) NOT NULL,
	`status` enum('À vérifier','Conforme','À régulariser') NOT NULL DEFAULT 'À vérifier',
	`note` varchar(500) DEFAULT '',
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `client_compliance_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `client_documents` (
	`id` int AUTO_INCREMENT NOT NULL,
	`clientId` int NOT NULL,
	`label` varchar(120) NOT NULL,
	`category` varchar(100) DEFAULT 'Fiscal',
	`status` enum('Reçu','À vérifier','À demander','Non requis') NOT NULL DEFAULT 'À demander',
	`note` varchar(500) DEFAULT '',
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `client_documents_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `client_payments` (
	`id` int AUTO_INCREMENT NOT NULL,
	`clientId` int NOT NULL,
	`paymentDate` varchar(30) NOT NULL,
	`label` varchar(180) NOT NULL,
	`reference` varchar(160) DEFAULT '',
	`amount` decimal(14,2) NOT NULL,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `client_payments_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `clients` (
	`id` int AUTO_INCREMENT NOT NULL,
	`accountId` int NOT NULL,
	`fullName` varchar(220) NOT NULL,
	`activity` varchar(220) DEFAULT '',
	`legalForm` varchar(80) DEFAULT 'Personne physique',
	`clientType` varchar(80) DEFAULT 'Particulier',
	`status` varchar(60) DEFAULT 'Actif',
	`commune` varchar(160) DEFAULT '',
	`contact` varchar(160) DEFAULT '',
	`nif` varchar(80) DEFAULT '',
	`rc` varchar(80) DEFAULT '',
	`bp` varchar(80) DEFAULT '',
	`taxArticle` varchar(80) DEFAULT '',
	`nin` varchar(80) DEFAULT '',
	`regime` varchar(80) DEFAULT 'Principal',
	`observations` text,
	`archivedAt` timestamp,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `clients_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `export_audit` (
	`id` int AUTO_INCREMENT NOT NULL,
	`accountId` int NOT NULL,
	`format` enum('json','xlsx') NOT NULL,
	`scope` enum('active','selected','all') NOT NULL,
	`clientCount` int NOT NULL,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `export_audit_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `users` (
	`id` int AUTO_INCREMENT NOT NULL,
	`openId` varchar(64) NOT NULL,
	`name` text,
	`email` varchar(320),
	`loginMethod` varchar(64),
	`role` enum('user','admin') NOT NULL DEFAULT 'user',
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	`lastSignedIn` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `users_id` PRIMARY KEY(`id`),
	CONSTRAINT `users_openId_unique` UNIQUE(`openId`)
);
--> statement-breakpoint
CREATE INDEX `account_sessions_account_idx` ON `account_sessions` (`accountId`);--> statement-breakpoint
CREATE INDEX `client_cash_entries_client_idx` ON `client_cash_entries` (`clientId`);--> statement-breakpoint
CREATE INDEX `client_compliance_client_idx` ON `client_compliance` (`clientId`);--> statement-breakpoint
CREATE INDEX `client_documents_client_idx` ON `client_documents` (`clientId`);--> statement-breakpoint
CREATE INDEX `client_payments_client_idx` ON `client_payments` (`clientId`);--> statement-breakpoint
CREATE INDEX `clients_account_idx` ON `clients` (`accountId`);--> statement-breakpoint
CREATE INDEX `clients_account_name_idx` ON `clients` (`accountId`,`fullName`);--> statement-breakpoint
CREATE INDEX `export_audit_account_idx` ON `export_audit` (`accountId`);