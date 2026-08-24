import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:flutter_svg/svg.dart';
import 'package:google_fonts/google_fonts.dart';
import '../agenda/agenda_provider.dart';
import '../app_colors.dart';
import 'booth_details.dart';
import 'models/booth.dart';

FutureProvider<List<BoothModel>> fetchBoothsProvider =
    FutureProvider<List<BoothModel>>((ref) async {
      final eventRepo = ref.read(eventRepoProvider);
      List<BoothModel> booths = await eventRepo.getBooths();
      return booths;
    });

class BoothsScreen extends StatelessWidget {
  const BoothsScreen({super.key});

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: AppColors.bg,
      appBar: AppBar(
        backgroundColor: AppColors.bg,
        elevation: 0,
        title: Text(
          'Booths & Partners',
          style: GoogleFonts.cinzel(
            color: AppColors.textPrimary,
            fontSize: 18,
            fontWeight: FontWeight.bold,
            letterSpacing: 0.5,
          ),
        ),
        centerTitle: true,
      ),
      body: const Column(
        children: [
          SearchBarWidget(),
          Expanded(child: BoothsGrid()),
        ],
      ),
    );
  }
}

class SearchBarWidget extends StatefulWidget {
  const SearchBarWidget({super.key});

  @override
  State<SearchBarWidget> createState() => _SearchBarWidgetState();
}

class _SearchBarWidgetState extends State<SearchBarWidget> {
  final TextEditingController _searchController = TextEditingController();

  @override
  void dispose() {
    _searchController.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 16.0),
      margin: const EdgeInsets.only(top: 4.0, bottom: 12.0),
      child: Container(
        height: 48,
        decoration: BoxDecoration(
          color: AppColors.surface,
          borderRadius: BorderRadius.circular(14.0),
          border: Border.all(color: AppColors.border),
          boxShadow: [
            BoxShadow(
              color: AppColors.charcoal.withOpacity(0.025),
              blurRadius: 10,
              offset: const Offset(0, 2),
            ),
          ],
        ),
        child: Row(
          children: [
            const Padding(
              padding: EdgeInsets.only(left: 14.0, right: 8.0),
              child: Icon(
                Icons.search_rounded,
                color: AppColors.goldDark,
                size: 22,
              ),
            ),
            Expanded(
              child: TextField(
                controller: _searchController,
                style: GoogleFonts.plusJakartaSans(
                  color: AppColors.textPrimary,
                  fontSize: 14,
                ),
                decoration: InputDecoration(
                  hintText: 'Search companies & partners...',
                  hintStyle: GoogleFonts.plusJakartaSans(
                    color: AppColors.textSubtle,
                    fontSize: 13.5,
                  ),
                  border: InputBorder.none,
                  contentPadding: const EdgeInsets.symmetric(
                    horizontal: 8.0,
                    vertical: 12.0,
                  ),
                ),
              ),
            ),
          ],
        ),
      ),
    );
  }
}

class BoothsGrid extends ConsumerWidget {
  const BoothsGrid({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final boothsAsyncValue = ref.watch(fetchBoothsProvider);

    return boothsAsyncValue.when(
      error:
          (err, stack) => Center(
            child: Text(
              'Unable to load partner booths',
              style: GoogleFonts.plusJakartaSans(
                color: AppColors.textSecondary,
                fontSize: 14,
              ),
            ),
          ),
      loading: () => const LoadingWidget(),
      data:
          (booths) => Padding(
            padding: const EdgeInsets.symmetric(horizontal: 16.0),
            child:
                booths.isEmpty
                    ? const EmptyStateWidget()
                    : GridView.builder(
                      physics: const BouncingScrollPhysics(),
                      padding: const EdgeInsets.only(bottom: 24),
                      gridDelegate:
                          const SliverGridDelegateWithFixedCrossAxisCount(
                            crossAxisCount: 2,
                            crossAxisSpacing: 12.0,
                            mainAxisSpacing: 12.0,
                            childAspectRatio: 0.88,
                          ),
                      itemCount: booths.length,
                      itemBuilder: (context, index) {
                        return BoothCard(booth: booths[index]);
                      },
                    ),
          ),
    );
  }
}

class BoothCard extends StatelessWidget {
  final BoothModel booth;

  const BoothCard({super.key, required this.booth});

