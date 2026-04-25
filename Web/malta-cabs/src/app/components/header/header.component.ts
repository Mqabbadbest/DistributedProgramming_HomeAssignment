import { Component, OnInit } from '@angular/core';
import { RouterLink, Router } from '@angular/router';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-header',
  standalone: true,
  imports: [RouterLink, CommonModule],
  templateUrl: './header.component.html',
  styleUrl: './header.component.css',
})
export class HeaderComponent implements OnInit {
  isAuthenticated = false;
  isDropdownOpen = false;

  constructor(private router: Router) {}

  ngOnInit(): void {
    this.checkAuthentication();
    // Listen for storage changes to update auth status
    window.addEventListener('storage', () => this.checkAuthentication());
  }

  checkAuthentication(): void {
    this.isAuthenticated = localStorage.getItem('isAuthenticated') === 'true';
  }

  toggleDropdown(): void {
    this.isDropdownOpen = !this.isDropdownOpen;
  }

  logout(): void {
    localStorage.removeItem('isAuthenticated');
    localStorage.removeItem('sessionToken');
    localStorage.removeItem('customerId');
    this.isAuthenticated = false;
    this.isDropdownOpen = false;
    this.router.navigate(['/login']);
  }
}
