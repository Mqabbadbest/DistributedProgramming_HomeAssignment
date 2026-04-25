export class LocationDTO {
  private _lat: number;
  private _lng: number;

  constructor(lat: number, lng: number) {
    this._lat = lat;
    this._lng = lng;
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
}
