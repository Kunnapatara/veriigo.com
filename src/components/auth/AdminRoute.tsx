import React from 'react';
import { ProtectedRoute } from './ProtectedRoute';

export const AdminRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  return (
    <ProtectedRoute
      allowedRoles={['ADMIN']}
      title="ส่วนการบริหารจัดการระบบสำหรับผู้ดูแลระบบ (Admin Only)"
      description="ระบบการจัดการฐานข้อมูล Crawling, Audit Logs และการกำหนดสิทธิ์ผู้ใช้งาน"
    >
      {children}
    </ProtectedRoute>
  );
};
