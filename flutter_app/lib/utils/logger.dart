import 'package:flutter/foundation.dart';

class AppLogger {
  static void log(String message) {
    if (kDebugMode) {
      // ignore: avoid_print
      print('[LOG] $message');
    }
  }

  static void error(String message, [Object? error, StackTrace? stackTrace]) {
    if (kDebugMode) {
      // ignore: avoid_print
      print('[ERROR] $message');
      if (error != null) print('  > $error');
      if (stackTrace != null) print('  > $stackTrace');
    }
  }
}
