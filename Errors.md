api.ts:234 
 
 GET http://localhost:5003/api/tasks/search 500 (Internal Server Error)
api.ts:234 
 
 GET http://localhost:5003/api/tasks/search 500 (Internal Server Error)
 http://localhost:3000/dashboard/settings?tab=locations
 api.ts:234   GET http://localhost:5003/api/tasks/search 500 (Internal Server Error)
request @ api.ts:234
getTasks @ api.ts:676
(anonymous) @ TaskProgressMonitor.tsx:78
(anonymous) @ TaskProgressMonitor.tsx:198
commitHookEffectListMount @ react-dom.development.js:23189
invokePassiveEffectMountInDEV @ react-dom.development.js:25193
invokeEffectsInDev @ react-dom.development.js:27390
commitDoubleInvokeEffectsInDEV @ react-dom.development.js:27369
flushPassiveEffectsImpl @ react-dom.development.js:27095
flushPassiveEffects @ react-dom.development.js:27023
(anonymous) @ react-dom.development.js:26808
workLoop @ scheduler.development.js:266
flushWork @ scheduler.development.js:239
performWorkUntilDeadline @ scheduler.development.js:533
SettingsPage.tsx:520  Uncaught TypeError: officeLocations.map is not a function
    at SettingsPage (SettingsPage.tsx:520:36)
    at renderWithHooks (react-dom.development.js:15486:18)
    at updateFunctionComponent (react-dom.development.js:19617:20)
    at beginWork (react-dom.development.js:21640:16)
    at HTMLUnknownElement.callCallback2 (react-dom.development.js:4164:14)
    at Object.invokeGuardedCallbackDev (react-dom.development.js:4213:16)
    at invokeGuardedCallback (react-dom.development.js:4277:31)
    at beginWork$1 (react-dom.development.js:27490:7)
    at performUnitOfWork (react-dom.development.js:26596:12)
    at workLoopSync (react-dom.development.js:26505:5)
SettingsPage @ SettingsPage.tsx:520
renderWithHooks @ react-dom.development.js:15486
updateFunctionComponent @ react-dom.development.js:19617
beginWork @ react-dom.development.js:21640
callCallback2 @ react-dom.development.js:4164
invokeGuardedCallbackDev @ react-dom.development.js:4213
invokeGuardedCallback @ react-dom.development.js:4277
beginWork$1 @ react-dom.development.js:27490
performUnitOfWork @ react-dom.development.js:26596
workLoopSync @ react-dom.development.js:26505
renderRootSync @ react-dom.development.js:26473
performConcurrentWorkOnRoot @ react-dom.development.js:25777
workLoop @ scheduler.development.js:266
flushWork @ scheduler.development.js:239
performWorkUntilDeadline @ scheduler.development.js:533
SettingsPage.tsx:520  Uncaught TypeError: officeLocations.map is not a function
    at SettingsPage (SettingsPage.tsx:520:36)
    at renderWithHooks (react-dom.development.js:15486:18)
    at updateFunctionComponent (react-dom.development.js:19617:20)
    at beginWork (react-dom.development.js:21640:16)
    at HTMLUnknownElement.callCallback2 (react-dom.development.js:4164:14)
    at Object.invokeGuardedCallbackDev (react-dom.development.js:4213:16)
    at invokeGuardedCallback (react-dom.development.js:4277:31)
    at beginWork$1 (react-dom.development.js:27490:7)
    at performUnitOfWork (react-dom.development.js:26596:12)
    at workLoopSync (react-dom.development.js:26505:5)
