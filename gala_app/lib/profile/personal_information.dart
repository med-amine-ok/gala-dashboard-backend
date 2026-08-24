import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:qr_flutter/qr_flutter.dart';

import '../app_colors.dart';
import 'profile_screen.dart';

class DigitalBusinessCardScreen extends ConsumerWidget {
  const DigitalBusinessCardScreen({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final participantAsync = ref.watch(profileInformationProvider);

    return Scaffold(
      backgroundColor: AppColors.bg,
      appBar: AppBar(
        title: const Text(
          'Digital Card',
          style: TextStyle(
            color: AppColors.white,
            fontSize: 18,
            fontWeight: FontWeight.bold,
          ),
        ),
        backgroundColor: AppColors.bg,
        centerTitle: true,
        elevation: 0,
      ),
      body: participantAsync.when(
        loading:
            () => const Center(
              child: CircularProgressIndicator(color: AppColors.accent),
            ),
        error:
            (error, _) => Center(
              child: Text(
                'Error loading profile: $error',
                style: const TextStyle(color: Colors.redAccent),
              ),
            ),
        data: (participant) {
          final fullName = '${participant.firstName} ${participant.lastName}';
          final qrData = participant.ticketSerialNumber ?? 'No Ticket Assigned';
          // final linkedinUrl =
          //     participant.email.contains('@')
          //         ? 'mailto:${participant.email}'
          //         : '';

          return Center(
            child: Container(
              margin: const EdgeInsets.all(16),
              padding: const EdgeInsets.all(20),
              decoration: BoxDecoration(
                color: AppColors.surface,
                borderRadius: BorderRadius.circular(20),
                border: Border.all(color: AppColors.border, width: 1),
                boxShadow: [
                  BoxShadow(
                    color: Colors.black.withOpacity(0.2),
                    blurRadius: 8,
                    offset: const Offset(0, 4),
                  ),
                ],
              ),
              child: Column(
                mainAxisSize: MainAxisSize.min,
                children: [
                  // Placeholder profile photo
                  const CircleAvatar(
                    radius: 45,
                    backgroundImage: NetworkImage(
                      'https://api.dicebear.com/7.x/initials/svg?seed=User',
                    ),
                  ),
                  const SizedBox(height: 12),

                  // Name
                  Text(
                    fullName,
                    style: const TextStyle(
                      color: AppColors.white,
                      fontSize: 22,
                      fontWeight: FontWeight.bold,
                    ),
                  ),
                  const SizedBox(height: 4),

                  // University & field
                  Text(
                    '${participant.university} — ${participant.fieldOfStudy}',
                    textAlign: TextAlign.center,
                    style: const TextStyle(
                      color: AppColors.textSecondary,
                      fontSize: 15,
                    ),
                  ),

                  const SizedBox(height: 24),

                  // Contact info
                  _ContactInfo(
                    icon: Icons.email_outlined,
                    text: participant.email,
                  ),
                  const SizedBox(height: 8),
                  _ContactInfo(
                    icon: Icons.phone_outlined,
                    text: participant.phone,
                  ),
                  const SizedBox(height: 8),

                  // _ContactInfo(
                  //   icon: Icons.link,
                  //   text:
                  //       linkedinUrl.isNotEmpty
                  //           ? linkedinUrl
                  //           : 'No LinkedIn provided',
                  // ),
                  const SizedBox(height: 16),

                  // QR Code section
                  // Container(
                  //   padding: const EdgeInsets.all(16),
                  //   decoration: BoxDecoration(
                  //     color: AppColors.border,
                  //     borderRadius: BorderRadius.circular(16),
                  //   ),
                  //   child: QrImageView(
                  //     data: qrData,
                  //     size: 140,
                  //     foregroundColor: AppColors.white,
                  //   ),
                  // ),
                  // const SizedBox(height: 12),
                  // const Text(
                  //   'Scan to connect with me',
                  //   style: TextStyle(
                  //     color: AppColors.textSecondary,
                  //     fontSize: 14,
                  //   ),
                  // ),
                  // const SizedBox(height: 16),

                  // Note
                  Container(
                    padding: const EdgeInsets.symmetric(
                      horizontal: 12,
                      vertical: 8,
                    ),
                    decoration: BoxDecoration(
                      color: AppColors.accent.withOpacity(0.2),
                      borderRadius: BorderRadius.circular(12),
                    ),
                    child: const Text(
                      'This card is for networking — show or share it during the event!',
                      textAlign: TextAlign.center,
                      style: TextStyle(
                        color: AppColors.textSecondary,
                        fontSize: 13,
                      ),
                    ),
                  ),
                ],
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
  final String text;

  const _ContactInfo({required this.icon, required this.text});

  @override
  Widget build(BuildContext context) {
    return Row(
      mainAxisAlignment: MainAxisAlignment.center,
      children: [
        Icon(icon, color: AppColors.textSecondary, size: 18),
        const SizedBox(width: 8),
        Flexible(
          child: Text(
            text,
            style: const TextStyle(color: AppColors.white, fontSize: 15),
            overflow: TextOverflow.ellipsis,
          ),
        ),
      ],
    );
  }
}
