CREATE TABLE `availability` (
	`id` int AUTO_INCREMENT NOT NULL,
	`dayOfWeek` int NOT NULL,
	`startTime` varchar(5) NOT NULL,
	`endTime` varchar(5) NOT NULL,
	`breakStart` varchar(5),
	`breakEnd` varchar(5),
	`active` boolean NOT NULL DEFAULT true,
	CONSTRAINT `availability_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `blockedSlots` (
	`id` int AUTO_INCREMENT NOT NULL,
	`startDatetime` timestamp NOT NULL,
	`endDatetime` timestamp NOT NULL,
	`reason` varchar(80) NOT NULL,
	`note` text,
	CONSTRAINT `blockedSlots_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `bookings` (
	`id` int AUTO_INCREMENT NOT NULL,
	`bookingNumber` varchar(32) NOT NULL,
	`customerId` int NOT NULL,
	`vehicleId` int NOT NULL,
	`serviceId` int NOT NULL,
	`date` varchar(10) NOT NULL,
	`startTime` varchar(5) NOT NULL,
	`endTime` varchar(5) NOT NULL,
	`address` text NOT NULL,
	`neighborhood` varchar(100) NOT NULL,
	`landmark` varchar(160),
	`travelFee` int NOT NULL DEFAULT 0,
	`totalPrice` int NOT NULL,
	`status` enum('draft','pending','confirmed','in_progress','completed','cancelled','no_show') NOT NULL DEFAULT 'pending',
	`paymentStatus` enum('unpaid','partial','paid') NOT NULL DEFAULT 'unpaid',
	`paymentMethod` varchar(40),
	`amountPaid` int NOT NULL DEFAULT 0,
	`remainingAmount` int NOT NULL,
	`notes` text,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `bookings_id` PRIMARY KEY(`id`),
	CONSTRAINT `bookings_bookingNumber_unique` UNIQUE(`bookingNumber`),
	CONSTRAINT `booking_date_start_unique` UNIQUE(`date`,`startTime`)
);
--> statement-breakpoint
CREATE TABLE `customers` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int,
	`firstName` varchar(80) NOT NULL,
	`lastName` varchar(80) NOT NULL,
	`email` varchar(320) NOT NULL,
	`phone` varchar(30) NOT NULL,
	`notes` text,
	`status` enum('active','inactive') NOT NULL DEFAULT 'active',
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `customers_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `notifications` (
	`id` int AUTO_INCREMENT NOT NULL,
	`bookingId` int NOT NULL,
	`type` varchar(60) NOT NULL,
	`channel` enum('email','whatsapp','sms') NOT NULL,
	`status` enum('queued','sent','failed') NOT NULL DEFAULT 'queued',
	`sentAt` timestamp,
	CONSTRAINT `notifications_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `serviceOptions` (
	`id` int AUTO_INCREMENT NOT NULL,
	`serviceId` int NOT NULL,
	`name` varchar(100) NOT NULL,
	`price` int NOT NULL,
	`durationMinutes` int NOT NULL DEFAULT 0,
	CONSTRAINT `serviceOptions_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `services` (
	`id` int AUTO_INCREMENT NOT NULL,
	`name` varchar(100) NOT NULL,
	`slug` varchar(100) NOT NULL,
	`description` text NOT NULL,
	`price` int NOT NULL,
	`durationMinutes` int NOT NULL,
	`badge` varchar(40),
	`active` boolean NOT NULL DEFAULT true,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `services_id` PRIMARY KEY(`id`),
	CONSTRAINT `services_slug_unique` UNIQUE(`slug`)
);
--> statement-breakpoint
CREATE TABLE `teamAssignments` (
	`id` int AUTO_INCREMENT NOT NULL,
	`bookingId` int NOT NULL,
	`teamId` int NOT NULL,
	CONSTRAINT `teamAssignments_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `teams` (
	`id` int AUTO_INCREMENT NOT NULL,
	`name` varchar(80) NOT NULL,
	`active` boolean NOT NULL DEFAULT true,
	CONSTRAINT `teams_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `vehicles` (
	`id` int AUTO_INCREMENT NOT NULL,
	`customerId` int NOT NULL,
	`brand` varchar(60) NOT NULL,
	`model` varchar(80) NOT NULL,
	`type` varchar(40) NOT NULL,
	`color` varchar(40) NOT NULL,
	`licensePlate` varchar(30) NOT NULL,
	`notes` text,
	CONSTRAINT `vehicles_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `zones` (
	`id` int AUTO_INCREMENT NOT NULL,
	`name` varchar(80) NOT NULL,
	`travelFee` int NOT NULL DEFAULT 0,
	`active` boolean NOT NULL DEFAULT true,
	CONSTRAINT `zones_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
ALTER TABLE `users` MODIFY COLUMN `role` enum('user','admin','staff') NOT NULL DEFAULT 'user';