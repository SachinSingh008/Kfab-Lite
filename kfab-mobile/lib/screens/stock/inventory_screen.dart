import 'package:flutter/material.dart';
import '../../core/models/stock_item.dart';
import '../../core/state/mobile_store.dart';
import '../../widgets/common/status_chip.dart';

class InventoryScreen extends StatefulWidget {
  final MobileStore store;
  final VoidCallback? onOpenScanner;

  const InventoryScreen({
    super.key,
    required this.store,
    this.onOpenScanner,
  });

  @override
  State<InventoryScreen> createState() => _InventoryScreenState();
}

class _InventoryScreenState extends State<InventoryScreen> {
  String _searchQuery = '';
  String _selectedCategory = 'ALL';

  // Live data only — populated from Supabase via MobileStore
  List<StockItem> get _combinedItems => widget.store.stockItems;

  void _showLogUsageSheet(StockItem item) {
    double qty = 5.0;
    String bay = 'Bay 1 - Heavy Fitup';
    final qtyCtrl = TextEditingController(text: '5.0');

    showModalBottomSheet(
      context: context,
      isScrollControlled: true,
      backgroundColor: Colors.white,
      shape: const RoundedRectangleBorder(
        borderRadius: BorderRadius.vertical(top: Radius.circular(20)),
      ),
      builder: (ctx) {
        return Padding(
          padding: EdgeInsets.only(
            left: 20,
            right: 20,
            top: 20,
            bottom: MediaQuery.of(ctx).viewInsets.bottom + 24,
          ),
          child: Column(
            mainAxisSize: MainAxisSize.min,
            crossAxisAlignment: CrossAxisAlignment.stretch,
            children: [
              Row(
                mainAxisAlignment: MainAxisAlignment.spaceBetween,
                children: [
                  Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Text(
                        'Issue Material to Floor',
                        style: const TextStyle(fontSize: 16, fontWeight: FontWeight.bold, color: Color(0xFF0F172A)),
                      ),
                      Text(
                        '${item.code} • ${item.name}',
                        style: const TextStyle(fontSize: 11, color: Color(0xFF64748B)),
                      ),
                    ],
                  ),
                  IconButton(
                    icon: const Icon(Icons.close, size: 20),
                    onPressed: () => Navigator.pop(ctx),
                  ),
                ],
              ),
              const SizedBox(height: 16),
              const Text(
                'WORK BAY DESTINATION',
                style: TextStyle(fontSize: 11, fontWeight: FontWeight.w700, color: Color(0xFF64748B)),
              ),
              const SizedBox(height: 6),
              DropdownButtonFormField<String>(
                initialValue: bay,
                items: const [
                  DropdownMenuItem(value: 'Bay 1 - Heavy Fitup', child: Text('Bay 1 - Heavy Girder Fitup')),
                  DropdownMenuItem(value: 'Bay 2 - SAW Welding', child: Text('Bay 2 - SAW Submerged Arc')),
                  DropdownMenuItem(value: 'Bay 3 - Shot Blasting', child: Text('Bay 3 - Shot Blasting & Primer')),
                  DropdownMenuItem(value: 'Erection Site A', child: Text('Erection Site A (Chakan Works)')),
                ],
                onChanged: (v) {
                  if (v != null) bay = v;
                },
                decoration: InputDecoration(
                  border: OutlineInputBorder(borderRadius: BorderRadius.circular(10)),
                  contentPadding: const EdgeInsets.symmetric(horizontal: 12, vertical: 10),
                ),
              ),
              const SizedBox(height: 14),
              Text(
                'QUANTITY TO ISSUE (${item.unit})',
                style: const TextStyle(fontSize: 11, fontWeight: FontWeight.w700, color: Color(0xFF64748B)),
              ),
              const SizedBox(height: 6),
              TextField(
                controller: qtyCtrl,
                keyboardType: const TextInputType.numberWithOptions(decimal: true),
                onChanged: (v) => qty = double.tryParse(v) ?? qty,
                decoration: InputDecoration(
                  border: OutlineInputBorder(borderRadius: BorderRadius.circular(10)),
                  contentPadding: const EdgeInsets.symmetric(horizontal: 12, vertical: 10),
                  suffixText: item.unit,
                ),
              ),
              const SizedBox(height: 20),
              ElevatedButton.icon(
                style: ElevatedButton.styleFrom(
                  backgroundColor: const Color(0xFF0F172A),
                  foregroundColor: Colors.white,
                  padding: const EdgeInsets.symmetric(vertical: 14),
                  shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(10)),
                ),
                onPressed: () {
                  widget.store.logUsage(
                    materialCode: item.code,
                    quantity: qty,
                    workBay: bay,
                  );
                  Navigator.pop(ctx);
                  ScaffoldMessenger.of(context).showSnackBar(
                    SnackBar(
                      content: Text('Issued $qty ${item.unit} of ${item.code} to $bay.'),
                      backgroundColor: const Color(0xFF16A34A),
                    ),
                  );
                },
                icon: const Icon(Icons.check, size: 18),
                label: const Text('CONFIRM FLOOR ISSUE', style: TextStyle(fontWeight: FontWeight.bold)),
              ),
            ],
          ),
        );
      },
    );
  }

  @override
  Widget build(BuildContext context) {
    return ListenableBuilder(
      listenable: widget.store,
      builder: (context, _) {
        final items = _combinedItems.where((i) {
          final matchesQuery = i.name.toLowerCase().contains(_searchQuery.toLowerCase()) ||
              i.code.toLowerCase().contains(_searchQuery.toLowerCase()) ||
              i.category.toLowerCase().contains(_searchQuery.toLowerCase());
          final matchesCategory = _selectedCategory == 'ALL' ||
              i.category.toLowerCase().contains(_selectedCategory.toLowerCase());
          return matchesQuery && matchesCategory;
        }).toList();

        final lowCount = _combinedItems.where((i) => i.isLow).length;

        return Scaffold(
          backgroundColor: Colors.transparent,
          body: Column(
            children: [
              // Top KPI Metrics Bar
              Padding(
                padding: const EdgeInsets.fromLTRB(16, 12, 16, 6),
                child: Row(
                  children: [
                    Expanded(
                      child: Container(
                        padding: const EdgeInsets.all(12),
                        decoration: BoxDecoration(
                          color: Colors.white,
                          borderRadius: BorderRadius.circular(12),
                          border: Border.all(color: const Color(0xFFE2E8F0)),
                        ),
                        child: Column(
                          crossAxisAlignment: CrossAxisAlignment.start,
                          children: [
                            const Text('STOCK CATALOG', style: TextStyle(fontSize: 10, fontWeight: FontWeight.bold, color: Color(0xFF64748B))),
                            const SizedBox(height: 2),
                            Text('${_combinedItems.length} Materials', style: const TextStyle(fontSize: 16, fontWeight: FontWeight.w900, color: Color(0xFF0F172A))),
                          ],
                        ),
                      ),
                    ),
                    const SizedBox(width: 10),
                    Expanded(
                      child: Container(
                        padding: const EdgeInsets.all(12),
                        decoration: BoxDecoration(
                          color: lowCount > 0 ? const Color(0xFFFEF2F2) : Colors.white,
                          borderRadius: BorderRadius.circular(12),
                          border: Border.all(color: lowCount > 0 ? const Color(0xFFFECACA) : const Color(0xFFE2E8F0)),
                        ),
                        child: Column(
                          crossAxisAlignment: CrossAxisAlignment.start,
                          children: [
                            Text(
                              'REORDER ALERTS',
                              style: TextStyle(
                                fontSize: 10,
                                fontWeight: FontWeight.bold,
                                color: lowCount > 0 ? const Color(0xFFDC2626) : const Color(0xFF64748B),
                              ),
                            ),
                            const SizedBox(height: 2),
                            Text(
                              '$lowCount Items Low',
                              style: TextStyle(
                                fontSize: 16,
                                fontWeight: FontWeight.w900,
                                color: lowCount > 0 ? const Color(0xFFDC2626) : const Color(0xFF16A34A),
                              ),
                            ),
                          ],
                        ),
                      ),
                    ),
                  ],
                ),
              ),

              // Search Bar & Scanner Action
              Padding(
                padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 6),
                child: Row(
                  children: [
                    Expanded(
                      child: Container(
                        height: 42,
                        decoration: BoxDecoration(
                          color: Colors.white,
                          borderRadius: BorderRadius.circular(10),
                          border: Border.all(color: const Color(0xFFCBD5E1)),
                        ),
                        child: TextField(
                          onChanged: (v) => setState(() => _searchQuery = v),
                          style: const TextStyle(fontSize: 13),
                          decoration: const InputDecoration(
                            hintText: 'Search steel, plates, beams, welding rods...',
                            hintStyle: TextStyle(fontSize: 12, color: Color(0xFF94A3B8)),
                            prefixIcon: Icon(Icons.search, size: 18, color: Color(0xFF64748B)),
                            border: InputBorder.none,
                            contentPadding: EdgeInsets.symmetric(vertical: 11),
                          ),
                        ),
                      ),
                    ),
                    if (widget.onOpenScanner != null) ...[
                      const SizedBox(width: 8),
                      IconButton(
                        style: IconButton.styleFrom(
                          backgroundColor: Colors.white,
                          shape: RoundedRectangleBorder(
                            borderRadius: BorderRadius.circular(10),
                            side: const BorderSide(color: Color(0xFFCBD5E1)),
                          ),
                          fixedSize: const Size(42, 42),
                        ),
                        onPressed: widget.onOpenScanner,
                        icon: const Icon(Icons.qr_code_scanner, size: 20, color: Color(0xFF0F172A)),
                        tooltip: 'Scan Material QR',
                      ),
                    ],
                  ],
                ),
              ),

              // Category Pills
              SingleChildScrollView(
                scrollDirection: Axis.horizontal,
                padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 4),
                child: Row(
                  children: [
                    _buildCategoryChip('ALL', 'All'),
                    _buildCategoryChip('Steel', 'Plates & Beams'),
                    _buildCategoryChip('Consumables', 'Welding & Gas'),
                    _buildCategoryChip('Fasteners', 'Bolts & Nuts'),
                    _buildCategoryChip('Paints', 'Coatings'),
                  ],
                ),
              ),
              const SizedBox(height: 4),

              // Materials List
              Expanded(
                child: ListView.builder(
                  padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 6),
                  itemCount: items.length,
                  itemBuilder: (context, idx) {
                    final item = items[idx];
                    final isLow = item.isLow;

                    return Container(
                      margin: const EdgeInsets.only(bottom: 10),
                      padding: const EdgeInsets.all(14),
                      decoration: BoxDecoration(
                        color: Colors.white,
                        borderRadius: BorderRadius.circular(12),
                        border: Border.all(
                          color: isLow ? const Color(0xFFFECACA) : const Color(0xFFE2E8F0),
                        ),
                        boxShadow: [
                          BoxShadow(
                            color: Colors.black.withValues(alpha: 0.02),
                            blurRadius: 6,
                            offset: const Offset(0, 2),
                          ),
                        ],
                      ),
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          Row(
                            mainAxisAlignment: MainAxisAlignment.spaceBetween,
                            children: [
                              Container(
                                padding: const EdgeInsets.symmetric(horizontal: 6, vertical: 2),
                                decoration: BoxDecoration(
                                  color: const Color(0xFFF1F5F9),
                                  borderRadius: BorderRadius.circular(4),
                                  border: Border.all(color: const Color(0xFFCBD5E1), width: 0.6),
                                ),
                                child: Text(
                                  item.code,
                                  style: const TextStyle(fontSize: 11, fontWeight: FontWeight.bold, fontFamily: 'monospace', color: Color(0xFF0F172A)),
                                ),
                              ),
                              StatusChip(
                                label: isLow ? 'LOW STOCK' : 'SAFE LEVEL',
                                tone: isLow ? ChipTone.danger : ChipTone.success,
                              ),
                            ],
                          ),
                          const SizedBox(height: 8),
                          Text(
                            item.name,
                            style: const TextStyle(fontSize: 14, fontWeight: FontWeight.bold, color: Color(0xFF0F172A)),
                          ),
                          const SizedBox(height: 2),
                          Text(
                            item.spec,
                            style: const TextStyle(fontSize: 11, color: Color(0xFF64748B)),
                          ),
                          const SizedBox(height: 12),
                          Row(
                            mainAxisAlignment: MainAxisAlignment.spaceBetween,
                            children: [
                              Column(
                                crossAxisAlignment: CrossAxisAlignment.start,
                                children: [
                                  const Text('CURRENT BALANCE', style: TextStyle(fontSize: 9.5, fontWeight: FontWeight.bold, color: Color(0xFF94A3B8))),
                                  const SizedBox(height: 1),
                                  Text(
                                    '${item.currentStock} ${item.unit}',
                                    style: TextStyle(
                                      fontSize: 16,
                                      fontWeight: FontWeight.w900,
                                      color: isLow ? const Color(0xFFDC2626) : const Color(0xFF0F172A),
                                    ),
                                  ),
                                ],
                              ),
                              ElevatedButton.icon(
                                style: ElevatedButton.styleFrom(
                                  backgroundColor: const Color(0xFF0F172A),
                                  foregroundColor: Colors.white,
                                  elevation: 0,
                                  padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 8),
                                  shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(8)),
                                ),
                                onPressed: () => _showLogUsageSheet(item),
                                icon: const Icon(Icons.outbox_rounded, size: 15),
                                label: const Text('ISSUE TO BAY', style: TextStyle(fontSize: 11, fontWeight: FontWeight.bold)),
                              ),
                            ],
                          ),
                        ],
                      ),
                    );
                  },
                ),
              ),
            ],
          ),
        );
      },
    );
  }

  Widget _buildCategoryChip(String key, String title) {
    final isSelected = _selectedCategory == key;

    return Padding(
      padding: const EdgeInsets.only(right: 6),
      child: FilterChip(
        label: Text(title),
        selected: isSelected,
        onSelected: (_) => setState(() => _selectedCategory = key),
        backgroundColor: Colors.white,
        selectedColor: const Color(0xFF0F172A),
        labelStyle: TextStyle(
          fontSize: 11,
          fontWeight: FontWeight.bold,
          color: isSelected ? Colors.white : const Color(0xFF475569),
        ),
        padding: const EdgeInsets.symmetric(horizontal: 4, vertical: 0),
        shape: RoundedRectangleBorder(
          borderRadius: BorderRadius.circular(8),
          side: BorderSide(color: isSelected ? const Color(0xFF0F172A) : const Color(0xFFE2E8F0)),
        ),
        showCheckmark: false,
      ),
    );
  }
}
