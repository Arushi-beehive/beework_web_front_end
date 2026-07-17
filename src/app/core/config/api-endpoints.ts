export const API_ENDPOINTS = {
  auth: {
    login: '/login',
    register: '/auth/register',
    profile: '/auth/me'
  },
  users: {
    login: '/users/login',
    base: '/users',
    details: (id: number) => `/users/${id}`

  },
  beework:{
    login: '/beework/login'
  },
  beeware:{
    login: '/beeware/login'
  },
  inventory: {
    base: '/inventory',
    item: (id: number) => `/inventory/${id}`,
    insertpurchaseheader:'/insertpurchaseheader',
    insertitemdetails:'/insertitemdetails',
    getdropdowndetails:'/getdropdowndetails',
    returndropdowndetails:'/returndropdowndetails',
    adjustmentlist:'/getstockadjustment',
    updateitemlist:'/getitemdetails',
    getinvoicedetail:'/getinvoicedetails',
    deletepurchasedetails:'/deletepurchasedetails',
    updatestockadjustment:'/updatestockadjustment',
    inserttransactiondetails:'/inserttransactiondetails',
    gettransactiondetails:'/gettrasnactiondetails',
    gettransactionreport:'/gettrasnactionreport',
  },
  sales:{
    getcalculatedMRP:'/getcalculatedMRP'
  },
  orders: {
    base: '/orders',
    byId: (id: number) => `/orders/${id}`
  },
  suppliers: {
    base: '/suppliers'
  },
  dashboardservice: {
    topbar: '/getdashboardreport'
  },

  setup:{
    getdropdowndetails:'/beework/masterdata/get-data-parameter',
    getparameterbased:'/public/get-data-parameter',
    getdropdownmaster:'/beework/masterdata/dropdown-master',
    removedataparameter:'/beework/masterdata/remove-data-parameter',
    getusertypedetail:'/beework/profilemaster/get',
    getusertypeinsert:'/beework/profilemaster/upsert',
    getuserdetail:'/beework/users/get-user-list',
    getuserdetailinsert:'/beework/users/upsert-user-master',
    submitusersecurity:'/beework/securitycontrol/upsert',
    submitbulkattendance:'/beework/securitycontrol/bulkCaptureAttendance',
    upsertworkerprofileexit:'/beework/profilemaster/upsert-worker-profile-exit'
  },

 project:{
  getprojectlist:'/beework/project/list',
  getprojectupsert:'/beework/project/upsert',
  gettowerlist:'/beework/tower/list',
  gettowerupsert:'/beework/tower/manage',
  getruledetails:'/beework/ruledetail/upsert'
 },

myapproval:{
getapprovalsubmit:'/beework/approval/request',
getapprovalrequesthaziri:'/beework/approval/create_approval_request_haziri',
},

  user:{
    getuserdetails:'/beework/getuserdetails',
     updateprofie:'/beework/profilemaster/upsertprofile',
     getchangepassword:'/beework/changepassword/upsert'
  },

  fund:{
    savefundexcel:'/beework/savefundexcel',
    uploadApprovedAmount:'/beework/fund/uploadApprovedAmount'
  },

  report:{
 recordreport:'/beework/report/get-report-data'
  },

  dashboard:{
  cardstatus:'/beework/workerCards/upsert'
  },
  company:{
    upsertcompanydetails:'/public/companydetail/upsert',
    upsertcompanysubscription:'/public/upsert_company_subscription'
  }


};


