import 'dart:convert';
import 'dart:developer';

import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
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
  final repo = ref.read(eventRepoProvider);
  final Participant profile = await repo.getParticipantProfile();
  return profile;
});

class ProfileScreen extends ConsumerWidget {
  const ProfileScreen({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final profileAsync = ref.watch(profileInformationProvider);
    final user = ref.read(userProvider.notifier).user;
    // print("userrrrrr: ${user.id}");
    final bool isCompany = user.role.toLowerCase() == 'company';

    return Scaffold(
      backgroundColor: AppColors.bg,
      body: SafeArea(
        child: SingleChildScrollView(
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.center,
            children: [
              if (isCompany)
                const SizedBox(height: 16)
              else
                const ProfileHeader(),
              profileAsync.when(
                data: (Participant data) {
                  return ProfileQrSection(
                    qrData:
                        data.ticketSerialNumber != null
                            ? jsonEncode({
                              'id': data.id,
                              'lastName': data.lastName,
                              'firstName': data.firstName,
                              'email': data.email,
                              'phone': data.phone,
                              'serialNumber': data.ticketSerialNumber,
                            })
                            : jsonEncode({
                              'id': data.id,
                              'lastName': data.lastName,
                              'firstName': data.firstName,
                              'email': data.email,
                              'phone': data.phone,
                              'serialNumber': null,
                            }),
                  );
                },
                error: (Object error, StackTrace stackTrace) {
                  return ProfileQrSection(qrData: error.toString());
                },
                loading: () {
                  return ProfileQrSection(qrData: 'Loading...');
                },
              ),

              const ProfileInfo(),

              // 🟡 About the Gala (link to separate page)

              // 🟡 Agenda Shortcut
              // const _AgendaShortcutSection(),
              SizedBox(height: 16),
              DevTeamSection(),

              // Existing info (CV, ticket, etc.)
              const AdditionalInfoSection(),

              // 🟡 Gala Gallery Shortcut
              GestureDetector(
                onTap: () => context.pushNamed('gallery-screen'),
                child: const InfoItem(
                  icon: Icons.photo_library_outlined,
                  title: 'Gala Gallery',
                  hasArrow: true,
                ),
              ),

              // 🟡 Dev Team Shortcut
              const SupportSection(),
              const SizedBox(height: 24),
              LogoutButton(),
            ],
          ),
        ),
      ),
    );
  }
}

// ---------------------- SHORTCUT SECTIONS ----------------------

// class _AboutShortcutSection extends StatelessWidget {
//   const _AboutShortcutSection();

//   @override
//   Widget build(BuildContext context) {
//     return Column(
//       crossAxisAlignment: CrossAxisAlignment.start,
//       children: [
//         const SectionHeader(title: 'About'),
//       ],
//     );
//   }
// }

class _AgendaShortcutSection extends StatelessWidget {
  const _AgendaShortcutSection();

  @override
  Widget build(BuildContext context) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        const SectionHeader(title: 'Agenda'),
        GestureDetector(
          onTap: () => context.pushNamed('agenda'),
          child: const InfoItem(
            icon: Icons.event_note_outlined,
            title: 'View Event Agenda',
            hasArrow: true,
          ),
        ),
      ],
    );
  }
}

class AgendaShortcutSection extends StatelessWidget {
  const AgendaShortcutSection({super.key});

  @override
  Widget build(BuildContext context) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        const SectionHeader(title: 'Agenda'),
        GestureDetector(
          onTap: () => context.push('/agenda'),
          child: const InfoItem(
            icon: Icons.event_note_outlined,
            title: "View GALA's Agenda",
            hasArrow: true,
          ),
        ),
      ],
    );
  }
}

class GalaGallerySection extends StatelessWidget {
  const GalaGallerySection({super.key});

  @override
  Widget build(BuildContext context) {
    final images = [
      'assets/gallery/photo1.jpg',
      'assets/gallery/photo2.jpg',
      'assets/gallery/photo3.jpg',
    ];

    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        const SectionHeader(title: 'Gala Gallery'),
        SizedBox(
          height: 120,
          child: ListView.separated(
            padding: const EdgeInsets.symmetric(horizontal: 16),
            scrollDirection: Axis.horizontal,
            itemCount: images.length,
            separatorBuilder: (_, __) => const SizedBox(width: 12),
            itemBuilder:
                (context, index) => ClipRRect(
                  borderRadius: BorderRadius.circular(12),
                  child: Image.asset(
                    images[index],
                    width: 160,
                    height: 120,
                    fit: BoxFit.cover,
                  ),
                ),
          ),
        ),
      ],
    );
  }
}

class SupportSection extends StatelessWidget {
  const SupportSection({super.key});

  @override
  Widget build(BuildContext context) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        const SectionHeader(title: 'Support'),
        GestureDetector(
          onTap: () => context.pushNamed('feedback'),
          child: InfoItem(
            icon: Icons.feedback_outlined,
            title: 'Send Feedback',
            hasArrow: true,
          ),
        ),
      ],
    );
  }
}

