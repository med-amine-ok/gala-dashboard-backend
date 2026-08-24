import 'package:flutter/material.dart';
import 'models/agenda_model.dart';
import '../app_colors.dart';

const List<AgendaItemModel> mockAgendaItems = [
  AgendaItemModel(title: 'Stands', subtitle: '09:00 – 12:00'),
  AgendaItemModel(title: 'Check-in', subtitle: '13:00 – 13:30'),
  AgendaItemModel(title: 'Opening Ceremony', subtitle: '13:30 – 14:00'),
  AgendaItemModel(
    title: 'Conference 01 - Mr. Karim Bouchoucha',
    subtitle: '14:00 – 14:30',
  ),
  AgendaItemModel(title: 'Round Tables 1', subtitle: '14:30 – 15:15'),
  AgendaItemModel(title: 'Coffee Break', subtitle: '15:15 – 16:00'),
  AgendaItemModel(
    title: 'Conference 02 - Mrs. Djamila Douache',
    subtitle: '16:00 – 16:30',
  ),
  AgendaItemModel(title: 'Round Tables 2', subtitle: '16:30 – 17:15'),
  AgendaItemModel(
    title: 'Conference 03 - Mr. Rafid Bendimerad',
    subtitle: '17:15 – 17:45',
  ),
  AgendaItemModel(title: 'Discussion Panel', subtitle: '17:45 – 18:30'),
  AgendaItemModel(title: 'Closing Ceremony', subtitle: '18:30'),
];

// ====== Page ======
class AgendaScreen extends StatelessWidget {
  const AgendaScreen({super.key});

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: CustomHeader(title: 'Agenda'),
        backgroundColor: AppColors.bg,
        centerTitle: true,
        elevation: 0,
        iconTheme: const IconThemeData(color: AppColors.white),
      ),
      backgroundColor: AppColors.bg,
      body: SafeArea(
        child: Column(
          children: [
            SizedBox(height: 16),
            Expanded(
              child: ListView.builder(
                itemCount: mockAgendaItems.length,
                itemBuilder: (context, index) {
                  final item = mockAgendaItems[index];
                  return AgendaTimelineItem(
                    item: item,
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

class CustomHeader extends StatelessWidget {
  final String title;
  const CustomHeader({super.key, required this.title});

  @override
  Widget build(BuildContext context) {
    return Text(
      title,
      style: TextStyle(
        color: AppColors.white,
        fontSize: 18,
        fontWeight: FontWeight.bold,
      ),
    );
  }
}

// ====== Header Bar ======
class HeaderBar extends StatelessWidget {
  final String title;
  const HeaderBar({super.key, required this.title});

  @override
  Widget build(BuildContext context) {
    return Container(
      color: AppColors.bg,
      child: Row(
        children: [
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
          const SizedBox(width: 48), // symmetry spacing
        ],
      ),
    );
  }
}

// ====== Agenda Timeline Item ======
class AgendaTimelineItem extends StatelessWidget {
  final AgendaItemModel item;
  final bool isFirst;
  final bool isLast;

  const AgendaTimelineItem({
    super.key,
    required this.item,
    this.isFirst = false,
    this.isLast = false,
  });

  @override
  Widget build(BuildContext context) {
    return Padding(
      padding: const EdgeInsets.symmetric(horizontal: 16),
      child: Row(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          // Timeline indicator
          const SizedBox(width: 12),
          // Agenda text
          Expanded(
            child: Padding(
              padding: const EdgeInsets.symmetric(vertical: 0),
              child: Row(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Column(
                    children: [
                      Icon(Icons.access_time, color: AppColors.white, size: 22),
                      Container(
                        width: 1.5,
                        height: 40,
                        margin: const EdgeInsets.only(top: 8, bottom: 8),
                        color: AppColors.divider,
                      ),
                    ],
                  ),

                  const SizedBox(width: 8),

                  Expanded(
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Text(
                          item.title,
                          style: const TextStyle(
                            color: AppColors.white,
                            fontSize: 16,
                            fontWeight: FontWeight.w600,
                          ),
                          softWrap: true,
                          overflow: TextOverflow.visible,
                        ),
                        const SizedBox(height: 4),
                        Text(
                          item.subtitle,
                          style: TextStyle(
                            color: AppColors.textSecondary,
                            fontSize: 14,
                          ),
                          softWrap: true,
                          overflow: TextOverflow.visible,
                        ),
                      ],
                    ),
                  ),
                ],
              ),
            ),
          ),
        ],
      ),
    );
  }
}
