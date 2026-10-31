import 'package:flutter/material.dart';
import '../../core/config/supabase_config.dart';
import '../../core/state/auth_state.dart';
import '../shell/main_shell_screen.dart';

class LoginScreen extends StatefulWidget {
  final AuthState authState;

  const LoginScreen({super.key, required this.authState});

  @override
  State<LoginScreen> createState() => _LoginScreenState();
}

class _LoginScreenState extends State<LoginScreen> {
  final _usernameController = TextEditingController(text: 'sachinasinghofficial@gmail.com');
  final _passwordController = TextEditingController(text: 'admin123');
  bool _isLoading = false;
  bool _obscurePassword = true;
  bool _rememberDevice = true;
  String? _errorMessage;
  String _selectedRole = 'superadmin';
  bool _isConnected = false;
  bool _isCheckingConnection = true;

  @override
  void initState() {
    super.initState();
    _checkDatabaseConnection();
  }

  @override
  void dispose() {
    _usernameController.dispose();
    _passwordController.dispose();
    super.dispose();
  }

  Future<void> _checkDatabaseConnection() async {
    final connected = await SupabaseConfig.verifyConnection();
    if (mounted) {
      setState(() {
        _isConnected = connected;
        _isCheckingConnection = false;
      });
    }
  }

  void _onRoleSelect(String roleKey, String email, UserRole role) {
    setState(() {
      _selectedRole = roleKey;
      _usernameController.text = email;
      _passwordController.text = 'admin123';
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

    UserRole assignedRole = UserRole.superAdmin;
    if (_selectedRole == 'admin') {
      assignedRole = UserRole.admin;
    } else if (_selectedRole == 'supervisor') {
      assignedRole = UserRole.supervisor;
    } else if (_selectedRole == 'accountant' || _selectedRole == 'account') {
      assignedRole = UserRole.accounts;
    } else {
      assignedRole = UserRole.superAdmin;
    }

    try {
      final success = await widget.authState.login(
        email: username,
        password: password,
        role: assignedRole,
      );

      if (success && mounted) {
        setState(() => _isLoading = false);
        Navigator.pushReplacement(
          context,
          MaterialPageRoute(
            builder: (context) => MainShellScreen(authState: widget.authState),
          ),
        );
      }
    } catch (err) {
      if (mounted) {
        String msg = err.toString().replaceAll('Exception: ', '');
        if (msg.contains('SocketFailed') ||
            msg.contains('Failed host lookup') ||
            msg.contains('No address associated') ||
            msg.contains('errno = 7')) {
          msg = 'Unable to connect to Supabase server. Please check your internet connection or Wi-Fi and verify device network permissions.';
        }
        setState(() {
          _isLoading = false;
          _errorMessage = msg;
        });
      }
    }
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
                // Pure Logo matching Web
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
                const SizedBox(height: 16),

                // Live Database Connection Badge
                Container(
                  padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 5),
                  decoration: BoxDecoration(
                    color: _isConnected ? const Color(0xFFF0FDF4) : const Color(0xFFFEF2F2),
                    borderRadius: BorderRadius.circular(20),
                    border: Border.all(
                      color: _isConnected ? const Color(0xFFBBF7D0) : const Color(0xFFFECACA),
                    ),
                  ),
                  child: Row(
                    mainAxisSize: MainAxisSize.min,
                    children: [
                      Container(
                        width: 7,
                        height: 7,
                        decoration: BoxDecoration(
                          color: _isConnected
                              ? const Color(0xFF16A34A)
                              : (_isCheckingConnection ? const Color(0xFFF59E0B) : const Color(0xFFDC2626)),
                          shape: BoxShape.circle,
                        ),
                      ),
                      const SizedBox(width: 6),
                      Text(
                        _isCheckingConnection
                            ? 'Checking Supabase Connection...'
                            : (_isConnected
                                ? 'Supabase Auth Live Connected'
                                : 'Offline / Server Unreachable'),
                        style: TextStyle(
                          fontSize: 10.5,
                          fontWeight: FontWeight.w700,
                          color: _isConnected ? const Color(0xFF15803D) : const Color(0xFFB91C1C),
                        ),
                      ),
                    ],
                  ),
                ),
                const SizedBox(height: 18),

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
                            _buildRolePill('superadmin', 'Super Admin', 'sachinasinghofficial@gmail.com', UserRole.superAdmin),
                            const SizedBox(width: 4),
                            _buildRolePill('admin', 'Admin', 'sachin.asingh18@gmail.com', UserRole.admin),
                            const SizedBox(width: 4),
                            _buildRolePill('supervisor', 'Supervisor', 'vikasyadav@gmail.com', UserRole.supervisor),
                            const SizedBox(width: 4),
                            _buildRolePill('account', 'Account', 'sachinacc@gmail.com', UserRole.accounts),
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
                        keyboardType: TextInputType.emailAddress,
                        style: const TextStyle(fontSize: 13, fontFamily: 'monospace', color: Color(0xFF0F172A)),
                        decoration: InputDecoration(
                          prefixIcon: const Icon(Icons.person_outline, size: 18, color: Color(0xFF94A3B8)),
                          hintText: 'user@kfab.in or username',
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
                      const Align(
                        alignment: Alignment.centerLeft,
                        child: Text(
                          'PASSWORD',
                          style: TextStyle(
                            fontSize: 11,
                            fontWeight: FontWeight.w700,
                            color: Color(0xFF0F172A),
                            letterSpacing: 0.5,
                          ),
                        ),
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
                        onSubmitted: (_) => _handleLogin(),
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
                        const SizedBox(height: 12),
                        Container(
                          padding: const EdgeInsets.all(12),
                          decoration: BoxDecoration(
                            color: const Color(0xFFFEF2F2),
                            borderRadius: BorderRadius.circular(10),
                            border: Border.all(color: const Color(0xFFFECACA)),
                          ),
                          child: Row(
                            crossAxisAlignment: CrossAxisAlignment.start,
                            children: [
                              const Padding(
                                padding: EdgeInsets.only(top: 2),
                                child: Icon(Icons.error_outline, size: 16, color: Color(0xFFDC2626)),
                              ),
                              const SizedBox(width: 8),
                              Expanded(
                                child: Text(
                                  _errorMessage!,
                                  style: const TextStyle(
                                    fontSize: 11.5,
                                    color: Color(0xFFDC2626),
                                    fontWeight: FontWeight.w600,
                                    height: 1.3,
                                  ),
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

  Widget _buildRolePill(String roleKey, String title, String email, UserRole role) {
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
          onTap: () => _onRoleSelect(roleKey, email, role),
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
