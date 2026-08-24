import 'dart:typed_data';
import 'package:flutter/material.dart';
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
          'CV Viewer',
          style: const TextStyle(color: AppColors.white),
        ),
        centerTitle: true,
        backgroundColor: AppColors.bg,
      ),
      body: PdfView(controller: controller),
    );
  }
}
