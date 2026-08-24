import 'dart:convert';
import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:flutter_secure_storage/flutter_secure_storage.dart';
import 'package:google_fonts/google_fonts.dart';
import 'package:mobile_scanner/mobile_scanner.dart';
import '../app_colors.dart';
import '../core/gala_repo.dart';

class ScanPage extends ConsumerStatefulWidget {
  const ScanPage({super.key});

  @override
  ConsumerState<ScanPage> createState() => _ScanPageState();
}

class _ScanPageState extends ConsumerState<ScanPage> {
  final storage = const FlutterSecureStorage();
  final MobileScannerController controller = MobileScannerController(
    facing: CameraFacing.back,
    detectionSpeed: DetectionSpeed.normal,
    detectionTimeoutMs: 500,
    formats: [BarcodeFormat.qrCode],
  );
  bool isProcessing = false;
  String? accessToken;

  @override
  void initState() {
    super.initState();
    _loadToken();
  }

  Future<void> _loadToken() async {
    accessToken = await storage.read(key: 'access_token');
  }

  Future<void> _handleScan(String? qrCode) async {
    if (isProcessing || qrCode == null) return;
    setState(() => isProcessing = true);

    try {
      debugPrint('📸 QR Detected: $qrCode');

      // Decode JSON from QR code
      final decoded = jsonDecode(qrCode);
      final participantId = decoded['id']?.toString();

      if (participantId == null) {
        _showMessage('Invalid QR code format', isError: true);
        return;
      }

      // Access the EventRepository from Riverpod
      final eventRepository = ref.read(eventRepo);

      // Call linkParticipantWithCompany
      await eventRepository.linkParticipantWithCompany(participantId);

      _showMessage('Candidate #$participantId successfully linked!', isError: false);
    } catch (e) {
      debugPrint('Scanner error: $e');
      _showMessage('Error: $e', isError: true);
    } finally {
      await Future.delayed(const Duration(seconds: 2));
      if (mounted) setState(() => isProcessing = false);
    }
  }

  void _showMessage(String message, {bool isError = false}) {
    if (!mounted) return;
    ScaffoldMessenger.of(context).showSnackBar(
      SnackBar(
        content: Text(
          message,
          style: GoogleFonts.plusJakartaSans(color: AppColors.white),
        ),
        backgroundColor: isError ? AppColors.error : AppColors.success,
        behavior: SnackBarBehavior.floating,
        margin: const EdgeInsets.all(16),
        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
      ),
    );
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: AppColors.bg,
      appBar: AppBar(
        title: Text(
          'Badge Scanner',
          style: GoogleFonts.cinzel(
            color: AppColors.textPrimary,
            fontSize: 18,
            fontWeight: FontWeight.bold,
            letterSpacing: 0.5,
          ),
        ),
        backgroundColor: AppColors.bg,
        elevation: 0,
        centerTitle: true,
        leading: IconButton(
          icon: const Icon(
            Icons.arrow_back_ios_new_rounded,
            size: 20,
            color: AppColors.textPrimary,
          ),
          onPressed: () => Navigator.maybePop(context),
        ),
      ),
      body: Stack(
        children: [
          Padding(
            padding: const EdgeInsets.all(20),
            child: ClipRRect(
              borderRadius: BorderRadius.circular(24),
              child: Container(
                decoration: BoxDecoration(
                  border: Border.all(color: AppColors.goldPrimary, width: 2),
                  borderRadius: BorderRadius.circular(24),
                ),
                child: MobileScanner(
                  controller: controller,
                  onDetect: (BarcodeCapture capture) {
                    for (final barcode in capture.barcodes) {
                      final value = barcode.rawValue;
                      if (value != null) {
                        _handleScan(value);
                        break;
                      }
                    }
                  },
                ),
              ),
            ),
          ),
          if (isProcessing)
            Container(
              color: AppColors.charcoalDark.withOpacity(0.65),
              child: Center(
                child: Container(
                  padding: const EdgeInsets.all(24),
                  decoration: BoxDecoration(
                    color: AppColors.surface,
                    borderRadius: BorderRadius.circular(18),
                    boxShadow: [
                      BoxShadow(
                        color: Colors.black.withOpacity(0.15),
                        blurRadius: 20,
                      ),
                    ],
                  ),
                  child: Column(
                    mainAxisSize: MainAxisSize.min,
                    children: [
                      const SizedBox(
                        width: 28,
                        height: 28,
                        child: CircularProgressIndicator(
                          strokeWidth: 2.5,
                          valueColor: AlwaysStoppedAnimation<Color>(AppColors.goldPrimary),
                        ),
                      ),
                      const SizedBox(height: 14),
                      Text(
                        'Linking Candidate...',
                        style: GoogleFonts.plusJakartaSans(
                          color: AppColors.textPrimary,
                          fontWeight: FontWeight.w600,
                          fontSize: 14,
                        ),
                      ),
                    ],
                  ),
                ),
              ),
            ),
        ],
      ),
    );
  }

  @override
  void dispose() {
    controller.dispose();
    super.dispose();
  }
}
