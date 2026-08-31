import { ChangeDetectorRef, Component, ElementRef, OnDestroy, OnInit, ViewChild } from '@angular/core';
import { User } from '../../core/models/user.models';
import { UserService } from '../../core/services/user-service';
import { AuthService } from '../../core/services/auth-service';
import { NotificationService } from '../../core/services/notification-service';

@Component({
  selector: 'app-all-users',
  standalone: false,
  templateUrl: './all-users.html',
  styleUrl: './all-users.css',
})
export class AllUsers implements OnInit, OnDestroy {
  users:User[]=[];
  loading=true;
  loadingMore=false;
  errorMessage='';
  currentUserId:number | null=null;


  currentPage=0;
  pageSize=10;
  totalElements=0;
  hasMoreUsers=true;

  private _scrollTrigger!: ElementRef;
  private observer!: IntersectionObserver;

  @ViewChild('scrollTrigger') set scrollTrigger(el: ElementRef) {
    if (el) {
      this._scrollTrigger = el;
      this.setupInfiniteScroll();
      
    } else {
      this._scrollTrigger = null!;
    }
  }

  constructor(
    private userService:UserService,
    private authService:AuthService,
    private notificationService:NotificationService,
    private cdr:ChangeDetectorRef
  ){

  }

  ngOnInit(): void {
      const currentUser=this.authService.getCurrentUser();
      this.currentUserId=currentUser?.id || null;
      this.loadUsers();
  }

   ngOnDestroy(): void {
    if (this.observer) {
      this.observer.disconnect();
    }
  }

  setupInfiniteScroll() {
    if (this.observer) {
      this.observer.disconnect();
    }

    const options = {
      root: null,
      rootMargin: '200px',
      threshold: 0.1,
    };

    this.observer = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting && !this.loadingMore && this.hasMoreUsers) {
          this.loadMoreUsers();
        }
      });
    }, options);

    if (this._scrollTrigger?.nativeElement) {
      this.observer.observe(this._scrollTrigger.nativeElement);
    }
  }

  loadUsers() {
    this.loading = true;
    this.errorMessage = '';
    this.currentPage = 0;
    this.users = [];

    this.userService.getAllUsers(this.currentPage, this.pageSize).subscribe({
      next: (response) => {
        this.users = response.content || [];
        this.hasMoreUsers = !response.last;
        this.loading = false;
        this.totalElements=response.totalElements;
        this.cdr.detectChanges();
      },
      error: (error) => {
        this.errorMessage = 'Failed to load users. Please try again.';
        this.loading = false;
        console.error(error);
      },
    });
  }

  loadMoreUsers() {
    if (this.loadingMore || !this.hasMoreUsers) return;

    this.loadingMore = true;
    this.currentPage++;

    this.userService.getAllUsers(this.currentPage, this.pageSize).subscribe({
      next: (response) => {
        this.users = [...this.users, ...response.content];
        this.hasMoreUsers = !response.last;
        this.loadingMore = false;
        this.cdr.detectChanges();
      },
      error: () => {
        this.loadingMore = false;
        this.currentPage--;
        this.notificationService.error('Failed to load more users.Please try again.');
      },
    });
  }

  updateUserRole(user:User, newRole: 'USER' | 'ADMIN')
  {
    if(user.role===newRole) return;

    this.userService.updateUserRole(user.id, newRole).subscribe({
      next:(updatedUser)=>{
        const index=this.users.findIndex(u=> u.id===user.id);
        if(index!==-1)
        {
          this.users[index]=updatedUser;
        }
        this.notificationService.success(`User role updated to${newRole}`);
      },
      error:(error)=>{
        const errorMessage=error?.error?.message || 'Failed to update user role. Please try again.';
        this.notificationService.error(errorMessage);
      }
    })
  }

  getRoleBadgeClass(role:string)
  {
    return role==='ADMIN' ? 'role-badge-admin' : 'role-badge-user';
  }

  isCurrentUser(user:User)
  {
    return user.id===this.currentUserId;
  }

}
