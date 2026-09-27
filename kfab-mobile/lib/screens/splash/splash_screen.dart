import 'dart:async';
import 'package:flutter/material.dart';
import '../../core/state/auth_state.dart';
import '../auth/login_screen.dart';
import '../shell/main_shell_screen.dart';

class SplashScreen extends StatefulWidget {
  final AuthState authState;

  const SplashScreen({super.key, required this.authState});

  @override
  State<SplashScreen> createState() => _SplashScreenState();
}

class _SplashScreenState extends State<SplashScreen> with SingleTickerProviderStateMixin {
  double _progress = 0.0;
  bool _hasNavigated = false;
  Timer? _progressTimer;
  late final DateTime _startTime;
  static const int _totalDurationMs = 3800;

  @override
  void initState() {
    super.initState();
    _startTime = DateTime.now();

    // Smooth progress ticker
    _progressTimer = Timer.periodic(const Duration(milliseconds: 40), (timer) {
      final elapsed = DateTime.now().difference(_startTime).inMilliseconds;
      final pct = (elapsed / _totalDurationMs).clamp(0.0, 1.0);

      if (mounted) {
        setState(() {
          _progress = pct;
        });
      }

      if (pct >= 1.0) {
        timer.cancel();
        _navigateToNext();
      }
    });
  }

  void _navigateToNext() {
    if (_hasNavigated || !mounted) return;
    _hasNavigated = true;
    _progressTimer?.cancel();

    final destination = widget.authState.isAuthenticated
        ? MainShellScreen(authState: widget.authState)
        : LoginScreen(authState: widget.authState);

    Navigator.of(context).pushReplacement(
      PageRouteBuilder(
        pageBuilder: (context, animation, secondaryAnimation) => destination,
        transitionsBuilder: (context, animation, secondaryAnimation, child) {
          return FadeTransition(
            opacity: animation,
            child: child,
          );
        },
        transitionDuration: const Duration(milliseconds: 450),
      ),
    );
  }

