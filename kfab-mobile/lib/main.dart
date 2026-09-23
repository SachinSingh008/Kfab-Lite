import 'package:flutter/material.dart';
import 'core/config/app_theme.dart';
import 'core/config/supabase_config.dart';
import 'core/state/auth_state.dart';
import 'screens/auth/login_screen.dart';
import 'screens/shell/main_shell_screen.dart';
import 'screens/splash/splash_screen.dart';

void main() async {
  WidgetsFlutterBinding.ensureInitialized();
  await SupabaseConfig.initialize();

  runApp(const KfabMobileApp());
}

class KfabMobileApp extends StatefulWidget {
  final bool showSplash;

  const KfabMobileApp({super.key, this.showSplash = true});

  @override
  State<KfabMobileApp> createState() => _KfabMobileAppState();
}

class _KfabMobileAppState extends State<KfabMobileApp> {
  late final AuthState _authState;

  @override
  void initState() {
    super.initState();
    _authState = AuthState();
  }

  @override
  void dispose() {
    _authState.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    return ListenableBuilder(
      listenable: _authState,
      builder: (context, _) {
        return MaterialApp(
          title: 'KFAB BASIC Mobile',
          debugShowCheckedModeBanner: false,
          theme: AppTheme.getThemeForRole(_authState.role),
          home: widget.showSplash
              ? SplashScreen(authState: _authState)
              : (_authState.isAuthenticated
                  ? MainShellScreen(authState: _authState)
                  : LoginScreen(authState: _authState)),
        );
      },
    );
  }
}
