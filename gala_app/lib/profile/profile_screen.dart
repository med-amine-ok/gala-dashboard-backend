import 'dart:convert';
import 'dart:developer';

import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import 'package:google_fonts/google_fonts.dart';
import 'package:qr_flutter/qr_flutter.dart';

import '../agenda/agenda_provider.dart';
import '../app_colors.dart';
import '../auth/auth_provider.dart';
import '../core/user_provider.dart';
import 'dev_team_section.dart';
import 'models/participant_model.dart';

final profileInformationProvider = FutureProvider.autoDispose<Participant>((
  ref,
) async {
  final user = ref.read(userProvider.notifier).user;
  if (user.isHR) {
    return Participant(
      id: user.id.isNotEmpty ? user.id : '1',
      email: user.email,
      phone: '',
      fieldOfStudy: 'HR & Organizing Committee',
      university: 'National Polytechnic School',
      ticketSerialNumber: 'HR-${user.id.isNotEmpty ? user.id : '001'}',
      firstName: user.firstName.isNotEmpty ? user.firstName : 'HR Administrator',
      lastName: user.lastName,
    );
  }

  final repo = ref.read(eventRepoProvider);
  try {
    final Participant profile = await repo.getParticipantProfile();
    return profile;
  } catch (e) {
    // Graceful fallback from logged-in user if participant endpoint is pending or empty
    return Participant(
      id: user.id.isNotEmpty ? user.id : '1',
      email: user.email,
      phone: '',
      fieldOfStudy: 'Engineering',
      university: 'National Polytechnic School',
      ticketSerialNumber: 'GALA-VIP-PASS',
      firstName: user.firstName.isNotEmpty ? user.firstName : 'Participant',
      lastName: user.lastName,
    );
  }
});

class ProfileScreen extends ConsumerWidget {
  const ProfileScreen({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final profileAsync = ref.watch(profileInformationProvider);
    final user = ref.read(userProvider.notifier).user;
    final bool isCompany = user.role.toLowerCase() == 'company';

    return Scaffold(
      backgroundColor: AppColors.bg,
      appBar: AppBar(
        title: Text(
          'VIP Pass & Account',
          style: GoogleFonts.cinzel(
            color: AppColors.textPrimary,
            fontSize: 18,
            fontWeight: FontWeight.bold,
            letterSpacing: 0.5,
          ),
        ),
        backgroundColor: AppColors.bg,
        elevation: 0,
        centerTitle: true,
      ),
      body: SafeArea(
        child: SingleChildScrollView(
          physics: const BouncingScrollPhysics(),
          padding: const EdgeInsets.only(bottom: 28),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.center,
            children: [
              profileAsync.when(
                data: (Participant data) {
                  final qrPayload = jsonEncode({
                    'id': data.id,
                    'lastName': data.lastName,
                    'firstName': data.firstName,
                    'email': data.email,
                    'phone': data.phone,
                    'serialNumber': data.ticketSerialNumber,
                  });
                  return ProfileQrSection(qrData: qrPayload, participant: data);
                },
                error: (Object error, StackTrace stackTrace) {
                  return ProfileQrSection(
                    qrData: 'Error: $error',
                    participant: null,
                  );
                },
                loading: () {
                  return const Padding(
                    padding: EdgeInsets.all(32.0),
                    child: Center(
                      child: CircularProgressIndicator(
                        valueColor: AlwaysStoppedAnimation<Color>(AppColors.goldPrimary),
                      ),
                    ),
                  );
                },
              ),

              const SizedBox(height: 12),

              // Dev Team Section
              const DevTeamSection(),

              // Additional Info Section (CV, Info, About)
              const AdditionalInfoSection(),

              // Gala Gallery Shortcut
              Padding(
                padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 4),
                child: InfoItem(
                  icon: Icons.photo_library_outlined,
                  title: 'Gala Gallery',
                  subtitle: 'Official event photography collection',
                  hasArrow: true,
                  onTap: () => context.pushNamed('gallery-screen'),
                ),
              ),

              // Support Section
              const SupportSection(),

              const SizedBox(height: 24),
              const LogoutButton(),
            ],
          ),
        ),
      ),
    );
  }
}

class SupportSection extends StatelessWidget {
  const SupportSection({super.key});

