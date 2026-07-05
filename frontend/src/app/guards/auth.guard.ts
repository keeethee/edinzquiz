import { Injectable } from '@angular/core';
import { CanActivate, Router } from '@angular/router';
import { AuthService } from '../services/auth.service';

@Injectable({
  providedIn: 'root'
})
export class AuthGuard implements CanActivate {
  constructor(private authService: AuthService, private router: Router) {}

  canActivate(): boolean {
    let loggedIn = false;
    this.authService.isLoggedIn().subscribe(val => loggedIn = val).unsubscribe();

    if (loggedIn) {
      return true;
    } else {
      this.router.navigate(['/admin/login']);
      return false;
    }
  }
}
