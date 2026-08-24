import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:google_fonts/google_fonts.dart';

import '../app_colors.dart';
import '../core/supabase_provider.dart';
import '../profile/profile_screen.dart';
import 'file_upload_section.dart';
import 'upload_cv_provider.dart';

class FileTileUrl extends ConsumerWidget {
  final String url;
  final CvUploadNotifier notifier;
  final bool isLoading;

  const FileTileUrl({
    super.key,
    required this.url,
    required this.notifier,
    required this.isLoading,
  });

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final fileName = url.split('/').last;

    return Container(
      margin: const EdgeInsets.symmetric(horizontal: 20, vertical: 8),
      decoration: BoxDecoration(
        borderRadius: BorderRadius.circular(16),
        border: Border.all(color: AppColors.border),
        color: AppColors.surface,
        boxShadow: [
          BoxShadow(
            color: AppColors.charcoal.withOpacity(0.025),
            blurRadius: 10,
            offset: const Offset(0, 3),
          ),
        ],
      ),
      child: ListTile(
        contentPadding: const EdgeInsets.symmetric(horizontal: 16, vertical: 8),
        leading: Container(
          width: 42,
          height: 42,
          decoration: BoxDecoration(
            color: AppColors.goldLight,
            borderRadius: BorderRadius.circular(10),
          ),
          child: const Icon(
            Icons.description_outlined,
            color: AppColors.goldDark,
            size: 22,
          ),
        ),
        title: Text(
          'Active Curriculum Vitae',
          style: GoogleFonts.cinzel(
            color: AppColors.textPrimary,
            fontSize: 14.5,
            fontWeight: FontWeight.bold,
          ),
          overflow: TextOverflow.ellipsis,
        ),
        subtitle: Text(
          fileName,
          style: GoogleFonts.plusJakartaSans(
            color: AppColors.textSecondary,
            fontSize: 11.5,
          ),
          overflow: TextOverflow.ellipsis,
        ),
        trailing: Row(
          mainAxisSize: MainAxisSize.min,
          children: [
            IconButton(
              icon: const Icon(Icons.remove_red_eye_outlined, color: AppColors.goldDark),
              tooltip: 'View Document',
              onPressed: () async {
                viewPdfFromUrl(
                  context,
                  ref.read(supabaseClientProvider),
                  ref.read(profileInformationProvider).value!.id,
                  fileName,
                );
              },
            ),
            IconButton(
              icon:
                  isLoading
                      ? const SizedBox(
                        width: 18,
                        height: 18,
                        child: CircularProgressIndicator(
                          strokeWidth: 2,
                          color: AppColors.goldDark,
                        ),
                      )
                      : const Icon(Icons.refresh_rounded, color: AppColors.goldDark),
              tooltip: 'Replace Resume',
              onPressed:
                  isLoading
                      ? null
                      : () => notifier.pickAndUploadFile(notifier.ref),
            ),
          ],
        ),
      ),
    );
  }
}

class CompanyFileTileUrl extends ConsumerWidget {
  final String url;

  const CompanyFileTileUrl({super.key, required this.url});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final fileName = url.split('/').last;

    return Container(
      margin: const EdgeInsets.symmetric(horizontal: 20, vertical: 8),
      decoration: BoxDecoration(
        borderRadius: BorderRadius.circular(16),
        border: Border.all(color: AppColors.border),
        color: AppColors.surface,
      ),
      child: ListTile(
        contentPadding: const EdgeInsets.symmetric(horizontal: 16, vertical: 8),
        leading: Container(
          width: 42,
          height: 42,
          decoration: BoxDecoration(
            color: AppColors.lavenderSubtle,
            borderRadius: BorderRadius.circular(10),
          ),
          child: const Icon(
            Icons.description_outlined,
            color: AppColors.lavenderDark,
            size: 22,
          ),
        ),
        title: Text(
          'Candidate Resume',
          style: GoogleFonts.cinzel(
            color: AppColors.textPrimary,
            fontSize: 14.5,
            fontWeight: FontWeight.bold,
          ),
          overflow: TextOverflow.ellipsis,
        ),
        trailing: IconButton(
          icon: const Icon(Icons.remove_red_eye_outlined, color: AppColors.goldDark),
          tooltip: 'View Resume',
          onPressed: () async {
            viewPdfFromUrl(
              context,
              ref.read(supabaseClientProvider),
              ref.read(profileInformationProvider).value!.id,
              fileName,
            );
          },
        ),
      ),
    );
  }
}