  @override
  Widget build(BuildContext context) {
    return Padding(
      padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 4),
      child: InfoItem(
        icon: Icons.feedback_outlined,
        title: 'Send Feedback',
        subtitle: 'Share your thoughts and event feedback',
        hasArrow: true,
        onTap: () => context.pushNamed('feedback'),
      ),
    );
  }
}

class LogoutButton extends ConsumerWidget {
  const LogoutButton({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    return Padding(
      padding: const EdgeInsets.symmetric(horizontal: 16),
      child: OutlinedButton(
        onPressed: () {
          ref.read(authControllerProvider.notifier).signOut();
          log('logged out');
          context.go('/login');
        },
        style: OutlinedButton.styleFrom(
          foregroundColor: AppColors.error,
          side: const BorderSide(color: AppColors.surfaceBorder, width: 1.2),
          backgroundColor: AppColors.surface,
          minimumSize: const Size(double.infinity, 50),
          shape: RoundedRectangleBorder(
            borderRadius: BorderRadius.circular(16),
          ),
        ),
        child: Row(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            const Icon(Icons.logout_rounded, color: AppColors.error, size: 18),
            const SizedBox(width: 8),
            Text(
              'Sign Out',
              style: GoogleFonts.plusJakartaSans(
                color: AppColors.error,
                fontWeight: FontWeight.w700,
                fontSize: 14.5,
              ),
            ),
          ],
        ),
      ),
    );
  }
}

class ProfileQrSection extends ConsumerWidget {
  final String qrData;
  final Participant? participant;

  const ProfileQrSection({super.key, required this.qrData, this.participant});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final user = ref.read(userProvider.notifier).user;
    final firstName = participant?.firstName ?? user.firstName;
    final lastName = participant?.lastName ?? user.lastName;
    final role = user.role.toUpperCase();

    return Container(
      margin: const EdgeInsets.all(16),
      padding: const EdgeInsets.all(20),
      decoration: BoxDecoration(
        color: AppColors.surface,
        borderRadius: BorderRadius.circular(24),
        border: Border.all(color: AppColors.border, width: 1.2),
        boxShadow: [
          BoxShadow(
            color: AppColors.charcoal.withOpacity(0.04),
            blurRadius: 20,
            offset: const Offset(0, 6),
          ),
        ],
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.center,
        children: [
          // Header Badge
          Row(
            mainAxisAlignment: MainAxisAlignment.spaceBetween,
            children: [
              Container(
                padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 4),
                decoration: BoxDecoration(
                  color: AppColors.goldLight,
                  borderRadius: BorderRadius.circular(8),
                  border: Border.all(color: AppColors.goldPrimary.withOpacity(0.4)),
                ),
                child: Text(
                  user.roleDisplayName.toUpperCase(),
                  style: GoogleFonts.plusJakartaSans(
                    color: AppColors.goldDark,
                    fontSize: 11,
                    fontWeight: FontWeight.w800,
                    letterSpacing: 1.0,
                  ),
                ),
              ),
              Container(
                padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
                decoration: BoxDecoration(
                  color: AppColors.lavenderSubtle,
                  borderRadius: BorderRadius.circular(8),
                ),
                child: Text(
                  'GALA PASS',
                  style: GoogleFonts.plusJakartaSans(
                    color: AppColors.lavenderDark,
                    fontSize: 10.5,
                    fontWeight: FontWeight.w700,
                    letterSpacing: 0.8,
                  ),
                ),
              ),
            ],
          ),
          const SizedBox(height: 16),

          // User Name
          Text(
            '$firstName $lastName',
            style: GoogleFonts.cinzel(
              color: AppColors.textPrimary,
              fontSize: 22,
              fontWeight: FontWeight.bold,
              letterSpacing: 0.2,
            ),
            textAlign: TextAlign.center,
          ),
          const SizedBox(height: 4),
          Text(
            participant?.university != null && participant!.university.isNotEmpty
                ? '${participant!.university} • ${participant!.fieldOfStudy}'
                : user.email,
            style: GoogleFonts.plusJakartaSans(
              color: AppColors.textSecondary,
              fontSize: 12.5,
              fontWeight: FontWeight.w500,
            ),
            textAlign: TextAlign.center,
          ),

          const SizedBox(height: 20),

          // QR Frame
          Container(
            padding: const EdgeInsets.all(16),
            decoration: BoxDecoration(
              color: AppColors.bg,
              borderRadius: BorderRadius.circular(20),
              border: Border.all(color: AppColors.border, width: 1),
            ),
            child: QrImageView(
              data: qrData,
              version: QrVersions.auto,
              size: 170,
              foregroundColor: AppColors.charcoalDark,
              backgroundColor: Colors.transparent,
            ),
          ),

          const SizedBox(height: 14),
          Text(
            'Scan for check-in & networking exchange',
            style: GoogleFonts.plusJakartaSans(
              color: AppColors.textSubtle,
              fontSize: 11.5,
              fontWeight: FontWeight.w500,
            ),
          ),
        ],
      ),
    );
  }
}

