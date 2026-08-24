import 'dart:typed_data';
import 'package:flutter/material.dart';
import 'package:google_fonts/google_fonts.dart';
import 'package:pdfx/pdfx.dart';

import '../app_colors.dart';

class PdfViewPage extends StatelessWidget {
  final Uint8List pdfBytes;
  final String title;

  const PdfViewPage({super.key, required this.pdfBytes, required this.title});

  @override
  Widget build(BuildContext context) {
    final controller = PdfController(document: PdfDocument.openData(pdfBytes));

    return Scaffold(
      backgroundColor: AppColors.bg,
      appBar: AppBar(
        title: Text(
          title.isNotEmpty ? title : 'Resume Document',
          style: GoogleFonts.cinzel(
            color: AppColors.textPrimary,
            fontSize: 18,
            fontWeight: FontWeight.bold,
            letterSpacing: 0.5,
          ),
        ),
        centerTitle: true,
        backgroundColor: AppColors.bg,
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
      body: PdfView(controller: controller),
    );
  }
}

