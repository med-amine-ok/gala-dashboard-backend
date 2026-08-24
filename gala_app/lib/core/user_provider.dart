import 'dart:async';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../agenda/agenda_provider.dart';
import 'gala_repo.dart';
import 'user_model.dart' show User; // your repo

class UserNotifier extends AsyncNotifier<User?> {
  @override
  FutureOr<User?> build() async {
    final repo = ref.read(eventRepoProvider);
    return await repo.currentUser(); // await unwraps Future<User?>
  }

  void setUser(User user) {
    state = AsyncData(user);
  }

  User get user => state.value!;

  // 3️⃣ Clear user (after logout)
  void clearUser() {
    state = const AsyncData(null);
  }

  // 4️⃣ Reload user (after token refresh)
  Future<void> reloadUser(User user) async {
    // final repo = ref.read(eventRepoProvider);
    // state = const AsyncLoading();
    // final user = await repo.currentUser();
    state = AsyncData(user);
  }
}

final userProvider = AsyncNotifierProvider<UserNotifier, User?>(
  UserNotifier.new,
);
