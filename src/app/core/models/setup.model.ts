export interface DropdownParamter{
  returnType:string;
  returnValue:string | null;
  username:string;
}

export interface removeParamter{
  returnType:string;
  returnValue:string | null;
  username:string;
}

export interface DropdownMaster{
  id:BigInteger;
  ddType:string;
  ddValue:string;
  ddCode:string;
  ddNumber: string;
}

export interface AccessUserProfile{
profileid:number;
profilename:string;
}

export interface AccessPermission{
  permissionid:number;
  access_name:string;
  access_desc:string;
}

export interface UserType{
   isActive: string | null;
}

export interface UserTypeInsert {
  profileId: number;
  profileName: string;
  isActive: 'Y' | 'N';
  user: string;
  webaccess: 'Y' | 'N';
}

export interface UserInsert{
  userId: number,
  mobileNo: string,
  password: string,
  fname: string,
  lname: string,
  emailId: string,
  userType:string,
  isActive:string,
  createdBy: string,
  updatedBy: string,
  projectId: MultipleProject[]
}

export interface MultipleProject{
  id: number;
}

export interface SubmitSecurity{
  profileId: number;
  permission: AvailablePermission[],
  pType: string,
  created: number
}

export interface AvailablePermission{
  id: number;
}

export interface UpsertWorkerProfileExit{
  userId: number;
  exitDate: string;
  remark: string;
  createdBy: string;
  updatedBy: string;
  ppeReturn: string;
  reactive: string;
  workerExit: string;
  newGroupLeader: number | null;
}


