You can now view go3net-hr-frontend in the browser.

  Local:            http://localhost:3000
  On Your Network:  http://192.168.1.38:3000

Note that the development build is not optimized.
To create a production build, use npm run build.

webpack compiled successfully
ERROR in src/components/auth/LoginForm/LoginForm.tsx:26:18
TS2339: Property 'loginWithGoogle' does not exist on type 'AuthContextType'.
    24 |   const [isLoading, setIsLoading] = useState(false)
    25 |
  > 26 |   const { login, loginWithGoogle } = useAuth()
       |                  ^^^^^^^^^^^^^^^
    27 |   const { showToast } = useToast()
    28 |
    29 |   const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {

ERROR in src/components/auth/LoginForm/LoginForm.tsx:68:13
TS2554: Expected 3 arguments, but got 2.
    66 |
    67 |     try {
  > 68 |       await login(formData.email, formData.password)
       |             ^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^
    69 |       showToast('success', 'Login successful!')
    70 |       onSuccess?.()
    71 |     } catch (error: any) {

ERROR in src/components/auth/RegisterForm/RegisterForm.tsx:34:21
TS2339: Property 'loginWithGoogle' does not exist on type 'AuthContextType'.
    32 |   const [isLoading, setIsLoading] = useState(false)
    33 |
  > 34 |   const { register, loginWithGoogle } = useAuth()
       |                     ^^^^^^^^^^^^^^^
    35 |   const { showToast } = useToast()
Compiled successfully!

You can now view go3net-hr-frontend in the browser.

  Local:            http://localhost:3000
  On Your Network:  http://192.168.1.38:3000

Note that the development build is not optimized.
To create a production build, use npm run build.

webpack compiled successfully
ERROR in src/components/auth/LoginForm/LoginForm.tsx:26:18
TS2339: Property 'loginWithGoogle' does not exist on type 'AuthContextType'.
    24 |   const [isLoading, setIsLoading] = useState(false)
    25 |
  > 26 |   const { login, loginWithGoogle } = useAuth()
       |                  ^^^^^^^^^^^^^^^
    27 |   const { showToast } = useToast()
    28 |
    29 |   const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {

ERROR in src/components/auth/LoginForm/LoginForm.tsx:68:13
TS2554: Expected 3 arguments, but got 2.
    66 |
    67 |     try {
  > 68 |       await login(formData.email, formData.password)
       |             ^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^
    69 |       showToast('success', 'Login successful!')
Compiled successfully!

You can now view go3net-hr-frontend in the browser.

  Local:            http://localhost:3000
  On Your Network:  http://192.168.1.38:3000

Note that the development build is not optimized.
To create a production build, use npm run build.

webpack compiled successfully
Files successfully emitted, waiting for typecheck results...
Issues checking in progress...
ERROR in src/components/auth/LoginForm/LoginForm.tsx:68:13
TS2554: Expected 3 arguments, but got 2.
    66 |
    67 |     try {
  > 68 |       await login(formData.email, formData.password)
       |             ^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^
    69 |       showToast('success', 'Login successful!')
    70 |       onSuccess?.()
    71 |     } catch (error: any) {

ERROR in src/components/auth/LoginForm/LoginForm.tsx:83:15
TS2304: Cannot find name 'loginWithGoogle'.
    81 |     try {
    82 |       await startGoogleOneTap(async (credential) => {
  > 83 |         await loginWithGoogle(credential)
       |               ^^^^^^^^^^^^^^^
    84 |       })
Compiled successfully!

You can now view go3net-hr-frontend in the browser.

  Local:            http://localhost:3000
  On Your Network:  http://192.168.1.38:3000

Note that the development build is not optimized.
To create a production build, use npm run build.

webpack compiled successfully
ERROR in src/components/auth/LoginForm/LoginForm.tsx:14:7
TS2322: Type '({ onSuccess, onForgotPassword, onRegister, }: LoginFormProps) => void' is not assignable to type 'FC<LoginFormProps>'.
  Type 'void' is not assignable to type 'ReactElement<any, any> | null'.
    12 | }
    13 |
  > 14 | const LoginForm: React.FC<LoginFormProps> = ({
       |       ^^^^^^^^^
    15 |   onSuccess,
    16 |   onForgotPassword,
    17 |   onRegister,

ERROR in src/components/auth/LoginForm/LoginForm.tsx:68:13
TS2554: Expected 3 arguments, but got 2.
    66 |
    67 |     try {
  > 68 |       await login(formData.email, formData.password)
       |             ^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^
    69 |       showToast('success', 'Login successful!')
    70 |       onSuccess?.()
    71 |     } catch (error: any) {

ERROR in src/components/auth/LoginForm/LoginForm.tsx:208:1
TS1128: Declaration or statement expected.
    206 |     </Card>
    207 |   )
  > 208 | }
        | ^
Compiled successfully!

You can now view go3net-hr-frontend in the browser.

  Local:            http://localhost:3000
  On Your Network:  http://192.168.1.38:3000

Note that the development build is not optimized.
To create a production build, use npm run build.

webpack compiled successfully
Files successfully emitted, waiting for typecheck results...
Issues checking in progress...
ERROR in src/components/auth/LoginForm/LoginForm.tsx:26:18
TS2339: Property 'loginWithGoogle' does not exist on type 'AuthContextType'.
    24 |   const [isLoading, setIsLoading] = useState(false)
    25 |
  > 26 |   const { login, loginWithGoogle } = useAuth()
       |                  ^^^^^^^^^^^^^^^
    27 |   const { showToast } = useToast()
    28 |
    29 |   const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {

ERROR in src/components/auth/LoginForm/LoginForm.tsx:68:13
TS2554: Expected 3 arguments, but got 2.
    66 |
    67 |     try {
  > 68 |       await login(formData.email, formData.password)
       |             ^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^
    69 |       showToast('success', 'Login successful!')
    70 |       onSuccess?.()
    71 |     } catch (error: any) {

ERROR in src/components/auth/RegisterForm/RegisterForm.tsx:34:21
TS2339: Property 'loginWithGoogle' does not exist on type 'AuthContextType'.
    32 |   const [isLoading, setIsLoading] = useState(false)
    33 |
  > 34 |   const { register, loginWithGoogle } = useAuth()
       |                     ^^^^^^^^^^^^^^^
    35 |   const { showToast } = useToast()