import { useState } from "react";
import MarketingLayout from "./MarketingLayout";

const EMAIL = import.meta.env.VITE_CONTACT_EMAIL ?? "";

export default function Contact() {
  const [form, setForm] = useState({ name: "", email: "", gym: "", subject: "", message: "" });
  const [errors, setErrors] = useState({});
  const [sent, setSent] = useState(false);

  const set = (k) => (e) => setForm({ ...form, [k]: e.target.value });

  const submit = (e) => {
    e.preventDefault();
    const errs = {};
    if (!form.name.trim()) errs.name = "Name is required";
    if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(form.email)) errs.email = "Valid email is required";
    if (!form.gym.trim()) errs.gym = "Gym name is required";
    if (!form.subject.trim()) errs.subject = "Subject is required";
    if (!form.message.trim() || form.message.trim().length < 10) errs.message = "Message must be at least 10 characters";
    setErrors(errs);
    if (Object.keys(errs).length) return;
    if (EMAIL) {
      const body = encodeURIComponent(`${form.message}\n\n— ${form.name}, ${form.gym} (${form.email})`);
      window.location.href = `mailto:${EMAIL}?subject=${encodeURIComponent(form.subject)}&body=${body}`;
      setSent(true);
    }
  };

  const field = "mt-1 w-full rounded-xl border border-slate-300 bg-white px-3 py-2.5 text-sm focus:border-brand-600 focus:outline-none focus:ring-2 focus:ring-brand-600/20";

  return (
    <MarketingLayout>
      <section className="bg-ink-900 text-white">
        <div className="mx-auto max-w-6xl px-4 py-16 sm:px-6">
          <h1 className="font-display text-4xl font-semibold">Contact us</h1>
          <p className="mt-4 max-w-2xl text-slate-300">Questions about GymPro, activation keys or annual plans.</p>
        </div>
      </section>
      <section className="mx-auto max-w-2xl px-4 py-16 sm:px-6">
        {!EMAIL && (
          <p className="mb-6 rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-800">
            Online contact form is not yet configured — a contact address has not been published for this environment.
          </p>
        )}
        {sent && (
          <p className="mb-6 rounded-xl border border-emerald-200 bg-emerald-50 p-4 text-sm font-semibold text-emerald-800">
            Your email client should open with the message pre-filled. If it didn&apos;t, email {EMAIL} directly.
          </p>
        )}
        <form onSubmit={submit} noValidate className="space-y-5">
          {[
            ["name", "Your name", "text"],
            ["email", "Email", "email"],
            ["gym", "Gym name", "text"],
            ["subject", "Subject", "text"],
          ].map(([k, label, type]) => (
            <div key={k}>
              <label htmlFor={k} className="text-sm font-semibold">{label}</label>
              <input id={k} type={type} value={form[k]} onChange={set(k)} className={field} />
              {errors[k] && <p className="mt-1 text-xs text-red-600">{errors[k]}</p>}
            </div>
          ))}
          <div>
            <label htmlFor="message" className="text-sm font-semibold">Message</label>
            <textarea id="message" rows={5} value={form.message} onChange={set("message")} className={field} />
            {errors.message && <p className="mt-1 text-xs text-red-600">{errors.message}</p>}
          </div>
          <button type="submit" className="rounded-xl bg-brand-700 px-6 py-3 text-sm font-semibold text-white hover:bg-brand-600">
            Send Message
          </button>
        </form>
      </section>
    </MarketingLayout>
  );
}
