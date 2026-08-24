import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

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
      decoration: BoxDecoration(
        borderRadius: BorderRadius.circular(8),
        border: Border.all(color: AppColors.border),
        color: AppColors.surface,
      ),
      child: ListTile(
        contentPadding: const EdgeInsets.symmetric(horizontal: 16, vertical: 8),
        leading: const Icon(
          Icons.insert_drive_file,
          color: AppColors.white,
          size: 32,
        ),
        title: Text(
          'Your CV',
          style: const TextStyle(
            color: AppColors.white,
            fontSize: 16,
            fontWeight: FontWeight.bold,
          ),
          overflow: TextOverflow.ellipsis,
        ),
        trailing: Row(
          mainAxisSize: MainAxisSize.min,
          children: [
            IconButton(
              icon: const Icon(Icons.remove_red_eye, color: Colors.greenAccent),
              tooltip: 'View CV',
              onPressed: () async {
                viewPdfFromUrl(
                  context,
                  ref.read(supabaseClientProvider),
                  ref.read(profileInformationProvider).value!.id,
                  fileName,
                ); // Call the function();
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
                          color: Colors.amber,
                        ),
                      )
                      : const Icon(Icons.refresh, color: Colors.amber),
              tooltip: 'Replace CV',
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
      decoration: BoxDecoration(
        borderRadius: BorderRadius.circular(8),
        border: Border.all(color: AppColors.border),
        color: AppColors.surface,
      ),
      child: ListTile(
        contentPadding: const EdgeInsets.symmetric(horizontal: 16, vertical: 8),
        leading: const Icon(
          Icons.insert_drive_file,
          color: AppColors.white,
          size: 32,
        ),
        title: Text(
          'Your CV',
          style: const TextStyle(
            color: AppColors.white,
            fontSize: 16,
            fontWeight: FontWeight.bold,
          ),
          overflow: TextOverflow.ellipsis,
        ),
        trailing: Row(
          mainAxisSize: MainAxisSize.min,
          children: [
            IconButton(
              icon: const Icon(Icons.remove_red_eye, color: Colors.greenAccent),
              tooltip: 'View CV',
              onPressed: () async {
                viewPdfFromUrl(
                  context,
                  ref.read(supabaseClientProvider),
                  ref.read(profileInformationProvider).value!.id,
                  fileName,
                ); // Call the function();
              },
            ),
          ],
        ),
      ),
    );
  }
}
