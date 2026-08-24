import 'dart:developer';

import 'package:dio/dio.dart';
import 'package:flutter/foundation.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:pretty_dio_logger/pretty_dio_logger.dart';

import '../agenda/agenda_provider.dart';
import '../api_service.dart';
import '../auth_http_client.dart';
import 'failure.dart';
import 'gala_repo.dart';
import 'secure_storage.dart';

final dioProvider = Provider((ref) {
  final dio = Dio(BaseOptions(baseUrl: ApiServiceImpl.baseUrl));

  dio.interceptors.add(
    AuthInterceptor(
      AuthHttpClient(
        initialAccessToken: () async {
          final token = await SecureStorage.read('auth_token');
          return token ?? '';
        },
        refreshAccessToken: () {
          return refreshToken();
        },
        onRefreshAccessTokenFailed: () {
          SecureStorage.deleteAll();
        },
      ),
    ),
  );

  if (!kReleaseMode) {
    dio.interceptors.add(
      PrettyDioLogger(
        requestHeader: true,
        requestBody: true,
        responseBody: true,
        responseHeader: false,
        error: true,
        compact: true,
        maxWidth: 90,
      ),
    );
  }
  return dio;
});

Future<String?> refreshToken() async {
  try {
    final refreshToken = await SecureStorage.read('refresh_token');
    final accessToken = await SecureStorage.read('auth_token');

    log('refreshToken: $refreshToken, accessToken: $accessToken');

    if (refreshToken == null) {
      return null;
    }

    final response = await ApiServiceImpl().post(
      '/token/refresh/',
      data: {'refresh': refreshToken, 'access_token': accessToken},
    );

    log('response: $response, reffreeesssssshhhhhh');

    final data = response;

    // If your backend returns new tokens, store them
    if (data['access_token'] != null) {
      await SecureStorage.write('auth_token', data['access']);
    }

    if (data['refresh_token'] != null) {
      await SecureStorage.write('refresh_token', data['refresh']);
    }

    return data['access_token'];
  } on Failure catch (e) {
    // Custom error class? fine, rethrow.
    log(e.toString());
    return null;
  } catch (e) {
    // Any other unexpected exception
    throw Exception('Token refresh failed: $e');
  }
}
