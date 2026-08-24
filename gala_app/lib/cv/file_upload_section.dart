import 'dart:developer';

import 'package:dio/dio.dart';
import 'package:flutter/foundation.dart';
import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:google_fonts/google_fonts.dart';
import 'package:supabase_flutter/supabase_flutter.dart';
import 'package:url_launcher/url_launcher.dart';

import '../app_colors.dart';
import 'file_tile_url.dart';
import 'pdf_viewer.dart';
import 'upload_card.dart';
import 'upload_cv_provider.dart';

class FileUploadSection extends ConsumerWidget {
  const FileUploadSection({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final uploadState = ref.watch(cvUploadProvider);
    final notifier = ref.read(cvUploadProvider.notifier);

    return uploadState.when(
      data: (cvUrl) {
        log(cvUrl ?? 'No CV URL found');
        if (cvUrl == null) {
          return UploadCard(notifier: notifier, isLoading: false);
        } else {
          return FileTileUrl(
            url: cvUrl,
            notifier: notifier,
            isLoading: false,
          );
        }
      },
      loading:
          () => const Padding(
            padding: EdgeInsets.all(32.0),
            child: Center(
              child: SizedBox(
                width: 24,
                height: 24,
                child: CircularProgressIndicator(
                  strokeWidth: 2,
                  valueColor: AlwaysStoppedAnimation<Color>(AppColors.goldPrimary),
                ),
              ),
            ),
          ),
      error:
          (err, stack) => Column(
            children: [
              UploadCard(notifier: notifier, isLoading: false),
              const SizedBox(height: 16),
              Padding(
                padding: const EdgeInsets.symmetric(horizontal: 20.0),
                child: Text(
                  err.toString(),
                  style: GoogleFonts.plusJakartaSans(color: AppColors.error, fontSize: 13),
                  textAlign: TextAlign.center,
                ),
              ),
            ],
          ),
    );
  }
}


// --- File Tile Widget ---

Future<void> viewPdfFromUrl(
  BuildContext context,
  SupabaseClient supabase,
  String userId,
  String title,
) async {
  try {
    // Keep the filename as is
    final fileName = 'cv/$userId.pdf';

    // Generate signed URL (e.g., 15 minutes)
    final signedUrl = await supabase.storage
        .from('photos')
        .createSignedUrl(fileName, 900);
    log('Signed URL: $signedUrl');

    if (kIsWeb) {
      // Web: launch PDF in browser
      await launchUrl(Uri.parse(signedUrl), mode: LaunchMode.platformDefault);
      return;
    }

    // Mobile: fetch bytes and open PDF
    final dio = Dio();
    final response = await dio.get<List<int>>(
      signedUrl,
      options: Options(responseType: ResponseType.bytes),
    );

    if (response.statusCode == 200 && response.data != null) {
      final pdfBytes = Uint8List.fromList(response.data!);
      Navigator.push(
        context,
        MaterialPageRoute(
          builder: (_) => PdfViewPage(pdfBytes: pdfBytes, title: title),
        ),
      );
    } else {
      throw Exception('Failed to load PDF: ${response.statusCode}');
    }
  } catch (e) {
    ScaffoldMessenger.of(context).showSnackBar(
      SnackBar(
        backgroundColor: AppColors.surface,
        content: Text(
          'Error loading PDF: $e',
          style: const TextStyle(color: Colors.white),
        ),
      ),
    );
  }
}

Future<void> openFileFromUrl(String url) async {
  if (await canLaunchUrl(Uri.parse(url))) {
    await launchUrl(Uri.parse(url));
  } else {
    throw 'Could not launch $url';
  }
}
