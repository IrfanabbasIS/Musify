import { ChangeDetectorRef, Component, Inject, OnInit } from '@angular/core';
import {
  AbstractControl,
  FormBuilder,
  FormGroup,
  ValidationErrors,
  Validators,
} from '@angular/forms';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { EditProfileDialogData } from '../../core/models/dialog.model';
import { UpdateUserProfileRequest } from '../../core/models/user.models';

@Component({
  selector: 'app-edit-profile-dialog',
  standalone: false,
  templateUrl: './edit-profile-dialog.html',
  styleUrl: './edit-profile-dialog.css',
})
export class EditProfileDialog implements OnInit {
  editForm: FormGroup;
  hideOldPassword = true;
  hideNewPassword = true;
  hideConfirmPassword = true;
  showPasswordSection = false;

  private readonly passwordFields = ['oldPassword', 'newPassword', 'confirmPassword'] as const;

  constructor(
    public dialogRef: MatDialogRef<EditProfileDialog>,
    @Inject(MAT_DIALOG_DATA) public data: EditProfileDialogData,
    private formBuilder: FormBuilder,
    private cdr: ChangeDetectorRef,
  ) {
    this.editForm = this.formBuilder.group(
      {
        name: [data.user.name, [Validators.required, Validators.minLength(2)]],
        oldPassword: [''],
        newPassword: ['', [Validators.required, Validators.minLength(2)]],
        confirmPassword: [''],
      },
      { validator: this.passwordMatchValidator }
    );
  }

  ngOnInit(): void {
    this.editForm.get('newPassword')?.valueChanges.subscribe(() => this.triggerFormValidation());
    this.editForm
      .get('confirmPassword')
      ?.valueChanges.subscribe(() => this.triggerFormValidation());
  }

  private triggerFormValidation() {
    this.editForm.updateValueAndValidity({ emitEvent: false });
  }

  private passwordMatchValidator(control: AbstractControl): ValidationErrors | null {
    const newPassword = control.get('newPassword')?.value;
    const confirmPassword = control.get('confirmPassword')?.value;

    if (!newPassword || !confirmPassword) {
      return null;
    }
    return newPassword === confirmPassword ? null : { passwordMismatch: true };
  }

  togglePasswordSection(){
    this.showPasswordSection=!this.showPasswordSection;

    if(this.showPasswordSection)
    {
      this.setPasswordValidators();
    }
    else
    {
      this.clearPasswordFields();
    }
  }

  private setPasswordValidators(){
    this.editForm.get('oldPassword')?.setValidators([Validators.required]);
    this.editForm.get('newPassword')?.setValidators([Validators.required, Validators.minLength(6)]);
    this.editForm.get('confirmPassword')?.setValidators([Validators.required]);
    this.updatePasswordFieldsValidity();
  }

  private clearPasswordFields(){
    this.passwordFields.forEach(field =>{
      const control=this.editForm.get(field)!;
      control.clearValidators();
      control.setValue('');
      control.updateValueAndValidity();

    })
  }

  private updatePasswordFieldsValidity(){
    this.passwordFields.forEach(field=> this.editForm.get(field)!.updateValueAndValidity());
  }

  onCancel()
  {
    this.dialogRef.close();
  }

  onSave(){
    this.editForm.markAsTouched();
    if(this.editForm.invalid) return;

    const updateRequest=this.buildUpdateRequest();
    if(!this.hasChnage(updateRequest))
    {
      this.dialogRef.close();
      return;
    }

    this.dialogRef.close(updateRequest);
  }

  private buildUpdateRequest(): UpdateUserProfileRequest {
    const request : UpdateUserProfileRequest = {};

    const name = this.editForm.get('name')?.value?.trim();
    if (name && name !== this.data.user.name) {
      request.name = name;
    }

    const oldPassword = this.editForm.get('oldPassword')?.value;
    const newPassword = this.editForm.get('newPassword')?.value;

    if(this.showPasswordSection && oldPassword && newPassword)
    {
      request.oldPassword=oldPassword;
      request.password=newPassword;
    }

    return request;
  }

  private hasChnage(request: UpdateUserProfileRequest): boolean {
    return Object.keys(request).length > 0;
  }
}
