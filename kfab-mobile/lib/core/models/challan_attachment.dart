class ChallanAttachment {
  final String id;
  final String vendorName;
  final String challanNumber;
  final String vehicleNumber;
  final String materialDescription;
  final double netWeight;
  final String unit;
  final String imagePath;
  final DateTime capturedAt;
  final bool isUploaded;

  const ChallanAttachment({
    required this.id,
    required this.vendorName,
    required this.challanNumber,
    required this.vehicleNumber,
    required this.materialDescription,
    required this.netWeight,
    required this.unit,
    required this.imagePath,
    required this.capturedAt,
    this.isUploaded = false,
  });

  ChallanAttachment copyWith({
    String? id,
    String? vendorName,
    String? challanNumber,
    String? vehicleNumber,
    String? materialDescription,
    double? netWeight,
    String? unit,
    String? imagePath,
    DateTime? capturedAt,
    bool? isUploaded,
  }) {
    return ChallanAttachment(
      id: id ?? this.id,
      vendorName: vendorName ?? this.vendorName,
      challanNumber: challanNumber ?? this.challanNumber,
      vehicleNumber: vehicleNumber ?? this.vehicleNumber,
      materialDescription: materialDescription ?? this.materialDescription,
      netWeight: netWeight ?? this.netWeight,
      unit: unit ?? this.unit,
      imagePath: imagePath ?? this.imagePath,
      capturedAt: capturedAt ?? this.capturedAt,
      isUploaded: isUploaded ?? this.isUploaded,
    );
  }
}