class LogoutButton extends ConsumerWidget {
  const LogoutButton({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    return Padding(
      padding: const EdgeInsets.all(16),
      child: ElevatedButton(
        onPressed: () {
          ref.read(authControllerProvider.notifier).signOut();
          log('logged out');
          context.go('/login');
        },
        style: ElevatedButton.styleFrom(
          backgroundColor: AppColors.accent,
          foregroundColor: AppColors.white,
          minimumSize: const Size(double.infinity, 48),
          shape: RoundedRectangleBorder(
            borderRadius: BorderRadius.circular(12),
          ),
        ),
        child: const Text('Log Out'),
      ),
    );
  }
}

class ProfileQrSection extends StatelessWidget {
  final String qrData;

  const ProfileQrSection({super.key, required this.qrData});

  @override
  Widget build(BuildContext context) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.center,
      children: [
        Container(
          margin: const EdgeInsets.all(16),
          padding: const EdgeInsets.all(24),
          decoration: BoxDecoration(
            color: AppColors.border,
            borderRadius: BorderRadius.circular(16),
          ),
          child: QrImageView(
            data: qrData,
            version: QrVersions.auto,
            size: 180,
            foregroundColor: AppColors.white,
            backgroundColor: AppColors.border,
          ),
        ),
      ],
    );
  }
}

class ProfileHeader extends StatelessWidget {
  const ProfileHeader({super.key});

  @override
  Widget build(BuildContext context) {
    return Container(
      color: AppColors.bg,
      padding: const EdgeInsets.all(16).copyWith(bottom: 8),
      child: Row(
        mainAxisAlignment: MainAxisAlignment.center,
        crossAxisAlignment: CrossAxisAlignment.center,
        children: [
          const Text(
            'My Account',
            style: TextStyle(
              color: AppColors.white,
              fontSize: 18,
              fontWeight: FontWeight.bold,
            ),
          ),
          const SizedBox(width: 24),
        ],
      ),
    );
  }
}

class ProfileInfo extends ConsumerWidget {
  const ProfileInfo({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    return Padding(
      padding: const EdgeInsets.all(8),
      child: Column(
        children: [
          Text(
            '${ref.read(userProvider.notifier).user.firstName} ${ref.read(userProvider.notifier).user.lastName}',
            style: const TextStyle(
              color: AppColors.white,
              fontSize: 22,
              fontWeight: FontWeight.bold,
            ),
          ),
          const SizedBox(height: 4),
          Text(
            ref.read(userProvider.notifier).user.role,
            style: const TextStyle(
              color: AppColors.textSecondary,
              fontSize: 16,
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
    final bool isCompany = user.role.toLowerCase() == 'company';

    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        const SectionHeader(title: 'Additional Information'),

        // Company: view CVs
        // Participant: upload CV
        GestureDetector(
          onTap:
              () => context.pushNamed(isCompany ? 'company-cv' : 'upload-cv'),
          child: InfoItem(
            icon: isCompany ? Icons.file_copy : Icons.upload,
            title: isCompany ? 'View CVs' : 'Upload CV',
            hasArrow: true,
          ),
        ),

        // Show only for participants
        if (!isCompany)
          GestureDetector(
            onTap: () => context.pushNamed('personal-info'),
            child: const InfoItem(
              icon: Icons.person_outline,
              title: 'Personal Information',
              hasArrow: true,
            ),
          ),

        // Common to both
        GestureDetector(
          onTap: () => context.pushNamed('about-gala'),
          child: const InfoItem(
            icon: Icons.info_outline,
            title: 'About the Gala',
            hasArrow: true,
          ),
        ),
      ],
    );
  }
}

class SectionHeader extends StatelessWidget {
  final String title;

  const SectionHeader({super.key, required this.title});

  @override
  Widget build(BuildContext context) {
    return Padding(
      padding: const EdgeInsets.fromLTRB(16, 16, 16, 8),
      child: Text(
        title,
        style: const TextStyle(
          color: AppColors.white,
          fontSize: 18,
          fontWeight: FontWeight.bold,
        ),
      ),
    );
  }
}

class InfoItem extends StatelessWidget {
  final IconData icon;
  final String title;
  final bool hasArrow;

  const InfoItem({
    super.key,
    required this.icon,
    required this.title,
    this.hasArrow = false,
  });

  @override
  Widget build(BuildContext context) {
    return Container(
      color: AppColors.bg,
      padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 8),
      child: Row(
        children: [
          Container(
            width: 40,
            height: 40,
            decoration: BoxDecoration(
              color: AppColors.border,
              borderRadius: BorderRadius.circular(8),
            ),
            child: Icon(icon, color: AppColors.white, size: 24),
          ),
          const SizedBox(width: 16),
          Expanded(
            child: Text(
              title,
              style: const TextStyle(color: AppColors.white, fontSize: 16),
            ),
          ),
          if (hasArrow)
            const Icon(Icons.chevron_right, color: AppColors.white, size: 24),
        ],
      ),
    );
  }
}
