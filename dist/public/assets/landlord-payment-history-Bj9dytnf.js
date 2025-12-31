import{r as $,j as e}from"./ui-DbSH5uIw.js";import{u as A,z as k,aI as E,a as P,y as C,N as l,K as c,C as d,Z as f,c as j,n as y,ai as N,B as T,aB as i,o as I}from"./index-C3yA2dmm.js";import{u as R}from"./query-C11-Me4M.js";import{D as F}from"./download-B0ydaUeF.js";import"./vendor-15WF5uYg.js";import"./charts-DfbWf95P.js";function Y(){const{isLoggedIn:o}=A(),[,m]=k(),{leaseId:g}=E(),{toast:x}=P();$.useEffect(()=>{C({title:"Payment History - Choice Properties",description:"View detailed payment history for a lease.",url:"https://choiceproperties.com/landlord-payment-history"})},[]);const{data:u,isLoading:b}=R({queryKey:[`/api/v2/leases/${g}/payment-history`],enabled:o});if(!o)return m("/login"),null;const v=async t=>{try{const n=await fetch(`/api/v2/payments/${t}/receipt`);if(!n.ok)throw new Error("Failed to download receipt");const s=(await n.json()).data,M=`
PAYMENT RECEIPT
===============
Receipt Number: ${s.receiptNumber}
Payment ID: ${s.paymentId}

PROPERTY
--------
${s.property.title}
${s.property.address}

PAYMENT DETAILS
---------------
Type: ${s.type}
Amount: $${s.amount.toFixed(2)}
Status: ${s.status}
Reference ID: ${s.referenceId}

DATES
-----
Due Date: ${s.dueDate?i(new Date(s.dueDate),"MMMM dd, yyyy"):"N/A"}
Paid Date: ${s.paidDate?i(new Date(s.paidDate),"MMMM dd, yyyy"):"N/A"}
Verified Date: ${s.verificationDate?i(new Date(s.verificationDate),"MMMM dd, yyyy"):"N/A"}

TENANT
------
Name: ${s.tenant.name}
Email: ${s.tenant.email}

VERIFICATION
------------
Verified By: ${s.verifiedBy}

Generated: ${i(new Date,"MMMM dd, yyyy HH:mm:ss")}
      `,r=document.createElement("a");r.setAttribute("href",`data:text/plain;charset=utf-8,${encodeURIComponent(M)}`),r.setAttribute("download",`receipt-${s.receiptNumber}.txt`),r.style.display="none",document.body.appendChild(r),r.click(),document.body.removeChild(r),x({title:"Success",description:"Receipt downloaded successfully."})}catch{x({title:"Error",description:"Failed to download receipt.",variant:"destructive"})}},w=t=>{switch(t){case"verified":return"bg-green-100 dark:bg-green-900 text-green-700 dark:text-green-400";case"paid":return"bg-blue-100 dark:bg-blue-900 text-blue-700 dark:text-blue-400";case"overdue":return"bg-red-100 dark:bg-red-900 text-red-700 dark:text-red-400";case"pending":default:return"bg-amber-100 dark:bg-amber-900 text-amber-700 dark:text-amber-400"}},D=t=>{switch(t){case"verified":case"paid":return e.jsx(y,{className:"w-4 h-4"});case"overdue":return e.jsx(N,{className:"w-4 h-4"});case"pending":default:return e.jsx(I,{className:"w-4 h-4"})}};if(b)return e.jsxs(e.Fragment,{children:[e.jsx(l,{}),e.jsx("div",{className:"min-h-screen flex items-center justify-center",children:e.jsx("div",{className:"text-muted-foreground",children:"Loading payment history..."})}),e.jsx(c,{})]});if(!u)return e.jsxs(e.Fragment,{children:[e.jsx(l,{}),e.jsx("div",{className:"min-h-screen bg-background py-12",children:e.jsx("div",{className:"container max-w-6xl mx-auto px-4",children:e.jsxs(d,{className:"p-8 text-center",children:[e.jsx(f,{className:"w-12 h-12 mx-auto text-muted-foreground mb-4"}),e.jsx("h2",{className:"text-lg font-semibold mb-2",children:"No Payment History Found"})]})})}),e.jsx(c,{})]});const{lease:h,payments:p,summary:a}=u;return e.jsxs(e.Fragment,{children:[e.jsx(l,{}),e.jsx("main",{className:"min-h-screen bg-background py-12",children:e.jsxs("div",{className:"container max-w-6xl mx-auto px-4",children:[e.jsxs("div",{className:"mb-8",children:[e.jsx("div",{className:"mb-4",children:e.jsx(j,{variant:"outline",onClick:()=>m("/landlord-lease-dashboard"),children:"← Back to Leases"})}),e.jsx("h1",{className:"text-3xl font-bold mb-2",children:"Payment History"}),e.jsxs("p",{className:"text-muted-foreground",children:[h.property.title," • ",h.property.address]})]}),e.jsxs("div",{className:"grid grid-cols-1 md:grid-cols-3 gap-4 mb-8",children:[e.jsxs(d,{className:"p-6",children:[e.jsxs("div",{className:"flex items-center justify-between",children:[e.jsxs("div",{children:[e.jsx("p",{className:"text-sm text-muted-foreground mb-1",children:"Total Verified"}),e.jsxs("p",{className:"text-2xl font-bold",children:["$",a.totalVerifiedAmount.toFixed(2)]})]}),e.jsx(y,{className:"w-8 h-8 text-green-500"})]}),e.jsxs("p",{className:"text-xs text-muted-foreground mt-2",children:[a.verified," payments"]})]}),e.jsxs(d,{className:"p-6",children:[e.jsxs("div",{className:"flex items-center justify-between",children:[e.jsxs("div",{children:[e.jsx("p",{className:"text-sm text-muted-foreground mb-1",children:"Outstanding"}),e.jsxs("p",{className:"text-2xl font-bold",children:["$",a.totalOutstandingAmount.toFixed(2)]})]}),e.jsx(N,{className:"w-8 h-8 text-amber-500"})]}),e.jsxs("p",{className:"text-xs text-muted-foreground mt-2",children:[a.pending+a.overdue," payments"]})]}),e.jsxs(d,{className:"p-6",children:[e.jsxs("div",{className:"flex items-center justify-between",children:[e.jsxs("div",{children:[e.jsx("p",{className:"text-sm text-muted-foreground mb-1",children:"Total Payments"}),e.jsx("p",{className:"text-2xl font-bold",children:a.totalPayments})]}),e.jsx(f,{className:"w-8 h-8 text-blue-500"})]}),e.jsx("p",{className:"text-xs text-muted-foreground mt-2",children:"All time"})]})]}),e.jsxs("div",{className:"space-y-3",children:[e.jsx("h2",{className:"text-xl font-bold mb-4",children:"All Payments"}),p.length===0?e.jsx(d,{className:"p-6 text-center",children:e.jsx("p",{className:"text-muted-foreground",children:"No payments recorded yet."})}):p.map(t=>e.jsx(d,{className:"p-4",children:e.jsxs("div",{className:"flex items-start justify-between gap-4",children:[e.jsxs("div",{className:"flex-1",children:[e.jsxs("div",{className:"flex items-center gap-2 mb-2",children:[e.jsx("h3",{className:"font-semibold",children:t.type==="rent"?"Monthly Rent":"Security Deposit"}),e.jsx(T,{className:w(t.status),children:e.jsxs("span",{className:"inline-flex items-center gap-1",children:[D(t.status),t.status.charAt(0).toUpperCase()+t.status.slice(1)]})})]}),e.jsxs("p",{className:"text-sm text-muted-foreground mb-1",children:["Due: ",i(new Date(t.due_date),"MMMM dd, yyyy")]}),e.jsxs("p",{className:"text-xs text-muted-foreground mb-1",children:["Ref: ",t.reference_id]}),t.verified_by_user&&e.jsxs("p",{className:"text-xs text-muted-foreground",children:["Verified by: ",t.verified_by_user.full_name]})]}),e.jsxs("div",{className:"text-right flex flex-col items-end gap-2",children:[e.jsxs("p",{className:"text-2xl font-bold",children:["$",t.amount.toFixed(2)]}),["verified","paid"].includes(t.status)&&e.jsxs(j,{size:"sm",variant:"outline",onClick:()=>v(t.id),className:"gap-1","data-testid":`button-download-receipt-${t.id}`,children:[e.jsx(F,{className:"w-3 h-3"}),"Receipt"]})]})]})},t.id))]})]})}),e.jsx(c,{})]})}export{Y as default};
