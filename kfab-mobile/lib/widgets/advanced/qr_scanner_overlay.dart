import 'package:flutter/material.dart';
import '../../core/config/app_theme.dart';

class QrScannerOverlay extends StatefulWidget {
  final VoidCallback onScanSimulated;

  const QrScannerOverlay({super.key, required this.onScanSimulated});

  @override
  State<QrScannerOverlay> createState() => _QrScannerOverlayState();
}

class _QrScannerOverlayState extends State<QrScannerOverlay>
    with SingleTickerProviderStateMixin {
  late AnimationController _animationController;

  @override
  void initState() {
    super.initState();
    _animationController = AnimationController(
      vsync: this,
      duration: const Duration(seconds: 2),
    )..repeat(reverse: true);
  }

  @override
  void dispose() {
    _animationController.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    return Stack(
      children: [
        // Darkened background with cutout
        ColorFiltered(
          colorFilter: ColorFilter.mode(
            Colors.black.withValues(alpha: 0.65),
            BlendMode.srcOut,
          ),
          child: Stack(
            fit: StackFit.expand,
            children: [
              Container(
                decoration: const BoxDecoration(
                  color: Colors.black,
                  backgroundBlendMode: BlendMode.dstOut,
                ),
              ),
              Align(
                alignment: Alignment.center,
                child: Container(
                  height: 250,
                  width: 250,
                  decoration: BoxDecoration(
                    color: Colors.red,
                    borderRadius: BorderRadius.circular(16),
                  ),
                ),
              ),
            ],
          ),
        ),

        // Corner framing guides
        Center(
          child: Container(
            height: 250,
            width: 250,
            decoration: BoxDecoration(
              borderRadius: BorderRadius.circular(16),
              border: Border.all(color: Colors.white70, width: 1.5),
            ),
            child: Stack(
              children: [
                // Animated Laser Scanner Line
                AnimatedBuilder(
                  animation: _animationController,
                  builder: (context, _) {
                    return Positioned(
                      top: _animationController.value * 230 + 10,
                      left: 10,
                      right: 10,
                      child: Container(
                        height: 2.5,
                        decoration: BoxDecoration(
                          color: AppTheme.primaryBlue,
                          boxShadow: [
                            BoxShadow(
                              color: AppTheme.primaryBlue.withValues(alpha: 0.8),
                              blurRadius: 8,
                              spreadRadius: 2,
                            ),
                          ],
                        ),
                      ),
                    );
                  },
                ),
              ],
            ),
          ),
        ),

        // Helper instruction text
        Positioned(
          bottom: 100,
          left: 20,
          right: 20,
          child: Column(
            children: [
              const Text(
                'Align Material QR Code or Barcode inside the frame',
                style: TextStyle(
                  color: Colors.white,
                  fontSize: 13,
                  fontWeight: FontWeight.bold,
                  letterSpacing: 0.3,
                ),
                textAlign: TextAlign.center,
              ),
              const SizedBox(height: 16),
              ElevatedButton.icon(
                style: ElevatedButton.styleFrom(
                  backgroundColor: AppTheme.primaryBlue,
                  foregroundColor: Colors.white,
                  padding: const EdgeInsets.symmetric(horizontal: 20, vertical: 12),
                ),
                onPressed: widget.onScanSimulated,
                icon: const Icon(Icons.qr_code_scanner, size: 18),
                label: const Text('SIMULATE MATERIAL SCAN'),
              ),
            ],
          ),
        ),
      ],
    );
  }
}
