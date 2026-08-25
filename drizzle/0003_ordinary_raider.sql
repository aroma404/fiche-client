ALTER TABLE `account_sessions` ADD `rememberMe` boolean DEFAULT false NOT NULL;--> statement-breakpoint
ALTER TABLE `accounts` ADD `termsAcceptedAt` timestamp DEFAULT (now()) NOT NULL;