// --- AsyncNotifier to manage upload logic ---
import 'dart:developer';
import 'dart:io';

import 'package:dio/dio.dart';
import 'package:file_picker/file_picker.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:supabase_flutter/supabase_flutter.dart';

import '../agenda/agenda_provider.dart';
import '../core/supabase_provider.dart';
import '../core/user_provider.dart';
import '../profile/profile_screen.dart';

class CvUploadNotifier extends AutoDisposeAsyncNotifier<String?> {
  @override
  Future<String?> build() async {
    // Try to fetch existing CV URL on init
    return await getCv(ref);
  }

  Future<String?> getCv(Ref ref) async {
    try {
      final user = ref.read(userProvider.notifier).user;
      final profileVal = ref.read(profileInformationProvider).value;
      final userId = user.id.isNotEmpty ? user.id : (profileVal?.id ?? '1');
      final supabase = ref.read(supabaseClientProvider);
      final filePath = 'cv/$userId.pdf';

      // Get the public URL
      final url = supabase.storage.from('photos').getPublicUrl(filePath);

      // Verify the file actually exists using Dio HEAD request
      final dio = Dio();
      final response = await dio.head(
        url,
        options: Options(
          validateStatus: (status) => status != null && status < 500,
        ),
      );

      if (response.statusCode == 200) {
        log('Fetched existing CV URL: $url');
        state = AsyncData(url);
        return url;
      } else {
        log('CV not found for user $userId (status: ${response.statusCode})');
        state = const AsyncData(null);
        return null;
      }
    } on DioException catch (e, st) {
      log('DioException fetching CV: ${e.message}', stackTrace: st);
      state = AsyncError('Failed to fetch CV URL: ${e.message}', st);
      return null;
    } catch (e, st) {
      log('Error fetching CV: $e', stackTrace: st);
      state = AsyncError('Failed to fetch CV URL: ${e.toString()}', st);
      return null;
    }
  }

  Future<void> pickAndUploadFile(Ref ref) async {
    state = const AsyncLoading();

    try {
      final result = await FilePicker.platform.pickFiles(
        type: FileType.custom,
        allowedExtensions: ['pdf'],
        withData: true,
      );

      if (result == null || result.files.isEmpty) {
        state = AsyncError('No file selected.', StackTrace.current);
        return;
      }

      final selectedFile = result.files.first;

      if ((selectedFile.size / (1024 * 1024)) > 5) {
        state = AsyncError(
          'File too large. Please select a file under 5MB.',
          StackTrace.current,
        );
        return;
      }

      final user = ref.read(userProvider.notifier).user;
      final profileVal = ref.read(profileInformationProvider).value;
      final userId = user.id.isNotEmpty ? user.id : (profileVal?.id ?? '1');

      await ref
          .read(eventRepoProvider)
          .uploadCV(
            selectedFile,
            ref.read(supabaseClientProvider),
            userId,
          );

      // After upload, update the URL in state
      final urlResponse = ref
          .read(supabaseClientProvider)
          .storage
          .from('photos')
          .getPublicUrl(
            'cv/$userId.pdf',
          );

      state = AsyncData(urlResponse);
    } catch (e, st) {
      state = AsyncError('Upload failed: ${e.toString()}', st);
    }
  }

  Future<String> replaceFile({
    required SupabaseClient supabase,
    required String bucket,
    required String path,
    required File file,
  }) async {
    return await supabase.storage
        .from(bucket)
        .upload(path, file, fileOptions: const FileOptions(upsert: true));
  }
}

final cvUploadProvider =
    AutoDisposeAsyncNotifierProvider<CvUploadNotifier, String?>(
      CvUploadNotifier.new,
    );
