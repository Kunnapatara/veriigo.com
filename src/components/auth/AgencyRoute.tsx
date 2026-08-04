import React from 'react';
import { ProtectedRoute } from './ProtectedRoute';

export const AgencyRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  return (
    <ProtectedRoute
      allowedRoles={['AGENCY', 'ADMIN']}
      title="ศูนย์จัดการข้อมูลสำหรับหน่วยงานราชการ (Agency Portal)"
      description="เข้าถึงระบบจัดการประกาศรับสมัครงาน แหล่งสืบค้นข้อมูล และการจัดการผู้สมัคร"
    >
      {children}
    </ProtectedRoute>
  );
};
