import 'package:flutter/material.dart';
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
      padding: const EdgeInsets.symmetric(horizontal: 24, vertical: 40),
      decoration: BoxDecoration(
        border: Border.all(color: AppColors.border, width: 2),
        borderRadius: BorderRadius.circular(8),
        color: AppColors.surface.withOpacity(0.3),
      ),
      child: Column(
        mainAxisAlignment: MainAxisAlignment.center,
        children: [
          Container(
            width: 64,
            height: 64,
            decoration: BoxDecoration(
              color: AppColors.border,
              borderRadius: BorderRadius.circular(32),
            ),
            child: const Icon(
              Icons.upload_file,
              color: AppColors.white,
              size: 32,
            ),
          ),
          const SizedBox(height: 16),
          const Text(
            'Choose a file to upload',
            style: TextStyle(
              color: AppColors.white,
              fontSize: 18,
              fontWeight: FontWeight.bold,
            ),
            textAlign: TextAlign.center,
          ),
          const SizedBox(height: 8),
          const Text(
            'PDF Only (Max 5MB)',
            style: TextStyle(color: AppColors.textSecondary, fontSize: 14),
            textAlign: TextAlign.center,
          ),
          const SizedBox(height: 24),
          ElevatedButton(
            onPressed:
                isLoading
                    ? null
                    : () => notifier.pickAndUploadFile(notifier.ref),
            style: ElevatedButton.styleFrom(
              backgroundColor: AppColors.border,
              foregroundColor: AppColors.white,
              padding: const EdgeInsets.symmetric(horizontal: 24, vertical: 12),
              shape: RoundedRectangleBorder(
                borderRadius: BorderRadius.circular(8),
              ),
            ),
            child:
                isLoading
                    ? const SizedBox(
                      height: 18,
                      width: 18,
                      child: CircularProgressIndicator(
                        strokeWidth: 2.2,
                        color: Colors.white,
                      ),
                    )
                    : const Text(
                      'Browse Files',
                      style: TextStyle(
                        fontSize: 14,
                        fontWeight: FontWeight.bold,
                      ),
                    ),
          ),
        ],
      ),
    );
  }
}
