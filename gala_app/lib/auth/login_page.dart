import 'dart:developer';

import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:flutter_svg/svg.dart';
import 'package:go_router/go_router.dart';
import '../app_colors.dart';
import '../core/failure.dart';
import 'auth_provider.dart';

class LoginPage extends ConsumerStatefulWidget {
  const LoginPage({super.key});

  @override
  ConsumerState<LoginPage> createState() => _LoginPageState();
}

class _LoginPageState extends ConsumerState<LoginPage> {
  final _formKey = GlobalKey<FormState>();
  final _emailController = TextEditingController();
  final _passwordController = TextEditingController();
  bool _obscure = true;
  bool _hasNavigated = false;

  @override
  void dispose() {
    _emailController.dispose();
    _passwordController.dispose();
    super.dispose();
  }

  String _getErrorMessage(Object error) {
    log('error: $error');

    if (error is ServerFailure) {
      return error.errMessage; // Use the parsed backend message
    } else if (error is String) {
      return error;
    } else {
      return 'An unexpected error occurred. Please try again.';
    }
  }

  void _showErrorSnackBar(String message) {
    if (!mounted) return;

    ScaffoldMessenger.of(context).showSnackBar(
      SnackBar(
        content: Text(message),
        backgroundColor: Colors.redAccent,
        behavior: SnackBarBehavior.floating,
        margin: const EdgeInsets.all(16),
        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(8)),
        duration: const Duration(seconds: 4),
      ),
    );
  }

  Future<void> _login() async {
    if (!_formKey.currentState!.validate()) return;

    final email = _emailController.text.trim();
    final password = _passwordController.text.trim();

    try {
      final controller = ref.read(authControllerProvider.notifier);
      await controller.login(email, password);
    } catch (e) {
      log('Error during login: $e');
    }
  }

  @override
  Widget build(BuildContext context) {
    final authState = ref.watch(authControllerProvider);
    final isLoading = authState.isLoading;

    // Listen for state changes
    ref.listen<AsyncValue<void>>(authControllerProvider, (previous, next) {
      // Skip if we've already navigated
      if (_hasNavigated) return;

      next.whenOrNull(
        data: (_) {
          if (!_hasNavigated && mounted) {
            _hasNavigated = true;
            // Navigate on success
            WidgetsBinding.instance.addPostFrameCallback((_) {
              if (mounted) {
                context.go('/home');
              }
            });
          }
        },
        error: (error, stackTrace) {
          // Handle error safely
          log('Auth error: $error');
          final errorMessage = _getErrorMessage(error);
          WidgetsBinding.instance.addPostFrameCallback((_) {
            _showErrorSnackBar(errorMessage);
          });
        },
      );
    });

    return Scaffold(
      backgroundColor: AppColors.bg,
      body: Padding(
        padding: const EdgeInsets.symmetric(horizontal: 20),
        child: Center(
          child: SingleChildScrollView(
            child: Form(
              key: _formKey,
              autovalidateMode: AutovalidateMode.onUserInteraction,
              child: Column(
                children: [
                  SvgPicture.asset(
                    'assets/logos/gala-nav-logo.svg',
                    width: 70,
                    height: 70,
                  ),
                  const SizedBox(height: 30),
                  const Text(
                    'Welcome Back',
                    style: TextStyle(
                      color: AppColors.white,
                      fontSize: 30,
                      fontWeight: FontWeight.bold,
                    ),
                  ),
                  const SizedBox(height: 10),
                  const Text(
                    'Please log in to continue.',
                    textAlign: TextAlign.center,
                    style: TextStyle(
                      color: AppColors.textSecondary,
                      fontSize: 15,
                      height: 1.5,
                    ),
                  ),
                  const SizedBox(height: 40),

                  // Email field
                  TextFormField(
                    controller: _emailController,
                    style: const TextStyle(color: AppColors.white),
                    keyboardType: TextInputType.emailAddress,
                    enabled: !isLoading,
                    validator: (value) {
                      if (value == null || value.trim().isEmpty) {
                        return 'Email is required';
                      }
                      final regex = RegExp(
                        r'^[\w\.\-]+@([\w\-]+\.)+[a-zA-Z]{2,4}$',
                      );
                      if (!regex.hasMatch(value.trim())) {
                        return 'Enter a valid email';
                      }
                      return null;
                    },
                    decoration: InputDecoration(
                      labelText: 'Email',
                      hintText: 'you@example.com',
                      labelStyle: const TextStyle(
                        color: AppColors.textSecondary,
                      ),
                      hintStyle: const TextStyle(
                        color: AppColors.textSecondary,
                      ),
                      filled: true,
                      fillColor: AppColors.surface,
                      errorStyle: const TextStyle(color: Colors.redAccent),
                      enabledBorder: OutlineInputBorder(
                        borderRadius: BorderRadius.circular(14),
                        borderSide: const BorderSide(
                          color: AppColors.border,
                          width: 1.2,
                        ),
                      ),
                      focusedBorder: OutlineInputBorder(
                        borderRadius: BorderRadius.circular(14),
                        borderSide: const BorderSide(
                          color: AppColors.divider,
                          width: 1.2,
                        ),
                      ),
                      errorBorder: OutlineInputBorder(
                        borderRadius: BorderRadius.circular(14),
                        borderSide: const BorderSide(
                          color: Colors.redAccent,
                          width: 1.2,
                        ),
                      ),
                      focusedErrorBorder: OutlineInputBorder(
                        borderRadius: BorderRadius.circular(14),
                        borderSide: const BorderSide(
                          color: Colors.redAccent,
                          width: 1.2,
                        ),
                      ),
                    ),
                  ),
                  const SizedBox(height: 20),

                  // Password field
                  TextFormField(
                    controller: _passwordController,
                    obscureText: _obscure,
                    style: const TextStyle(color: AppColors.white),
                    enabled: !isLoading,
                    validator: (value) {
                      if (value == null || value.trim().isEmpty) {
                        return 'Password is required';
                      }
                      return null;
                    },
                    decoration: InputDecoration(
                      labelText: 'Password',
                      hintText: 'Enter your password',
                      labelStyle: const TextStyle(
                        color: AppColors.textSecondary,
                      ),
                      hintStyle: const TextStyle(
                        color: AppColors.textSecondary,
                      ),
                      filled: true,
                      fillColor: AppColors.surface,
                      errorStyle: const TextStyle(color: Colors.redAccent),
                      suffixIcon: IconButton(
                        icon: Icon(
                          _obscure ? Icons.visibility_off : Icons.visibility,
                          color: AppColors.textSecondary,
                        ),
                        onPressed:
                            isLoading
                                ? null
                                : () => setState(() => _obscure = !_obscure),
                      ),
                      enabledBorder: OutlineInputBorder(
                        borderRadius: BorderRadius.circular(14),
                        borderSide: const BorderSide(
                          color: AppColors.border,
                          width: 1.2,
                        ),
                      ),
                      focusedBorder: OutlineInputBorder(
                        borderRadius: BorderRadius.circular(14),
                        borderSide: const BorderSide(
                          color: AppColors.divider,
                          width: 1.2,
                        ),
                      ),
                      errorBorder: OutlineInputBorder(
                        borderRadius: BorderRadius.circular(14),
                        borderSide: const BorderSide(
                          color: Colors.redAccent,
                          width: 1.2,
                        ),
                      ),
                      focusedErrorBorder: OutlineInputBorder(
                        borderRadius: BorderRadius.circular(14),
                        borderSide: const BorderSide(
                          color: Colors.redAccent,
                          width: 1.2,
                        ),
                      ),
                    ),
                  ),
                  // Align(
                  //   alignment: Alignment.centerRight,
                  //   child: TextButton(
                  //     onPressed: isLoading ? null : () {},
                  //     child: Text(
                  //       'Forgot password?',
                  //       style: TextStyle(
                  //         color:
                  //             isLoading
                  //                 ? AppColors.textSecondary.withOpacity(0.5)
                  //                 : AppColors.textSecondary,
                  //       ),
                  //     ),
                  //   ),
                  // ),
                  const SizedBox(height: 10),

                  // Login button
                  GestureDetector(
                    onTap: isLoading ? null : _login,
                    child: AnimatedContainer(
                      duration: const Duration(milliseconds: 300),
                      height: 55,
                      alignment: Alignment.center,
                      decoration: BoxDecoration(
                        color: isLoading ? AppColors.divider : AppColors.accent,
                        borderRadius: BorderRadius.circular(14),
                      ),
                      child:
                          isLoading
                              ? const SizedBox(
                                height: 24,
                                width: 24,
                                child: CircularProgressIndicator(
                                  color: AppColors.white,
                                  strokeWidth: 2,
                                ),
                              )
                              : const Text(
                                'Log In',
                                style: TextStyle(
                                  color: AppColors.white,
                                  fontWeight: FontWeight.w600,
                                  fontSize: 17,
                                ),
                              ),
                    ),
                  ),

                  const SizedBox(height: 25),

                  // Route to Sign Up
                  Row(
                    mainAxisAlignment: MainAxisAlignment.center,
                    children: [
                      const Text(
                        "Don't have an account? ",
                        style: TextStyle(
                          color: AppColors.textSecondary,
                          fontSize: 14,
                        ),
                      ),
                      GestureDetector(
                        onTap:
                            isLoading
                                ? null
                                : () => context.goNamed('create-account'),
                        child: Text(
                          'Create One',
                          style: TextStyle(
                            color:
                                isLoading
                                    ? AppColors.textSecondary
                                    : AppColors.white,
                            fontWeight: FontWeight.w600,
                            fontSize: 14.5,
                          ),
                        ),
                      ),
                    ],
                  ),
                ],
              ),
            ),
          ),
        ),
      ),
    );
  }
}
