'use client';
import { useEffect, useState, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';

function ResetPasswordForm() {
  const searchParams = useSearchParams();
  const token = searchParams.get('token');

  const [valid, setValid] = useState<boolean | null>(null);
  const [pwd, setPwd] = useState('');
  const [msg, setMsg] = useState<string | null>(null);

  useEffect(() => {
    if (!token) { setValid(false); return; }
    fetch(`/api/auth/reset/verify?token=${encodeURIComponent(token)}`)
      .then(r => r.json())
      .then(j => setValid(!!j.valid))
      .catch(() => setValid(false));
  }, [token]);

  async function submit() {
    setMsg(null);
    const r = await fetch('/api/auth/reset/confirm', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ token, newPassword: pwd }),
    });
    if (r.ok) setMsg('Đổi mật khẩu thành công, bạn có thể đăng nhập lại.');
    else {
      const { error } = await r.json().catch(() => ({}));
      setMsg(error || 'Không đặt lại được mật khẩu');
    }
  }

  if (valid === null) return <div className="p-6 text-white">Đang kiểm tra token…</div>;
  if (!valid) return <div className="p-6 text-white">Link không hợp lệ hoặc đã hết hạn.</div>;

  return (
    <div className="p-6 max-w-md mx-auto text-white">
      <h1 className="text-2xl font-bold mb-4">Đặt lại mật khẩu</h1>
      <input
        type="password"
        value={pwd}
        onChange={(e) => setPwd(e.target.value)}
        placeholder="Mật khẩu mới"
        className="w-full rounded-lg bg-white/10 px-4 py-3 mb-3"
      />
      <button
        onClick={submit}
        disabled={!pwd || pwd.length < 6}
        className="rounded-lg bg-blue-600 px-4 py-2 font-bold"
      >
        Xác nhận
      </button>
      {msg && <div className="mt-3 text-blue-200">{msg}</div>}
    </div>
  );
}

export default function ResetPasswordPage() {
  return (
    <Suspense fallback={<div className="p-6 text-white">Đang tải...</div>}>
      <ResetPasswordForm />
    </Suspense>
  );
}
