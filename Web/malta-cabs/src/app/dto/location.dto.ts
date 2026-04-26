export class LocationDTO {
  private _lat: number;
  private _lng: number;
  private _address: string;

  constructor(lat: number, lng: number, address: string = '') {
    this._lat = lat;
    this._lng = lng;
    this._address = address;
  }

  get lat(): number {
    return this._lat;
  }
  set lat(value: number) {
    this._lat = value;
  }

  get lng(): number {
    return this._lng;
  }
  set lng(value: number) {
    this._lng = value;
  }

  get address(): string {
    return this._address;
  }
  set address(value: string) {
    this._address = value;
  }
}
