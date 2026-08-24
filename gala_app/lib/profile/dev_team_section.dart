import 'package:flutter/material.dart';
import 'package:url_launcher/url_launcher.dart';

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
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        ListTile(
          leading: const Icon(Icons.developer_mode, color: Color(0xFFD9B453)),
          title: const Text(
            'Development Team',
            style: TextStyle(
              fontWeight: FontWeight.w700,
              fontSize: 18,
              color: Color(0xFFE8E0C8),
            ),
          ),
          trailing: Icon(
            _expanded ? Icons.keyboard_arrow_up : Icons.keyboard_arrow_down,
            color: const Color(0xFFE8E0C8),
          ),
          onTap: () {
            setState(() {
              _expanded = !_expanded;
            });
          },
        ),
        AnimatedSize(
          duration: const Duration(milliseconds: 300),
          curve: Curves.easeInOut,
          child:
              _expanded
                  ? Padding(
                    padding: const EdgeInsets.symmetric(
                      horizontal: 16,
                      vertical: 8,
                    ),
                    child: Column(
                      children: const [
                        TeamMemberCard(
                          name: 'Abdallah Mohellebi',
                          role: 'Mobile Developer',
                          imageUrl:
                              'assets/logos/6f923dee-35d6-4136-b55f-5c9aab544529.jpeg',
                          email: 'abdallah.mohellebi@g.enp.edu.dz',
                          link: 'https://abdallah-mohellebi.netlify.app',
                        ),
                        SizedBox(height: 12),
                        TeamMemberCard(
                          name: 'Mohamed Amine Ouldkhaoua',
                          role: 'Backend Developer',
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
      onTap:
          link != null
              ? () => _launchLink(link!)
              : null, // Whole card clickable
      child: Card(
        color: const Color(0xFF0A2C24),
        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(14)),
        elevation: 4,
        child: Padding(
          padding: const EdgeInsets.all(12),
          child: Row(
            children: [
              CircleAvatar(
                radius: 28,
                backgroundImage:
                    hasImage
                        ? (isNetworkImage
                            ? NetworkImage(imageUrl)
                            : AssetImage(imageUrl) as ImageProvider)
                        : null,
                backgroundColor: const Color(0xFFD9B453).withOpacity(0.2),
                child:
                    !hasImage
                        ? const Icon(
                          Icons.person,
                          color: Color(0xFFD9B453),
                          size: 28,
                        )
                        : null,
              ),
              const SizedBox(width: 16),
              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(
                      name,
                      style: const TextStyle(
                        fontWeight: FontWeight.bold,
                        fontSize: 16,
                        color: Color(0xFFE8E0C8),
                      ),
                    ),
                    const SizedBox(height: 4),
                    Text(
                      role,
                      style: const TextStyle(
                        color: Color(0xFFD9B453),
                        fontSize: 13,
                      ),
                    ),
                    const SizedBox(height: 2),
                    Text(
                      email,
                      style: TextStyle(
                        color: const Color(0xFFE8E0C8).withOpacity(0.7),
                        fontSize: 12,
                      ),
                    ),
                  ],
                ),
              ),
              const Icon(Icons.link, color: Color(0xFFD9B453), size: 22),
            ],
          ),
        ),
      ),
    );
  }
}
