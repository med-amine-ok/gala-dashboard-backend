import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:flutter_svg/svg.dart';
import 'package:google_fonts/google_fonts.dart';

import 'app_colors.dart';
import 'app_router.dart';
import 'core/user_provider.dart';

class AppRoot extends ConsumerWidget {
  const AppRoot({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final userAsync = ref.watch(userProvider);

    // Handle loading, error, and data states
    return userAsync.when(
      data: (user) {
        // Once user data is loaded, show router
        final router = ref.watch(routerProvider);
        return MaterialApp.router(
          routerConfig: router,
          debugShowCheckedModeBanner: false,
          theme: ThemeData.dark().copyWith(
            scaffoldBackgroundColor: AppColors.bg,
            textTheme: GoogleFonts.ralewayTextTheme(ThemeData.dark().textTheme),
          ),
        );
      },
      loading: () => const MaterialApp(home: SplashScreen()),
      error:
          (error, stack) => MaterialApp(
            theme: ThemeData(
              colorScheme: ColorScheme.fromSeed(seedColor: AppColors.accent),
            ),
            home: Scaffold(
              backgroundColor: AppColors.bg,

              body: Center(
                child: Text(
                  'Something went wrong. Please restart the app.\n${error.toString()}',
                  textAlign: TextAlign.center,
                ),
              ),
            ),
          ),
    );
  }
}

class SplashScreen extends StatelessWidget {
  const SplashScreen({super.key});

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      body: Container(
        color: AppColors.bg,
        child: Column(
          mainAxisAlignment: MainAxisAlignment.spaceAround,
          crossAxisAlignment: CrossAxisAlignment.stretch,
          children: [
            SvgPicture.asset(
              'assets/logos/gala-nav-logo.svg',
              width: 70,
              height: 70,
            ),

            Center(
              child: CircularProgressIndicator(
                valueColor: AlwaysStoppedAnimation<Color>(AppColors.white),
              ),
            ),
          ],
        ),
      ),
    );
  }
}
