export interface UserHeader {
  uname?: string;
  p_ufullname?: string;
  p_uname?: string;
  p_pwd?: string;
  p_active?: string;
  p_operationtype?: string;
  p_phone?: string;
  p_utypeid?: string;
  p_email?: string;
  p_loginuser?: string;
  p_oldpwd?: string;
  clientcode?: string;
  p_companyid?:string;
  p_companyname: string;
  p_companyaddress: string;
  p_companycity: string;
  p_companystate: string;
  p_companycountry: string;
  p_companypincode: string;
  p_companyphone: string;
  p_companyemail: string | null;
  p_companygstno: string;
  p_companycontactperson: string;
  p_companycontactphone: string;
  p_companycontactemail: string;
  p_companyLogo: string | null;
  "x-access-token"?: string;
}

// company-subscription.model.ts

export interface SubscriptionModule {
    moduleid: number;
    startdate: string;   // 'YYYY-MM-DD'
    enddate: string;      // 'YYYY-MM-DD'
}

export interface CompanySubscriptionUpsertParamter {
    p_companyid: number;
    p_companyname: string;
    p_adminname: string;
    p_adminmobile: string;
    p_adminemail: string;
    p_subscription_json: SubscriptionModule[];
    p_loginuser: string;
}

