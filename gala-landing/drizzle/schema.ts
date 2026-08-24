import { pgTable, bigint, varchar, timestamp, unique, integer, index, foreignKey, boolean, text, jsonb, check, smallint, uuid, pgEnum } from "drizzle-orm/pg-core"
import { sql } from "drizzle-orm"

export const status = pgEnum("status", ['pending', 'succeeded', 'failed'])


export const djangoMigrations = pgTable("django_migrations", {
	// You can use { mode: "bigint" } if numbers are exceeding js number limitations
	id: bigint({ mode: "number" }).primaryKey().generatedByDefaultAsIdentity({ name: "django_migrations_id_seq", startWith: 1, increment: 1, minValue: 1, maxValue: 9223372036854775807, cache: 1 }),
	app: varchar({ length: 255 }).notNull(),
	name: varchar({ length: 255 }).notNull(),
	applied: timestamp({ withTimezone: true, mode: 'string' }).notNull(),
});

export const djangoContentType = pgTable("django_content_type", {
	id: integer().primaryKey().generatedByDefaultAsIdentity({ name: "django_content_type_id_seq", startWith: 1, increment: 1, minValue: 1, maxValue: 2147483647, cache: 1 }),
	appLabel: varchar("app_label", { length: 100 }).notNull(),
	model: varchar({ length: 100 }).notNull(),
}, (table) => [
	unique("django_content_type_app_label_model_76bd3d3b_uniq").on(table.appLabel, table.model),
]);

export const authPermission = pgTable("auth_permission", {
	id: integer().primaryKey().generatedByDefaultAsIdentity({ name: "auth_permission_id_seq", startWith: 1, increment: 1, minValue: 1, maxValue: 2147483647, cache: 1 }),
	name: varchar({ length: 255 }).notNull(),
	contentTypeId: integer("content_type_id").notNull(),
	codename: varchar({ length: 100 }).notNull(),
}, (table) => [
	index("auth_permission_content_type_id_2f476e4b").using("btree", table.contentTypeId.asc().nullsLast().op("int4_ops")),
	foreignKey({
			columns: [table.contentTypeId],
			foreignColumns: [djangoContentType.id],
			name: "auth_permission_content_type_id_2f476e4b_fk_django_co"
		}),
	unique("auth_permission_content_type_id_codename_01ab375a_uniq").on(table.contentTypeId, table.codename),
]);

export const authGroup = pgTable("auth_group", {
	id: integer().primaryKey().generatedByDefaultAsIdentity({ name: "auth_group_id_seq", startWith: 1, increment: 1, minValue: 1, maxValue: 2147483647, cache: 1 }),
	name: varchar({ length: 150 }).notNull(),
}, (table) => [
	index("auth_group_name_a6ea08ec_like").using("btree", table.name.asc().nullsLast().op("varchar_pattern_ops")),
	unique("auth_group_name_key").on(table.name),
]);

export const authGroupPermissions = pgTable("auth_group_permissions", {
	// You can use { mode: "bigint" } if numbers are exceeding js number limitations
	id: bigint({ mode: "number" }).primaryKey().generatedByDefaultAsIdentity({ name: "auth_group_permissions_id_seq", startWith: 1, increment: 1, minValue: 1, maxValue: 9223372036854775807, cache: 1 }),
	groupId: integer("group_id").notNull(),
	permissionId: integer("permission_id").notNull(),
}, (table) => [
	index("auth_group_permissions_group_id_b120cbf9").using("btree", table.groupId.asc().nullsLast().op("int4_ops")),
	index("auth_group_permissions_permission_id_84c5c92e").using("btree", table.permissionId.asc().nullsLast().op("int4_ops")),
	foreignKey({
			columns: [table.groupId],
			foreignColumns: [authGroup.id],
			name: "auth_group_permissions_group_id_b120cbf9_fk_auth_group_id"
		}),
	foreignKey({
			columns: [table.permissionId],
			foreignColumns: [authPermission.id],
			name: "auth_group_permissio_permission_id_84c5c92e_fk_auth_perm"
		}),
	unique("auth_group_permissions_group_id_permission_id_0cd325b0_uniq").on(table.groupId, table.permissionId),
]);

