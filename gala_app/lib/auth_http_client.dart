import 'dart:developer';

import 'package:http/http.dart' as http;
import 'package:jwt_decoder/jwt_decoder.dart';

import 'core/secure_storage.dart';

class AuthHttpClient extends http.BaseClient {
  AuthHttpClient({
    required Future<String> Function() initialAccessToken,
    required this.refreshAccessToken,
    required this.onRefreshAccessTokenFailed,
  }) {
    _accessTokenFuture = initialAccessToken();
  }

  late Future<String> _accessTokenFuture;
  String? _accessToken;

  final Future<String?> Function() refreshAccessToken;
  final void Function() onRefreshAccessTokenFailed;

  final http.Client _client = http.Client();

  @override
  Future<http.StreamedResponse> send(http.BaseRequest request) async {
    final token = await fetchValidAccessToken();
    request.headers['Authorization'] = 'Bearer $token';
    return _client.send(request);
  }

  @override
  void close() {
    _client.close();
    super.close();
  }

  Future<String?> fetchValidAccessToken() async {
    log('Fetching access token...');
    _accessToken = await SecureStorage.read('auth_token');

    // If no token or expired, try refreshing
    if (_accessToken == null || JwtDecoder.isExpired(_accessToken!)) {
      final refreshed = await refreshAccessToken();
      log('Refreshed token: $refreshed');

      if (refreshed == null) {
        onRefreshAccessTokenFailed();
        return null; // <-- important: don't return an empty string
      }

      _accessToken = refreshed;
    }

    return _accessToken;
  }
}
