import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:flutter_svg/flutter_svg.dart';
import 'package:lucide_icons/lucide_icons.dart';
import 'package:url_launcher/url_launcher.dart';

import '../app_colors.dart';
import 'models/booth.dart';

// ===== Page =====
class BoothDetailsPage extends StatelessWidget {
  final BoothModel booth;
  const BoothDetailsPage({super.key, required this.booth});

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      body: SafeArea(
        child: Column(
          children: [
            const HeaderBar(title: 'Booth Details'),
            Expanded(
              child: SingleChildScrollView(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    BannerHero(imageUrl: booth.bannerUrl),
                    BoothTitle(name: booth.name),
                    BoothDescription(text: booth.description),
                    const SectionTitle(title: 'Contact'),
                    // ContactRow(label: 'Email', value: booth.email),
                    ContactRow(label: 'Website', value: booth.website),
                    const SectionTitle(title: 'Hiring For'),
                    for (final role in booth.hiringRoles)
                      HiringItem(role: role),
                    const SizedBox(height: 12),
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

// ===== Widgets (split small, stateless) =====
class HeaderBar extends StatelessWidget {
  final String title;
  const HeaderBar({super.key, required this.title});

  @override
  Widget build(BuildContext context) {
    return Container(
      color: AppColors.bg,
      padding: const EdgeInsets.fromLTRB(12, 8, 12, 6),
      child: Row(
        children: [
          const _BackIcon(),
          Expanded(
            child: Text(
              title,
              textAlign: TextAlign.center,
              style: const TextStyle(
                color: AppColors.white,
                fontSize: 18,
                fontWeight: FontWeight.bold,
              ),
            ),
          ),
          const SizedBox(width: 24), // symmetry spacer
        ],
      ),
    );
  }
}

class _BackIcon extends StatelessWidget {
  const _BackIcon();
  @override
  Widget build(BuildContext context) {
    return IconButton(
      onPressed: () => Navigator.maybePop(context),
      icon: const Icon(Icons.arrow_back, color: AppColors.white),
    );
  }
}

class BannerHero extends StatelessWidget {
  final String imageUrl;
  const BannerHero({super.key, required this.imageUrl});

  @override
  Widget build(BuildContext context) {
    final bool isSvg = imageUrl.toLowerCase().endsWith('.svg');

    return Container(
      height: 218,
      margin: const EdgeInsets.symmetric(horizontal: 16, vertical: 8),
      clipBehavior: Clip.antiAlias,
      decoration: BoxDecoration(
        borderRadius: BorderRadius.circular(12),
        color: Colors.grey[100], // subtle background for SVG transparency
      ),
      child: Center(
        child:
            isSvg
                ? SizedBox(
                  height: 200,
                  width: 200,
                  child: SvgPicture.network(
                    imageUrl,
                    fit:
                        BoxFit.contain, // centers and scales SVG proportionally
                    placeholderBuilder:
                        (context) =>
                            const Center(child: CircularProgressIndicator()),
                  ),
                )
                : SizedBox(
                  height: 200,
                  width: 200,
                  child: Image.network(
                    imageUrl,
                    fit: BoxFit.contain, // keep raster images as full cover
                    width: double.infinity,
                    height: double.infinity,
                    errorBuilder:
                        (context, error, stackTrace) => const Center(
                          child: Icon(Icons.broken_image, size: 48),
                        ),
                  ),
                ),
      ),
    );
  }
}

class BoothTitle extends StatelessWidget {
  final String name;
  const BoothTitle({super.key, required this.name});

  @override
  Widget build(BuildContext context) {
    return Padding(
      padding: const EdgeInsets.fromLTRB(16, 12, 16, 4),
      child: Text(
        name,
        style: const TextStyle(
          color: AppColors.white,
          fontSize: 22,
          fontWeight: FontWeight.bold,
        ),
      ),
    );
  }
}

class BoothDescription extends StatelessWidget {
  final String text;
  const BoothDescription({super.key, required this.text});

  @override
  Widget build(BuildContext context) {
    return Padding(
      padding: const EdgeInsets.fromLTRB(16, 4, 16, 8),
      child: Text(
        text,
        style: const TextStyle(
          color: AppColors.white,
          fontSize: 16,
          height: 1.4,
        ),
      ),
    );
  }
}

class SectionTitle extends StatelessWidget {
  final String title;
  const SectionTitle({super.key, required this.title});

  @override
  Widget build(BuildContext context) {
    return Padding(
      padding: const EdgeInsets.fromLTRB(16, 16, 16, 8),
      child: Text(
        title,
        style: const TextStyle(
          color: AppColors.white,
          fontSize: 16,
          fontWeight: FontWeight.bold,
        ),
      ),
    );
  }
}

class ContactRow extends StatelessWidget {
  final String label;
  final String value;
  const ContactRow({super.key, required this.label, required this.value});

  bool get isUrl => value.startsWith('http') || value.startsWith('www');
  bool get isEmail => value.contains('@');

  Future<void> _handleTap(BuildContext context) async {
    if (isUrl) {
      final Uri uri = Uri.parse(
        value.startsWith('http') ? value : 'https://$value',
      );
      if (await canLaunchUrl(uri)) {
        await launchUrl(uri, mode: LaunchMode.externalApplication);
      }
    } else {
      await Clipboard.setData(ClipboardData(text: value));
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(
          backgroundColor: AppColors.bg,
          content: const Text(
            'Copied to clipboard',
            style: TextStyle(color: Colors.white),
          ),
          behavior: SnackBarBehavior.floating,
          margin: const EdgeInsets.all(16),
          shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(8)),
          duration: const Duration(seconds: 2),
        ),
      );
    }
  }

  @override
  Widget build(BuildContext context) {
    return Container(
      decoration: const BoxDecoration(
        border: Border(top: BorderSide(color: AppColors.divider, width: 1)),
      ),
      padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 14),
      child: Row(
        children: [
          Text(
            label,
            style: const TextStyle(
              color: AppColors.textSecondary,
              fontSize: 13,
            ),
          ),
          const SizedBox(width: 18),
          Expanded(
            child: Text(
              value,
              style: const TextStyle(color: AppColors.white, fontSize: 14),
              overflow: TextOverflow.ellipsis,
            ),
          ),
          const SizedBox(width: 8),
          GestureDetector(
            onTap: () => _handleTap(context),
            child: Icon(
              isUrl ? LucideIcons.externalLink : LucideIcons.copy,
              size: 18,
              color: Colors.grey.shade400,
            ),
          ),
        ],
      ),
    );
  }
}

class HiringItem extends StatelessWidget {
  final String role;
  const HiringItem({super.key, required this.role});

  @override
  Widget build(BuildContext context) {
    return Padding(
      padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 6),
      child: Container(
        padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 14),
        decoration: BoxDecoration(
          color: AppColors.surface.withOpacity(0.8),
          borderRadius: BorderRadius.circular(10),
          border: Border.all(color: AppColors.border.withOpacity(0.3)),
        ),
        child: Row(
          children: [
            const Icon(
              Icons.work_outline,
              color: AppColors.textSecondary,
              size: 18,
            ),
            const SizedBox(width: 10),
            Expanded(
              child: Text(
                role,
                style: const TextStyle(
                  color: AppColors.white,
                  fontSize: 15,
                  fontWeight: FontWeight.w500,
                ),
                overflow: TextOverflow.ellipsis,
              ),
            ),
          ],
        ),
      ),
    );
  }
}
