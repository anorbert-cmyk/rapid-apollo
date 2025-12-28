ALTER TABLE `analysis_results` ADD `currentPart` int DEFAULT 0;--> statement-breakpoint
ALTER TABLE `analysis_results` ADD `progressStatus` enum('pending','in_progress','completed','failed') DEFAULT 'pending';--> statement-breakpoint
ALTER TABLE `analysis_results` ADD `part1StartedAt` timestamp;--> statement-breakpoint
ALTER TABLE `analysis_results` ADD `part1CompletedAt` timestamp;--> statement-breakpoint
ALTER TABLE `analysis_results` ADD `part2StartedAt` timestamp;--> statement-breakpoint
ALTER TABLE `analysis_results` ADD `part2CompletedAt` timestamp;--> statement-breakpoint
ALTER TABLE `analysis_results` ADD `part3StartedAt` timestamp;--> statement-breakpoint
ALTER TABLE `analysis_results` ADD `part3CompletedAt` timestamp;--> statement-breakpoint
ALTER TABLE `analysis_results` ADD `part4StartedAt` timestamp;--> statement-breakpoint
ALTER TABLE `analysis_results` ADD `part4CompletedAt` timestamp;--> statement-breakpoint
ALTER TABLE `analysis_results` ADD `estimatedCompletionAt` timestamp;