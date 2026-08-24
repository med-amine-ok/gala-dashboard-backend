import 'package:flutter/material.dart';
import 'package:flutter_animate/flutter_animate.dart';
import '../app_colors.dart';

void showLanguageSheet(BuildContext context) {
  showModalBottomSheet(
    context: context,
    backgroundColor: Colors.transparent,
    isScrollControlled: true,
    builder: (_) => const _LanguageBottomSheet(),
  );
}

class _LanguageBottomSheet extends StatefulWidget {
  const _LanguageBottomSheet();

  @override
  State<_LanguageBottomSheet> createState() => _LanguageBottomSheetState();
}

class _LanguageBottomSheetState extends State<_LanguageBottomSheet> {
  String selectedLang = 'en';

  final List<Map<String, String>> languages = [
    {'code': 'en', 'name': 'English', 'flag': '🇺🇸'},
    {'code': 'fr', 'name': 'Français', 'flag': '🇫🇷'},
    {'code': 'ar', 'name': 'العربية', 'flag': '🇩🇿'},
  ];

  @override
  Widget build(BuildContext context) {
    return Container(
          decoration: const BoxDecoration(
            color: AppColors.surface,
            borderRadius: BorderRadius.vertical(top: Radius.circular(24)),
          ),
          padding: const EdgeInsets.fromLTRB(20, 16, 20, 30),
          child: Column(
            mainAxisSize: MainAxisSize.min,
            children: [
              Container(
                width: 40,
                height: 5,
                decoration: BoxDecoration(
                  color: AppColors.border,
                  borderRadius: BorderRadius.circular(10),
                ),
              ),
              const SizedBox(height: 16),
              const Text(
                'Change Language',
                style: TextStyle(
                  color: AppColors.white,
                  fontSize: 18,
                  fontWeight: FontWeight.w600,
                ),
              ),
              const SizedBox(height: 20),
              Column(
                children:
                    languages
                        .map(
                          (lang) => GestureDetector(
                            onTap: () {
                              setState(() => selectedLang = lang['code']!);
                              Future.delayed(
                                const Duration(milliseconds: 300),
                                () {
                                  Navigator.pop(context, lang['code']);
                                },
                              );
                            },
                            child: AnimatedContainer(
                                  duration: const Duration(milliseconds: 300),
                                  margin: const EdgeInsets.symmetric(
                                    vertical: 6,
                                  ),
                                  padding: const EdgeInsets.symmetric(
                                    vertical: 14,
                                    horizontal: 16,
                                  ),
                                  decoration: BoxDecoration(
                                    color:
                                        selectedLang == lang['code']
                                            ? AppColors.accent.withOpacity(0.6)
                                            : AppColors.bg,
                                    borderRadius: BorderRadius.circular(14),
                                    border: Border.all(
                                      color:
                                          selectedLang == lang['code']
                                              ? AppColors.divider
                                              : AppColors.border,
                                    ),
                                    boxShadow:
                                        selectedLang == lang['code']
                                            ? [
                                              BoxShadow(
                                                color: AppColors.accent
                                                    .withOpacity(0.3),
                                                blurRadius: 12,
                                                offset: const Offset(0, 4),
                                              ),
                                            ]
                                            : [],
                                  ),
                                  child: Row(
                                    mainAxisAlignment:
                                        MainAxisAlignment.spaceBetween,
                                    children: [
                                      Row(
                                        children: [
                                          Text(
                                            lang['flag']!,
                                            style: const TextStyle(
                                              fontSize: 20,
                                            ),
                                          ),
                                          const SizedBox(width: 12),
                                          Text(
                                            lang['name']!,
                                            style: const TextStyle(
                                              color: AppColors.white,
                                              fontSize: 16,
                                            ),
                                          ),
                                        ],
                                      ),
                                      AnimatedOpacity(
                                        opacity:
                                            selectedLang == lang['code']
                                                ? 1
                                                : 0,
                                        duration: const Duration(
                                          milliseconds: 200,
                                        ),
                                        child: const Icon(
                                          Icons.check_circle,
                                          color: AppColors.white,
                                          size: 22,
                                        ),
                                      ),
                                    ],
                                  ),
                                )
                                .animate()
                                .fadeIn(duration: 300.ms)
                                .slide(
                                  begin: const Offset(0, 0.2),
                                  curve: Curves.easeOut,
                                ),
                          ),
                        )
                        .toList(),
              ),
            ],
          ),
        )
        .animate()
        .fadeIn(duration: 250.ms)
        .slide(begin: const Offset(0, 0.1), curve: Curves.easeOut);
  }
}
