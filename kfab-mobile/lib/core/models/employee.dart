class Employee {
  final String id;
  final String name;
  final String designation;
  final String department;
  final String supervisor;
  final String shift;
  final String phone;

  const Employee({
    required this.id,
    required this.name,
    required this.designation,
    required this.department,
    required this.supervisor,
    this.shift = 'General (08:00)',
    this.phone = '+91 98765 43210',
  });

  factory Employee.fromJson(Map<String, dynamic> json) {
    return Employee(
      id: json['id'] as String,
      name: json['name'] as String,
      designation: json['designation'] as String? ?? 'Fabrication Worker',
      department: json['department'] as String? ?? 'Shop Floor',
      supervisor: json['supervisor'] as String? ?? 'Ajay Verma',
      shift: json['shift'] as String? ?? 'General (08:00)',
      phone: json['phone'] as String? ?? '+91 98765 43210',
    );
  }

  Map<String, dynamic> toJson() {
    return {
      'id': id,
      'name': name,
      'designation': designation,
      'department': department,
      'supervisor': supervisor,
      'shift': shift,
      'phone': phone,
    };
  }
}
