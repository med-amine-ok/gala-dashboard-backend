import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:google_fonts/google_fonts.dart';
import '../app_colors.dart';
import '../core/gala_repo.dart';
import 'profile_screen.dart';

class SendFeedbackPage extends ConsumerStatefulWidget {
  const SendFeedbackPage({super.key});

  @override
  ConsumerState<SendFeedbackPage> createState() => _SendFeedbackPageState();
}

class _SendFeedbackPageState extends ConsumerState<SendFeedbackPage> {
  final _formKey = GlobalKey<FormState>();
  final TextEditingController _messageController = TextEditingController();
  bool _isSending = false;
  bool _sent = false;

  @override
  void dispose() {
    _messageController.dispose();
    super.dispose();
  }

  void _sendFeedback() async {
    if (_messageController.text.trim().isEmpty) return;

    setState(() => _isSending = true);

    try {
      final repo = ref.read(eventRepo);
      final profile = ref.read(profileInformationProvider).value;
      if (profile != null) {
        await repo.postFeedback(
          participantId: int.parse(profile.id),
          feedback: _messageController.text.trim(),
        );
      }

      setState(() {
        _isSending = false;
        _sent = true;
      });

      await Future.delayed(const Duration(seconds: 1));
      if (mounted) Navigator.pop(context);
    } catch (e) {
      setState(() => _isSending = false);
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(
            content: Text(
              'Failed to send feedback: $e',
              style: GoogleFonts.plusJakartaSans(color: AppColors.white),
            ),
            backgroundColor: AppColors.error,
            behavior: SnackBarBehavior.floating,
            margin: const EdgeInsets.all(16),
            shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
          ),
        );
      }
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: AppColors.bg,
      appBar: AppBar(
        title: Text(
          'Send Feedback',
          style: GoogleFonts.cinzel(
            color: AppColors.textPrimary,
            fontSize: 18,
            fontWeight: FontWeight.bold,
            letterSpacing: 0.5,
          ),
        ),
        backgroundColor: AppColors.bg,
        centerTitle: true,
        elevation: 0,
        leading: IconButton(
          icon: const Icon(
            Icons.arrow_back_ios_new_rounded,
            size: 20,
            color: AppColors.textPrimary,
          ),
          onPressed: () => Navigator.maybePop(context),
        ),
      ),
      body: SingleChildScrollView(
        physics: const BouncingScrollPhysics(),
        padding: const EdgeInsets.all(20),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Text(
              'Your Voice Matters',
              style: GoogleFonts.cinzel(
                fontSize: 22,
                fontWeight: FontWeight.bold,
                color: AppColors.textPrimary,
              ),
            ),
            const SizedBox(height: 8),
            Text(
              'Help us elevate future editions of the Engineers’ Gala by sharing your experience, suggestions, or insights.',
              style: GoogleFonts.plusJakartaSans(
                color: AppColors.textSecondary,
                fontSize: 14,
                height: 1.55,
              ),
            ),
            const SizedBox(height: 24),
            Container(
              padding: const EdgeInsets.all(20),
              decoration: BoxDecoration(
                color: AppColors.surface,
                borderRadius: BorderRadius.circular(20),
                border: Border.all(color: AppColors.border, width: 1.2),
                boxShadow: [
                  BoxShadow(
                    color: AppColors.charcoal.withOpacity(0.035),
                    blurRadius: 16,
                    offset: const Offset(0, 4),
                  ),
                ],
              ),
              child: Form(
                key: _formKey,
                child: Column(
                  children: [
                    TextFormField(
                      controller: _messageController,
                      maxLines: 6,
                      style: GoogleFonts.plusJakartaSans(
                        color: AppColors.textPrimary,
                        fontSize: 14.5,
                      ),
                      decoration: InputDecoration(
                        hintText: 'Share your thoughts, keynote feedback, or booth impressions...',
                        hintStyle: GoogleFonts.plusJakartaSans(
                          color: AppColors.textSubtle,
                          fontSize: 13.5,
                        ),
                        filled: true,
                        fillColor: AppColors.surfaceMuted,
                        enabledBorder: OutlineInputBorder(
                          borderRadius: BorderRadius.circular(14),
                          borderSide: const BorderSide(color: AppColors.border),
                        ),
                        focusedBorder: OutlineInputBorder(
                          borderRadius: BorderRadius.circular(14),
                          borderSide: const BorderSide(
                            color: AppColors.goldPrimary,
                            width: 1.5,
                          ),
                        ),
                      ),
                    ),
                    const SizedBox(height: 20),
                    GestureDetector(
                      onTap: _isSending ? null : _sendFeedback,
                      child: AnimatedContainer(
                        duration: const Duration(milliseconds: 250),
                        height: 52,
                        alignment: Alignment.center,
                        decoration: BoxDecoration(
                          color:
                              _sent
                                  ? AppColors.success
                                  : (_isSending
                                      ? AppColors.surfaceMuted
                                      : AppColors.goldPrimary),
                          borderRadius: BorderRadius.circular(14),
                          boxShadow: [
                            if (!_isSending && !_sent)
                              BoxShadow(
                                color: AppColors.goldPrimary.withOpacity(0.3),
                                blurRadius: 12,
                                offset: const Offset(0, 4),
                              ),
                          ],
                        ),
                        child:
                            _isSending
                                ? const SizedBox(
                                  height: 22,
                                  width: 22,
                                  child: CircularProgressIndicator(
                                    color: AppColors.goldDark,
                                    strokeWidth: 2,
                                  ),
                                )
                                : _sent
                                ? Row(
                                  mainAxisAlignment: MainAxisAlignment.center,
                                  children: [
                                    const Icon(Icons.check_circle_rounded, color: AppColors.white, size: 20),
                                    const SizedBox(width: 8),
                                    Text(
                                      'Feedback Sent',
                                      style: GoogleFonts.plusJakartaSans(
                                        color: AppColors.white,
                                        fontWeight: FontWeight.w700,
                                      ),
                                    ),
                                  ],
                                )
                                : Row(
                                  mainAxisAlignment: MainAxisAlignment.center,
                                  children: [
                                    const Icon(Icons.send_rounded, color: AppColors.charcoalDark, size: 18),
                                    const SizedBox(width: 8),
                                    Text(
                                      'Submit Feedback',
                                      style: GoogleFonts.plusJakartaSans(
                                        color: AppColors.charcoalDark,
                                        fontWeight: FontWeight.w700,
                                        fontSize: 15,
                                      ),
                                    ),
                                  ],
                                ),
                      ),
                    ),
                  ],
                ),
              ),
            ),
          ],
        ),
      ),
    );
  }
}

