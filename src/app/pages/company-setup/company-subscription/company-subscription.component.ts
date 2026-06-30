import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { AbstractControl, FormBuilder, FormGroup, ReactiveFormsModule, ValidationErrors, Validators } from '@angular/forms';
import { ButtonModule } from 'primeng/button';
import { DropdownModule } from 'primeng/dropdown';
import { CalendarModule } from 'primeng/calendar';
import { InputTextModule } from 'primeng/inputtext';
import { TableModule } from 'primeng/table';
import { TagModule } from 'primeng/tag';
import { DialogModule } from 'primeng/dialog';
import { ToastModule } from 'primeng/toast';
import { ConfirmDialogModule } from 'primeng/confirmdialog';
import { ConfirmationService, MessageService } from 'primeng/api';
import { GlobalFilterComponent } from '@/shared/global-filter/global-filter.component';

// Custom validator — date must be after today
function futureDateValidator(control: AbstractControl): ValidationErrors | null {
  if (!control.value) return null;
  const selected = new Date(control.value);
  selected.setHours(0, 0, 0, 0);
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  return selected >= today ? null : { pastDate: true };   // ← >= instead of >
}

@Component({
  selector: 'app-company-subscription',
  standalone: true,
  templateUrl: './company-subscription.component.html',
  styleUrls: ['./company-subscription.component.scss'],
  imports: [
    CommonModule, ReactiveFormsModule,
    ButtonModule, DropdownModule, CalendarModule, InputTextModule,
    TableModule, TagModule, DialogModule,
    ToastModule, ConfirmDialogModule,
    GlobalFilterComponent
  ],
  providers: [MessageService, ConfirmationService]
})
export class CompanySubscriptionComponent implements OnInit {

  // Main table
  subscriptions: any[] = [];
  filteredSubscriptions: any[] = [];
  flattenedRows: any[] = [];
  globalFilter = '';
  showGlobalSearch = true;
  today: Date = new Date();
  minDate: Date = (() => {
  const d = new Date();
  d.setHours(0, 0, 0, 0);
  return d;
})();

  visibleDialog = false;
  companyForm!: FormGroup;
  moduleForm!: FormGroup;
  innerRows: any[] = [];

  moduleOptions = [
    { label: 'Inventory',            value: 'Inventory',            icon: 'pi pi-box'       },
    { label: 'Workforce',            value: 'Workforce',            icon: 'pi pi-users'     },
    { label: 'Work Management',      value: 'Work Management',      icon: 'pi pi-briefcase' },
    { label: 'Management Reporting', value: 'Management Reporting', icon: 'pi pi-chart-bar' },
    { label: 'Human Resource',       value: 'Human Resource',       icon: 'pi pi-id-card'   },
    { label: 'Accounting',           value: 'Accounting',           icon: 'pi pi-wallet'    },
  ];

  tenureOptions = [
    { label: '1 Month',  value: 1  },
    { label: '3 Months', value: 3  },
    { label: '6 Months', value: 6  },
    { label: '1 Year',   value: 12 },
  ];

  constructor(
    private fb: FormBuilder,
    private messageService: MessageService,
    private confirmationService: ConfirmationService
  ) {}

  ngOnInit() {
    this.initCompanyForm();
    this.initModuleForm();
  }

  initCompanyForm() {
  this.companyForm = this.fb.group({
    companyName: ['', [Validators.required, Validators.maxLength(100)]],
    adminName:   ['', [Validators.required, Validators.maxLength(100)]],
    mobileNo:    ['', [Validators.required, Validators.pattern(/^[0-9]{10}$/)]],
    email:       ['', [Validators.required, Validators.email]]
  });
}

initModuleForm() {
  this.moduleForm = this.fb.group({
    module:    [null, Validators.required],
    tenure:    [null, Validators.required],
    startDate: [this.today, [Validators.required, futureDateValidator]],   // ← default to today
  });
}

  get cf() { return this.companyForm.controls; }
  get f()  { return this.moduleForm.controls; }

  allowOnlyDigits(event: KeyboardEvent) {
    if (!/[0-9]/.test(event.key)) {
      event.preventDefault();
    }
  }

  // ── Dialog ──────────────────────────────────────────
  openDialog() {
    this.innerRows = [];
    this.initCompanyForm();
    this.initModuleForm();
    this.visibleDialog = true;
  }

