export class PaymentDTO {
  private _id: string;
  private _customerId: string;
  private _bookingId: string;
  private _price: number;
  private _status: 'pending' | 'completed' | 'failed';
  private _cardHolderName: string;
  private _maskedCardNumber: string;
  private _createdAt: string;
  private _updatedAt: string;

  constructor(
    id: string,
    customerId: string,
    bookingId: string,
    price: number,
    status: 'pending' | 'completed' | 'failed',
    cardHolderName: string,
    maskedCardNumber: string,
    createdAt: string,
    updatedAt: string,
  ) {
    this._id = id;
    this._customerId = customerId;
    this._bookingId = bookingId;
    this._price = price;
    this._status = status;
    this._cardHolderName = cardHolderName;
    this._maskedCardNumber = maskedCardNumber;
    this._createdAt = createdAt;
    this._updatedAt = updatedAt;
  }

  get id(): string {
    return this._id;
  }
  set id(value: string) {
    this._id = value;
  }

  get customerId(): string {
    return this._customerId;
  }
  set customerId(value: string) {
    this._customerId = value;
  }

  get bookingId(): string {
    return this._bookingId;
  }
  set bookingId(value: string) {
    this._bookingId = value;
  }

  get price(): number {
    return this._price;
  }
  set price(value: number) {
    this._price = value;
  }

  get status(): 'pending' | 'completed' | 'failed' {
    return this._status;
  }
  set status(value: 'pending' | 'completed' | 'failed') {
    this._status = value;
  }

  get cardHolderName(): string {
    return this._cardHolderName;
  }
  set cardHolderName(value: string) {
    this._cardHolderName = value;
  }

  get maskedCardNumber(): string {
    return this._maskedCardNumber;
  }
  set maskedCardNumber(value: string) {
    this._maskedCardNumber = value;
  }

  get createdAt(): string {
    return this._createdAt;
  }
  set createdAt(value: string) {
    this._createdAt = value;
  }

  get updatedAt(): string {
    return this._updatedAt;
  }
  set updatedAt(value: string) {
    this._updatedAt = value;
  }
}
