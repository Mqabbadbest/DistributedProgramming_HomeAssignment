export class LoginResponseDTO {
  private _token: string;
  public get token(): string {
    return this._token;
  }
  public set token(value: string) {
    this._token = value;
  }

  private _customerId: string;
  public get customerId(): string {
    return this._customerId;
  }

  public set customerId(value: string) {
    this._customerId = value;
  }

  constructor(token: string, customerId: string) {
    this._token = token;
    this._customerId = customerId;
  }
}
