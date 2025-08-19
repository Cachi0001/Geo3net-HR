Compiled with problems:
×
ERROR in src/components/dashboard/SuperAdminDashboard.tsx:66:72
TS2554: Expected 0-3 arguments, but got 5.
    64 |       try {
    65 |         setHiresLoading(true);
  > 66 |         const hiresData = await employeeService.getEmployees(5, 0, '', 'createdAt', 'desc');
       |                                                                        ^^^^^^^^^^^^^^^^^^^
    67 |         setRecentHires(hiresData.employees || []);
    68 |       } catch (error) {
    69 |         console.error('Failed to load recent hires', error);
ERROR in src/components/dashboard/SuperAdminDashboard.tsx:240:20
TS2322: Type '({ title: string; value: string; icon: ForwardRefExoticComponent<Omit<LucideProps, "ref"> & RefAttributes<SVGSVGElement>>; color: string; change?: undefined; } | { ...; })[]' is not assignable to type 'DashboardStats[]'.
  Type '{ title: string; value: string; icon: ForwardRefExoticComponent<Omit<LucideProps, "ref"> & RefAttributes<SVGSVGElement>>; color: string; change?: undefined; } | { ...; }' is not assignable to type 'DashboardStats'.
    Type '{ title: string; value: string; icon: React.ForwardRefExoticComponent<Omit<LucideProps, "ref"> & React.RefAttributes<SVGSVGElement>>; color: string; change?: undefined; }' is not assignable to type 'DashboardStats'.
      Types of property 'color' are incompatible.
        Type 'string' is not assignable to type 'ColorVariant | undefined'.
    238 |       {/* Stats Grid */}
    239 |       <div className={styles.statsGrid}>
  > 240 |         <StatsGrid stats={dashboardStats} />
        |                    ^^^^^
    241 |       </div>
    242 |
    243 |       {/* Charts */}
ERROR in src/components/dashboard/SuperAdminDashboard.tsx:273:17
TS2322: Type '({ key: string; title: string; dataIndex: string; sortable: boolean; render?: undefined; } | { key: string; title: string; dataIndex: string; sortable?: undefined; render?: undefined; } | { key: string; title: string; dataIndex: string; render: (value: string) => Element; sortable?: undefined; })[]' is not assignable to type 'TableColumn<Employee>[]'.
  Type '{ key: string; title: string; dataIndex: string; sortable: boolean; render?: undefined; } | { key: string; title: string; dataIndex: string; sortable?: undefined; render?: undefined; } | { key: string; title: string; dataIndex: string; render: (value: string) => Element; sortable?: undefined; }' is not assignable to type 'TableColumn<Employee>'.
    Type '{ key: string; title: string; dataIndex: string; sortable: boolean; render?: undefined; }' is not assignable to type 'TableColumn<Employee>'.
      Types of property 'dataIndex' are incompatible.
        Type 'string' is not assignable to type 'keyof Employee | undefined'.
    271 |             ) : (
    272 |               <Table 
  > 273 |                 columns={columns}
        |                 ^^^^^^^
    274 |                 data={employees}
    275 |                 loading={employeesLoading}
    276 |               />
ERROR in src/pages/admin/SuperAdminDashboard.tsx:7:87
TS2307: Cannot find module '@/components/ui/card' or its corresponding type declarations.
     5 |   AlertTriangle, Clock, UserPlus, Settings, Shield, Activity
     6 | } from 'lucide-react';
  >  7 | import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
       |                                                                                       ^^^^^^^^^^^^^^^^^^^^^^
     8 | import { Button } from '@/components/ui/button';
     9 | import { Input } from '@/components/ui/input';
    10 | import { Badge } from '@/components/ui/badge';
ERROR in src/pages/admin/SuperAdminDashboard.tsx:8:24
TS2307: Cannot find module '@/components/ui/button' or its corresponding type declarations.
     6 | } from 'lucide-react';
     7 | import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
  >  8 | import { Button } from '@/components/ui/button';
       |                        ^^^^^^^^^^^^^^^^^^^^^^^^
     9 | import { Input } from '@/components/ui/input';
    10 | import { Badge } from '@/components/ui/badge';
    11 | import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
ERROR in src/pages/admin/SuperAdminDashboard.tsx:9:23
TS2307: Cannot find module '@/components/ui/input' or its corresponding type declarations.
     7 | import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
     8 | import { Button } from '@/components/ui/button';
  >  9 | import { Input } from '@/components/ui/input';
       |                       ^^^^^^^^^^^^^^^^^^^^^^^
    10 | import { Badge } from '@/components/ui/badge';
    11 | import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
    12 | import { Progress } from '@/components/ui/progress';
ERROR in src/pages/admin/SuperAdminDashboard.tsx:10:23
TS2307: Cannot find module '@/components/ui/badge' or its corresponding type declarations.
     8 | import { Button } from '@/components/ui/button';
     9 | import { Input } from '@/components/ui/input';
  > 10 | import { Badge } from '@/components/ui/badge';
       |                       ^^^^^^^^^^^^^^^^^^^^^^^
    11 | import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
    12 | import { Progress } from '@/components/ui/progress';
    13 | import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
ERROR in src/pages/admin/SuperAdminDashboard.tsx:11:53
TS2307: Cannot find module '@/components/ui/avatar' or its corresponding type declarations.
     9 | import { Input } from '@/components/ui/input';
    10 | import { Badge } from '@/components/ui/badge';
  > 11 | import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
       |                                                     ^^^^^^^^^^^^^^^^^^^^^^^^
    12 | import { Progress } from '@/components/ui/progress';
    13 | import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
    14 | import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
ERROR in src/pages/admin/SuperAdminDashboard.tsx:12:26
TS2307: Cannot find module '@/components/ui/progress' or its corresponding type declarations.
    10 | import { Badge } from '@/components/ui/badge';
    11 | import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
  > 12 | import { Progress } from '@/components/ui/progress';
       |                          ^^^^^^^^^^^^^^^^^^^^^^^^^^
    13 | import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
    14 | import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
    15 | import { Skeleton } from '@/components/ui/skeleton';
ERROR in src/pages/admin/SuperAdminDashboard.tsx:13:58
TS2307: Cannot find module '@/components/ui/tabs' or its corresponding type declarations.
    11 | import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
    12 | import { Progress } from '@/components/ui/progress';
  > 13 | import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
       |                                                          ^^^^^^^^^^^^^^^^^^^^^^
    14 | import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
    15 | import { Skeleton } from '@/components/ui/skeleton';
    16 | import styles from './SuperAdminDashboard.module.css';
ERROR in src/pages/admin/SuperAdminDashboard.tsx:14:79
TS2307: Cannot find module '@/components/ui/table' or its corresponding type declarations.
    12 | import { Progress } from '@/components/ui/progress';
    13 | import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
  > 14 | import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
       |                                                                               ^^^^^^^^^^^^^^^^^^^^^^^
    15 | import { Skeleton } from '@/components/ui/skeleton';
    16 | import styles from './SuperAdminDashboard.module.css';
    17 |
ERROR in src/pages/admin/SuperAdminDashboard.tsx:15:26
TS2307: Cannot find module '@/components/ui/skeleton' or its corresponding type declarations.
    13 | import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
    14 | import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
  > 15 | import { Skeleton } from '@/components/ui/skeleton';
       |                          ^^^^^^^^^^^^^^^^^^^^^^^^^^
    16 | import styles from './SuperAdminDashboard.module.css';
    17 |
    18 | export const SuperAdminDashboard: React.FC = () => {