import 'package:flutter/material.dart';
import 'package:google_fonts/google_fonts.dart';
import '../app_colors.dart';
import 'upload_cv_provider.dart';

class UploadCard extends StatelessWidget {
  final CvUploadNotifier notifier;
  final bool isLoading;

  const UploadCard({
    super.key,
    required this.notifier,
    required this.isLoading,
  });

  @override
  Widget build(BuildContext context) {
    return Container(
      width: double.infinity,
      margin: const EdgeInsets.symmetric(horizontal: 20, vertical: 8),
      padding: const EdgeInsets.symmetric(horizontal: 24, vertical: 36),
      decoration: BoxDecoration(
        border: Border.all(color: AppColors.goldPrimary.withOpacity(0.4), width: 1.5),
        borderRadius: BorderRadius.circular(20),
        color: AppColors.surface,
        boxShadow: [
          BoxShadow(
            color: AppColors.charcoal.withOpacity(0.035),
            blurRadius: 16,
            offset: const Offset(0, 4),
          ),
        ],
      ),
      child: Column(
        mainAxisAlignment: MainAxisAlignment.center,
        children: [
          Container(
            width: 64,
            height: 64,
            decoration: BoxDecoration(
              color: AppColors.goldLight,
              shape: BoxShape.circle,
              border: Border.all(color: AppColors.goldPrimary.withOpacity(0.3)),
            ),
            child: const Icon(
              Icons.cloud_upload_outlined,
              color: AppColors.goldDark,
              size: 32,
            ),
          ),
          const SizedBox(height: 16),
          Text(
            'Select Document',
            style: GoogleFonts.cinzel(
              color: AppColors.textPrimary,
              fontSize: 18,
              fontWeight: FontWeight.bold,
            ),
            textAlign: TextAlign.center,
          ),
          const SizedBox(height: 6),
          Text(
            'PDF Documents Only • Maximum 5 MB',
            style: GoogleFonts.plusJakartaSans(
              color: AppColors.textSecondary,
              fontSize: 13,
            ),
            textAlign: TextAlign.center,
          ),
          const SizedBox(height: 24),
          ElevatedButton(
            onPressed:
                isLoading
                    ? null
                    : () => notifier.pickAndUploadFile(notifier.ref),
            style: ElevatedButton.styleFrom(
              backgroundColor: AppColors.goldPrimary,
              foregroundColor: AppColors.charcoalDark,
              elevation: 0,
              padding: const EdgeInsets.symmetric(horizontal: 28, vertical: 14),
              shape: RoundedRectangleBorder(
                borderRadius: BorderRadius.circular(14),
              ),
            ),
            child:
                isLoading
                    ? const SizedBox(
                      height: 18,
                      width: 18,
                      child: CircularProgressIndicator(
                        strokeWidth: 2.2,
                        color: AppColors.charcoalDark,
                      ),
                    )
                    : Row(
                      mainAxisSize: MainAxisSize.min,
                      children: [
                        const Icon(Icons.folder_open_rounded, size: 18),
                        const SizedBox(width: 8),
                        Text(
                          'Browse Device Files',
                          style: GoogleFonts.plusJakartaSans(
                            fontSize: 14,
                            fontWeight: FontWeight.bold,
                          ),
                        ),
                      ],
                    ),
          ),
        ],
      ),
    );
  }
}

