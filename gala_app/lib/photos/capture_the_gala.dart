import 'dart:io';

import 'package:camera/camera.dart';
import 'package:file_picker/file_picker.dart';
import 'package:flutter/foundation.dart';
import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';
import 'package:image_picker/image_picker.dart';
import 'package:supabase_flutter/supabase_flutter.dart';

import '../app_colors.dart';

class CaptureTheGalaScreen extends StatefulWidget {
  const CaptureTheGalaScreen({super.key});

  @override
  State<CaptureTheGalaScreen> createState() => _CaptureTheGalaScreenState();

  static Widget _circleButton({
    required IconData icon,
    required double size,
    required VoidCallback? onTap,
  }) {
    return GestureDetector(
      onTap: onTap,
      child: Container(
        height: size,
        width: size,
        decoration: BoxDecoration(
          color: Colors.black.withOpacity(0.4),
          shape: BoxShape.circle,
        ),
        child: Icon(icon, color: Colors.white, size: size * 0.6),
      ),
    );
  }

  static Widget _textButton(String text, Color color, VoidCallback onTap) {
    return GestureDetector(
      onTap: onTap,
      child: Container(
        height: 40,
        padding: const EdgeInsets.symmetric(horizontal: 16),
        decoration: BoxDecoration(
          color: color,
          borderRadius: BorderRadius.circular(12),
        ),
        alignment: Alignment.center,
        child: Text(
          text,
          style: const TextStyle(
            color: AppColors.white,
            fontSize: 14,
            fontWeight: FontWeight.bold,
            letterSpacing: 0.2,
          ),
        ),
      ),
    );
  }
}

