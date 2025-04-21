export interface Order {
    Id: number,
    CreatedAt: string;
    PlannedArrivalDate?: string;
    Status?: string;
    City: string;
    Street?: string;
    House?: string;
    From: string;
    TaxiNumber?: string;
    Destination?: string;
    Notes?: string;
    PhoneNumber?: string;
    CompanyName?: string;
    Price?: number;
    PassengersCount?: number;
}