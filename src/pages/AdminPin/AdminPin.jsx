import PinLogin from '../../components/PinLogin/PinLogin';
import roleAdminIcon from '../../assets/role-admin.png';
import './AdminPin.css';

/**
 * AdminPin Page Component
 * Route: /admin/pin
 * Input PIN untuk akun Pengelola 01
 */
export default function AdminPin() {
  return (
    <div className="admin-pin-page">
      <PinLogin
        roleName="Pengelola 01"
        roleSubtitle="Admin / Pengelola · Cabang Utama Toko"
        roleLabel="Admin / Pengelola"
        roleIcon={roleAdminIcon}
        roleIconAlt="Role Admin / Pengelola"
        expectedPin="3456"
        destination="/admin"
      />
    </div>
  );
}
