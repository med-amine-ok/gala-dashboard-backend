import { relations } from "drizzle-orm/relations";
import { djangoContentType, authPermission, authGroup, authGroupPermissions, participantsParticipant, participantsParticipantparticipantlink, participantsParticipantimage, accountsCustomuser, accountsCustomuserGroups, agendaSpeaker, agendaAgendaSpeakers, agendaAgenda, agendaAgendaregistration, ticketsTicket, ticketsTicketscan, tokenBlacklistOutstandingtoken, companiesCompany, companiesCompanyparticipantlink, notificationsEmaillog, notificationsEmailtemplate, notificationsNotification, participantsFeedback, accountsCustomuserUserPermissions, djangoAdminLog, tokenBlacklistBlacklistedtoken } from "./schema";

export const authPermissionRelations = relations(authPermission, ({one, many}) => ({
	djangoContentType: one(djangoContentType, {
		fields: [authPermission.contentTypeId],
		references: [djangoContentType.id]
	}),
	authGroupPermissions: many(authGroupPermissions),
	accountsCustomuserUserPermissions: many(accountsCustomuserUserPermissions),
}));

export const djangoContentTypeRelations = relations(djangoContentType, ({many}) => ({
	authPermissions: many(authPermission),
	djangoAdminLogs: many(djangoAdminLog),
}));

export const authGroupPermissionsRelations = relations(authGroupPermissions, ({one}) => ({
	authGroup: one(authGroup, {
		fields: [authGroupPermissions.groupId],
		references: [authGroup.id]
	}),
	authPermission: one(authPermission, {
		fields: [authGroupPermissions.permissionId],
		references: [authPermission.id]
	}),
}));

export const authGroupRelations = relations(authGroup, ({many}) => ({
	authGroupPermissions: many(authGroupPermissions),
	accountsCustomuserGroups: many(accountsCustomuserGroups),
}));

export const participantsParticipantparticipantlinkRelations = relations(participantsParticipantparticipantlink, ({one}) => ({
	participantsParticipant_currentParticipantId: one(participantsParticipant, {
		fields: [participantsParticipantparticipantlink.currentParticipantId],
		references: [participantsParticipant.id],
		relationName: "participantsParticipantparticipantlink_currentParticipantId_participantsParticipant_id"
	}),
	participantsParticipant_participantId: one(participantsParticipant, {
		fields: [participantsParticipantparticipantlink.participantId],
		references: [participantsParticipant.id],
		relationName: "participantsParticipantparticipantlink_participantId_participantsParticipant_id"
	}),
}));

export const participantsParticipantRelations = relations(participantsParticipant, ({one, many}) => ({
	participantsParticipantparticipantlinks_currentParticipantId: many(participantsParticipantparticipantlink, {
		relationName: "participantsParticipantparticipantlink_currentParticipantId_participantsParticipant_id"
	}),
	participantsParticipantparticipantlinks_participantId: many(participantsParticipantparticipantlink, {
		relationName: "participantsParticipantparticipantlink_participantId_participantsParticipant_id"
	}),
	participantsParticipantimages: many(participantsParticipantimage),
	accountsCustomuser_approvedById: one(accountsCustomuser, {
		fields: [participantsParticipant.approvedById],
		references: [accountsCustomuser.id],
		relationName: "participantsParticipant_approvedById_accountsCustomuser_id"
	}),
	accountsCustomuser_userId: one(accountsCustomuser, {
		fields: [participantsParticipant.userId],
		references: [accountsCustomuser.id],
		relationName: "participantsParticipant_userId_accountsCustomuser_id"
	}),
	ticketsTickets: many(ticketsTicket),
	companiesCompanyparticipantlinks: many(companiesCompanyparticipantlink),
	notificationsEmaillogs: many(notificationsEmaillog),
	notificationsNotifications: many(notificationsNotification),
	participantsFeedbacks: many(participantsFeedback),
}));

export const participantsParticipantimageRelations = relations(participantsParticipantimage, ({one}) => ({
	participantsParticipant: one(participantsParticipant, {
		fields: [participantsParticipantimage.participantId],
		references: [participantsParticipant.id]
	}),
}));

export const accountsCustomuserGroupsRelations = relations(accountsCustomuserGroups, ({one}) => ({
	accountsCustomuser: one(accountsCustomuser, {
		fields: [accountsCustomuserGroups.customuserId],
		references: [accountsCustomuser.id]
	}),
	authGroup: one(authGroup, {
		fields: [accountsCustomuserGroups.groupId],
		references: [authGroup.id]
	}),
}));

export const accountsCustomuserRelations = relations(accountsCustomuser, ({many}) => ({
	accountsCustomuserGroups: many(accountsCustomuserGroups),
	participantsParticipants_approvedById: many(participantsParticipant, {
		relationName: "participantsParticipant_approvedById_accountsCustomuser_id"
	}),
	participantsParticipants_userId: many(participantsParticipant, {
		relationName: "participantsParticipant_userId_accountsCustomuser_id"
	}),
	ticketsTickets: many(ticketsTicket),
	ticketsTicketscans: many(ticketsTicketscan),
	tokenBlacklistOutstandingtokens: many(tokenBlacklistOutstandingtoken),
	companiesCompanies: many(companiesCompany),
	notificationsEmaillogs: many(notificationsEmaillog),
	notificationsNotifications: many(notificationsNotification),
	accountsCustomuserUserPermissions: many(accountsCustomuserUserPermissions),
	djangoAdminLogs: many(djangoAdminLog),
}));

