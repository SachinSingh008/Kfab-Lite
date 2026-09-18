import 'package:flutter/material.dart';
import '../../core/config/app_theme.dart';
import '../../core/models/challan_attachment.dart';
import '../../widgets/advanced/challan_preview_sheet.dart';

class ChallanCaptureScreen extends StatefulWidget {
  const ChallanCaptureScreen({super.key});

  @override
  State<ChallanCaptureScreen> createState() => _ChallanCaptureScreenState();
}

class _ChallanCaptureScreenState extends State<ChallanCaptureScreen> {
  final List<ChallanAttachment> _attachments = [];

  void _openCaptureDialog() {
    showModalBottomSheet(
      context: context,
      isScrollControlled: true,
      shape: const RoundedRectangleBorder(
        borderRadius: BorderRadius.vertical(top: Radius.circular(16)),
      ),
      builder: (ctx) {
        return ChallanPreviewSheet(
          onConfirmAttachment: (attachment) {
            setState(() {
              _attachments.insert(0, attachment);
            });
            ScaffoldMessenger.of(context).showSnackBar(
              SnackBar(
                content: Text('Challan ${attachment.challanNumber} queued for secure upload.'),
                backgroundColor: AppTheme.successEmerald,
              ),
            );
          },
        );
      },
    );
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: const Text('Delivery Challan Capture'),
      ),
      body: Column(
        children: [
          // Header Instruction
          Container(
            width: double.infinity,
            padding: const EdgeInsets.all(16),
            color: Colors.white,
            child: Row(
              children: [
                Expanded(
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: const [
                      Text(
                        'Document Gate Deliveries',
                        style: TextStyle(fontSize: 14, fontWeight: FontWeight.bold, color: AppTheme.slateDark),
                      ),
                      SizedBox(height: 2),
                      Text(
                        'Capture clear photos of delivery challans, truck plates, and inspection slips.',
                        style: TextStyle(fontSize: 12, color: AppTheme.textMuted),
                      ),
                    ],
                  ),
                ),
                ElevatedButton.icon(
                  style: ElevatedButton.styleFrom(
                    backgroundColor: AppTheme.primaryBlue,
                    foregroundColor: Colors.white,
                  ),
                  onPressed: _openCaptureDialog,
                  icon: const Icon(Icons.camera_alt, size: 16),
                  label: const Text('Capture', style: TextStyle(fontWeight: FontWeight.bold)),
                ),
              ],
            ),
          ),

          const Divider(height: 1, color: AppTheme.slateSubtle),

          // Captured Attachments List
          Expanded(
            child: _attachments.isEmpty
                ? Center(
                    child: Column(
                      mainAxisAlignment: MainAxisAlignment.center,
                      children: [
                        Icon(Icons.photo_library_outlined, size: 48, color: Colors.grey.shade400),
                        const SizedBox(height: 12),
                        const Text(
                          'No challans documented yet today.',
                          style: TextStyle(fontSize: 14, fontWeight: FontWeight.bold, color: AppTheme.textMuted),
                        ),
                        const SizedBox(height: 4),
                        const Text(
                          'Tap [Capture] to photograph inward delivery proof.',
                          style: TextStyle(fontSize: 12, color: AppTheme.textMuted),
                        ),
                      ],
                    ),
                  )
                : ListView.builder(
                    padding: const EdgeInsets.all(16),
                    itemCount: _attachments.length,
                    itemBuilder: (context, index) {
                      final item = _attachments[index];
                      return Container(
                        margin: const EdgeInsets.only(bottom: 12),
                        padding: const EdgeInsets.all(14),
                        decoration: BoxDecoration(
                          color: Colors.white,
                          borderRadius: BorderRadius.circular(12),
                          border: Border.all(color: AppTheme.slateSubtle),
                        ),
                        child: Row(
                          children: [
                            Container(
                              width: 50,
                              height: 50,
                              decoration: BoxDecoration(
                                color: const Color(0xFFEFF6FF),
                                borderRadius: BorderRadius.circular(8),
                              ),
                              child: const Icon(Icons.receipt_long, color: AppTheme.primaryBlue),
                            ),
                            const SizedBox(width: 14),
                            Expanded(
                              child: Column(
                                crossAxisAlignment: CrossAxisAlignment.start,
                                children: [
                                  Text(
                                    '${item.vendorName} • ${item.challanNumber}',
                                    style: const TextStyle(fontSize: 13, fontWeight: FontWeight.bold),
                                  ),
                                  const SizedBox(height: 2),
                                  Text(
                                    '${item.materialDescription} (${item.netWeight} ${item.unit})',
                                    style: const TextStyle(fontSize: 12, color: AppTheme.textMuted),
                                  ),
                                  const SizedBox(height: 2),
                                  Text(
                                    'Vehicle: ${item.vehicleNumber}',
                                    style: const TextStyle(fontSize: 11, color: AppTheme.slateDark),
                                  ),
                                ],
                              ),
                            ),
                            Container(
                              padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
                              decoration: BoxDecoration(
                                color: const Color(0xFFECFDF5),
                                borderRadius: BorderRadius.circular(6),
                              ),
                              child: const Text(
                                'QUEUED',
                                style: TextStyle(
                                  fontSize: 10,
                                  fontWeight: FontWeight.bold,
                                  color: Color(0xFF047857),
                                ),
                              ),
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
  }
}
