"use client";

import { PASSWORD_MIN_LENGTH } from "@interview-prep/config/constants";

function getStrength(password: string): {
  score: number;
  label: string;
} {
  if (!password) return { score: 0, label: "" };
  let score = 0;
  if (password.length >= PASSWORD_MIN_LENGTH) score++;
  if (password.length >= PASSWORD_MIN_LENGTH + 4) score++;
  if (/[a-z]/.test(password) && /[A-Z]/.test(password)) score++;
  if (/\d/.test(password)) score++;
  if (/[^a-zA-Z0-9]/.test(password)) score++;

  if (score <= 1) return { score: 1, label: "Weak" };
  if (score <= 2) return { score: 2, label: "Fair" };
  if (score <= 3) return { score: 3, label: "Good" };
  return { score: 4, label: "Strong" };
}

const colors = [
  "",
  "bg-red-500",
  "bg-orange-500",
  "bg-yellow-500",
  "bg-green-500",
];

const textColors = [
  "",
  "text-red-600 dark:text-red-400",
  "text-orange-600 dark:text-orange-400",
  "text-yellow-600 dark:text-yellow-400",
  "text-green-600 dark:text-green-400",
];

export function PasswordStrength({ password }: { password: string }) {
  const { score, label } = getStrength(password);

  if (!password) return null;

  return (
    <div className="mt-2 space-y-1" aria-live="polite">
      <div
        className="flex gap-1"
        role="meter"
        aria-label="Password strength"
        aria-valuenow={score}
        aria-valuemin={0}
        aria-valuemax={4}
        aria-valuetext={label}
      >
        {[1, 2, 3, 4].map((i) => (
          <div
            key={i}
            className={`h-1.5 flex-1 rounded-full transition-colors ${
              i <= score ? colors[score] : "bg-border"
            }`}
          />
        ))}
      </div>
      <p className={`text-xs font-medium ${textColors[score]}`}>{label}</p>
    </div>
  );
}
