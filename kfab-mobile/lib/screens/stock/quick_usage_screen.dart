import 'package:flutter/material.dart';
import '../../core/config/app_theme.dart';
import '../../core/state/mobile_store.dart';
import '../../widgets/common/kfab_button.dart';
import '../../widgets/common/status_chip.dart';

class QuickUsageScreen extends StatefulWidget {
  final MobileStore store;

  const QuickUsageScreen({super.key, required this.store});

  @override
  State<QuickUsageScreen> createState() => _QuickUsageScreenState();
}

class _QuickUsageScreenState extends State<QuickUsageScreen> {
  String? _selectedMaterialCode;
  double _quantity = 10.0;
  String _selectedWorkBay = 'Bay 2 (Fabrication)';
  final _qtyController = TextEditingController(text: '10');

  @override
  void initState() {
    super.initState();
    if (widget.store.stockItems.isNotEmpty) {
      _selectedMaterialCode = widget.store.stockItems.first.code;
    }
  }

  @override
  void dispose() {
    _qtyController.dispose();
    super.dispose();
  }

  void _addQuantity(double delta) {
    setState(() {
      _quantity = (_quantity + delta).clamp(0.1, 10000.0);
      _qtyController.text = _quantity.toStringAsFixed(1);
    });
  }

  void _submitUsage() {
    if (_selectedMaterialCode == null) return;

    final success = widget.store.logUsage(
      materialCode: _selectedMaterialCode!,
      quantity: _quantity,
      workBay: _selectedWorkBay,
    );

    if (success) {
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(
          content: Text(
            'Logged $_quantity to $_selectedWorkBay. Stock balance updated.',
          ),
          backgroundColor: AppTheme.successEmerald,
        ),
      );
      setState(() {
        _quantity = 5.0;
        _qtyController.text = '5.0';
      });
    } else {
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(
          content: Text(
            'Error: Insufficient stock available for this issue.',
          ),
          backgroundColor: AppTheme.dangerCrimson,
        ),
      );
    }
  }

  @override
  Widget build(BuildContext context) {
    return ListenableBuilder(
      listenable: widget.store,
      builder: (context, _) {
        if (widget.store.stockItems.isEmpty) {
          return Scaffold(
            backgroundColor: Colors.transparent,
            appBar: AppBar(
              backgroundColor: Colors.white.withValues(alpha: 0.9),
              title: const Text('Floor Material Usage'),
            ),
            body: const Center(
              child: Padding(
                padding: EdgeInsets.all(24.0),
                child: Column(
                  mainAxisSize: MainAxisSize.min,
                  children: [
                    Icon(Icons.inventory_2_outlined, size: 48, color: Color(0xFF94A3B8)),
                    SizedBox(height: 12),
                    Text(
                      'No Material Inventory Loaded',
                      style: TextStyle(fontSize: 16, fontWeight: FontWeight.bold, color: Color(0xFF0F172A)),
                    ),
                    SizedBox(height: 6),
                    Text(
                      'Stock ledger will populate once synchronized with the database or when inward materials are received.',
                      textAlign: TextAlign.center,
                      style: TextStyle(fontSize: 12, color: Color(0xFF64748B)),
                    ),
                  ],
                ),
              ),
            ),
          );
        }

        final items = widget.store.stockItems;
        final selectedItem = items.firstWhere(
          (s) => s.code == _selectedMaterialCode,
          orElse: () => items.first,
        );

        return Scaffold(
          backgroundColor: Colors.transparent,
          appBar: AppBar(
            backgroundColor: Colors.white.withValues(alpha: 0.9),
            title: const Text('Floor Material Usage'),
          ),
          body: SingleChildScrollView(
            padding: const EdgeInsets.all(16),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                // Top Material Selector Card
                Container(
                  padding: const EdgeInsets.all(16),
                  decoration: BoxDecoration(
                    color: Colors.white,
                    borderRadius: BorderRadius.circular(14),
                    border: Border.all(color: AppTheme.slateSubtle),
                  ),
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      const Text(
                        'Select Material Item',
                        style: TextStyle(
                          fontSize: 12,
                          fontWeight: FontWeight.bold,
                          color: AppTheme.textMuted,
                        ),
                      ),
                      const SizedBox(height: 8),
                      DropdownButtonFormField<String>(
                        initialValue: _selectedMaterialCode,
                        isExpanded: true,
                        decoration: InputDecoration(
                          filled: true,
                          fillColor: const Color(0xFFF8FAFC),
                          contentPadding: const EdgeInsets.symmetric(horizontal: 12, vertical: 8),
                          border: OutlineInputBorder(
                            borderRadius: BorderRadius.circular(10),
                            borderSide: const BorderSide(color: AppTheme.slateSubtle),
                          ),
                        ),
                        items: widget.store.stockItems.map((item) {
                          return DropdownMenuItem<String>(
                            value: item.code,
                            child: Text(
                              '${item.name} (${item.code})',
                              style: const TextStyle(fontSize: 13, fontWeight: FontWeight.w600),
                              overflow: TextOverflow.ellipsis,
                            ),
                          );
                        }).toList(),
                        onChanged: (val) {
                          setState(() => _selectedMaterialCode = val);
                        },
                      ),
                      const SizedBox(height: 14),

                      // Current Available Stock Pill
                      Container(
                        padding: const EdgeInsets.all(12),
                        decoration: BoxDecoration(
                          color: selectedItem.isLow
                              ? const Color(0xFFFEF2F2)
                              : const Color(0xFFF0FDF4),
                          borderRadius: BorderRadius.circular(10),
                          border: Border.all(
                            color: selectedItem.isLow
                                ? const Color(0xFFFECACA)
                                : const Color(0xFFBBF7D0),
                          ),
                        ),
                        child: Row(
                          mainAxisAlignment: MainAxisAlignment.spaceBetween,
                          children: [
                            Column(
                              crossAxisAlignment: CrossAxisAlignment.start,
                              children: [
                                const Text(
                                  'Current Shop Floor Balance',
                                  style: TextStyle(fontSize: 11, color: AppTheme.textMuted),
                                ),
                                const SizedBox(height: 2),
                                Text(
                                  '${selectedItem.currentStock.toStringAsFixed(2)} ${selectedItem.unit}',
                                  style: TextStyle(
                                    fontSize: 18,
                                    fontWeight: FontWeight.w900,
                                    color: selectedItem.isLow
                                        ? AppTheme.dangerCrimson
                                        : const Color(0xFF166534),
                                  ),
                                ),
                              ],
                            ),
                            StatusChip(
                              label: selectedItem.isLow ? 'LOW STOCK' : 'AVAILABLE',
                              tone: selectedItem.isLow ? ChipTone.danger : ChipTone.success,
                            ),
                          ],
                        ),
                      ),
                    ],
                  ),
                ),

                const SizedBox(height: 16),

                // Quantity & Stepper Card
                Container(
                  padding: const EdgeInsets.all(16),
                  decoration: BoxDecoration(
                    color: Colors.white,
                    borderRadius: BorderRadius.circular(14),
                    border: Border.all(color: AppTheme.slateSubtle),
                  ),
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Text(
                        'Consumption Quantity (${selectedItem.unit})',
                        style: const TextStyle(
                          fontSize: 12,
                          fontWeight: FontWeight.bold,
                          color: AppTheme.textMuted,
                        ),
                      ),
                      const SizedBox(height: 10),
                      Row(
                        children: [
                          IconButton.filled(
                            style: IconButton.styleFrom(backgroundColor: AppTheme.slateDark),
                            onPressed: () => _addQuantity(-5),
                            icon: const Icon(Icons.remove, size: 20),
                          ),
                          const SizedBox(width: 12),
                          Expanded(
                            child: TextField(
                              controller: _qtyController,
                              keyboardType: const TextInputType.numberWithOptions(decimal: true),
                              textAlign: TextAlign.center,
                              style: const TextStyle(
                                fontSize: 24,
                                fontWeight: FontWeight.bold,
                                color: AppTheme.slateDark,
                              ),
                              decoration: const InputDecoration(
                                border: InputBorder.none,
                                isDense: true,
                              ),
                              onChanged: (val) {
                                final parsed = double.tryParse(val);
                                if (parsed != null) {
                                  _quantity = parsed;
                                }
                              },
                            ),
                          ),
                          const SizedBox(width: 12),
                          IconButton.filled(
                            style: IconButton.styleFrom(backgroundColor: AppTheme.primaryBlue),
                            onPressed: () => _addQuantity(5),
                            icon: const Icon(Icons.add, size: 20),
                          ),
                        ],
                      ),
                      const SizedBox(height: 12),

                      // Quick Stepper Chips
                      Wrap(
                        spacing: 8,
                        children: [1.0, 5.0, 10.0, 25.0, 50.0].map((val) {
                          return ActionChip(
                            label: Text('+$val'),
                            labelStyle: const TextStyle(fontSize: 11, fontWeight: FontWeight.bold),
                            backgroundColor: const Color(0xFFF1F5F9),
                            onPressed: () => _addQuantity(val),
                          );
                        }).toList(),
                      ),
                    ],
                  ),
                ),

                const SizedBox(height: 16),

                // Destination Work Bay
                Container(
                  padding: const EdgeInsets.all(16),
                  decoration: BoxDecoration(
                    color: Colors.white,
                    borderRadius: BorderRadius.circular(14),
                    border: Border.all(color: AppTheme.slateSubtle),
                  ),
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      const Text(
                        'Destination Work Bay / Project',
                        style: TextStyle(
                          fontSize: 12,
                          fontWeight: FontWeight.bold,
                          color: AppTheme.textMuted,
                        ),
                      ),
                      const SizedBox(height: 8),
                      DropdownButtonFormField<String>(
                        initialValue: _selectedWorkBay,
                        decoration: InputDecoration(
                          filled: true,
                          fillColor: const Color(0xFFF8FAFC),
                          contentPadding: const EdgeInsets.symmetric(horizontal: 12, vertical: 8),
                          border: OutlineInputBorder(
                            borderRadius: BorderRadius.circular(10),
                            borderSide: const BorderSide(color: AppTheme.slateSubtle),
                          ),
                        ),
                        items: [
                          'Bay 1 (Cutting & Prep)',
                          'Bay 2 (Fabrication)',
                          'Assembly Area (Heavy Girder)',
                          'Finishing & Blasting Bay',
                        ].map((b) {
                          return DropdownMenuItem(value: b, child: Text(b, style: const TextStyle(fontSize: 13)));
                        }).toList(),
                        onChanged: (val) {
                          if (val != null) setState(() => _selectedWorkBay = val);
                        },
                      ),
                    ],
                  ),
                ),

                const SizedBox(height: 24),

                // Submit Button
                SizedBox(
                  width: double.infinity,
                  child: KfabButton(
                    text: 'RECORD SHOP FLOOR CONSUMPTION',
                    onPressed: _submitUsage,
                    icon: Icons.check,
                  ),
                ),
              ],
            ),
          ),
        );
      },
    );
  }
}
