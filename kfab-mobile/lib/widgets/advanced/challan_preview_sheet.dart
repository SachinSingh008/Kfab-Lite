import 'package:flutter/material.dart';
import '../../core/config/app_theme.dart';
import '../../core/models/challan_attachment.dart';
import '../common/kfab_button.dart';

class ChallanPreviewSheet extends StatefulWidget {
  final void Function(ChallanAttachment) onConfirmAttachment;

  const ChallanPreviewSheet({super.key, required this.onConfirmAttachment});

  @override
  State<ChallanPreviewSheet> createState() => _ChallanPreviewSheetState();
}

class _ChallanPreviewSheetState extends State<ChallanPreviewSheet> {
  final _vendorController = TextEditingController(text: 'Tata Steel BSL Ltd');
  final _challanNoController = TextEditingController(text: 'CH-2026-904');
  final _vehicleController = TextEditingController(text: 'MH-12-RN-8812');
  final _weightController = TextEditingController(text: '24.50');
  final _descController = TextEditingController(text: 'MS Plate 20mm IS 2062');

  @override
  void dispose() {
    _vendorController.dispose();
    _challanNoController.dispose();
    _vehicleController.dispose();
    _weightController.dispose();
    _descController.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    return Padding(
      padding: EdgeInsets.only(
        left: 20,
        right: 20,
        top: 20,
        bottom: MediaQuery.of(context).viewInsets.bottom + 24,
      ),
      child: SingleChildScrollView(
        child: Column(
          mainAxisSize: MainAxisSize.min,
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Row(
              mainAxisAlignment: MainAxisAlignment.spaceBetween,
              children: [
                const Text(
                  'Document Inward Delivery Challan',
                  style: TextStyle(
                    fontSize: 16,
                    fontWeight: FontWeight.bold,
                    color: AppTheme.slateDark,
                  ),
                ),
                IconButton(
                  icon: const Icon(Icons.close, size: 20),
                  onPressed: () => Navigator.pop(context),
                ),
              ],
            ),
            const SizedBox(height: 14),

            // Simulated Camera Preview Thumbnail
            Container(
              height: 130,
              width: double.infinity,
              decoration: BoxDecoration(
                color: const Color(0xFFF1F5F9),
                borderRadius: BorderRadius.circular(10),
                border: Border.all(color: AppTheme.slateSubtle),
              ),
              child: Stack(
                children: [
                  Center(
                    child: Column(
                      mainAxisAlignment: MainAxisAlignment.center,
                      children: const [
                        Icon(Icons.receipt_long, size: 40, color: AppTheme.primaryBlue),
                        SizedBox(height: 6),
                        Text(
                          'Delivery Challan Photo Captured (Compressed 240 KB)',
                          style: TextStyle(fontSize: 11, color: AppTheme.textMuted),
                        ),
                      ],
                    ),
                  ),
                  Positioned(
                    top: 8,
                    right: 8,
                    child: Container(
                      padding: const EdgeInsets.symmetric(horizontal: 6, vertical: 2),
                      decoration: BoxDecoration(
                        color: Colors.black87,
                        borderRadius: BorderRadius.circular(4),
                      ),
                      child: const Text(
                        'RAW PHOTO',
                        style: TextStyle(color: Colors.white, fontSize: 9, fontWeight: FontWeight.bold),
                      ),
                    ),
                  ),
                ],
              ),
            ),

            const SizedBox(height: 14),

            // Metadata Form Fields
            TextField(
              controller: _vendorController,
              style: const TextStyle(fontSize: 13),
              decoration: const InputDecoration(
                labelText: 'Supplier / Vendor Name',
                isDense: true,
                border: OutlineInputBorder(),
              ),
            ),
            const SizedBox(height: 10),
            Row(
              children: [
                Expanded(
                  child: TextField(
                    controller: _challanNoController,
                    style: const TextStyle(fontSize: 13),
                    decoration: const InputDecoration(
                      labelText: 'Challan Number',
                      isDense: true,
                      border: OutlineInputBorder(),
                    ),
                  ),
                ),
                const SizedBox(width: 10),
                Expanded(
                  child: TextField(
                    controller: _vehicleController,
                    style: const TextStyle(fontSize: 13),
                    decoration: const InputDecoration(
                      labelText: 'Vehicle Number',
                      isDense: true,
                      border: OutlineInputBorder(),
                    ),
                  ),
                ),
              ],
            ),
            const SizedBox(height: 10),
            Row(
              children: [
                Expanded(
                  flex: 2,
                  child: TextField(
                    controller: _descController,
                    style: const TextStyle(fontSize: 13),
                    decoration: const InputDecoration(
                      labelText: 'Material Description',
                      isDense: true,
                      border: OutlineInputBorder(),
                    ),
                  ),
                ),
                const SizedBox(width: 10),
                Expanded(
                  child: TextField(
                    controller: _weightController,
                    keyboardType: TextInputType.number,
                    style: const TextStyle(fontSize: 13),
                    decoration: const InputDecoration(
                      labelText: 'Weight (TON)',
                      isDense: true,
                      border: OutlineInputBorder(),
                    ),
                  ),
                ),
              ],
            ),

            const SizedBox(height: 20),

            SizedBox(
              width: double.infinity,
              child: KfabButton(
                text: 'CONFIRM & QUEUE UPLOAD',
                icon: Icons.cloud_upload_outlined,
                onPressed: () {
                  final attachment = ChallanAttachment(
                    id: 'CHAL-${DateTime.now().millisecondsSinceEpoch}',
                    vendorName: _vendorController.text.trim(),
                    challanNumber: _challanNoController.text.trim(),
                    vehicleNumber: _vehicleController.text.trim(),
                    materialDescription: _descController.text.trim(),
                    netWeight: double.tryParse(_weightController.text) ?? 1.0,
                    unit: 'TON',
                    imagePath: 'local/storage/challan_preview.jpg',
                    capturedAt: DateTime.now(),
                    isUploaded: false,
                  );
                  widget.onConfirmAttachment(attachment);
                  Navigator.pop(context);
                },
              ),
            ),
          ],
        ),
      ),
    );
  }
}
