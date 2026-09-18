import 'package:flutter/material.dart';
import '../../core/config/app_theme.dart';

enum ChipTone { success, danger, warning, info, neutral }

class StatusChip extends StatelessWidget {
  final String label;
  final ChipTone tone;
  final IconData? icon;

  const StatusChip({
    super.key,
    required this.label,
    this.tone = ChipTone.neutral,
    this.icon,
  });

  @override
  Widget build(BuildContext context) {
    Color bgColor;
    Color fgColor;

    switch (tone) {
      case ChipTone.success:
        bgColor = AppTheme.successEmerald.withValues(alpha: 0.12);
        fgColor = const Color(0xFF047857);
        break;
      case ChipTone.danger:
        bgColor = AppTheme.dangerCrimson.withValues(alpha: 0.12);
        fgColor = const Color(0xFFB91C1C);
        break;
      case ChipTone.warning:
        bgColor = AppTheme.warningAmber.withValues(alpha: 0.12);
        fgColor = const Color(0xFFB45309);
        break;
      case ChipTone.info:
        bgColor = AppTheme.primaryBlue.withValues(alpha: 0.12);
        fgColor = const Color(0xFF1D4ED8);
        break;
      case ChipTone.neutral:
        bgColor = const Color(0xFFF1F5F9);
        fgColor = const Color(0xFF475569);
        break;
    }

    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
      decoration: BoxDecoration(
        color: bgColor,
        borderRadius: BorderRadius.circular(6),
      ),
      child: Row(
        mainAxisSize: MainAxisSize.min,
        children: [
          if (icon != null) ...[
            Icon(icon, size: 12, color: fgColor),
            const SizedBox(width: 4),
          ],
          Text(
            label,
            style: TextStyle(
              fontSize: 11,
              fontWeight: FontWeight.bold,
              color: fgColor,
              letterSpacing: 0.3,
            ),
          ),
        ],
      ),
    );
  }
}
