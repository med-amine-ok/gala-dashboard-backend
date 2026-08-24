import 'dart:math';
import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:flutter_svg/svg.dart';
import 'package:go_router/go_router.dart';

import '../app_colors.dart';
import '../booths/booth_details.dart';
import '../booths/booths_list.dart';
import '../booths/models/booth.dart';
import 'guest_page.dart';

class GalaHomePage extends StatelessWidget {
  const GalaHomePage({super.key});

  @override
  Widget build(BuildContext context) {
    // Full guest list
    final allGuests = guests;
    // Random 6 guests for preview
    final random = Random();
    final previewGuests = List<Guest>.from(allGuests)..shuffle(random);
    final displayedGuests = previewGuests.take(6).toList();

    return Scaffold(
      backgroundColor: AppColors.bg,
      body: SafeArea(
        child: CustomScrollView(
          slivers: [
            // ---------- HEADER ----------
            SliverToBoxAdapter(
              child: Padding(
                padding: const EdgeInsets.symmetric(
                  horizontal: 16,
                  vertical: 8,
                ),
                child: Row(
                  mainAxisAlignment: MainAxisAlignment.center,
                  children: const [
                    Text(
                      "Engineers' Gala",
                      style: TextStyle(
                        color: Colors.white,
                        fontSize: 20,
                        fontWeight: FontWeight.bold,
                        letterSpacing: -0.3,
                      ),
                    ),
                  ],
                ),
              ),
            ),

            // ---------- CAPTURE BANNER ----------
            CaptureTheGalaBanner(),

            // ---------- BOOTHS & COMPANIES ----------
            SliverToBoxAdapter(
              child: const Padding(
                padding: EdgeInsets.symmetric(horizontal: 16, vertical: 8),
                child: Text(
                  "Booths & Companies",
                  style: TextStyle(
                    color: Colors.white,
                    fontSize: 22,
                    fontWeight: FontWeight.bold,
                  ),
                ),
              ),
            ),
            SliverToBoxAdapter(
              child: SizedBox(
                height: 180,
                child: Padding(
                  padding: const EdgeInsets.only(left: 12.0),
                  child: BoothsCarousel(),
                ),
              ),
            ),

            // ---------- GUESTS SECTION ----------
            SliverToBoxAdapter(
              child: Padding(
                padding: const EdgeInsets.symmetric(
                  horizontal: 16,
                  vertical: 8,
                ),
                child: Row(
                  mainAxisAlignment: MainAxisAlignment.spaceBetween,
                  children: [
                    const Text(
                      "Guests",
                      style: TextStyle(
                        color: Colors.white,
                        fontSize: 22,
                        fontWeight: FontWeight.bold,
                      ),
                    ),
                    TextButton(
                      onPressed: () {
                        context.push('/guests'); // Navigate to full guest page
                      },
                      child: const Text(
                        "See All",
                        style: TextStyle(
                          color: AppColors.textSecondary,
                          fontWeight: FontWeight.bold,
                        ),
                      ),
                    ),
                  ],
                ),
              ),
            ),
            SliverToBoxAdapter(
              child: SizedBox(
                height: 170, // consistent height for all cards
                child: ListView.separated(
                  scrollDirection: Axis.horizontal,
                  padding: const EdgeInsets.symmetric(horizontal: 16),
                  itemCount: displayedGuests.length,
                  separatorBuilder: (_, __) => const SizedBox(width: 12),
                  itemBuilder: (context, index) {
                    final guest = displayedGuests[index];
                    return Align(
                      alignment: Alignment.topCenter,
                      child: SizedBox(
                        width: 130, // fixed width to ensure alignment
                        child: _GuestCard(guest: guest),
                      ),
                    );
                  },
                ),
              ),
            ),
            const SliverToBoxAdapter(child: SizedBox(height: 16)),
          ],
        ),
      ),
    );
  }
}

class _GuestCard extends StatelessWidget {
  final Guest guest;
  const _GuestCard({required this.guest});

