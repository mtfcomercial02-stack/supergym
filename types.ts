export type Role = 'admin' | 'staff';

export interface Profile {
  id: string;
  email: string;
  role: Role;
}

export interface Client {
  id: string;
  full_name: string;
  email: string;
  phone: string;
  start_date: string;
  monthly_fee: number;
  status: 'active' | 'late' | 'suspended' | 'cancelled';
  photo_url?: string;
}

export interface Payment {
  id: string;
  client_id: string;
  amount: number;
  payment_date: string;
  months_covered: string[]; // ['2023-10', '2023-11']
  payment_method: 'cash' | 'card' | 'pix';
  created_by: string; // user id
}

export interface ClientMonthlyStatus {
  id: string;
  client_id: string;
  month_key: string; // '2023-10'
  status: 'paid' | 'pending' | 'overdue' | 'partial';
  amount_paid: number;
  amount_due: number;
}

export interface Product {
  id: string;
  name: string;
  category: string;
  price: number;
  stock_quantity: number;
  min_stock_level: number;
}

export interface Sale {
  id: string;
  product_id: string;
  quantity: number;
  total_price: number;
  sale_date: string;
  payment_method: string;
}

export interface Staff {
  id: string;
  name: string;
  role: string;
  salary: number;
  schedule: string;
  staff_code: string;
}

export interface StaffAttendance {
  id: string;
  staff_id: string;
  date: string;
  status: 'present' | 'absent';
  check_in_time?: string;
}

export interface AccessLog {
  id: string;
  client_id: string;
  timestamp: string;
  admin_id: string;
}
