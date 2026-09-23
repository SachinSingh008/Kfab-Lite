import 'package:flutter/material.dart';
import '../../core/state/auth_state.dart';
import '../../core/models/chat_models.dart';

class TeamChatScreen extends StatefulWidget {
  final AuthState authState;

  const TeamChatScreen({super.key, required this.authState});

  @override
  State<TeamChatScreen> createState() => _TeamChatScreenState();
}

class _TeamChatScreenState extends State<TeamChatScreen> {
  final _msgController = TextEditingController();
  final ScrollController _scrollController = ScrollController();

  late UserRole _simulatedRole;

  // Selected Channel
  String _activeGroupId = 'grp-bay1-bridge';

  // Target audience for Admin/Lead when sending messages
  TargetScope _selectedTargetScope = TargetScope.all;
  UserRole? _selectedTargetRole;

  // Pending attachment before send
  String? _pendingImageUrl;
  String? _pendingCaption;

  // Sample inspection photos for demo & device testing
  static const String weldPhoto =
      'https://images.unsplash.com/photo-1504307651254-35680f356dfd?auto=format&fit=crop&w=800&q=80';
  static const String challanPhoto =
      'https://images.unsplash.com/photo-1586528116311-ad8dd3c8310d?auto=format&fit=crop&w=800&q=80';
  static const String cranePhoto =
      'https://images.unsplash.com/photo-1541888946425-d0fbb186c5f7?auto=format&fit=crop&w=800&q=80';

  // Available Groups
  final List<ChatGroupModel> _groups = [
    const ChatGroupModel(
      id: 'grp-bay1-bridge',
      name: 'Bay 1 Operations & Accounts Bridge',
      description: 'Fabrication muster, site QA inspection photos, and invoice audit',
      avatar: '🏗️',
      createdBy: 'usr-superadmin',
      members: [
        ChatGroupMemberModel(
          userId: 'usr-superadmin',
          name: 'Super Administrator',
          username: 'superadmin',
          role: UserRole.superAdmin,
          isGroupLead: true,
          canViewAll: true,
        ),
        ChatGroupMemberModel(
          userId: 'usr-admin',
          name: 'Plant Admin',
          username: 'admin',
          role: UserRole.admin,
          isGroupLead: true,
          canViewAll: true,
        ),
        ChatGroupMemberModel(
          userId: 'usr-supervisor',
          name: 'Bay Supervisor (Imran)',
          username: 'supervisor',
          role: UserRole.supervisor,
          isGroupLead: false,
          canViewAll: false, // "View only his side"
        ),
        ChatGroupMemberModel(
          userId: 'usr-supervisor2',
          name: 'Shop Supervisor (Vikram)',
          username: 'supervisor2',
          role: UserRole.supervisor,
          isGroupLead: false,
          canViewAll: false, // "View only his side"
        ),
        ChatGroupMemberModel(
          userId: 'usr-accountant',
          name: 'Accounts Auditor (Deshmukh)',
          username: 'accountant',
          role: UserRole.accounts,
          isGroupLead: false,
          canViewAll: false, // "View only his side"
        ),
        ChatGroupMemberModel(
          userId: 'usr-accountant2',
          name: 'Billing Accountant (Sneha)',
          username: 'accountant2',
          role: UserRole.accounts,
          isGroupLead: false,
          canViewAll: false, // "View only his side"
        ),
      ],
    ),
    const ChatGroupModel(
      id: 'grp-plant-alerts',
      name: 'All Plant Announcements',
      description: 'Shift rosters, safety muster, and plant-wide alerts',
      avatar: '📢',
      createdBy: 'usr-superadmin',
      members: [
        ChatGroupMemberModel(
          userId: 'usr-superadmin',
          name: 'Super Administrator',
          username: 'superadmin',
          role: UserRole.superAdmin,
          isGroupLead: true,
          canViewAll: true,
        ),
        ChatGroupMemberModel(
          userId: 'usr-admin',
          name: 'Plant Admin',
          username: 'admin',
          role: UserRole.admin,
          isGroupLead: true,
          canViewAll: true,
        ),
      ],
    ),
  ];

  // Messages repository
  late List<ChatMessageModel> _allMessages;

  @override
  void initState() {
    super.initState();
    _simulatedRole = widget.authState.role;

    // Initial messages representing the exact user requirement
    _allMessages = [
      const ChatMessageModel(
        id: '1',
        groupId: 'grp-bay1-bridge',
        senderId: 'usr-admin',
        senderName: 'Plant Admin',
        senderUsername: 'admin',
        senderRole: UserRole.admin,
        text: 'Bay 1 Operations and Accounts coordination bridge initialized. Granular privacy isolation is enabled.',
        time: '09:30 AM',
        targetScope: TargetScope.all,
      ),
      const ChatMessageModel(
        id: '2',
        groupId: 'grp-bay1-bridge',
        senderId: 'usr-supervisor',
        senderName: 'Imran (Supervisor)',
        senderUsername: 'supervisor',
        senderRole: UserRole.supervisor,
        text: 'Bay 1 column splice G1-G6 torque check completed at 750 N·m. Attached is the site weld photo.',
        imageUrl: weldPhoto,
        caption: 'Bay 1 Column Splice Inspection - PASS',
        time: '10:15 AM',
        targetScope: TargetScope.leadsAndSender, // Only Supervisor and Admin see this!
      ),
      const ChatMessageModel(
        id: '3',
        groupId: 'grp-bay1-bridge',
        senderId: 'usr-accountant',
        senderName: 'Deshmukh (Accounts)',
        senderUsername: 'accountant',
        senderRole: UserRole.accounts,
        text: 'Reviewing Inward Challan #8849 for 28.5 MT MS Plates. Found rate variance of ₹38,400. Verification required.',
        imageUrl: challanPhoto,
        caption: 'Challan #8849 Discrepancy Memo',
        time: '11:05 AM',
        targetScope: TargetScope.leadsAndSender, // Only Accountant and Admin see this!
      ),
      const ChatMessageModel(
        id: '4',
        groupId: 'grp-bay1-bridge',
        senderId: 'usr-admin',
        senderName: 'Plant Admin',
        senderUsername: 'admin',
        senderRole: UserRole.admin,
        text: 'Supervisor Imran: Proceed with UT inspection. 25T Hydra crane allocated for 13:00.',
        time: '11:45 AM',
        targetScope: TargetScope.role,
        targetRole: UserRole.supervisor, // Only Admin and Supervisor see this!
      ),
      const ChatMessageModel(
        id: '5',
        groupId: 'grp-bay1-bridge',
        senderId: 'usr-admin',
        senderName: 'Plant Admin',
        senderUsername: 'admin',
        senderRole: UserRole.admin,
        text: 'Accounts: Hold payment voucher for Challan #8849 until procurement credit note arrives.',
        time: '12:10 PM',
        targetScope: TargetScope.role,
        targetRole: UserRole.accounts, // Only Admin and Accountant see this!
      ),
    ];
  }

