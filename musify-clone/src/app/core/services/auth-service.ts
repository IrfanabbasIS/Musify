import { Injectable } from '@angular/core';
import { environment } from '../../../environments/environment';
import { BehaviorSubject, catchError, filter, Observable, of, switchMap, take, tap, throwError } from 'rxjs';
import {
  AuthResponse,
  LoginRequest,
  MessageResponse,
  SignUpRequest,
  User,
} from '../models/user.models';
import { HttpClient } from '@angular/common/http';
import { Router } from '@angular/router';

@Injectable({
  providedIn: 'root',
})
export class AuthService {
  private baseUrl = `${environment.apiUrl}/auth`;
  private currentUserSubject = new BehaviorSubject<User | null>(this.getUserFromStorage());
  public currentUser$ = this.currentUserSubject.asObservable();

  private isRefreshing = false;
  private refreshResult$ = new BehaviorSubject<{ success: boolean; token?: string } | null>(null);

  constructor(
    private http: HttpClient,
    private router: Router,
  ) { }

  private getUserFromStorage(): User | null {
    const userJson = localStorage.getItem('currentUser');
    return userJson ? JSON.parse(userJson) : null;
  }

  getAccessToken(): string | null {
    return localStorage.getItem('accessToken');
  }

  getRefreshToken(): string | null {
    return localStorage.getItem('refreshToken');
  }

  isLoggedIn(): boolean {
    return !!this.getAccessToken();
  }

  forgotPassword(email: string): Observable<MessageResponse> {
    return this.http.post<MessageResponse>(`${this.baseUrl}/forgotPassword`, { email });
  }

  signUp(request: SignUpRequest): Observable<MessageResponse> {
    return this.http.post<MessageResponse>(`${this.baseUrl}/registerUser`, request);
  }

  login(request: LoginRequest): Observable<AuthResponse> {
    return this.http
      .post<AuthResponse>(`${this.baseUrl}/loginUser`, request)
      .pipe(tap((response) => this.handleAuthSuccess(response)));
  }

  private handleAuthSuccess(response: AuthResponse) {
    localStorage.setItem('accessToken', response.accessToken);
    localStorage.setItem('refreshToken', response.refreshToken);

    const user: User = {
      id: response.id,
      name: response.name,
      email: response.email,
      role: response.role,
    };

    localStorage.setItem('currentUser', JSON.stringify(user));
    this.currentUserSubject.next(user);
  }

  refreshAccessToken(): Observable<AuthResponse> {
    if (this.isRefreshing) {
      return this.refreshResult$.pipe(
        filter((result) => result !== null),
        take(1),

        switchMap((result) => {
          if (result!.success && result!.token) {
            return of({ accessToken: result!.token } as AuthResponse);
          }

          return throwError(() => new Error('Token refresh failed'));
        }),
      );
    }

    const refreshToken = this.getRefreshToken();
    if (!refreshToken) {
      this.logout();
      return throwError(()=> new Error('No refresh token available'));
    }
    this.isRefreshing=true;
    this.refreshResult$.next(null);
    return this.http.post<AuthResponse>(`${this.baseUrl}/refreshAccessToken`, {refreshToken})
    .pipe(
      tap(response =>{
        localStorage.setItem('accessToken', response.accessToken);
        if(response.refreshToken)
        {
          localStorage.setItem('refreshToken', response.refreshToken);
        }
        this.isRefreshing=false;
        this.refreshResult$.next({
          success:true,
          token:response.accessToken
        });
      }),

      catchError(error =>
      {
        this.isRefreshing=false;
        this.refreshResult$.next({success:false});
        this.logout();
        return throwError(()=> error);
      }
      )
    );
  }

  refreshAccessTokenAsync():Promise<string>{
    return new Promise((resolve, reject)=>{
      this.refreshAccessToken().subscribe({
        next:(response)=>
        {
          resolve(response.accessToken);
        },
        error:(error)=>{
          reject(error);
        }
      })
    })
  }

  logout(): void {
    localStorage.removeItem('accessToken');
    localStorage.removeItem('refreshToken');

    localStorage.removeItem('currentUser');
    this.currentUserSubject.next(null);
    this.router.navigate(['login']);
  }

  getCurrentUser(): User |null
  {
    return this.currentUserSubject.value;
  }

  getUserRole(): 'USER' | 'ADMIN' | null
  {
    const user=this.getCurrentUser();
    return user ? user.role:null;
  }

  isAdmin():boolean{
    return this.getUserRole()== 'ADMIN';
  }
}
