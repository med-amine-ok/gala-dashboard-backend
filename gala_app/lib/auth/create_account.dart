import 'dart:developer';

import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:flutter_svg/svg.dart';
import 'package:go_router/go_router.dart';
import 'package:google_fonts/google_fonts.dart';
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

  OutlineInputBorder _border(Color color, {double width = 1.2}) => OutlineInputBorder(
    borderRadius: BorderRadius.circular(16),
    borderSide: BorderSide(color: color, width: width),
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
        content: Text(message, style: GoogleFonts.plusJakartaSans(color: AppColors.white)),
        backgroundColor: AppColors.error,
        behavior: SnackBarBehavior.floating,
        margin: const EdgeInsets.all(16),
        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
        duration: const Duration(seconds: 4),
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
      if (_hasNavigated) return;

      next.whenOrNull(
        data: (_) {
          if (!_hasNavigated && mounted) {
            _hasNavigated = true;
            WidgetsBinding.instance.addPostFrameCallback((_) {
              if (mounted) {
                context.goNamed('agenda');
              }
            });
          }
        },
        error: (error, stackTrace) {
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
      body: SafeArea(
        child: Padding(
          padding: const EdgeInsets.symmetric(horizontal: 24),
          child: Center(
            child: SingleChildScrollView(
              physics: const BouncingScrollPhysics(),
              child: Form(
                key: _formKey,
                autovalidateMode: AutovalidateMode.onUserInteraction,
                child: Column(
                  mainAxisAlignment: MainAxisAlignment.center,
                  children: [
                    const SizedBox(height: 20),
                    Container(
                      width: MediaQuery.of(context).size.width * 0.8,
                      constraints: const BoxConstraints(maxHeight: 120),
                      decoration: BoxDecoration(
                        boxShadow: [
                          BoxShadow(
                            color: AppColors.charcoal.withOpacity(0.06),
                            blurRadius: 20,
                            offset: const Offset(0, 6),
                          ),
                        ],
                      ),
                      child: Image.asset(
                        'assets/logos/GALA.png',
                        fit: BoxFit.contain,
                      ),
                    ),
                    const SizedBox(height: 24),
                    Text(
                      'Create Account',
                      style: GoogleFonts.cinzel(
                        color: AppColors.textPrimary,
                        fontSize: 28,
                        fontWeight: FontWeight.bold,
                        letterSpacing: 0.2,
                      ),
                    ),
                    const SizedBox(height: 8),
                    Text(
                      'Please create your account using the email address you registered with on the Gala website.',
                      textAlign: TextAlign.center,
                      style: GoogleFonts.plusJakartaSans(
                        color: AppColors.textSecondary,
                        fontSize: 14,
                        height: 1.5,
                      ),
                    ),
                    const SizedBox(height: 36),

                    // Email
                    TextFormField(
                      controller: _emailController,
                      style: GoogleFonts.plusJakartaSans(
                        color: AppColors.textPrimary,
                        fontSize: 14.5,
                      ),
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
                        labelText: 'Email Address',
                        hintText: 'you@example.com',
                        labelStyle: GoogleFonts.plusJakartaSans(
                          color: AppColors.textSecondary,
                          fontSize: 14,
                        ),
                        hintStyle: GoogleFonts.plusJakartaSans(
                          color: AppColors.textSubtle,
                          fontSize: 13.5,
                        ),
                        filled: true,
                        fillColor: AppColors.surface,
                        errorStyle: GoogleFonts.plusJakartaSans(color: AppColors.error),
                        prefixIcon: const Icon(
                          Icons.email_outlined,
                          color: AppColors.goldDark,
                          size: 20,
                        ),
                        enabledBorder: _border(AppColors.border),
                        focusedBorder: _border(AppColors.goldPrimary, width: 1.5),
                        errorBorder: _border(AppColors.error),
                        focusedErrorBorder: _border(AppColors.error, width: 1.5),
                      ),
                    ),
                    const SizedBox(height: 18),

                    // Password
                    TextFormField(
                      controller: _passwordController,
                      obscureText: obscurePassword,
                      style: GoogleFonts.plusJakartaSans(
                        color: AppColors.textPrimary,
                        fontSize: 14.5,
                      ),
                      enabled: !isLoading,
                      validator: (value) {
                        if (value == null || value.trim().isEmpty) {
                          return 'Password is required';
                        }
                        if (value.trim().length < 8) {
                          return 'Password must be at least 8 characters';
                        }
                        return null;
                      },
                      decoration: InputDecoration(
                        labelText: 'Password',
                        hintText: 'Minimum 8 characters',
                        labelStyle: GoogleFonts.plusJakartaSans(
                          color: AppColors.textSecondary,
                          fontSize: 14,
                        ),
                        hintStyle: GoogleFonts.plusJakartaSans(
                          color: AppColors.textSubtle,
                          fontSize: 13.5,
                        ),
                        filled: true,
                        fillColor: AppColors.surface,
                        errorStyle: GoogleFonts.plusJakartaSans(color: AppColors.error),
                        prefixIcon: const Icon(
                          Icons.lock_outline_rounded,
                          color: AppColors.goldDark,
                          size: 20,
                        ),
                        suffixIcon: IconButton(
                          icon: Icon(
                            obscurePassword
                                ? Icons.visibility_off_outlined
                                : Icons.visibility_outlined,
                            color: AppColors.textSecondary,
                            size: 20,
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
                        focusedBorder: _border(AppColors.goldPrimary, width: 1.5),
                        errorBorder: _border(AppColors.error),
                        focusedErrorBorder: _border(AppColors.error, width: 1.5),
                      ),
                    ),
                    const SizedBox(height: 28),

                    // Create Account button
                    GestureDetector(
                      onTap: isLoading ? null : _createAccount,
                      child: AnimatedContainer(
                        duration: const Duration(milliseconds: 250),
                        height: 54,
                        alignment: Alignment.center,
                        decoration: BoxDecoration(
                          color: isLoading ? AppColors.surfaceMuted : AppColors.goldPrimary,
                          borderRadius: BorderRadius.circular(16),
                          border: Border.all(
                            color: isLoading ? AppColors.border : AppColors.goldDark.withOpacity(0.4),
                          ),
                          boxShadow: [
                            if (!isLoading)
                              BoxShadow(
                                color: AppColors.goldPrimary.withOpacity(0.3),
                                blurRadius: 14,
                                offset: const Offset(0, 4),
                              ),
                          ],
                        ),
                        child:
                            isLoading
                                ? const SizedBox(
                                  height: 22,
                                  width: 22,
                                  child: CircularProgressIndicator(
                                    color: AppColors.goldDark,
                                    strokeWidth: 2,
                                  ),
                                )
                                : Text(
                                  'Create Account',
                                  style: GoogleFonts.plusJakartaSans(
                                    color: AppColors.charcoalDark,
                                    fontWeight: FontWeight.w700,
                                    fontSize: 16,
                                    letterSpacing: 0.3,
                                  ),
                                ),
                      ),
                    ),
                    const SizedBox(height: 24),

                    // Login redirect
                    Row(
                      mainAxisAlignment: MainAxisAlignment.center,
                      children: [
                        Text(
                          "Already have an account? ",
                          style: GoogleFonts.plusJakartaSans(
                            color: AppColors.textSecondary,
                            fontSize: 14,
                          ),
                        ),
                        GestureDetector(
                          onTap: isLoading ? null : () => context.goNamed('login'),
                          child: Text(
                            "Log in",
                            style: GoogleFonts.plusJakartaSans(
                              color: AppColors.goldDark,
                              fontWeight: FontWeight.w700,
                              fontSize: 14,
                            ),
                          ),
                        ),
                      ],
                    ),
                    const SizedBox(height: 30),
                  ],
                ),
              ),
            ),
          ),
        ),
      ),
    );
  }
}

