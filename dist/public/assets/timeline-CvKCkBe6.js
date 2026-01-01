import{j as e}from"./ui-DbSH5uIw.js";import{ab as n,o as i,q as x}from"./index-I4B5onZV.js";function u({steps:d,vertical:c=!0}){return c?e.jsx("div",{className:"relative",children:d.map((r,l)=>{const a=r.status==="completed",s=r.status==="current",t=r.status==="failed";return e.jsxs("div",{className:"flex gap-4 pb-8",children:[e.jsxs("div",{className:"relative flex flex-col items-center",children:[e.jsxs("div",{className:`
                  w-10 h-10 rounded-full flex items-center justify-center z-10
                  ${a?"bg-green-100 dark:bg-green-900":""}
                  ${s?"bg-blue-100 dark:bg-blue-900 ring-2 ring-blue-400 dark:ring-blue-500":""}
                  ${t?"bg-red-100 dark:bg-red-900":""}
                  ${!a&&!s&&!t?"bg-gray-200 dark:bg-gray-700":""}
                `,children:[a&&e.jsx(n,{className:"w-5 h-5 text-green-600 dark:text-green-400"}),s&&e.jsx(i,{className:"w-5 h-5 text-blue-600 dark:text-blue-400"}),t&&e.jsx(x,{className:"w-5 h-5 text-red-600 dark:text-red-400"}),!a&&!s&&!t&&e.jsx("div",{className:"w-2 h-2 bg-gray-400 dark:bg-gray-500 rounded-full"})]}),l<d.length-1&&e.jsx("div",{className:`
                    w-1 h-12 mt-2
                    ${a?"bg-green-200 dark:bg-green-800":"bg-gray-200 dark:bg-gray-700"}
                  `})]}),e.jsxs("div",{className:"flex-1 pt-1",children:[e.jsx("h3",{className:`
                  font-medium text-sm
                  ${t?"text-red-600 dark:text-red-400":"text-foreground"}
                `,children:r.label}),r.description&&e.jsx("p",{className:"text-xs text-muted-foreground mt-1",children:r.description}),r.date&&e.jsx("p",{className:"text-xs text-muted-foreground mt-1",children:new Date(r.date).toLocaleDateString("en-US",{month:"short",day:"numeric",year:"numeric"})})]})]},r.id)})}):e.jsx("div",{className:"flex gap-4 overflow-x-auto pb-4",children:d.map((r,l)=>{const a=r.status==="completed",s=r.status==="current",t=r.status==="failed";return e.jsxs("div",{className:"flex flex-col items-center min-w-max",children:[e.jsxs("div",{className:`
              w-10 h-10 rounded-full flex items-center justify-center mb-2
              ${a?"bg-green-100 dark:bg-green-900":""}
              ${s?"bg-blue-100 dark:bg-blue-900 ring-2 ring-blue-400 dark:ring-blue-500":""}
              ${t?"bg-red-100 dark:bg-red-900":""}
              ${!a&&!s&&!t?"bg-gray-200 dark:bg-gray-700":""}
            `,children:[a&&e.jsx(n,{className:"w-5 h-5 text-green-600 dark:text-green-400"}),s&&e.jsx(i,{className:"w-5 h-5 text-blue-600 dark:text-blue-400"}),t&&e.jsx(x,{className:"w-5 h-5 text-red-600 dark:text-red-400"}),!a&&!s&&!t&&e.jsx("div",{className:"w-2 h-2 bg-gray-400 dark:bg-gray-500 rounded-full"})]}),e.jsx("p",{className:"text-xs font-medium text-center max-w-[120px] leading-tight",children:r.label})]},r.id)})})}export{u as T};
