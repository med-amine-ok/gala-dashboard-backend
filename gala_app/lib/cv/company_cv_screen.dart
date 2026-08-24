import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:google_fonts/google_fonts.dart';
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
      try {
        return await repo.getCompanyLinkedParticipants();
      } catch (e) {
        return CompanyLinkedParticipants(
          company: 'Organizing Committee (HR)',
          linkedParticipantsCount: 0,
          linkedParticipants: [],
        );
      }
    });

class CompanyCvScreen extends ConsumerWidget {
  const CompanyCvScreen({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final participantsAsync = ref.watch(linkedParticipantsProvider);

    return Scaffold(
      backgroundColor: AppColors.bg,
      appBar: AppBar(
        title: Text(
          'Scanned Candidates',
          style: GoogleFonts.cinzel(
            color: AppColors.textPrimary,
            fontSize: 18,
            fontWeight: FontWeight.bold,
            letterSpacing: 0.5,
          ),
        ),
        backgroundColor: AppColors.bg,
        elevation: 0,
        centerTitle: true,
        leading: IconButton(
          icon: const Icon(
            Icons.arrow_back_ios_new_rounded,
            size: 20,
            color: AppColors.textPrimary,
          ),
          onPressed: () => Navigator.maybePop(context),
        ),
        actions: [
          IconButton(
            onPressed: () {
              Navigator.of(
                context,
              ).push(MaterialPageRoute(builder: (_) => const ScanPage()));
            },
            icon: const Icon(Icons.qr_code_scanner_rounded, color: AppColors.goldDark),
            tooltip: 'Scan Participant QR',
          ),
        ],
      ),
      body: participantsAsync.when(
        data: (data) {
          final participants = data.linkedParticipants;

          if (participants.isEmpty) {
            return Center(
              child: Padding(
                padding: const EdgeInsets.all(32.0),
                child: Column(
                  mainAxisAlignment: MainAxisAlignment.center,
                  children: [
                    Container(
                      padding: const EdgeInsets.all(20),
                      decoration: BoxDecoration(
                        color: AppColors.goldLight,
                        shape: BoxShape.circle,
                      ),
                      child: const Icon(
                        Icons.qr_code_scanner_rounded,
                        size: 44,
                        color: AppColors.goldDark,
                      ),
                    ),
                    const SizedBox(height: 18),
                    Text(
                      'No Candidates Scanned Yet',
                      style: GoogleFonts.cinzel(
                        color: AppColors.textPrimary,
                        fontSize: 18,
                        fontWeight: FontWeight.bold,
                      ),
                    ),
                    const SizedBox(height: 8),
                    Text(
                      'Scan participant badges at your booth to automatically receive and review their resumes.',
                      textAlign: TextAlign.center,
                      style: GoogleFonts.plusJakartaSans(
                        color: AppColors.textSecondary,
                        fontSize: 13.5,
                        height: 1.5,
                      ),
                    ),
                  ],
                ),
              ),
            );
          }

          return ListView.separated(
            physics: const BouncingScrollPhysics(),
            padding: const EdgeInsets.all(16),
            separatorBuilder: (context, index) => const SizedBox(height: 12),
            itemCount: participants.length,
            itemBuilder: (context, index) {
              final participant = participants[index];
              final name =
                  participant.name.isNotEmpty
                      ? participant.name
                      : 'Participant #${participant.id}';

              return Container(
                decoration: BoxDecoration(
                  color: AppColors.surface,
                  borderRadius: BorderRadius.circular(16),
                  border: Border.all(color: AppColors.border),
                  boxShadow: [
                    BoxShadow(
                      color: AppColors.charcoal.withOpacity(0.025),
                      blurRadius: 10,
                      offset: const Offset(0, 3),
                    ),
                  ],
                ),
                child: ListTile(
                  contentPadding: const EdgeInsets.symmetric(horizontal: 16, vertical: 8),
                  leading: CircleAvatar(
                    backgroundColor: AppColors.lavenderSubtle,
                    child: Text(
                      name.trim().split(' ').map((e) => e.isNotEmpty ? e[0] : '').take(2).join().toUpperCase(),
                      style: GoogleFonts.cinzel(
                        color: AppColors.lavenderDark,
                        fontWeight: FontWeight.bold,
                        fontSize: 13,
                      ),
                    ),
                  ),
                  title: Text(
                    name,
                    style: GoogleFonts.plusJakartaSans(
                      color: AppColors.textPrimary,
                      fontSize: 14.5,
                      fontWeight: FontWeight.w700,
                    ),
                  ),
                  subtitle: Padding(
                    padding: const EdgeInsets.only(top: 4.0),
                    child: Text(
                      '${participant.university} • ${participant.fieldOfStudy}',
                      style: GoogleFonts.plusJakartaSans(
                        color: AppColors.textSecondary,
                        fontSize: 12,
                      ),
                    ),
                  ),
                  trailing: Container(
                    decoration: BoxDecoration(
                      color: AppColors.goldLight,
                      borderRadius: BorderRadius.circular(10),
                    ),
                    child: IconButton(
                      icon: const Icon(
                        Icons.description_outlined,
                        color: AppColors.goldDark,
                        size: 20,
                      ),
                      tooltip: 'View Candidate Resume',
                      onPressed: () async {
                        viewPdfFromUrl(
                          context,
                          ref.read(supabaseClientProvider),
                          participant.id.toString(),
                          'CV of $name',
                        );
                      },
                    ),
                  ),
                ),
              );
            },
          );
        },
        loading:
            () => const Center(
              child: SizedBox(
                width: 24,
                height: 24,
                child: CircularProgressIndicator(
                  strokeWidth: 2,
                  valueColor: AlwaysStoppedAnimation<Color>(AppColors.goldPrimary),
                ),
              ),
            ),
        error:
            (error, stack) => Center(
              child: Padding(
                padding: const EdgeInsets.all(16),
                child: Text(
                  'Error loading participants: $error',
                  textAlign: TextAlign.center,
                  style: GoogleFonts.plusJakartaSans(color: AppColors.error),
                ),
              ),
            ),
      ),
    );
  }
}

