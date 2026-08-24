import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../app_colors.dart';

// ---------------- Models ----------------
class Guest {
  final String name;
  final String major;

  Guest({required this.name, required this.major});
}

const Map<String, String> majorFullName = {
  "AUTO": "Automobile",
  "ELN": "Électrique & Electronique",
  "ELT": "Électrotechnique",
  "G.CHIM": "Génie Chimique",
  "GPE": "Génie des Procédés",
  "QHSE": "QHSE",
  "MINIER": "Génie Minier",
  "HYDRAU": "Hydraulique",
  "INDUS": "Génie Industriel",
  "DATA": "Data & Informatique",
  "MTRX": "Matériaux",
  "MECA": "Mécanique",
  "GC": "Génie Civil",
};

// Sample guest list
final List<Guest> guests = [
  Guest(name: "Daif Hichem", major: "Automatique"),
  Guest(name: "Sid Ali Azouz", major: "Automatique"),
  Guest(name: "Saheb Derkaoui", major: "Automatique"),
  Guest(name: "Derkaoui Younes", major: "Automatique"),
  Guest(name: "Mohamed Khelil Cherfi", major: "Electronique"),
  Guest(name: "Mohamed Ali Haoufa", major: "Electronique"),
  Guest(name: "Djamila Douache", major: "Electronique"),
  Guest(name: "Bilal Djellouli", major: "Electronique"),
  Guest(name: "Zakaria Rabiai", major: "Electronique"),
  Guest(name: "Mohamed Guettai", major: "Électrotechnique"),
  Guest(name: "Melyssa Ounnoughi", major: "Électrotechnique"),
  Guest(name: "Mohamed Abbaci", major: "Électrotechnique"),
  Guest(name: "Farid Kadri", major: "Électrotechnique"),
  Guest(name: "Rafik Abdi", major: "Génie Chimique"),
  Guest(name: "Consultante De Rafik", major: "Génie Chimique"),
  Guest(name: "Abdelkader Tetbirt", major: "Génie Chimique"),
  Guest(name: "abdellah fekai", major: "Génie Chimique"),
  Guest(name: "Abderrezak Mechri", major: "Génie Chimique"),
  Guest(name: "Hadjer Moud", major: "Génie des Procédés"),
  Guest(name: "Imed Dandani", major: "Génie des Procédés"),
  Guest(name: "Ounis Ben Mehania", major: "Génie des Procédés"),
  Guest(name: "Mohamed Brahmine", major: "Génie des Procédés"),
  Guest(name: "Salah Bouafia", major: "QHSE"),
  Guest(name: "Moncef Hammouda", major: "QHSE"),
  Guest(name: "Mohammed Kheddam", major: "QHSE"),
  Guest(name: "Khaled Benalia Ould Tahar Slimane", major: "QHSE"),
  Guest(name: "Samir Oughou", major: "Génie Minier"),
  Guest(name: "Khaled Benalia Ould Tahar Slimane", major: "Génie Minier"),
  Guest(name: "Oussama Tali", major: "Génie Minier"),
  Guest(name: "Yassine Mezerreg", major: "Hydraulique"),
  Guest(name: "Sidali Khelifati", major: "Hydraulique"),
  Guest(name: "Aghiles Mezali", major: "Hydraulique"),
  Guest(name: "Rafik Ferhat", major: "Génie Industriel"),
  Guest(name: "Issam Sebai", major: "Génie Industriel"),
  Guest(name: "Amel Zitouni", major: "Génie Industriel"),
  Guest(name: "Yaici Mustapha", major: "Génie Industriel"),
  Guest(name: "Amina Daoud", major: "Data Science & AI"),
  Guest(name: "Amel Frendi", major: "Data Science & AI"),
  Guest(name: "Chemssedin Hafsa", major: "Data Science & AI"),
  Guest(name: "Khadir Assil Kherfi", major: "Data Science & AI"),
  Guest(name: "Djeltioui", major: "Matériaux"),
  Guest(name: "Brahim Belahcene", major: "Matériaux"),
  Guest(name: "Farah Bouzidi", major: "Mécanique"),
  Guest(name: "Karim Nait Belkacem", major: "Mécanique"),
  Guest(name: "Elaichouchi Aymen", major: "Mécanique"),
  Guest(name: "Rafid Bendimerad", major: "Mécanique"),
  Guest(name: "Salim Tafraout", major: "Génie Civil"),
  Guest(name: "Kamel Farhati", major: "Génie Civil"),
  Guest(name: "Amine Remini", major: "Génie Civil"),
];

