import 'dart:convert';
import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:flutter_secure_storage/flutter_secure_storage.dart';
import 'package:mobile_scanner/mobile_scanner.dart';
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
    formats: [BarcodeFormat.qrCode], // Only scan QR codes
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
        _showMessage('❌ QR code format invalide');
        return;
      }

      // Access the EventRepository from Riverpod
      final eventRepository = ref.read(eventRepo);

      // Call linkParticipantWithCompany
      await eventRepository.linkParticipantWithCompany(participantId);

      _showMessage('Participant #$participantId linked with success !');
    } catch (e) {
      debugPrint('Scanner error: $e');
      _showMessage(' Erreur: $e');
    } finally {
      // Wait a bit before allowing another scan
      await Future.delayed(const Duration(seconds: 2));
      setState(() => isProcessing = false);
    }
  }

  void _showMessage(String message) {
    if (!mounted) return;
    ScaffoldMessenger.of(context).showSnackBar(
      SnackBar(content: Text(message), behavior: SnackBarBehavior.floating),
    );
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(title: const Text('Scanner un participant')),
      body: Stack(
        children: [
          Padding(
            padding: const EdgeInsets.all(16),
            child: ClipRRect(
              borderRadius: BorderRadius.circular(16),
              child: Container(
                decoration: BoxDecoration(
                  border: Border.all(color: Colors.grey[300]!, width: 2),
                  borderRadius: BorderRadius.circular(16),
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
              color: Colors.black.withOpacity(0.5),
              child: const Center(
                child: CircularProgressIndicator(color: Colors.white),
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
