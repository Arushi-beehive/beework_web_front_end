import { AppConfigurator } from '@/layout/components/app.configurator';
import { LayoutService } from '@/layout/service/layout.service';
import { CommonModule } from '@angular/common';
import { Component, computed, inject, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, FormsModule, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router, RouterModule } from '@angular/router';
import { ButtonModule } from 'primeng/button';
import { CardModule } from 'primeng/card';
import { CheckboxModule } from 'primeng/checkbox';
import { DividerModule } from 'primeng/divider';
import { IconFieldModule } from 'primeng/iconfield';
import { InputIconModule } from 'primeng/inputicon';
import { InputTextModule } from 'primeng/inputtext';
import { PasswordModule } from 'primeng/password';
import { MessageModule } from 'primeng/message';
import { AuthService } from '@/core/services/auth.service';
import { ShareService } from '@/core/services/shared.service';
import { MessageService } from 'primeng/api';
import { LoginService } from '@/core/services/login.service';

@Component({
    selector: 'app-login',
    templateUrl: './login.component.html',
    standalone: true,
    styleUrl: './login.component.scss',
    imports: [CommonModule, FormsModule, AppConfigurator, ReactiveFormsModule, RouterModule, InputTextModule, CheckboxModule, PasswordModule, ButtonModule, CardModule, DividerModule, IconFieldModule, InputIconModule, MessageModule]
})
export class LoginComponent implements OnInit {
    public loginTypes = [
        { label: 'Admin', value: 'admin' },
        { label: 'Employee', value: 'employee' },
        { label: 'Manager', value: 'manager' }
    ];
modules = [
  { label: 'Inventory',            icon: 'pi pi-box',          route: '/inventory' },
  { label: 'Workforce',            icon: 'pi pi-users',        route: '/workforce' },
  { label: 'Work Management',      icon: 'pi pi-briefcase',    route: '/work-management' },
  { label: 'Management Reporting', icon: 'pi pi-chart-bar',    route: '/management-reporting' },
  { label: 'Human Resource',       icon: 'pi pi-id-card',      route: '/human-resource' },
  { label: 'Accounting',           icon: 'pi pi-wallet',       route: '/accounting' },
]
    LayoutService = inject(LayoutService);
    isDarkTheme = computed(() => this.LayoutService.isDarkTheme());
    loginForm!: FormGroup;
    showPassword: boolean = false;

    constructor(
        private fb: FormBuilder,
        private route: Router,
        private authservice: AuthService,
        private sharedService: ShareService,
        private messageService: MessageService,
        private loginService: LoginService
    ) {}

    ngOnInit() {
        // First create the form with default values
        this.loginForm = this.fb.group({
            pwd: [null, [Validators.required, Validators.minLength(6)]],
            clientcode: [null, [Validators.required, Validators.pattern(/^[0-9]{10}$/)]],
            rememberMe: [false]
        });
        // Then try to load remembered credentials
        this.loadRememberedCredentials();
    }

    forgetPassword() {
        this.route.navigate(['/forgotpassword']);
    }

    allowOnlyDigits(event: KeyboardEvent) {
        const char = event.key;
        if (!/[0-9]/.test(char)) {
            event.preventDefault();
        }
    }

openModule(m: { label: string; route: string }) {
  this.route.navigate([m.route])
}

    loadRememberedCredentials() {
        try {
            const remembered = localStorage.getItem('rememberMe');
            if (remembered === 'true') {
                const savedMobileno = localStorage.getItem('savedMobileno');
                const savedPassword = localStorage.getItem('savedPassword');
                if (savedMobileno && savedPassword) {
                    this.loginForm.patchValue({
                        pwd: savedPassword || '',
                        clientcode: savedMobileno,
                        rememberMe: true
                    });
                }
            }
        } catch (error) {
            console.error('Error loading remembered credentials:', error);
            this.clearSavedCredentials();
        }
    }

    saveCredentials(clientcode: string, password: string) {
        try {
            const rememberMe = this.loginForm.get('rememberMe')?.value;

            if (rememberMe) {
                localStorage.setItem('rememberMe', 'true');
                localStorage.setItem('savedMobileno', clientcode);
                localStorage.setItem('savedPassword', password);

                console.log('✅ Credentials saved to localStorage');
            } else {
                this.clearSavedCredentials();
            }
        } catch (error) {
            console.error('Error saving credentials:', error);
            this.messageService.add({
                severity: 'warn',
                summary: 'Warning',
                detail: 'Could not save credentials to browser storage'
            });
        }
    }

    clearSavedCredentials() {
        try {
            localStorage.removeItem('rememberMe');
            localStorage.removeItem('savedMobileno');
            localStorage.removeItem('savedPassword');
            console.log('Credentials cleared from localStorage');
        } catch (error) {
            console.error('Error clearing credentials:', error);
        }
    }

    onSubmit() {
        if (this.loginForm.valid) {
            const { clientcode, pwd, rememberMe } = this.loginForm.value;
            this.sharedService.setClientCode(clientcode);
            this.saveCredentials(clientcode, pwd);
            this.loginService.isLogged(this.loginForm.value).subscribe({
                next: (res: any) => {
                    if (res.success == true) {
                        const token = res.data.usertoken;

                        if (token) {
                            this.sharedService.setUserToken(token);
                            this.sharedService.setUserData(res.data);
                            this.showSuccess(res.message);
                            this.route.navigate(['/layout']);
                        }
                    } else {
                        this.errorSuccess(res.message);
                    }
                },
                error: (res) => {
                    console.error('Login API error:', res);
                    this.messageService.add({
                        severity: 'error',
                        summary: 'Error',
                        detail: 'Login failed. Please try again.'
                    });
                }
            });
        }
    }

    togglePassword() {
        this.showPassword = !this.showPassword;
    }

    showSuccess(message: string) {
        this.messageService.add({ severity: 'success', summary: 'Success', detail: message });
    }

    errorSuccess(message: string) {
        this.messageService.add({ severity: 'error', summary: 'Error', detail: message });
    }
}
