import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:flutter_svg/flutter_svg.dart';
import 'package:google_fonts/google_fonts.dart';
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
      backgroundColor: AppColors.bg,
      appBar: AppBar(
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
        title: Text(
          'Booth Details',
          style: GoogleFonts.cinzel(
            color: AppColors.textPrimary,
            fontSize: 18,
            fontWeight: FontWeight.bold,
            letterSpacing: 0.5,
          ),
        ),
        centerTitle: true,
      ),
      body: SafeArea(
        child: SingleChildScrollView(
          physics: const BouncingScrollPhysics(),
          padding: const EdgeInsets.only(bottom: 30),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              BannerHero(imageUrl: booth.bannerUrl, name: booth.name),
              BoothTitle(name: booth.name),
              BoothDescription(text: booth.description),
              if (booth.website.isNotEmpty || booth.email.isNotEmpty) ...[
                const SectionTitle(title: 'Contact & Links'),
                if (booth.website.isNotEmpty)
                  ContactRow(label: 'Website', value: booth.website),
                if (booth.email.isNotEmpty)
                  ContactRow(label: 'Email', value: booth.email),
              ],
              if (booth.hiringRoles.isNotEmpty) ...[
                const SectionTitle(title: 'Open Opportunities'),
                for (final role in booth.hiringRoles) HiringItem(role: role),
              ],
              const SizedBox(height: 16),
            ],
          ),
        ),
      ),
    );
  }
}

class BannerHero extends StatelessWidget {
  final String imageUrl;
  final String name;
  const BannerHero({super.key, required this.imageUrl, required this.name});

  @override
  Widget build(BuildContext context) {
    final bool isSvg = imageUrl.toLowerCase().endsWith('.svg');

    return Container(
      height: 200,
      margin: const EdgeInsets.symmetric(horizontal: 16, vertical: 10),
      clipBehavior: Clip.antiAlias,
      decoration: BoxDecoration(
        borderRadius: BorderRadius.circular(20),
        color: AppColors.surface,
        border: Border.all(color: AppColors.border, width: 1),
        boxShadow: [
          BoxShadow(
            color: AppColors.charcoal.withOpacity(0.04),
            blurRadius: 16,
            offset: const Offset(0, 4),
          ),
        ],
      ),
      child: Center(
        child:
            imageUrl.isEmpty
                ? Text(
                  name
                      .trim()
                      .split(' ')
                      .map((e) => e.isNotEmpty ? e[0] : '')
                      .take(2)
                      .join()
                      .toUpperCase(),
                  style: GoogleFonts.cinzel(
                    color: AppColors.goldDark,
                    fontSize: 44,
                    fontWeight: FontWeight.bold,
                  ),
                )
                : isSvg
                ? SizedBox(
                  height: 140,
                  width: 140,
                  child: SvgPicture.network(
                    imageUrl,
                    fit: BoxFit.contain,
                    placeholderBuilder:
                        (context) => const Center(
                          child: SizedBox(
                            width: 24,
                            height: 24,
                            child: CircularProgressIndicator(strokeWidth: 2),
                          ),
                        ),
                  ),
                )
                : SizedBox(
                  height: 140,
                  width: 140,
                  child: Image.network(
                    imageUrl,
                    fit: BoxFit.contain,
                    errorBuilder:
                        (context, error, stackTrace) => Text(
                          name
                              .trim()
                              .split(' ')
                              .map((e) => e.isNotEmpty ? e[0] : '')
                              .take(2)
                              .join()
                              .toUpperCase(),
                          style: GoogleFonts.cinzel(
                            color: AppColors.goldDark,
                            fontSize: 44,
                            fontWeight: FontWeight.bold,
                          ),
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
      padding: const EdgeInsets.fromLTRB(18, 12, 18, 4),
      child: Text(
        name,
        style: GoogleFonts.cinzel(
          color: AppColors.textPrimary,
          fontSize: 24,
          fontWeight: FontWeight.bold,
          letterSpacing: -0.2,
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
      padding: const EdgeInsets.fromLTRB(18, 4, 18, 8),
      child: Text(
        text.isNotEmpty ? text : 'Leading industry partner participating at the Engineers’ Gala.',
        style: GoogleFonts.plusJakartaSans(
          color: AppColors.textSecondary,
          fontSize: 14.5,
          height: 1.55,
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
      padding: const EdgeInsets.fromLTRB(18, 18, 18, 8),
      child: Text(
        title,
        style: GoogleFonts.cinzel(
          color: AppColors.textPrimary,
          fontSize: 16.5,
          fontWeight: FontWeight.bold,
          letterSpacing: 0.3,
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
      if (context.mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(
            backgroundColor: AppColors.charcoalDark,
            content: Text(
              'Copied $label to clipboard',
              style: GoogleFonts.plusJakartaSans(color: AppColors.white),
            ),
            behavior: SnackBarBehavior.floating,
            margin: const EdgeInsets.all(16),
            shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
            duration: const Duration(seconds: 2),
          ),
        );
      }
    }
  }

  @override
  Widget build(BuildContext context) {
    return Container(
      margin: const EdgeInsets.symmetric(horizontal: 16, vertical: 4),
      decoration: BoxDecoration(
        color: AppColors.surface,
        borderRadius: BorderRadius.circular(14),
        border: Border.all(color: AppColors.border),
      ),
      padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 12),
      child: Row(
        children: [
          Text(
            label,
            style: GoogleFonts.plusJakartaSans(
              color: AppColors.goldDark,
              fontSize: 13,
              fontWeight: FontWeight.w700,
            ),
          ),
          const SizedBox(width: 14),
          Expanded(
            child: Text(
              value,
              style: GoogleFonts.plusJakartaSans(
                color: AppColors.textPrimary,
                fontSize: 13.5,
                fontWeight: FontWeight.w500,
              ),
              overflow: TextOverflow.ellipsis,
            ),
          ),
          const SizedBox(width: 8),
          InkWell(
            onTap: () => _handleTap(context),
            borderRadius: BorderRadius.circular(8),
            child: Padding(
              padding: const EdgeInsets.all(4.0),
              child: Icon(
                isUrl ? LucideIcons.externalLink : LucideIcons.copy,
                size: 17,
                color: AppColors.goldDark,
              ),
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
      padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 4),
      child: Container(
        padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 12),
        decoration: BoxDecoration(
          color: AppColors.surface,
          borderRadius: BorderRadius.circular(14),
          border: Border.all(color: AppColors.lavenderBorder),
        ),
        child: Row(
          children: [
            Container(
              padding: const EdgeInsets.all(6),
              decoration: BoxDecoration(
                color: AppColors.lavenderLight,
                borderRadius: BorderRadius.circular(8),
              ),
              child: const Icon(
                Icons.work_outline_rounded,
                color: AppColors.lavenderDark,
                size: 16,
              ),
            ),
            const SizedBox(width: 12),
            Expanded(
              child: Text(
                role,
                style: GoogleFonts.plusJakartaSans(
                  color: AppColors.textPrimary,
                  fontSize: 13.5,
                  fontWeight: FontWeight.w600,
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

