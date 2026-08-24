import 'dart:developer';

import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:flutter_svg/svg.dart';
import 'package:go_router/go_router.dart';
import '../app_colors.dart';
import '../core/failure.dart';
import 'auth_provider.dart';

// Provider to manage password visibility
final obscurePasswordProvider = StateProvider<bool>((ref) => true);

class CreateAccountPage extends ConsumerStatefulWidget {
  const CreateAccountPage({super.key});

  @override
  ConsumerState<CreateAccountPage> createState() => _CreateAccountPageState();
}

class _CreateAccountPageState extends ConsumerState<CreateAccountPage> {
  final _formKey = GlobalKey<FormState>();
  final _emailController = TextEditingController();
  final _passwordController = TextEditingController();
  bool _hasNavigated = false;

  @override
  void dispose() {
    _emailController.dispose();
    _passwordController.dispose();
    super.dispose();
  }

  OutlineInputBorder _border(Color color) => OutlineInputBorder(
    borderRadius: BorderRadius.circular(14),
    borderSide: BorderSide(color: color, width: 1.2),
  );

  String _getErrorMessage(Object error) {
    if (error is ServerFailure) {
      return error.errMessage;
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
      ),
    );
  }

  Future<void> _createAccount() async {
    if (!_formKey.currentState!.validate()) return;

    final email = _emailController.text.trim();
    final password = _passwordController.text.trim();

    try {
      final controller = ref.read(authControllerProvider.notifier);
      await controller.createAccount(email, password);
    } catch (e) {
      log('Error during account creation: $e');
    }
  }

  @override
  Widget build(BuildContext context) {
    final authState = ref.watch(authControllerProvider);
    final obscurePassword = ref.watch(obscurePasswordProvider);

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
                context.goNamed('agenda');
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

    final isLoading = authState.isLoading;

    return Scaffold(
      backgroundColor: AppColors.bg,
      body: Padding(
        padding: const EdgeInsets.symmetric(horizontal: 24),
        child: SingleChildScrollView(
          child: Form(
            key: _formKey,
            autovalidateMode: AutovalidateMode.onUserInteraction,
            child: Column(
              mainAxisAlignment: MainAxisAlignment.center,
              children: [
                const SizedBox(height: 140),
                SvgPicture.asset(
                  'assets/logos/gala-nav-logo.svg',
                  width: 70,
                  height: 70,
                ),
                const SizedBox(height: 40),
                const Text(
                  'Create Account',
                  style: TextStyle(
                    color: AppColors.white,
                    fontSize: 30,
                    fontWeight: FontWeight.bold,
                  ),
                ),
                const SizedBox(height: 15),
                const Text(
                  'Please create your account using the same email address you registered with on the website.',
                  textAlign: TextAlign.center,
                  style: TextStyle(
                    color: AppColors.textSecondary,
                    fontSize: 15,
                    height: 1.5,
                  ),
                ),
                const SizedBox(height: 40),
                // Email
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
                    labelStyle: const TextStyle(color: AppColors.textSecondary),
                    filled: true,
                    fillColor: AppColors.surface,
                    errorStyle: const TextStyle(color: Colors.redAccent),
                    enabledBorder: _border(AppColors.border),
                    focusedBorder: _border(AppColors.divider),
                    errorBorder: _border(Colors.redAccent),
                    focusedErrorBorder: _border(Colors.redAccent),
                  ),
                ),
                const SizedBox(height: 25),
                // Password
                TextFormField(
                  controller: _passwordController,
                  obscureText: obscurePassword,
                  style: const TextStyle(color: AppColors.white),
                  enabled: !isLoading,
                  validator: (value) {
                    if (value == null || value.trim().isEmpty) {
                      return 'Password is required';
                    }
                    if (value.trim().length < 8) {
                      return 'Password must be at least 8 chars';
                    }
                    return null;
                  },
                  decoration: InputDecoration(
                    labelText: 'Password',
                    labelStyle: const TextStyle(color: AppColors.textSecondary),
                    filled: true,
                    fillColor: AppColors.surface,
                    errorStyle: const TextStyle(color: Colors.redAccent),
                    suffixIcon: IconButton(
                      icon: Icon(
                        obscurePassword
                            ? Icons.visibility_off
                            : Icons.visibility,
                        color: AppColors.textSecondary,
                      ),
                      onPressed:
                          isLoading
                              ? null
                              : () {
                                ref
                                    .read(obscurePasswordProvider.notifier)
                                    .state = !obscurePassword;
                              },
                    ),
                    enabledBorder: _border(AppColors.border),
                    focusedBorder: _border(AppColors.divider),
                    errorBorder: _border(Colors.redAccent),
                    focusedErrorBorder: _border(Colors.redAccent),
                  ),
                ),
                const SizedBox(height: 40),
                // Create Account button
                GestureDetector(
                  onTap: isLoading ? null : _createAccount,
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
                              'Create Account',
                              style: TextStyle(
                                color: AppColors.white,
                                fontWeight: FontWeight.w600,
                                fontSize: 17,
                              ),
                            ),
                  ),
                ),
                const SizedBox(height: 20),
                // Login redirect
                Row(
                  mainAxisAlignment: MainAxisAlignment.center,
                  children: [
                    const Text(
                      "Already have an account? ",
                      style: TextStyle(
                        color: AppColors.textSecondary,
                        fontSize: 14,
                      ),
                    ),
                    GestureDetector(
                      onTap: isLoading ? null : () => context.goNamed('login'),
                      child: Text(
                        "Log in",
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
                const SizedBox(height: 60),
              ],
            ),
          ),
        ),
      ),
    );
  }
}