// ---------------- Riverpod Providers ----------------

// Holds the currently selected major (null = all)
final selectedMajorProvider = StateProvider<String?>((ref) => null);

// Provides the filtered guest list
final filteredGuestsProvider = Provider<List<Guest>>((ref) {
  final selectedMajor = ref.watch(selectedMajorProvider);
  if (selectedMajor == null) return guests;
  return guests.where((g) => g.major == selectedMajor).toList();
});

// ---------------- UI ----------------
class GuestPage extends ConsumerWidget {
  const GuestPage({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final majors = guests.map((g) => g.major).toSet().toList();
    final filteredGuests = ref.watch(filteredGuestsProvider);
    final selectedMajor = ref.watch(selectedMajorProvider);

    return Scaffold(
      backgroundColor: AppColors.bg,
      appBar: AppBar(
        backgroundColor: AppColors.bg,
        title: const Text(
          "Guests",
          style: TextStyle(
            color: AppColors.white,
            fontSize: 18,
            fontWeight: FontWeight.bold,
          ),
        ),
      ),
      body: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          // Filter chips
          Padding(
            padding: const EdgeInsets.symmetric(vertical: 12, horizontal: 16),
            child: SingleChildScrollView(
              scrollDirection: Axis.horizontal,
              child: Row(
                children: [
                  // "All" chip
                  Padding(
                    padding: const EdgeInsets.only(right: 8),
                    child: ChoiceChip(
                      label: const Text("All"),
                      selected: selectedMajor == null,
                      onSelected:
                          (_) =>
                              ref.read(selectedMajorProvider.notifier).state =
                                  null,
                      selectedColor: AppColors.accent,
                      backgroundColor: AppColors.surface,
                      labelStyle: TextStyle(
                        color:
                            selectedMajor == null
                                ? AppColors.bg
                                : AppColors.textPrimary,
                        fontWeight: FontWeight.bold,
                      ),
                    ),
                  ),
                  // Major chips
                  ...majors.map((major) {
                    final fullName = majorFullName[major] ?? major;
                    final isSelected = selectedMajor == major;
                    return Padding(
                      padding: const EdgeInsets.only(right: 8),
                      child: ChoiceChip(
                        label: Text(fullName),
                        selected: isSelected,
                        onSelected:
                            (_) =>
                                ref.read(selectedMajorProvider.notifier).state =
                                    isSelected ? null : major,
                        selectedColor: AppColors.accent,
                        backgroundColor: AppColors.surface,
                        labelStyle: TextStyle(
                          color:
                              isSelected ? AppColors.bg : AppColors.textPrimary,
                          fontWeight: FontWeight.bold,
                        ),
                      ),
                    );
                  }),
                ],
              ),
            ),
          ),

          // Guest grid
          Expanded(
            child: Padding(
              padding: const EdgeInsets.symmetric(horizontal: 16),
              child: GridView.builder(
                itemCount: filteredGuests.length,
                gridDelegate: const SliverGridDelegateWithFixedCrossAxisCount(
                  crossAxisCount: 3,
                  mainAxisSpacing: 16,
                  crossAxisSpacing: 16,
                  childAspectRatio: 0.65,
                ),
                itemBuilder: (context, index) {
                  final guest = filteredGuests[index];
                  return _GuestCard(guest: guest);
                },
              ),
            ),
          ),
        ],
      ),
    );
  }
}

// Guest card
class _GuestCard extends StatelessWidget {
  final Guest guest;
  const _GuestCard({required this.guest});

  @override
  Widget build(BuildContext context) {
    final initials =
        guest.name
            .trim()
            .split(' ')
            .map((e) => e[0])
            .take(2)
            .join()
            .toUpperCase();

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
              initials,
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
            style: const TextStyle(color: AppColors.textPrimary, fontSize: 14),
            textAlign: TextAlign.center,
          ),
          const SizedBox(height: 6),
          Text(
            majorFullName[guest.major] ?? guest.major,
            style: const TextStyle(
              color: AppColors.textSecondary,
              fontSize: 12,
            ),
            textAlign: TextAlign.center,
          ),
        ],
      ),
    );
  }
}