export const participantsParticipantparticipantlink = pgTable("participants_participantparticipantlink", {
	// You can use { mode: "bigint" } if numbers are exceeding js number limitations
	id: bigint({ mode: "number" }).primaryKey().generatedByDefaultAsIdentity({ name: "participants_participantparticipantlink_id_seq", startWith: 1, increment: 1, minValue: 1, maxValue: 9223372036854775807, cache: 1 }),
	createdAt: timestamp("created_at", { withTimezone: true, mode: 'string' }).notNull(),
	// You can use { mode: "bigint" } if numbers are exceeding js number limitations
	currentParticipantId: bigint("current_participant_id", { mode: "number" }).notNull(),
	// You can use { mode: "bigint" } if numbers are exceeding js number limitations
	participantId: bigint("participant_id", { mode: "number" }).notNull(),
}, (table) => [
	index("participants_participantpa_current_participant_id_5ba73164").using("btree", table.currentParticipantId.asc().nullsLast().op("int8_ops")),
	index("participants_participantparticipantlink_participant_id_afb9f0d7").using("btree", table.participantId.asc().nullsLast().op("int8_ops")),
	foreignKey({
			columns: [table.currentParticipantId],
			foreignColumns: [participantsParticipant.id],
			name: "participants_partici_current_participant__5ba73164_fk_participa"
		}),
	foreignKey({
			columns: [table.participantId],
			foreignColumns: [participantsParticipant.id],
			name: "participants_partici_participant_id_afb9f0d7_fk_participa"
		}),
	unique("participants_participant_current_participant_id_p_2a082706_uniq").on(table.currentParticipantId, table.participantId),
]);

export const participantsParticipantimage = pgTable("participants_participantimage", {
	// You can use { mode: "bigint" } if numbers are exceeding js number limitations
	id: bigint({ mode: "number" }).primaryKey().generatedByDefaultAsIdentity({ name: "participants_participantimage_id_seq", startWith: 1, increment: 1, minValue: 1, maxValue: 9223372036854775807, cache: 1 }),
	imageUrl: varchar("image_url", { length: 500 }).notNull(),
	cloudinaryPublicId: varchar("cloudinary_public_id", { length: 255 }).notNull(),
	uploadedAt: timestamp("uploaded_at", { withTimezone: true, mode: 'string' }).notNull(),
	// You can use { mode: "bigint" } if numbers are exceeding js number limitations
	participantId: bigint("participant_id", { mode: "number" }).notNull(),
}, (table) => [
	index("participants_participant_cloudinary_public_id_21bbfeee_like").using("btree", table.cloudinaryPublicId.asc().nullsLast().op("varchar_pattern_ops")),
	index("participants_participantimage_participant_id_b0df3670").using("btree", table.participantId.asc().nullsLast().op("int8_ops")),
	foreignKey({
			columns: [table.participantId],
			foreignColumns: [participantsParticipant.id],
			name: "participants_partici_participant_id_b0df3670_fk_participa"
		}),
	unique("participants_participantimage_cloudinary_public_id_key").on(table.cloudinaryPublicId),
]);

export const accountsCustomuser = pgTable("accounts_customuser", {
	// You can use { mode: "bigint" } if numbers are exceeding js number limitations
	id: bigint({ mode: "number" }).primaryKey().generatedByDefaultAsIdentity({ name: "accounts_customuser_id_seq", startWith: 1, increment: 1, minValue: 1, maxValue: 9223372036854775807, cache: 1 }),
	password: varchar({ length: 128 }).notNull(),
	lastLogin: timestamp("last_login", { withTimezone: true, mode: 'string' }),
	isSuperuser: boolean("is_superuser").notNull(),
	username: varchar({ length: 150 }).notNull(),
	firstName: varchar("first_name", { length: 150 }).notNull(),
	lastName: varchar("last_name", { length: 150 }).notNull(),
	isStaff: boolean("is_staff").notNull(),
	isActive: boolean("is_active").notNull(),
	dateJoined: timestamp("date_joined", { withTimezone: true, mode: 'string' }).notNull(),
	email: varchar({ length: 254 }).notNull(),
	updatedAt: timestamp("updated_at", { withTimezone: true, mode: 'string' }).notNull(),
	createdAt: timestamp("created_at", { withTimezone: true, mode: 'string' }).notNull(),
	role: varchar({ length: 2 }).notNull(),
	passwordSet: boolean("password_set").notNull(),
}, (table) => [
	index("accounts_customuser_email_4fd8e7ce_like").using("btree", table.email.asc().nullsLast().op("varchar_pattern_ops")),
	index("accounts_customuser_username_722f3555_like").using("btree", table.username.asc().nullsLast().op("varchar_pattern_ops")),
	unique("accounts_customuser_username_key").on(table.username),
	unique("accounts_customuser_email_key").on(table.email),
]);

