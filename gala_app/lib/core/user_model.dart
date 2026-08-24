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

  factory User.fromJson(Map<String, dynamic> json) {
    return User(
      id: json['id'].toString(),
      firstName: json['first_name'],
      lastName: json['last_name'],
      email: json['email'],
      role: json['role_display'],
    );
  }

  factory User.fromRegisterJson(Map<String, dynamic> json) {
    return User(
      id: json['id'].toString(),
      firstName: json['first_name'],
      lastName: json['last_name'],
      email: json['email'],
      role: json['role'] == 'P' ? 'Participant' : 'Guest',
    );
  }
}
