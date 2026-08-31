import { Injectable } from '@angular/core';
import { MatSnackBar } from '@angular/material/snack-bar';

@Injectable({
  providedIn: 'root',
})
export class NotificationService {
  constructor(private snakbar:MatSnackBar){}
  success(message:string, duration:number=5000)
  {
    this.snakbar.open(`✓${message}`, `✕`,
      {
        duration:duration,
        horizontalPosition:'center',
        verticalPosition:'top',
        panelClass:["notification-success"]
      }
    );
  }

  error(message:string, duration:number=5000)
  {
    this.snakbar.open(`!${message}`, `✕`,
      {
        duration:duration,
        horizontalPosition:'center',
        verticalPosition:'top',
        panelClass:["notification-error"]
      }
    );
  }

    warning(message:string, duration:number=5000)
  {
    this.snakbar.open(`⚠${message}`, `✕`,
      {
        duration:duration,
        horizontalPosition:'center',
        verticalPosition:'top',
        panelClass:["notification-warning"]
      }
    );
  }

  
}
