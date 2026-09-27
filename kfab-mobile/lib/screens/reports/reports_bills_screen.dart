import 'package:flutter/material.dart';
import '../../core/state/auth_state.dart';

class ReportsBillsScreen extends StatefulWidget {
  final AuthState authState;

  const ReportsBillsScreen({super.key, required this.authState});

  @override
  State<ReportsBillsScreen> createState() => _ReportsBillsScreenState();
}

class _ReportsBillsScreenState extends State<ReportsBillsScreen> {
  String _selectedFilter = 'ALL';

  @override
  Widget build(BuildContext context) {
    final isAccountant = widget.authState.role == UserRole.accounts;

    return Scaffold(
      backgroundColor: Colors.transparent,
      body: isAccountant ? _buildBillsView() : _buildReportsView(),
    );
  }

  // ============================================================
  // 1. BILLS VIEW (Exclusive to Accountant)
  // ============================================================
  Widget _buildBillsView() {
    // Clean slate: Live bills fetched from Supabase / Tally integration
    final bills = <Map<String, String>>[];


    return SingleChildScrollView(
      padding: const EdgeInsets.all(16),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          // Header Card
          Container(
            padding: const EdgeInsets.all(16),
            decoration: BoxDecoration(
              gradient: const LinearGradient(
                colors: [Color(0xFF14532D), Color(0xFF16A34A)],
                begin: Alignment.topLeft,
                end: Alignment.bottomRight,
              ),
              borderRadius: BorderRadius.circular(14),
              boxShadow: [
                BoxShadow(
                  color: const Color(0xFF16A34A).withValues(alpha: 0.25),
                  blurRadius: 10,
                  offset: const Offset(0, 4),
                ),
              ],
            ),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Row(
                  mainAxisAlignment: MainAxisAlignment.spaceBetween,
                  children: [
                    const Text(
                      'Commercial Bills & Invoices',
                      style: TextStyle(color: Colors.white, fontSize: 16, fontWeight: FontWeight.bold),
                    ),
                    Container(
                      padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 3),
                      decoration: BoxDecoration(
                        color: Colors.white.withValues(alpha: 0.2),
                        borderRadius: BorderRadius.circular(6),
                      ),
                      child: const Text('Tally Bridge Ready', style: TextStyle(color: Colors.white, fontSize: 10, fontWeight: FontWeight.bold)),
                    ),
                  ],
                ),
                const SizedBox(height: 6),
                const Text(
                  '3-Way Matching reconciliation between Vendor Bills, POs, and Gate Entry Challans.',
                  style: TextStyle(color: Color(0xFFDCFCE7), fontSize: 11),
                ),
              ],
            ),
          ),
          const SizedBox(height: 14),

          // Financial KPI Strip
          Row(
            children: [
              Expanded(
                child: _buildMetricTile(
                  title: 'Matched Bills',
                  value: bills.isEmpty ? '₹ 0' : '₹ 13.9 L',
                  subtitle: bills.isEmpty ? 'No bills uploaded' : '100% Verified',
                  color: const Color(0xFF16A34A),
                ),
              ),
              const SizedBox(width: 10),
              Expanded(
                child: _buildMetricTile(
                  title: 'Pending Match',
                  value: bills.isEmpty ? '0 Bills' : '1 Bill Hold',
                  subtitle: bills.isEmpty ? 'Queue clean' : 'Action needed',
                  color: const Color(0xFFD97706),
                ),
              ),
            ],
          ),
          const SizedBox(height: 16),

          Row(
            mainAxisAlignment: MainAxisAlignment.spaceBetween,
            children: [
              const Text(
                'Recent Vendor Invoices & Challans',
                style: TextStyle(fontSize: 14, fontWeight: FontWeight.bold, color: Color(0xFF0F172A)),
              ),
              Wrap(
                spacing: 4,
                children: ['ALL', 'MATCHED', 'PENDING'].map((f) {
                  final isSelected = _selectedFilter == f;
                  return ChoiceChip(
                    label: Text(f, style: TextStyle(fontSize: 10, fontWeight: FontWeight.bold, color: isSelected ? Colors.white : const Color(0xFF475569))),
                    selected: isSelected,
                    selectedColor: const Color(0xFF16A34A),
                    backgroundColor: const Color(0xFFF1F5F9),
                    padding: const EdgeInsets.symmetric(horizontal: 4),
                    visualDensity: VisualDensity.compact,
                    onSelected: (selected) {
                      if (selected) setState(() => _selectedFilter = f);
                    },
                  );
                }).toList(),
              ),
            ],
          ),
          const SizedBox(height: 10),

          // Bills List or Empty State
          if (bills.isEmpty)
            Container(
              width: double.infinity,
              padding: const EdgeInsets.all(32),
              decoration: BoxDecoration(
                color: Colors.white,
                borderRadius: BorderRadius.circular(12),
                border: Border.all(color: const Color(0xFFE2E8F0)),
              ),
              child: Column(
                children: [
                  Icon(Icons.receipt_long_outlined, size: 48, color: Colors.grey.shade400),
                  const SizedBox(height: 12),
                  const Text('No Bills or Invoices', style: TextStyle(fontWeight: FontWeight.bold, fontSize: 14, color: Color(0xFF0F172A))),
                  const SizedBox(height: 4),
                  const Text('Vendor invoices and gate challans will sync here from Supabase.', textAlign: TextAlign.center, style: TextStyle(fontSize: 12, color: Color(0xFF64748B))),
                ],
              ),
            )
          else
            ...bills.where((b) {
              if (_selectedFilter == 'MATCHED') return b['status']!.contains('MATCHED');
              if (_selectedFilter == 'PENDING') return !b['status']!.contains('MATCHED');
              return true;
            }).map((bill) {
              final isMatched = bill['status']!.contains('MATCHED');
              return Container(
                margin: const EdgeInsets.only(bottom: 10),
                padding: const EdgeInsets.all(14),
                decoration: BoxDecoration(
                  color: Colors.white,
                  borderRadius: BorderRadius.circular(12),
                  border: Border.all(color: isMatched ? const Color(0xFFE2E8F0) : const Color(0xFFFED7AA)),
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
                        Text(
                          bill['billNo']!,
                          style: const TextStyle(fontSize: 12, fontWeight: FontWeight.bold, fontFamily: 'monospace', color: Color(0xFF0F172A)),
                        ),
                        Container(
                          padding: const EdgeInsets.symmetric(horizontal: 7, vertical: 2),
                          decoration: BoxDecoration(
                            color: isMatched ? const Color(0xFFDCFCE7) : const Color(0xFFFEF3C7),
                            borderRadius: BorderRadius.circular(4),
                            border: Border.all(
                              color: isMatched ? const Color(0xFF86EFAC) : const Color(0xFFFDE68A),
                            ),
                          ),
                          child: Text(
                            bill['status']!,
                            style: TextStyle(
                              fontSize: 9.5,
                              fontWeight: FontWeight.w800,
                              color: isMatched ? const Color(0xFF166534) : const Color(0xFF92400E),
                            ),
                          ),
                        ),
                      ],
                    ),
                    const SizedBox(height: 6),
                    Text(
                      bill['vendor']!,
                      style: const TextStyle(fontSize: 13, fontWeight: FontWeight.bold, color: Color(0xFF0F172A)),
                    ),
                    const SizedBox(height: 4),
                    Row(
                      children: [
                        Text('PO: ${bill['poRef']}', style: const TextStyle(fontSize: 11, color: Color(0xFF64748B))),
                        const SizedBox(width: 10),
                        Text('Challan: ${bill['challanRef']}', style: const TextStyle(fontSize: 11, color: Color(0xFF64748B))),
                      ],
                    ),
                    const SizedBox(height: 10),
                    Row(
                      mainAxisAlignment: MainAxisAlignment.spaceBetween,
                      children: [
                        Text(
                          bill['amount']!,
                          style: const TextStyle(fontSize: 16, fontWeight: FontWeight.w900, color: Color(0xFF16A34A)),
                        ),
                        Text(
                          bill['gst']!,
                          style: const TextStyle(fontSize: 10.5, fontWeight: FontWeight.w600, color: Color(0xFF64748B)),
                        ),
                      ],
                    ),
                  ],
                ),
              );
            }),
        ],
      ),
    );
  }

  // ============================================================
  // 2. REPORTS VIEW (For Super Admin, Admin, Supervisor)
  // ============================================================
  Widget _buildReportsView() {
    return SingleChildScrollView(
      padding: const EdgeInsets.all(16),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          // Production Output Banner
          Container(
            padding: const EdgeInsets.all(16),
            decoration: BoxDecoration(
              gradient: const LinearGradient(
                colors: [Color(0xFF0F172A), Color(0xFF1E293B)],
                begin: Alignment.topLeft,
                end: Alignment.bottomRight,
              ),
              borderRadius: BorderRadius.circular(14),
              boxShadow: [
                BoxShadow(
                  color: Colors.black.withValues(alpha: 0.15),
                  blurRadius: 10,
                  offset: const Offset(0, 4),
                ),
              ],
            ),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Row(
                  mainAxisAlignment: MainAxisAlignment.spaceBetween,
                  children: [
                    const Text(
                      'Fabrication Output Telemetry',
                      style: TextStyle(color: Colors.white, fontSize: 16, fontWeight: FontWeight.bold),
                    ),
                    Container(
                      padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 3),
                      decoration: BoxDecoration(
                        color: const Color(0xFFF59E0B),
                        borderRadius: BorderRadius.circular(6),
                      ),
                      child: const Text('Live Telemetry', style: TextStyle(color: Color(0xFF0F172A), fontSize: 10, fontWeight: FontWeight.bold)),
                    ),
                  ],
                ),
                const SizedBox(height: 6),
                const Text(
                  'Heavy structural girder assembly, submerged arc welding, and bay throughput reports.',
                  style: TextStyle(color: Color(0xFF94A3B8), fontSize: 11),
                ),
              ],
            ),
          ),
          const SizedBox(height: 14),

          // Metrics Strip
          Row(
            children: [
              Expanded(
                child: _buildMetricTile(
                  title: 'Output Today',
                  value: '0.0 MT',
                  subtitle: 'No DPR logged yet',
                  color: const Color(0xFF0F172A),
                ),
              ),
              const SizedBox(width: 10),
              Expanded(
                child: _buildMetricTile(
                  title: 'Shop Efficiency',
                  value: '--',
                  subtitle: 'Awaiting shift data',
                  color: const Color(0xFF16A34A),
                ),
              ),
            ],
          ),
          const SizedBox(height: 10),
          Row(
            children: [
              Expanded(
                child: _buildMetricTile(
                  title: 'Machine Uptime',
                  value: '--',
                  subtitle: 'Telemetry standby',
                  color: const Color(0xFF2563EB),
                ),
              ),
              const SizedBox(width: 10),
              Expanded(
                child: _buildMetricTile(
                  title: 'Scrap Rate',
                  value: '0.0%',
                  subtitle: 'No scrap reported',
                  color: const Color(0xFF059669),
                ),
              ),
            ],
          ),
          const SizedBox(height: 18),

          const Text(
            'Bay Production Output Logs',
            style: TextStyle(fontSize: 14, fontWeight: FontWeight.bold, color: Color(0xFF0F172A)),
          ),
          const SizedBox(height: 10),

          Container(
            width: double.infinity,
            padding: const EdgeInsets.all(32),
            decoration: BoxDecoration(
              color: Colors.white,
              borderRadius: BorderRadius.circular(12),
              border: Border.all(color: const Color(0xFFE2E8F0)),
            ),
            child: Column(
              children: [
                Icon(Icons.precision_manufacturing_outlined, size: 48, color: Colors.grey.shade400),
                const SizedBox(height: 12),
                const Text('No Production Reports Logged', style: TextStyle(fontWeight: FontWeight.bold, fontSize: 14, color: Color(0xFF0F172A))),
                const SizedBox(height: 4),
                const Text('When shift supervisors submit Daily Production Reports (DPR), bay outputs will appear here.', textAlign: TextAlign.center, style: TextStyle(fontSize: 12, color: Color(0xFF64748B))),
              ],
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildMetricTile({
    required String title,
    required String value,
    required String subtitle,
    required Color color,
  }) {
    return Container(
      padding: const EdgeInsets.all(14),
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(12),
        border: Border.all(color: const Color(0xFFE2E8F0)),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Text(title.toUpperCase(), style: const TextStyle(fontSize: 9.5, fontWeight: FontWeight.bold, color: Color(0xFF64748B))),
          const SizedBox(height: 4),
          Text(value, style: TextStyle(fontSize: 17, fontWeight: FontWeight.w900, color: color)),
          const SizedBox(height: 2),
          Text(subtitle, style: const TextStyle(fontSize: 10, color: Color(0xFF94A3B8))),
        ],
      ),
    );
  }

}