export const accountsCustomuserGroups = pgTable("accounts_customuser_groups", {
	// You can use { mode: "bigint" } if numbers are exceeding js number limitations
	id: bigint({ mode: "number" }).primaryKey().generatedByDefaultAsIdentity({ name: "accounts_customuser_groups_id_seq", startWith: 1, increment: 1, minValue: 1, maxValue: 9223372036854775807, cache: 1 }),
	// You can use { mode: "bigint" } if numbers are exceeding js number limitations
	customuserId: bigint("customuser_id", { mode: "number" }).notNull(),
	groupId: integer("group_id").notNull(),
}, (table) => [
	index("accounts_customuser_groups_customuser_id_bc55088e").using("btree", table.customuserId.asc().nullsLast().op("int8_ops")),
	index("accounts_customuser_groups_group_id_86ba5f9e").using("btree", table.groupId.asc().nullsLast().op("int4_ops")),
	foreignKey({
			columns: [table.customuserId],
			foreignColumns: [accountsCustomuser.id],
			name: "accounts_customuser__customuser_id_bc55088e_fk_accounts_"
		}),
	foreignKey({
			columns: [table.groupId],
			foreignColumns: [authGroup.id],
			name: "accounts_customuser_groups_group_id_86ba5f9e_fk_auth_group_id"
		}),
	unique("accounts_customuser_groups_customuser_id_group_id_c074bdcb_uniq").on(table.customuserId, table.groupId),
]);

export const agendaAgendaSpeakers = pgTable("agenda_agenda_speakers", {
	// You can use { mode: "bigint" } if numbers are exceeding js number limitations
	id: bigint({ mode: "number" }).primaryKey().generatedByDefaultAsIdentity({ name: "agenda_agendaitem_speakers_id_seq", startWith: 1, increment: 1, minValue: 1, maxValue: 9223372036854775807, cache: 1 }),
	// You can use { mode: "bigint" } if numbers are exceeding js number limitations
	agendaId: bigint("agenda_id", { mode: "number" }).notNull(),
	// You can use { mode: "bigint" } if numbers are exceeding js number limitations
	speakerId: bigint("speaker_id", { mode: "number" }).notNull(),
}, (table) => [
	index("agenda_agendaitem_speakers_agendaitem_id_8284f94f").using("btree", table.agendaId.asc().nullsLast().op("int8_ops")),
	index("agenda_agendaitem_speakers_speaker_id_2d5972dd").using("btree", table.speakerId.asc().nullsLast().op("int8_ops")),
	foreignKey({
			columns: [table.speakerId],
			foreignColumns: [agendaSpeaker.id],
			name: "agenda_agendaitem_sp_speaker_id_2d5972dd_fk_agenda_sp"
		}),
	foreignKey({
			columns: [table.agendaId],
			foreignColumns: [agendaAgenda.id],
			name: "agenda_agenda_speakers_agenda_id_7edf93b6_fk_agenda_agenda_id"
		}),
	unique("agenda_agendaitem_speake_agendaitem_id_speaker_id_9166fdcb_uniq").on(table.agendaId, table.speakerId),
]);

export const agendaAgenda = pgTable("agenda_agenda", {
	// You can use { mode: "bigint" } if numbers are exceeding js number limitations
	id: bigint({ mode: "number" }).primaryKey().generatedByDefaultAsIdentity({ name: "agenda_agendaitem_id_seq", startWith: 1, increment: 1, minValue: 1, maxValue: 9223372036854775807, cache: 1 }),
	title: varchar({ length: 255 }).notNull(),
	description: text().notNull(),
	startTime: timestamp("start_time", { withTimezone: true, mode: 'string' }).notNull(),
	endTime: timestamp("end_time", { withTimezone: true, mode: 'string' }).notNull(),
	place: varchar({ length: 255 }).notNull(),
	createdAt: timestamp("created_at", { withTimezone: true, mode: 'string' }).notNull(),
	updatedAt: timestamp("updated_at", { withTimezone: true, mode: 'string' }).notNull(),
});

export const agendaAgendaregistration = pgTable("agenda_agendaregistration", {
	// You can use { mode: "bigint" } if numbers are exceeding js number limitations
	id: bigint({ mode: "number" }).primaryKey().generatedByDefaultAsIdentity({ name: "agenda_agendaregistration_id_seq", startWith: 1, increment: 1, minValue: 1, maxValue: 9223372036854775807, cache: 1 }),
	registeredAt: timestamp("registered_at", { withTimezone: true, mode: 'string' }).notNull(),
	attended: boolean().notNull(),
	attendanceMarkedAt: timestamp("attendance_marked_at", { withTimezone: true, mode: 'string' }),
	// You can use { mode: "bigint" } if numbers are exceeding js number limitations
	agendaItemId: bigint("agenda_item_id", { mode: "number" }).notNull(),
}, (table) => [
	index("agenda_agendaregistration_agenda_item_id_062394da").using("btree", table.agendaItemId.asc().nullsLast().op("int8_ops")),
	foreignKey({
			columns: [table.agendaItemId],
			foreignColumns: [agendaAgenda.id],
			name: "agenda_agendaregistr_agenda_item_id_062394da_fk_agenda_ag"
		}),
]);

