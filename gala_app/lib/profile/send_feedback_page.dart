import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../app_colors.dart';
import '../core/gala_repo.dart';
import '../core/user_provider.dart';
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

  void _sendFeedback() async {
    if (_messageController.text.trim().isEmpty) return;

    setState(() => _isSending = true);

    try {
      final repo = ref.read(eventRepo); // ✅ ref is available now
      await repo.postFeedback(
        participantId: int.parse(
          ref.read(profileInformationProvider).value!.id,
          // ref.read(userProvider.notifier).user.id,
        ), // replace with real participant ID
        feedback: _messageController.text.trim(),
      );

      setState(() {
        _isSending = false;
        _sent = true;
      });

      await Future.delayed(const Duration(seconds: 1));
      if (mounted) Navigator.pop(context);
    } catch (e) {
      setState(() => _isSending = false);
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(
          content: Text('Failed to send feedback: $e'),
          backgroundColor: Colors.redAccent,
        ),
      );
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: AppColors.bg,
      appBar: AppBar(
        title: const Text(
          'Send Feedback',
          style: TextStyle(
            color: AppColors.white,
            fontSize: 18,
            fontWeight: FontWeight.bold,
          ),
        ),
        backgroundColor: AppColors.bg,
        centerTitle: true,
        elevation: 0,
        iconTheme: const IconThemeData(color: AppColors.white),
      ),
      body: SingleChildScrollView(
        padding: const EdgeInsets.all(20),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            const Text(
              'We’d love to hear from you!',
              style: TextStyle(
                fontSize: 20,
                fontWeight: FontWeight.bold,
                color: AppColors.white,
              ),
            ),
            const SizedBox(height: 8),
            const Text(
              'Your thoughts help us improve and make the experience better for everyone.',
              style: TextStyle(color: AppColors.textSecondary, fontSize: 14),
            ),
            const SizedBox(height: 24),
            Container(
              padding: const EdgeInsets.all(16),
              decoration: BoxDecoration(
                color: AppColors.surface,
                borderRadius: BorderRadius.circular(16),
                border: Border.all(color: AppColors.border),
                boxShadow: [
                  BoxShadow(
                    color: AppColors.accent.withOpacity(0.4),
                    blurRadius: 8,
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
                      style: const TextStyle(color: AppColors.white),
                      decoration: InputDecoration(
                        hintText: 'Write your feedback here...',
                        hintStyle: const TextStyle(
                          color: AppColors.textSecondary,
                        ),
                        filled: true,
                        fillColor: AppColors.bg,
                        enabledBorder: OutlineInputBorder(
                          borderRadius: BorderRadius.circular(12),
                          borderSide: const BorderSide(color: AppColors.border),
                        ),
                        focusedBorder: OutlineInputBorder(
                          borderRadius: BorderRadius.circular(12),
                          borderSide: const BorderSide(
                            color: AppColors.divider,
                          ),
                        ),
                      ),
                    ),
                    const SizedBox(height: 20),
                    GestureDetector(
                      onTap: _isSending ? null : _sendFeedback,
                      child: AnimatedContainer(
                        duration: const Duration(milliseconds: 300),
                        height: 50,
                        alignment: Alignment.center,
                        decoration: BoxDecoration(
                          color:
                              _sent
                                  ? Colors.greenAccent.withOpacity(0.8)
                                  : (_isSending
                                      ? AppColors.divider
                                      : AppColors.accent),
                          borderRadius: BorderRadius.circular(14),
                        ),
                        child:
                            _isSending
                                ? const SizedBox(
                                  height: 22,
                                  width: 22,
                                  child: CircularProgressIndicator(
                                    color: AppColors.white,
                                    strokeWidth: 2,
                                  ),
                                )
                                : Icon(
                                  _sent
                                      ? Icons.check_circle
                                      : Icons.send_rounded,
                                  color: AppColors.white,
                                  size: 24,
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
