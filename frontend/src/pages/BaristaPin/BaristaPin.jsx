import PinLogin from '../../components/PinLogin/PinLogin';
import roleBaristaIcon from '../../assets/role-barista.png';
import './BaristaPin.css';

/**
 * BaristaPin Page Component
 * Route: /barista/pin
 * Input PIN untuk akun Barista 01
 */
export default function BaristaPin() {
  return (
    <div className="barista-pin-page">
      <PinLogin
        roleName="Barista"
        roleSubtitle="Barista / Dapur · Cabang Utama Toko"
        roleCode="barista"
        roleIcon={roleBaristaIcon}
        roleIconAlt="Role Barista"
        destination="/kds"
      />
    </div>
  );
}
