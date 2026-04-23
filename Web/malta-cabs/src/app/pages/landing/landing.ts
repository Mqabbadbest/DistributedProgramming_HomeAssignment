import { Component } from '@angular/core';
import { RouterLink } from '@angular/router';
import { HeaderComponent } from '../../components/header/header';

@Component({
  selector: 'app-landing',
  standalone: true,
  imports: [RouterLink, HeaderComponent],
  templateUrl: './landing.html',
  styleUrl: './landing.css'
})
export class LandingComponent {}