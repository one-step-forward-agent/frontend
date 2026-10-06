// src/pages/Dashboard/ProfilePage.tsx
import React, { useState, useEffect } from 'react';
import { useAuthStore } from '@/store/authStore';
import { User } from '@/api/types';
import {
  User as UserIcon,
  Mail,
  Lock,
  Save,
  Loader2,
  Eye,
  EyeOff,
  Sparkles,
  ShieldCheck,
  Pencil,
  X,
  KeyRound,
} from 'lucide-react';
import {
  Alert,
  Button,
  Card,
  CardContent,
  FormField,
  Input,
} from '@/components/ui';
import { getErrorMessage } from '@/utils/getErrorMessage';
import { cn } from '@/utils/cn';

// ─── Заглушки API (заменить на реальные вызовы) ────────────
const updateProfile = async (data: Partial<User>): Promise<User> => {
  console.log('updateProfile', data);
  return data as User;
};

const changePassword = async (
  oldPassword: string,
  newPassword: string
): Promise<void> => {
  console.log('changePassword', oldPassword, newPassword);
};

// ─── Компонент ─────────────────────────────────────────────

const ProfilePage: React.FC = () => {
  const { user, isLoading: authLoading } = useAuthStore();

  // Профиль
  const [fullName, setFullName] = useState<string>('');
  const [email, setEmail] = useState<string>('');
  const [isEditing, setIsEditing] = useState<boolean>(false);

  // Смена пароля
  const [currentPassword, setCurrentPassword] = useState<string>('');
  const [newPassword, setNewPassword] = useState<string>('');
  const [confirmPassword, setConfirmPassword] = useState<string>('');
  const [showCurrentPassword, setShowCurrentPassword] = useState<boolean>(false);
  const [showNewPassword, setShowNewPassword] = useState<boolean>(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState<boolean>(false);
  const [isChangingPassword, setIsChangingPassword] = useState<boolean>(false);

  // Уведомления
  const [saving, setSaving] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  useEffect(() => {
    if (user) {
      setFullName(user.name || '');
      setEmail(user.email || '');
    }
  }, [user]);

  const handleSaveProfile = async () => {
    if (!user) return;
    setSaving(true);
    setError(null);
    setSuccess(null);
    try {
      await updateProfile({ name: fullName, email });
      setSuccess('Профиль успешно обновлён');
      setIsEditing(false);
    } catch (err) {
      setError(getErrorMessage(err, 'Ошибка обновления профиля'));
    } finally {
      setSaving(false);
    }
  };

  const handleChangePassword = async () => {
    if (newPassword !== confirmPassword) {
      setError('Пароли не совпадают');
      return;
    }
    if (newPassword.length < 6) {
      setError('Новый пароль должен содержать минимум 6 символов');
      return;
    }
    setIsChangingPassword(true);
    setError(null);
    setSuccess(null);
    try {
      await changePassword(currentPassword, newPassword);
      setSuccess('Пароль успешно изменён');
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
    } catch (err) {
      setError(getErrorMessage(err, 'Ошибка смены пароля'));
    } finally {
      setIsChangingPassword(false);
    }
  };

  const handleCancelEdit = () => {
    setIsEditing(false);
    if (user) {
      setFullName(user.name || '');
      setEmail(user.email || '');
    }
  };

  // ─── Загрузка ────────────────────────────────────────────
  if (authLoading) {
    return (
      <div
        className="flex flex-col items-center justify-center h-64 gap-3"
        role="status"
      >
        <Loader2
          size={32}
          className="animate-spin text-blue-600 dark:text-blue-400"
          aria-hidden="true"
        />
        <span className="text-sm text-gray-500 dark:text-gray-400">
          Загрузка профиля…
        </span>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="flex items-center justify-center h-64">
        <p className="text-gray-500 dark:text-gray-400">
          Пользователь не авторизован
        </p>
      </div>
    );
  }

  // ─── Основной рендер ─────────────────────────────────────
  return (
    <div className="relative space-y-6 max-w-3xl">
      {/* Мягкое свечение на фоне */}
      <div
        aria-hidden="true"
        className="absolute -inset-8 -z-10 pointer-events-none"
      >
        <div className="absolute -top-10 left-1/4 w-72 h-72 rounded-full bg-blue-400/15 blur-3xl" />
        <div className="absolute bottom-0 right-1/4 w-72 h-72 rounded-full bg-violet-400/15 blur-3xl" />
      </div>

      {/* ─── Шапка ───────────────────────────────────────── */}
      <div className="flex items-start gap-4">
        <div
          aria-hidden="true"
          className="
            shrink-0 w-12 h-12 rounded-2xl
            bg-gradient-to-br from-blue-500 via-indigo-500 to-purple-600
            flex items-center justify-center text-white
            shadow-md shadow-blue-500/20
          "
        >
          <UserIcon size={22} />
        </div>

        <div className="min-w-0">
          <h1 className="text-2xl font-semibold text-gray-900 dark:text-white">
            Профиль
          </h1>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-0.5">
            Управление личными данными и настройками аккаунта
          </p>
        </div>
      </div>

      {/* ─── Уведомления ─────────────────────────────────── */}
      {error && <Alert variant="error">{error}</Alert>}
      {success && <Alert variant="success">{success}</Alert>}

      {/* ═══════════ Личная информация ═══════════ */}
      <Card className="relative overflow-hidden">
        <div
          aria-hidden="true"
          className="absolute -top-16 -right-16 w-48 h-48 rounded-full bg-gradient-to-br from-blue-400/20 to-purple-500/20 blur-3xl"
        />

        <div className="relative px-5 md:px-6 py-4 border-b border-gray-100 dark:border-gray-800 flex items-center justify-between gap-3 flex-wrap">
          <div className="flex items-center gap-2.5">
            <div
              aria-hidden="true"
              className="w-7 h-7 rounded-full bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center text-white shadow-sm"
            >
              <Sparkles size={13} />
            </div>
            <h2 className="text-base md:text-lg font-semibold text-gray-900 dark:text-white">
              Личная информация
            </h2>
          </div>

          {!isEditing ? (
            <Button
              variant="outline"
              size="sm"
              onClick={() => setIsEditing(true)}
            >
              <Pencil size={14} className="mr-1.5" />
              Редактировать
            </Button>
          ) : (
            <div className="flex gap-2">
              <Button
                variant="ghost"
                size="sm"
                onClick={handleCancelEdit}
                disabled={saving}
              >
                <X size={14} className="mr-1" />
                Отмена
              </Button>
              <Button
                size="sm"
                isLoading={saving}
                onClick={() => void handleSaveProfile()}
              >
                {!saving && <Save size={14} className="mr-1.5" />}
                {saving ? 'Сохранение…' : 'Сохранить'}
              </Button>
            </div>
          )}
        </div>

        <CardContent className="relative space-y-4">
          {/* Имя */}
          <InfoRow
            icon={UserIcon}
            gradient="from-blue-400 to-indigo-600"
            label="Полное имя"
            editing={isEditing}
          >
            {isEditing ? (
              <FormField id="profileFullName" label="">
                {(fieldProps) => (
                  <Input
                    {...fieldProps}
                    type="text"
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    placeholder="Как к вам обращаться"
                  />
                )}
              </FormField>
            ) : (
              <p className="text-gray-900 dark:text-white">
                {fullName || (
                  <span className="text-gray-400 dark:text-gray-500 italic">
                    Не указано
                  </span>
                )}
              </p>
            )}
          </InfoRow>

          {/* Email */}
          <InfoRow
            icon={Mail}
            gradient="from-violet-400 to-purple-600"
            label="Email"
            editing={isEditing}
          >
            {isEditing ? (
              <FormField id="profileEmail" label="">
                {(fieldProps) => (
                  <Input
                    {...fieldProps}
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="you@example.com"
                  />
                )}
              </FormField>
            ) : (
              <p className="text-gray-900 dark:text-white truncate">
                {email}
              </p>
            )}
          </InfoRow>

          {/* Пароль */}
          <InfoRow
            icon={Lock}
            gradient="from-emerald-400 to-teal-600"
            label="Пароль"
            editing={false}
          >
            <div className="flex items-center justify-between gap-3 flex-wrap">
              <p className="text-gray-500 dark:text-gray-400 tracking-widest">
                ••••••••
              </p>
              <Button
                variant="link"
                size="sm"
                className="px-0 text-blue-600 dark:text-blue-400"
                onClick={() => {
                  document
                    .getElementById('password-section')
                    ?.scrollIntoView({ behavior: 'smooth', block: 'start' });
                }}
              >
                <KeyRound size={13} className="mr-1" />
                Сменить пароль
              </Button>
            </div>
          </InfoRow>
        </CardContent>
      </Card>

      {/* ═══════════ Смена пароля ═══════════ */}
      <Card id="password-section" className="relative overflow-hidden scroll-mt-24">
        <div
          aria-hidden="true"
          className="absolute -bottom-16 -left-16 w-48 h-48 rounded-full bg-gradient-to-br from-emerald-400/20 to-sky-500/20 blur-3xl"
        />

        <div className="relative px-5 md:px-6 py-4 border-b border-gray-100 dark:border-gray-800 flex items-center gap-2.5">
          <div
            aria-hidden="true"
            className="w-7 h-7 rounded-full bg-gradient-to-br from-emerald-400 to-teal-600 flex items-center justify-center text-white shadow-sm"
          >
            <ShieldCheck size={13} />
          </div>
          <h2 className="text-base md:text-lg font-semibold text-gray-900 dark:text-white">
            Смена пароля
          </h2>
        </div>

        <CardContent className="relative space-y-4">
          <div className="max-w-md space-y-4">
            <PasswordField
              id="currentPassword"
              label="Текущий пароль"
              value={currentPassword}
              onChange={setCurrentPassword}
              visible={showCurrentPassword}
              onToggle={() => setShowCurrentPassword((v) => !v)}
              placeholder="Введите текущий пароль"
            />

            <PasswordField
              id="newPassword"
              label="Новый пароль"
              value={newPassword}
              onChange={setNewPassword}
              visible={showNewPassword}
              onToggle={() => setShowNewPassword((v) => !v)}
              placeholder="Минимум 6 символов"
              hint="Используйте буквы разного регистра, цифры и символы"
            />

            <PasswordField
              id="confirmPassword"
              label="Подтверждение пароля"
              value={confirmPassword}
              onChange={setConfirmPassword}
              visible={showConfirmPassword}
              onToggle={() => setShowConfirmPassword((v) => !v)}
              placeholder="Повторите новый пароль"
            />
          </div>

          <div className="pt-2">
            <Button
              onClick={() => void handleChangePassword()}
              disabled={!currentPassword || !newPassword || !confirmPassword}
              isLoading={isChangingPassword}
            >
              {!isChangingPassword && (
                <Lock size={16} className="mr-2" aria-hidden="true" />
              )}
              {isChangingPassword ? 'Смена…' : 'Сменить пароль'}
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

// ─── Строка с иконкой ──────────────────────────────────────

interface InfoRowProps {
  icon: React.ComponentType<{ size?: number; className?: string }>;
  gradient: string;
  label: string;
  editing: boolean;
  children: React.ReactNode;
}

const InfoRow: React.FC<InfoRowProps> = ({
  icon: Icon,
  gradient,
  label,
  editing,
  children,
}) => (
  <div
    className={cn(
      "flex items-start gap-3.5 p-3.5 rounded-2xl border transition-colors",
      editing
        ? "bg-white/70 dark:bg-gray-900/60 border-gray-200/70 dark:border-gray-700/60"
        : "bg-gray-50/60 dark:bg-gray-800/30 border-transparent"
    )}
  >
    <div
      aria-hidden="true"
      className={cn(
        "shrink-0 w-10 h-10 rounded-xl flex items-center justify-center text-white shadow-sm",
        "bg-gradient-to-br",
        gradient
      )}
    >
      <Icon size={18} />
    </div>

    <div className="min-w-0 flex-1">
      <p className="text-[11px] uppercase tracking-widest font-medium text-gray-500 dark:text-gray-400 mb-1">
        {label}
      </p>
      <div className="text-sm">{children}</div>
    </div>
  </div>
);

// ─── Поле пароля ───────────────────────────────────────────

interface PasswordFieldProps {
  id: string;
  label: string;
  value: string;
  onChange: (v: string) => void;
  visible: boolean;
  onToggle: () => void;
  placeholder?: string;
  hint?: string;
}

const PasswordField: React.FC<PasswordFieldProps> = ({
  id,
  label,
  value,
  onChange,
  visible,
  onToggle,
  placeholder,
  hint,
}) => (
  <FormField id={id} label={label} hint={hint}>
    {(fieldProps) => (
      <div className="relative">
        <Input
          {...fieldProps}
          type={visible ? 'text' : 'password'}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className="pr-11"
          placeholder={placeholder}
        />
        <button
          type="button"
          aria-label={visible ? 'Скрыть пароль' : 'Показать пароль'}
          onClick={onToggle}
          className={cn(
            "absolute inset-y-0 right-0 pr-3 flex items-center",
            "text-gray-400 hover:text-gray-700",
            "dark:text-gray-500 dark:hover:text-gray-200",
            "transition-colors"
          )}
        >
          {visible ? (
            <EyeOff size={18} aria-hidden="true" />
          ) : (
            <Eye size={18} aria-hidden="true" />
          )}
        </button>
      </div>
    )}
  </FormField>
);

export default ProfilePage;