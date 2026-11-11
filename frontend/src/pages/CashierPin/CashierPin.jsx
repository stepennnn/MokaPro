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
        roleName="Kasir 01"
        roleSubtitle="Kasir · Cabang Utama Toko"
        roleLabel="Kasir"
        roleIcon={roleCashierIcon}
        roleIconAlt="Role Kasir"
        expectedPin="1234"
        destination="/cashier"
      />
    </div>
  );
}
