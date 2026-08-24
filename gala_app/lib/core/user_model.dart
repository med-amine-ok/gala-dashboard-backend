class User {
  final String id;
  final String firstName;
  final String lastName;
  final String email;
  final String role;

  User({
    required this.id,
    required this.firstName,
    required this.lastName,
    required this.email,
    required this.role,
  });

  bool get isHR {
    final r = role.toLowerCase().trim();
    return r == 'hr' ||
        r == 'rh' ||
        r == 'hr admin' ||
        r == 'hr_admin' ||
        r == 'admin' ||
        r.contains('rh') ||
        r.contains('hr');
  }

  bool get isCompany {
    final r = role.toLowerCase().trim();
    return r == 'company' || r == 'c' || isHR;
  }

  bool get isParticipant {
    final r = role.toLowerCase().trim();
    return r == 'participant' || r == 'p' || isHR || (!isCompany && !isHR);
  }

  String get roleDisplayName {
    if (isHR) return 'HR Admin';
    if (role.toLowerCase().contains('company') || role.toLowerCase() == 'c') {
      return 'Company Partner';
    }
    return 'Participant';
  }

  factory User.fromJson(Map<String, dynamic> json) {
    final rawRole = json['role_display'] ?? json['role'] ?? 'Participant';
    return User(
      id: (json['id'] ?? '0').toString(),
      firstName: (json['first_name'] ?? '').toString(),
      lastName: (json['last_name'] ?? '').toString(),
      email: (json['email'] ?? '').toString(),
      role: rawRole.toString(),
    );
  }

  factory User.fromRegisterJson(Map<String, dynamic> json) {
    final rawRole = json['role'] ?? json['role_display'] ?? 'P';
    String displayRole = 'Participant';
    if (rawRole == 'HR' || rawRole == 'RH') {
      displayRole = 'HR Admin';
    } else if (rawRole == 'C' || rawRole == 'Company') {
      displayRole = 'Company';
    }

    return User(
      id: (json['id'] ?? '0').toString(),
      firstName: (json['first_name'] ?? '').toString(),
      lastName: (json['last_name'] ?? '').toString(),
      email: (json['email'] ?? '').toString(),
      role: displayRole,
    );
  }
}
