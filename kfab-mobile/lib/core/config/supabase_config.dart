import 'package:supabase_flutter/supabase_flutter.dart';

class SupabaseConfig {
  static const String url = String.fromEnvironment(
    'SUPABASE_URL',
    defaultValue: 'https://rpskidjmetjhadghpntl.supabase.co',
  );
  static const String anonKey = String.fromEnvironment(
    'SUPABASE_ANON_KEY',
    defaultValue: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJwc2tpZGptZXRqaGFkZ2hwbnRsIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODk3MTUzODYsImV4cCI6MjEwNTI5MTM4Nn0.PbRYLoX6wRlmmz01oMOCuTee4-Jp99FvowCvpbn_y30',
  );

  static bool get isConfigured => url.isNotEmpty && anonKey.isNotEmpty;

  static Future<void> initialize() async {
    if (isConfigured) {
      try {
        await Supabase.initialize(
          url: url,
          anonKey: anonKey, // ignore: deprecated_member_use
        );
      } catch (_) {
        // Fallback gracefully in local offline mode
      }
    }
  }

  static SupabaseClient? get client {
    if (isConfigured) {
      try {
        return Supabase.instance.client;
      } catch (_) {
        return null;
      }
    }
    return null;
  }
}
