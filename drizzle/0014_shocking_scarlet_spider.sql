CREATE INDEX `account_sessions_account_revoked_expiry_idx` ON `account_sessions` (`accountId`,`revokedAt`,`expiresAt`);--> statement-breakpoint
CREATE INDEX `cabinet_finance_account_client_date_idx` ON `cabinet_finance_entries` (`accountId`,`clientId`,`entryDate`,`id`);--> statement-breakpoint
CREATE INDEX `client_contacts_client_deleted_idx` ON `client_contacts` (`clientId`,`deletedAt`);--> statement-breakpoint
CREATE INDEX `client_contacts_purge_after_idx` ON `client_contacts` (`purgeAfter`);--> statement-breakpoint
CREATE INDEX `clients_account_archived_name_idx` ON `clients` (`accountId`,`archivedAt`,`fullName`);--> statement-breakpoint
CREATE INDEX `clients_purge_after_idx` ON `clients` (`purgeAfter`);--> statement-breakpoint
CREATE INDEX `export_audit_account_created_idx` ON `export_audit` (`accountId`,`createdAt`);--> statement-breakpoint
CREATE INDEX `password_vault_entries_account_client_deleted_idx` ON `password_vault_entries` (`accountId`,`clientId`,`deletedAt`);--> statement-breakpoint
CREATE INDEX `password_vault_entries_purge_after_idx` ON `password_vault_entries` (`purgeAfter`);--> statement-breakpoint
CREATE INDEX `program_client_options_account_kind_deleted_sort_idx` ON `program_client_options` (`accountId`,`kind`,`deletedAt`,`sortOrder`);--> statement-breakpoint
CREATE INDEX `program_client_statuses_account_deleted_sort_idx` ON `program_client_statuses` (`accountId`,`deletedAt`,`sortOrder`);