  @override
  void dispose() {
    _msgController.dispose();
    _scrollController.dispose();
    super.dispose();
  }

  ChatGroupModel get _currentGroup {
    return _groups.firstWhere(
      (g) => g.id == _activeGroupId,
      orElse: () => _groups.first,
    );
  }

  bool get _isAdminOrLead {
    if (_simulatedRole == UserRole.superAdmin || _simulatedRole == UserRole.admin) {
      return true;
    }
    final member = _currentGroup.members.firstWhere(
      (m) => m.role == _simulatedRole,
      orElse: () => const ChatGroupMemberModel(
        userId: '',
        name: '',
        username: '',
        role: UserRole.supervisor,
        isGroupLead: false,
        canViewAll: false,
      ),
    );
    return member.isGroupLead || member.canViewAll;
  }

  void _sendMessage() {
    final text = _msgController.text.trim();
    if (text.isEmpty && _pendingImageUrl == null) return;

    if (_isAdminOrLead) {
      _openAdminDispatchSheet(text, _pendingImageUrl, _pendingCaption);
    } else {
      _dispatchFinalMessage(
        text: text,
        imageUrl: _pendingImageUrl,
        caption: _pendingCaption,
        scope: TargetScope.leadsAndSender,
      );
    }
  }

  void _dispatchFinalMessage({
    required String text,
    String? imageUrl,
    String? caption,
    required TargetScope scope,
    UserRole? targetRole,
    List<String>? targetUserIds,
    List<String>? targetUserNames,
  }) {
    final now = TimeOfDay.now();
    final minuteStr = now.minute.toString().padLeft(2, '0');
    final period = now.period == DayPeriod.am ? 'AM' : 'PM';
    final timeStr = '${now.hourOfPeriod}:$minuteStr $period';

    setState(() {
      _allMessages.add(
        ChatMessageModel(
          id: DateTime.now().millisecondsSinceEpoch.toString(),
          groupId: _activeGroupId,
          senderId: 'usr-${_simulatedRole.name}',
          senderName: '${widget.authState.userName} (${_simulatedRole.displayName})',
          senderUsername: widget.authState.userEmail.isNotEmpty ? widget.authState.userEmail : _simulatedRole.name,
          senderRole: _simulatedRole,
          text: text,
          imageUrl: imageUrl,
          caption: caption,
          time: timeStr,
          targetScope: scope,
          targetRole: targetRole,
          targetUserIds: targetUserIds,
          targetUserNames: targetUserNames,
          isRead: true,
        ),
      );
      _msgController.clear();
      _pendingImageUrl = null;
      _pendingCaption = null;
    });

    Future.delayed(const Duration(milliseconds: 100), () {
      if (_scrollController.hasClients) {
        _scrollController.animateTo(
          _scrollController.position.maxScrollExtent,
          duration: const Duration(milliseconds: 250),
          curve: Curves.easeOut,
        );
      }
    });
  }

