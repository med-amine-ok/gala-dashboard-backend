class Participant {
  final String id;
  final String email;
  final String phone;
  final String fieldOfStudy;
  final String university;
  final String? ticketSerialNumber;
  final String firstName;
  final String lastName;

  Participant({
    required this.id,
    required this.email,
    required this.phone,
    required this.fieldOfStudy,
    required this.university,
    required this.ticketSerialNumber,
    required this.firstName,
    required this.lastName,
  });

  factory Participant.fromJson(Map<String, dynamic> json) {
    return Participant(
      id: json['id'].toString(),
      email: json['email'] ?? '',
      phone: json['phone'] ?? '',
      fieldOfStudy: json['field_of_study'] ?? '',
      university: json['university'] ?? '',
      ticketSerialNumber:
          json['ticket']?['serial_number'] ?? 'No Ticket Assigned',
      firstName: json['first_name'] ?? '',
      lastName: json['last_name'] ?? '',
    );
  }

  Map<String, dynamic> toJson() {
    return {
      'id': id,
      'email': email,
      'phone': phone,
      'field_of_study': fieldOfStudy,
      'university': university,
      'ticket': {'serial_number': ticketSerialNumber},
      'first_name': firstName,
      'last_name': lastName,
    };
  }
}
