import { ChangeDetectorRef, Component, OnDestroy, OnInit } from '@angular/core';
import { User } from '../../core/models/user.models';
import { UserService } from '../../core/services/user-service';
import { MatDialog } from '@angular/material/dialog';
import { NotificationService } from '../../core/services/notification-service';
import { EditProfileDialog } from '../../shared/edit-profile-dialog/edit-profile-dialog';

@Component({
  selector: 'app-profile',
  standalone: false,
  templateUrl: './profile.html',
  styleUrl: './profile.css',
})
export class Profile implements OnInit{
  user:User | null=null;
  loading=true;
  errorMessage='';

  constructor(private userService:UserService,
    private dialog:MatDialog,
    private notificationService:NotificationService,
    private cdr:ChangeDetectorRef,
  )
  {

  }

  ngOnInit(): void {
      this.loadUserProfile();
  }

  

  loadUserProfile(){
    this.loading=true;
    this.errorMessage='';

    this.userService.getUserProfile().subscribe({
      next:(user)=>{
        this.user=user;
        this.loading=false;
        this.cdr.detectChanges();
      },

      error:(error)=>{
        this.errorMessage='Failed to load your profile. Please try again later.';
        this.loading=false;
        console.log(error);
      }
    })
  }

  openEditProfileDailog(){
    if(!this.user) return;

    const dialogRef=this.dialog.open(EditProfileDialog,{
      width:'500px',
      maxWidth:'90w',
      panelClass:['custom-dialog-container', 'edit-profile-dialod'],
      data:{user : this.user}
    });

    dialogRef.afterClosed().subscribe(updateRequest =>{
      if(!updateRequest) return;

      this.userService.updateUserProfile(updateRequest).subscribe({
        next:(updatedUser)=>
        {
          this.user=updatedUser,
          this.notificationService.success('Profile updated successfully');
        },
        error:(error)=>{
          const errorMessage=error?.error?.message || 'Failed to update profile. Please try again.';
          this.notificationService.error(errorMessage);
        }
      })
    })
  }

  getRoleBadgeClass(){
    return this.user?.role==='ADMIN' ? 'role-badge-admin' : 'role-badge-user'
  }
}
