CREATE TABLE `password_vault_entries` (
	`id` int AUTO_INCREMENT NOT NULL,
	`accountId` int NOT NULL,
	`platformName` varchar(180) NOT NULL,
	`platformUrl` varchar(1200) DEFAULT '',
	`email` varchar(320) DEFAULT '',
	`phone` varchar(80) DEFAULT '',
	`username` varchar(320) DEFAULT '',
	`encryptedPassword` text NOT NULL,
	`encryptionIv` varchar(64) NOT NULL,
	`encryptionTag` varchar(64) NOT NULL,
	`deletedAt` timestamp,
	`purgeAfter` timestamp,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `password_vault_entries_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE INDEX `password_vault_entries_account_idx` ON `password_vault_entries` (`accountId`);