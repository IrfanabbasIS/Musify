import { Component, Inject } from '@angular/core';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { ConfirmationDialogData } from '../../core/models/dialog.model';

@Component({
  selector: 'app-confirmation-dialog',
  standalone: false,
  templateUrl: './confirmation-dialog.html',
  styleUrl: './confirmation-dialog.css',
})
export class ConfirmationDialog {
  constructor(
    public dialogRef: MatDialogRef<ConfirmationDialog>,
    @Inject(MAT_DIALOG_DATA) public data: ConfirmationDialogData,
  ) {
    this.data.confirmText = this.data.confirmText || 'Confirm';
    this.data.cancelText = this.data.cancelText || 'Cancel';
    this.data.confirmColor = this.data.confirmColor || 'warn';
    this.data.type = this.data.type || 'warning';
  }

  onCancel() {
    this.dialogRef.close(false);
  }

  onConfirm() {
    this.dialogRef.close(true);
  }

  getIconClass(): string {
    return `icon-${this.data.type}`;
  }

  getIconSymbol(): string {
    switch (this.data.type) {
      case 'warning':
        return '!';
      case 'danger':
        return '⚠';
      case 'info':
        return 'i';
      case 'success':
        return '✓';
      default:
        return '!';
    }
  }

  getConfirmButtonClass(): string {
    switch (this.data.confirmColor) {
      case 'warn':
        return 'btn-danger';
      case 'primary':
        return 'btn-primary';
      case 'accent':
        return 'btn-accent';
      default:
        return 'btn-danger';
    }
  }
}
