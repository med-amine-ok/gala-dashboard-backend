import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';

import 'agenda/agenda_screen.dart';
import 'auth/create_account.dart';
import 'auth/login_page.dart';
import 'booths/booths_list.dart';
import 'core/user_provider.dart';
import 'custom_nav_bar.dart';
import 'cv/company_cv_screen.dart';
import 'cv/upload_cv_screen.dart';
import 'home/guest_page.dart';
import 'home/home_page.dart';
import 'profile/about_gala.dart';
import 'profile/gallery_screen.dart';
import 'profile/personal_information.dart';
import 'profile/profile_screen.dart';
import 'profile/send_feedback_page.dart';

final routerProvider = Provider<GoRouter>((ref) {
  final user = ref.watch(userProvider).value;
  return GoRouter(
    navigatorKey: GlobalKey<NavigatorState>(),
    initialLocation: '/',
    redirect: (context, state) {
      final loggingIn =
          state.uri.path == '/login' || state.uri.path == '/create_account';

      // If the user is not logged in
      if (user == null) {
        // Allow access to login or create account pages
        if (loggingIn) return null;

        // Otherwise redirect to create account
        return '/create_account';
      }

      // If the user is logged in
      // Prevent navigating to login/create account pages
      if (loggingIn) return '/';

      // Otherwise, no redirect
      return null;
    },
    routes: [
      GoRoute(
        path: '/login',
        name: 'login',
        builder: (context, state) => const LoginPage(),
      ),
      GoRoute(
        name: 'create-account',
        path: '/create_account',
        builder: (context, state) => CreateAccountPage(),
      ),
      ShellRoute(
        routes: [
          GoRoute(path: '/', builder: (context, state) => const GalaHomePage()),
          GoRoute(
            path: '/home',
            builder: (context, state) => const GalaHomePage(),
            routes: [],
          ),
          GoRoute(
            name: 'guests',
            path: '/guests',
            builder: (context, state) => const GuestPage(),
          ),
          GoRoute(
            name: 'agenda',
            path: '/agendas',
            builder: (context, state) => const AgendaScreen(),
          ),
          GoRoute(
            path: '/booths',
            builder: (context, state) => const BoothsScreen(),
          ),
          GoRoute(
            path: '/profile',
            builder: (context, state) => const ProfileScreen(),
            routes: [
              GoRoute(
                name: 'gallery-screen',
                path: '/gala-gallery',
                builder: (context, state) => const GalaGalleryScreen(),
              ),

              GoRoute(
                name: 'about-gala',
                path: '/about',
                builder: (context, state) => const AboutGalaScreen(),
              ),
              GoRoute(
                name: 'personal-info',
                path: '/personal-info',
                builder: (context, state) => const DigitalBusinessCardScreen(),
              ),
              GoRoute(
                name: 'company-cv',
                path: '/company-cv',
                builder: (context, state) => const CompanyCvScreen(),
              ),
              GoRoute(
                name: 'upload-cv',
                path: '/upload_cv',
                pageBuilder:
                    (context, state) => CustomTransitionPage(
                      key: state.pageKey,
                      child: const CVUploadScreen(),
                      transitionsBuilder: (
                        context,
                        animation,
                        secondaryAnimation,
                        child,
                      ) {
                        const begin = Offset(0.0, 1.0);
                        const end = Offset.zero;
                        final tween = Tween(
                          begin: begin,
                          end: end,
                        ).chain(CurveTween(curve: Curves.easeInOut));
                        return SlideTransition(
                          position: animation.drive(tween),
                          child: child,
                        );
                      },
                    ),
              ),

              GoRoute(
                name: 'feedback',
                path: '/send_feedback',
                builder: (context, state) => const SendFeedbackPage(),
              ),
            ],
          ),
        ],
        builder: (context, state, child) {
          final location = state.uri.toString();
          int index = 0;
          if (location.startsWith('/home')) index = 0;
          if (location.startsWith('/agendas')) index = 1;
          if (location.startsWith('/booths')) index = 2;
          if (location.startsWith('/profile')) index = 3;

          return SafeArea(
            child: Scaffold(
              bottomNavigationBar: BottomNavBar(
                currentIndex: index,
                onTap: (newIndex) {
                  switch (newIndex) {
                    case 0:
                      context.go('/home');
                      break;
                    case 1:
                      context.go('/agendas');
                      break;
                    case 2:
                      context.go('/booths');
                      break;
                    case 3:
                      context.go('/profile');
                      break;
                  }
                },
              ),
              body: child,
            ),
          );
        },
      ),
    ],
  );
});
