import { LocationDTO } from './location.dto';

export class BookingRequestDTO {
  private _startLocation: LocationDTO;
  private _endLocation: LocationDTO;
  private _passengers: number;
  private _cabType: 'Economic' | 'Premium' | 'Executive';

  constructor(
    startLocation: LocationDTO,
    endLocation: LocationDTO,
    passengers: number,
    cabType: 'Economic' | 'Premium' | 'Executive',
  ) {
    this._startLocation = startLocation;
    this._endLocation = endLocation;
    this._passengers = passengers;
    this._cabType = cabType;
  }

  get startLocation(): LocationDTO {
    return this._startLocation;
  }
  set startLocation(value: LocationDTO) {
    this._startLocation = value;
  }

  get endLocation(): LocationDTO {
    return this._endLocation;
  }
  set endLocation(value: LocationDTO) {
    this._endLocation = value;
  }

  get passengers(): number {
    return this._passengers;
  }
  set passengers(value: number) {
    this._passengers = value;
  }

  get cabType(): 'Economic' | 'Premium' | 'Executive' {
    return this._cabType;
  }
  set cabType(value: 'Economic' | 'Premium' | 'Executive') {
    this._cabType = value;
  }
}
