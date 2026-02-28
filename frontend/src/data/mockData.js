export const mockServices = [
  { id: 1, name: "Kurti Stitching", basePrice: 999, image: "👗" },
  { id: 2, name: "Salwar Suit Complete", basePrice: 1499, image: "👘" },
  { id: 3, name: "Blouse Custom", basePrice: 1299, image: "👚" },
];

export const mockReadymade = [
  { id: 101, name: "Designer Floral Kurti", price: 2499, category: "Kurti", stock: 12 },
  { id: 102, name: "Silk Blend Saree", price: 4599, category: "Saree", stock: 5 },
];

export const mockOrders = [
  {
    orderId: "ORD-7782",
    customerName: "Priya Sharma",
    service: "Kurti Stitching",
    status: "PICKUP_ASSIGNED", // Using exact PRD statuses
    totalAmount: 999,
    deliveryType: "Express",
    date: "2026-02-27",
    pickupAddress: "123 Fashion St, Kashmir",
  },
  {
    orderId: "ORD-7783",
    customerName: "Rahul Verma",
    service: "Salwar Suit Complete",
    status: "STITCHING",
    totalAmount: 1499,
    deliveryType: "Normal",
    date: "2026-02-26",
    pickupAddress: "456 Dal Lake Rd, Kashmir",
  }
];