  closeDialog() {
    this.visibleDialog = false;
  }

  // ── Inner table (inside dialog) ──────────────────────
  addInnerRow() {
    if (this.moduleForm.invalid) {
      this.moduleForm.markAllAsTouched();
      this.messageService.add({ severity: 'warn', summary: 'Warning', detail: 'Fill all fields before adding.' });
      return;
    }

    const { module, tenure, startDate } = this.moduleForm.value;

    if (this.innerRows.find(r => r.module === module.value)) {
      this.messageService.add({ severity: 'warn', summary: 'Duplicate', detail: `${module.value} already added.` });
      return;
    }

    const end = new Date(startDate);
    end.setMonth(end.getMonth() + tenure.value);

    this.innerRows = [...this.innerRows, {
      module:    module.value,
      icon:      module.icon,
      tenureVal: tenure.value,
      tenureLbl: tenure.label,
      startDate: new Date(startDate),
      endDate:   end,
    }];

    this.moduleForm.reset({
      startDate: this.today
    });
    this.messageService.add({ severity: 'success', summary: 'Added', detail: `${module.value} added.` });
  }

  removeInnerRow(row: any) {
    this.innerRows = this.innerRows.filter(r => r !== row);
  }

  onCalendarShow() {
  // Force reposition after the panel renders, since appendTo="body" inside a dialog
  // sometimes calculates position before layout settles
  setTimeout(() => {
    window.dispatchEvent(new Event('resize'));
  });
}

 private rebuildFlattenedRows() {
  this.flattenedRows = this.subscriptions.flatMap((sub, subIndex) =>
    sub.modules.map((m: any, modIndex: number) => ({
      subIndex,
      modIndex,
      company:   sub.company,
      adminName: sub.adminName,
      mobile:    sub.mobile,
      email:     sub.email,
      status:    sub.status,
      module:    m.module,
      icon:      m.icon,
      tenureLbl: m.tenureLbl,
      startDate: m.startDate,
      endDate:   m.endDate
    }))
  );
}

// Update submitDialog() to call rebuild at the end
submitDialog() {
  if (this.companyForm.invalid) {
    this.companyForm.markAllAsTouched();
    this.messageService.add({ severity: 'warn', summary: 'Warning', detail: 'Fill company details before submitting.' });
    return;
  }

  if (!this.innerRows.length) {
    this.messageService.add({ severity: 'warn', summary: 'Warning', detail: 'Add at least one module.' });
    return;
  }

  const { companyName, adminName, mobileNo, email } = this.companyForm.value;

  const record = {
    company:   companyName,
    adminName: adminName,
    mobile:    mobileNo,
    email:     email,
    modules: this.innerRows.map(r => ({
      module:    r.module,
      icon:      r.icon,
      tenureLbl: r.tenureLbl,
      startDate: r.startDate,
      endDate:   r.endDate
    })),
    status: 'Active'
  };

  this.subscriptions = [...this.subscriptions, record];
  this.rebuildFlattenedRows();

  this.messageService.add({ severity: 'success', summary: 'Success', detail: 'Subscription added successfully!' });
  this.closeDialog();
}

// New delete method — removes a single module row from its parent subscription
deleteSubscriptionRow(row: any) {
  this.confirmationService.confirm({
    header: 'Confirm',
    message: `Remove "${row.module}" from ${row.company}'s subscription?`,
    accept: () => {
      const sub = this.subscriptions[row.subIndex];
      sub.modules.splice(row.modIndex, 1);

      // If no modules left for this company, remove the whole subscription
      if (sub.modules.length === 0) {
        this.subscriptions.splice(row.subIndex, 1);
      }

      this.subscriptions = [...this.subscriptions];
      this.rebuildFlattenedRows();
      this.messageService.add({ severity: 'success', summary: 'Deleted', detail: 'Module removed.' });
    }
  });
}

 applyGlobalFilterManual() {
  const val = this.globalFilter?.toLowerCase().trim();
  if (!val) {
    this.rebuildFlattenedRows();
    return;
  }
  this.rebuildFlattenedRows();
  this.flattenedRows = this.flattenedRows.filter(r =>
    r.company.toLowerCase().includes(val) ||
    r.email.toLowerCase().includes(val) ||
    r.mobile.includes(val) ||
    r.module.toLowerCase().includes(val)
  );
}
}