import 'package:flutter/material.dart';
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
      decoration: const BoxDecoration(
        color: AppColors.bg,
        border: Border(top: BorderSide(color: AppColors.border, width: 1)),
      ),
      padding: const EdgeInsets.fromLTRB(16, 8, 16, 10),
      child: Row(
        children: [
          _BottomItem(
            index: 0,
            icon: Icons.home,
            label: 'Home',
            active: currentIndex == 0,
            onTap: onTap,
          ),
          _BottomItem(
            index: 1,
            icon: Icons.calendar_month,
            label: 'Agenda',
            active: currentIndex == 1,
            onTap: onTap,
          ),
          _BottomItem(
            index: 2,
            icon: Icons.grid_view_rounded,
            label: 'Booths',
            active: currentIndex == 2,
            onTap: onTap,
          ),
          _BottomItem(
            index: 3,
            icon: Icons.person,
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
  final String label;
  final bool active;
  final ValueChanged<int> onTap;

  const _BottomItem({
    super.key,
    required this.index,
    required this.icon,
    required this.label,
    this.active = false,
    required this.onTap,
  });

  @override
  Widget build(BuildContext context) {
    return Expanded(
      child: InkWell(
        borderRadius: BorderRadius.circular(12),
        onTap: () => onTap(index),
        child: Padding(
          padding: const EdgeInsets.symmetric(vertical: 4),
          child: Column(
            mainAxisSize: MainAxisSize.min,
            children: [
              Icon(
                icon,
                color: active ? AppColors.white : AppColors.textSecondary,
              ),
              const SizedBox(height: 4),
              Text(
                label,
                style: TextStyle(
                  fontSize: 12,
                  color: active ? AppColors.white : AppColors.textSecondary,
                  fontWeight: active ? FontWeight.w600 : FontWeight.w500,
                ),
              ),
            ],
          ),
        ),
      ),
    );
  }
}
