:5003/api/tasks:1   Failed to load resource: the server responded with a status of 500 (Internal Server Error)
hook.js:608  Failed to load tasks: Error: Failed to fetch tasks
    at ApiClient.handleErrorResponse (api.ts:437:19)
    at ApiClient.request (api.ts:269:21)
    at async TaskAssignmentPage.tsx:86:24
overrideMethod @ hook.js:608
:5003/api/tasks:1   Failed to load resource: the server responded with a status of 500 (Internal Server Error)
hook.js:608  Failed to load tasks: Error: Failed to fetch tasks
    at ApiClient.handleErrorResponse (api.ts:437:19)
    at ApiClient.request (api.ts:269:21)
    at async TaskAssignmentPage.
    :5003/api/tasks:1   Failed to load resource: the server responded with a status of 500 (Internal Server Error)
hook.js:608  Failed to load tasks: Error: Failed to fetch tasks
    at ApiClient.handleErrorResponse (api.ts:437:19)
    at ApiClient.request (api.ts:269:21)
    at async TaskAssignmentPage.tsx:86:24
overrideMethod @ hook.js:608
:5003/api/tasks:1   Failed to load resource: the server responded with a status of 500 (Internal Server Error)
hook.js:608  Failed to load tasks: Error: Failed to fetch tasks
    at ApiClient.handleErrorResponse (api.ts:437:19)
    at ApiClient.request (api.ts:269:21)
    at async TaskAssignmentPage.tsx:86:24
overrideMethod @ hook.js:608
api.ts:234   POST http://localhost:5003/api/tasks 400 (Bad Request)
request @ api.ts:234
createTask @ api.ts:699
handleCreateTask @ TaskAssignmentPage.tsx:165
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

🔍 notFoundHandler - Route not found: POST /api/recruitment/job-postings
🔍 notFoundHandler - Available routes should include /api/users/profile
::1 - - [23/Aug/2025:08:31:45 +0000] "POST /api/recruitment/job-postings HTTP/1.1" 404 75 "http://localhost:3000/" "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/139.0.0.0 Safari/537.36 Edg/139.0.0.0"

🔍 notFoundHandler - Route not found: POST /api/recruitment/job-postings
🔍 notFoundHandler - Available routes should include /api/users/profile
::1 - - [23/Aug/2025:08:31:45 +0000] "POST /api/recruitment/job-postings HTTP/1.1" 404 75 "http://localhost:3000/" "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/139.0.0.0 Safari/537.36 Edg/139.0.0.0"
api.ts:320 
 
 GET http://localhost:5003/api/users/profile 404 (Not Found)
ProfilePage.tsx:208 
 Error uploading avatar: Error: Route /users/profile/picture not found
    at ApiClient.handleErrorResponse (api.ts:593:21)
    at ApiClient.request (api.ts:355:21)
    at async handleAvatarUpload (ProfilePage.tsx:195:24)