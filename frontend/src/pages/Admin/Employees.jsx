import { useCallback, useEffect, useState } from 'react';
import { useAuth } from '../../auth/useAuth';
import DashboardNavbar from '../../components/DashboardNavbar/DashboardNavbar';
import { apiFetch } from '../../lib/api';
import './Employees.css';

const ROLE_OPTIONS = [
  { value: 'cashier', label: 'Kasir' },
  { value: 'barista', label: 'Barista' },
  { value: 'admin', label: 'Admin' },
];

const ROLE_LABELS = {
  admin: 'Admin',
  cashier: 'Kasir',
  barista: 'Barista',
};

export default function Employees() {
  const { user: currentUser } = useAuth();
  const [employees, setEmployees] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [feedback, setFeedback] = useState('');

  // Create employee form state
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [createForm, setCreateForm] = useState({
    name: '',
    email: '',
    role: 'cashier',
    pin: '',
    active: true,
  });
  const [creating, setCreating] = useState(false);

  // Edit employee inline state
  const [editingId, setEditingId] = useState(null);
  const [editForm, setEditForm] = useState({
    name: '',
    role: 'cashier',
    active: true,
  });
  const [savingEdit, setSavingEdit] = useState(false);
  const [togglingId, setTogglingId] = useState(null);

  // Reset PIN modal state
  const [pinModalEmployee, setPinModalEmployee] = useState(null);
  const [newPin, setNewPin] = useState('');
  const [confirmPin, setConfirmPin] = useState('');
  const [resettingPin, setResettingPin] = useState(false);
  const [pinError, setPinError] = useState('');

  const fetchEmployees = useCallback(async () => {
    const response = await apiFetch('/api/admin/users');
    const payload = await response.json();
    return Array.isArray(payload.data) ? payload.data : [];
  }, []);

  useEffect(() => {
    let cancelled = false;

    fetchEmployees()
      .then((data) => {
        if (!cancelled) {
          setEmployees(data);
          setError('');
        }
      })
      .catch((requestError) => {
        if (!cancelled) {
          setError(requestError.message || 'Gagal memuat daftar karyawan.');
        }
      })
      .finally(() => {
        if (!cancelled) {
          setLoading(false);
        }
      });

    return () => {
      cancelled = true;
    };
  }, [fetchEmployees]);

  const handleCreateEmployee = async (e) => {
    e.preventDefault();
    setError('');
    setFeedback('');

    if (!createForm.name.trim()) {
      setError('Nama karyawan wajib diisi.');
      return;
    }

    if (!/^\d{6}$/.test(createForm.pin)) {
      setError('PIN harus terdiri dari tepat 6 digit angka.');
      return;
    }

    setCreating(true);
    try {
      const response = await apiFetch('/api/admin/users', {
        method: 'POST',
        body: JSON.stringify({
          name: createForm.name.trim(),
          email: createForm.email.trim() || null,
          role: createForm.role,
          pin: createForm.pin,
          active: Boolean(createForm.active),
        }),
      });

      const payload = await response.json();
      const created = payload.data;

      setEmployees((prev) => [...prev, created].sort((a, b) => a.name.localeCompare(b.name)));
      setCreateForm({
        name: '',
        email: '',
        role: 'cashier',
        pin: '',
        active: true,
      });
      setShowCreateForm(false);
      setFeedback(`Akun karyawan "${created.name}" berhasil ditambahkan.`);
    } catch (requestError) {
      setError(requestError.message || 'Gagal menambahkan akun karyawan.');
    } finally {
      setCreating(false);
    }
  };

  const handleStartEdit = (emp) => {
    setError('');
    setFeedback('');
    setEditingId(emp.id);
    setEditForm({
      name: emp.name || '',
      role: emp.role || 'cashier',
      active: Boolean(emp.active),
    });
  };

  const handleSaveEdit = async () => {
    if (!editForm.name.trim()) {
      setError('Nama karyawan tidak boleh kosong.');
      return;
    }

    setSavingEdit(true);
    setError('');
    setFeedback('');

    try {
      const response = await apiFetch(`/api/admin/users/${editingId}`, {
        method: 'PATCH',
        body: JSON.stringify({
          name: editForm.name.trim(),
          role: editForm.role,
          active: Boolean(editForm.active),
        }),
      });

      const payload = await response.json();
      const updated = payload.data;

      setEmployees((prev) =>
        prev
          .map((emp) => (emp.id === editingId ? updated : emp))
          .sort((a, b) => a.name.localeCompare(b.name)),
      );
      setEditingId(null);
      setFeedback(`Data karyawan "${updated.name}" berhasil diperbarui.`);
    } catch (requestError) {
      setError(requestError.message || 'Gagal menyimpan perubahan karyawan.');
    } finally {
      setSavingEdit(false);
    }
  };

  const handleToggleActive = async (emp) => {
    setTogglingId(emp.id);
    setError('');
    setFeedback('');

    try {
      const response = await apiFetch(`/api/admin/users/${emp.id}`, {
        method: 'PATCH',
        body: JSON.stringify({ active: !emp.active }),
      });

      const payload = await response.json();
      const updated = payload.data;

      setEmployees((prev) => prev.map((item) => (item.id === emp.id ? updated : item)));
      setFeedback(
        updated.active
          ? `Akun "${updated.name}" berhasil diaktifkan.`
          : `Akun "${updated.name}" berhasil dinonaktifkan.`,
      );
    } catch (requestError) {
      setError(requestError.message || 'Gagal mengubah status akun karyawan.');
    } finally {
      setTogglingId(null);
    }
  };

  const handleOpenPinModal = (emp) => {
    setPinModalEmployee(emp);
    setNewPin('');
    setConfirmPin('');
    setPinError('');
  };

  const handleResetPin = async (e) => {
    e.preventDefault();
    if (!pinModalEmployee) return;

    if (!/^\d{6}$/.test(newPin)) {
      setPinError('PIN baru harus terdiri dari tepat 6 digit angka.');
      return;
    }

    if (newPin !== confirmPin) {
      setPinError('Konfirmasi PIN tidak cocok.');
      return;
    }

    setResettingPin(true);
    setPinError('');

    try {
      await apiFetch(`/api/admin/users/${pinModalEmployee.id}/pin`, {
        method: 'PATCH',
        body: JSON.stringify({ pin: newPin }),
      });

      setFeedback(`PIN untuk "${pinModalEmployee.name}" berhasil direset dan status lockout dibuka.`);
      setPinModalEmployee(null);
      setNewPin('');
      setConfirmPin('');
    } catch (requestError) {
      setPinError(requestError.message || 'Gagal mereset PIN karyawan.');
    } finally {
      setResettingPin(false);
    }
  };

  return (
    <div className="employees-page">
      <DashboardNavbar />
      <main className="employees-main">
        <div className="employees-header">
          <div>
            <h1 className="employees-title">Kelola Akun &amp; PIN Karyawan</h1>
            <p className="employees-subtitle">
              Tambah akun baru, atur peran operasional, aktif/nonaktifkan akses, dan reset PIN karyawan.
            </p>
          </div>
          <button
            type="button"
            className="emp-btn-primary"
            onClick={() => {
              setShowCreateForm((prev) => !prev);
              setError('');
              setFeedback('');
            }}
          >
            {showCreateForm ? 'Tutup Form' : '+ Tambah Karyawan'}
          </button>
        </div>

        {error && (
          <div role="alert" className="emp-banner emp-banner-error">
            {error}
          </div>
        )}

        {feedback && (
          <div role="status" className="emp-banner emp-banner-success">
            {feedback}
          </div>
        )}

        {showCreateForm && (
          <div className="employees-card" style={{ marginBottom: '20px' }}>
            <h3 style={{ marginTop: 0, marginBottom: '14px', color: '#261a15' }}>Tambah Karyawan Baru</h3>
            <form onSubmit={handleCreateEmployee} className="emp-create-grid">
              <div>
                <label className="emp-label" htmlFor="emp-name">Nama Karyawan</label>
                <input
                  id="emp-name"
                  type="text"
                  className="emp-input"
                  value={createForm.name}
                  onChange={(e) => setCreateForm({ ...createForm, name: e.target.value })}
                  placeholder="Contoh: Kasir 02"
                  required
                />
              </div>
              <div>
                <label className="emp-label" htmlFor="emp-email">Email (Opsional)</label>
                <input
                  id="emp-email"
                  type="email"
                  className="emp-input"
                  value={createForm.email}
                  onChange={(e) => setCreateForm({ ...createForm, email: e.target.value })}
                  placeholder="Otomatis dibuat jika kosong"
                />
              </div>
              <div>
                <label className="emp-label" htmlFor="emp-role">Peran (Role)</label>
                <select
                  id="emp-role"
                  className="emp-input"
                  value={createForm.role}
                  onChange={(e) => setCreateForm({ ...createForm, role: e.target.value })}
                >
                  {ROLE_OPTIONS.map((opt) => (
                    <option key={opt.value} value={opt.value}>{opt.label}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="emp-label" htmlFor="emp-pin">PIN (6 Digit Angka)</label>
                <input
                  id="emp-pin"
                  type="password"
                  inputMode="numeric"
                  maxLength={6}
                  className="emp-input"
                  value={createForm.pin}
                  onChange={(e) => setCreateForm({ ...createForm, pin: e.target.value.replace(/\D/g, '').slice(0, 6) })}
                  placeholder="6 angka"
                  required
                />
              </div>
              <div>
                <label className="emp-label" htmlFor="emp-active">Status</label>
                <select
                  id="emp-active"
                  className="emp-input"
                  value={createForm.active ? 'Aktif' : 'Nonaktif'}
                  onChange={(e) => setCreateForm({ ...createForm, active: e.target.value === 'Aktif' })}
                >
                  <option value="Aktif">Aktif</option>
                  <option value="Nonaktif">Nonaktif</option>
                </select>
              </div>
              <div>
                <button type="submit" className="emp-btn-save" disabled={creating} style={{ width: '100%' }}>
                  {creating ? 'Menyimpan...' : 'Simpan Karyawan'}
                </button>
              </div>
            </form>
          </div>
        )}

        <div className="employees-card">
          {loading ? (
            <p role="status" style={{ padding: '24px', textAlign: 'center', color: '#7a6d64' }}>
              Memuat daftar karyawan...
            </p>
          ) : employees.length === 0 ? (
            <p style={{ padding: '24px', textAlign: 'center', color: '#7a6d64' }}>
              Belum ada akun karyawan terdaftar.
            </p>
          ) : (
            <table className="employees-table">
              <thead>
                <tr>
                  <th>Karyawan</th>
                  <th>Role</th>
                  <th>Status</th>
                  <th>Aksi</th>
                </tr>
              </thead>
              <tbody>
                {employees.map((emp) => {
                  const isSelf = currentUser?.id === emp.id;

                  return (
                    <tr key={emp.id}>
                      {editingId === emp.id ? (
                        <>
                          <td>
                            <input
                              type="text"
                              className="emp-input"
                              value={editForm.name}
                              onChange={(e) => setEditForm({ ...editForm, name: e.target.value })}
                            />
                          </td>
                          <td>
                            <select
                              className="emp-input"
                              value={editForm.role}
                              disabled={isSelf}
                              onChange={(e) => setEditForm({ ...editForm, role: e.target.value })}
                            >
                              {ROLE_OPTIONS.map((opt) => (
                                <option key={opt.value} value={opt.value}>{opt.label}</option>
                              ))}
                            </select>
                          </td>
                          <td>
                            <select
                              className="emp-input"
                              value={editForm.active ? 'Aktif' : 'Nonaktif'}
                              disabled={isSelf}
                              onChange={(e) => setEditForm({ ...editForm, active: e.target.value === 'Aktif' })}
                            >
                              <option value="Aktif">Aktif</option>
                              <option value="Nonaktif">Nonaktif</option>
                            </select>
                          </td>
                          <td>
                            <div className="emp-actions-row">
                              <button
                                type="button"
                                className="emp-btn-save"
                                disabled={savingEdit}
                                onClick={handleSaveEdit}
                              >
                                {savingEdit ? 'Menyimpan...' : 'Simpan'}
                              </button>
                              <button
                                type="button"
                                className="emp-btn-danger"
                                disabled={savingEdit}
                                onClick={() => setEditingId(null)}
                              >
                                Batal
                              </button>
                            </div>
                          </td>
                        </>
                      ) : (
                        <>
                          <td>
                            <strong>{emp.name}</strong>
                            {isSelf && <span className="emp-self-tag">Anda</span>}
                            <div className="emp-email-sub">{emp.email}</div>
                          </td>
                          <td>
                            <span className={`emp-role-badge role-${emp.role || 'cashier'}`}>
                              {ROLE_LABELS[emp.role] || emp.role || '-'}
                            </span>
                          </td>
                          <td>
                            <span className={`emp-status-badge ${emp.active ? 'active' : 'inactive'}`}>
                              {emp.active ? 'Aktif' : 'Nonaktif'}
                            </span>
                          </td>
                          <td>
                            <div className="emp-actions-row">
                              <button
                                type="button"
                                className="emp-btn-dark"
                                onClick={() => handleStartEdit(emp)}
                              >
                                Edit
                              </button>
                              <button
                                type="button"
                                className="emp-btn-secondary"
                                disabled={isSelf || togglingId === emp.id}
                                title={isSelf ? 'Tidak dapat menonaktifkan akun sendiri' : ''}
                                onClick={() => handleToggleActive(emp)}
                              >
                                {togglingId === emp.id
                                  ? '...'
                                  : (emp.active ? 'Nonaktifkan' : 'Aktifkan')}
                              </button>
                              <button
                                type="button"
                                className="emp-btn-secondary"
                                onClick={() => handleOpenPinModal(emp)}
                              >
                                Reset PIN
                              </button>
                            </div>
                          </td>
                        </>
                      )}
                    </tr>
                  );
                })}
              </tbody>
            </table>
          )}
        </div>
      </main>

      {pinModalEmployee && (
        <div
          className="emp-modal-overlay"
          onClick={() => !resettingPin && setPinModalEmployee(null)}
          role="dialog"
          aria-modal="true"
        >
          <div className="emp-modal-card" onClick={(e) => e.stopPropagation()}>
            <div className="emp-modal-header">
              <div>
                <h2 style={{ margin: 0, fontSize: '18px', color: '#261a15' }}>
                  Reset PIN: {pinModalEmployee.name}
                </h2>
                <p style={{ margin: '4px 0 0', fontSize: '12px', color: '#7a6d64' }}>
                  PIN baru (6 digit angka) akan langsung aktif dan membuka lockout login jika terkunci.
                </p>
              </div>
              <button
                type="button"
                className="emp-modal-close"
                disabled={resettingPin}
                onClick={() => setPinModalEmployee(null)}
              >
                ×
              </button>
            </div>

            <form onSubmit={handleResetPin} style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              <div>
                <label className="emp-label" htmlFor="reset-pin-input">PIN Baru (6 Digit Angka)</label>
                <input
                  id="reset-pin-input"
                  type="password"
                  inputMode="numeric"
                  maxLength={6}
                  className="emp-input"
                  value={newPin}
                  onChange={(e) => setNewPin(e.target.value.replace(/\D/g, '').slice(0, 6))}
                  placeholder="Masukkan 6 digit angka"
                  required
                  autoFocus
                />
              </div>
              <div>
                <label className="emp-label" htmlFor="confirm-pin-input">Konfirmasi PIN Baru</label>
                <input
                  id="confirm-pin-input"
                  type="password"
                  inputMode="numeric"
                  maxLength={6}
                  className="emp-input"
                  value={confirmPin}
                  onChange={(e) => setConfirmPin(e.target.value.replace(/\D/g, '').slice(0, 6))}
                  placeholder="Ulangi 6 digit angka"
                  required
                />
              </div>

              {pinError && (
                <p role="alert" style={{ margin: 0, color: '#b91c1c', fontSize: '13px' }}>
                  {pinError}
                </p>
              )}

              <div className="emp-actions-row" style={{ justifyContent: 'flex-end', marginTop: '6px' }}>
                <button
                  type="button"
                  className="emp-btn-danger"
                  disabled={resettingPin}
                  onClick={() => setPinModalEmployee(null)}
                >
                  Batal
                </button>
                <button type="submit" className="emp-btn-save" disabled={resettingPin}>
                  {resettingPin ? 'Menyimpan...' : 'Simpan PIN Baru'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