class AdditionalInfoSection extends ConsumerWidget {
  const AdditionalInfoSection({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final user = ref.watch(userProvider.notifier).user;
    final bool isHR = user.isHR;
    final bool isCompany = user.isCompany;
    final bool isParticipant = user.isParticipant;

    return Padding(
      padding: const EdgeInsets.symmetric(horizontal: 16),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Padding(
            padding: const EdgeInsets.fromLTRB(4, 16, 4, 8),
            child: Text(
              isHR ? 'Executive & Event Services' : (isCompany ? 'Company Services' : 'Event Services'),
              style: GoogleFonts.cinzel(
                color: AppColors.textPrimary,
                fontSize: 16,
                fontWeight: FontWeight.bold,
              ),
            ),
          ),

          // Company & HR: Review Linked Candidate Resumes
          if (isCompany || isHR) ...[
            InfoItem(
              icon: Icons.folder_shared_outlined,
              title: isHR ? 'All Candidate Resumes (HR)' : 'Linked Participant CVs',
              subtitle: isHR ? 'Browse and download candidates from all booths' : 'Review candidates scanned at your booth',
              hasArrow: true,
              onTap: () => context.pushNamed('company-cv'),
            ),
            const SizedBox(height: 6),
            InfoItem(
              icon: Icons.qr_code_scanner_rounded,
              title: 'Candidate QR Scanner',
              subtitle: 'Scan attendee badges to save resumes & profile',
              hasArrow: true,
              onTap: () => context.pushNamed('scan'),
            ),
            const SizedBox(height: 6),
          ],

          // Participant & HR: My Resume / CV
          if (isParticipant || isHR) ...[
            InfoItem(
              icon: Icons.upload_file_outlined,
              title: 'My Resume / CV',
              subtitle: 'Upload or update your PDF resume for companies',
              hasArrow: true,
              onTap: () => context.pushNamed('upload-cv'),
            ),
            const SizedBox(height: 6),
          ],

          // Participant & HR: Digital Business Card
          if (isParticipant || isHR) ...[
            const ParticipantDigitalCardTile(),
            const SizedBox(height: 6),
          ],

          // About the Gala
          InfoItem(
            icon: Icons.info_outline_rounded,
            title: 'About the Gala',
            subtitle: 'History, vision, and organization team',
            hasArrow: true,
            onTap: () => context.pushNamed('about-gala'),
          ),
        ],
      ),
    );
  }
}

