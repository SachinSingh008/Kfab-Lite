import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import '../../core/config/app_theme.dart';

enum KfabButtonVariant { primary, secondary, danger, outline }

class KfabButton extends StatelessWidget {
  final String text;
  final VoidCallback? onPressed;
  final bool isLoading;
  final IconData? icon;
  final KfabButtonVariant variant;
  final double height;

  const KfabButton({
    super.key,
    required this.text,
    this.onPressed,
    this.isLoading = false,
    this.icon,
    this.variant = KfabButtonVariant.primary,
    this.height = 48.0,
  });

  @override
  Widget build(BuildContext context) {
    Color bgColor;
    Color fgColor;
    BorderSide borderSide = BorderSide.none;

    switch (variant) {
      case KfabButtonVariant.primary:
        bgColor = AppTheme.primaryBlue;
        fgColor = Colors.white;
        break;
      case KfabButtonVariant.secondary:
        bgColor = AppTheme.slateDark;
        fgColor = Colors.white;
        break;
      case KfabButtonVariant.danger:
        bgColor = AppTheme.dangerCrimson;
        fgColor = Colors.white;
        break;
      case KfabButtonVariant.outline:
        bgColor = Colors.transparent;
        fgColor = AppTheme.slateDark;
        borderSide = const BorderSide(color: AppTheme.slateBorder, width: 1.5);
        break;
    }

    return SizedBox(
      height: height,
      child: ElevatedButton(
        style: ElevatedButton.styleFrom(
          backgroundColor: bgColor,
          foregroundColor: fgColor,
          elevation: 0,
          side: borderSide,
          shape: RoundedRectangleBorder(
            borderRadius: BorderRadius.circular(10),
          ),
          padding: const EdgeInsets.symmetric(horizontal: 16),
        ),
        onPressed: isLoading || onPressed == null
            ? null
            : () {
                HapticFeedback.lightImpact();
                onPressed?.call();
              },
        child: isLoading
            ? SizedBox(
                width: 20,
                height: 20,
                child: CircularProgressIndicator(
                  strokeWidth: 2,
                  valueColor: AlwaysStoppedAnimation<Color>(fgColor),
                ),
              )
            : Row(
                mainAxisAlignment: MainAxisAlignment.center,
                mainAxisSize: MainAxisSize.min,
                children: [
                  if (icon != null) ...[
                    Icon(icon, size: 18),
                    const SizedBox(width: 8),
                  ],
                  Text(
                    text,
                    style: const TextStyle(
                      fontSize: 14,
                      fontWeight: FontWeight.bold,
                      letterSpacing: 0.3,
                    ),
                  ),
                ],
              ),
      ),
    );
  }
}
