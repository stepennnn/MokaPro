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
        roleName="Barista 01"
        roleSubtitle="Barista / Dapur · Cabang Utama Toko"
        roleLabel="Barista / Dapur"
        roleIcon={roleBaristaIcon}
        roleIconAlt="Role Barista"
        expectedPin="2345"
        destination="/kds"
      />
    </div>
  );
}
