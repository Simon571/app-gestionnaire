import 'package:connectivity_plus/connectivity_plus.dart';

class ConnectivityService {
  final Connectivity _connectivity = Connectivity();

  Future<bool> isConnected() async {
    final result = await _connectivity.checkConnectivity();
    // checkConnectivity() retourne maintenant List<ConnectivityResult>
    if (result is List) {
      return !(result as List<ConnectivityResult>).every((r) => r == ConnectivityResult.none);
    }
    return false;
  }

  Stream<dynamic> get onConnectivityChanged => _connectivity.onConnectivityChanged;
}
