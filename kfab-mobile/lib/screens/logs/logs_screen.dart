import 'dart:convert';
import 'package:flutter/material.dart';
import '../../core/config/app_theme.dart';
import '../../core/config/supabase_config.dart';
import '../../core/models/log_item.dart';
import '../../core/state/auth_state.dart';

class LogsScreen extends StatefulWidget {
  final AuthState authState;

  const LogsScreen({super.key, required this.authState});

  @override
  State<LogsScreen> createState() => _LogsScreenState();
}

class _LogsScreenState extends State<LogsScreen> with SingleTickerProviderStateMixin {
  late TabController _tabController;
  bool _canSeeSystemLogs = false;

  // Tab 1: My Logs state
  List<UserLogItem> _myLogs = [];
  bool _loadingMyLogs = false;
  String _myLogsSearch = '';

  // Tab 2: All Logs state
  List<UserLogItem> _allLogs = [];
  bool _loadingAllLogs = false;
  String _allLogsSearch = '';
  String _allLogsRoleFilter = 'ALL';

  // Tab 3: System Logs state
  List<SystemLogItem> _systemLogs = [];
  bool _loadingSystemLogs = false;
  String _systemLogsSearch = '';
  String _systemLogsModuleFilter = 'ALL';

  @override
  void initState() {
    super.initState();
    final role = widget.authState.role;
    _canSeeSystemLogs = role == UserRole.superAdmin || role == UserRole.admin;
    _tabController = TabController(
      length: _canSeeSystemLogs ? 3 : 2,
      vsync: this,
    );

    _fetchMyLogs();
    _fetchAllLogs();
    if (_canSeeSystemLogs) {
      _fetchSystemLogs();
    }
  }

  @override
  void dispose() {
    _tabController.dispose();
    super.dispose();
  }

  // --------------------------------------------------------------------------
  // Role Visibility Filter Utility
  // CONTRACT:
  // - SUPER_ADMIN: sees SUPER_ADMIN, ADMIN, SUPERVISOR, ACCOUNT (everyone)
  // - ADMIN:       sees ADMIN, SUPERVISOR, ACCOUNT
  // - SUPERVISOR:  sees ADMIN, SUPERVISOR (hides SUPER_ADMIN and ACCOUNT)
  // - ACCOUNT:     sees ADMIN, SUPERVISOR, ACCOUNT (hides SUPER_ADMIN)
  // --------------------------------------------------------------------------
  List<String> get _visibleRolesForCurrentUser {
    switch (widget.authState.role) {
      case UserRole.superAdmin:
        return ['SUPER_ADMIN', 'ADMIN', 'SUPERVISOR', 'ACCOUNT'];
      case UserRole.admin:
        return ['ADMIN', 'SUPERVISOR', 'ACCOUNT'];
      case UserRole.supervisor:
        return ['ADMIN', 'SUPERVISOR'];
      case UserRole.accounts:
        return ['ADMIN', 'SUPERVISOR', 'ACCOUNT'];
    }
  }

  // --------------------------------------------------------------------------
  // Data Fetching
  // --------------------------------------------------------------------------
  Future<void> _fetchMyLogs() async {
    setState(() => _loadingMyLogs = true);
    try {
      final client = SupabaseConfig.client;
      if (client != null) {
        final user = client.auth.currentUser;
        if (user != null) {
          final res = await client
              .from('user_logs')
              .select('id, created_by, created_at, event, remarks, profiles(full_name, role)')
              .eq('created_by', user.id)
              .order('created_at', ascending: false)
              .limit(50);

          if (mounted) {
            setState(() {
              _myLogs = (res as List).map((e) => UserLogItem.fromJson(e as Map<String, dynamic>)).toList();
            });
          }
        }
      }
    } catch (e) {
      debugPrint('Error fetching my logs: $e');
    } finally {
      if (mounted) setState(() => _loadingMyLogs = false);
    }
  }

  Future<void> _fetchAllLogs() async {
    setState(() => _loadingAllLogs = true);
    try {
      final client = SupabaseConfig.client;
      if (client != null) {
        final res = await client
            .from('user_logs')
            .select('id, created_by, created_at, event, remarks, profiles(full_name, role)')
            .order('created_at', ascending: false)
            .limit(100);

        if (mounted) {
          setState(() {
            _allLogs = (res as List).map((e) => UserLogItem.fromJson(e as Map<String, dynamic>)).toList();
          });
        }
      }
    } catch (e) {
      debugPrint('Error fetching all logs: $e');
    } finally {
      if (mounted) setState(() => _loadingAllLogs = false);
    }
  }

