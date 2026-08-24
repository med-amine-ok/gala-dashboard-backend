import 'package:flutter/material.dart';
import 'package:google_fonts/google_fonts.dart';
import 'models/agenda_model.dart';
import '../app_colors.dart';

const List<AgendaItemModel> mockAgendaItems = [
  AgendaItemModel(title: 'Stands & Partner Exhibition', subtitle: '09:00 – 12:00'),
  AgendaItemModel(title: 'VIP & Participant Check-in', subtitle: '13:00 – 13:30'),
  AgendaItemModel(title: 'Grand Opening Ceremony', subtitle: '13:30 – 14:00'),
  AgendaItemModel(
    title: 'Keynote 01 — Mr. Karim Bouchoucha',
    subtitle: '14:00 – 14:30',
  ),
  AgendaItemModel(title: 'Round Table Sessions I', subtitle: '14:30 – 15:15'),
  AgendaItemModel(title: 'Networking & Coffee Break', subtitle: '15:15 – 16:00'),
  AgendaItemModel(
    title: 'Keynote 02 — Mrs. Djamila Douache',
    subtitle: '16:00 – 16:30',
  ),
  AgendaItemModel(title: 'Round Table Sessions II', subtitle: '16:30 – 17:15'),
  AgendaItemModel(
    title: 'Keynote 03 — Mr. Rafid Bendimerad',
    subtitle: '17:15 – 17:45',
  ),
  AgendaItemModel(title: 'Grand Discussion Panel', subtitle: '17:45 – 18:30'),
  AgendaItemModel(title: 'Closing Gala Ceremony & Awards', subtitle: '18:30'),
];

// ====== Page ======
class AgendaScreen extends StatelessWidget {
  const AgendaScreen({super.key});

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: AppColors.bg,
      appBar: AppBar(
        title: Text(
          'Official Agenda',
          style: GoogleFonts.cinzel(
            color: AppColors.textPrimary,
            fontSize: 18,
            fontWeight: FontWeight.bold,
            letterSpacing: 0.5,
          ),
        ),
        backgroundColor: AppColors.bg,
        centerTitle: true,
        elevation: 0,
      ),
      body: SafeArea(
        child: Column(
          children: [
            // Date Banner
            Container(
              margin: const EdgeInsets.fromLTRB(16, 8, 16, 16),
              padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 12),
              decoration: BoxDecoration(
                color: AppColors.surface,
                borderRadius: BorderRadius.circular(16),
                border: Border.all(color: AppColors.border),
                boxShadow: [
                  BoxShadow(
                    color: AppColors.charcoal.withOpacity(0.03),
                    blurRadius: 10,
                    offset: const Offset(0, 2),
                  ),
                ],
              ),
              child: Row(
                children: [
                  Container(
                    padding: const EdgeInsets.all(10),
                    decoration: BoxDecoration(
                      color: AppColors.goldLight,
                      borderRadius: BorderRadius.circular(12),
                    ),
                    child: const Icon(
                      Icons.calendar_month_rounded,
                      color: AppColors.goldDark,
                      size: 20,
                    ),
                  ),
                  const SizedBox(width: 14),
                  Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Text(
                        'Saturday, May 2025',
                        style: GoogleFonts.cinzel(
                          fontSize: 14,
                          fontWeight: FontWeight.bold,
                          color: AppColors.textPrimary,
                        ),
                      ),
                      const SizedBox(height: 2),
                      Text(
                        'Full Day Event Schedule • 11 Sessions',
                        style: GoogleFonts.plusJakartaSans(
                          fontSize: 12,
                          color: AppColors.textSecondary,
                        ),
                      ),
                    ],
                  ),
                ],
              ),
            ),

            // Timeline Items
            Expanded(
              child: ListView.builder(
                physics: const BouncingScrollPhysics(),
                padding: const EdgeInsets.only(bottom: 24),
                itemCount: mockAgendaItems.length,
                itemBuilder: (context, index) {
                  final item = mockAgendaItems[index];
                  return AgendaTimelineItem(
                    item: item,
                    index: index,
                    isFirst: index == 0,
                    isLast: index == mockAgendaItems.length - 1,
                  );
                },
              ),
            ),
          ],
        ),
      ),
    );
  }
}

