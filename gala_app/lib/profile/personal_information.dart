import 'dart:convert';

import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:google_fonts/google_fonts.dart';
import 'package:qr_flutter/qr_flutter.dart';

import '../app_colors.dart';
import '../core/user_provider.dart';
import 'profile_screen.dart';

class DigitalBusinessCardScreen extends ConsumerWidget {
  const DigitalBusinessCardScreen({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final participantAsync = ref.watch(profileInformationProvider);
    final user = ref.watch(userProvider.notifier).user;
    final bool isHR = user.isHR;

    return Scaffold(
      backgroundColor: AppColors.bg,
      appBar: AppBar(
        title: Text(
          isHR ? 'Executive HR Digital Pass' : 'Digital Business Card',
          style: GoogleFonts.cinzel(
            color: AppColors.textPrimary,
            fontSize: 18,
            fontWeight: FontWeight.bold,
            letterSpacing: 0.5,
          ),
        ),
        backgroundColor: AppColors.bg,
        centerTitle: true,
        elevation: 0,
        leading: IconButton(
          icon: const Icon(
            Icons.arrow_back_ios_new_rounded,
            size: 20,
            color: AppColors.textPrimary,
          ),
          onPressed: () => Navigator.maybePop(context),
        ),
      ),
      body: participantAsync.when(
        loading:
            () => const Center(
              child: SizedBox(
                width: 24,
                height: 24,
                child: CircularProgressIndicator(
                  strokeWidth: 2,
                  valueColor: AlwaysStoppedAnimation<Color>(AppColors.goldPrimary),
                ),
              ),
            ),
        error:
            (error, _) => Center(
              child: Text(
                'Unable to load digital card: $error',
                style: GoogleFonts.plusJakartaSans(color: AppColors.error),
              ),
            ),
        data: (participant) {
          final fullName = isHR
              ? '${user.firstName} ${user.lastName}'.trim().isNotEmpty
                  ? '${user.firstName} ${user.lastName}'.trim()
                  : 'HR Administrator'
              : '${participant.firstName} ${participant.lastName}'.trim();
          final ticket = participant.ticketSerialNumber ?? 'No Ticket Assigned';
          final hrIdTag = 'HR-${user.id.isNotEmpty ? user.id : '001'}';
          final emailText = isHR && user.email.isNotEmpty ? user.email : participant.email;
          final phoneText = participant.phone;

          final qrPayload = jsonEncode({
            'type': isHR ? 'HR_ADMIN' : 'PARTICIPANT',
            'id': isHR ? user.id : participant.id,
            'name': fullName,
            'email': emailText,
            'role': isHR ? 'HR Admin' : 'Participant',
            'pass': isHR ? hrIdTag : ticket,
          });

          return Center(
            child: SingleChildScrollView(
              padding: const EdgeInsets.all(20),
              child: Container(
                constraints: const BoxConstraints(maxWidth: 420),
                padding: const EdgeInsets.all(24),
                decoration: BoxDecoration(
                  color: AppColors.surface,
                  borderRadius: BorderRadius.circular(24),
                  border: Border.all(
                    color: isHR ? AppColors.goldPrimary : AppColors.goldPrimary.withOpacity(0.4),
                    width: isHR ? 1.8 : 1.5,
                  ),
                  boxShadow: [
                    BoxShadow(
                      color: isHR ? AppColors.goldPrimary.withOpacity(0.12) : AppColors.charcoal.withOpacity(0.06),
                      blurRadius: 28,
                      offset: const Offset(0, 8),
                    ),
                  ],
                ),
                child: Column(
                  mainAxisSize: MainAxisSize.min,
                  children: [
                    // Top Logo & Badge Row
                    Row(
                      mainAxisAlignment: MainAxisAlignment.spaceBetween,
                      children: [
                        Row(
                          children: [
                            Image.asset(
                              'assets/logos/GALA.png',
                              width: 34,
                              height: 34,
                              fit: BoxFit.contain,
                            ),
                            const SizedBox(width: 8),
                            Column(
                              crossAxisAlignment: CrossAxisAlignment.start,
                              children: [
                                Text(
                                  "ENGINEERS' GALA",
                                  style: GoogleFonts.cinzel(
                                    color: AppColors.textPrimary,
                                    fontSize: 12.5,
                                    fontWeight: FontWeight.bold,
                                    letterSpacing: 0.5,
                                  ),
                                ),
                                Text(
                                  "9th Edition • ENP Algiers",
                                  style: GoogleFonts.plusJakartaSans(
                                    color: AppColors.goldDark,
                                    fontSize: 10,
                                    fontWeight: FontWeight.w600,
                                  ),
                                ),
                              ],
                            ),
                          ],
                        ),
                        Container(
                          padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 4),
                          decoration: BoxDecoration(
                            color: isHR ? AppColors.goldPrimary : AppColors.goldLight,
                            borderRadius: BorderRadius.circular(8),
                            border: Border.all(color: AppColors.goldPrimary),
                          ),
                          child: Text(
                            isHR ? "HR ORGANIZER" : "PARTICIPANT",
                            style: GoogleFonts.plusJakartaSans(
                              color: isHR ? AppColors.charcoalDark : AppColors.goldDark,
                              fontSize: 10,
                              fontWeight: FontWeight.w800,
                              letterSpacing: 0.8,
                            ),
                          ),
                        ),
                      ],
                    ),
                    const SizedBox(height: 22),

                    // Avatar
                    Container(
                      width: 86,
                      height: 86,
                      decoration: BoxDecoration(
                        gradient: AppColors.goldGradient,
                        shape: BoxShape.circle,
                        boxShadow: [
                          BoxShadow(
                            color: AppColors.goldPrimary.withOpacity(0.35),
                            blurRadius: 16,
                            offset: const Offset(0, 4),
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
                          fontSize: 32,
                          fontWeight: FontWeight.bold,
                        ),
                      ),
                    ),
                    const SizedBox(height: 16),

                    // Name
                    Text(
                      fullName,
                      style: GoogleFonts.cinzel(
                        color: AppColors.textPrimary,
                        fontSize: 22,
                        fontWeight: FontWeight.bold,
                        letterSpacing: 0.2,
                      ),
                      textAlign: TextAlign.center,
                    ),
                    const SizedBox(height: 6),

                    // Role / University Tag
                    Container(
                      padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 5),
                      decoration: BoxDecoration(
                        color: isHR ? AppColors.goldLight : AppColors.lavenderSubtle,
                        borderRadius: BorderRadius.circular(20),
                        border: Border.all(
                          color: isHR ? AppColors.goldPrimary.withOpacity(0.4) : AppColors.lavenderBorder,
                        ),
                      ),
                      child: Text(
                        isHR
                            ? 'Human Resources & Organizing Team'
                            : '${participant.university} • ${participant.fieldOfStudy}',
                        textAlign: TextAlign.center,
                        style: GoogleFonts.plusJakartaSans(
                          color: isHR ? AppColors.goldDark : AppColors.lavenderDark,
                          fontSize: 12,
                          fontWeight: FontWeight.w700,
                        ),
                      ),
                    ),

                    const SizedBox(height: 8),

                    // ID Tag
                    Container(
                      padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 3),
                      decoration: BoxDecoration(
                        color: AppColors.surfaceMuted,
                        borderRadius: BorderRadius.circular(8),
                        border: Border.all(color: AppColors.border),
                      ),
                      child: Text(
                        isHR ? 'Staff ID: #$hrIdTag' : 'Pass ID: $ticket',
                        style: GoogleFonts.plusJakartaSans(
                          color: AppColors.textPrimary,
                          fontSize: 11.5,
                          fontWeight: FontWeight.w600,
                          letterSpacing: 0.5,
                        ),
                      ),
                    ),

                    const SizedBox(height: 20),

                    // Embedded QR Code Container
                    Container(
                      padding: const EdgeInsets.all(12),
                      decoration: BoxDecoration(
                        color: AppColors.surface,
                        borderRadius: BorderRadius.circular(16),
                        border: Border.all(color: AppColors.border, width: 1.2),
                        boxShadow: [
                          BoxShadow(
                            color: AppColors.charcoal.withOpacity(0.03),
                            blurRadius: 10,
                            offset: const Offset(0, 3),
                          ),
                        ],
                      ),
                      child: QrImageView(
                        data: qrPayload,
                        version: QrVersions.auto,
                        size: 130.0,
                        eyeStyle: const QrEyeStyle(
                          eyeShape: QrEyeShape.square,
                          color: AppColors.charcoal,
                        ),
                        dataModuleStyle: const QrDataModuleStyle(
                          dataModuleShape: QrDataModuleShape.circle,
                          color: AppColors.charcoal,
                        ),
                      ),
                    ),

                    const SizedBox(height: 18),
                    const Divider(color: AppColors.divider),
                    const SizedBox(height: 14),

                    // Contact Rows with Copy Actions
                    _ContactInfo(
                      icon: Icons.email_outlined,
                      label: 'Email',
                      text: emailText,
                    ),
                    if (phoneText.isNotEmpty) ...[
                      const SizedBox(height: 10),
                      _ContactInfo(
                        icon: Icons.phone_outlined,
                        label: 'Phone',
                        text: phoneText,
                      ),
                    ],

                    const SizedBox(height: 18),

                    // Footer Guidance
                    Container(
                      padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 10),
                      decoration: BoxDecoration(
                        color: AppColors.surfaceMuted,
                        borderRadius: BorderRadius.circular(12),
                        border: Border.all(color: AppColors.border),
                      ),
                      child: Row(
                        children: [
                          Icon(
                            isHR ? Icons.verified_user_outlined : Icons.info_outline_rounded,
                            size: 16,
                            color: AppColors.goldDark,
                          ),
                          const SizedBox(width: 8),
                          Expanded(
                            child: Text(
                              isHR
                                  ? 'Official Organizing Committee Pass with full administrative access for Gala 2025.'
                                  : 'Present during networking sessions to exchange contact details with partners.',
                              style: GoogleFonts.plusJakartaSans(
                                color: AppColors.textSecondary,
                                fontSize: 11.5,
                                height: 1.4,
                              ),
                            ),
                          ),
                        ],
                      ),
                    ),
                  ],
                ),
              ),
            ),
          );
        },
      ),
    );
  }
}

