import 'dart:async';
import 'dart:developer';

import 'package:dio/dio.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../core/api_provider.dart';
import '../core/failure.dart';
import '../core/secure_storage.dart';
import '../core/user_model.dart' as user;
import '../core/user_provider.dart';

class AuthController extends AsyncNotifier<void> {
  @override
  FutureOr<void> build() {
    // Controller only manages state
  }

  Future<void> createAccount(String email, String password) async {
    state = const AsyncLoading();

    final api = ref.read(apiServiceProvider);

    // ✅ Assign the result of AsyncValue.guard to state
    state = await AsyncValue.guard(() async {
      try {
        final response = await api.post(
          '/accounts/set-password/',
          data: {'email': email, 'password': password},
        );

        final token = response['access_token'];
        log(token);
        final refreshToken = response['refresh_token'];
        log(refreshToken);

        if (token != null) {
          await SecureStorage.write('auth_token', token);
          await SecureStorage.write('refresh_token', refreshToken);
        }

        ref
            .read(userProvider.notifier)
            .reloadUser(user.User.fromRegisterJson(response['user']));

        return;
      } on DioException catch (dioError) {
        throw ServerFailure.fromDioError(dioError);
      }
    });
  }

  Future<void> login(String email, String password) async {
    state = const AsyncLoading();

    final api = ref.read(apiServiceProvider);

    // ✅ Same fix here
    state = await AsyncValue.guard(() async {
      final response = await api.post(
        '/accounts/login/',
        data: {"email": email, "password": password},
      );

      final token = response['data']['access_token'];
      final refreshToken = response['data']['refresh_token'];

      if (token != null) {
        await SecureStorage.write('auth_token', token);
        await SecureStorage.write('refresh_token', refreshToken);
      }

      ref
          .read(userProvider.notifier)
          .reloadUser(user.User.fromJson(response['data']));

      return;
    });
  }

  Future<void> signOut() async {
    state = const AsyncLoading();

    await AsyncValue.guard(() async {
      await SecureStorage.delete('auth_token');
      await SecureStorage.delete('refresh_token');
      ref.read(userProvider.notifier).clearUser();
    });

    state = const AsyncData(null);
  }
}

final authControllerProvider = AsyncNotifierProvider<AuthController, void>(
  AuthController.new,
);
