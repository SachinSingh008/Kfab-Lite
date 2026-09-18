import 'package:flutter/material.dart';
import '../../core/config/app_theme.dart';
import '../../core/models/stock_item.dart';
import '../../core/state/mobile_store.dart';
import '../../widgets/advanced/qr_scanner_overlay.dart';
import '../../widgets/common/status_chip.dart';

class QrScannerScreen extends StatefulWidget {
  final MobileStore store;
  final void Function(String materialCode)? onSelectMaterialForUsage;

  const QrScannerScreen({
    super.key,
    required this.store,
    this.onSelectMaterialForUsage,
  });

  @override
  State<QrScannerScreen> createState() => _QrScannerScreenState();
}

class _QrScannerScreenState extends State<QrScannerScreen> {
  bool _isTorchOn = false;

  void _onMaterialDetected(StockItem item) {
    showModalBottomSheet(
      context: context,
      shape: const RoundedRectangleBorder(
        borderRadius: BorderRadius.vertical(top: Radius.circular(16)),
      ),
      builder: (ctx) {
        return Padding(
          padding: const EdgeInsets.all(20),
          child: Column(
            mainAxisSize: MainAxisSize.min,
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Row(
                mainAxisAlignment: MainAxisAlignment.spaceBetween,
                children: [
                  StatusChip(
                    label: item.isLow ? 'CRITICAL LOW' : 'IN STOCK',
                    tone: item.isLow ? ChipTone.danger : ChipTone.success,
                    icon: item.isLow ? Icons.warning_amber_rounded : Icons.check_circle,
                  ),
                  Text(
                    item.code,
                    style: const TextStyle(fontSize: 12, fontWeight: FontWeight.bold, color: AppTheme.textMuted),
                  ),
                ],
              ),
              const SizedBox(height: 10),
              Text(
                item.name,
                style: const TextStyle(fontSize: 16, fontWeight: FontWeight.bold, color: AppTheme.slateDark),
              ),
              const SizedBox(height: 2),
              Text(
                'Spec: ${item.spec} • Category: ${item.category}',
                style: const TextStyle(fontSize: 12, color: AppTheme.textMuted),
              ),
              const SizedBox(height: 16),
              Container(
                padding: const EdgeInsets.all(12),
                decoration: BoxDecoration(
                  color: const Color(0xFFF8FAFC),
                  borderRadius: BorderRadius.circular(10),
                  border: Border.all(color: AppTheme.slateSubtle),
                ),
                child: Row(
                  mainAxisAlignment: MainAxisAlignment.spaceBetween,
                  children: [
                    const Text('Available Stock Balance:', style: TextStyle(fontSize: 13, fontWeight: FontWeight.w600)),
                    Text(
                      '${item.currentStock.toStringAsFixed(2)} ${item.unit}',
                      style: TextStyle(
                        fontSize: 16,
                        fontWeight: FontWeight.bold,
                        color: item.isLow ? AppTheme.dangerCrimson : const Color(0xFF047857),
                      ),
                    ),
                  ],
                ),
              ),
              const SizedBox(height: 20),
              SizedBox(
                width: double.infinity,
                child: ElevatedButton.icon(
                  style: ElevatedButton.styleFrom(
                    backgroundColor: AppTheme.primaryBlue,
                    foregroundColor: Colors.white,
                    padding: const EdgeInsets.symmetric(vertical: 12),
                  ),
                  onPressed: () {
                    Navigator.pop(ctx);
                    widget.onSelectMaterialForUsage?.call(item.code);
                  },
                  icon: const Icon(Icons.handyman_outlined, size: 18),
                  label: const Text('LOG USAGE FOR THIS MATERIAL', style: TextStyle(fontWeight: FontWeight.bold)),
                ),
              ),
            ],
          ),
        );
      },
    );
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: Colors.black,
      appBar: AppBar(
        backgroundColor: Colors.transparent,
        title: const Text('Material QR Scanner'),
        actions: [
          IconButton(
            icon: Icon(_isTorchOn ? Icons.flash_on : Icons.flash_off),
            onPressed: () => setState(() => _isTorchOn = !_isTorchOn),
          ),
        ],
      ),
      body: Stack(
        children: [
          QrScannerOverlay(
            onScanSimulated: () {
              final sampleItem = widget.store.stockItems.isNotEmpty
                  ? widget.store.stockItems[0]
                  : const StockItem(
                      code: 'STL-PL-12',
                      name: 'MS Plate 12mm IS 2062',
                      category: 'Raw Steel',
                      spec: 'E250 Gr A, 2500x12000',
                      unit: 'TON',
                      currentStock: 3.50,
                      minStock: 5.00,
                    );
              _onMaterialDetected(sampleItem);
            },
          ),
        ],
      ),
    );
  }
}
