import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../api_service.dart';

import '../core/gala_repo.dart';
import 'models/agenda_model.dart';

FutureProvider<List<AgendaItemModel>> agendaProvider = FutureProvider((
  ref,
) async {
  final repo = ref.read(eventRepoProvider);
  return repo.getAgenda();
});

Provider<ApiService> apiServiceProvider = Provider((ref) => ApiServiceImpl());

final eventRepoProvider = Provider<EventRepository>((ref) {
  final api = ApiServiceImpl();
  return EventRepository(api);
});
