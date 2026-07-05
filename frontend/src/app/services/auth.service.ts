import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, BehaviorSubject } from 'rxjs';
import { tap } from 'rxjs/operators';

export interface StudentDetails {
  id: number;
  name: string;
  email: string;
  collegeName: string;
}

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  private baseUrl = 'http://localhost:3000/api/auth';
  
  // Storage keys
  private adminTokenKey = 'edinz_admin_token';
  private studentTokenKey = 'edinz_student_token';
  private studentDataKey = 'edinz_student_data';
  
  private adminLoggedIn$ = new BehaviorSubject<boolean>(this.hasAdminToken());
  private studentLoggedIn$ = new BehaviorSubject<boolean>(this.hasStudentToken());
  private currentStudent$ = new BehaviorSubject<StudentDetails | null>(this.getStoredStudent());

  constructor(private http: HttpClient) {}

  private hasAdminToken(): boolean {
    if (typeof window !== 'undefined') {
      return !!localStorage.getItem(this.adminTokenKey);
    }
    return false;
  }

  private hasStudentToken(): boolean {
    if (typeof window !== 'undefined') {
      return !!localStorage.getItem(this.studentTokenKey);
    }
    return false;
  }

  private getStoredStudent(): StudentDetails | null {
    if (typeof window !== 'undefined') {
      const data = localStorage.getItem(this.studentDataKey);
      return data ? JSON.parse(data) : null;
    }
    return null;
  }

  // --- Admin Methods ---
  isLoggedIn(): Observable<boolean> {
    return this.adminLoggedIn$.asObservable();
  }

  getToken(): string | null {
    if (typeof window !== 'undefined') {
      return localStorage.getItem(this.adminTokenKey);
    }
    return null;
  }

  login(email: string, password: string): Observable<any> {
    return this.http.post<any>(`${this.baseUrl}/login`, { email, password }).pipe(
      tap(res => {
        if (res && res.token) {
          localStorage.setItem(this.adminTokenKey, res.token);
          this.adminLoggedIn$.next(true);
        }
      })
    );
  }

  logout() {
    if (typeof window !== 'undefined') {
      localStorage.removeItem(this.adminTokenKey);
    }
    this.adminLoggedIn$.next(false);
  }

  // --- Student Methods ---
  isStudentLoggedIn(): Observable<boolean> {
    return this.studentLoggedIn$.asObservable();
  }

  getStudentToken(): string | null {
    if (typeof window !== 'undefined') {
      return localStorage.getItem(this.studentTokenKey);
    }
    return null;
  }

  getStudent(): Observable<StudentDetails | null> {
    return this.currentStudent$.asObservable();
  }

  registerStudent(email: string, pass: string, name: string, collegeName: string): Observable<any> {
    return this.http.post<any>(`${this.baseUrl}/student/register`, { email, password: pass, name, collegeName });
  }

  loginStudent(email: string, pass: string): Observable<any> {
    return this.http.post<any>(`${this.baseUrl}/student/login`, { email, password: pass }).pipe(
      tap(res => {
        if (res && res.token) {
          localStorage.setItem(this.studentTokenKey, res.token);
          localStorage.setItem(this.studentDataKey, JSON.stringify(res.student));
          this.studentLoggedIn$.next(true);
          this.currentStudent$.next(res.student);
        }
      })
    );
  }

  logoutStudent() {
    if (typeof window !== 'undefined') {
      localStorage.removeItem(this.studentTokenKey);
      localStorage.removeItem(this.studentDataKey);
    }
    this.studentLoggedIn$.next(false);
    this.currentStudent$.next(null);
  }
}