export const participantsParticipant = pgTable("participants_participant", {
	// You can use { mode: "bigint" } if numbers are exceeding js number limitations
	id: bigint({ mode: "number" }).primaryKey().notNull(),
	participantType: varchar("participant_type", { length: 2 }).notNull(),
	status: varchar({ length: 10 }).notNull(),
	registeredAt: timestamp("registered_at", { withTimezone: true, mode: 'string' }).notNull(),
	updatedAt: timestamp("updated_at", { withTimezone: true, mode: 'string' }).notNull(),
	// You can use { mode: "bigint" } if numbers are exceeding js number limitations
	approvedById: bigint("approved_by_id", { mode: "number" }),
	linkedinUrl: varchar("linkedin_url", { length: 200 }).notNull(),
	paymentStatus: varchar("payment_status", { length: 50 }).notNull(),
	approvedAt: timestamp("approved_at", { withTimezone: true, mode: 'string' }),
	graduationYear: varchar("graduation_year", { length: 50 }).notNull(),
	rejectionReason: text("rejection_reason").notNull(),
	university: varchar({ length: 255 }).notNull(),
	// You can use { mode: "bigint" } if numbers are exceeding js number limitations
	userId: bigint("user_id", { mode: "number" }),
	academicLevel: varchar("academic_level", { length: 255 }).notNull(),
	academicLevelOther: varchar("academic_level_other", { length: 255 }).notNull(),
	additionalComments: text("additional_comments").notNull(),
	attendedBefore: boolean("attended_before").notNull(),
	benefitFromEvent: text("benefit_from_event").notNull(),
	fieldOfStudy: varchar("field_of_study", { length: 255 }).notNull(),
	fieldOfStudyOther: varchar("field_of_study_other", { length: 255 }).notNull(),
	graduationYearOther: varchar("graduation_year_other", { length: 50 }).notNull(),
	heardAbout: varchar("heard_about", { length: 255 }).notNull(),
	heardAboutOther: varchar("heard_about_other", { length: 255 }).notNull(),
	personalDescription: text("personal_description").notNull(),
	perspectiveGala: text("perspective_gala").notNull(),
	plansNextYear: text("plans_next_year").notNull(),
	universityOther: varchar("university_other", { length: 255 }).notNull(),
	phone: varchar({ length: 20 }).notNull(),
	email: varchar({ length: 254 }),
	firstName: varchar("first_name", { length: 150 }),
	lastName: varchar("last_name", { length: 150 }),
}, (table) => [
	index("participants_participant_approved_by_id_bdf59a9e").using("btree", table.approvedById.asc().nullsLast().op("int8_ops")),
	foreignKey({
			columns: [table.approvedById],
			foreignColumns: [accountsCustomuser.id],
			name: "participants_partici_approved_by_id_bdf59a9e_fk_accounts_"
		}),
	foreignKey({
			columns: [table.userId],
			foreignColumns: [accountsCustomuser.id],
			name: "participants_partici_user_id_a3da47e5_fk_accounts_"
		}),
	unique("participants_participant_user_id_key").on(table.userId),
]);

export const djangoSession = pgTable("django_session", {
	sessionKey: varchar("session_key", { length: 40 }).primaryKey().notNull(),
	sessionData: text("session_data").notNull(),
	expireDate: timestamp("expire_date", { withTimezone: true, mode: 'string' }).notNull(),
}, (table) => [
	index("django_session_expire_date_a5c62663").using("btree", table.expireDate.asc().nullsLast().op("timestamptz_ops")),
	index("django_session_session_key_c0390e0f_like").using("btree", table.sessionKey.asc().nullsLast().op("varchar_pattern_ops")),
]);

export const ticketsTicket = pgTable("tickets_ticket", {
	// You can use { mode: "bigint" } if numbers are exceeding js number limitations
	id: bigint({ mode: "number" }).primaryKey().generatedByDefaultAsIdentity({ name: "tickets_ticket_id_seq", startWith: 1, increment: 1, minValue: 1, maxValue: 9223372036854775807, cache: 1 }),
	serialNumber: varchar("serial_number", { length: 20 }).notNull(),
	status: varchar({ length: 20 }).notNull(),
	issuedAt: timestamp("issued_at", { withTimezone: true, mode: 'string' }).notNull(),
	assignedAt: timestamp("assigned_at", { withTimezone: true, mode: 'string' }),
	checkedInAt: timestamp("checked_in_at", { withTimezone: true, mode: 'string' }),
	emailSent: boolean("email_sent").notNull(),
	emailSentAt: timestamp("email_sent_at", { withTimezone: true, mode: 'string' }),
	createdAt: timestamp("created_at", { withTimezone: true, mode: 'string' }).notNull(),
	updatedAt: timestamp("updated_at", { withTimezone: true, mode: 'string' }).notNull(),
	// You can use { mode: "bigint" } if numbers are exceeding js number limitations
	checkedInById: bigint("checked_in_by_id", { mode: "number" }),
	// You can use { mode: "bigint" } if numbers are exceeding js number limitations
	participantId: bigint("participant_id", { mode: "number" }),
}, (table) => [
	index("tickets_ticket_checked_in_by_id_f7f60f19").using("btree", table.checkedInById.asc().nullsLast().op("int8_ops")),
	index("tickets_ticket_ticket_number_d9b1511a_like").using("btree", table.serialNumber.asc().nullsLast().op("varchar_pattern_ops")),
	foreignKey({
			columns: [table.checkedInById],
			foreignColumns: [accountsCustomuser.id],
			name: "tickets_ticket_checked_in_by_id_f7f60f19_fk_accounts_"
		}),
	foreignKey({
			columns: [table.participantId],
			foreignColumns: [participantsParticipant.id],
			name: "tickets_ticket_participant_id_685cb502_fk_participa"
		}),
	unique("tickets_ticket_ticket_number_key").on(table.serialNumber),
	unique("tickets_ticket_participant_id_key").on(table.participantId),
]);

