ALTER TABLE `password_vault_entries` ADD `clientId` int;--> statement-breakpoint
ALTER TABLE `password_vault_entries` ADD `clientId` int;
CREATE INDEX `password_vault_entries_account_client_idx` ON `password_vault_entries` (`accountId`,`clientId`);
