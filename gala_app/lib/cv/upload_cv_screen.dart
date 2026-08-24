import 'package:file_picker/file_picker.dart';
import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';

import '../app_colors.dart';
import 'file_upload_section.dart';

final cvUploadErrorProvider = StateProvider<String?>((ref) => null);
final cvFileProvider = StateProvider<PlatformFile?>((ref) => null);

class CVUploadScreen extends StatelessWidget {
  const CVUploadScreen({super.key});

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: AppColors.bg,
      body: Column(
        children: [
          const Expanded(
            child: SingleChildScrollView(
              child: Column(children: [CVUploadHeader(), CVUploadContent()]),
            ),
          ),
        ],
      ),
    );
  }
}

class CVUploadHeader extends StatelessWidget {
  const CVUploadHeader({super.key});

  @override
  Widget build(BuildContext context) {
    return Container(
      color: AppColors.bg,
      padding: const EdgeInsets.all(16).copyWith(bottom: 8),
      child: Row(
        mainAxisAlignment: MainAxisAlignment.spaceBetween,
        children: [
          IconButton(
            icon: Icon(Icons.close, size: 24),
            color: AppColors.white,
            onPressed: () {
              context.pop(context);
            },
          ),
          const Text(
            'CV Upload',
            style: TextStyle(
              color: AppColors.white,
              fontSize: 18,
              fontWeight: FontWeight.bold,
            ),
          ),
          const SizedBox(width: 24),
        ],
      ),
    );
  }
}

class CVUploadContent extends StatelessWidget {
  const CVUploadContent({super.key});

  @override
  Widget build(BuildContext context) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        const CVUploadTitle(),
        const CVUploadDescription(),
        const FileUploadSection(),
        // const LinkedInImportButton(),
        // Padding(
        //   padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 12),
        //   child: const Divider(height: 1, color: AppColors.divider),
        // ),
        // const MessageTextArea(),
      ],
    );
  }
}

class CVUploadTitle extends StatelessWidget {
  const CVUploadTitle({super.key});

  @override
  Widget build(BuildContext context) {
    return const Padding(
      padding: EdgeInsets.fromLTRB(16, 20, 16, 12),
      child: Text(
        'Upload your CV',
        style: TextStyle(
          color: AppColors.white,
          fontSize: 22,
          fontWeight: FontWeight.bold,
        ),
      ),
    );
  }
}

class CVUploadDescription extends StatelessWidget {
  const CVUploadDescription({super.key});

  @override
  Widget build(BuildContext context) {
    return const Padding(
      padding: EdgeInsets.fromLTRB(16, 4, 16, 12),
      child: Text(
        'Select your CV file or import from LinkedIn.',
        style: TextStyle(color: AppColors.white, fontSize: 16),
      ),
    );
  }
}
