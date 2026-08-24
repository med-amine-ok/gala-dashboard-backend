import 'dart:developer';
import 'dart:io';

import 'package:dio/dio.dart';
import 'package:file_picker/file_picker.dart';
import 'package:flutter/foundation.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:supabase_flutter/supabase_flutter.dart';

import '../agenda/models/agenda_model.dart';
import '../api_service.dart';
import '../booths/models/booth.dart';
import '../cv/models/linked_participants.dart';
import '../profile/models/participant_model.dart';
import 'api_provider.dart';
import 'failure.dart';
import 'secure_storage.dart';
import 'user_model.dart' as user;

final eventRepo = Provider<EventRepository>((ref) {
  return EventRepository(ref.read(apiServiceProvider));
});

class EventRepository {
  final ApiService api;

  EventRepository(this.api);

  /// Example: GET /agenda
  Future<List<AgendaItemModel>> getAgenda() async {
    try {
      final result = await api.get('/agenda');
      return result.map((result) => AgendaItemModel.fromJson(result)).toList();
    } on Failure catch (_) {
      rethrow; // let Riverpod/UI handle Failure
    }
  }

  /// Example: GET /events
  Future<user.User?> currentUser() async {
    try {
      final token = await SecureStorage.read('auth_token');
      log('Current user token: $token');
      final Map<String, dynamic> response = await api.get(
        '/accounts/current_user',
      );

      log(response.toString());
      return user.User.fromJson(response['user']);
    } on DioException catch (e) {
      if (e.response?.statusCode == 401) {
        log('Unauthorized — probably missing or expired token');
      } else {
        log('Dio error: ${e.message}');
      }
      return null;
    } catch (e, stack) {
      log('Unexpected error in currentUser: $e');
      debugPrintStack(stackTrace: stack);
      return null;
    }
  }

  /// Example: GET /events
  Future<Participant> getParticipantProfile() async {
    try {
      final result = await api.get('/participants/profile/');
      return Participant.fromJson(result);
    } on Failure catch (_) {
      rethrow;
    }
  }

  /// Example: GET /booths
  Future<List<BoothModel>> getBooths() async {
    try {
      final result = await api.get('/companies/companies/');
      final results = result['results'] as List;
      final booths =
          results.map((booth) => BoothModel.fromJson(booth)).toList();
      return booths;
    } on Failure catch (_) {
      rethrow;
    }
  }

  /// Example: GET /booths/:id
  Future<dynamic> getBoothDetails(String boothId) async {
    try {
      final result = await api.get('/booths/$boothId');
      return result;
    } on Failure catch (_) {
      rethrow;
    }
  }

  /// POST /feedback/
  Future<void> postFeedback({
    required int participantId,
    required String feedback,
  }) async {
    try {
      final data = {'participant': participantId, 'feedback': feedback};

      final result = await api.post('/participants/feedback/', data: data);

      log('Feedback submitted successfully: $result');
    } on DioException catch (e) {
      debugPrint('Failed to submit feedback: ${e.response?.data ?? e.message}');
      throw ServerFailure.fromDioError(e);
    } catch (e, st) {
      debugPrint('Unexpected error while posting feedback: $e\n$st');
      throw ServerFailure('Failed to submit feedback');
    }
  }

  // Future<void> uploadCV(PlatformFile file) async {
  //   try {
  //     MultipartFile multipartFile;

  //     if (kIsWeb) {
  //       // On web, use bytes (file.path is not available)
  //       multipartFile = MultipartFile.fromBytes(
  //         file.bytes!,
  //         filename: file.name,
  //       );
  //     } else {
  //       // On mobile/desktop, use the file path
  //       multipartFile = await MultipartFile.fromFile(
  //         file.path!,
  //         filename: file.name,
  //       );
  //     }

  //     final formData = FormData.fromMap({
  //       'file': multipartFile,
  //       'message': 'Uploaded from Flutter',
  //     });

  //     final result = await api.post('/participants/upload-cv/', data: formData);

