// import 'package:retrofit/http.dart';
import 'package:json_annotation/json_annotation.dart';
import 'package:retrofit/retrofit.dart';
import 'package:dio/dio.dart';
part 'agenda_model.g.dart';

@RestApi(baseUrl: 'https://5d42a6e2bc64f90014a56ca0.mockapi.io/api/')
abstract class RestClient {
  factory RestClient(Dio dio, {String? baseUrl}) = _RestClient;

  @GET('/agenda')
  Future<List<AgendaItemModel>> getAgenda();
}

@JsonSerializable(fieldRename: FieldRename.snake)
class AgendaItemModel {
  final String title;
  final String subtitle;

  const AgendaItemModel({required this.title, required this.subtitle});

  factory AgendaItemModel.fromJson(Map<String, dynamic> json) =>
      _$AgendaItemModelFromJson(json);

  Map<String, dynamic> toJson() => _$AgendaItemModelToJson(this);
}
