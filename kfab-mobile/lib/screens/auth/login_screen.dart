import 'package:flutter/material.dart';
import '../../core/state/auth_state.dart';
import '../shell/main_shell_screen.dart';

class LoginScreen extends StatefulWidget {
  final AuthState authState;

  const LoginScreen({super.key, required this.authState});

  @override
  State<LoginScreen> createState() => _LoginScreenState();
}

class _LoginScreenState extends State<LoginScreen> {
  final _usernameController = TextEditingController(text: 'superadmin');
  final _passwordController = TextEditingController(text: 'admin123');
  bool _isLoading = false;
  bool _obscurePassword = true;
  bool _rememberDevice = true;
  String? _errorMessage;
  String _selectedRole = 'superadmin';

  @override
  void dispose() {
    _usernameController.dispose();
    _passwordController.dispose();
    super.dispose();
  }

  void _onRoleSelect(String roleKey, String username, String password, UserRole role) {
    setState(() {
      _selectedRole = roleKey;
      _usernameController.text = username;
      _passwordController.text = password;
      _errorMessage = null;
    });
  }

  void _handleLogin() async {
    final username = _usernameController.text.trim();
    final password = _passwordController.text;

    if (username.isEmpty || password.isEmpty) {
      setState(() {
        _errorMessage = 'Please enter both username/email and password.';
      });
      return;
    }

    setState(() {
      _isLoading = true;
      _errorMessage = null;
    });

    await Future.delayed(const Duration(milliseconds: 300));

    UserRole assignedRole = UserRole.superAdmin;
    if (_selectedRole == 'admin') {
      assignedRole = UserRole.admin;
    } else if (_selectedRole == 'supervisor') {
      assignedRole = UserRole.supervisor;
    } else if (_selectedRole == 'accountant') {
      assignedRole = UserRole.accounts;
    } else {
      assignedRole = UserRole.superAdmin;
    }

    widget.authState.login(
      email: username,
      password: password,
      role: assignedRole,
    );

    if (mounted) {
      setState(() => _isLoading = false);
      Navigator.pushReplacement(
        context,
        MaterialPageRoute(
          builder: (context) => MainShellScreen(authState: widget.authState),
        ),
      );
    }
  }