export const ticketsTicketscan = pgTable("tickets_ticketscan", {
	// You can use { mode: "bigint" } if numbers are exceeding js number limitations
	id: bigint({ mode: "number" }).primaryKey().generatedByDefaultAsIdentity({ name: "tickets_ticketscan_id_seq", startWith: 1, increment: 1, minValue: 1, maxValue: 9223372036854775807, cache: 1 }),
	scanDatetime: timestamp("scan_datetime", { withTimezone: true, mode: 'string' }).notNull(),
	scanLocation: varchar("scan_location", { length: 100 }),
	scanResult: varchar("scan_result", { length: 20 }).notNull(),
	// You can use { mode: "bigint" } if numbers are exceeding js number limitations
	scannedById: bigint("scanned_by_id", { mode: "number" }).notNull(),
	// You can use { mode: "bigint" } if numbers are exceeding js number limitations
	ticketId: bigint("ticket_id", { mode: "number" }).notNull(),
}, (table) => [
	index("tickets_ticketscan_scanned_by_id_0657ee6e").using("btree", table.scannedById.asc().nullsLast().op("int8_ops")),
	index("tickets_ticketscan_ticket_id_0df45168").using("btree", table.ticketId.asc().nullsLast().op("int8_ops")),
	foreignKey({
			columns: [table.scannedById],
			foreignColumns: [accountsCustomuser.id],
			name: "tickets_ticketscan_scanned_by_id_0657ee6e_fk_accounts_"
		}),
	foreignKey({
			columns: [table.ticketId],
			foreignColumns: [ticketsTicket.id],
			name: "tickets_ticketscan_ticket_id_0df45168_fk_tickets_ticket_id"
		}),
]);

export const tokenBlacklistOutstandingtoken = pgTable("token_blacklist_outstandingtoken", {
	// You can use { mode: "bigint" } if numbers are exceeding js number limitations
	id: bigint({ mode: "number" }).primaryKey().generatedByDefaultAsIdentity({ name: "token_blacklist_outstandingtoken_id_seq", startWith: 1, increment: 1, minValue: 1, maxValue: 9223372036854775807, cache: 1 }),
	token: text().notNull(),
	createdAt: timestamp("created_at", { withTimezone: true, mode: 'string' }),
	expiresAt: timestamp("expires_at", { withTimezone: true, mode: 'string' }).notNull(),
	// You can use { mode: "bigint" } if numbers are exceeding js number limitations
	userId: bigint("user_id", { mode: "number" }),
	jti: varchar({ length: 255 }).notNull(),
}, (table) => [
	index("token_blacklist_outstandingtoken_jti_hex_d9bdf6f7_like").using("btree", table.jti.asc().nullsLast().op("varchar_pattern_ops")),
	index("token_blacklist_outstandingtoken_user_id_83bc629a").using("btree", table.userId.asc().nullsLast().op("int8_ops")),
	foreignKey({
			columns: [table.userId],
			foreignColumns: [accountsCustomuser.id],
			name: "token_blacklist_outs_user_id_83bc629a_fk_accounts_"
		}),
	unique("token_blacklist_outstandingtoken_jti_hex_d9bdf6f7_uniq").on(table.jti),
]);

export const agendaSpeaker = pgTable("agenda_speaker", {
	// You can use { mode: "bigint" } if numbers are exceeding js number limitations
	id: bigint({ mode: "number" }).primaryKey().generatedByDefaultAsIdentity({ name: "agenda_speaker_id_seq", startWith: 1, increment: 1, minValue: 1, maxValue: 9223372036854775807, cache: 1 }),
	name: varchar({ length: 255 }).notNull(),
	bio: text().notNull(),
	companyName: varchar("company_name", { length: 255 }).notNull(),
	photo: varchar({ length: 100 }),
});

