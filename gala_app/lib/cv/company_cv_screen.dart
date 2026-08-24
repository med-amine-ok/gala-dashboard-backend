import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../app_colors.dart';
import '../core/gala_repo.dart';
import '../core/supabase_provider.dart';
import 'file_upload_section.dart';
import 'models/linked_participants.dart';
import 'scan.dart';

// Provider that fetches the company and its linked participants
final linkedParticipantsProvider =
    FutureProvider.autoDispose<CompanyLinkedParticipants>((ref) async {
      final repo = ref.read(eventRepo);
      // This method should return a parsed model from your API
      return await repo.getCompanyLinkedParticipants();
    });

class CompanyCvScreen extends ConsumerWidget {
  const CompanyCvScreen({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final participantsAsync = ref.watch(linkedParticipantsProvider);

    return Scaffold(
      appBar: AppBar(
        title: const Text(
          'Linked Participants',
          style: TextStyle(
            color: AppColors.white,
            fontSize: 18,
            fontWeight: FontWeight.bold,
          ),
        ),
        backgroundColor: AppColors.bg,
        actions: [
          IconButton(
            onPressed: () {
              Navigator.of(
                context,
              ).push(MaterialPageRoute(builder: (_) => const ScanPage()));
            },
            icon: const Icon(Icons.qr_code_scanner, color: Colors.white),
          ),
        ],
      ),
      body: participantsAsync.when(
        data: (data) {
          final participants = data.linkedParticipants;

          if (participants.isEmpty) {
            return const Center(
              child: Text(
                'No linked participants yet.',
                style: TextStyle(fontSize: 16),
              ),
            );
          }

          return ListView.separated(
            padding: const EdgeInsets.all(12),
            separatorBuilder: (context, index) => const SizedBox(height: 12),
            itemCount: participants.length,
            itemBuilder: (context, index) {
              final participant = participants[index];
              final name =
                  participant.name.isNotEmpty
                      ? participant.name
                      : 'Unknown participant';

              return Card(
                color: AppColors.surface,
                shape: RoundedRectangleBorder(
                  borderRadius: BorderRadius.circular(12),
                ),
                child: ListTile(
                  title: Text(name),
                  subtitle: Text(
                    'University: ${participant.university} • '
                    'Field: ${participant.fieldOfStudy}',
                  ),
                  trailing: IconButton(
                    icon: const Icon(
                      Icons.remove_red_eye,
                      color: Colors.greenAccent,
                    ),
                    tooltip: 'View CV',
                    onPressed: () async {
                      viewPdfFromUrl(
                        context,
                        ref.read(supabaseClientProvider),
                        participant.id.toString(),
                        'CV of $name',
                      ); // Call the function();
                    },
                  ),
                ),
              );
            },
          );
        },
        loading: () => const Center(child: CircularProgressIndicator()),
        error:
            (error, stack) => Center(
              child: Padding(
                padding: const EdgeInsets.all(16),
                child: Text(
                  'Error loading participants: $error',
                  textAlign: TextAlign.center,
                  style: const TextStyle(color: Colors.redAccent),
                ),
              ),
            ),
      ),
    );
  }
}
