import 'package:flutter/foundation.dart';
import 'package:supabase_flutter/supabase_flutter.dart';
import '../config/supabase_config.dart';

/// Helper service for initializing and accessing the Supabase client.
abstract final class SupabaseService {
  /// Safely initializes Supabase if environment variables are provided.
  ///
  /// If [SupabaseConfig.isConfigured] is false, this logs a warning and does not crash,
  /// allowing offline UI development before remote credentials are configured.
  static Future<void> initialize() async {
    if (!SupabaseConfig.isConfigured) {
      if (kDebugMode) {
        debugPrint(
          '[KFAB BASIC] Supabase is not configured yet. '
          'Provide SUPABASE_URL and SUPABASE_ANON_KEY via --dart-define when ready.',
        );
      }
      return;
    }

    try {
      await Supabase.initialize(
        url: SupabaseConfig.url,
        anonKey: SupabaseConfig.anonKey, // ignore: deprecated_member_use
      );
      if (kDebugMode) {
        debugPrint('[KFAB BASIC] Supabase initialized successfully.');
      }
    } catch (e, stack) {
      if (kDebugMode) {
        debugPrint('[KFAB BASIC] Failed to initialize Supabase: $e\n$stack');
      }
    }
  }

  /// Returns the global Supabase client instance if initialized, or null otherwise.
  static SupabaseClient? get client {
    if (!SupabaseConfig.isConfigured) return null;
    try {
      return Supabase.instance.client;
    } catch (_) {
      return null;
    }
  }
}