  @override
  Widget build(BuildContext context) {
    final initials =
        (guest.name ?? '')
            .trim()
            .split(RegExp(r'\s+')) // handles multiple spaces
            .where((e) => e.isNotEmpty)
            .map((e) => e[0])
            .take(2)
            .join()
            .toUpperCase();

    final displayInitials = initials.isEmpty ? '?' : initials;

    return Container(
      decoration: BoxDecoration(
        color: AppColors.surface,
        borderRadius: BorderRadius.circular(16),
        boxShadow: [
          BoxShadow(
            color: Colors.black.withOpacity(0.4),
            blurRadius: 6,
            offset: const Offset(0, 3),
          ),
        ],
      ),
      padding: const EdgeInsets.all(12),
      child: Column(
        mainAxisAlignment: MainAxisAlignment.center,
        children: [
          CircleAvatar(
            radius: 28,
            backgroundColor: AppColors.accent,
            child: Text(
              displayInitials,
              style: const TextStyle(
                color: AppColors.bg,
                fontSize: 16,
                fontWeight: FontWeight.bold,
              ),
            ),
          ),
          const SizedBox(height: 10),
          Text(
            guest.name,
            style: const TextStyle(
              color: AppColors.textPrimary,
              fontSize: 14,
              fontWeight: FontWeight.w500,
            ),
            textAlign: TextAlign.center,
            maxLines: 2, // ✅ limit to 2 lines
            overflow: TextOverflow.ellipsis, // ✅ show "..."
          ),
          const SizedBox(height: 6),
          Text(
            guest.major,
            style: const TextStyle(
              color: AppColors.textSecondary,
              fontSize: 12,
            ),
            textAlign: TextAlign.center,
            maxLines: 1, // optional: keep major on one line too
            overflow: TextOverflow.ellipsis,
          ),
        ],
      ),
    );
  }
}

class CaptureTheGalaBanner extends StatelessWidget {
  const CaptureTheGalaBanner({super.key});

  @override
  Widget build(BuildContext context) {
    // Placeholder — replace with actual banner later
    return SliverToBoxAdapter(
      child: GestureDetector(
        onTap: () {},
        child: Container(
          margin: const EdgeInsets.symmetric(horizontal: 16, vertical: 8),
          padding: const EdgeInsets.all(20),
          decoration: BoxDecoration(
            borderRadius: BorderRadius.circular(16),
            gradient: const LinearGradient(
              colors: [
                Color(0xFF021A14), // Deep emerald
                Color(0xFF0A3C30), // Slightly lighter emerald
              ],
              begin: Alignment.topLeft,
              end: Alignment.bottomRight,
            ),
            boxShadow: [
              BoxShadow(
                color: Colors.black.withOpacity(0.4),
                blurRadius: 10,
                offset: const Offset(0, 4),
              ),
            ],
          ),
          child: Stack(
            children: [
              // Optional: subtle gold sparkle accents
              Positioned(
                top: 10,
                right: 20,
                child: Container(
                  width: 60,
                  height: 60,
                  decoration: BoxDecoration(
                    shape: BoxShape.circle,
                    gradient: RadialGradient(
                      colors: [
                        Color(0xFFD9B453).withOpacity(0.4),
                        Colors.transparent,
                      ],
                    ),
                  ),
                ),
              ),
              Positioned(
                bottom: 30,
                left: 10,
                child: Container(
                  width: 40,
                  height: 40,
                  decoration: BoxDecoration(
                    shape: BoxShape.circle,
                    gradient: RadialGradient(
                      colors: [
                        Color(0xFFD9B453).withOpacity(0.3),
                        Colors.transparent,
                      ],
                    ),
                  ),
                ),
              ),
              // Content
              Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                mainAxisAlignment: MainAxisAlignment.end,
                children: [
                  const Text(
                    "Capture the Gala",
                    style: TextStyle(
                      color: Color(0xFFE8E0C8), // beige
                      fontSize: 26,
                      fontWeight: FontWeight.bold,
                      shadows: [
                        Shadow(
                          color: Colors.black45,
                          offset: Offset(1, 1),
                          blurRadius: 2,
                        ),
                      ],
                    ),
                  ),
                  const SizedBox(height: 6),
                  const Text(
                    "Capture your favorite moments at the Engineers Gala and share them with everyone!",
                    style: TextStyle(
                      color: Color(0xFFD9B453), // gold accent
                      fontSize: 14,
                      fontWeight: FontWeight.w500,
                    ),
                  ),
                  const SizedBox(height: 12),
                  Row(
                    children: [
                      ElevatedButton(
                        style: ElevatedButton.styleFrom(
                          backgroundColor: Color(0xFFD9B453), // luxury gold
                          shape: RoundedRectangleBorder(
                            borderRadius: BorderRadius.circular(8),
                          ),
                          padding: const EdgeInsets.symmetric(
                            horizontal: 20,
                            vertical: 10,
                          ),
                          textStyle: const TextStyle(
                            fontSize: 14,
                            fontWeight: FontWeight.bold,
                          ),
                        ),
                        onPressed: () {
                          context.push('/capture-the-gala');
                        },
                        child: const Text(
                          "Test Now",
                          style: TextStyle(
                            color: Color(0xFF021A14),
                          ), // dark contrast
                        ),
                      ),
                    ],
                  ),
                ],
              ),
            ],
          ),
        ),
      ),
    );
  }
}

