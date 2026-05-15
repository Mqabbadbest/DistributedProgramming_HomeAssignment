import { Component, OnInit, OnDestroy, ChangeDetectorRef, NgZone } from '@angular/core';
import { RouterLink, Router, RouterLinkActive } from '@angular/router';
import { CommonModule } from '@angular/common';
import { NotificationService, NotificationDTO } from '../../services/notification.service';
import { interval, Subscription } from 'rxjs';
import Swal from 'sweetalert2';

@Component({
  selector: 'app-header',
  standalone: true,
  imports: [RouterLink, CommonModule, RouterLinkActive],
  templateUrl: './header.component.html',
  styleUrl: './header.component.css',
})
export class HeaderComponent implements OnInit, OnDestroy {
  isAuthenticated = false;
  isDropdownOpen = false;
  isNotificationsOpen = false;
  notifications: NotificationDTO[] = [];
  unreadCount = 0;
  private notificationPolling: Subscription | null = null;

  constructor(
    private router: Router,
    private cdr: ChangeDetectorRef,
    private ngZone: NgZone,
    private notificationService: NotificationService,
  ) {}

  ngOnInit(): void {
    this.checkAuthentication();
    // Listen for storage changes to update auth status
    this.loadNotifications();
    window.addEventListener('storage', () => this.checkAuthentication());
  }

  ngOnDestroy(): void {
    if (this.notificationPolling) {
      this.notificationPolling.unsubscribe();
    }
  }

  loadNotifications(): void {
    if (!this.isAuthenticated) return;
    this.notificationService.getNotifications().subscribe({
      next: (notifications) => {
        this.notifications = notifications;
        this.unreadCount = notifications.filter((n) => !n.read).length;
      },
      error: () => {},
    });
  }

  checkAuthentication(): void {
    this.isAuthenticated = localStorage.getItem('isAuthenticated') === 'true';
  }

  toggleDropdown(): void {
    this.isDropdownOpen = !this.isDropdownOpen;
  }

  toggleNotifications(): void {
    this.isNotificationsOpen = !this.isNotificationsOpen;
    this.isDropdownOpen = false;
    if (this.isNotificationsOpen) this.loadNotifications();
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