// ====== Agenda Timeline Item ======
class AgendaTimelineItem extends StatelessWidget {
  final AgendaItemModel item;
  final int index;
  final bool isFirst;
  final bool isLast;

  const AgendaTimelineItem({
    super.key,
    required this.item,
    required this.index,
    this.isFirst = false,
    this.isLast = false,
  });

  bool get isKeynote => item.title.toLowerCase().contains('keynote') || item.title.toLowerCase().contains('conference');
  bool get isCeremony => item.title.toLowerCase().contains('ceremony');

  @override
  Widget build(BuildContext context) {
    return Padding(
      padding: const EdgeInsets.symmetric(horizontal: 16),
      child: IntrinsicHeight(
        child: Row(
          crossAxisAlignment: CrossAxisAlignment.stretch,
          children: [
            // Left Timeline Column
            SizedBox(
              width: 32,
              child: Column(
                children: [
                  Container(
                    width: 16,
                    height: 16,
                    decoration: BoxDecoration(
                      shape: BoxShape.circle,
                      color: isKeynote ? AppColors.goldPrimary : (isCeremony ? AppColors.lavenderDark : AppColors.surface),
                      border: Border.all(
                        color: isKeynote ? AppColors.goldDark : AppColors.goldPrimary,
                        width: 2.5,
                      ),
                    ),
                  ),
                  if (!isLast)
                    Expanded(
                      child: Container(
                        width: 2,
                        color: AppColors.border,
                      ),
                    ),
                ],
              ),
            ),

            const SizedBox(width: 8),

            // Right Content Card
            Expanded(
              child: Container(
                margin: const EdgeInsets.only(bottom: 14),
                padding: const EdgeInsets.all(14),
                decoration: BoxDecoration(
                  color: AppColors.surface,
                  borderRadius: BorderRadius.circular(16),
                  border: Border.all(
                    color: isKeynote ? AppColors.goldPrimary.withOpacity(0.45) : AppColors.border,
                    width: 1,
                  ),
                  boxShadow: [
                    BoxShadow(
                      color: AppColors.charcoal.withOpacity(0.025),
                      blurRadius: 8,
                      offset: const Offset(0, 2),
                    ),
                  ],
                ),
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Row(
                      mainAxisAlignment: MainAxisAlignment.spaceBetween,
                      children: [
                        Container(
                          padding: const EdgeInsets.symmetric(
                            horizontal: 8,
                            vertical: 3,
                          ),
                          decoration: BoxDecoration(
                            color: isKeynote
                                ? AppColors.goldLight
                                : (isCeremony ? AppColors.lavenderSubtle : AppColors.surfaceMuted),
                            borderRadius: BorderRadius.circular(8),
                            border: Border.all(
                              color: isKeynote
                                  ? AppColors.goldPrimary.withOpacity(0.3)
                                  : (isCeremony ? AppColors.lavenderBorder : AppColors.border),
                              width: 0.8,
                            ),
                          ),
                          child: Text(
                            item.subtitle,
                            style: GoogleFonts.plusJakartaSans(
                              color: isKeynote
                                  ? AppColors.goldDark
                                  : (isCeremony ? AppColors.lavenderDark : AppColors.textSecondary),
                              fontSize: 11.5,
                              fontWeight: FontWeight.w700,
                            ),
                          ),
                        ),
                        if (isKeynote)
                          Container(
                            padding: const EdgeInsets.symmetric(horizontal: 6, vertical: 2),
                            decoration: BoxDecoration(
                              color: AppColors.goldPrimary.withOpacity(0.12),
                              borderRadius: BorderRadius.circular(6),
                            ),
                            child: Text(
                              "KEYNOTE",
                              style: GoogleFonts.plusJakartaSans(
                                color: AppColors.goldDark,
                                fontSize: 9.5,
                                fontWeight: FontWeight.w800,
                                letterSpacing: 0.8,
                              ),
                            ),
                          ),
                      ],
                    ),
                    const SizedBox(height: 8),
                    Text(
                      item.title,
                      style: GoogleFonts.plusJakartaSans(
                        color: AppColors.textPrimary,
                        fontSize: 14.5,
                        fontWeight: FontWeight.w700,
                        height: 1.35,
                      ),
                    ),
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

