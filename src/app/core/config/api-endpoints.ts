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
    getdropdowndetails:'/masterdata/get-data-parameter',
    getdropdownmaster:'/masterdata/dropdown-master',
    removedataparameter:'/masterdata/remove-data-parameter',
    getusertypedetail:'/profilemaster/get',
    getusertypeinsert:'/profilemaster/upsert',
    getuserdetail:'/users/get-user-list',
    getuserdetailinsert:'/users/upsert-user-master',
    submitusersecurity:'/securitycontrol/upsert',
    submitbulkattendance:'/securitycontrol/bulkCaptureAttendance',
    upsertworkerprofileexit:'/profilemaster/upsert-worker-profile-exit'
  },

 project:{
  getprojectlist:'/project/list',
  getprojectupsert:'/project/upsert',
  gettowerlist:'/tower/list',
  gettowerupsert:'/tower/manage',
  getruledetails:'/ruledetail/upsert'
 },

myapproval:{
getapprovalsubmit:'/approval/request',
getapprovalrequesthaziri:'/approval/create_approval_request_haziri',
},

  user:{
    getuserdetails:'/getuserdetails',
     updateprofie:'/profilemaster/upsertprofile',
     getchangepassword:'/changepassword/upsert'
  },

  fund:{
    savefundexcel:'/savefundexcel',
    uploadApprovedAmount:'/fund/uploadApprovedAmount'
  },

  report:{
 recordreport:'/report/get-report-data'
  },

  dashboard:{
  cardstatus:'/workerCards/upsert'
  }

};


