import 'dart:convert';

class CompanyLinkedParticipants {
  final String company;
  final int linkedParticipantsCount;
  final List<LinkedParticipant> linkedParticipants;

  CompanyLinkedParticipants({
    required this.company,
    required this.linkedParticipantsCount,
    required this.linkedParticipants,
  });

  factory CompanyLinkedParticipants.fromJson(Map<String, dynamic> json) {
    return CompanyLinkedParticipants(
      company: json['company'] ?? '',
      linkedParticipantsCount: json['linked_participants_count'] ?? 0,
      linkedParticipants:
          (json['linked_participants'] as List<dynamic>? ?? [])
              .map((e) => LinkedParticipant.fromJson(e))
              .toList(),
    );
  }

  Map<String, dynamic> toJson() => {
    'company': company,
    'linked_participants_count': linkedParticipantsCount,
    'linked_participants': linkedParticipants.map((e) => e.toJson()).toList(),
  };

  static CompanyLinkedParticipants fromRawJson(String source) =>
      CompanyLinkedParticipants.fromJson(jsonDecode(source));

  String toRawJson() => jsonEncode(toJson());
}

class LinkedParticipant {
  final int id;
  final String name;
  final String email;
  final String fieldOfStudy;
  final String university;
  final DateTime linkedAt;

  LinkedParticipant({
    required this.id,
    required this.name,
    required this.email,
    required this.fieldOfStudy,
    required this.university,
    required this.linkedAt,
  });

  factory LinkedParticipant.fromJson(Map<String, dynamic> json) {
    return LinkedParticipant(
      id: json['id'] ?? 0,
      name: json['name'] ?? '',
      email: json['email'] ?? '',
      fieldOfStudy: json['field_of_study'] ?? '',
      university: json['university'] ?? '',
      linkedAt: DateTime.tryParse(json['linked_at'] ?? '') ?? DateTime.now(),
    );
  }

  Map<String, dynamic> toJson() => {
    'id': id,
    'name': name,
    'email': email,
    'field_of_study': fieldOfStudy,
    'university': university,
    'linked_at': linkedAt.toIso8601String(),
  };
}
