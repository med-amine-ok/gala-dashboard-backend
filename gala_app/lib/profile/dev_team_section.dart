import 'package:flutter/material.dart';
import 'package:google_fonts/google_fonts.dart';
import 'package:url_launcher/url_launcher.dart';
import '../app_colors.dart';

class DevTeamSection extends StatefulWidget {
  const DevTeamSection({super.key});

  @override
  State<DevTeamSection> createState() => _DevTeamSectionState();
}

class _DevTeamSectionState extends State<DevTeamSection>
    with SingleTickerProviderStateMixin {
  bool _expanded = false;

  @override
  Widget build(BuildContext context) {
    return Padding(
      padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 4),
      child: Container(
        decoration: BoxDecoration(
          color: AppColors.surface,
          borderRadius: BorderRadius.circular(16),
          border: Border.all(color: AppColors.border),
          boxShadow: [
            BoxShadow(
              color: AppColors.charcoal.withOpacity(0.02),
              blurRadius: 8,
              offset: const Offset(0, 2),
            ),
          ],
        ),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            InkWell(
              borderRadius: BorderRadius.circular(16),
              onTap: () {
                setState(() {
                  _expanded = !_expanded;
                });
              },
              child: Padding(
                padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 12),
                child: Row(
                  children: [
                    Container(
                      width: 42,
                      height: 42,
                      decoration: BoxDecoration(
                        color: AppColors.goldLight,
                        borderRadius: BorderRadius.circular(12),
                        border: Border.all(color: AppColors.goldPrimary.withOpacity(0.4)),
                      ),
                      child: const Icon(
                        Icons.code_rounded,
                        color: AppColors.goldDark,
                        size: 20,
                      ),
                    ),
                    const SizedBox(width: 14),
                    Expanded(
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          Text(
                            'Engineering & Core Team',
                            style: GoogleFonts.plusJakartaSans(
                              fontWeight: FontWeight.w700,
                              fontSize: 14.5,
                              color: AppColors.textPrimary,
                            ),
                          ),
                          const SizedBox(height: 2),
                          Text(
                            'Meet the Gala application architects',
                            style: GoogleFonts.plusJakartaSans(
                              fontSize: 11.5,
                              color: AppColors.textSecondary,
                            ),
                          ),
                        ],
                      ),
                    ),
                    Icon(
                      _expanded ? Icons.keyboard_arrow_up_rounded : Icons.keyboard_arrow_down_rounded,
                      color: AppColors.textSubtle,
                      size: 20,
                    ),
                  ],
                ),
              ),
            ),
            AnimatedSize(
              duration: const Duration(milliseconds: 300),
              curve: Curves.easeInOut,
              child:
                  _expanded
                      ? Padding(
                        padding: const EdgeInsets.fromLTRB(14, 0, 14, 14),
                        child: Column(
                          children: const [
                            Divider(color: AppColors.divider, height: 16),
                            SizedBox(height: 6),
                            TeamMemberCard(
                              name: 'Abdallah Mohellebi',
                              role: 'Mobile Lead & Flutter Architect',
                              imageUrl:
                                  'assets/logos/6f923dee-35d6-4136-b55f-5c9aab544529.jpeg',
                              email: 'abdallah.mohellebi@g.enp.edu.dz',
                              link: 'https://abdallah-mohellebi.netlify.app',
                            ),
                            SizedBox(height: 10),
                            TeamMemberCard(
                              name: 'Mohamed Amine Ouldkhaoua',
                              role: 'Backend & Cloud Systems Engineer',
                              imageUrl: 'assets/logos/IMG_1804_result.jpg',
                              email: 'mohamed_amine.oulkhaoua@g.enp.edu.dz',
                              link: 'https://med-amine-portfolio.vercel.app',
                            ),
                          ],
                        ),
                      )
                      : const SizedBox.shrink(),
            ),
          ],
        ),
      ),
    );
  }
}

class TeamMemberCard extends StatelessWidget {
  final String name;
  final String role;
  final String imageUrl;
  final String email;
  final String? link;

  const TeamMemberCard({
    super.key,
    required this.name,
    required this.role,
    required this.imageUrl,
    required this.email,
    this.link,
  });

  Future<void> _launchLink(String url) async {
    final Uri uri = Uri.parse(url);
    if (!await launchUrl(uri, mode: LaunchMode.externalApplication)) {
      throw Exception('Could not launch $url');
    }
  }

  @override
  Widget build(BuildContext context) {
    final bool isNetworkImage = imageUrl.startsWith('http');
    final bool hasImage = imageUrl.isNotEmpty;

    return InkWell(
      borderRadius: BorderRadius.circular(14),
      onTap: link != null ? () => _launchLink(link!) : null,
      child: Container(
        padding: const EdgeInsets.all(12),
        decoration: BoxDecoration(
          color: AppColors.surfaceMuted,
          borderRadius: BorderRadius.circular(14),
          border: Border.all(color: AppColors.border),
        ),
        child: Row(
          children: [
            CircleAvatar(
              radius: 24,
              backgroundImage:
                  hasImage
                      ? (isNetworkImage
                          ? NetworkImage(imageUrl)
                          : AssetImage(imageUrl) as ImageProvider)
                      : null,
              backgroundColor: AppColors.goldLight,
              child:
                  !hasImage
                      ? const Icon(
                        Icons.person,
                        color: AppColors.goldDark,
                        size: 24,
                      )
                      : null,
            ),
            const SizedBox(width: 14),
            Expanded(
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text(
                    name,
                    style: GoogleFonts.cinzel(
                      fontWeight: FontWeight.bold,
                      fontSize: 14.5,
                      color: AppColors.textPrimary,
                    ),
                  ),
                  const SizedBox(height: 2),
                  Text(
                    role,
                    style: GoogleFonts.plusJakartaSans(
                      color: AppColors.goldDark,
                      fontSize: 12,
                      fontWeight: FontWeight.w600,
                    ),
                  ),
                  const SizedBox(height: 2),
                  Text(
                    email,
                    style: GoogleFonts.plusJakartaSans(
                      color: AppColors.textSecondary,
                      fontSize: 11.5,
                    ),
                    overflow: TextOverflow.ellipsis,
                  ),
                ],
              ),
            ),
            if (link != null)
              Container(
                padding: const EdgeInsets.all(6),
                decoration: BoxDecoration(
                  color: AppColors.goldLight,
                  borderRadius: BorderRadius.circular(8),
                ),
                child: const Icon(
                  Icons.open_in_new_rounded,
                  color: AppColors.goldDark,
                  size: 16,
                ),
              ),
          ],
        ),
      ),
    );
  }
}

