import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { RouterLink } from '@angular/router';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { LocationService } from '../../services/location.service';
import { HeaderComponent } from '../../components/header/header.component';
import { DatePipe } from '@angular/common';
import Swal from 'sweetalert2';
@Component({
  selector: 'app-location',
  imports: [RouterLink, HeaderComponent, ReactiveFormsModule, DatePipe],
  templateUrl: './location.component.html',
  styleUrl: './location.component.css',
})
export class LocationComponent implements OnInit {
  locations: any[] = [];
  isLoading = true;

  // Edit modal
  editingLocation: any = null;
  editForm!: FormGroup;

  // Weather modal
  weatherLocation: any = null;
  weatherData: any = null;
  isLoadingWeather = false;
  weatherCarouselIndex = 0;

  constructor(
    private locationService: LocationService,
    private formBuilder: FormBuilder,
    private cdr: ChangeDetectorRef,
  ) {}

  ngOnInit(): void {
    this.editForm = this.formBuilder.group({
      name: ['', Validators.required],
      lat: ['', Validators.required],
      lng: ['', Validators.required],
    });
    this.loadLocations();
  }

  loadLocations(): void {
    this.isLoading = true;
    this.locationService.getAll().subscribe({
      next: (locations) => {
        this.locations = locations;
        this.isLoading = false;
        this.cdr.detectChanges();
        console.info('Locations', `Loaded ${locations.length} locations`);
      },
      error: (err) => {
        console.error('Locations', 'Failed to load locations', err);
        this.isLoading = false;
        this.cdr.detectChanges();
      },
    });
  }

  openEdit(location: any): void {
    this.editingLocation = location;
    this.editForm.patchValue({
      name: location.name,
      lat: location.lat,
      lng: location.lng,
    });
  }

  closeEdit(): void {
    this.editingLocation = null;
  }

  saveEdit(): void {
    if (this.editForm.invalid) return;

    this.locationService
      .update(this.editingLocation.id, {
        name: this.editForm.value.name,
        lat: parseFloat(this.editForm.value.lat),
        lng: parseFloat(this.editForm.value.lng),
      })
      .subscribe({
        next: () => {
          console.info('Locations', 'Location updated');
          this.closeEdit();
          this.loadLocations();
          Swal.fire({
            title: 'Location updated!',
            icon: 'success',
            showConfirmButton: false,
            timer: 1500,
            background: '#1a1a1a',
            color: '#fff',
          });
        },
        error: (err) => {
          Swal.fire({
            title: 'Update failed',
            text: err.error?.error || 'Something went wrong',
            icon: 'error',
            background: '#1a1a1a',
            color: '#fff',
            confirmButtonColor: '#c5a050',
          });
        },
      });
  }

  deleteLocation(location: any): void {
    Swal.fire({
      title: 'Delete location?',
      text: `Are you sure you want to delete "${location.name}"?`,
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#c5a050',
      cancelButtonColor: '#333',
      confirmButtonText: 'Delete',
      background: '#1a1a1a',
      color: '#fff',
    }).then((result) => {
      if (!result.isConfirmed) return;

      this.locationService.delete(location.id).subscribe({
        next: () => {
          console.info('Locations', 'Location deleted');
          this.loadLocations();
        },
        error: (err) => {
          Swal.fire({
            title: 'Delete failed',
            text: err.error?.error,
            icon: 'error',
            background: '#1a1a1a',
            color: '#fff',
            confirmButtonColor: '#c5a050',
          });
        },
      });
    });
  }

  openWeather(location: any): void {
    this.weatherLocation = location;
    this.weatherData = null;
    this.weatherCarouselIndex = 0;
    this.isLoadingWeather = true;

    this.locationService.getWeather(location.id).subscribe({
      next: (data) => {
        this.weatherData = data.weather;
        this.isLoadingWeather = false;
        this.cdr.detectChanges();
        console.info('Locations', 'Weather loaded for', location.name);
      },
      error: (err) => {
        this.isLoadingWeather = false;
        this.cdr.detectChanges();
        console.error('Locations', 'Failed to load weather', err);
      },
    });
  }

  closeWeather(): void {
    this.weatherLocation = null;
    this.weatherData = null;
  }

  prevDay(): void {
    if (this.weatherCarouselIndex > 0) this.weatherCarouselIndex--;
  }

  nextDay(): void {
    if (this.weatherData && this.weatherCarouselIndex < this.weatherData.daily.time.length - 1) {
      this.weatherCarouselIndex++;
    }
  }

  getWeatherDays(): any[] {
    if (!this.weatherData?.daily) return [];
    return this.weatherData.daily.time.map((time: any, i: number) => ({
      date: new Date(time),
      sunrise: new Date(this.weatherData.daily.sunrise[i]),
      sunset: new Date(this.weatherData.daily.sunset[i]),
      tempMin: this.weatherData.daily.temperature_2m_min[i]?.toFixed(1),
      tempMax: this.weatherData.daily.temperature_2m_max[i]?.toFixed(1),
      windSpeed: this.weatherData.daily.wind_speed_10m_max[i]?.toFixed(1),
      windGusts: this.weatherData.daily.wind_gusts_10m_max[i]?.toFixed(1),
      precipitation: this.weatherData.daily.precipitation_probability_mean[i]?.toFixed(0),
    }));
  }
}