  @override
  void dispose() {
    _progressTimer?.cancel();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    final screenSize = MediaQuery.of(context).size;
    final pctInt = (_progress * 100).toInt();

    return Scaffold(
      backgroundColor: const Color(0xFF020617), // Deep slate-950
      body: Stack(
        children: [
          // 1. Full-Bleed Background Image (Exact match to Login & Web Splash)
          Positioned.fill(
            child: Image.asset(
              'assets/images/kfab_structure.jpg',
              fit: BoxFit.cover,
              errorBuilder: (context, error, stackTrace) {
                return Image.asset(
                  'assets/images/kfab_structure_splash.jpg',
                  fit: BoxFit.cover,
                  errorBuilder: (context, error, stackTrace) => const SizedBox(),
                );
              },
            ),
          ),

          // 2. Cinematic Scrim Gradients matching Web
          Positioned.fill(
            child: Container(
              decoration: const BoxDecoration(
                gradient: LinearGradient(
                  begin: Alignment.bottomCenter,
                  end: Alignment.topCenter,
                  colors: [
                    Color(0xFF020617), // slate-950
                    Color(0xAA020617), // slate-950/65
                    Color(0xDD020617), // slate-950/85
                  ],
                ),
              ),
            ),
          ),
          Positioned.fill(
            child: Container(
              decoration: const BoxDecoration(
                gradient: LinearGradient(
                  begin: Alignment.centerLeft,
                  end: Alignment.centerRight,
                  colors: [
                    Color(0xB3020617),
                    Colors.transparent,
                    Color(0xB3020617),
                  ],
                ),
              ),
            ),
          ),

          // 3. Centerpiece: Pure Logo & Prominent Senior-Designer Typography
          SafeArea(
            child: LayoutBuilder(
              builder: (context, constraints) => SingleChildScrollView(
                child: ConstrainedBox(
                  constraints: BoxConstraints(minHeight: constraints.maxHeight),
                  child: IntrinsicHeight(
                    child: Padding(
                      padding: const EdgeInsets.symmetric(horizontal: 24, vertical: 20),
                      child: Column(
                        mainAxisAlignment: MainAxisAlignment.spaceBetween,
                        children: [
                          // Top Spacer
                          const SizedBox(height: 10),

                  // Center Content
                  Column(
                    mainAxisSize: MainAxisSize.min,
                    children: [
                      // Pure Logo (Zero Box, Zero Background, 2X Size)
                      Image.asset(
                        'assets/images/kfab_logo.png',
                        width: 140,
                        height: 140,
                        fit: BoxFit.contain,
                        errorBuilder: (context, error, stackTrace) {
                          return Image.asset(
                            'assets/logo.png',
                            width: 140,
                            height: 140,
                            fit: BoxFit.contain,
                            errorBuilder: (context, error, stackTrace) => const Icon(
                              Icons.precision_manufacturing,
                              color: Color(0xFFF59E0B),
                              size: 90,
                            ),
                          );
                        },
                      ),
                      const SizedBox(height: 16),

                      // Master Brand Title
                      RichText(
                        textAlign: TextAlign.center,
                        text: const TextSpan(
                          style: TextStyle(
                            fontSize: 44,
                            fontWeight: FontWeight.w900,
                            color: Colors.white,
                            letterSpacing: -0.5,
                            height: 1.1,
                            shadows: [
                              Shadow(
                                color: Colors.black,
                                blurRadius: 18,
                                offset: Offset(0, 3),
                              ),
                            ],
                          ),
                          children: [
                            TextSpan(text: 'KFAB'),
                            TextSpan(
                              text: '360',
                              style: TextStyle(color: Color(0xFFF59E0B)),
                            ),
                          ],
                        ),
                      ),
                      const SizedBox(height: 6),

                      // Corporate Identity Tagline
                      const Text(
                        'KFAB Infra Projects Pvt. Ltd. • Pune',
                        textAlign: TextAlign.center,
                        style: TextStyle(
                          fontSize: 11,
                          fontWeight: FontWeight.w700,
                          color: Color(0xFFCBD5E1),
                          letterSpacing: 2.0,
                          shadows: [
                            Shadow(
                              color: Colors.black,
                              blurRadius: 8,
                              offset: Offset(0, 1),
                            ),
                          ],
                        ),
                      ),
                      const SizedBox(height: 16),

                      // Industrial Amber Divider
                      Container(
                        width: 72,
                        height: 4,
                        decoration: BoxDecoration(
                          color: const Color(0xFFF59E0B),
                          borderRadius: BorderRadius.circular(2),
                          boxShadow: [
                            BoxShadow(
                              color: const Color(0xFFF59E0B).withValues(alpha: 0.8),
                              blurRadius: 14,
                              offset: const Offset(0, 0),
                            ),
                          ],
                        ),
                      ),
                      const SizedBox(height: 20),

                      // Tagline Headings (Prominent font size)
                      const Text(
                        'Precision Engineering.',
                        textAlign: TextAlign.center,
                        style: TextStyle(
                          fontSize: 26,
                          fontWeight: FontWeight.w900,
                          color: Colors.white,
                          letterSpacing: -0.3,
                          shadows: [
                            Shadow(
                              color: Colors.black,
                              blurRadius: 12,
                              offset: Offset(0, 2),
                            ),
                          ],
                        ),
                      ),
                      const SizedBox(height: 4),
                      const Text(
                        'Heavy Structural Steel.',
                        textAlign: TextAlign.center,
                        style: TextStyle(
                          fontSize: 22,
                          fontWeight: FontWeight.w300,
                          color: Color(0xFFCBD5E1),
                          letterSpacing: -0.2,
                          shadows: [
                            Shadow(
                              color: Colors.black,
                              blurRadius: 10,
                              offset: Offset(0, 2),
                            ),
                          ],
                        ),
                      ),
                      const SizedBox(height: 14),

                      // Platform Enterprise Descriptor
                      const Padding(
                        padding: EdgeInsets.symmetric(horizontal: 16),
                        child: Text(
                          'Unified manufacturing intelligence platform for structural fabrication shop-floors, atomic material ledgers, and workforce deployment.',
                          textAlign: TextAlign.center,
                          style: TextStyle(
                            fontSize: 12,
                            fontWeight: FontWeight.w300,
                            color: Color(0xFFCBD5E1),
                            height: 1.45,
                            shadows: [
                              Shadow(
                                color: Colors.black,
                                blurRadius: 6,
                                offset: Offset(0, 1),
                              ),
                            ],
                          ),
                        ),
                      ),
                      const SizedBox(height: 28),

                      // High-End Enterprise Progress Telemetry
                      SizedBox(
                        width: (screenSize.width * 0.75).clamp(220.0, 320.0),
                        child: Column(
                          children: [
                            Row(
                              mainAxisAlignment: MainAxisAlignment.spaceBetween,
                              children: [
                                const Text(
                                  'INITIALIZING WORKSPACE',
                                  style: TextStyle(
                                    fontSize: 10,
                                    fontWeight: FontWeight.w800,
                                    color: Color(0xFFFBBF24),
                                    letterSpacing: 1.2,
                                  ),
                                ),
                                Text(
                                  '$pctInt%',
                                  style: const TextStyle(
                                    fontSize: 10,
                                    fontWeight: FontWeight.bold,
                                    color: Colors.white,
                                    fontFamily: 'monospace',
                                  ),
                                ),
                              ],
                            ),
                            const SizedBox(height: 8),
                            Container(
                              height: 6,
                              decoration: BoxDecoration(
                                color: Colors.white.withValues(alpha: 0.12),
                                borderRadius: BorderRadius.circular(3),
                                border: Border.all(
                                  color: Colors.white.withValues(alpha: 0.15),
                                  width: 0.5,
                                ),
                              ),
                              child: ClipRRect(
                                borderRadius: BorderRadius.circular(3),
                                child: LinearProgressIndicator(
                                  value: _progress,
                                  backgroundColor: Colors.transparent,
                                  valueColor: const AlwaysStoppedAnimation<Color>(Color(0xFFF59E0B)),
                                ),
                              ),
                            ),
                          ],
                        ),
                      ),
                      const SizedBox(height: 22),

                      // Continue to Portal Button
                      InkWell(
                        onTap: _navigateToNext,
                        borderRadius: BorderRadius.circular(24),
                        child: Container(
                          padding: const EdgeInsets.symmetric(horizontal: 20, vertical: 10),
                          decoration: BoxDecoration(
                            borderRadius: BorderRadius.circular(24),
                            border: Border.all(
                              color: Colors.white.withValues(alpha: 0.25),
                              width: 1,
                            ),
                            color: Colors.white.withValues(alpha: 0.08),
                            boxShadow: [
                              BoxShadow(
                                color: Colors.black.withValues(alpha: 0.4),
                                blurRadius: 12,
                                offset: const Offset(0, 4),
                              ),
                            ],
                          ),
                          child: const Row(
                            mainAxisSize: MainAxisSize.min,
                            children: [
                              Text(
                                'CONTINUE TO PORTAL',
                                style: TextStyle(
                                  fontSize: 11,
                                  fontWeight: FontWeight.w800,
                                  color: Colors.white,
                                  letterSpacing: 1.2,
                                ),
                              ),
                              SizedBox(width: 8),
                              Icon(
                                Icons.arrow_forward,
                                size: 14,
                                color: Color(0xFFF59E0B),
                              ),
                            ],
                          ),
                        ),
                      ),
                    ],
                  ),

                  // Bottom Corporate Footer
                  const Padding(
                    padding: EdgeInsets.only(top: 16),
                    child: Column(
                      children: [
                        Text(
                          'Plant Facility: Jejuri Industrial Area (MIDC), Pune',
                          textAlign: TextAlign.center,
                          style: TextStyle(
                            fontSize: 11,
                            fontWeight: FontWeight.w500,
                            color: Color(0xFF94A3B8),
                            letterSpacing: 0.5,
                          ),
                        ),
                        SizedBox(height: 3),
                        Text(
                          'v2026.1 KFab360 Enterprise ERP',
                          textAlign: TextAlign.center,
                          style: TextStyle(
                            fontSize: 10,
                            fontWeight: FontWeight.w500,
                            color: Color(0xFF64748B),
                            fontFamily: 'monospace',
                          ),
                        ),
                      ],
                    ),
                  ),
                ],
              ),
            ),
          ),
        ),
      ),
    ),
  ),
],
),
);
  }
}