  void _showForgotPasswordDialog() {
    final emailCtrl = TextEditingController(text: _usernameController.text);
    bool dispatched = false;

    showDialog(
      context: context,
      builder: (dialogCtx) {
        return StatefulBuilder(
          builder: (context, setDialogState) {
            return AlertDialog(
              backgroundColor: Colors.white,
              shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(16)),
              title: Row(
                children: const [
                  Icon(Icons.key, color: Color(0xFF0F172A), size: 20),
                  SizedBox(width: 8),
                  Text(
                    'Password Assistance',
                    style: TextStyle(fontSize: 16, fontWeight: FontWeight.bold, color: Color(0xFF0F172A)),
                  ),
                ],
              ),
              content: !dispatched
                  ? Column(
                      mainAxisSize: MainAxisSize.min,
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        const Text(
                          'Corporate Email Address',
                          style: TextStyle(fontSize: 12, fontWeight: FontWeight.w600, color: Color(0xFF1E293B)),
                        ),
                        const SizedBox(height: 6),
                        TextField(
                          controller: emailCtrl,
                          style: const TextStyle(fontSize: 13, fontFamily: 'monospace'),
                          decoration: InputDecoration(
                            hintText: 'name@kfab.in',
                            border: OutlineInputBorder(borderRadius: BorderRadius.circular(8)),
                            contentPadding: const EdgeInsets.symmetric(horizontal: 12, vertical: 10),
                          ),
                        ),
                        const SizedBox(height: 10),
                        const Text(
                          'Default credentials are superadmin with password admin123.',
                          style: TextStyle(fontSize: 11, color: Color(0xFF64748B)),
                        ),
                      ],
                    )
                  : Container(
                      padding: const EdgeInsets.all(12),
                      decoration: BoxDecoration(
                        color: const Color(0xFFECFDF5),
                        borderRadius: BorderRadius.circular(10),
                        border: Border.all(color: const Color(0xFFA7F3D0)),
                      ),
                      child: const Row(
                        children: [
                          Icon(Icons.check_circle, color: Color(0xFF10B981), size: 20),
                          SizedBox(width: 8),
                          Expanded(
                            child: Text(
                              'Reset link dispatched. Please check your inbox.',
                              style: TextStyle(fontSize: 12, color: Color(0xFF065F46), fontWeight: FontWeight.w600),
                            ),
                          ),
                        ],
                      ),
                    ),
              actions: [
                if (!dispatched) ...[
                  TextButton(
                    onPressed: () => Navigator.pop(dialogCtx),
                    child: const Text('Cancel', style: TextStyle(color: Color(0xFF64748B))),
                  ),
                  ElevatedButton(
                    style: ElevatedButton.styleFrom(
                      backgroundColor: const Color(0xFF0F172A),
                      foregroundColor: Colors.white,
                      shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(8)),
                    ),
                    onPressed: () {
                      setDialogState(() => dispatched = true);
                    },
                    child: const Text('Send Reset Link'),
                  ),
                ] else ...[
                  ElevatedButton(
                    style: ElevatedButton.styleFrom(
                      backgroundColor: const Color(0xFF0F172A),
                      foregroundColor: Colors.white,
                      shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(8)),
                    ),
                    onPressed: () => Navigator.pop(dialogCtx),
                    child: const Text('Close'),
                  ),
                ],
              ],
            );
          },
        );
      },
    );
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: const Color(0xFFF8FAFC),
      body: SafeArea(
        child: Center(
          child: SingleChildScrollView(
            padding: const EdgeInsets.symmetric(horizontal: 24, vertical: 20),
            child: Column(
              mainAxisAlignment: MainAxisAlignment.center,
              children: [
                // Pure Logo matching Web (No Box / No Border)
                Image.asset(
                  'assets/images/kfab_logo.png',
                  width: 58,
                  height: 58,
                  fit: BoxFit.contain,
                  errorBuilder: (context, error, stackTrace) {
                    return Image.asset(
                      'assets/logo.png',
                      width: 58,
                      height: 58,
                      fit: BoxFit.contain,
                      errorBuilder: (context, error, stackTrace) => const Icon(
                        Icons.precision_manufacturing,
                        color: Color(0xFFF59E0B),
                        size: 48,
                      ),
                    );
                  },
                ),
                const SizedBox(height: 12),

                // Brand Title
                RichText(
                  textAlign: TextAlign.center,
                  text: const TextSpan(
                    style: TextStyle(
                      fontSize: 26,
                      fontWeight: FontWeight.w900,
                      color: Color(0xFF0F172A),
                      letterSpacing: 0.5,
                    ),
                    children: [
                      TextSpan(text: 'KFAB'),
                      TextSpan(
                        text: '360',
                        style: TextStyle(color: Color(0xFFF59E0B)),
                      ),
                    ],
                  ),
                ),
                const SizedBox(height: 4),
                const Text(
                  'KFAB Infra Projects • Jejuri MIDC, Pune',
                  style: TextStyle(
                    fontSize: 12,
                    color: Color(0xFF64748B),
                    fontWeight: FontWeight.w500,
                  ),
                ),
                const SizedBox(height: 28),

                // Clean White Login Form Card (Exact match to Web Right Column)
                Container(
                  padding: const EdgeInsets.all(22),
                  decoration: BoxDecoration(
                    color: Colors.white,
                    borderRadius: BorderRadius.circular(16),
                    border: Border.all(color: const Color(0xFFE2E8F0)),
                    boxShadow: [
                      BoxShadow(
                        color: Colors.black.withValues(alpha: 0.04),
                        blurRadius: 16,
                        offset: const Offset(0, 4),
                      ),
                    ],
                  ),
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.stretch,
                    children: [
                      // Header
                      const Text(
                        'Sign In',
                        style: TextStyle(
                          fontSize: 22,
                          fontWeight: FontWeight.w900,
                          color: Color(0xFF0F172A),
                          letterSpacing: -0.2,
                        ),
                      ),
                      const SizedBox(height: 4),
                      const Text(
                        'Enter your credentials to access your enterprise workspace.',
                        style: TextStyle(
                          fontSize: 12,
                          color: Color(0xFF64748B),
                          fontWeight: FontWeight.normal,
                        ),
                      ),
                      const SizedBox(height: 20),

                      // Minimalist Segmented Role Switcher matching Web
                      const Text(
                        'QUICK ROLE SELECT',
                        style: TextStyle(
                          fontSize: 10.5,
                          fontWeight: FontWeight.w700,
                          color: Color(0xFF94A3B8),
                          letterSpacing: 0.8,
                        ),
                      ),
                      const SizedBox(height: 8),
                      Container(
                        padding: const EdgeInsets.all(3),
                        decoration: BoxDecoration(
                          color: const Color(0xFFF1F5F9),
                          borderRadius: BorderRadius.circular(12),
                          border: Border.all(color: const Color(0xFFE2E8F0)),
                        ),
                        child: Row(
                          children: [
                            _buildRolePill('superadmin', 'Super Admin', 'superadmin', 'admin123', UserRole.superAdmin),
                            const SizedBox(width: 4),
                            _buildRolePill('admin', 'Admin', 'admin', 'admin123', UserRole.admin),
                            const SizedBox(width: 4),
                            _buildRolePill('supervisor', 'Supervisor', 'supervisor', 'admin123', UserRole.supervisor),
                            const SizedBox(width: 4),
                            _buildRolePill('accountant', 'Accountant', 'accountant', 'admin123', UserRole.accounts),
                          ],
                        ),
                      ),
                      const SizedBox(height: 20),

                      // Username / Login ID Field
                      const Text(
                        'USERNAME / LOGIN ID',
                        style: TextStyle(
                          fontSize: 11,
                          fontWeight: FontWeight.w700,
                          color: Color(0xFF0F172A),
                          letterSpacing: 0.5,
                        ),
                      ),
                      const SizedBox(height: 6),
                      TextField(
                        controller: _usernameController,
                        style: const TextStyle(fontSize: 13, fontFamily: 'monospace', color: Color(0xFF0F172A)),
                        decoration: InputDecoration(
                          prefixIcon: const Icon(Icons.person_outline, size: 18, color: Color(0xFF94A3B8)),
                          hintText: 'superadmin',
                          fillColor: const Color(0xFFF8FAFC),
                          filled: true,
                          border: OutlineInputBorder(
                            borderRadius: BorderRadius.circular(10),
                            borderSide: const BorderSide(color: Color(0xFFCBD5E1)),
                          ),
                          enabledBorder: OutlineInputBorder(
                            borderRadius: BorderRadius.circular(10),
                            borderSide: const BorderSide(color: Color(0xFFCBD5E1)),
                          ),
                          focusedBorder: OutlineInputBorder(
                            borderRadius: BorderRadius.circular(10),
                            borderSide: const BorderSide(color: Color(0xFF0F172A), width: 1.5),
                          ),
                          contentPadding: const EdgeInsets.symmetric(horizontal: 14, vertical: 12),
                        ),
                      ),
                      const SizedBox(height: 14),

                      // Password Field
                      Row(
                        mainAxisAlignment: MainAxisAlignment.spaceBetween,
                        children: [
                          const Text(
                            'PASSWORD',
                            style: TextStyle(
                              fontSize: 11,
                              fontWeight: FontWeight.w700,
                              color: Color(0xFF0F172A),
                              letterSpacing: 0.5,
                            ),
                          ),
                          InkWell(
                            onTap: _showForgotPasswordDialog,
                            child: const Text(
                              'Forgot password?',
                              style: TextStyle(
                                fontSize: 11,
                                fontWeight: FontWeight.w600,
                                color: Color(0xFF64748B),
                              ),
                            ),
                          ),
                        ],
                      ),
                      const SizedBox(height: 6),
                      TextField(
                        controller: _passwordController,
                        obscureText: _obscurePassword,
                        style: const TextStyle(fontSize: 13, fontFamily: 'monospace', color: Color(0xFF0F172A)),
                        decoration: InputDecoration(
                          prefixIcon: const Icon(Icons.lock_outline, size: 18, color: Color(0xFF94A3B8)),
                          suffixIcon: IconButton(
                            icon: Icon(
                              _obscurePassword ? Icons.visibility_off : Icons.visibility,
                              size: 18,
                              color: const Color(0xFF64748B),
                            ),
                            onPressed: () => setState(() => _obscurePassword = !_obscurePassword),
                          ),
                          hintText: '••••••••',
                          fillColor: const Color(0xFFF8FAFC),
                          filled: true,
                          border: OutlineInputBorder(
                            borderRadius: BorderRadius.circular(10),
                            borderSide: const BorderSide(color: Color(0xFFCBD5E1)),
                          ),
                          enabledBorder: OutlineInputBorder(
                            borderRadius: BorderRadius.circular(10),
                            borderSide: const BorderSide(color: Color(0xFFCBD5E1)),
                          ),
                          focusedBorder: OutlineInputBorder(
                            borderRadius: BorderRadius.circular(10),
                            borderSide: const BorderSide(color: Color(0xFF0F172A), width: 1.5),
                          ),
                          contentPadding: const EdgeInsets.symmetric(horizontal: 14, vertical: 12),
                        ),
                      ),
                      const SizedBox(height: 8),

                      // Remember Device Checkbox
                      Row(
                        children: [
                          SizedBox(
                            width: 24,
                            height: 24,
                            child: Checkbox(
                              value: _rememberDevice,
                              onChanged: (v) => setState(() => _rememberDevice = v ?? true),
                              activeColor: const Color(0xFF0F172A),
                              shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(4)),
                            ),
                          ),
                          const SizedBox(width: 6),
                          const Text(
                            'Remember this device',
                            style: TextStyle(fontSize: 12, color: Color(0xFF475569)),
                          ),
                        ],
                      ),

                      if (_errorMessage != null) ...[
                        const SizedBox(height: 10),
                        Container(
                          padding: const EdgeInsets.all(10),
                          decoration: BoxDecoration(
                            color: const Color(0xFFFEF2F2),
                            borderRadius: BorderRadius.circular(8),
                            border: Border.all(color: const Color(0xFFFECACA)),
                          ),
                          child: Row(
                            children: [
                              const Icon(Icons.error_outline, size: 16, color: Color(0xFFDC2626)),
                              const SizedBox(width: 8),
                              Expanded(
                                child: Text(
                                  _errorMessage!,
                                  style: const TextStyle(fontSize: 11, color: Color(0xFFDC2626), fontWeight: FontWeight.w600),
                                ),
                              ),
                            ],
                          ),
                        ),
                      ],

                      const SizedBox(height: 18),

                      // Authoritative Sign In Button matching Web
                      SizedBox(
                        height: 48,
                        child: ElevatedButton(
                          style: ElevatedButton.styleFrom(
                            backgroundColor: const Color(0xFF0F172A),
                            foregroundColor: Colors.white,
                            elevation: 1,
                            shape: RoundedRectangleBorder(
                              borderRadius: BorderRadius.circular(10),
                            ),
                          ),
                          onPressed: _isLoading ? null : _handleLogin,
                          child: _isLoading
                              ? const SizedBox(
                                  width: 20,
                                  height: 20,
                                  child: CircularProgressIndicator(strokeWidth: 2, color: Colors.white),
                                )
                              : const Row(
                                  mainAxisAlignment: MainAxisAlignment.center,
                                  children: [
                                    Text(
                                      'SIGN IN TO WORKSPACE',
                                      style: TextStyle(fontSize: 12.5, fontWeight: FontWeight.w800, letterSpacing: 0.5),
                                    ),
                                    SizedBox(width: 8),
                                    Icon(Icons.arrow_forward, size: 16),
                                  ],
                                ),
                        ),
                      ),
                    ],
                  ),
                ),

                const SizedBox(height: 24),
                const Text(
                  '© 2026 KFAB Infra Projects Pvt. Ltd. All rights reserved.',
                  style: TextStyle(
                    fontSize: 11,
                    color: Color(0xFF94A3B8),
                    fontWeight: FontWeight.w500,
                  ),
                ),
              ],
            ),
          ),
        ),
      ),
    );
  }

  Widget _buildRolePill(String roleKey, String title, String user, String pass, UserRole role) {
    final isSelected = _selectedRole == roleKey;

    Color activeBg;
    Color activeFg;
    Border? border;

    if (role == UserRole.superAdmin) {
      activeBg = const Color(0xFF0F172A);
      activeFg = Colors.white;
    } else if (role == UserRole.admin) {
      activeBg = const Color(0xFFDC2626);
      activeFg = Colors.white;
    } else if (role == UserRole.supervisor) {
      activeBg = const Color(0xFFFACC15);
      activeFg = const Color(0xFF0F172A);
      border = Border.all(color: const Color(0xFFEAB308));
    } else {
      activeBg = const Color(0xFF16A34A);
      activeFg = Colors.white;
    }

    return Expanded(
      child: Material(
        color: Colors.transparent,
        child: InkWell(
          borderRadius: BorderRadius.circular(8),
          onTap: () => _onRoleSelect(roleKey, user, pass, role),
          child: AnimatedContainer(
            duration: const Duration(milliseconds: 180),
            padding: const EdgeInsets.symmetric(vertical: 8, horizontal: 2),
            decoration: BoxDecoration(
              color: isSelected ? activeBg : Colors.transparent,
              borderRadius: BorderRadius.circular(8),
              border: isSelected ? border : null,
              boxShadow: isSelected
                  ? [
                      BoxShadow(
                        color: activeBg.withValues(alpha: 0.3),
                        blurRadius: 4,
                        offset: const Offset(0, 2),
                      ),
                    ]
                  : null,
            ),
            child: Text(
              title,
              textAlign: TextAlign.center,
              maxLines: 1,
              overflow: TextOverflow.ellipsis,
              style: TextStyle(
                fontSize: 10.5,
                fontWeight: FontWeight.w700,
                color: isSelected ? activeFg : const Color(0xFF475569),
              ),
            ),
          ),
        ),
      ),
    );
  }
}