class ParticipantDigitalCardTile extends ConsumerWidget {
  const ParticipantDigitalCardTile({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final profileAsync = ref.watch(profileInformationProvider);
    final user = ref.watch(userProvider.notifier).user;
    final bool isHR = user.isHR;

    return profileAsync.maybeWhen(
      data: (participant) {
        final fullName = isHR
            ? '${user.firstName} ${user.lastName}'.trim().isNotEmpty
                ? '${user.firstName} ${user.lastName}'.trim()
                : 'HR Administrator'
            : '${participant.firstName} ${participant.lastName}'.trim();
        final university = isHR
            ? 'National Polytechnic School'
            : (participant.university.isNotEmpty ? participant.university : 'National Polytechnic School');
        final field = isHR
            ? 'HR & Organizing Committee'
            : (participant.fieldOfStudy.isNotEmpty ? participant.fieldOfStudy : 'Engineering');
        final tagText = isHR ? 'HR-${user.id.isNotEmpty ? user.id : '001'}' : (participant.ticketSerialNumber ?? 'VIP Pass');
        final emailText = isHR && user.email.isNotEmpty ? user.email : participant.email;

        return InkWell(
          onTap: () => context.pushNamed('personal-info'),
          borderRadius: BorderRadius.circular(18),
          child: Container(
            padding: const EdgeInsets.all(16),
            decoration: BoxDecoration(
              gradient: const LinearGradient(
                begin: Alignment.topLeft,
                end: Alignment.bottomRight,
                colors: [AppColors.surface, AppColors.surfaceMuted],
              ),
              borderRadius: BorderRadius.circular(18),
              border: Border.all(
                color: isHR ? AppColors.goldPrimary : AppColors.goldPrimary.withOpacity(0.4),
                width: isHR ? 1.5 : 1.2,
              ),
              boxShadow: [
                BoxShadow(
                  color: isHR ? AppColors.goldPrimary.withOpacity(0.12) : AppColors.goldPrimary.withOpacity(0.08),
                  blurRadius: 16,
                  offset: const Offset(0, 4),
                ),
              ],
            ),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                // Top Row with Badge & Action
                Row(
                  mainAxisAlignment: MainAxisAlignment.spaceBetween,
                  children: [
                    Row(
                      children: [
                        Container(
                          padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 3),
                          decoration: BoxDecoration(
                            color: isHR ? AppColors.goldPrimary : AppColors.goldLight,
                            borderRadius: BorderRadius.circular(6),
                            border: Border.all(color: AppColors.goldPrimary),
                          ),
                          child: Row(
                            mainAxisSize: MainAxisSize.min,
                            children: [
                              Icon(
                                isHR ? Icons.verified_user_outlined : Icons.badge_outlined,
                                color: isHR ? AppColors.charcoalDark : AppColors.goldDark,
                                size: 12,
                              ),
                              const SizedBox(width: 4),
                              Text(
                                isHR ? 'HR EXECUTIVE PASS' : 'DIGITAL BADGE',
                                style: GoogleFonts.plusJakartaSans(
                                  color: isHR ? AppColors.charcoalDark : AppColors.goldDark,
                                  fontSize: 10,
                                  fontWeight: FontWeight.w800,
                                  letterSpacing: 0.8,
                                ),
                              ),
                            ],
                          ),
                        ),
                        const SizedBox(width: 8),
                        if (tagText.isNotEmpty && tagText != 'No Ticket Assigned')
                          Container(
                            padding: const EdgeInsets.symmetric(horizontal: 7, vertical: 3),
                            decoration: BoxDecoration(
                              color: isHR ? AppColors.goldLight : AppColors.lavenderSubtle,
                              borderRadius: BorderRadius.circular(6),
                              border: Border.all(color: isHR ? AppColors.goldPrimary.withOpacity(0.4) : AppColors.lavenderBorder),
                            ),
                            child: Text(
                              isHR ? '#$tagText' : tagText,
                              style: GoogleFonts.plusJakartaSans(
                                color: isHR ? AppColors.goldDark : AppColors.lavenderDark,
                                fontSize: 9.5,
                                fontWeight: FontWeight.w700,
                              ),
                            ),
                          ),
                      ],
                    ),
                    const Icon(
                      Icons.arrow_forward_ios_rounded,
                      color: AppColors.goldDark,
                      size: 13,
                    ),
                  ],
                ),
                const SizedBox(height: 12),

                // Name & Profile
                Row(
                  children: [
                    Container(
                      width: 46,
                      height: 46,
                      decoration: BoxDecoration(
                        gradient: AppColors.goldGradient,
                        shape: BoxShape.circle,
                        boxShadow: [
                          BoxShadow(
                            color: AppColors.goldPrimary.withOpacity(0.25),
                            blurRadius: 10,
                            offset: const Offset(0, 3),
                          ),
                        ],
                      ),
                      alignment: Alignment.center,
                      child: Text(
                        fullName.trim().isNotEmpty
                            ? fullName.trim().split(' ').map((e) => e.isNotEmpty ? e[0] : '').take(2).join().toUpperCase()
                            : (isHR ? 'HR' : 'G'),
                        style: GoogleFonts.cinzel(
                          color: AppColors.charcoalDark,
                          fontSize: 18,
                          fontWeight: FontWeight.bold,
                        ),
                      ),
                    ),
                    const SizedBox(width: 14),
                    Expanded(
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          Text(
                            fullName.isNotEmpty ? fullName : (isHR ? 'HR Administrator' : 'Participant Profile'),
                            style: GoogleFonts.cinzel(
                              color: AppColors.textPrimary,
                              fontSize: 16,
                              fontWeight: FontWeight.bold,
                            ),
                            maxLines: 1,
                            overflow: TextOverflow.ellipsis,
                          ),
                          const SizedBox(height: 2),
                          Text(
                            '$university • $field',
                            style: GoogleFonts.plusJakartaSans(
                              color: AppColors.goldDark,
                              fontSize: 12,
                              fontWeight: FontWeight.w600,
                            ),
                            maxLines: 1,
                            overflow: TextOverflow.ellipsis,
                          ),
                        ],
                      ),
                    ),
                  ],
                ),
                const SizedBox(height: 10),
                const Divider(color: AppColors.divider, height: 12),
                const SizedBox(height: 4),

                // Bottom Contact Summary
                Row(
                  children: [
                    Expanded(
                      child: Row(
                        children: [
                          const Icon(Icons.email_outlined, size: 13, color: AppColors.textSecondary),
                          const SizedBox(width: 5),
                          Flexible(
                            child: Text(
                              emailText,
                              style: GoogleFonts.plusJakartaSans(
                                color: AppColors.textSecondary,
                                fontSize: 11.5,
                              ),
                              overflow: TextOverflow.ellipsis,
                            ),
                          ),
                        ],
                      ),
                    ),
                    if (participant.phone.isNotEmpty) ...[
                      const SizedBox(width: 12),
                      Row(
                        children: [
                          const Icon(Icons.phone_outlined, size: 13, color: AppColors.textSecondary),
                          const SizedBox(width: 5),
                          Text(
                            participant.phone,
                            style: GoogleFonts.plusJakartaSans(
                              color: AppColors.textSecondary,
                              fontSize: 11.5,
                            ),
                          ),
                        ],
                      ),
                    ],
                  ],
                ),
              ],
            ),
          ),
        );
      },
      orElse: () => InfoItem(
        icon: Icons.badge_outlined,
        title: isHR ? 'Executive HR Digital Pass' : 'Digital Business Card',
        subtitle: isHR ? 'Staff ID: #HR-${user.id}' : 'Share your profile and contact details',
        hasArrow: true,
        onTap: () => context.pushNamed('personal-info'),
      ),
    );
  }
}