class BoothsCarousel extends ConsumerWidget {
  const BoothsCarousel({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final booths = ref.watch(fetchBoothsProvider);
    return booths.when(
      loading:
          () => const Center(
            child: CircularProgressIndicator(
              valueColor: AlwaysStoppedAnimation<Color>(AppColors.white),
            ),
          ),
      error: (error, _) => Center(child: Text(error.toString())),
      data: (booths) {
        return ListView.builder(
          scrollDirection: Axis.horizontal,
          itemCount: 5,
          itemBuilder: (context, i) {
            final booth = booths[i + 6];
            return _boothCard(booth, context);
          },
        );
      },
    );
  }
}

Widget _boothCard(BoothModel booth, BuildContext context) {
  final String imageUrl = booth.bannerUrl.isNotEmpty ? booth.bannerUrl : '';
  final bool isSvg = imageUrl.toLowerCase().endsWith('.svg');

  return GestureDetector(
    onTap: () {
      Navigator.push(
        context,
        MaterialPageRoute(builder: (context) => BoothDetailsPage(booth: booth)),
      );
    },
    child: Container(
      width: 140,
      height: 140,
      margin: const EdgeInsets.only(right: 12),
      decoration: BoxDecoration(
        borderRadius: BorderRadius.circular(16),
        color: Colors.white, // background changed to white
      ),
      clipBehavior: Clip.antiAlias,
      child: Stack(
        children: [
          // Centered image / SVG / initials
          Center(
            child:
                imageUrl.isEmpty
                    ? Text(
                      booth.name
                          .trim()
                          .split(' ')
                          .map((e) => e[0])
                          .take(2)
                          .join()
                          .toUpperCase(),
                      style: const TextStyle(
                        color: Colors.black, // text black on white bg
                        fontSize: 32,
                        fontWeight: FontWeight.bold,
                      ),
                    )
                    : isSvg
                    ? SvgPicture.network(
                      imageUrl,
                      fit: BoxFit.contain,
                      width: 100,
                      height: 100,
                      placeholderBuilder:
                          (context) =>
                              const Center(child: CircularProgressIndicator()),
                    )
                    : Image.network(
                      imageUrl,
                      fit: BoxFit.contain,
                      width: 100,
                      height: 100,
                      errorBuilder:
                          (context, error, stackTrace) => Text(
                            booth.name
                                .trim()
                                .split(' ')
                                .map((e) => e[0])
                                .take(2)
                                .join()
                                .toUpperCase(),
                            style: const TextStyle(
                              color: Colors.black,
                              fontSize: 32,
                              fontWeight: FontWeight.bold,
                            ),
                          ),
                    ),
          ),

          // Gradient overlay at the bottom (optional)
          Positioned(
            left: 0,
            right: 0,
            bottom: 0,
            height: 40,
            child: Container(
              decoration: BoxDecoration(
                gradient: LinearGradient(
                  colors: [Colors.black.withOpacity(0.5), Colors.transparent],
                  begin: Alignment.bottomCenter,
                  end: Alignment.topCenter,
                ),
                borderRadius: const BorderRadius.vertical(
                  bottom: Radius.circular(16),
                ),
              ),
            ),
          ),

          // Booth name at the bottom
          Positioned(
            left: 8,
            right: 8,
            bottom: 8,
            child: Text(
              booth.name,
              style: const TextStyle(
                color: AppColors.surface,
                fontWeight: FontWeight.bold,
                fontSize: 13,
                overflow: TextOverflow.ellipsis,
              ),
              maxLines: 1,
            ),
          ),
        ],
      ),
    ),
  );
}
