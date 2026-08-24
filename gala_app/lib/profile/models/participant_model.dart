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
    String? ticketSerial;
    final ticketObj = json['ticket'];
    if (ticketObj != null) {
      if (ticketObj is Map) {
        ticketSerial = ticketObj['serial_number']?.toString();
      } else if (ticketObj is String) {
        ticketSerial = ticketObj;
      }
    }

    final userData = json['user'] is Map ? json['user'] as Map : null;

    final fName = (json['first_name'] ?? userData?['first_name'] ?? '').toString();
    final lName = (json['last_name'] ?? userData?['last_name'] ?? '').toString();
    final mail = (json['email'] ?? userData?['email'] ?? '').toString();
    final phoneNum = (json['phone'] ?? '').toString();
    final uni = (json['university'] ?? json['university_other'] ?? 'ENP Algiers').toString();
    final field = (json['field_of_study'] ?? json['field_of_study_other'] ?? 'Engineering').toString();

    return Participant(
      id: (json['id'] ?? '0').toString(),
      email: mail,
      phone: phoneNum,
      fieldOfStudy: field.isNotEmpty ? field : 'Engineering',
      university: uni.isNotEmpty ? uni : 'ENP Algiers',
      ticketSerialNumber: (ticketSerial != null && ticketSerial.isNotEmpty) ? ticketSerial : 'No Ticket Assigned',
      firstName: fName,
      lastName: lName,
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
