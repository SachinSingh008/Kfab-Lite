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
    final bills = [
      {
        'billNo': 'BILL-2026-089',
        'vendor': 'ABC Engineering Works',
        'poRef': 'PO-KFAB-042',
        'challanRef': 'DC-2026-118',
        'amount': '₹ 3,45,000',
        'gst': '18% GST (₹ 62,100)',
        'status': '3-WAY MATCHED',
        'date': '2026-09-04',
      },
      {
        'billNo': 'BILL-2026-088',
        'vendor': 'XYZ Structurals & Steels',
        'poRef': 'PO-KFAB-039',
        'challanRef': 'DC-2026-112',
        'amount': '₹ 8,92,400',
        'gst': '18% GST (₹ 1,60,632)',
        'status': 'PENDING PO AUDIT',
        'date': '2026-09-03',
      },
      {
        'billNo': 'BILL-2026-087',
        'vendor': 'PQR Infra Consumables',
        'poRef': 'PO-KFAB-041',
        'challanRef': 'DC-2026-109',
        'amount': '₹ 1,18,500',
        'gst': '18% GST (₹ 21,330)',
        'status': '3-WAY MATCHED',
        'date': '2026-09-02',
      },
      {
        'billNo': 'BILL-2026-086',
        'vendor': 'Avery Scales Weighbridge Service',
        'poRef': 'PO-KFAB-033',
        'challanRef': 'SRV-2026-004',
        'amount': '₹ 35,000',
        'gst': '18% GST (₹ 6,300)',
        'status': 'APPROVED FOR PAYMENT',
        'date': '2026-09-01',
      },
    ];

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
                  value: '₹ 13.9 Lakhs',
                  subtitle: '100% Verified',
                  color: const Color(0xFF16A34A),
                ),
              ),
              const SizedBox(width: 10),
              Expanded(
                child: _buildMetricTile(
                  title: 'Pending Match',
                  value: '1 Bill Hold',
                  subtitle: 'Challan WT mismatch',
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

          // Bills List
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
                      child: const Text('Shift A Active', style: TextStyle(color: Color(0xFF0F172A), fontSize: 10, fontWeight: FontWeight.bold)),
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
                  value: '45.2 MT',
                  subtitle: 'Planned: 48.0 MT',
                  color: const Color(0xFF0F172A),
                ),
              ),
              const SizedBox(width: 10),
              Expanded(
                child: _buildMetricTile(
                  title: 'Shop Efficiency',
                  value: '92.8%',
                  subtitle: 'Target: 85%',
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
                  value: '96.4%',
                  subtitle: 'Cranes & SAW Active',
                  color: const Color(0xFF2563EB),
                ),
              ),
              const SizedBox(width: 10),
              Expanded(
                child: _buildMetricTile(
                  title: 'Scrap Rate',
                  value: '2.4%',
                  subtitle: 'Below 4.0% limit',
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

          _buildBayCard('Bay 1 — Heavy Fit-Up & Assembly', 'KFAB-PRJ-001', '11.2 MT', '12.5 MT', '0.35 MT', '89.6%'),
          _buildBayCard('Bay 2 — Submerged Arc Welding (SAW)', 'KFAB-PRJ-002', '8.4 MT', '8.0 MT', '0.18 MT', '105.0%'),
          _buildBayCard('Bay 3 — Shot Blasting & Primer', 'KFAB-PRJ-003', '14.1 MT', '15.0 MT', '0.05 MT', '94.0%'),
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

  Widget _buildBayCard(String bayName, String prj, String actual, String planned, String scrap, String eff) {
    return Container(
      margin: const EdgeInsets.only(bottom: 10),
      padding: const EdgeInsets.all(14),
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(12),
        border: Border.all(color: const Color(0xFFE2E8F0)),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            mainAxisAlignment: MainAxisAlignment.spaceBetween,
            children: [
              Text(bayName, style: const TextStyle(fontSize: 13, fontWeight: FontWeight.bold, color: Color(0xFF0F172A))),
              Container(
                padding: const EdgeInsets.symmetric(horizontal: 6, vertical: 2),
                decoration: BoxDecoration(
                  color: const Color(0xFFDCFCE7),
                  borderRadius: BorderRadius.circular(4),
                ),
                child: Text(eff, style: const TextStyle(fontSize: 10, fontWeight: FontWeight.bold, color: Color(0xFF166534))),
              ),
            ],
          ),
          const SizedBox(height: 4),
          Text('Project: $prj', style: const TextStyle(fontSize: 11, color: Color(0xFF64748B))),
          const SizedBox(height: 8),
          Row(
            mainAxisAlignment: MainAxisAlignment.spaceBetween,
            children: [
              Text('Actual: $actual', style: const TextStyle(fontSize: 12, fontWeight: FontWeight.bold, color: Color(0xFF0F172A))),
              Text('Planned: $planned', style: const TextStyle(fontSize: 11, color: Color(0xFF64748B))),
              Text('Scrap: $scrap', style: const TextStyle(fontSize: 11, color: Color(0xFF94A3B8))),
            ],
          ),
        ],
      ),
    );
  }
}