SettingsPage @ SettingsPage.tsx:520
renderWithHooks @ react-dom.development.js:15486
updateFunctionComponent @ react-dom.development.js:19617
beginWork @ react-dom.development.js:21640
callCallback2 @ react-dom.development.js:4164
invokeGuardedCallbackDev @ react-dom.development.js:4213
invokeGuardedCallback @ react-dom.development.js:4277
beginWork$1 @ react-dom.development.js:27490
performUnitOfWork @ react-dom.development.js:26596
workLoopSync @ react-dom.development.js:26505
renderRootSync @ react-dom.development.js:26473
recoverFromConcurrentError @ react-dom.development.js:25889
performConcurrentWorkOnRoot @ react-dom.development.js:25789
workLoop @ scheduler.development.js:266
flushWork @ scheduler.development.js:239
performWorkUntilDeadline @ scheduler.development.js:533
hook.js:608  The above error occurred in the <SettingsPage> component:

    at SettingsPage (http://localhost:3000/src/pages/admin/SettingsPage.tsx:43:26)
    at ProtectedRoute (http://localhost:3000/src/components/ProtectedRoute.tsx?t=1755917312888:22:3)
    at RenderedRoute (http://localhost:3000/node_modules/.vite/deps/react-router-dom.js?v=0ea51d51:4103:5)
    at Outlet (http://localhost:3000/node_modules/.vite/deps/react-router-dom.js?v=0ea51d51:4510:26)
    at div
    at main
    at div
    at div
    at div
    at Provider (http://localhost:3000/node_modules/.vite/deps/chunk-EDNB42JY.js?v=0ea51d51:40:15)
    at TooltipProvider (http://localhost:3000/node_modules/.vite/deps/@radix-ui_react-tooltip.js?v=0ea51d51:63:5)
    at http://localhost:3000/src/components/ui/sidebar.tsx:54:7
    at AdminLayout
    at ProtectedRoute (http://localhost:3000/src/components/ProtectedRoute.tsx?t=1755917312888:22:3)
    at RenderedRoute (http://localhost:3000/node_modules/.vite/deps/react-router-dom.js?v=0ea51d51:4103:5)
    at Routes (http://localhost:3000/node_modules/.vite/deps/react-router-dom.js?v=0ea51d51:4574:5)
    at div
    at Router (http://localhost:3000/node_modules/.vite/deps/react-router-dom.js?v=0ea51d51:4517:15)
    at BrowserRouter (http://localhost:3000/node_modules/.vite/deps/react-router-dom.js?v=0ea51d51:5266:5)
    at QueryClientProvider (http://localhost:3000/node_modules/.vite/deps/chunk-4ZK4LN6P.js?v=0ea51d51:2946:3)
    at App

Consider adding an error boundary to your tree to customize error handling behavior.
Visit https://reactjs.org/link/error-boundaries to learn more about error boundaries.
overrideMethod @ hook.js:608
logCapturedError @ react-dom.development.js:18704
update.callback @ react-dom.development.js:18737
callCallback @ react-dom.development.js:15036
commitUpdateQueue @ react-dom.development.js:15057
commitLayoutEffectOnFiber @ react-dom.development.js:23430
commitLayoutMountEffects_complete @ react-dom.development.js:24727
commitLayoutEffects_begin @ react-dom.development.js:24713
commitLayoutEffects @ react-dom.development.js:24651
commitRootImpl @ react-dom.development.js:26862
commitRoot @ react-dom.development.js:26721
finishConcurrentRender @ react-dom.development.js:25931
performConcurrentWorkOnRoot @ react-dom.development.js:25848
workLoop @ scheduler.development.js:266
flushWork @ scheduler.development.js:239
performWorkUntilDeadline @ scheduler.development.js:533
react-dom.development.js:26962  Uncaught TypeError: officeLocations.map is not a function
    at SettingsPage (SettingsPage.tsx:520:36)

    And again am still getting a dashboard switch despite logging in as admin

    The above error occurred in the <EmployeeTimeTrackingPage> component:

    at EmployeeTimeTrackingPage (http://localhost:3000/src/pages/employee/TimeTrackingPage.tsx:40:41)
    at RoleBasedTimeTracking (http://localhost:3000/src/components/RoleBasedTimeTracking.tsx?t=1755917312888:23:20)
    at RenderedRoute (http://localhost:3000/node_modules/.vite/deps/react-router-dom.js?v=0ea51d51:4103:5)
    at Outlet (http://localhost:3000/node_modules/.vite/deps/react-router-dom.js?v=0ea51d51:4510:26)
    at div
    at main
    at div
    at div
    at div
    at Provider (http://localhost:3000/node_modules/.vite/deps/chunk-EDNB42JY.js?v=0ea51d51:40:15)
    at TooltipProvider (http://localhost:3000/node_modules/.vite/deps/@radix-ui_react-tooltip.js?v=0ea51d51:63:5)
    at http://localhost:3000/src/components/ui/sidebar.tsx:54:7
    at AdminLayout
    at ProtectedRoute (http://localhost:3000/src/components/ProtectedRoute.tsx?t=1755917312888:22:3)
    at RenderedRoute (http://localhost:3000/node_modules/.vite/deps/react-router-dom.js?v=0ea51d51:4103:5)
    at Routes (http://localhost:3000/node_modules/.vite/deps/react-router-dom.js?v=0ea51d51:4574:5)
    at div
    at Router (http://localhost:3000/node_modules/.vite/deps/react-router-dom.js?v=0ea51d51:4517:15)
    at BrowserRouter (http://localhost:3000/node_modules/.vite/deps/react-router-dom.js?v=0ea51d51:5266:5)
    at QueryClientProvider (http://localhost:3000/node_modules/.vite/deps/chunk-4ZK4LN6P.js?v=0ea51d51:2946:3)
    at App

Consider adding an error boundary to your tree to customize error handling behavior.
Visit https://reactjs.org/link/error-boundaries to learn more about error boundaries.TimeTrackingPage.tsx:121 
 Uncaught ReferenceError: Cannot access 'loadTimeTrackingData' before initialization
    at EmployeeTimeTrackingPage (TimeTrackingPage.tsx:121:7)

    //image uploading is not working
    api.ts:234   POST http://localhost:5003/api/users/profile-picture 404 (Not Found)
request @ api.ts:234
uploadProfilePicture @ api.ts:823
handleAvatarUpload @ ProfilePage.tsx:195
callCallback2 @ react-dom.development.js:4164
invokeGuardedCallbackDev @ react-dom.development.js:4213
invokeGuardedCallback @ react-dom.development.js:4277
invokeGuardedCallbackAndCatchFirstError @ react-dom.development.js:4291
executeDispatch @ react-dom.development.js:9041
processDispatchQueueItemsInOrder @ react-dom.development.js:9073
processDispatchQueue @ react-dom.development.js:9086
dispatchEventsForPlugins @ react-dom.development.js:9097
(anonymous) @ react-dom.development.js:9288
batchedUpdates$1 @ react-dom.development.js:26179
batchedUpdates @ react-dom.development.js:3991
dispatchEventForPluginEventSystem @ react-dom.development.js:9287
dispatchEventWithEnableCapturePhaseSelectiveHydrationWithoutDiscreteEventReplay @ react-dom.development.js:6465
dispatchEvent @ react-dom.development.js:6457
dispatchDiscreteEvent @ react-dom.development.js:6430
ProfilePage.tsx:208  Error uploading avatar: Error: Route /users/profile-picture not found
    at ApiClient.handleErrorResponse (api.ts:430:21)
    at ApiClient.request (api.ts:269:21)
    at async handleAvatarUpload (ProfilePage.tsx:195:24)
    api.ts:234   GET http://localhost:5003/api/tasks/search 500 (Internal Server Error)
request @ api.ts:234
getTasks @ api.ts:676
(anonymous) @ TaskProgressMonitor.tsx:78
(anonymous) @ TaskProgressMonitor.tsx:198
commitHookEffectListMount @ react-dom.development.js:23189
invokePassiveEffectMountInDEV @ react-dom.development.js:25193
invokeEffectsInDev @ react-dom.development.js:27390
commitDoubleInvokeEffectsInDEV @ react-dom.development.js:27369
flushPassiveEffectsImpl @ react-dom.development.js:27095
flushPassiveEffects @ react-dom.development.js:27023
(anonymous) @ react-dom.development.js:26808
workLoop @ scheduler.development.js:266
flushWork @ scheduler.development.js:239
performWorkUntilDeadline @ scheduler.development.js:533
api.ts:234   POST http://localhost:5003/api/departments 500 (Internal Server Error)
request @ api.ts:234
createDepartment @ api.ts:948
handleCreateDepartment @ DepartmentsPage.tsx:165
callCallback2 @ react-dom.development.js:4164
invokeGuardedCallbackDev @ react-dom.development.js:4213
invokeGuardedCallback @ react-dom.development.js:4277
invokeGuardedCallbackAndCatchFirstError @ react-dom.development.js:4291
executeDispatch @ react-dom.development.js:9041
processDispatchQueueItemsInOrder @ react-dom.development.js:9073
processDispatchQueue @ react-dom.development.js:9086
dispatchEventsForPlugins @ react-dom.development.js:9097
(anonymous) @ react-dom.development.js:9288
batchedUpdates$1 @ react-dom.development.js:26179
batchedUpdates @ react-dom.development.js:3991
dispatchEventForPluginEventSystem @ react-dom.development.js:9287
dispatchEventWithEnableCapturePhaseSelectiveHydrationWithoutDiscreteEventReplay @ react-dom.development.js:6465
dispatchEvent @ react-dom.development.js:6457
dispatchDiscreteEvent @ react-dom.development.js:6430
DepartmentsPage.tsx:183  Error creating department: Error: Failed to create department
    at ApiClient.handleErrorResponse (api.ts:437:19)
    at ApiClient.request (api.ts:269:21)
    at async handleCreateDepartment (DepartmentsPage.tsx:165:24)

    api.ts:234 
 
 GET http://localhost:5003/api/tasks/search 500 (Internal Server Error)
TaskAssignmentPage.tsx:99 
 Failed to load tasks: Error: Failed to fetch task
    at ApiClient.handleErrorResponse (api.ts:437:19)
    at ApiClient.request (api.ts:269:21)
    at async TaskAssignmentPage.tsx:86:24
api.ts:234 
 
 GET http://localhost:5003/api/tasks/search 500 (Internal Server Error)
TaskAssignmentPage.tsx:99 
 Failed to lo
 TaskAssignmentPage.tsx:99 
 Failed to load tasks: ReferenceError: queryStrueryString is not defined
    at ApiClient.getTasks (api.ts:676:34)
    at TaskAssignmentPage.tsx:86:40
    at TaskAssignmentPage.tsx:123:5
api.ts:234 
 
 POST http://localhost:5003/api/tasks 400 (Bad Request)

 hook.js:608 
 The above error occurred in the <SelectItem> component:

    at http://localhost:3000/node_modules/.vite/deps/@radix-ui_react-select.js?v=0ea51d51:863:7
    at _c1 (http://localhost:3000/src/components/ui/select.tsx:195:12)
    at div
    at http://localhost:3000/node_modules/.vite/deps/chunk-5QK67XII.js?v=0ea51d51:43:13
    at http://localhost:3000/node_modules/.vite/deps/chunk-KDOOHB5X.js?v=0ea51d51:80:13
    at http://localhost:3000/node_modules/.vite/deps/chunk-KDOOHB5X.js?v=0ea51d51:56:13
    at http://localhost:3000/node_modules/.vite/deps/chunk-KSGPAJJX.js?v=0ea51d51:41:15
    at http://localhost:3000/node_modules/.vite/deps/@radix-ui_react-select.js?v=0ea51d51:774:13
    at div
    at http://localhost:3000/node_modules/.vite/deps/chunk-KDOOHB5X.js?v=0ea51d51:80:13
    at http://localhost:3000/node_modules/.vite/deps/chunk-KDOOHB5X.js?v=0ea51d51:56:13
    at http://localhost:3000/node_modules/.vite/deps/chunk-KSGPAJJX.js?v=0ea51d51:41:15
    at Provider (http://localhost:3000/node_modules/.vite/deps/chunk-EDNB42JY.js?v=0ea51d51:40:15)
    at http://localhost:3000/node_modules/.vite/deps/@radix-ui_react-select.js?v=0ea51d51:308:58
    at http://localhost:3000/node_modules/.vite/deps/chunk-KDOOHB5X.js?v=0ea51d51:80:13
    at http://localhost:3000/node_modules/.vite/deps/chunk-KDOOHB5X.js?v=0ea51d51:56:13
    at http://localhost:3000/node_modules/.vite/deps/chunk-5QK67XII.js?v=0ea51d51:43:13
    at http://localhost:3000/node_modules/.vite/deps/chunk-KUVJDTEX.js?v=0ea51d51:270:22
    at SelectPortal
    at _c7 (http://localhost:3000/src/components/ui/select.tsx:116:12)
    at Provider (http://l