import 'package:flutter/material.dart';

class AppColors {
  // === Base Theme (Dark Luxury Edition) ===
  static const Color bg = Color(0xFF021A14); // Deepest emerald — clean, elegant
  static const Color surface = Color(
    0xFF0A2C24,
  ); // Slightly lighter green for cards
  static const Color border = Color(0xFF063026); // Dark accent for subtle depth
  static const Color accent = Color(
    0xFFD9B453,
  ); // Rich, metallic gold — luxury feel
  static const Color highlight = Color(0xFFE8E0C8); // Soft beige for text

  // === Text ===
  static const Color textPrimary = Color(
    0xFFE8E0C8,
  ); // Beige — readable on dark green
  static const Color textSecondary = Color(
    0xFFD9B453,
  ); // Rich gold — highlights & icons

  // === Feedback & Dividers ===
  static const Color divider = Color(
    0xFF0F3C31,
  ); // Dark muted teal — clean separation
  static const Color error = Color(0xFFD57A66); // Muted coral — elegant warning
  static const Color success = Color(0xFF3DAA7A); // Soft emerald for success
  static const Color info = Color(0xFF5BBBAA); // Gentle cyan for info

  // === Neutrals ===
  static const Color white = Color(0xFFFFFFFF);
  static const Color black = Color(0xFF000000);
}
