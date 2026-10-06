import { CommonModule, DatePipe } from '@angular/common';
import { Component } from '@angular/core';
import { FormBuilder, FormsModule, ReactiveFormsModule, Validators } from '@angular/forms';
import { ButtonModule } from 'primeng/button';
import { CheckboxModule } from 'primeng/checkbox';
import { ConfirmDialogModule } from 'primeng/confirmdialog';
import { DatePickerModule } from 'primeng/datepicker';
import { DialogModule } from 'primeng/dialog';
import { DropdownModule } from 'primeng/dropdown';
import { FileUploadModule } from 'primeng/fileupload';
import { FluidModule } from 'primeng/fluid';
import { InputTextModule } from 'primeng/inputtext';
import { MessageModule } from 'primeng/message';
import { RippleModule } from 'primeng/ripple';
import { SelectModule } from 'primeng/select';
import { TableModule } from 'primeng/table';
import { TextareaModule } from 'primeng/textarea';
import { ToggleSwitchModule } from 'primeng/toggleswitch';
import { ConfirmationService, MessageService } from 'primeng/api';
import { AuthService } from '@/core/services/auth.service';
import { SetupMaintainceService } from '@/core/services/setup-maintaince.service';
import { FundService } from '@/core/services/fund.service';
import { FundAllocationComponent } from '../fund-allocation/fund-allocation.component';

@Component({
  selector: 'app-new-fund-allocation',
  imports: [
    CommonModule,
    ReactiveFormsModule,
    TextareaModule,
    TableModule,
    InputTextModule,
    FormsModule,
    FileUploadModule,
    ButtonModule,
    SelectModule,
    DropdownModule,
    ToggleSwitchModule,
    RippleModule,
    FluidModule,
    MessageModule,
    DatePickerModule,
    DialogModule,
    ConfirmDialogModule,
    CheckboxModule
  ],
  templateUrl: './new-fund-allocation.component.html',
  styleUrl: './new-fund-allocation.component.scss',
  providers: [ConfirmationService, DatePipe]
})
export class NewFundAllocationComponent extends FundAllocationComponent {
  constructor(
    fb: FormBuilder,
    authService: AuthService,
    messageService: MessageService,
    datePipe: DatePipe,
    setupService: SetupMaintainceService,
    fundService: FundService,
    confirmationService: ConfirmationService
  ) {
    super(fb, authService, messageService, datePipe, setupService, fundService, confirmationService);
    this.pageTitle = 'New Fund Allocation';
    this.showReportTypeSwitch = false;
  }

  override ngOnInit(): void {
    super.ngOnInit();
    this.fundForm.patchValue({
      reportType: 'demand',
      paymentFor: '',
      period: '',
      projectName: '',
      groupleader: '',
      workerProfile: '',
      startDate: this.today,
      endDate: this.today
    });
    this.selectedStatus = 'PENDING';
    this.updatePeriodValidation();
  }
}