export const companiesCompany = pgTable("companies_company", {
	// You can use { mode: "bigint" } if numbers are exceeding js number limitations
	id: bigint({ mode: "number" }).primaryKey().generatedByDefaultAsIdentity({ name: "companies_company_id_seq", startWith: 1, increment: 1, minValue: 1, maxValue: 9223372036854775807, cache: 1 }),
	name: varchar({ length: 200 }).notNull(),
	description: text(),
	email: varchar({ length: 254 }).notNull(),
	website: varchar({ length: 200 }),
	contactPerson: varchar("contact_person", { length: 100 }),
	phone: varchar({ length: 20 }),
	address: text(),
	logo: varchar({ length: 100 }),
	createdAt: timestamp("created_at", { withTimezone: true, mode: 'string' }).notNull(),
	updatedAt: timestamp("updated_at", { withTimezone: true, mode: 'string' }).notNull(),
	field: varchar({ length: 100 }),
	// You can use { mode: "bigint" } if numbers are exceeding js number limitations
	userId: bigint("user_id", { mode: "number" }),
}, (table) => [
	foreignKey({
			columns: [table.userId],
			foreignColumns: [accountsCustomuser.id],
			name: "companies_company_user_id_175c2d31_fk_accounts_customuser_id"
		}),
	unique("companies_company_user_id_key").on(table.userId),
]);

export const companiesCompanyparticipantlink = pgTable("companies_companyparticipantlink", {
	// You can use { mode: "bigint" } if numbers are exceeding js number limitations
	id: bigint({ mode: "number" }).primaryKey().generatedByDefaultAsIdentity({ name: "companies_companyparticipantlink_id_seq", startWith: 1, increment: 1, minValue: 1, maxValue: 9223372036854775807, cache: 1 }),
	createdAt: timestamp("created_at", { withTimezone: true, mode: 'string' }).notNull(),
	// You can use { mode: "bigint" } if numbers are exceeding js number limitations
	companyId: bigint("company_id", { mode: "number" }).notNull(),
	// You can use { mode: "bigint" } if numbers are exceeding js number limitations
	participantId: bigint("participant_id", { mode: "number" }).notNull(),
}, (table) => [
	index("companies_companyparticipantlink_company_id_bc7e134a").using("btree", table.companyId.asc().nullsLast().op("int8_ops")),
	index("companies_companyparticipantlink_participant_id_4716043d").using("btree", table.participantId.asc().nullsLast().op("int8_ops")),
	foreignKey({
			columns: [table.companyId],
			foreignColumns: [companiesCompany.id],
			name: "companies_companypar_company_id_bc7e134a_fk_companies"
		}),
	foreignKey({
			columns: [table.participantId],
			foreignColumns: [participantsParticipant.id],
			name: "companies_companypar_participant_id_4716043d_fk_participa"
		}),
	unique("companies_companypartici_company_id_participant_i_22c1511b_uniq").on(table.companyId, table.participantId),
]);

export const notificationsEmaillog = pgTable("notifications_emaillog", {
	// You can use { mode: "bigint" } if numbers are exceeding js number limitations
	id: bigint({ mode: "number" }).primaryKey().generatedByDefaultAsIdentity({ name: "notifications_emaillog_id_seq", startWith: 1, increment: 1, minValue: 1, maxValue: 9223372036854775807, cache: 1 }),
	recipientEmail: varchar("recipient_email", { length: 254 }).notNull(),
	recipientName: varchar("recipient_name", { length: 100 }),
	subject: varchar({ length: 200 }).notNull(),
	bodyHtml: text("body_html"),
	bodyText: text("body_text"),
	status: varchar({ length: 20 }).notNull(),
	sentAt: timestamp("sent_at", { withTimezone: true, mode: 'string' }),
	deliveryStatus: text("delivery_status"),
	errorMessage: text("error_message"),
	createdAt: timestamp("created_at", { withTimezone: true, mode: 'string' }).notNull(),
	updatedAt: timestamp("updated_at", { withTimezone: true, mode: 'string' }).notNull(),
	// You can use { mode: "bigint" } if numbers are exceeding js number limitations
	participantId: bigint("participant_id", { mode: "number" }),
	// You can use { mode: "bigint" } if numbers are exceeding js number limitations
	sentById: bigint("sent_by_id", { mode: "number" }),
	// You can use { mode: "bigint" } if numbers are exceeding js number limitations
	templateUsedId: bigint("template_used_id", { mode: "number" }),
}, (table) => [
	index("notifications_emaillog_participant_id_f85aedc1").using("btree", table.participantId.asc().nullsLast().op("int8_ops")),
	index("notifications_emaillog_sent_by_id_31a67c4a").using("btree", table.sentById.asc().nullsLast().op("int8_ops")),
	index("notifications_emaillog_template_used_id_78046de5").using("btree", table.templateUsedId.asc().nullsLast().op("int8_ops")),
	foreignKey({
			columns: [table.sentById],
			foreignColumns: [accountsCustomuser.id],
			name: "notifications_emaill_sent_by_id_31a67c4a_fk_accounts_"
		}),
	foreignKey({
			columns: [table.templateUsedId],
			foreignColumns: [notificationsEmailtemplate.id],
			name: "notifications_emaill_template_used_id_78046de5_fk_notificat"
		}),
	foreignKey({
			columns: [table.participantId],
			foreignColumns: [participantsParticipant.id],
			name: "notifications_emaill_participant_id_f85aedc1_fk_participa"
		}),
]);

