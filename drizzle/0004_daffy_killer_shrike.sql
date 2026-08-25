CREATE TABLE `cabinet_finance_entries` (
	`id` int AUTO_INCREMENT NOT NULL,
	`accountId` int NOT NULL,
	`clientId` int,
	`entryDate` varchar(30) NOT NULL,
	`category` enum('Paiement','Caisse') NOT NULL,
	`direction` enum('Entrée','Sortie') NOT NULL,
	`label` varchar(180) NOT NULL,
	`reference` varchar(160) DEFAULT '',
	`amount` decimal(14,2) NOT NULL,
	`note` varchar(500) DEFAULT '',
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `cabinet_finance_entries_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
ALTER TABLE `clients` MODIFY COLUMN `clientType` varchar(80) DEFAULT 'Nouveau client';--> statement-breakpoint
ALTER TABLE `clients` MODIFY COLUMN `regime` varchar(80) DEFAULT 'Régime réel';--> statement-breakpoint
ALTER TABLE `clients` ADD `taxCenter` varchar(20) DEFAULT 'CDI';--> statement-breakpoint
CREATE INDEX `cabinet_finance_account_date_idx` ON `cabinet_finance_entries` (`accountId`,`entryDate`);--> statement-breakpoint
CREATE INDEX `cabinet_finance_client_idx` ON `cabinet_finance_entries` (`clientId`);--> statement-breakpoint
INSERT INTO `cabinet_finance_entries` (`accountId`, `clientId`, `entryDate`, `category`, `direction`, `label`, `reference`, `amount`, `note`)
SELECT `clients`.`accountId`, `client_payments`.`clientId`, `client_payments`.`paymentDate`, 'Paiement', 'Entrée', `client_payments`.`label`, `client_payments`.`reference`, `client_payments`.`amount`, ''
FROM `client_payments` INNER JOIN `clients` ON `clients`.`id` = `client_payments`.`clientId`;--> statement-breakpoint
INSERT INTO `cabinet_finance_entries` (`accountId`, `clientId`, `entryDate`, `category`, `direction`, `label`, `reference`, `amount`, `note`)
SELECT `clients`.`accountId`, `client_cash_entries`.`clientId`, `client_cash_entries`.`entryDate`, 'Caisse', `client_cash_entries`.`direction`, `client_cash_entries`.`label`, '', `client_cash_entries`.`amount`, ''
FROM `client_cash_entries` INNER JOIN `clients` ON `clients`.`id` = `client_cash_entries`.`clientId`;
