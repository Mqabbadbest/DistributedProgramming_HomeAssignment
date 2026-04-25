export class CustomerDTO {
  private _id: string;
  public get id(): string {
    return this._id;
  }

  public set id(value: string) {
    this._id = value;
  }

  private _firstName: string;
  public get firstName(): string {
    return this._firstName;
  }
  public set firstName(value: string) {
    this._firstName = value;
  }

  private _lastName: string;
  public get lastName(): string {
    return this._lastName;
  }
  public set lastName(value: string) {
    this._lastName = value;
  }

  private _email: string;
  public get email(): string {
    return this._email;
  }
  public set email(value: string) {
    this._email = value;
  }

  private _phone: string;
  public get phone(): string {
    return this._phone;
  }

  public set phone(value: string) {
    this._phone = value;
  }

  private _createdAt: Date;
  public get createdAt(): Date {
    return this._createdAt;
  }

  public set createdAt(value: Date) {
    this._createdAt = value;
  }

  private _updatedAt: Date;
  public get updatedAt(): Date {
    return this._updatedAt;
  }

  public set updatedAt(value: Date) {
    this._updatedAt = value;
  }

  private _isActive: boolean;
  public get isActive(): boolean {
    return this._isActive;
  }
  public set isActive(value: boolean) {
    this._isActive = value;
  }

  constructor(
    id: string,
    firstName: string,
    lastName: string,
    email: string,
    phone: string,
    createdAt: Date,
    updatedAt: Date,
    isActive: boolean,
  ) {
    this._id = id;
    this._firstName = firstName;
    this._lastName = lastName;
    this._email = email;
    this._phone = phone;
    this._createdAt = createdAt;
    this._updatedAt = updatedAt;
    this._isActive = isActive;
  }
}
