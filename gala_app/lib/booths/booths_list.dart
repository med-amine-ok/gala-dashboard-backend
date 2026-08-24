import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:flutter_svg/svg.dart';
import '../agenda/agenda_provider.dart';
import '../app_colors.dart';
import 'booth_details.dart';
import 'models/booth.dart';

FutureProvider<List<BoothModel>> fetchBoothsProvider =
    FutureProvider<List<BoothModel>>((ref) async {
      // Simulate network delay
      final eventRepo = ref.read(eventRepoProvider);
      List<BoothModel> booths = await eventRepo.getBooths();

      return booths;

      // Return mock data
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
        title: const Text(
          'Booths & Companies ',
          style: TextStyle(
            color: AppColors.white,
            fontSize: 18,
            fontWeight: FontWeight.bold,
          ),
        ),
        centerTitle: true,
      ),
      body: const Column(
        children: [SizedBox(height: 16), Expanded(child: BoothsGrid())],
      ),
    );
  }
}

class SearchBar extends StatefulWidget {
  const SearchBar({super.key});

  @override
  State<SearchBar> createState() => _SearchBarState();
}

class _SearchBarState extends State<SearchBar> {
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
      margin: const EdgeInsets.only(bottom: 12.0),
      child: Container(
        height: 48,
        decoration: BoxDecoration(
          color: AppColors.surface,
          borderRadius: BorderRadius.circular(8.0),
          border: Border.all(color: AppColors.border),
        ),
        child: Row(
          children: [
            const Padding(
              padding: EdgeInsets.only(left: 16.0),
              child: Icon(
                Icons.search,
                color: AppColors.textSecondary,
                size: 24,
              ),
            ),
            Expanded(
              child: TextField(
                controller: _searchController,
                style: const TextStyle(color: AppColors.white),
                decoration: const InputDecoration(
                  hintText: 'Search companies...',
                  hintStyle: TextStyle(color: AppColors.textSecondary),
                  border: InputBorder.none,
                  contentPadding: EdgeInsets.symmetric(
                    horizontal: 16.0,
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
    // Placeholder — replace with actual booth list later

    return boothsAsyncValue.when(
      error:
          (err, stack) => Center(
            child: Text(
              'Error loading booths',
              style: TextStyle(color: AppColors.textSecondary),
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
                      gridDelegate:
                          const SliverGridDelegateWithFixedCrossAxisCount(
                            crossAxisCount: 2,
                            crossAxisSpacing: 12.0,
                            mainAxisSpacing: 12.0,
                            childAspectRatio: 1.0,
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
        width: 140,
        height: 140,
        decoration: BoxDecoration(
          color: AppColors.white, // background white
          borderRadius: BorderRadius.circular(8.0),
          border: Border.all(color: AppColors.border),
        ),
        child: ClipRRect(
          borderRadius: BorderRadius.circular(8.0),
          child: Center(
            child:
                isSvg
                    ? SizedBox(
                      width: 100, // fixed small width
                      height: 100, // fixed small height
                      child: SvgPicture.network(
                        booth.bannerUrl,
                        fit: BoxFit.contain,
                        placeholderBuilder:
                            (context) => const Center(
                              child: CircularProgressIndicator(),
                            ),
                      ),
                    )
                    : SizedBox(
                      width: 100,
                      height: 100,
                      child: Image.network(
                        booth.bannerUrl,
                        fit: BoxFit.contain,
                        errorBuilder:
                            (context, error, stackTrace) => Center(
                              child: Text(
                                booth.name
                                    .trim()
                                    .split(' ')
                                    .map((e) => e[0])
                                    .take(2)
                                    .join()
                                    .toUpperCase(),
                                style: const TextStyle(
                                  color: Colors.black,
                                  fontSize: 24,
                                  fontWeight: FontWeight.bold,
                                ),
                              ),
                            ),
                      ),
                    ),
          ),
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
      child: CircularProgressIndicator(
        valueColor: AlwaysStoppedAnimation<Color>(AppColors.white),
      ),
    );
  }
}

class EmptyStateWidget extends StatelessWidget {
  final String message;

  const EmptyStateWidget({super.key, this.message = 'No booths found'});

  @override
  Widget build(BuildContext context) {
    return Center(
      child: Column(
        mainAxisAlignment: MainAxisAlignment.center,
        children: [
          const Icon(
            Icons.storefront_outlined,
            size: 64,
            color: AppColors.textSecondary,
          ),
          const SizedBox(height: 16),
          Text(
            message,
            style: const TextStyle(
              color: AppColors.textSecondary,
              fontSize: 16,
            ),
          ),
        ],
      ),
    );
  }
}
