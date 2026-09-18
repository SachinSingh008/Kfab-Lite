class StockItem {
  final String code;
  final String name;
  final String category;
  final String spec;
  final String unit;
  final double currentStock;
  final double minStock;

  const StockItem({
    required this.code,
    required this.name,
    required this.category,
    required this.spec,
    required this.unit,
    required this.currentStock,
    required this.minStock,
  });

  bool get isLow => currentStock <= minStock;

  StockItem copyWith({
    String? code,
    String? name,
    String? category,
    String? spec,
    String? unit,
    double? currentStock,
    double? minStock,
  }) {
    return StockItem(
      code: code ?? this.code,
      name: name ?? this.name,
      category: category ?? this.category,
      spec: spec ?? this.spec,
      unit: unit ?? this.unit,
      currentStock: currentStock ?? this.currentStock,
      minStock: minStock ?? this.minStock,
    );
  }
}
