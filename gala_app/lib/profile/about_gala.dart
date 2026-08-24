import 'package:flutter/material.dart';
import '../app_colors.dart';

class AboutGalaScreen extends StatelessWidget {
  const AboutGalaScreen({super.key});

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: AppColors.bg,
      appBar: AppBar(
        backgroundColor: AppColors.bg,
        elevation: 0,
        title: const Text(
          'About the Gala',
          style: TextStyle(
            color: AppColors.white,
            fontSize: 18,
            fontWeight: FontWeight.bold,
          ),
        ),
      ),
      body: const SingleChildScrollView(
        padding: EdgeInsets.all(20),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Text(
              'Engineers’ GALA 2025',
              style: TextStyle(
                fontSize: 24,
                fontWeight: FontWeight.bold,
                color: Colors.white,
              ),
            ),
            SizedBox(height: 12),
            Text(
              'The Engineers’ GALA is the flagship event of the Vision & Innovation Club at the National Polytechnic School of Algiers. '
              'Since its first edition, it has embodied excellence, creativity, and collaboration within the engineering community. '
              'Now in its 8th edition, the Gala brings together aspiring engineers, industry experts, researchers, entrepreneurs, and recruiters '
              'for a day devoted to learning, exchange, and innovation.',
              style: TextStyle(
                color: AppColors.textSecondary,
                fontSize: 16,
                height: 1.6,
              ),
            ),
            SizedBox(height: 20),
            Text(
              'Beyond a celebration, the Engineers’ GALA is a platform where ideas come to life and talent meets opportunity. '
              'Through inspiring talks, startup pitches, networking sessions, and interactive activities, it connects academia with industry '
              'and empowers the next generation of engineers to shape the future.',
              style: TextStyle(
                color: AppColors.textSecondary,
                fontSize: 16,
                height: 1.6,
              ),
            ),
            SizedBox(height: 20),
            Text(
              'Organized by the Vision & Innovation Club — a student organization founded in 2014 — the Gala reflects the club’s mission '
              'to foster creativity, teamwork, and scientific curiosity at the heart of the National Polytechnic School of Algiers.',
              style: TextStyle(
                color: AppColors.textSecondary,
                fontSize: 16,
                height: 1.6,
              ),
            ),
          ],
        ),
      ),
    );
  }
}
