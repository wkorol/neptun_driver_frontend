export interface Order {
    createdAt: string;
    plannedArrivalDate?: string;
    status?: string;
    city: string;
    street?: string;
    house?: string;
    from: string;
    taxiNumber?: string;
    destination?: string;
    notes?: string;
    phoneNumber?: string;
    companyName?: string;
    price?: number;
    passengerCount?: number;
}