import 'dart:math' as math;
import 'package:flutter/material.dart';
import '../../core/config/app_theme.dart';
import '../../core/state/auth_state.dart';
import 'bot_image_data.dart';

class ChatUnderProcessView extends StatefulWidget {
  final AuthState authState;
  final VoidCallback? onGoHome;

  const ChatUnderProcessView({
    super.key,
    required this.authState,
    this.onGoHome,
  });

  @override
  State<ChatUnderProcessView> createState() => _ChatUnderProcessViewState();
}

class _ChatUnderProcessViewState extends State<ChatUnderProcessView>
    with TickerProviderStateMixin {
  late final AnimationController _bounceController;
  late final AnimationController _floatController;

  int _quoteIndex = 0;
  int _coffeeCount = 0;

  final List<String> _funnyQuotes = [
    'Beep Boop! 🤖 Tightening the last bolts on the chat servers!',
    'Watch out for the sparks! ⚡ Welding Bay 1 to the cloud!',
    'Android Bot #008 reporting! 👷‍♂️ Chat feature is being fabricated!',
    'Turning 1,024 screws... 🔩 Please hold your messages!',
    'Coffee tank at 20%! ☕ Tap the coffee button to boost my speed!',
    '01010111 01001111 01010010 01001011 = Work in progress! 🦾',
    'Applying anti-rust coating 🛡️ to the real-time websocket pipes!',
    'VROOOOM! 🚀 Working at maximum caffeinated turbo speed!',
  ];

  @override
  void initState() {
    super.initState();

    // Floating / working animation controller
    _floatController = AnimationController(
      vsync: this,
      duration: const Duration(milliseconds: 2200),
    )..repeat(reverse: true);

    // Interactive bounce on poke animation
    _bounceController = AnimationController(
      vsync: this,
      duration: const Duration(milliseconds: 300),
    );
  }

  @override
  void dispose() {
    _floatController.dispose();
    _bounceController.dispose();
    super.dispose();
  }

  void _pokeAndroidBot() {
    _bounceController.forward(from: 0.0);
    setState(() {
      _quoteIndex = (_quoteIndex + 1) % _funnyQuotes.length;
    });
  }

  void _giveCoffee() {
    _bounceController.forward(from: 0.0);

    setState(() {
      _coffeeCount++;
      _quoteIndex = (_quoteIndex + 1) % _funnyQuotes.length;
    });

    // Dynamically increase speed: reduce float duration with each cup of coffee!
    final newDurationMs = math.max(300, (2200 / (1.0 + _coffeeCount * 0.6)).round());
    _floatController.duration = Duration(milliseconds: newDurationMs);
    _floatController.repeat(reverse: true);

    final speedMultiplier = (1.0 + _coffeeCount * 0.6).toStringAsFixed(1);
    final role = widget.authState.role;
    final rolePrimary = AppTheme.getPrimaryForRole(role);
    final roleAccent = AppTheme.getAccentForRole(role);

    ScaffoldMessenger.of(context).hideCurrentSnackBar();
    ScaffoldMessenger.of(context).showSnackBar(
      SnackBar(
        content: Row(
          children: [
            Container(
              padding: const EdgeInsets.all(7),
              decoration: BoxDecoration(
                color: Colors.white.withValues(alpha: 0.18),
                shape: BoxShape.circle,
              ),
              child: const Text('☕', style: TextStyle(fontSize: 18)),
            ),
            const SizedBox(width: 12),
            Expanded(
              child: Column(
                mainAxisSize: MainAxisSize.min,
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text(
                    'Slurp! Android bot energized (Total: $_coffeeCount ☕)!',
                    style: const TextStyle(
                      fontWeight: FontWeight.bold,
                      fontSize: 13,
                      color: Colors.white,
                    ),
                  ),
                  const SizedBox(height: 2),
                  Text(
                    '⚡ Fabrication speed boosted to ${speedMultiplier}x Turbo!',
                    style: TextStyle(
                      fontSize: 11.5,
                      fontWeight: FontWeight.w700,
                      color: role == UserRole.superAdmin
                          ? const Color(0xFFFBBF24)
                          : (role == UserRole.supervisor
                              ? const Color(0xFFFEF08A)
                              : Colors.white.withValues(alpha: 0.92)),
                    ),
                  ),
                ],
              ),
            ),
          ],
        ),
        backgroundColor: rolePrimary,
        shape: RoundedRectangleBorder(
          borderRadius: BorderRadius.circular(14),
          side: BorderSide(
            color: roleAccent.withValues(alpha: 0.45),
            width: 1.2,
          ),
        ),
        behavior: SnackBarBehavior.floating,
        margin: const EdgeInsets.symmetric(horizontal: 16, vertical: 12),
        elevation: 6,
        duration: const Duration(seconds: 2),
      ),
    );
  }

  @override
  Widget build(BuildContext context) {
    final role = widget.authState.role;
    final rolePrimary = AppTheme.getPrimaryForRole(role);
    final roleAccent = AppTheme.getAccentForRole(role);
    final roleGradient = AppTheme.getGradientForRole(role);
    final lightBgGradient = AppTheme.getLightBgGradientForRole(role);
    final cardBorder = AppTheme.getLightCardBorderForRole(role);
    final speedMultiplier = (1.0 + _coffeeCount * 0.6);

    return Scaffold(
      body: Container(
        decoration: BoxDecoration(
          gradient: LinearGradient(
            colors: lightBgGradient,
            begin: Alignment.topCenter,
            end: Alignment.bottomCenter,
          ),
        ),
        child: SafeArea(
          child: Center(
            child: SingleChildScrollView(
              padding: const EdgeInsets.symmetric(horizontal: 24, vertical: 20),
              child: Column(
                mainAxisAlignment: MainAxisAlignment.center,
                crossAxisAlignment: CrossAxisAlignment.center,
                children: [
                  // Turbo Speed Badge when coffee is consumed
                  if (_coffeeCount > 0)
                    Container(
                      margin: const EdgeInsets.only(bottom: 14),
                      padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 7),
                      decoration: BoxDecoration(
                        gradient: LinearGradient(
                          colors: roleGradient,
                        ),
                        borderRadius: BorderRadius.circular(20),
                        border: Border.all(
                          color: roleAccent.withValues(alpha: 0.5),
                          width: 1,
                        ),
                        boxShadow: [
                          BoxShadow(
                            color: rolePrimary.withValues(alpha: 0.35),
                            blurRadius: 12,
                            offset: const Offset(0, 4),
                          ),
                        ],
                      ),
                      child: Row(
                        mainAxisSize: MainAxisSize.min,
                        children: [
                          const Text('⚡', style: TextStyle(fontSize: 13)),
                          const SizedBox(width: 6),
                          Text(
                            'TURBO SPEED: ${speedMultiplier.toStringAsFixed(1)}x ACTIVE ($_coffeeCount ☕)',
                            style: const TextStyle(
                              fontSize: 11,
                              fontWeight: FontWeight.w900,
                              color: Colors.white,
                              letterSpacing: 0.5,
                            ),
                          ),
                        ],
                      ),
                    ),

                  // Interactive Speech Bubble
                  GestureDetector(
                    onTap: _pokeAndroidBot,
                    child: Container(
                      constraints: const BoxConstraints(maxWidth: 380),
                      padding: const EdgeInsets.symmetric(horizontal: 18, vertical: 12),
                      decoration: BoxDecoration(
                        color: Colors.white,
                        borderRadius: BorderRadius.circular(16),
                        boxShadow: [
                          BoxShadow(
                            color: rolePrimary.withValues(alpha: 0.08),
                            blurRadius: 14,
                            offset: const Offset(0, 4),
                          ),
                        ],
                        border: Border.all(color: cardBorder, width: 1.2),
                      ),
                      child: Column(
                        children: [
                          Text(
                            _funnyQuotes[_quoteIndex],
                            textAlign: TextAlign.center,
                            style: const TextStyle(
                              fontSize: 13,
                              fontWeight: FontWeight.w600,
                              color: Color(0xFF1E293B),
                              height: 1.35,
                            ),
                          ),
                          const SizedBox(height: 4),
                          Row(
                            mainAxisSize: MainAxisSize.min,
                            children: [
                              Icon(Icons.touch_app, size: 12, color: rolePrimary.withValues(alpha: 0.65)),
                              const SizedBox(width: 4),
                              Text(
                                'Tap the android bot to poke!',
                                style: TextStyle(
                                  fontSize: 10,
                                  color: rolePrimary.withValues(alpha: 0.75),
                                  fontStyle: FontStyle.italic,
                                ),
                              ),
                            ],
                          ),
                        ],
                      ),
                    ),
                  ),

                  // Small triangle pointer for speech bubble
                  CustomPaint(
                    size: const Size(16, 8),
                    painter: _BubbleTrianglePainter(borderColor: cardBorder),
                  ),

                  const SizedBox(height: 16),

                  // High Quality 3D Mechanic Android Bot with Dynamic Speed Float
                  GestureDetector(
                    onTap: _pokeAndroidBot,
                    child: AnimatedBuilder(
                      animation: Listenable.merge([
                        _floatController,
                        _bounceController,
                      ]),
                      builder: (context, _) {
                        // Smooth sine wave float, scaled up slightly when super caffeinated
                        final floatAmp = math.min(14.0, 7.0 + (_coffeeCount * 0.8));
                        final floatVal = math.sin(_floatController.value * math.pi) * floatAmp;
                        // Elastic poke bounce
                        final pokeBounce = math.sin(_bounceController.value * math.pi) * 18;
                        final totalOffsetY = -floatVal - pokeBounce;
                        final shadowScale = 1.0 - (floatVal / 50.0);

                        return Column(
                          mainAxisSize: MainAxisSize.min,
                          children: [
                            Stack(
                              alignment: Alignment.center,
                              children: [
                                // Ambient glowing halo matching user theme
                                Container(
                                  width: 210,
                                  height: 210,
                                  decoration: BoxDecoration(
                                    shape: BoxShape.circle,
                                    gradient: RadialGradient(
                                      colors: [
                                        roleAccent.withValues(alpha: 0.16),
                                        rolePrimary.withValues(alpha: 0.05),
                                        Colors.transparent,
                                      ],
                                    ),
                                  ),
                                ),
                                Transform.translate(
                                  offset: Offset(0, totalOffsetY),
                                  child: Image.memory(
                                    kMirroredAndroidBotBytes,
                                    height: 240,
                                    fit: BoxFit.contain,
                                    filterQuality: FilterQuality.high,
                                  ),
                                ),
                              ],
                            ),
                            const SizedBox(height: 4),
                            // Dynamic 3D ground contact shadow responding to float height
                            Transform.scale(
                              scaleX: shadowScale,
                              scaleY: shadowScale,
                              child: Container(
                                width: 150,
                                height: 14,
                                decoration: BoxDecoration(
                                  borderRadius: BorderRadius.circular(100),
                                  boxShadow: [
                                    BoxShadow(
                                      color: Colors.black.withValues(alpha: (0.12 * shadowScale).clamp(0.04, 0.2)),
                                      blurRadius: 10,
                                      spreadRadius: 2,
                                    ),
                                  ],
                                ),
                              ),
                            ),
                          ],
                        );
                      },
                    ),
                  ),

                  const SizedBox(height: 20),

                  // Role Terminal Badge
                  Container(
                    margin: const EdgeInsets.only(bottom: 8),
                    padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 3),
                    decoration: BoxDecoration(
                      color: AppTheme.getBadgeBgForRole(role),
                      borderRadius: BorderRadius.circular(6),
                      border: Border.all(color: rolePrimary.withValues(alpha: 0.25)),
                    ),
                    child: Row(
                      mainAxisSize: MainAxisSize.min,
                      children: [
                        Container(
                          width: 7,
                          height: 7,
                          decoration: BoxDecoration(
                            color: rolePrimary,
                            shape: BoxShape.circle,
                          ),
                        ),
                        const SizedBox(width: 6),
                        Text(
                          '${role.displayName} Terminal',
                          style: TextStyle(
                            fontSize: 10.5,
                            fontWeight: FontWeight.w800,
                            color: AppTheme.getBadgeTextForRole(role),
                            letterSpacing: 0.5,
                          ),
                        ),
                      ],
                    ),
                  ),

                  // Headline
                  Text(
                    'This feature is under process',
                    textAlign: TextAlign.center,
                    style: TextStyle(
                      fontSize: 22,
                      fontWeight: FontWeight.w900,
                      color: rolePrimary == const Color(0xFF0F172A)
                          ? const Color(0xFF0F172A)
                          : rolePrimary,
                      letterSpacing: -0.3,
                    ),
                  ),

                  const SizedBox(height: 24),

                  // Interactive Coffee Speed Booster Button
                  ConstrainedBox(
                    constraints: const BoxConstraints(maxWidth: 380),
                    child: SizedBox(
                      width: double.infinity,
                      child: Container(
                        decoration: BoxDecoration(
                          gradient: LinearGradient(
                            colors: _coffeeCount == 0
                                ? roleGradient
                                : [roleAccent, rolePrimary],
                          ),
                          borderRadius: BorderRadius.circular(12),
                          boxShadow: [
                            BoxShadow(
                              color: rolePrimary.withValues(alpha: 0.35),
                              blurRadius: 10,
                              offset: const Offset(0, 3),
                            ),
                          ],
                        ),
                        child: ElevatedButton.icon(
                          style: ElevatedButton.styleFrom(
                            backgroundColor: Colors.transparent,
                            shadowColor: Colors.transparent,
                            foregroundColor: Colors.white,
                            padding: const EdgeInsets.symmetric(vertical: 14),
                            shape: RoundedRectangleBorder(
                              borderRadius: BorderRadius.circular(12),
                            ),
                          ),
                          icon: const Text('☕', style: TextStyle(fontSize: 18)),
                          label: Text(
                            _coffeeCount == 0
                                ? 'Fuel Android Bot with Coffee (Boost Speed!)'
                                : 'Fuel More Coffee! (Speed: ${speedMultiplier.toStringAsFixed(1)}x ⚡)',
                            style: const TextStyle(fontWeight: FontWeight.w800, fontSize: 13),
                          ),
                          onPressed: _giveCoffee,
                        ),
                      ),
                    ),
                  ),

                  const SizedBox(height: 12),

                  // Back to Dashboard Button
                  if (widget.onGoHome != null)
                    ConstrainedBox(
                      constraints: const BoxConstraints(maxWidth: 380),
                      child: SizedBox(
                        width: double.infinity,
                        child: OutlinedButton.icon(
                          style: OutlinedButton.styleFrom(
                            backgroundColor: Colors.white.withValues(alpha: 0.7),
                            padding: const EdgeInsets.symmetric(vertical: 12),
                            side: BorderSide(color: rolePrimary.withValues(alpha: 0.3)),
                            shape: RoundedRectangleBorder(
                              borderRadius: BorderRadius.circular(12),
                            ),
                          ),
                          icon: Icon(Icons.home_outlined, size: 18, color: rolePrimary),
                          label: Text(
                            'Back to Home / Dashboard',
                            style: TextStyle(
                              fontWeight: FontWeight.bold,
                              fontSize: 13,
                              color: rolePrimary,
                            ),
                          ),
                          onPressed: widget.onGoHome,
                        ),
                      ),
                    ),

                  const SizedBox(height: 16),
                ],
              ),
            ),
          ),
        ),
      ),
    );
  }
}

class _BubbleTrianglePainter extends CustomPainter {
  final Color borderColor;

  _BubbleTrianglePainter({this.borderColor = const Color(0xFFE2E8F0)});

  @override
  void paint(Canvas canvas, Size size) {
    final paint = Paint()
      ..color = Colors.white
      ..style = PaintingStyle.fill;

    final borderPaint = Paint()
      ..color = borderColor
      ..style = PaintingStyle.stroke
      ..strokeWidth = 1.2;

    final path = Path()
      ..moveTo(0, 0)
      ..lineTo(size.width / 2, size.height)
      ..lineTo(size.width, 0)
      ..close();

    canvas.drawPath(path, paint);
    canvas.drawLine(const Offset(0, 0), Offset(size.width / 2, size.height), borderPaint);
    canvas.drawLine(Offset(size.width / 2, size.height), Offset(size.width, 0), borderPaint);
  }

  @override
  bool shouldRepaint(covariant _BubbleTrianglePainter oldDelegate) =>
      oldDelegate.borderColor != borderColor;
}
