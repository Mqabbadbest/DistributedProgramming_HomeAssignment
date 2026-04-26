export class BookingDTO {
  private _id: string;
  private _customerId: string;
  private _startLocation: { lat: number; lng: number };
  private _endLocation: { lat: number; lng: number };
  private _dateTime: string;
  private _passengers: number;
  private _cabType: 'Economic' | 'Premium' | 'Executive';
  private _price: number;
  private _paymentId: string;
  private _cabFareCents: number;
  private _durationMinutes: number;
  private _distanceKilometers: number;
  private _status: 'upcoming' | 'completed' | 'cancelled';
  private _createdAt: string;
  private _updatedAt: string;

  constructor(
    id: string,
    customerId: string,
    startLocation: { lat: number; lng: number },
    endLocation: { lat: number; lng: number },
    dateTime: string,
    passengers: number,
    cabType: 'Economic' | 'Premium' | 'Executive',
    price: number,
    paymentId: string,
    cabFareCents: number,
    durationMinutes: number,
    distanceKilometers: number,
    status: 'upcoming' | 'completed' | 'cancelled',
    createdAt: string,
    updatedAt: string,
  ) {
    this._id = id;
    this._customerId = customerId;
    this._startLocation = startLocation;
    this._endLocation = endLocation;
    this._dateTime = dateTime;
    this._passengers = passengers;
    this._cabType = cabType;
    this._price = price;
    this._paymentId = paymentId;
    this._cabFareCents = cabFareCents;
    this._durationMinutes = durationMinutes;
    this._distanceKilometers = distanceKilometers;
    this._status = status;
    this._createdAt = createdAt;
    this._updatedAt = updatedAt;
  }

  get id() {
    return this._id;
  }
  get customerId() {
    return this._customerId;
  }
  get startLocation() {
    return this._startLocation;
  }
  get endLocation() {
    return this._endLocation;
  }
  get dateTime() {
    return this._dateTime;
  }
  get passengers() {
    return this._passengers;
  }
  get cabType() {
    return this._cabType;
  }
  get price() {
    return this._price;
  }
  get paymentId() {
    return this._paymentId;
  }
  get cabFareCents() {
    return this._cabFareCents;
  }
  get durationMinutes() {
    return this._durationMinutes;
  }
  get distanceKilometers() {
    return this._distanceKilometers;
  }
  get status() {
    return this._status;
  }
  get createdAt() {
    return this._createdAt;
  }
  get updatedAt() {
    return this._updatedAt;
  }
}