export const notificationsEmailtemplate = pgTable("notifications_emailtemplate", {
	// You can use { mode: "bigint" } if numbers are exceeding js number limitations
	id: bigint({ mode: "number" }).primaryKey().generatedByDefaultAsIdentity({ name: "notifications_emailtemplate_id_seq", startWith: 1, increment: 1, minValue: 1, maxValue: 9223372036854775807, cache: 1 }),
	name: varchar({ length: 100 }).notNull(),
	templateType: varchar("template_type", { length: 30 }).notNull(),
	subject: varchar({ length: 200 }).notNull(),
	bodyHtml: text("body_html").notNull(),
	bodyText: text("body_text").notNull(),
	isActive: boolean("is_active").notNull(),
	availableVariables: jsonb("available_variables").notNull(),
	createdAt: timestamp("created_at", { withTimezone: true, mode: 'string' }).notNull(),
	updatedAt: timestamp("updated_at", { withTimezone: true, mode: 'string' }).notNull(),
}, (table) => [
	index("notifications_emailtemplate_template_type_1c3f0c6b_like").using("btree", table.templateType.asc().nullsLast().op("varchar_pattern_ops")),
	unique("notifications_emailtemplate_template_type_key").on(table.templateType),
]);

export const notificationsNotification = pgTable("notifications_notification", {
	// You can use { mode: "bigint" } if numbers are exceeding js number limitations
	id: bigint({ mode: "number" }).primaryKey().generatedByDefaultAsIdentity({ name: "notifications_notification_id_seq", startWith: 1, increment: 1, minValue: 1, maxValue: 9223372036854775807, cache: 1 }),
	notificationType: varchar("notification_type", { length: 30 }).notNull(),
	title: varchar({ length: 200 }).notNull(),
	message: text().notNull(),
	isRead: boolean("is_read").notNull(),
	readAt: timestamp("read_at", { withTimezone: true, mode: 'string' }),
	createdAt: timestamp("created_at", { withTimezone: true, mode: 'string' }).notNull(),
	// You can use { mode: "bigint" } if numbers are exceeding js number limitations
	participantId: bigint("participant_id", { mode: "number" }),
	// You can use { mode: "bigint" } if numbers are exceeding js number limitations
	recipientId: bigint("recipient_id", { mode: "number" }).notNull(),
}, (table) => [
	index("notifications_notification_participant_id_b9479876").using("btree", table.participantId.asc().nullsLast().op("int8_ops")),
	index("notifications_notification_recipient_id_d055f3f0").using("btree", table.recipientId.asc().nullsLast().op("int8_ops")),
	foreignKey({
			columns: [table.recipientId],
			foreignColumns: [accountsCustomuser.id],
			name: "notifications_notifi_recipient_id_d055f3f0_fk_accounts_"
		}),
	foreignKey({
			columns: [table.participantId],
			foreignColumns: [participantsParticipant.id],
			name: "notifications_notifi_participant_id_b9479876_fk_participa"
		}),
]);

export const participantsFeedback = pgTable("participants_feedback", {
	// You can use { mode: "bigint" } if numbers are exceeding js number limitations
	id: bigint({ mode: "number" }).primaryKey().generatedByDefaultAsIdentity({ name: "participants_feedback_id_seq", startWith: 1, increment: 1, minValue: 1, maxValue: 9223372036854775807, cache: 1 }),
	feedback: text().notNull(),
	submittedAt: timestamp("submitted_at", { withTimezone: true, mode: 'string' }).notNull(),
	// You can use { mode: "bigint" } if numbers are exceeding js number limitations
	participantId: bigint("participant_id", { mode: "number" }).notNull(),
}, (table) => [
	index("participants_feedback_participant_id_3416e3fe").using("btree", table.participantId.asc().nullsLast().op("int8_ops")),
	foreignKey({
			columns: [table.participantId],
			foreignColumns: [participantsParticipant.id],
			name: "participants_feedbac_participant_id_3416e3fe_fk_participa"
		}),
]);

