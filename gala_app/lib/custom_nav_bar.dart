import 'package:flutter/material.dart';
import 'package:google_fonts/google_fonts.dart';
import 'app_colors.dart';

class BottomNavBar extends StatelessWidget {
  final int currentIndex;
  final ValueChanged<int> onTap;

  const BottomNavBar({
    super.key,
    required this.currentIndex,
    required this.onTap,
  });

  @override
  Widget build(BuildContext context) {
    return Container(
      decoration: BoxDecoration(
        color: AppColors.surface,
        border: const Border(
          top: BorderSide(color: AppColors.surfaceBorder, width: 1),
        ),
        boxShadow: [
          BoxShadow(
            color: AppColors.charcoal.withOpacity(0.04),
            blurRadius: 16,
            offset: const Offset(0, -4),
          ),
        ],
      ),
      padding: const EdgeInsets.fromLTRB(16, 8, 16, 12),
      child: Row(
        children: [
          _BottomItem(
            index: 0,
            icon: Icons.home_outlined,
            activeIcon: Icons.home_rounded,
            label: 'Home',
            active: currentIndex == 0,
            onTap: onTap,
          ),
          _BottomItem(
            index: 1,
            icon: Icons.calendar_today_outlined,
            activeIcon: Icons.calendar_month_rounded,
            label: 'Agenda',
            active: currentIndex == 1,
            onTap: onTap,
          ),
          _BottomItem(
            index: 2,
            icon: Icons.storefront_outlined,
            activeIcon: Icons.storefront_rounded,
            label: 'Booths',
            active: currentIndex == 2,
            onTap: onTap,
          ),
          _BottomItem(
            index: 3,
            icon: Icons.person_outline_rounded,
            activeIcon: Icons.person_rounded,
            label: 'Profile',
            active: currentIndex == 3,
            onTap: onTap,
          ),
        ],
      ),
    );
  }
}

class _BottomItem extends StatelessWidget {
  final int index;
  final IconData icon;
  final IconData activeIcon;
  final String label;
  final bool active;
  final ValueChanged<int> onTap;

  const _BottomItem({
    super.key,
    required this.index,
    required this.icon,
    required this.activeIcon,
    required this.label,
    this.active = false,
    required this.onTap,
  });

  @override
  Widget build(BuildContext context) {
    return Expanded(
      child: InkWell(
        borderRadius: BorderRadius.circular(16),
        splashColor: AppColors.lavenderLight,
        highlightColor: AppColors.lavenderSubtle,
        onTap: () => onTap(index),
        child: AnimatedContainer(
          duration: const Duration(milliseconds: 220),
          curve: Curves.easeOutCubic,
          padding: const EdgeInsets.symmetric(vertical: 6, horizontal: 8),
          decoration: BoxDecoration(
            color: active ? AppColors.goldLight : Colors.transparent,
            borderRadius: BorderRadius.circular(14),
            border: Border.all(
              color: active ? AppColors.goldPrimary.withOpacity(0.35) : Colors.transparent,
              width: 1,
            ),
          ),
          child: Column(
            mainAxisSize: MainAxisSize.min,
            children: [
              AnimatedSwitcher(
                duration: const Duration(milliseconds: 200),
                transitionBuilder: (child, anim) => ScaleTransition(scale: anim, child: child),
                child: Icon(
                  active ? activeIcon : icon,
                  key: ValueKey<bool>(active),
                  color: active ? AppColors.goldDark : AppColors.textSecondary,
                  size: 22,
                ),
              ),
              const SizedBox(height: 3),
              Text(
                label,
                style: GoogleFonts.plusJakartaSans(
                  fontSize: 11.5,
                  color: active ? AppColors.charcoalDark : AppColors.textSecondary,
                  fontWeight: active ? FontWeight.w700 : FontWeight.w500,
                  letterSpacing: active ? 0.2 : 0,
                ),
              ),
            ],
          ),
        ),
      ),
    );
  }
}