export const agendaAgendaSpeakersRelations = relations(agendaAgendaSpeakers, ({one}) => ({
	agendaSpeaker: one(agendaSpeaker, {
		fields: [agendaAgendaSpeakers.speakerId],
		references: [agendaSpeaker.id]
	}),
	agendaAgendum: one(agendaAgenda, {
		fields: [agendaAgendaSpeakers.agendaId],
		references: [agendaAgenda.id]
	}),
}));

export const agendaSpeakerRelations = relations(agendaSpeaker, ({many}) => ({
	agendaAgendaSpeakers: many(agendaAgendaSpeakers),
}));

export const agendaAgendaRelations = relations(agendaAgenda, ({many}) => ({
	agendaAgendaSpeakers: many(agendaAgendaSpeakers),
	agendaAgendaregistrations: many(agendaAgendaregistration),
}));

export const agendaAgendaregistrationRelations = relations(agendaAgendaregistration, ({one}) => ({
	agendaAgendum: one(agendaAgenda, {
		fields: [agendaAgendaregistration.agendaItemId],
		references: [agendaAgenda.id]
	}),
}));

export const ticketsTicketRelations = relations(ticketsTicket, ({one, many}) => ({
	accountsCustomuser: one(accountsCustomuser, {
		fields: [ticketsTicket.checkedInById],
		references: [accountsCustomuser.id]
	}),
	participantsParticipant: one(participantsParticipant, {
		fields: [ticketsTicket.participantId],
		references: [participantsParticipant.id]
	}),
	ticketsTicketscans: many(ticketsTicketscan),
}));

export const ticketsTicketscanRelations = relations(ticketsTicketscan, ({one}) => ({
	accountsCustomuser: one(accountsCustomuser, {
		fields: [ticketsTicketscan.scannedById],
		references: [accountsCustomuser.id]
	}),
	ticketsTicket: one(ticketsTicket, {
		fields: [ticketsTicketscan.ticketId],
		references: [ticketsTicket.id]
	}),
}));

export const tokenBlacklistOutstandingtokenRelations = relations(tokenBlacklistOutstandingtoken, ({one, many}) => ({
	accountsCustomuser: one(accountsCustomuser, {
		fields: [tokenBlacklistOutstandingtoken.userId],
		references: [accountsCustomuser.id]
	}),
	tokenBlacklistBlacklistedtokens: many(tokenBlacklistBlacklistedtoken),
}));

export const companiesCompanyRelations = relations(companiesCompany, ({one, many}) => ({
	accountsCustomuser: one(accountsCustomuser, {
		fields: [companiesCompany.userId],
		references: [accountsCustomuser.id]
	}),
	companiesCompanyparticipantlinks: many(companiesCompanyparticipantlink),
}));

export const companiesCompanyparticipantlinkRelations = relations(companiesCompanyparticipantlink, ({one}) => ({
	companiesCompany: one(companiesCompany, {
		fields: [companiesCompanyparticipantlink.companyId],
		references: [companiesCompany.id]
	}),
	participantsParticipant: one(participantsParticipant, {
		fields: [companiesCompanyparticipantlink.participantId],
		references: [participantsParticipant.id]
	}),
}));

export const notificationsEmaillogRelations = relations(notificationsEmaillog, ({one}) => ({
	accountsCustomuser: one(accountsCustomuser, {
		fields: [notificationsEmaillog.sentById],
		references: [accountsCustomuser.id]
	}),
	notificationsEmailtemplate: one(notificationsEmailtemplate, {
		fields: [notificationsEmaillog.templateUsedId],
		references: [notificationsEmailtemplate.id]
	}),
	participantsParticipant: one(participantsParticipant, {
		fields: [notificationsEmaillog.participantId],
		references: [participantsParticipant.id]
	}),
}));

export const notificationsEmailtemplateRelations = relations(notificationsEmailtemplate, ({many}) => ({
	notificationsEmaillogs: many(notificationsEmaillog),
}));

export const notificationsNotificationRelations = relations(notificationsNotification, ({one}) => ({
	accountsCustomuser: one(accountsCustomuser, {
		fields: [notificationsNotification.recipientId],
		references: [accountsCustomuser.id]
	}),
	participantsParticipant: one(participantsParticipant, {
		fields: [notificationsNotification.participantId],
		references: [participantsParticipant.id]
	}),
}));

export const participantsFeedbackRelations = relations(participantsFeedback, ({one}) => ({
	participantsParticipant: one(participantsParticipant, {
		fields: [participantsFeedback.participantId],
		references: [participantsParticipant.id]
	}),
}));

export const accountsCustomuserUserPermissionsRelations = relations(accountsCustomuserUserPermissions, ({one}) => ({
	accountsCustomuser: one(accountsCustomuser, {
		fields: [accountsCustomuserUserPermissions.customuserId],
		references: [accountsCustomuser.id]
	}),
	authPermission: one(authPermission, {
		fields: [accountsCustomuserUserPermissions.permissionId],
		references: [authPermission.id]
	}),
}));

export const djangoAdminLogRelations = relations(djangoAdminLog, ({one}) => ({
	djangoContentType: one(djangoContentType, {
		fields: [djangoAdminLog.contentTypeId],
		references: [djangoContentType.id]
	}),
	accountsCustomuser: one(accountsCustomuser, {
		fields: [djangoAdminLog.userId],
		references: [accountsCustomuser.id]
	}),
}));

export const tokenBlacklistBlacklistedtokenRelations = relations(tokenBlacklistBlacklistedtoken, ({one}) => ({
	tokenBlacklistOutstandingtoken: one(tokenBlacklistOutstandingtoken, {
		fields: [tokenBlacklistBlacklistedtoken.tokenId],
		references: [tokenBlacklistOutstandingtoken.id]
	}),
}));