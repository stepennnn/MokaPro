import PinLogin from '../../components/PinLogin/PinLogin';
import roleCashierIcon from '../../assets/role-cashier.png';
import './CashierPin.css';

/**
 * CashierPin Page Component
 * Route: /cashier/pin
 * Input PIN untuk akun Kasir 01
 */
export default function CashierPin() {
  return (
    <div className="cashier-pin-page">
      <PinLogin
        roleName="Kasir"
        roleSubtitle="Kasir · Cabang Utama Toko"
        roleCode="cashier"
        roleIcon={roleCashierIcon}
        roleIconAlt="Role Kasir"
        destination="/cashier"
      />
    </div>
  );
}