  @override
  Widget build(BuildContext context) {
    final bool isSvg = booth.bannerUrl.toLowerCase().endsWith('.svg');

    return GestureDetector(
      onTap: () => _showBoothDetails(context, booth),
      child: Container(
        decoration: BoxDecoration(
          color: AppColors.surface,
          borderRadius: BorderRadius.circular(18.0),
          border: Border.all(color: AppColors.border),
          boxShadow: [
            BoxShadow(
              color: AppColors.charcoal.withOpacity(0.035),
              blurRadius: 12,
              offset: const Offset(0, 4),
            ),
          ],
        ),
        clipBehavior: Clip.antiAlias,
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.stretch,
          children: [
            // Logo Image Area
            Expanded(
              child: Container(
                color: AppColors.surfaceMuted,
                padding: const EdgeInsets.all(16),
                child: Center(
                  child:
                      booth.bannerUrl.isEmpty
                          ? Text(
                            booth.name
                                .trim()
                                .split(' ')
                                .map((e) => e.isNotEmpty ? e[0] : '')
                                .take(2)
                                .join()
                                .toUpperCase(),
                            style: GoogleFonts.cinzel(
                              color: AppColors.goldDark,
                              fontSize: 24,
                              fontWeight: FontWeight.bold,
                            ),
                          )
                          : isSvg
                          ? SvgPicture.network(
                            booth.bannerUrl,
                            fit: BoxFit.contain,
                            placeholderBuilder:
                                (context) => const Center(
                                  child: SizedBox(
                                    width: 18,
                                    height: 18,
                                    child: CircularProgressIndicator(strokeWidth: 2),
                                  ),
                                ),
                          )
                          : Image.network(
                            booth.bannerUrl,
                            fit: BoxFit.contain,
                            errorBuilder:
                                (context, error, stackTrace) => Text(
                                  booth.name
                                      .trim()
                                      .split(' ')
                                      .map((e) => e.isNotEmpty ? e[0] : '')
                                      .take(2)
                                      .join()
                                      .toUpperCase(),
                                  style: GoogleFonts.cinzel(
                                    color: AppColors.goldDark,
                                    fontSize: 24,
                                    fontWeight: FontWeight.bold,
                                  ),
                                ),
                          ),
                ),
              ),
            ),

            // Card Bottom Details
            Padding(
              padding: const EdgeInsets.all(10.0),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text(
                    booth.name,
                    style: GoogleFonts.plusJakartaSans(
                      color: AppColors.textPrimary,
                      fontSize: 13,
                      fontWeight: FontWeight.w700,
                    ),
                    maxLines: 1,
                    overflow: TextOverflow.ellipsis,
                  ),
                  const SizedBox(height: 2),
                  Text(
                    booth.hiringRoles.isNotEmpty ? '${booth.hiringRoles.length} Hiring Roles' : 'Partner Booth',
                    style: GoogleFonts.plusJakartaSans(
                      color: AppColors.goldDark,
                      fontSize: 11,
                      fontWeight: FontWeight.w500,
                    ),
                    maxLines: 1,
                    overflow: TextOverflow.ellipsis,
                  ),
                ],
              ),
            ),
          ],
        ),
      ),
    );
  }
}

void _showBoothDetails(BuildContext context, BoothModel booth) {
  Navigator.push(
    context,
    MaterialPageRoute(builder: (context) => BoothDetailsPage(booth: booth)),
  );
}

class LoadingWidget extends StatelessWidget {
  const LoadingWidget({super.key});

  @override
  Widget build(BuildContext context) {
    return const Center(
      child: SizedBox(
        width: 24,
        height: 24,
        child: CircularProgressIndicator(
          strokeWidth: 2.2,
          valueColor: AlwaysStoppedAnimation<Color>(AppColors.goldPrimary),
        ),
      ),
    );
  }
}

class EmptyStateWidget extends StatelessWidget {
  final String message;

  const EmptyStateWidget({super.key, this.message = 'No partner booths found'});

  @override
  Widget build(BuildContext context) {
    return Center(
      child: Column(
        mainAxisAlignment: MainAxisAlignment.center,
        children: [
          Container(
            padding: const EdgeInsets.all(18),
            decoration: BoxDecoration(
              color: AppColors.goldLight,
              shape: BoxShape.circle,
            ),
            child: const Icon(
              Icons.storefront_outlined,
              size: 40,
              color: AppColors.goldDark,
            ),
          ),
          const SizedBox(height: 16),
          Text(
            message,
            style: GoogleFonts.plusJakartaSans(
              color: AppColors.textSecondary,
              fontSize: 14,
              fontWeight: FontWeight.w500,
            ),
          ),
        ],
      ),
    );
  }
}

