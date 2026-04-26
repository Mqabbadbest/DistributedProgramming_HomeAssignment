import { Component, OnInit, ChangeDetectorRef, NgZone } from '@angular/core';
import { RouterLink, Router, RouterLinkActive } from '@angular/router';
import { CommonModule } from '@angular/common';
import Swal from 'sweetalert2';

@Component({
  selector: 'app-header',
  standalone: true,
  imports: [RouterLink, CommonModule, RouterLinkActive],
  templateUrl: './header.component.html',
  styleUrl: './header.component.css',
})
export class HeaderComponent implements OnInit {
  isAuthenticated = false;
  isDropdownOpen = false;

  constructor(
    private router: Router,
    private cdr: ChangeDetectorRef,
    private ngZone: NgZone,
  ) {}

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
    Swal.fire({
      title: 'Logout?',
      text: 'Are you sure you want to logout?',
      icon: 'warning',
      showCancelButton: true,
      confirmButtonText: 'Yes, logout',
      cancelButtonText: 'Cancel',
      background: '#1a1a1a',
      color: '#fff',
      confirmButtonColor: '#c5a050',
      cancelButtonColor: '#6c757d',
    }).then((result) => {
      if (result.isConfirmed) {
        this.ngZone.run(() => {
          localStorage.removeItem('isAuthenticated');
          localStorage.removeItem('sessionToken');
          localStorage.removeItem('customerId');
          this.isAuthenticated = false;
          this.isDropdownOpen = false;
          this.cdr.detectChanges();
          this.router.navigate(['/']);
        });
      }
    });
  }
}
