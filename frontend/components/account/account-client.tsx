/* eslint-disable @next/next/no-img-element */
"use client";

import { PencilSimple, Plus, Trash } from "@phosphor-icons/react";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { AccountSelect } from "@/components/account/account-select";
import {
  apiRequest,
  type AddressItem,
  type MeProfile,
} from "@/lib/api/app";
import type { Locale } from "@/lib/i18n/config";
import type { Dictionary } from "@/lib/i18n/dictionaries";
import { r2Thumb } from "@/lib/media";
import { cn } from "@/lib/utils";

type Tab = "profile" | "addresses" | "security";

type ProfileForm = {
  fullName: string;
  phoneNumber: string;
  locale: "vi" | "en";
  marketingConsent: boolean;
};

type AddressForm = {
  recipientName: string;
  phone: string;
  province: string;
  district: string;
  ward: string;
  street: string;
  isDefault: boolean;
};

const emptyAddress: AddressForm = {
  recipientName: "",
  phone: "",
  province: "",
  district: "",
  ward: "",
  street: "",
  isDefault: false,
};

export function AccountClient({
  copy,
  locale,
}: {
  copy: Dictionary["account"];
  locale: Locale;
}) {
  const router = useRouter();

  const [tab, setTab] = useState<Tab>("profile");
  const [profile, setProfile] = useState<MeProfile | null>(null);
  const [form, setForm] = useState<ProfileForm>({
    fullName: "",
    phoneNumber: "",
    locale,
    marketingConsent: false,
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [profileMessage, setProfileMessage] = useState<string | null>(null);
  const [profileError, setProfileError] = useState<string | null>(null);

  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [passwordSaving, setPasswordSaving] = useState(false);
  const [passwordMessage, setPasswordMessage] = useState<string | null>(null);
  const [passwordError, setPasswordError] = useState<string | null>(null);

  const [addresses, setAddresses] = useState<AddressItem[]>([]);
  const [addressFormOpen, setAddressFormOpen] = useState(false);
  const [addressForm, setAddressForm] = useState<AddressForm>(emptyAddress);
  const [editingAddressId, setEditingAddressId] = useState<number | null>(null);
  const [addressSaving, setAddressSaving] = useState(false);
  const [addressMessage, setAddressMessage] = useState<string | null>(null);
  const [addressError, setAddressError] = useState<string | null>(null);
  const [deletingAddressId, setDeletingAddressId] = useState<number | null>(null);

  useEffect(() => {
    let cancelled = false;

    async function load() {
      try {
        const [me, savedAddresses] = await Promise.all([
          apiRequest<MeProfile>("/api/v1/user/me"),
          apiRequest<AddressItem[]>("/api/v1/user/me/addresses"),
        ]);
        if (cancelled) return;
        setProfile(me);
        setAddresses(savedAddresses);
        setForm({
          fullName: me.fullName,
          phoneNumber: me.phoneNumber ?? "",
          locale: me.locale === "en" ? "en" : "vi",
          marketingConsent: me.marketingConsent,
        });
      } catch {
        if (!cancelled) setProfileError(copy.loadFailed);
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    void load();
    return () => {
      cancelled = true;
    };
  }, [copy.loadFailed]);

  async function saveProfile(event: React.FormEvent) {
    event.preventDefault();
    if (!profile) return;

    setSaving(true);
    setProfileError(null);
    setProfileMessage(null);
    try {
      const updated = await apiRequest<MeProfile>("/api/v1/user/me", {
        method: "PUT",
        body: JSON.stringify({
          fullName: form.fullName,
          phoneNumber: form.phoneNumber.trim() || null,
          avatarUrl: profile.avatarUrl,
          locale: form.locale,
          marketingConsent: form.marketingConsent,
        }),
      });
      setProfile(updated);
      setForm({
        fullName: updated.fullName,
        phoneNumber: updated.phoneNumber ?? "",
        locale: updated.locale === "en" ? "en" : "vi",
        marketingConsent: updated.marketingConsent,
      });
      setProfileMessage(copy.profile.saved);
      router.refresh();
    } catch (error) {
      setProfileError(
        error instanceof Error ? error.message : copy.profile.saveFailed,
      );
    } finally {
      setSaving(false);
    }
  }

  async function updatePassword(event: React.FormEvent) {
    event.preventDefault();
    setPasswordError(null);
    setPasswordMessage(null);

    if (newPassword.length < 8) {
      setPasswordError(copy.security.min);
      return;
    }
    if (newPassword !== confirmPassword) {
      setPasswordError(copy.security.mismatch);
      return;
    }

    setPasswordSaving(true);
    try {
      await apiRequest("/api/v1/user/me/password", {
        method: "PUT",
        body: JSON.stringify({
          currentPassword: currentPassword || null,
          newPassword,
        }),
      });
      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
      setPasswordMessage(copy.security.updated);
    } catch (error) {
      setPasswordError(
        error instanceof Error ? error.message : copy.security.updateFailed,
      );
    } finally {
      setPasswordSaving(false);
    }
  }

  async function deleteAddress(id: number) {
    setDeletingAddressId(id);
    setAddressError(null);
    setAddressMessage(null);
    try {
      await apiRequest(`/api/v1/user/me/addresses/${id}`, { method: "DELETE" });
      setAddresses((current) => current.filter((address) => address.id !== id));
      setAddressMessage(copy.addresses.deleted);
    } catch (error) {
      setAddressError(
        error instanceof Error ? error.message : copy.addresses.deleteFailed,
      );
    } finally {
      setDeletingAddressId(null);
    }
  }

  async function saveAddress(event: React.FormEvent) {
    event.preventDefault();
    setAddressSaving(true);
    setAddressError(null);
    setAddressMessage(null);

    const payload = {
      recipientName: addressForm.recipientName,
      phone: addressForm.phone,
      province: addressForm.province,
      district: addressForm.district,
      ward: addressForm.ward,
      street: addressForm.street,
      isDefault: addressForm.isDefault,
    };

    try {
      const saved = await apiRequest<AddressItem>(
        editingAddressId
          ? `/api/v1/user/me/addresses/${editingAddressId}`
          : "/api/v1/user/me/addresses",
        {
          method: editingAddressId ? "PUT" : "POST",
          body: JSON.stringify(payload),
        },
      );

      setAddresses((current) => {
        const withoutDefault = saved.isDefault
          ? current.map((address) => ({ ...address, isDefault: false }))
          : current;
        const exists = withoutDefault.some((address) => address.id === saved.id);
        return exists
          ? withoutDefault.map((address) =>
              address.id === saved.id ? saved : address,
            )
          : [saved, ...withoutDefault];
      });
      setAddressForm(emptyAddress);
      setEditingAddressId(null);
      setAddressFormOpen(false);
      setAddressMessage(copy.addresses.saved);
      setAddressError(null);
    } catch (error) {
      setAddressError(
        error instanceof Error ? error.message : copy.addresses.saveFailed,
      );
    } finally {
      setAddressSaving(false);
    }
  }

  function editAddress(address: AddressItem) {
    setEditingAddressId(address.id);
    setAddressFormOpen(true);
    setAddressForm({
      recipientName: address.recipientName,
      phone: address.phone,
      province: address.province,
      district: address.district,
      ward: address.ward,
      street: address.street,
      isDefault: address.isDefault,
    });
    setAddressError(null);
    setAddressMessage(null);
  }

  function cancelAddress() {
    setEditingAddressId(null);
    setAddressFormOpen(false);
    setAddressForm(emptyAddress);
    setAddressError(null);
  }

  const tabs: Array<{ id: Tab; label: string }> = [
    { id: "profile", label: copy.tabs.profile },
    { id: "addresses", label: copy.tabs.addresses },
    { id: "security", label: copy.tabs.security },
  ];

  if (loading) {
    return (
      <div className="page-shell py-20">
        <p className="text-muted">{copy.loading}</p>
      </div>
    );
  }

  return (
    <div className="page-shell py-14 sm:py-20">
      <div className="mx-auto max-w-4xl">
        <p className="eyebrow">{copy.eyebrow}</p>
        <h1 className="hand mt-3 text-[clamp(2.8rem,6vw,4.6rem)] leading-[1.02] text-chalk">
          {copy.title}
        </h1>
        <p className="mt-4 max-w-xl text-body">{copy.intro}</p>

        {profileError && !profile && (
          <p role="alert" className="mt-6 text-coral">
            {profileError}
          </p>
        )}

        <div className="mt-9 flex flex-wrap gap-2 border-b border-dashed border-line pb-4">
          {tabs.map((item) => (
            <button
              key={item.id}
              type="button"
              onClick={() => setTab(item.id)}
              className={cn(
                "btn btn-sm",
                tab === item.id ? "btn-solid" : "btn-quiet text-muted",
              )}
            >
              {item.label}
            </button>
          ))}
        </div>

        {tab === "profile" && profile && (
          <section className="panel panel-outline mt-8 p-5 sm:p-8">
            <div className="flex flex-col gap-6 sm:flex-row sm:items-center">
              <div
                className="polaroid w-32 shrink-0"
                style={{ "--tilt": "-1.2deg" } as React.CSSProperties}
              >
                <div className="polaroid__frame aspect-square overflow-hidden">
                  {profile.avatarUrl ? (
                    <img
                      src={r2Thumb(profile.avatarUrl, 320)}
                      alt={copy.profile.avatar}
                      className="polaroid__img h-full w-full object-cover"
                    />
                  ) : (
                    <div className="grid h-full w-full place-items-center bg-paper text-3xl text-board-deep">
                      {profile.fullName.charAt(0).toUpperCase()}
                    </div>
                  )}
                </div>
              </div>

              <div className="min-w-0">
                <p className="font-display text-lg uppercase tracking-[0.14em] text-chalk">
                  {profile.fullName}
                </p>
                <p className="mt-2 break-all text-sm text-muted">
                  {profile.email ?? copy.profile.email}
                </p>
              </div>
            </div>

            <form className="mt-9 grid gap-6 sm:grid-cols-2" onSubmit={saveProfile}>
              <div>
                <label className="field-label" htmlFor="account-name">
                  {copy.profile.fullName}
                </label>
                <input
                  id="account-name"
                  className="field-input"
                  value={form.fullName}
                  maxLength={100}
                  onChange={(event) =>
                    setForm((current) => ({
                      ...current,
                      fullName: event.target.value,
                    }))
                  }
                />
              </div>

              <div>
                <label className="field-label" htmlFor="account-phone">
                  {copy.profile.phone} · {copy.profile.optional}
                </label>
                <input
                  id="account-phone"
                  className="field-input"
                  type="tel"
                  value={form.phoneNumber}
                  placeholder="0912 345 678"
                  onChange={(event) =>
                    setForm((current) => ({
                      ...current,
                      phoneNumber: event.target.value,
                    }))
                  }
                />
              </div>

              <div>
                <label className="field-label">
                  {copy.profile.locale}
                </label>
                <AccountSelect
                  value={form.locale}
                  label={copy.profile.locale}
                  options={[
                    { value: "vi", label: "Tiếng Việt" },
                    { value: "en", label: "English" },
                  ]}
                  onChange={(value) =>
                    setForm((current) => ({
                      ...current,
                      locale: value === "en" ? "en" : "vi",
                    }))
                  }
                />
              </div>

              <label className="flex items-end gap-3 pb-2 text-sm text-body">
                <input
                  type="checkbox"
                  checked={form.marketingConsent}
                  onChange={(event) =>
                    setForm((current) => ({
                      ...current,
                      marketingConsent: event.target.checked,
                    }))
                  }
                  className="h-4 w-4 accent-[var(--yellow)]"
                />
                {copy.profile.marketing}
              </label>

              <div className="flex flex-wrap items-center gap-4 sm:col-span-2">
                <button type="submit" disabled={saving} className="btn btn-solid btn-md">
                  {saving ? copy.profile.saving : copy.profile.save}
                </button>
                {profileMessage && (
                  <p role="status" className="text-sm text-yellow">
                    {profileMessage}
                  </p>
                )}
                {profileError && (
                  <p role="alert" className="text-sm text-coral">
                    {profileError}
                  </p>
                )}
              </div>
            </form>
          </section>
        )}

        {tab === "addresses" && (
          <section className="panel panel-outline mt-8 p-5 sm:p-8">
            <div className="flex flex-wrap items-start justify-between gap-4">
              <div>
                <h2 className="font-display text-lg uppercase tracking-[0.14em] text-chalk">
                  {copy.addresses.title}
                </h2>
                <p className="mt-2 max-w-lg text-sm text-body">
                  {copy.addresses.intro}
                </p>
              </div>
              <button
                type="button"
                onClick={() => {
                  setEditingAddressId(null);
                  setAddressForm(emptyAddress);
                  setAddressFormOpen(true);
                  setAddressError(null);
                  setAddressMessage(null);
                }}
                className="btn btn-solid btn-sm"
              >
                <Plus size={14} />
                {copy.addresses.add}
              </button>
            </div>

            {addressMessage && (
              <p role="status" className="mt-5 text-sm text-yellow">
                {addressMessage}
              </p>
            )}
            {addressError && (
              <p role="alert" className="mt-5 text-sm text-coral">
                {addressError}
              </p>
            )}

            {addressFormOpen && (
              <form
                onSubmit={saveAddress}
                className="mt-7 border-b border-dashed border-line pb-8"
              >
                <p className="font-display text-[0.82rem] uppercase tracking-[0.14em] text-yellow">
                  {editingAddressId
                    ? copy.addresses.edit
                    : copy.addresses.add}
                </p>
                <div className="mt-5 grid gap-5 sm:grid-cols-2">
                  <div>
                    <label className="field-label" htmlFor="address-recipient">
                      {copy.addresses.recipient}
                    </label>
                    <input
                      id="address-recipient"
                      className="field-input"
                      value={addressForm.recipientName}
                      onChange={(event) =>
                        setAddressForm((current) => ({
                          ...current,
                          recipientName: event.target.value,
                        }))
                      }
                    />
                  </div>
                  <div>
                    <label className="field-label" htmlFor="address-phone">
                      {copy.addresses.phone}
                    </label>
                    <input
                      id="address-phone"
                      type="tel"
                      className="field-input"
                      value={addressForm.phone}
                      onChange={(event) =>
                        setAddressForm((current) => ({
                          ...current,
                          phone: event.target.value,
                        }))
                      }
                    />
                  </div>
                  <div>
                    <label className="field-label" htmlFor="address-province">
                      {copy.addresses.province}
                    </label>
                    <input
                      id="address-province"
                      className="field-input"
                      value={addressForm.province}
                      onChange={(event) =>
                        setAddressForm((current) => ({
                          ...current,
                          province: event.target.value,
                        }))
                      }
                    />
                  </div>
                  <div>
                    <label className="field-label" htmlFor="address-district">
                      {copy.addresses.district}
                    </label>
                    <input
                      id="address-district"
                      className="field-input"
                      value={addressForm.district}
                      onChange={(event) =>
                        setAddressForm((current) => ({
                          ...current,
                          district: event.target.value,
                        }))
                      }
                    />
                  </div>
                  <div>
                    <label className="field-label" htmlFor="address-ward">
                      {copy.addresses.ward}
                    </label>
                    <input
                      id="address-ward"
                      className="field-input"
                      value={addressForm.ward}
                      onChange={(event) =>
                        setAddressForm((current) => ({
                          ...current,
                          ward: event.target.value,
                        }))
                      }
                    />
                  </div>
                  <div>
                    <label className="field-label" htmlFor="address-street">
                      {copy.addresses.street}
                    </label>
                    <input
                      id="address-street"
                      className="field-input"
                      value={addressForm.street}
                      onChange={(event) =>
                        setAddressForm((current) => ({
                          ...current,
                          street: event.target.value,
                        }))
                      }
                    />
                  </div>
                </div>
                <label className="mt-5 flex items-center gap-3 text-sm text-body">
                  <input
                    type="checkbox"
                    checked={addressForm.isDefault}
                    onChange={(event) =>
                      setAddressForm((current) => ({
                        ...current,
                        isDefault: event.target.checked,
                      }))
                    }
                    className="h-4 w-4 accent-[var(--yellow)]"
                  />
                  {copy.addresses.default}
                </label>
                <div className="mt-6 flex flex-wrap gap-3">
                  <button
                    type="submit"
                    disabled={addressSaving}
                    className="btn btn-solid btn-sm"
                  >
                    {addressSaving
                      ? copy.addresses.saving
                      : copy.addresses.save}
                  </button>
                  <button
                    type="button"
                    onClick={cancelAddress}
                    className="btn btn-quiet btn-sm text-muted"
                  >
                    {copy.addresses.cancel}
                  </button>
                </div>
              </form>
            )}

            {addresses.length === 0 ? (
              <p className="mt-7 text-sm text-muted">{copy.addresses.empty}</p>
            ) : (
              <div className="mt-7 grid gap-4 sm:grid-cols-2">
                {addresses.map((address) => (
                  <article
                    key={address.id}
                    className="border border-dashed border-line px-4 py-4"
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <p className="text-sm font-semibold text-chalk">
                          {address.recipientName}
                          {address.isDefault && (
                            <span className="ml-2 font-mono text-[0.58rem] uppercase tracking-[0.12em] text-yellow">
                              {copy.addresses.defaultBadge}
                            </span>
                          )}
                        </p>
                        <p className="mt-0.5 text-[0.82rem] text-muted">
                          {address.phone}
                        </p>
                      </div>
                      <div className="flex items-center gap-1">
                        <button
                          type="button"
                          aria-label={copy.addresses.edit}
                          onClick={() => editAddress(address)}
                          className="grid h-8 w-8 place-items-center text-muted transition-colors hover:text-yellow"
                        >
                          <PencilSimple size={15} />
                        </button>
                        <button
                          type="button"
                          aria-label={copy.addresses.delete}
                          onClick={() => void deleteAddress(address.id)}
                          disabled={deletingAddressId === address.id}
                          className="grid h-8 w-8 place-items-center text-muted transition-colors hover:text-coral disabled:opacity-50"
                        >
                          <Trash size={15} />
                        </button>
                      </div>
                    </div>
                    <p className="mt-3 text-[0.86rem] leading-relaxed text-body">
                      {address.street}, {address.ward}, {address.district},{" "}
                      {address.province}
                    </p>
                  </article>
                ))}
              </div>
            )}
          </section>
        )}

        {tab === "security" && (
          <section className="panel panel-outline mt-8 p-5 sm:p-8">
            <h2 className="font-display text-lg uppercase tracking-[0.14em] text-chalk">
              {copy.security.title}
            </h2>
            <form className="mt-6 max-w-md space-y-5" onSubmit={updatePassword}>
              {profile?.hasPassword && (
                <div>
                  <label className="field-label" htmlFor="account-current">
                    {copy.security.current}
                  </label>
                  <input
                    id="account-current"
                    type="password"
                    className="field-input"
                    value={currentPassword}
                    onChange={(event) => setCurrentPassword(event.target.value)}
                    autoComplete="current-password"
                  />
                </div>
              )}
              <div>
                <label className="field-label" htmlFor="account-new">
                  {copy.security.new}
                </label>
                <input
                  id="account-new"
                  type="password"
                  className="field-input"
                  value={newPassword}
                  onChange={(event) => setNewPassword(event.target.value)}
                  autoComplete="new-password"
                />
              </div>
              <div>
                <label className="field-label" htmlFor="account-confirm">
                  {copy.security.confirm}
                </label>
                <input
                  id="account-confirm"
                  type="password"
                  className="field-input"
                  value={confirmPassword}
                  onChange={(event) => setConfirmPassword(event.target.value)}
                  autoComplete="new-password"
                />
              </div>
              {!profile?.hasPassword && (
                <p className="text-sm text-muted">{copy.security.optionalCurrent}</p>
              )}
              <div className="flex flex-wrap items-center gap-4">
                <button
                  type="submit"
                  disabled={passwordSaving}
                  className="btn btn-solid btn-md"
                >
                  {passwordSaving ? copy.security.updating : copy.security.update}
                </button>
                {passwordMessage && (
                  <p role="status" className="text-sm text-yellow">
                    {passwordMessage}
                  </p>
                )}
                {passwordError && (
                  <p role="alert" className="text-sm text-coral">
                    {passwordError}
                  </p>
                )}
              </div>
            </form>
          </section>
        )}
      </div>
    </div>
  );
}