class _CaptureTheGalaScreenState extends State<CaptureTheGalaScreen>
    with WidgetsBindingObserver {
  SupabaseClient? supabase;

  CameraController? controller;
  CameraDescription? _selectedCamera;
  bool _isCameraInitialized = false;

  XFile? _currentImage; // For mobile/desktop
  Uint8List? _currentImageBytes; // For web
  List<CameraDescription> cameras = [];

  @override
  void initState() {
    super.initState();
    WidgetsBinding.instance.addObserver(this);
    _initSupabaseAndCamera();
  }

  Future<void> _initSupabaseAndCamera() async {
    // 1️⃣ Initialize Supabase directly here
    // await Supabase.initialize(
    //   url:
    //       'https://dbqptpcudrkznuejgluk.supabase.co', // 👈 Replace with your project URL
    //   anonKey:
    //       'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImRicXB0cGN1ZHJrem51ZWpnbHVrIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTY4NDQ5NDUsImV4cCI6MjA3MjQyMDk0NX0.WPHG_GaFjk7ID1AzxX3i1hRDa-ouifOnABlpeV-1uQE', // 👈 Replace with your anon key (not service key)
    // );
    supabase = SupabaseClient(
      'https://dbqptpcudrkznuejgluk.supabase.co',
      'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImRicXB0cGN1ZHJrem51ZWpnbHVrIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTY4NDQ5NDUsImV4cCI6MjA3MjQyMDk0NX0.WPHG_GaFjk7ID1AzxX3i1hRDa-ouifOnABlpeV-1uQE',
    );

    // 2️⃣ Initialize Camera
    try {
      cameras = await availableCameras();
      if (cameras.isNotEmpty) {
        await onNewCameraSelected(_selectedCamera ?? cameras.first);
      }
    } catch (e) {
      debugPrint('Error initializing camera list: $e');
    }

    if (mounted) setState(() {});
  }

  @override
  void dispose() {
    WidgetsBinding.instance.removeObserver(this);
    controller?.dispose();
    super.dispose();
  }

  @override
  void didChangeAppLifecycleState(AppLifecycleState state) {
    final cameraController = controller;
    if (cameraController == null || !cameraController.value.isInitialized) {
      return;
    }

    if (state == AppLifecycleState.inactive) {
      cameraController.dispose();
    } else if (state == AppLifecycleState.resumed) {
      onNewCameraSelected(cameraController.description);
    }
  }

  Future<void> pickImage() async {
    if (supabase == null) return;

    if (kIsWeb) {
      final result = await FilePicker.platform.pickFiles(type: FileType.image);
      if (result != null && result.files.single.bytes != null) {
        final bytes = result.files.single.bytes!;
        final fileName = result.files.single.name;

        setState(() {
          _currentImageBytes = bytes;
          _currentImage = null;
        });
      }
    } else {
      final picker = ImagePicker();
      final XFile? image = await picker.pickImage(source: ImageSource.gallery);

      if (image != null) {
        setState(() {
          _currentImage = image;
          _currentImageBytes = null;
        });

        await supabase!.storage
            .from('capture_the_gala')
            .upload(
              '${DateTime.now().millisecondsSinceEpoch}.jpg',
              File(image.path),
            );
      }
    }
  }

  Future<void> _takePhoto() async {
    if (controller == null ||
        !controller!.value.isInitialized ||
        supabase == null)
      return;

    try {
      final XFile file = await controller!.takePicture();

      if (kIsWeb) {
        final bytes = await file.readAsBytes();
        setState(() {
          _currentImageBytes = bytes;
          _currentImage = null;
        });

        await supabase!.storage
            .from('photos')
            .uploadBinary(
              '${DateTime.now().millisecondsSinceEpoch}.jpg',
              bytes,
              fileOptions: const FileOptions(contentType: 'image/jpeg'),
            );
      } else {
        setState(() {
          _currentImage = file;
          _currentImageBytes = null;
        });

        await supabase!.storage
            .from('photos')
            .upload(
              '${DateTime.now().millisecondsSinceEpoch}.jpg',
              File(file.path),
            );
      }
    } catch (e) {
      debugPrint('Error taking photo: $e');
    }
  }

  Future<void> onNewCameraSelected(CameraDescription cameraDescription) async {
    final previousCameraController = controller;

    final CameraController cameraController = CameraController(
      cameraDescription,
      ResolutionPreset.veryHigh,
    );

    await previousCameraController?.dispose();

    if (mounted) {
      setState(() {
        controller = cameraController;
      });
    }

    cameraController.addListener(() {
      if (mounted) setState(() {});
    });

    try {
      await cameraController.initialize();
    } on CameraException catch (e) {
      debugPrint('Error initializing camera: $e');
    }

    if (mounted) {
      setState(() {
        _isCameraInitialized = cameraController.value.isInitialized;
      });
    }
  }

  void _resetCamera() async {
    setState(() {
      _currentImage = null;
      _currentImageBytes = null;
    });

    if (cameras.isNotEmpty) {
      final cameraToUse = _selectedCamera ?? cameras.first;
      await onNewCameraSelected(cameraToUse);
    }
  }

  @override
  Widget build(BuildContext context) {
    final isReady =
        _isCameraInitialized && supabase != null && controller != null;

    return Scaffold(
      backgroundColor: AppColors.bg,
      body: SafeArea(
        child:
            isReady
                ? Column(
                  mainAxisAlignment: MainAxisAlignment.spaceBetween,
                  children: [
                    // Top Bar
                    Container(
                      color: AppColors.bg,
                      padding: const EdgeInsets.symmetric(
                        horizontal: 16,
                        vertical: 8,
                      ),
                      child: Row(
                        mainAxisAlignment: MainAxisAlignment.spaceBetween,
                        children: [
                          IconButton(
                            onPressed: () => context.pop(),
                            icon: const Icon(
                              Icons.close,
                              color: Colors.white,
                              size: 28,
                            ),
                          ),
                          const Expanded(
                            child: Center(
                              child: Padding(
                                padding: EdgeInsets.only(right: 32),
                                child: Text(
                                  "Capture the Gala",
                                  style: TextStyle(
                                    color: AppColors.white,
                                    fontSize: 18,
                                    fontWeight: FontWeight.bold,
                                    letterSpacing: -0.3,
                                  ),
                                ),
                              ),
                            ),
                          ),
                        ],
                      ),
                    ),

                    // Camera / Captured Image Preview
                    Expanded(
                      child:
                          _currentImageBytes != null || _currentImage != null
                              ? (kIsWeb
                                  ? Image.memory(
                                    _currentImageBytes!,
                                    fit: BoxFit.cover,
                                  )
                                  : Image.file(
                                    File(_currentImage!.path),
                                    fit: BoxFit.cover,
                                  ))
                              : CameraPreview(controller!),
                    ),

                    // Bottom Controls
                    Padding(
                      padding: const EdgeInsets.symmetric(vertical: 20),
                      child: Row(
                        mainAxisAlignment: MainAxisAlignment.center,
                        children: [
                          CaptureTheGalaScreen._circleButton(
                            icon: Icons.image,
                            size: 40,
                            onTap: pickImage,
                          ),
                          const SizedBox(width: 20),
                          CaptureTheGalaScreen._circleButton(
                            icon: Icons.camera_alt,
                            size: 64,
                            onTap: _takePhoto,
                          ),
                          const SizedBox(width: 20),
                          if (cameras.length > 1)
                            CaptureTheGalaScreen._circleButton(
                              icon: Icons.all_inclusive,
                              size: 40,
                              onTap: () {
                                _selectedCamera =
                                    _selectedCamera == cameras.last
                                        ? cameras.first
                                        : cameras.last;
                                onNewCameraSelected(_selectedCamera!);
                              },
                            ),
                          const SizedBox(width: 20),

                          if (_currentImage != null ||
                              _currentImageBytes != null)
                            CaptureTheGalaScreen._circleButton(
                              icon: Icons.refresh,
                              size: 40,
                              onTap: _resetCamera,
                            ),
                        ],
                      ),
                    ),

                    // Action Buttons
                    Container(
                      padding: const EdgeInsets.symmetric(
                        horizontal: 16,
                        vertical: 12,
                      ),
                      child: Row(
                        mainAxisAlignment: MainAxisAlignment.start,
                        children: [
                          CaptureTheGalaScreen._textButton(
                            "Publish",
                            AppColors.textSecondary,
                            () async {
                              try {
                                if (supabase == null) {
                                  throw Exception('Supabase not initialized');
                                }

                                final fileName =
                                    '${DateTime.now().millisecondsSinceEpoch}.jpg';

                                if (kIsWeb) {
                                  if (_currentImageBytes == null) {
                                    throw Exception('No image selected');
                                  }

                                  await supabase!.storage
                                      .from('capture_the_gala')
                                      .uploadBinary(
                                        fileName,
                                        _currentImageBytes!,
                                        fileOptions: const FileOptions(
                                          contentType: 'image/jpeg',
                                        ),
                                      );
                                } else {
                                  if (_currentImage == null) {
                                    throw Exception('No image selected');
                                  }

                                  await supabase!.storage
                                      .from('capture_the_gala')
                                      .upload(
                                        fileName,
                                        File(_currentImage!.path),
                                        fileOptions: const FileOptions(
                                          contentType: 'image/jpeg',
                                        ),
                                      );
                                }

                                ScaffoldMessenger.of(context).showSnackBar(
                                  const SnackBar(
                                    backgroundColor: AppColors.surface,
                                    content: Text(
                                      'Photo uploaded successfully!',
                                      style: TextStyle(color: Colors.white),
                                    ),
                                  ),
                                );
                              } on StorageException catch (e) {
                                debugPrint('Storage error: $e');
                                ScaffoldMessenger.of(context).showSnackBar(
                                  SnackBar(
                                    backgroundColor: AppColors.surface,

                                    content: Text(
                                      'Upload failed: ${e.message}',
                                      style: TextStyle(color: Colors.white),
                                    ),
                                  ),
                                );
                              } catch (e, stack) {
                                debugPrint('Unexpected error: $e\n$stack');
                                ScaffoldMessenger.of(context).showSnackBar(
                                  const SnackBar(
                                    content: Text(
                                      'Something went wrong during upload.',
                                    ),
                                  ),
                                );
                              }
                            },
                          ),
                        ],
                      ),
                    ),
                  ],
                )
                : const Center(
                  child: CircularProgressIndicator(
                    valueColor: AlwaysStoppedAnimation<Color>(AppColors.white),
                  ),
                ),
      ),
    );
  }
}
