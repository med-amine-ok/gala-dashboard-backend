//
import 'dart:developer';

import 'package:dio/dio.dart';
import 'package:flutter/foundation.dart';
import 'package:pretty_dio_logger/pretty_dio_logger.dart';

import 'auth_http_client.dart';
import 'core/dio_provider.dart';
import 'core/failure.dart';
import 'core/gala_repo.dart';
import 'core/secure_storage.dart';

// Abstract class
abstract class ApiService {
  Future<dynamic> get(
    String path, {
    String? token,
    String? id,
    Map<String, dynamic>? query,
    String? relations, // new param
  });

  Future<dynamic> post(
    String path, {
    dynamic data,
    String? token,
    Options? options,
    Map<String, dynamic>? query,
  });

  Future<dynamic> put(
    String path, {
    dynamic data,
    String? token,
    Map<String, dynamic>? query,
  });

  Future<dynamic> patch(
    String path, {
    dynamic data,
    required String id,
    String? token,
    Map<String, dynamic>? query,
  });

  Future<dynamic> delete(
    String path, {
    dynamic data,
    required String id,
    String? token,
    Map<String, dynamic>? query,
  });
}

// Concrete implementation
class ApiServiceImpl implements ApiService {
  // static const String baseUrl = 'http://localhost:8000/api';
  static const String baseUrl =
      'https://common-vicky-dev-teaaam-26351298.koyeb.app/api'; // Use your base URL
  final Dio dio;

  ApiServiceImpl({Dio? dioClient})
    : dio = dioClient ?? Dio(BaseOptions(baseUrl: baseUrl)) {
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

    dio.interceptors.add(
      PrettyDioLogger(
        requestHeader: true,
        requestBody: true,
        responseBody: true,
        responseHeader: false,
        error: true,
        compact: true,
        maxWidth: 90,
        enabled: kDebugMode,
        filter: (options, args) {
          return !args.isResponse || !args.hasUint8ListData;
        },
      ),
    );
  }

  Options _buildOptions(String? token) {
    return Options(
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
        // 'Authorization':
        //     "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiI4ODFhNWRlOS1iODBjLTQ0NjktOWIzNi04Y2E3MWRhNjc1YTYiLCJ1c2VybmFtZSI6ImFiZG91MjUiLCJyb2xlIjoiQWRtaW4iLCJpYXQiOjE3NTQyMzM4MTh9.fHGCijdWfUy2Jsvw4btcVVQxbDbewFxbhrm3ZRlHwMo",
      },
    );
  }

  @override
  Future<Map<String, dynamic>> get(
    String path, {
    String? token,
    String? id,
    Map<String, dynamic>? query,
    String? relations, // new param
  }) async {
    try {
      final response = await dio.get(
        path,
        queryParameters: query,
        options: _buildOptions(token),
      );
      return response.data;
    } on DioException catch (e) {
      throw ServerFailure.fromDioError(e);
    }
  }

  @override
  Future<dynamic> post(
    String path, {
    dynamic data,
    String? token,
    Options? options,
    Map<String, dynamic>? query,
  }) async {
    try {
      final response = await dio.post(
        path,
        data: data,
        queryParameters: query,
        options: options ?? _buildOptions(token),
      );
      return response.data;
    } on DioException catch (e) {
      throw ServerFailure.fromDioError(e);
    }
  }

  @override
  Future<dynamic> put(
    String path, {
    dynamic data,
    String? token,
    Map<String, dynamic>? query,
  }) async {
    try {
      final response = await dio.put(
        path,
        data: data,
        queryParameters: query,
        options: _buildOptions(token),
      );
      return response.data;
    } on DioException catch (e) {
      throw ServerFailure.fromDioError(e);
    }
  }

  @override
  Future<dynamic> patch(
    String path, {
    dynamic data,
    required String id,
    String? token,
    Map<String, dynamic>? query,
  }) async {
    try {
      final response = await dio.patch(
        path,
        data: data,
        queryParameters: query,
        options: _buildOptions(token),
      );
      return response.data;
    } on DioException catch (e) {
      throw ServerFailure.fromDioError(e);
    }
  }

  @override
  Future<dynamic> delete(
    String path, {
    dynamic data,
    required String id,
    String? token,
    Map<String, dynamic>? query,
  }) async {
    try {
      final response = await dio.delete(
        path,
        data: data,
        queryParameters: query,
        options: _buildOptions(token),
      );
      return response.data;
    } on DioException catch (e) {
      throw ServerFailure.fromDioError(e);
    }
  }
}

class AuthInterceptor extends Interceptor {
  final AuthHttpClient authHttpClient;

  AuthInterceptor(this.authHttpClient);

  @override
  onRequest(RequestOptions options, RequestInterceptorHandler handler) async {
    // Skip auth for specific endpoints
    if (_shouldSkipAuth(options.path)) {
      handler.next(options);
      return;
    }

    final token = await authHttpClient.fetchValidAccessToken();
    options.headers['Authorization'] = 'Bearer $token';
    handler.next(options);
  }

  bool _shouldSkipAuth(String path) {
    // Customize based on your API structure
    return path.contains('/accounts/login') ||
        path.contains('/accounts/set-password') ||
        path.contains('/token/refresh');
  }
}
