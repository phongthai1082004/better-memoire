"use client";

import { useState } from "react";
import { AccountSelect } from "@/components/account/account-select";
import type { Dictionary } from "@/lib/i18n/dictionaries";

type ContactForm = {
  name: string;
  email: string;
  topic: string;
  timing: string;
  message: string;
};

export function Contact({
  copy,
  email,
}: {
  copy: Dictionary["contact"];
  email: string;
}) {
  const [form, setForm] = useState<ContactForm>({
    name: "",
    email: "",
    topic: copy.topics[0] ?? "",
    timing: "",
    message: "",
  });
  const [sent, setSent] = useState(false);

  function update(field: keyof ContactForm, value: string) {
    setForm((current) => ({ ...current, [field]: value }));
    setSent(false);
  }

  function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const subject = `${copy.title} — ${form.name || copy.fields.name}`;
    const body = [
      `${copy.fields.name}: ${form.name}`,
      `${copy.fields.email}: ${form.email}`,
      `${copy.fields.topic}: ${form.topic}`,
      `${copy.fields.timing}: ${form.timing}`,
      "",
      `${copy.fields.message}:`,
      form.message,
    ].join("\n");

    window.location.href = `mailto:${email}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
    setSent(true);
  }

  return (
    <section id="contact" className="border-t border-line-soft py-[var(--section-y)]">
      <div className="page-shell grid gap-12 lg:grid-cols-[0.82fr_1.18fr] lg:gap-20">
        <div>
          <p className="eyebrow">{copy.eyebrow}</p>
          <h2 className="h-section h-section--marked mt-3 max-w-[16ch]">
            {copy.title}
          </h2>
          <p className="mt-8 max-w-[37ch] text-[1.08rem] leading-[1.7] text-body">
            {copy.body}
          </p>

          <p className="chalk-grain hand mt-9 max-w-[31ch] text-[1.95rem] leading-[1.35]">
            {copy.note}
          </p>
          <p className="chalk-grain hand mt-4 text-[1.25rem]">
            {copy.signature}
          </p>
        </div>

        <form onSubmit={submit} className="grid gap-x-8 gap-y-6 sm:grid-cols-2">
          <div>
            <label className="field-label" htmlFor="contact-name">
              {copy.fields.name}
            </label>
            <input
              id="contact-name"
              required
              autoComplete="name"
              className="field-input"
              value={form.name}
              placeholder={copy.placeholders.name}
              onChange={(event) => update("name", event.target.value)}
            />
          </div>

          <div>
            <label className="field-label" htmlFor="contact-email">
              {copy.fields.email}
            </label>
            <input
              id="contact-email"
              required
              type="email"
              autoComplete="email"
              className="field-input"
              value={form.email}
              placeholder={copy.placeholders.email}
              onChange={(event) => update("email", event.target.value)}
            />
          </div>

          <div>
            <span className="field-label">{copy.fields.topic}</span>
            <AccountSelect
              value={form.topic}
              label={copy.fields.topic}
              options={copy.topics.map((topic) => ({
                value: topic,
                label: topic,
              }))}
              onChange={(value) => update("topic", value)}
            />
          </div>

          <div>
            <label className="field-label" htmlFor="contact-timing">
              {copy.fields.timing}
            </label>
            <input
              id="contact-timing"
              className="field-input"
              value={form.timing}
              placeholder={copy.placeholders.timing}
              onChange={(event) => update("timing", event.target.value)}
            />
          </div>

          <div className="sm:col-span-2">
            <label className="field-label" htmlFor="contact-message">
              {copy.fields.message}
            </label>
            <textarea
              id="contact-message"
              className="field-input min-h-[7rem] resize-y"
              value={form.message}
              placeholder={copy.placeholders.message}
              onChange={(event) => update("message", event.target.value)}
            />
          </div>

          <div className="sm:col-span-2">
            <div className="flex flex-wrap items-center gap-x-6 gap-y-3">
              <button type="submit" className="btn btn-solid">
                {copy.send}
              </button>
              <p className="max-w-[29rem] text-[0.8rem] leading-relaxed text-muted">
                {copy.privacy}
              </p>
            </div>

            {sent && (
              <p role="status" className="mt-4 text-[0.84rem] text-yellow">
                {copy.sent}{" "}
                <a href={`mailto:${email}`} className="underline underline-offset-4">
                  {email}
                </a>
              </p>
            )}
          </div>
        </form>
      </div>
    </section>
  );
}