export const accountsCustomuserUserPermissions = pgTable("accounts_customuser_user_permissions", {
	// You can use { mode: "bigint" } if numbers are exceeding js number limitations
	id: bigint({ mode: "number" }).primaryKey().generatedByDefaultAsIdentity({ name: "accounts_customuser_user_permissions_id_seq", startWith: 1, increment: 1, minValue: 1, maxValue: 9223372036854775807, cache: 1 }),
	// You can use { mode: "bigint" } if numbers are exceeding js number limitations
	customuserId: bigint("customuser_id", { mode: "number" }).notNull(),
	permissionId: integer("permission_id").notNull(),
}, (table) => [
	index("accounts_customuser_user_permissions_customuser_id_0deaefae").using("btree", table.customuserId.asc().nullsLast().op("int8_ops")),
	index("accounts_customuser_user_permissions_permission_id_aea3d0e5").using("btree", table.permissionId.asc().nullsLast().op("int4_ops")),
	foreignKey({
			columns: [table.customuserId],
			foreignColumns: [accountsCustomuser.id],
			name: "accounts_customuser__customuser_id_0deaefae_fk_accounts_"
		}),
	foreignKey({
			columns: [table.permissionId],
			foreignColumns: [authPermission.id],
			name: "accounts_customuser__permission_id_aea3d0e5_fk_auth_perm"
		}),
	unique("accounts_customuser_user_customuser_id_permission_9632a709_uniq").on(table.customuserId, table.permissionId),
]);

export const djangoAdminLog = pgTable("django_admin_log", {
	id: integer().primaryKey().generatedByDefaultAsIdentity({ name: "django_admin_log_id_seq", startWith: 1, increment: 1, minValue: 1, maxValue: 2147483647, cache: 1 }),
	actionTime: timestamp("action_time", { withTimezone: true, mode: 'string' }).notNull(),
	objectId: text("object_id"),
	objectRepr: varchar("object_repr", { length: 200 }).notNull(),
	actionFlag: smallint("action_flag").notNull(),
	changeMessage: text("change_message").notNull(),
	contentTypeId: integer("content_type_id"),
	// You can use { mode: "bigint" } if numbers are exceeding js number limitations
	userId: bigint("user_id", { mode: "number" }).notNull(),
}, (table) => [
	index("django_admin_log_content_type_id_c4bce8eb").using("btree", table.contentTypeId.asc().nullsLast().op("int4_ops")),
	index("django_admin_log_user_id_c564eba6").using("btree", table.userId.asc().nullsLast().op("int8_ops")),
	foreignKey({
			columns: [table.contentTypeId],
			foreignColumns: [djangoContentType.id],
			name: "django_admin_log_content_type_id_c4bce8eb_fk_django_co"
		}),
	foreignKey({
			columns: [table.userId],
			foreignColumns: [accountsCustomuser.id],
			name: "django_admin_log_user_id_c564eba6_fk_accounts_customuser_id"
		}),
	check("django_admin_log_action_flag_check", sql`action_flag >= 0`),
]);

export const tokenBlacklistBlacklistedtoken = pgTable("token_blacklist_blacklistedtoken", {
	// You can use { mode: "bigint" } if numbers are exceeding js number limitations
	id: bigint({ mode: "number" }).primaryKey().generatedByDefaultAsIdentity({ name: "token_blacklist_blacklistedtoken_id_seq", startWith: 1, increment: 1, minValue: 1, maxValue: 9223372036854775807, cache: 1 }),
	blacklistedAt: timestamp("blacklisted_at", { withTimezone: true, mode: 'string' }).notNull(),
	// You can use { mode: "bigint" } if numbers are exceeding js number limitations
	tokenId: bigint("token_id", { mode: "number" }).notNull(),
}, (table) => [
	foreignKey({
			columns: [table.tokenId],
			foreignColumns: [tokenBlacklistOutstandingtoken.id],
			name: "token_blacklist_blacklistedtoken_token_id_3cc7fe56_fk"
		}),
	unique("token_blacklist_blacklistedtoken_token_id_key").on(table.tokenId),
]);

export const payments = pgTable("payments", {
	id: uuid().primaryKey().notNull(),
	// You can use { mode: "bigint" } if numbers are exceeding js number limitations
	participantId: bigint("participant_id", { mode: "number" }),
	// You can use { mode: "bigint" } if numbers are exceeding js number limitations
	amount: bigint({ mode: "number" }).notNull(),
	status: status().notNull(),
	createdAt: timestamp("created_at", { withTimezone: true, mode: 'string' }),
	updatedAt: timestamp("updated_at", { withTimezone: true, mode: 'string' }),
}, (table) => [
	unique("payments_participant_id_key").on(table.participantId),
]);