class InfoItem extends StatelessWidget {
  final IconData icon;
  final String title;
  final String? subtitle;
  final bool hasArrow;
  final VoidCallback? onTap;

  const InfoItem({
    super.key,
    required this.icon,
    required this.title,
    this.subtitle,
    this.hasArrow = false,
    this.onTap,
  });

  @override
  Widget build(BuildContext context) {
    return InkWell(
      onTap: onTap,
      borderRadius: BorderRadius.circular(16),
      child: Container(
        decoration: BoxDecoration(
          color: AppColors.surface,
          borderRadius: BorderRadius.circular(16),
          border: Border.all(color: AppColors.border),
          boxShadow: [
            BoxShadow(
              color: AppColors.charcoal.withOpacity(0.02),
              blurRadius: 8,
              offset: const Offset(0, 2),
            ),
          ],
        ),
        padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 12),
        child: Row(
          children: [
            Container(
              width: 42,
              height: 42,
              decoration: BoxDecoration(
                color: AppColors.lavenderSubtle,
                borderRadius: BorderRadius.circular(12),
                border: Border.all(color: AppColors.lavenderBorder),
              ),
              child: Icon(icon, color: AppColors.lavenderDark, size: 20),
            ),
            const SizedBox(width: 14),
            Expanded(
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text(
                    title,
                    style: GoogleFonts.plusJakartaSans(
                      color: AppColors.textPrimary,
                      fontSize: 14.5,
                      fontWeight: FontWeight.w700,
                    ),
                  ),
                  if (subtitle != null) ...[
                    const SizedBox(height: 2),
                    Text(
                      subtitle!,
                      style: GoogleFonts.plusJakartaSans(
                        color: AppColors.textSecondary,
                        fontSize: 11.5,
                      ),
                    ),
                  ],
                ],
              ),
            ),
            if (hasArrow)
              const Icon(
                Icons.arrow_forward_ios_rounded,
                color: AppColors.textSubtle,
                size: 14,
              ),
          ],
        ),
      ),
    );
  }
}