  //     print('Upload success: $result');
  //   } on DioException catch (e) {
  //     debugPrint('Upload failed: ${e.response?.data ?? e.message}');

  //     throw ServerFailure.fromDioError(e);
  //   } catch (e) {
  //     throw ServerFailure('Failed to upload CV');
  //   }
  // }

  Future<void> linkParticipantWithCompany(String participantId) async {
    try {
      final result = await api.post(
        '/companies/link-participant/$participantId/',
      );
      return result;
    } on DioException catch (e) {
      debugPrint(
        'Failed to link participant with company: ${e.response?.data ?? e.message}',
      );
      throw ServerFailure.fromDioError(e);
    } catch (e, st) {
      debugPrint(
        'Unexpected error while linking participant with company: $e\n$st',
      );
      throw ServerFailure('Failed to link participant with company');
    }
  }

  Future<CompanyLinkedParticipants> getCompanyLinkedParticipants() async {
    try {
      final result = await api.get('/companies/linked-participants/');
      return CompanyLinkedParticipants.fromJson(result);
    } on DioException catch (e) {
      debugPrint(
        'Failed to get linked participants: ${e.response?.data ?? e.message}',
      );
      throw ServerFailure.fromDioError(e);
    } catch (e, st) {
      debugPrint('Unexpected error while getting linked participants: $e\n$st');
      throw ServerFailure('Failed to get linked participants');
    }
  }

  Future<void> uploadCV(
    PlatformFile file,
    SupabaseClient supabase,
    String userId,
  ) async {
    try {
      // Determine file bytes (works on both web and mobile)
      final bytes =
          file.bytes ??
          await File(file.path!).readAsBytes(); // for non-web platforms

      // Create file name — you can make this unique if you want
      final fileName = 'cv/$userId.pdf';

      // Upload to Supabase Storage
      await supabase.storage
          .from('photos')
          .uploadBinary(
            fileName,
            bytes,
            fileOptions: const FileOptions(
              contentType: 'application/pdf',
              upsert: true,
            ),
          );

      // Get a public URL (optional)
      final publicUrl = supabase.storage.from('photos').getPublicUrl(fileName);

      debugPrint('Upload success! Public URL: $publicUrl');
    } catch (e, st) {
      debugPrint('Upload failed: $e\n$st');
      throw Exception('Failed to upload CV');
    }
  }

  String getCvUrl(SupabaseClient client, String userId) {
    final url = client.storage.from('photos').getPublicUrl('cv/$userId.pdf');
    return url;
  }

  Future<bool> deleteCv(SupabaseClient client, String userId) async {
    try {
      log('Deleting CV for userId: $userId');
      final response = await client.storage.from('photos').remove([
        'cv/$userId.pdf',
      ]); // Pass a list of file paths
      log('Delete response: $response');
      // If response is empty, deletion succeeded
      return true;
    } catch (e) {
      rethrow;
    }
  }

  /// Example: POST /cv/upload
  // Future<dynamic> uploadCv(dynamic cvData) async {
  //   try {
  //     final result = await api.post('/cv/upload', data: cvData);
  //     return result;
  //   } on Failure catch (_) {
  //     rethrow;
  //   }
  // }

  // /// Example: GET /cv/download
  // Future<dynamic> getCv(String id) async {
  //   try {
  //     final result = await api.get('/participants/$id/cv/');
  //     return result;
  //   } on Failure catch (_) {
  //     rethrow;
  //   }
  // }

  /// Example: GET /tickets/me
  Future<dynamic> getMyTickets() async {
    try {
      final result = await api.get('/tickets/me');
      return result;
    } on Failure catch (_) {
      rethrow;
    }
  }

  Future<dynamic> getParticipant() async {
    try {
      final result = await api.get('/tickets/me');
      return result;
    } on Failure catch (_) {
      rethrow;
    }
  }

  /// Example: GET /me (current user profile)
  Future<dynamic> getMe() async {
    try {
      final result = await api.get('/me');
      return result;
    } on Failure catch (f) {
      rethrow;
    }
  }
}
