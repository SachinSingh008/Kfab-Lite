import 'dart:async';
import 'package:flutter/foundation.dart';
import 'mobile_store.dart';

enum NetworkStatus { online, offline, syncing }

class SyncEngine extends ChangeNotifier {
  final MobileStore mobileStore;
  NetworkStatus _networkStatus = NetworkStatus.online;
  DateTime? _lastSyncedAt = DateTime.now();

  SyncEngine({required this.mobileStore});

  NetworkStatus get networkStatus => _networkStatus;
  DateTime? get lastSyncedAt => _lastSyncedAt;
  bool get isOnline => _networkStatus != NetworkStatus.offline;
  int get pendingCount => mobileStore.offlineQueue.length;

  void setOfflineMode(bool offline) {
    _networkStatus = offline ? NetworkStatus.offline : NetworkStatus.online;
    notifyListeners();
  }

  Future<void> syncNow() async {
    if (_networkStatus == NetworkStatus.offline || pendingCount == 0) {
      return;
    }

    _networkStatus = NetworkStatus.syncing;
    notifyListeners();

    // Simulate reliable sequential queue dispatch
    await Future.delayed(const Duration(milliseconds: 1200));

    _lastSyncedAt = DateTime.now();
    _networkStatus = NetworkStatus.online;
    notifyListeners();
  }
}
