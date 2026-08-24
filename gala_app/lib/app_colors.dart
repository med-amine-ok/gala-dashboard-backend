import 'package:flutter/material.dart';

class AppColors {
  // === Warm Off-White Quiet Luxury Base Palette ===
  static const Color bg = Color(0xFFF7F4EE); // Warm off-white background
  static const Color surface = Color(0xFFFFFFFF); // Pure white card surface
  static const Color surfaceMuted = Color(0xFFF3EFE6); // Warm muted surface
  static const Color surfaceBorder = Color(0xFFEAE3D5); // Soft luxury border
  static const Color border = Color(0xFFEAE3D5); // Standard border

  // === Deep Charcoal / Text Palette ===
  static const Color charcoal = Color(0xFF1A1A1A); // Deep charcoal
  static const Color charcoalDark = Color(0xFF121212);
  static const Color charcoalSurface = Color(0xFF1E1E1E);
  static const Color charcoalBorder = Color(0xFF2D2D2D);
  static const Color textPrimary = Color(0xFF1A1A1A); // Charcoal primary text
  static const Color textSecondary = Color(0xFF6B6862); // Muted secondary text
  static const Color textSubtle = Color(0xFF96928B); // Subtle caption text

  // === Champagne Gold Palette (Understated Luxury Details) ===
  static const Color goldPrimary = Color(0xFFC5A880); // Champagne gold primary
  static const Color accent = Color(0xFFC5A880); // Accent alias
  static const Color goldLight = Color(0xFFF7F1E6); // Light gold tint
  static const Color goldHover = Color(0xFFB08F63); // Rich gold hover
  static const Color goldDark = Color(0xFF8C6F45); // Deep gold

  // === Soft Lavender Accent Palette (Interactive States & Highlights) ===
  static const Color lavender = Color(0xFFC8B6E2); // Lavender accent
  static const Color lavenderAccent = Color(0xFFC8B6E2); // Lavender accent alias
  static const Color lavenderLight = Color(0xFFECE5F8); // Light lavender
  static const Color lavenderSubtle = Color(0xFFF6F2FC); // Subtle lavender bg
  static const Color lavenderBorder = Color(0xFFDDD0F3); // Lavender border
  static const Color lavenderDark = Color(0xFF6E4FA0); // Deep lavender

  // === Status Colors ===
  static const Color success = Color(0xFF2E5A36); // Brand forest green
  static const Color successBg = Color(0xFFEBF2EC);
  static const Color warning = Color(0xFFC5A880); // Champagne warning
  static const Color warningBg = Color(0xFFFAF5EB);
  static const Color error = Color(0xFF8B2635); // Deep luxury ruby
  static const Color errorBg = Color(0xFFF9ECEF);
  static const Color divider = Color(0xFFEAE3D5); // Subtle separator

  // === Neutrals ===
  static const Color white = Color(0xFFFFFFFF);
  static const Color black = Color(0xFF000000);

  // === Gradients ===
  static const LinearGradient goldGradient = LinearGradient(
    begin: Alignment.topLeft,
    end: Alignment.bottomRight,
    colors: [Color(0xFFDFC598), Color(0xFFC4A77D)],
  );

  static const LinearGradient darkLuxuryGradient = LinearGradient(
    begin: Alignment.topLeft,
    end: Alignment.bottomRight,
    colors: [Color(0xFF1E1E1E), Color(0xFF121212)],
  );

  static const LinearGradient lavenderGradient = LinearGradient(
    begin: Alignment.topLeft,
    end: Alignment.bottomRight,
    colors: [Color(0xFFF6F2FC), Color(0xFFECE5F8)],
  );
}