  Future<void> _fetchSystemLogs() async {
    if (!_canSeeSystemLogs) return;
    setState(() => _loadingSystemLogs = true);
    try {
      final client = SupabaseConfig.client;
      if (client != null) {
        final res = await client
            .from('audit_logs')
            .select('id, created_at, actor_id, action, module, resource_type, resource_id, description, old_values, new_values, ip_address, user_agent, correlation_id, profiles(full_name, role)')
            .order('created_at', ascending: false)
            .limit(100);

        if (mounted) {
          setState(() {
            _systemLogs = (res as List).map((e) => SystemLogItem.fromJson(e as Map<String, dynamic>)).toList();
          });
        }
      }
    } catch (e) {
      debugPrint('Error fetching system logs: $e');
    } finally {
      if (mounted) setState(() => _loadingSystemLogs = false);
    }
  }

  // --------------------------------------------------------------------------
  // Add Log Dialog
  // --------------------------------------------------------------------------
  void _openAddLogDialog() {
    final eventCtrl = TextEditingController();
    final remarksCtrl = TextEditingController();
    bool isSaving = false;

    showDialog(
      context: context,
      barrierDismissible: false,
      builder: (ctx) {
        return StatefulBuilder(
          builder: (context, setDialogState) {
            return AlertDialog(
              shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(16)),
              title: Row(
                children: [
                  Container(
                    padding: const EdgeInsets.all(8),
                    decoration: BoxDecoration(
                      color: const Color(0xFF0F172A),
                      borderRadius: BorderRadius.circular(10),
                    ),
                    child: const Icon(Icons.note_add, color: Colors.white, size: 20),
                  ),
                  const SizedBox(width: 10),
                  const Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Text(
                        'ADD LOG',
                        style: TextStyle(fontSize: 16, fontWeight: FontWeight.bold, color: Color(0xFF0F172A)),
                      ),
                      Text(
                        'Record manual activity note',
                        style: TextStyle(fontSize: 11, color: Color(0xFF64748B)),
                      ),
                    ],
                  ),
                ],
              ),
              content: SingleChildScrollView(
                child: Column(
                  mainAxisSize: MainAxisSize.min,
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    const Text('Event *', style: TextStyle(fontSize: 12, fontWeight: FontWeight.bold, color: Color(0xFF334155))),
                    const SizedBox(height: 6),
                    TextField(
                      controller: eventCtrl,
                      style: const TextStyle(fontSize: 13),
                      decoration: InputDecoration(
                        hintText: 'Enter event (e.g. Material received)',
                        hintStyle: const TextStyle(fontSize: 12, color: Color(0xFF94A3B8)),
                        border: OutlineInputBorder(borderRadius: BorderRadius.circular(8)),
                        contentPadding: const EdgeInsets.symmetric(horizontal: 12, vertical: 10),
                      ),
                    ),
                    const SizedBox(height: 14),
                    const Text('Remarks', style: TextStyle(fontSize: 12, fontWeight: FontWeight.bold, color: Color(0xFF334155))),
                    const SizedBox(height: 6),
                    TextField(
                      controller: remarksCtrl,
                      maxLines: 3,
                      style: const TextStyle(fontSize: 13),
                      decoration: InputDecoration(
                        hintText: 'Enter remarks (e.g. MTC checked)',
                        hintStyle: const TextStyle(fontSize: 12, color: Color(0xFF94A3B8)),
                        border: OutlineInputBorder(borderRadius: BorderRadius.circular(8)),
                        contentPadding: const EdgeInsets.symmetric(horizontal: 12, vertical: 10),
                      ),
                    ),
                    const SizedBox(height: 12),
                    Container(
                      padding: const EdgeInsets.all(10),
                      decoration: BoxDecoration(
                        color: const Color(0xFFF8FAFC),
                        borderRadius: BorderRadius.circular(8),
                        border: Border.all(color: const Color(0xFFE2E8F0)),
                      ),
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          Row(
                            children: [
                              const Icon(Icons.info_outline, size: 14, color: Color(0xFF64748B)),
                              const SizedBox(width: 6),
                              Text(
                                'Creator: ${widget.authState.userName} (${widget.authState.role.displayName})',
                                style: const TextStyle(fontSize: 11, fontWeight: FontWeight.w600, color: Color(0xFF475569)),
                              ),
                            ],
                          ),
                          const SizedBox(height: 4),
                          const Text(
                            'Timestamp: Recorded automatically by database',
                            style: TextStyle(fontSize: 11, color: Color(0xFF64748B)),
                          ),
                        ],
                      ),
                    ),
                  ],
                ),
              ),
              actions: [
                TextButton(
                  onPressed: isSaving ? null : () => Navigator.pop(ctx),
                  child: const Text('Cancel', style: TextStyle(color: Color(0xFF64748B))),
                ),
                ElevatedButton(
                  style: ElevatedButton.styleFrom(
                    backgroundColor: const Color(0xFF0F172A),
                    foregroundColor: Colors.white,
                    shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(8)),
                  ),
                  onPressed: isSaving
                      ? null
                      : () async {
                          final event = eventCtrl.text.trim();
                          if (event.isEmpty) {
                            ScaffoldMessenger.of(context).showSnackBar(
                              const SnackBar(content: Text('Event is required')),
                            );
                            return;
                          }

                          final nav = Navigator.of(ctx);
                          final messenger = ScaffoldMessenger.of(context);
                          setDialogState(() => isSaving = true);
                          try {
                            final client = SupabaseConfig.client;
                            if (client != null) {
                              final user = client.auth.currentUser;
                              if (user != null) {
                                await client.from('user_logs').insert({
                                  'created_by': user.id,
                                  'event': event,
                                  'remarks': remarksCtrl.text.trim().isEmpty ? null : remarksCtrl.text.trim(),
                                });
                              }
                            }
                            nav.pop();
                            messenger.showSnackBar(
                              const SnackBar(
                                content: Text('Log added successfully.'),
                                backgroundColor: Color(0xFF16A34A),
                              ),
                            );
                            _fetchMyLogs();
                            _fetchAllLogs();
                          } catch (err) {
                            messenger.showSnackBar(
                              SnackBar(content: Text('Error: $err'), backgroundColor: Colors.red),
                            );
                          }
                        },
                  child: isSaving
                      ? const SizedBox(width: 16, height: 16, child: CircularProgressIndicator(color: Colors.white, strokeWidth: 2))
                      : const Text('Add Log', style: TextStyle(fontWeight: FontWeight.bold)),
                ),
              ],
            );
          },
        );
      },
    );
  }

  // --------------------------------------------------------------------------
  // System Log Detail Bottom Sheet
  // --------------------------------------------------------------------------
  void _openSystemLogDetail(SystemLogItem item) {
    showModalBottomSheet(
      context: context,
      isScrollControlled: true,
      backgroundColor: Colors.transparent,
      builder: (ctx) {
        return Container(
          height: MediaQuery.of(context).size.height * 0.85,
          decoration: const BoxDecoration(
            color: Colors.white,
            borderRadius: BorderRadius.vertical(top: Radius.circular(20)),
          ),
          child: Column(
            children: [
              // Handle
              Center(
                child: Container(
                  margin: const EdgeInsets.only(top: 12),
                  width: 40,
                  height: 4,
                  decoration: BoxDecoration(
                    color: const Color(0xFFCBD5E1),
                    borderRadius: BorderRadius.circular(2),
                  ),
                ),
              ),

              // Title
              Padding(
                padding: const EdgeInsets.all(16),
                child: Row(
                  children: [
                    Container(
                      padding: const EdgeInsets.all(8),
                      decoration: BoxDecoration(
                        color: const Color(0xFF2563EB),
                        borderRadius: BorderRadius.circular(10),
                      ),
                      child: const Icon(Icons.security, color: Colors.white, size: 20),
                    ),
                    const SizedBox(width: 12),
                    Expanded(
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          const Text(
                            'SYSTEM AUDIT LOG DETAIL',
                            style: TextStyle(fontSize: 15, fontWeight: FontWeight.bold, color: Color(0xFF0F172A)),
                          ),
                          Text(
                            _formatDate(item.createdAt),
                            style: const TextStyle(fontSize: 12, color: Color(0xFF64748B)),
                          ),
                        ],
                      ),
                    ),
                    IconButton(
                      icon: const Icon(Icons.close, size: 20),
                      onPressed: () => Navigator.pop(ctx),
                    ),
                  ],
                ),
              ),
              const Divider(height: 1),

              // Content
              Expanded(
                child: ListView(
                  padding: const EdgeInsets.all(16),
                  children: [
                    // Metadata Grid
                    Container(
                      padding: const EdgeInsets.all(12),
                      decoration: BoxDecoration(
                        color: const Color(0xFFF8FAFC),
                        borderRadius: BorderRadius.circular(12),
                        border: Border.all(color: const Color(0xFFE2E8F0)),
                      ),
                      child: Column(
                        children: [
                          _buildDetailRow('Actor / User', item.actorName ?? 'System'),
                          const Divider(height: 16),
                          _buildDetailRow('Role', item.actorRole ?? 'SYSTEM'),
                          const Divider(height: 16),
                          _buildDetailRow('Module', item.module),
                          const Divider(height: 16),
                          _buildDetailRow('Action', item.action),
                          if (item.resourceId != null) ...[
                            const Divider(height: 16),
                            _buildDetailRow('Resource ID', item.resourceId!),
                          ],
                        ],
                      ),
                    ),
                    const SizedBox(height: 16),

                    // Description
                    const Text('Description', style: TextStyle(fontSize: 12, fontWeight: FontWeight.bold, color: Color(0xFF475569))),
                    const SizedBox(height: 6),
                    Container(
                      width: double.infinity,
                      padding: const EdgeInsets.all(12),
                      decoration: BoxDecoration(
                        color: const Color(0xFFF1F5F9),
                        borderRadius: BorderRadius.circular(8),
                      ),
                      child: Text(
                        item.description,
                        style: const TextStyle(fontSize: 13, fontWeight: FontWeight.w600, color: Color(0xFF0F172A)),
                      ),
                    ),
                    const SizedBox(height: 16),

                    // Old Values vs New Values
                    if (item.oldValues != null || item.newValues != null) ...[
                      const Text('OLD VALUES', style: TextStyle(fontSize: 11, fontWeight: FontWeight.bold, color: Color(0xFF64748B))),
                      const SizedBox(height: 4),
                      Container(
                        width: double.infinity,
                        padding: const EdgeInsets.all(10),
                        decoration: BoxDecoration(
                          color: const Color(0xFF0F172A),
                          borderRadius: BorderRadius.circular(8),
                        ),
                        child: Text(
                          item.oldValues != null ? const JsonEncoder.withIndent('  ').convert(item.oldValues) : 'null',
                          style: const TextStyle(fontFamily: 'monospace', fontSize: 11, color: Color(0xFFE2E8F0)),
                        ),
                      ),
                      const SizedBox(height: 12),
                      const Text('NEW VALUES', style: TextStyle(fontSize: 11, fontWeight: FontWeight.bold, color: Color(0xFF64748B))),
                      const SizedBox(height: 4),
                      Container(
                        width: double.infinity,
                        padding: const EdgeInsets.all(10),
                        decoration: BoxDecoration(
                          color: const Color(0xFF0F172A),
                          borderRadius: BorderRadius.circular(8),
                        ),
                        child: Text(
                          item.newValues != null ? const JsonEncoder.withIndent('  ').convert(item.newValues) : 'null',
                          style: const TextStyle(fontFamily: 'monospace', fontSize: 11, color: Color(0xFFE2E8F0)),
                        ),
                      ),
                      const SizedBox(height: 16),
                    ],

                    // Technical Details
                    Container(
                      padding: const EdgeInsets.all(10),
                      decoration: BoxDecoration(
                        color: const Color(0xFFF8FAFC),
                        borderRadius: BorderRadius.circular(8),
                        border: Border.all(color: const Color(0xFFE2E8F0)),
                      ),
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          const Text('Technical Telemetry', style: TextStyle(fontSize: 11, fontWeight: FontWeight.bold, color: Color(0xFF64748B))),
                          const SizedBox(height: 6),
                          Text('IP: ${item.ipAddress ?? "Internal"}', style: const TextStyle(fontSize: 11, color: Color(0xFF475569))),
                          Text('Agent: ${item.userAgent ?? "KFab Client"}', style: const TextStyle(fontSize: 11, color: Color(0xFF475569))),
                          if (item.correlationId != null)
                            Text('Corr ID: ${item.correlationId}', style: const TextStyle(fontSize: 11, color: Color(0xFF475569))),
                        ],
                      ),
                    ),
                  ],
                ),
              ),

              // Immutable Notice
              Container(
                padding: const EdgeInsets.all(12),
                color: const Color(0xFFF8FAFC),
                child: const Row(
                  mainAxisAlignment: MainAxisAlignment.center,
                  children: [
                    Icon(Icons.lock, size: 14, color: Color(0xFF64748B)),
                    SizedBox(width: 6),
                    Text(
                      'Audit records are immutable and append-only',
                      style: TextStyle(fontSize: 11, color: Color(0xFF64748B), fontWeight: FontWeight.w500),
                    ),
                  ],
                ),
              ),
            ],
          ),
        );
      },
    );
  }

  Widget _buildDetailRow(String label, String value) {
    return Row(
      mainAxisAlignment: MainAxisAlignment.spaceBetween,
      children: [
        Text(label, style: const TextStyle(fontSize: 12, color: Color(0xFF64748B), fontWeight: FontWeight.w500)),
        Text(value, style: const TextStyle(fontSize: 12, color: Color(0xFF0F172A), fontWeight: FontWeight.bold)),
      ],
    );
  }

  // --------------------------------------------------------------------------
  // Helpers
  // --------------------------------------------------------------------------
  String _formatDate(DateTime dt) {
    final months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    final day = dt.day.toString().padLeft(2, '0');
    final month = months[dt.month - 1];
    final year = dt.year;
    final hour = dt.hour % 12 == 0 ? 12 : dt.hour % 12;
    final minute = dt.minute.toString().padLeft(2, '0');
    final ampm = dt.hour >= 12 ? 'PM' : 'AM';
    return '$day $month $year, ${hour.toString().padLeft(2, '0')}:$minute $ampm';
  }

  Widget _buildRoleBadge(String? role) {
    final r = (role ?? 'SUPERVISOR').toUpperCase();
    Color bg = const Color(0xFFF1F5F9);
    Color fg = const Color(0xFF475569);

    if (r.contains('SUPER_ADMIN')) {
      bg = const Color(0xFFF3E8FF);
      fg = const Color(0xFF7E22CE);
    } else if (r.contains('ADMIN')) {
      bg = const Color(0xFFDBEAFE);
      fg = const Color(0xFF1D4ED8);
    } else if (r.contains('SUPERVISOR')) {
      bg = const Color(0xFFFEF3C7);
      fg = const Color(0xFFB45309);
    } else if (r.contains('ACCOUNT')) {
      bg = const Color(0xFFD1FAE5);
      fg = const Color(0xFF047857);
    }

    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 6, vertical: 2),
      decoration: BoxDecoration(
        color: bg,
        borderRadius: BorderRadius.circular(4),
      ),
      child: Text(
        r.replaceAll('_', ' '),
        style: TextStyle(fontSize: 9.5, fontWeight: FontWeight.bold, color: fg),
      ),
    );
  }

  @override
  Widget build(BuildContext context) {
    final rolePrimary = AppTheme.getPrimaryForRole(widget.authState.role);

    return Scaffold(
      appBar: AppBar(
        title: const Text('LOGS', style: TextStyle(fontWeight: FontWeight.bold, fontSize: 18)),
        backgroundColor: Colors.white,
        foregroundColor: const Color(0xFF0F172A),
        elevation: 0.5,
        actions: [
          IconButton(
            icon: const Icon(Icons.refresh),
            onPressed: () {
              _fetchMyLogs();
              _fetchAllLogs();
              if (_canSeeSystemLogs) _fetchSystemLogs();
            },
            tooltip: 'Refresh Logs',
          ),
        ],
        bottom: TabBar(
          controller: _tabController,
          labelColor: rolePrimary,
          unselectedLabelColor: const Color(0xFF64748B),
          indicatorColor: rolePrimary,
          indicatorWeight: 3,
          tabs: [
            const Tab(text: 'My Logs'),
            const Tab(text: 'All Logs'),
            if (_canSeeSystemLogs) const Tab(text: 'System Logs'),
          ],
        ),
      ),
      floatingActionButton: FloatingActionButton.extended(
        backgroundColor: const Color(0xFF0F172A),
        foregroundColor: Colors.white,
        onPressed: _openAddLogDialog,
        icon: const Icon(Icons.add, size: 20),
        label: const Text('+ Add Log', style: TextStyle(fontWeight: FontWeight.bold)),
      ),
      body: TabBarView(
        controller: _tabController,
        children: [
          _buildMyLogsTab(),
          _buildAllLogsTab(),
          if (_canSeeSystemLogs) _buildSystemLogsTab(),
        ],
      ),
    );
  }

  // --------------------------------------------------------------------------
  // Tab 1: My Logs UI
  // --------------------------------------------------------------------------
  Widget _buildMyLogsTab() {
    final filtered = _myLogs.where((log) {
      if (_myLogsSearch.trim().isEmpty) return true;
      final q = _myLogsSearch.toLowerCase();
      return log.event.toLowerCase().contains(q) || (log.remarks ?? '').toLowerCase().contains(q);
    }).toList();

    return Column(
      children: [
        // Search bar
        Padding(
          padding: const EdgeInsets.all(12),
          child: TextField(
            onChanged: (val) => setState(() => _myLogsSearch = val),
            style: const TextStyle(fontSize: 13),
            decoration: InputDecoration(
              hintText: 'Search Event or Remarks...',
              prefixIcon: const Icon(Icons.search, size: 20),
              border: OutlineInputBorder(borderRadius: BorderRadius.circular(10)),
              contentPadding: const EdgeInsets.symmetric(horizontal: 12, vertical: 8),
              filled: true,
              fillColor: Colors.white,
            ),
          ),
        ),

        // List
        Expanded(
          child: _loadingMyLogs
              ? const Center(child: CircularProgressIndicator())
              : filtered.isEmpty
                  ? Center(
                      child: Column(
                        mainAxisSize: MainAxisSize.min,
                        children: [
                          const Icon(Icons.note_alt_outlined, size: 48, color: Color(0xFFCBD5E1)),
                          const SizedBox(height: 12),
                          const Text('No logs yet.', style: TextStyle(fontSize: 15, fontWeight: FontWeight.bold, color: Color(0xFF475569))),
                          const SizedBox(height: 4),
                          const Text('Create your first log to start recording your activities.', style: TextStyle(fontSize: 12, color: Color(0xFF94A3B8))),
                          const SizedBox(height: 16),
                          ElevatedButton.icon(
                            style: ElevatedButton.styleFrom(backgroundColor: const Color(0xFF0F172A), foregroundColor: Colors.white),
                            onPressed: _openAddLogDialog,
                            icon: const Icon(Icons.add, size: 16),
                            label: const Text('Add First Log'),
                          ),
                        ],
                      ),
                    )
                  : ListView.separated(
                      padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 4),
                      itemCount: filtered.length,
                      separatorBuilder: (_, index) => const SizedBox(height: 8),
                      itemBuilder: (context, idx) {
                        final log = filtered[idx];
                        return Container(
                          padding: const EdgeInsets.all(12),
                          decoration: BoxDecoration(
                            color: Colors.white,
                            borderRadius: BorderRadius.circular(10),
                            border: Border.all(color: const Color(0xFFE2E8F0)),
                            boxShadow: [
                              BoxShadow(color: Colors.black.withValues(alpha: 0.02), blurRadius: 4, offset: const Offset(0, 2)),
                            ],
                          ),
                          child: Column(
                            crossAxisAlignment: CrossAxisAlignment.start,
                            children: [
                              Row(
                                mainAxisAlignment: MainAxisAlignment.spaceBetween,
                                children: [
                                  Row(
                                    children: [
                                      const Icon(Icons.access_time, size: 13, color: Color(0xFF94A3B8)),
                                      const SizedBox(width: 4),
                                      Text(
                                        _formatDate(log.createdAt),
                                        style: const TextStyle(fontSize: 11, fontWeight: FontWeight.w600, color: Color(0xFF64748B)),
                                      ),
                                    ],
                                  ),
                                ],
                              ),
                              const SizedBox(height: 6),
                              Text(
                                log.event,
                                style: const TextStyle(fontSize: 13.5, fontWeight: FontWeight.bold, color: Color(0xFF0F172A)),
                              ),
                              if (log.remarks != null && log.remarks!.isNotEmpty) ...[
                                const SizedBox(height: 4),
                                Text(
                                  log.remarks!,
                                  style: const TextStyle(fontSize: 12, color: Color(0xFF475569)),
                                ),
                              ],
                            ],
                          ),
                        );
                      },
                    ),
        ),
      ],
    );
  }

  // --------------------------------------------------------------------------
  // Tab 2: All Logs UI (Role Filtered in UI)
  // --------------------------------------------------------------------------
  Widget _buildAllLogsTab() {
    // 1. Role Filtered by specification
    final allowedRoles = _visibleRolesForCurrentUser;
    final roleScopedLogs = _allLogs.where((log) {
      final role = (log.userRole ?? 'SUPERVISOR').toUpperCase();
      return allowedRoles.contains(role);
    }).toList();

    // 2. Search & Dropdown Filter
    final filtered = roleScopedLogs.where((log) {
      if (_allLogsRoleFilter != 'ALL') {
        final r = (log.userRole ?? '').toUpperCase();
        if (r != _allLogsRoleFilter) return false;
      }
      if (_allLogsSearch.trim().isEmpty) return true;
      final q = _allLogsSearch.toLowerCase();
      final eventMatch = log.event.toLowerCase().contains(q);
      final remarksMatch = (log.remarks ?? '').toLowerCase().contains(q);
      final userMatch = (log.userName ?? '').toLowerCase().contains(q);
      return eventMatch || remarksMatch || userMatch;
    }).toList();

    return Column(
      children: [
        Padding(
          padding: const EdgeInsets.all(12),
          child: Row(
            children: [
              Expanded(
                child: TextField(
                  onChanged: (val) => setState(() => _allLogsSearch = val),
                  style: const TextStyle(fontSize: 13),
                  decoration: InputDecoration(
                    hintText: 'Search Event, Remarks, User...',
                    prefixIcon: const Icon(Icons.search, size: 20),
                    border: OutlineInputBorder(borderRadius: BorderRadius.circular(10)),
                    contentPadding: const EdgeInsets.symmetric(horizontal: 12, vertical: 8),
                    filled: true,
                    fillColor: Colors.white,
                  ),
                ),
              ),
              const SizedBox(width: 8),
              Container(
                padding: const EdgeInsets.symmetric(horizontal: 8),
                decoration: BoxDecoration(
                  color: Colors.white,
                  borderRadius: BorderRadius.circular(10),
                  border: Border.all(color: const Color(0xFFCBD5E1)),
                ),
                child: DropdownButtonHideUnderline(
                  child: DropdownButton<String>(
                    value: _allLogsRoleFilter,
                    style: const TextStyle(fontSize: 12, color: Color(0xFF0F172A), fontWeight: FontWeight.bold),
                    items: [
                      const DropdownMenuItem(value: 'ALL', child: Text('All Roles')),
                      ...allowedRoles.map((r) => DropdownMenuItem(value: r, child: Text(r.replaceAll('_', ' ')))),
                    ],
                    onChanged: (val) {
                      if (val != null) setState(() => _allLogsRoleFilter = val);
                    },
                  ),
                ),
              ),
            ],
          ),
        ),

        Expanded(
          child: _loadingAllLogs
              ? const Center(child: CircularProgressIndicator())
              : filtered.isEmpty
                  ? const Center(
                      child: Text('No logs found matching filter criteria.', style: TextStyle(color: Color(0xFF64748B))),
                    )
                  : ListView.separated(
                      padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 4),
                      itemCount: filtered.length,
                      separatorBuilder: (_, index) => const SizedBox(height: 8),
                      itemBuilder: (context, idx) {
                        final log = filtered[idx];
                        return Container(
                          padding: const EdgeInsets.all(12),
                          decoration: BoxDecoration(
                            color: Colors.white,
                            borderRadius: BorderRadius.circular(10),
                            border: Border.all(color: const Color(0xFFE2E8F0)),
                            boxShadow: [
                              BoxShadow(color: Colors.black.withValues(alpha: 0.02), blurRadius: 4, offset: const Offset(0, 2)),
                            ],
                          ),
                          child: Column(
                            crossAxisAlignment: CrossAxisAlignment.start,
                            children: [
                              Row(
                                mainAxisAlignment: MainAxisAlignment.spaceBetween,
                                children: [
                                  Row(
                                    children: [
                                      Text(
                                        log.userName ?? 'User',
                                        style: const TextStyle(fontSize: 12.5, fontWeight: FontWeight.bold, color: Color(0xFF0F172A)),
                                      ),
                                      const SizedBox(width: 6),
                                      _buildRoleBadge(log.userRole),
                                    ],
                                  ),
                                  Text(
                                    _formatDate(log.createdAt),
                                    style: const TextStyle(fontSize: 10.5, color: Color(0xFF94A3B8)),
                                  ),
                                ],
                              ),
                              const SizedBox(height: 6),
                              Text(
                                log.event,
                                style: const TextStyle(fontSize: 13, fontWeight: FontWeight.bold, color: Color(0xFF1E293B)),
                              ),
                              if (log.remarks != null && log.remarks!.isNotEmpty) ...[
                                const SizedBox(height: 4),
                                Text(
                                  log.remarks!,
                                  style: const TextStyle(fontSize: 12, color: Color(0xFF64748B)),
                                ),
                              ],
                            ],
                          ),
                        );
                      },
                    ),
        ),
      ],
    );
  }

  // --------------------------------------------------------------------------
  // Tab 3: System Logs UI (Super Admin & Admin only)
  // --------------------------------------------------------------------------
  Widget _buildSystemLogsTab() {
    final filtered = _systemLogs.where((item) {
      if (_systemLogsModuleFilter != 'ALL' && item.module != _systemLogsModuleFilter) {
        return false;
      }
      if (_systemLogsSearch.trim().isEmpty) return true;
      final q = _systemLogsSearch.toLowerCase();
      final descMatch = item.description.toLowerCase().contains(q);
      final userMatch = (item.actorName ?? '').toLowerCase().contains(q);
      final resMatch = (item.resourceId ?? '').toLowerCase().contains(q);
      return descMatch || userMatch || resMatch;
    }).toList();

    return Column(
      children: [
        Padding(
          padding: const EdgeInsets.all(12),
          child: Row(
            children: [
              Expanded(
                child: TextField(
                  onChanged: (val) => setState(() => _systemLogsSearch = val),
                  style: const TextStyle(fontSize: 13),
                  decoration: InputDecoration(
                    hintText: 'Search Description, User, Resource ID...',
                    prefixIcon: const Icon(Icons.search, size: 20),
                    border: OutlineInputBorder(borderRadius: BorderRadius.circular(10)),
                    contentPadding: const EdgeInsets.symmetric(horizontal: 12, vertical: 8),
                    filled: true,
                    fillColor: Colors.white,
                  ),
                ),
              ),
              const SizedBox(width: 8),
              Container(
                padding: const EdgeInsets.symmetric(horizontal: 8),
                decoration: BoxDecoration(
                  color: Colors.white,
                  borderRadius: BorderRadius.circular(10),
                  border: Border.all(color: const Color(0xFFCBD5E1)),
                ),
                child: DropdownButtonHideUnderline(
                  child: DropdownButton<String>(
                    value: _systemLogsModuleFilter,
                    style: const TextStyle(fontSize: 12, color: Color(0xFF0F172A), fontWeight: FontWeight.bold),
                    items: const [
                      DropdownMenuItem(value: 'ALL', child: Text('All Modules')),
                      DropdownMenuItem(value: 'USER MANAGEMENT', child: Text('Users')),
                      DropdownMenuItem(value: 'ATTENDANCE', child: Text('Attendance')),
                      DropdownMenuItem(value: 'PRODUCTION', child: Text('Production')),
                      DropdownMenuItem(value: 'MATERIAL', child: Text('Material')),
                      DropdownMenuItem(value: 'GENERAL', child: Text('General')),
                    ],
                    onChanged: (val) {
                      if (val != null) setState(() => _systemLogsModuleFilter = val);
                    },
                  ),
                ),
              ),
            ],
          ),
        ),

        Expanded(
          child: _loadingSystemLogs
              ? const Center(child: CircularProgressIndicator())
              : filtered.isEmpty
                  ? const Center(
                      child: Text('No system audit logs found.', style: TextStyle(color: Color(0xFF64748B))),
                    )
                  : ListView.separated(
                      padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 4),
                      itemCount: filtered.length,
                      separatorBuilder: (_, index) => const SizedBox(height: 8),
                      itemBuilder: (context, idx) {
                        final item = filtered[idx];
                        return InkWell(
                          onTap: () => _openSystemLogDetail(item),
                          borderRadius: BorderRadius.circular(10),
                          child: Container(
                            padding: const EdgeInsets.all(12),
                            decoration: BoxDecoration(
                              color: Colors.white,
                              borderRadius: BorderRadius.circular(10),
                              border: Border.all(color: const Color(0xFFE2E8F0)),
                              boxShadow: [
                                BoxShadow(color: Colors.black.withValues(alpha: 0.02), blurRadius: 4, offset: const Offset(0, 2)),
                              ],
                            ),
                            child: Column(
                              crossAxisAlignment: CrossAxisAlignment.start,
                              children: [
                                Row(
                                  mainAxisAlignment: MainAxisAlignment.spaceBetween,
                                  children: [
                                    Row(
                                      children: [
                                        Text(
                                          item.actorName ?? 'System',
                                          style: const TextStyle(fontSize: 12.5, fontWeight: FontWeight.bold, color: Color(0xFF0F172A)),
                                        ),
                                        const SizedBox(width: 6),
                                        _buildRoleBadge(item.actorRole),
                                      ],
                                    ),
                                    Container(
                                      padding: const EdgeInsets.symmetric(horizontal: 6, vertical: 2),
                                      decoration: BoxDecoration(
                                        color: const Color(0xFFEFF6FF),
                                        borderRadius: BorderRadius.circular(4),
                                        border: Border.all(color: const Color(0xFFBFDBFE)),
                                      ),
                                      child: Text(
                                        item.action,
                                        style: const TextStyle(fontSize: 9.5, fontWeight: FontWeight.bold, color: Color(0xFF1D4ED8)),
                                      ),
                                    ),
                                  ],
                                ),
                                const SizedBox(height: 6),
                                Text(
                                  item.description,
                                  style: const TextStyle(fontSize: 13, fontWeight: FontWeight.w600, color: Color(0xFF1E293B)),
                                ),
                                const SizedBox(height: 6),
                                Row(
                                  mainAxisAlignment: MainAxisAlignment.spaceBetween,
                                  children: [
                                    Text(
                                      item.module,
                                      style: const TextStyle(fontSize: 10.5, fontWeight: FontWeight.bold, color: Color(0xFF64748B)),
                                    ),
                                    Text(
                                      _formatDate(item.createdAt),
                                      style: const TextStyle(fontSize: 10.5, color: Color(0xFF94A3B8)),
                                    ),
                                  ],
                                ),
                              ],
                            ),
                          ),
                        );
                      },
                    ),
        ),
      ],
    );
  }
}
