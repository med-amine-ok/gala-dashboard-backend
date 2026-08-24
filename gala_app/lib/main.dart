import 'dart:developer';

import 'package:camera/camera.dart';
import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:supabase_flutter/supabase_flutter.dart';

import 'app_colors.dart';
import 'app_providers.dart';
import 'app_root.dart';
import 'core/secure_storage.dart';

void main() async {
  WidgetsFlutterBinding.ensureInitialized();
  await Supabase.initialize(
    url: 'https://ltkjworhyljueiogriqt.supabase.co',
    anonKey:
        'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imx0a2p3b3JoeWxqdWVpb2dyaXF0Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjA2MzM4ODksImV4cCI6MjA3NjIwOTg4OX0.EBiK6dBVTZMOzPBpGM8OlrZXnExiUOGrgEHervaejJY',
  );

  await SystemChrome.setPreferredOrientations([
    DeviceOrientation.portraitUp, // 👈 only allow portrait
    // DeviceOrientation.portraitDown,  // optional
  ]);

  List<CameraDescription> cameras = await availableCameras();

  final token = await SecureStorage.read('auth_token');

  log(token ?? 'no token');
  runApp(
    ProviderScope(
      overrides: [
        // override the previous value with the new object
        cameraProvider.overrideWithValue(cameras),
      ],
      child: GalaApp(),
    ),
  );
}

// final currentUserProvider = FutureProvider<bool>((ref) async {
//   final supabase = ref.read();
//   final user = supabase.auth.currentUser;
//   log('Current user: $user');
//   return user != null;
// });

/// Root
class GalaApp extends ConsumerWidget {
  const GalaApp({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final width = MediaQuery.of(context).size.width;
    final bool isPhone = width < 600; // you can tune this breakpoint

    return MaterialApp(
      debugShowCheckedModeBanner: false,
      home: Scaffold(
        body:
            isPhone
                ? const AppRoot()
                : Container(
                  color: AppColors.bg,
                  child: Center(
                    child: Text(
                      'Please use a phone to view Gala app!',
                      style: const TextStyle(
                        fontSize: 20,
                        color: AppColors.white,
                      ),
                    ),
                  ),
                ),
      ),
    );
  }
}

/// Mock Data Models
