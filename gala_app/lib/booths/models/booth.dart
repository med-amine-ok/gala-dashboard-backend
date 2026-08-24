class BoothModel {
  final String name;
  final String description;
  final String bannerUrl;
  final String email;
  final String website;
  final List<String> hiringRoles;

  const BoothModel({
    required this.name,
    required this.description,
    required this.bannerUrl,
    required this.email,
    required this.website,
    required this.hiringRoles,
  });

  factory BoothModel.fromJson(Map<String, dynamic> json) => BoothModel(
    name: json['name'] as String,
    description: json['description'] as String,
    bannerUrl: json['logo'] as String,
    email: json['email'] as String,
    website: json['website'] as String,
    hiringRoles:
        (json['field'] as String).split(',').map((e) => e.trim()).toList(),
    // hiringRoles:
    //     (json['hiring_roles'] as List).map((e) => e.toString()).toList(),
  );
}
