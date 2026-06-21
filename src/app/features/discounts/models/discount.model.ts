export interface ApplyDiscountPayload {
  doctorId: number;
  date: string;
  discountPercentage: number;
}

export interface DoctorOption {
  id: number;
  name: string;
  specialization: string;
}