class _ContactInfo extends StatelessWidget {
  final IconData icon;
  final String label;
  final String text;

  const _ContactInfo({
    required this.icon,
    required this.label,
    required this.text,
  });

  void _copyToClipboard(BuildContext context) {
    Clipboard.setData(ClipboardData(text: text));
    ScaffoldMessenger.of(context).showSnackBar(
      SnackBar(
        content: Text(
          'Copied $label to clipboard',
          style: GoogleFonts.plusJakartaSans(color: AppColors.white),
        ),
        backgroundColor: AppColors.charcoalDark,
        behavior: SnackBarBehavior.floating,
        margin: const EdgeInsets.all(16),
        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
        duration: const Duration(seconds: 2),
      ),
    );
  }

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 10),
      decoration: BoxDecoration(
        color: AppColors.surfaceMuted,
        borderRadius: BorderRadius.circular(12),
        border: Border.all(color: AppColors.border),
      ),
      child: Row(
        children: [
          Icon(icon, color: AppColors.goldDark, size: 18),
          const SizedBox(width: 10),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(
                  label,
                  style: GoogleFonts.plusJakartaSans(
                    color: AppColors.textSubtle,
                    fontSize: 10.5,
                    fontWeight: FontWeight.w600,
                  ),
                ),
                Text(
                  text,
                  style: GoogleFonts.plusJakartaSans(
                    color: AppColors.textPrimary,
                    fontSize: 13,
                    fontWeight: FontWeight.w600,
                  ),
                  overflow: TextOverflow.ellipsis,
                ),
              ],
            ),
          ),
          InkWell(
            onTap: () => _copyToClipboard(context),
            borderRadius: BorderRadius.circular(6),
            child: const Padding(
              padding: EdgeInsets.all(4.0),
              child: Icon(Icons.copy_rounded, color: AppColors.goldDark, size: 16),
            ),
          ),
        ],
      ),
    );
  }
}