  void _openAdminDispatchSheet(String text, String? imageUrl, String? caption) {
    final accountants = _currentGroup.members.where((m) => m.role == UserRole.accounts).toList();
    final supervisors = _currentGroup.members.where((m) => m.role == UserRole.supervisor).toList();

    showModalBottomSheet(
      context: context,
      backgroundColor: Colors.white,
      shape: const RoundedRectangleBorder(
        borderRadius: BorderRadius.vertical(top: Radius.circular(20)),
      ),
      builder: (ctx) {
        return SafeArea(
          child: Padding(
            padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 12),
            child: SingleChildScrollView(
              child: Column(
                mainAxisSize: MainAxisSize.min,
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Row(
                    mainAxisAlignment: MainAxisAlignment.spaceBetween,
                    children: [
                      const Row(
                        children: [
                          Icon(Icons.lock, size: 18, color: Color(0xFF16A34A)),
                          SizedBox(width: 8),
                          Text(
                            'Choose Recipient Audience',
                            style: TextStyle(fontSize: 15, fontWeight: FontWeight.bold, color: Color(0xFF0F172A)),
                          ),
                        ],
                      ),
                      IconButton(
                        icon: const Icon(Icons.close, size: 20),
                        onPressed: () => Navigator.pop(ctx),
                      ),
                    ],
                  ),
                  if (text.isNotEmpty) ...[
                    Container(
                      width: double.infinity,
                      padding: const EdgeInsets.all(8),
                      margin: const EdgeInsets.only(bottom: 10),
                      decoration: BoxDecoration(
                        color: const Color(0xFFF1F5F9),
                        borderRadius: BorderRadius.circular(8),
                      ),
                      child: Text(
                        '"$text"',
                        style: const TextStyle(fontSize: 11, fontStyle: FontStyle.italic, color: Color(0xFF334155)),
                        maxLines: 2,
                        overflow: TextOverflow.ellipsis,
                      ),
                    ),
                  ],
                  // 1. Everyone
                  ListTile(
                    leading: const CircleAvatar(
                      backgroundColor: Color(0xFFECFDF5),
                      child: Icon(Icons.public, color: Color(0xFF16A34A)),
                    ),
                    title: const Text('Everyone in Channel', style: TextStyle(fontSize: 13, fontWeight: FontWeight.bold)),
                    subtitle: const Text('Visible to all members', style: TextStyle(fontSize: 11)),
                    trailing: const Chip(
                      label: Text('Send All', style: TextStyle(fontSize: 10, fontWeight: FontWeight.bold)),
                      backgroundColor: Color(0xFFDCFCE7),
                    ),
                    onTap: () {
                      Navigator.pop(ctx);
                      _dispatchFinalMessage(
                        text: text,
                        imageUrl: imageUrl,
                        caption: caption,
                        scope: TargetScope.all,
                      );
                    },
                  ),
                  const Divider(height: 1),
                  // 2. All Accountants
                  ListTile(
                    leading: const CircleAvatar(
                      backgroundColor: Color(0xFFEFF6FF),
                      child: Icon(Icons.account_balance, color: Color(0xFF2563EB)),
                    ),
                    title: const Text('All Accountants (Account All)', style: TextStyle(fontSize: 13, fontWeight: FontWeight.bold)),
                    subtitle: Text('Visible to Admin & all ${accountants.length} Accountants', style: const TextStyle(fontSize: 11)),
                    onTap: () {
                      Navigator.pop(ctx);
                      _dispatchFinalMessage(
                        text: text,
                        imageUrl: imageUrl,
                        caption: caption,
                        scope: TargetScope.role,
                        targetRole: UserRole.accounts,
                      );
                    },
                  ),
                  // 2b. Specific Accountants
                  ...accountants.map((acc) => ListTile(
                    contentPadding: const EdgeInsets.only(left: 32, right: 16),
                    leading: const Icon(Icons.person, size: 18, color: Color(0xFF64748B)),
                    title: Text('Accountant: ${acc.name}', style: const TextStyle(fontSize: 12, fontWeight: FontWeight.w600)),
                    subtitle: Text('@${acc.username}', style: const TextStyle(fontSize: 10)),
                    trailing: const Text('Only Him', style: TextStyle(fontSize: 10, color: Color(0xFF2563EB), fontWeight: FontWeight.bold)),
                    onTap: () {
                      Navigator.pop(ctx);
                      _dispatchFinalMessage(
                        text: text,
                        imageUrl: imageUrl,
                        caption: caption,
                        scope: TargetScope.users,
                        targetUserIds: [acc.userId],
                        targetUserNames: [acc.name],
                      );
                    },
                  )),
                  const Divider(height: 1),
                  // 3. All Supervisors
                  ListTile(
                    leading: const CircleAvatar(
                      backgroundColor: Color(0xFFFFFBEB),
                      child: Icon(Icons.engineering, color: Color(0xFFD97706)),
                    ),
                    title: const Text('All Supervisors (Supervisor All)', style: TextStyle(fontSize: 13, fontWeight: FontWeight.bold)),
                    subtitle: Text('Visible to Admin & all ${supervisors.length} Supervisors', style: const TextStyle(fontSize: 11)),
                    onTap: () {
                      Navigator.pop(ctx);
                      _dispatchFinalMessage(
                        text: text,
                        imageUrl: imageUrl,
                        caption: caption,
                        scope: TargetScope.role,
                        targetRole: UserRole.supervisor,
                      );
                    },
                  ),
                  // 3b. Specific Supervisors
                  ...supervisors.map((sup) => ListTile(
                    contentPadding: const EdgeInsets.only(left: 32, right: 16),
                    leading: const Icon(Icons.person, size: 18, color: Color(0xFF64748B)),
                    title: Text('Supervisor: ${sup.name}', style: const TextStyle(fontSize: 12, fontWeight: FontWeight.w600)),
                    subtitle: Text('@${sup.username}', style: const TextStyle(fontSize: 10)),
                    trailing: const Text('Only Him', style: TextStyle(fontSize: 10, color: Color(0xFFD97706), fontWeight: FontWeight.bold)),
                    onTap: () {
                      Navigator.pop(ctx);
                      _dispatchFinalMessage(
                        text: text,
                        imageUrl: imageUrl,
                        caption: caption,
                        scope: TargetScope.users,
                        targetUserIds: [sup.userId],
                        targetUserNames: [sup.name],
                      );
                    },
                  )),
                ],
              ),
            ),
          ),
        );
      },
    );
  }

  // Open Image Picker / Preset Dialog
  void _openImageAttachmentDialog() {
    showModalBottomSheet(
      context: context,
      backgroundColor: Colors.white,
      shape: const RoundedRectangleBorder(
        borderRadius: BorderRadius.vertical(top: Radius.circular(20)),
      ),
      builder: (ctx) {
        return SafeArea(
          child: Padding(
            padding: const EdgeInsets.all(16),
            child: Column(
              mainAxisSize: MainAxisSize.min,
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Row(
                  mainAxisAlignment: MainAxisAlignment.spaceBetween,
                  children: [
                    const Text(
                      'Attach Site Inspection Photo',
                      style: TextStyle(fontSize: 16, fontWeight: FontWeight.bold, color: Color(0xFF0F172A)),
                    ),
                    IconButton(
                      icon: const Icon(Icons.close, size: 20),
                      onPressed: () => Navigator.pop(ctx),
                    ),
                  ],
                ),
                const SizedBox(height: 8),
                const Text(
                  'Select an inspection capture or quick plant photo preset:',
                  style: TextStyle(fontSize: 12, color: Color(0xFF64748B)),
                ),
                const SizedBox(height: 16),
                ListTile(
                  leading: const CircleAvatar(
                    backgroundColor: Color(0xFFEFF6FF),
                    child: Icon(Icons.architecture, color: Color(0xFF2563EB)),
                  ),
                  title: const Text('Bay 1 Splice Weld Ultrasonic Check', style: TextStyle(fontSize: 13, fontWeight: FontWeight.w600)),
                  subtitle: const Text('AWS D1.1 ultrasonic weld inspection report photo', style: TextStyle(fontSize: 11)),
                  onTap: () {
                    Navigator.pop(ctx);
                    _showImagePreviewDialog(weldPhoto, 'Bay 1 Column Splice Inspection - PASS');
                  },
                ),
                ListTile(
                  leading: const CircleAvatar(
                    backgroundColor: Color(0xFFECFDF5),
                    child: Icon(Icons.receipt_long, color: Color(0xFF059669)),
                  ),
                  title: const Text('Vendor Gate Pass Tare Challan', style: TextStyle(fontSize: 13, fontWeight: FontWeight.w600)),
                  subtitle: const Text('Weighbridge entry challan with tare weight discrepancy', style: TextStyle(fontSize: 11)),
                  onTap: () {
                    Navigator.pop(ctx);
                    _showImagePreviewDialog(challanPhoto, 'Tare Weight Challan #8849 Discrepancy');
                  },
                ),
                ListTile(
                  leading: const CircleAvatar(
                    backgroundColor: Color(0xFFFFFBEB),
                    child: Icon(Icons.fire_truck, color: Color(0xFFD97706)),
                  ),
                  title: const Text('25T Hydra Mobile Crane Gantry', style: TextStyle(fontSize: 13, fontWeight: FontWeight.w600)),
                  subtitle: const Text('Heavy box girder rigging and bay allocation photo', style: TextStyle(fontSize: 11)),
                  onTap: () {
                    Navigator.pop(ctx);
                    _showImagePreviewDialog(cranePhoto, 'Bay 2 25T Hydra Crane Girder Placement');
                  },
                ),
              ],
            ),
          ),
        );
      },
    );
  }

  void _showImagePreviewDialog(String url, String defaultCaption) {
    final captionCtrl = TextEditingController(text: defaultCaption);

    showDialog(
      context: context,
      builder: (ctx) {
        return AlertDialog(
          backgroundColor: Colors.white,
          shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(16)),
          title: const Text('Send Photo Preview', style: TextStyle(fontSize: 15, fontWeight: FontWeight.bold)),
          content: Column(
            mainAxisSize: MainAxisSize.min,
            children: [
              ClipRRect(
                borderRadius: BorderRadius.circular(10),
                child: Image.network(
                  url,
                  height: 180,
                  width: double.infinity,
                  fit: BoxFit.cover,
                  errorBuilder: (_, error, stackTrace) => Container(
                    height: 140,
                    color: const Color(0xFFF1F5F9),
                    child: const Center(child: Icon(Icons.broken_image, size: 40, color: Colors.grey)),
                  ),
                ),
              ),
              const SizedBox(height: 12),
              TextField(
                controller: captionCtrl,
                style: const TextStyle(fontSize: 13),
                decoration: InputDecoration(
                  labelText: 'Caption',
                  hintText: 'Add a photo caption...',
                  filled: true,
                  fillColor: const Color(0xFFF8FAFC),
                  border: OutlineInputBorder(borderRadius: BorderRadius.circular(8)),
                  contentPadding: const EdgeInsets.symmetric(horizontal: 12, vertical: 10),
                ),
              ),
            ],
          ),
          actions: [
            TextButton(
              onPressed: () => Navigator.pop(ctx),
              child: const Text('Cancel'),
            ),
            ElevatedButton.icon(
              style: ElevatedButton.styleFrom(
                backgroundColor: const Color(0xFF16A34A),
                foregroundColor: Colors.white,
                shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(8)),
              ),
              icon: const Icon(Icons.send, size: 16),
              label: const Text('Attach & Send'),
              onPressed: () {
                Navigator.pop(ctx);
                setState(() {
                  _pendingImageUrl = url;
                  _pendingCaption = captionCtrl.text.trim();
                });
                _sendMessage();
              },
            ),
          ],
        );
      },
    );
  }

  // Lightbox Zoom View for Images
  void _openLightbox(String imageUrl, String? caption) {
    showDialog(
      context: context,
      builder: (ctx) {
        return Dialog(
          backgroundColor: Colors.black.withValues(alpha: 0.92),
          insetPadding: const EdgeInsets.all(12),
          shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(16)),
          child: Stack(
            children: [
              Padding(
                padding: const EdgeInsets.symmetric(vertical: 40, horizontal: 16),
                child: Column(
                  mainAxisSize: MainAxisSize.min,
                  children: [
                    InteractiveViewer(
                      minScale: 0.8,
                      maxScale: 3.5,
                      child: ClipRRect(
                        borderRadius: BorderRadius.circular(12),
                        child: Image.network(
                          imageUrl,
                          fit: BoxFit.contain,
                          errorBuilder: (_, error, stackTrace) => const Icon(Icons.broken_image, color: Colors.white, size: 60),
                        ),
                      ),
                    ),
                    if (caption != null && caption.isNotEmpty) ...[
                      const SizedBox(height: 14),
                      Container(
                        padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 6),
                        decoration: BoxDecoration(
                          color: Colors.black.withValues(alpha: 0.6),
                          borderRadius: BorderRadius.circular(8),
                        ),
                        child: Text(
                          caption,
                          style: const TextStyle(color: Colors.white, fontSize: 12, fontWeight: FontWeight.w500),
                          textAlign: TextAlign.center,
                        ),
                      ),
                    ],
                  ],
                ),
              ),
              Positioned(
                top: 8,
                right: 8,
                child: IconButton(
                  icon: const Icon(Icons.close, color: Colors.white, size: 24),
                  onPressed: () => Navigator.pop(ctx),
                ),
              ),
            ],
          ),
        );
      },
    );
  }

  // Super Admin: Create Group Modal
  void _openCreateGroupModal() {
    final nameCtrl = TextEditingController();
    final descCtrl = TextEditingController();
    String avatar = '🏭';

    // Member configs
    final memberConfigs = [
      {'username': 'superadmin', 'name': 'Super Administrator', 'role': UserRole.superAdmin, 'lead': true, 'viewAll': true},
      {'username': 'admin', 'name': 'Plant Admin', 'role': UserRole.admin, 'lead': true, 'viewAll': true},
      {'username': 'supervisor', 'name': 'Bay Supervisor', 'role': UserRole.supervisor, 'lead': false, 'viewAll': false},
      {'username': 'accountant', 'name': 'Accounts Auditor', 'role': UserRole.accounts, 'lead': false, 'viewAll': false},
    ];

    showModalBottomSheet(
      context: context,
      isScrollControlled: true,
      backgroundColor: Colors.white,
      shape: const RoundedRectangleBorder(
        borderRadius: BorderRadius.vertical(top: Radius.circular(24)),
      ),
      builder: (ctx) {
        return StatefulBuilder(
          builder: (context, setModalState) {
            return Padding(
              padding: EdgeInsets.only(
                left: 20,
                right: 20,
                top: 20,
                bottom: MediaQuery.of(context).viewInsets.bottom + 20,
              ),
              child: SingleChildScrollView(
                child: Column(
                  mainAxisSize: MainAxisSize.min,
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Row(
                      mainAxisAlignment: MainAxisAlignment.spaceBetween,
                      children: [
                        const Row(
                          children: [
                            Icon(Icons.group_add, color: Color(0xFF16A34A)),
                            SizedBox(width: 8),
                            Text(
                              'Super Admin: Create Group',
                              style: TextStyle(fontSize: 16, fontWeight: FontWeight.bold, color: Color(0xFF0F172A)),
                            ),
                          ],
                        ),
                        IconButton(
                          icon: const Icon(Icons.close),
                          onPressed: () => Navigator.pop(ctx),
                        ),
                      ],
                    ),
                    const SizedBox(height: 12),
                    TextField(
                      controller: nameCtrl,
                      style: const TextStyle(fontSize: 13),
                      decoration: InputDecoration(
                        labelText: 'Group Channel Name *',
                        hintText: 'e.g. Bay 2 Fitup & Quality',
                        border: OutlineInputBorder(borderRadius: BorderRadius.circular(8)),
                      ),
                    ),
                    const SizedBox(height: 10),
                    TextField(
                      controller: descCtrl,
                      style: const TextStyle(fontSize: 13),
                      decoration: InputDecoration(
                        labelText: 'Scope / Description',
                        hintText: 'e.g. Fabrication bay inspections & accounts verification',
                        border: OutlineInputBorder(borderRadius: BorderRadius.circular(8)),
                      ),
                    ),
                    const SizedBox(height: 16),
                    const Text(
                      'Members & Visibility Rights:',
                      style: TextStyle(fontSize: 13, fontWeight: FontWeight.bold, color: Color(0xFF0F172A)),
                    ),
                    const SizedBox(height: 6),
                    ...memberConfigs.map((m) {
                      final isLead = m['lead'] as bool;
                      final viewAll = m['viewAll'] as bool;

                      return Container(
                        margin: const EdgeInsets.only(bottom: 8),
                        padding: const EdgeInsets.all(10),
                        decoration: BoxDecoration(
                          color: const Color(0xFFF8FAFC),
                          borderRadius: BorderRadius.circular(8),
                          border: Border.all(color: const Color(0xFFE2E8F0)),
                        ),
                        child: Row(
                          children: [
                            Expanded(
                              child: Column(
                                crossAxisAlignment: CrossAxisAlignment.start,
                                children: [
                                  Text(
                                    '${m['name']} (@${m['username']})',
                                    style: const TextStyle(fontSize: 12, fontWeight: FontWeight.bold),
                                  ),
                                  Text(
                                    viewAll ? '✓ Sees all messages' : '🔒 Own side only',
                                    style: TextStyle(
                                      fontSize: 10,
                                      fontWeight: FontWeight.w600,
                                      color: viewAll ? const Color(0xFF16A34A) : const Color(0xFFD97706),
                                    ),
                                  ),
                                ],
                              ),
                            ),
                            Row(
                              children: [
                                Row(
                                  children: [
                                    const Text('Lead', style: TextStyle(fontSize: 11)),
                                    Checkbox(
                                      value: isLead,
                                      activeColor: const Color(0xFFD97706),
                                      onChanged: (val) {
                                        setModalState(() {
                                          m['lead'] = val ?? false;
                                          if (val == true) m['viewAll'] = true;
                                        });
                                      },
                                    ),
                                  ],
                                ),
                                Row(
                                  children: [
                                    const Text('All View', style: TextStyle(fontSize: 11)),
                                    Checkbox(
                                      value: viewAll,
                                      activeColor: const Color(0xFF16A34A),
                                      onChanged: (val) {
                                        setModalState(() {
                                          m['viewAll'] = val ?? false;
                                        });
                                      },
                                    ),
                                  ],
                                ),
                              ],
                            ),
                          ],
                        ),
                      );
                    }),
                    const SizedBox(height: 12),
                    SizedBox(
                      width: double.infinity,
                      child: ElevatedButton(
                        style: ElevatedButton.styleFrom(
                          backgroundColor: const Color(0xFF16A34A),
                          foregroundColor: Colors.white,
                          padding: const EdgeInsets.symmetric(vertical: 12),
                          shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(8)),
                        ),
                        onPressed: () {
                          final name = nameCtrl.text.trim();
                          if (name.isEmpty) return;

                          final newMembers = memberConfigs.map((m) {
                            return ChatGroupMemberModel(
                              userId: 'usr-${m['username']}',
                              name: m['name'] as String,
                              username: m['username'] as String,
                              role: m['role'] as UserRole,
                              isGroupLead: m['lead'] as bool,
                              canViewAll: m['viewAll'] as bool,
                            );
                          }).toList();

                          final newGrp = ChatGroupModel(
                            id: 'grp-${DateTime.now().millisecondsSinceEpoch}',
                            name: name,
                            description: descCtrl.text.trim(),
                            avatar: avatar,
                            createdBy: 'usr-superadmin',
                            members: newMembers,
                          );

                          setState(() {
                            _groups.insert(0, newGrp);
                            _activeGroupId = newGrp.id;
                          });

                          Navigator.pop(ctx);
                        },
                        child: const Text('Save & Initialize Group', style: TextStyle(fontWeight: FontWeight.bold)),
                      ),
                    ),
                  ],
                ),
              ),
            );
          },
        );
      },
    );
  }

  @override
  Widget build(BuildContext context) {
    // Filter messages for current group and viewer
    final visibleMessages = _allMessages.where((msg) {
      if (msg.groupId != _activeGroupId) return false;
      return canUserSeeChatMessage(
        message: msg,
        currentUserId: 'usr-${_simulatedRole.name}',
        currentRole: _simulatedRole,
        members: _currentGroup.members,
      );
    }).toList();

    return Scaffold(
      backgroundColor: const Color(0xFFECE5DD), // WhatsApp authentic background
      body: Column(
        children: [
          // 1. Interactive Role Tester Bar (Top)
          Container(
            color: const Color(0xFF0F172A),
            padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 6),
            child: Row(
              children: [
                const Icon(Icons.visibility, color: Color(0xFF10B981), size: 14),
                const SizedBox(width: 6),
                const Text(
                  'View As:',
                  style: TextStyle(color: Colors.white70, fontSize: 11, fontWeight: FontWeight.bold),
                ),
                const SizedBox(width: 8),
                Expanded(
                  child: SingleChildScrollView(
                    scrollDirection: Axis.horizontal,
                    child: Row(
                      children: [
                        _buildRoleChip(UserRole.superAdmin, 'Super Admin'),
                        _buildRoleChip(UserRole.admin, 'Admin'),
                        _buildRoleChip(UserRole.supervisor, 'Supervisor'),
                        _buildRoleChip(UserRole.accounts, 'Accountant'),
                      ],
                    ),
                  ),
                ),
              ],
            ),
          ),

          // 2. Channel Selector Bar
          Container(
            color: Colors.white,
            padding: const EdgeInsets.symmetric(vertical: 6),
            child: Row(
              children: [
                Expanded(
                  child: SingleChildScrollView(
                    scrollDirection: Axis.horizontal,
                    padding: const EdgeInsets.symmetric(horizontal: 12),
                    child: Row(
                      children: _groups.map((grp) {
                        final isSelected = grp.id == _activeGroupId;
                        return Padding(
                          padding: const EdgeInsets.only(right: 6),
                          child: ChoiceChip(
                            label: Row(
                              mainAxisSize: MainAxisSize.min,
                              children: [
                                Text(grp.avatar),
                                const SizedBox(width: 4),
                                Text(grp.name),
                              ],
                            ),
                            selected: isSelected,
                            selectedColor: const Color(0xFF16A34A),
                            backgroundColor: const Color(0xFFF1F5F9),
                            labelStyle: TextStyle(
                              fontSize: 11,
                              fontWeight: FontWeight.bold,
                              color: isSelected ? Colors.white : const Color(0xFF334155),
                            ),
                            onSelected: (_) => setState(() => _activeGroupId = grp.id),
                          ),
                        );
                      }).toList(),
                    ),
                  ),
                ),
                if (_simulatedRole == UserRole.superAdmin || _simulatedRole == UserRole.admin)
                  Padding(
                    padding: const EdgeInsets.only(right: 8),
                    child: IconButton(
                      icon: const Icon(Icons.add_circle, color: Color(0xFF16A34A)),
                      tooltip: 'Super Admin: New Group',
                      onPressed: _openCreateGroupModal,
                    ),
                  ),
              ],
            ),
          ),

          // 3. Security Isolation Banner
          Container(
            width: double.infinity,
            padding: const EdgeInsets.symmetric(vertical: 4, horizontal: 16),
            color: const Color(0xFFFEF3C7),
            child: Row(
              mainAxisAlignment: MainAxisAlignment.center,
              children: [
                const Icon(Icons.lock, size: 12, color: Color(0xFFB45309)),
                const SizedBox(width: 6),
                Flexible(
                  child: Text(
                    _simulatedRole == UserRole.supervisor
                        ? 'Supervisor View: Accountant commercial notes are isolated.'
                        : _simulatedRole == UserRole.accounts
                            ? 'Accounts View: Supervisor site weld checks are isolated.'
                            : 'Admin View: Full channel visibility and audience routing active.',
                    style: const TextStyle(fontSize: 10, fontWeight: FontWeight.bold, color: Color(0xFF92400E)),
                    overflow: TextOverflow.ellipsis,
                  ),
                ),
              ],
            ),
          ),

          // 4. Messages Stream
          Expanded(
            child: visibleMessages.isEmpty
                ? Center(
                    child: Container(
                      padding: const EdgeInsets.all(16),
                      margin: const EdgeInsets.all(24),
                      decoration: BoxDecoration(
                        color: Colors.white.withValues(alpha: 0.9),
                        borderRadius: BorderRadius.circular(12),
                      ),
                      child: const Column(
                        mainAxisSize: MainAxisSize.min,
                        children: [
                          Icon(Icons.visibility_off, color: Colors.grey, size: 36),
                          SizedBox(height: 8),
                          Text(
                            'No messages visible to this role',
                            style: TextStyle(fontWeight: FontWeight.bold, fontSize: 13),
                          ),
                          SizedBox(height: 4),
                          Text(
                            'Peers are strictly isolated under the visibility matrix.',
                            style: TextStyle(fontSize: 11, color: Colors.grey),
                            textAlign: TextAlign.center,
                          ),
                        ],
                      ),
                    ),
                  )
                : ListView.builder(
                    controller: _scrollController,
                    padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 10),
                    itemCount: visibleMessages.length,
                    itemBuilder: (context, idx) {
                      final msg = visibleMessages[idx];
                      final isMe = msg.senderRole == _simulatedRole;

                      return _buildWhatsAppBubble(msg, isMe);
                    },
                  ),
          ),

          // 5. Admin Audience Targeting Selector (if Admin / Lead)
          if (_isAdminOrLead)
            Container(
              color: Colors.white,
              padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 4),
              child: Row(
                children: [
                  const Icon(Icons.alt_route, size: 14, color: Color(0xFF16A34A)),
                  const SizedBox(width: 4),
                  const Text('Send to:', style: TextStyle(fontSize: 11, fontWeight: FontWeight.bold)),
                  const SizedBox(width: 6),
                  ChoiceChip(
                    label: const Text('Everyone'),
                    selected: _selectedTargetScope == TargetScope.all,
                    labelStyle: const TextStyle(fontSize: 10, fontWeight: FontWeight.bold),
                    onSelected: (_) => setState(() {
                      _selectedTargetScope = TargetScope.all;
                      _selectedTargetRole = null;
                    }),
                  ),
                  const SizedBox(width: 4),
                  ChoiceChip(
                    label: const Text('Supervisors'),
                    selected: _selectedTargetScope == TargetScope.role && _selectedTargetRole == UserRole.supervisor,
                    labelStyle: const TextStyle(fontSize: 10, fontWeight: FontWeight.bold),
                    onSelected: (_) => setState(() {
                      _selectedTargetScope = TargetScope.role;
                      _selectedTargetRole = UserRole.supervisor;
                    }),
                  ),
                  const SizedBox(width: 4),
                  ChoiceChip(
                    label: const Text('Accounts'),
                    selected: _selectedTargetScope == TargetScope.role && _selectedTargetRole == UserRole.accounts,
                    labelStyle: const TextStyle(fontSize: 10, fontWeight: FontWeight.bold),
                    onSelected: (_) => setState(() {
                      _selectedTargetScope = TargetScope.role;
                      _selectedTargetRole = UserRole.accounts;
                    }),
                  ),
                ],
              ),
            ),

          // 6. WhatsApp Message Input Bar
          Container(
            padding: const EdgeInsets.fromLTRB(8, 6, 8, 10),
            color: const Color(0xFFF0F2F5),
            child: Row(
              children: [
                // Image / Camera Attachment Button
                IconButton(
                  icon: const Icon(Icons.camera_alt_rounded, color: Color(0xFF54656F)),
                  onPressed: _openImageAttachmentDialog,
                ),
                IconButton(
                  icon: const Icon(Icons.attach_file, color: Color(0xFF54656F)),
                  onPressed: _openImageAttachmentDialog,
                ),
                // Text Input
                Expanded(
                  child: Container(
                    decoration: BoxDecoration(
                      color: Colors.white,
                      borderRadius: BorderRadius.circular(24),
                      border: Border.all(color: const Color(0xFFE2E8F0)),
                    ),
                    padding: const EdgeInsets.symmetric(horizontal: 14),
                    child: TextField(
                      controller: _msgController,
                      style: const TextStyle(fontSize: 13),
                      decoration: InputDecoration(
                        hintText: _isAdminOrLead ? 'Type message (Targeted)...' : 'Type message (Private to Lead)...',
                        hintStyle: const TextStyle(fontSize: 12, color: Color(0xFF94A3B8)),
                        border: InputBorder.none,
                      ),
                      onSubmitted: (_) => _sendMessage(),
                    ),
                  ),
                ),
                const SizedBox(width: 6),
                InkWell(
                  onTap: _sendMessage,
                  borderRadius: BorderRadius.circular(22),
                  child: Container(
                    width: 42,
                    height: 42,
                    decoration: const BoxDecoration(
                      color: Color(0xFF16A34A),
                      shape: BoxShape.circle,
                    ),
                    child: const Icon(Icons.send_rounded, color: Colors.white, size: 20),
                  ),
                ),
              ],
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildRoleChip(UserRole role, String label) {
    final isSelected = _simulatedRole == role;
    return Padding(
      padding: const EdgeInsets.only(right: 4),
      child: InkWell(
        onTap: () => setState(() => _simulatedRole = role),
        borderRadius: BorderRadius.circular(6),
        child: Container(
          padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 3),
          decoration: BoxDecoration(
            color: isSelected ? const Color(0xFF16A34A) : const Color(0xFF1E293B),
            borderRadius: BorderRadius.circular(6),
            border: Border.all(
              color: isSelected ? const Color(0xFF4ADE80) : const Color(0xFF334155),
            ),
          ),
          child: Text(
            label,
            style: TextStyle(
              fontSize: 10,
              fontWeight: FontWeight.bold,
              color: isSelected ? Colors.white : const Color(0xFF94A3B8),
            ),
          ),
        ),
      ),
    );
  }

  Widget _buildWhatsAppBubble(ChatMessageModel msg, bool isMe) {
    // Privacy Scope Tag
    Widget? scopeTag;
    if (msg.targetScope == TargetScope.leadsAndSender) {
      scopeTag = Container(
        padding: const EdgeInsets.symmetric(horizontal: 5, vertical: 1.5),
        decoration: BoxDecoration(
          color: const Color(0xFFFEF3C7),
          borderRadius: BorderRadius.circular(4),
        ),
        child: Text(
          '🔒 Admin & ${msg.senderRole.displayName}',
          style: const TextStyle(fontSize: 8.5, fontWeight: FontWeight.bold, color: Color(0xFFB45309)),
        ),
      );
    } else if (msg.targetScope == TargetScope.role) {
      scopeTag = Container(
        padding: const EdgeInsets.symmetric(horizontal: 5, vertical: 1.5),
        decoration: BoxDecoration(
          color: const Color(0xFFDBEAFE),
          borderRadius: BorderRadius.circular(4),
        ),
        child: Text(
          '🔒 Only ${msg.targetRole?.displayName}',
          style: const TextStyle(fontSize: 8.5, fontWeight: FontWeight.bold, color: Color(0xFF1E40AF)),
        ),
      );
    }

    return Align(
      alignment: isMe ? Alignment.centerRight : Alignment.centerLeft,
      child: Container(
        margin: const EdgeInsets.only(bottom: 10),
        constraints: BoxConstraints(
          maxWidth: MediaQuery.of(context).size.width * 0.82,
        ),
        padding: const EdgeInsets.all(10),
        decoration: BoxDecoration(
          color: isMe ? const Color(0xFFD9FDD3) : Colors.white,
          borderRadius: BorderRadius.only(
            topLeft: const Radius.circular(14),
            topRight: const Radius.circular(14),
            bottomLeft: Radius.circular(isMe ? 14 : 2),
            bottomRight: Radius.circular(isMe ? 2 : 14),
          ),
          boxShadow: [
            BoxShadow(
              color: Colors.black.withValues(alpha: 0.04),
              blurRadius: 4,
              offset: const Offset(0, 1),
            ),
          ],
        ),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            // Sender info & Privacy badge
            Row(
              mainAxisSize: MainAxisSize.min,
              children: [
                Text(
                  isMe ? 'You' : msg.senderName,
                  style: const TextStyle(
                    fontSize: 11,
                    fontWeight: FontWeight.bold,
                    color: Color(0xFF0F172A),
                  ),
                ),
                const SizedBox(width: 6),
                Container(
                  padding: const EdgeInsets.symmetric(horizontal: 4, vertical: 1),
                  decoration: BoxDecoration(
                    color: const Color(0xFFF1F5F9),
                    borderRadius: BorderRadius.circular(3),
                  ),
                  child: Text(
                    msg.senderRole.displayName,
                    style: const TextStyle(fontSize: 8, fontWeight: FontWeight.w800, color: Color(0xFF475569)),
                  ),
                ),
                if (scopeTag != null) ...[
                  const SizedBox(width: 6),
                  scopeTag,
                ],
              ],
            ),
            const SizedBox(height: 4),

            // Image Thumbnail if present
            if (msg.imageUrl != null) ...[
              GestureDetector(
                onTap: () => _openLightbox(msg.imageUrl!, msg.caption ?? msg.text),
                child: Container(
                  margin: const EdgeInsets.only(bottom: 6),
                  decoration: BoxDecoration(
                    borderRadius: BorderRadius.circular(8),
                    border: Border.all(color: Colors.black12),
                  ),
                  child: ClipRRect(
                    borderRadius: BorderRadius.circular(8),
                    child: Image.network(
                      msg.imageUrl!,
                      height: 150,
                      width: double.infinity,
                      fit: BoxFit.cover,
                      errorBuilder: (_, error, stackTrace) => Container(
                        height: 100,
                        color: Colors.black12,
                        child: const Center(child: Icon(Icons.broken_image, color: Colors.grey)),
                      ),
                    ),
                  ),
                ),
              ),
              if (msg.caption != null && msg.caption!.isNotEmpty) ...[
                Text(
                  msg.caption!,
                  style: const TextStyle(fontSize: 11, fontWeight: FontWeight.w600, color: Color(0xFF0F172A)),
                ),
                const SizedBox(height: 2),
              ],
            ],

            // Message Body
            if (msg.text.isNotEmpty)
              Text(
                msg.text,
                style: const TextStyle(
                  fontSize: 12.5,
                  color: Color(0xFF1E293B),
                  height: 1.35,
                ),
              ),

            const SizedBox(height: 3),
            // Timestamp and checkmarks
            Row(
              mainAxisSize: MainAxisSize.min,
              mainAxisAlignment: MainAxisAlignment.end,
              children: [
                Text(
                  msg.time,
                  style: const TextStyle(fontSize: 9, color: Color(0xFF64748B)),
                ),
                if (isMe) ...[
                  const SizedBox(width: 4),
                  const Icon(Icons.done_all, size: 13, color: Color(0xFF16A34A)),
                ],
              ],
            ),
          ],
        ),
      ),
    );
  }
}
