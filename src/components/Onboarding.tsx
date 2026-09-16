import { useState } from 'react';

type Props = { onComplete: (name: string) => void };

export function Onboarding({ onComplete }: Props) {
  const [name, setName] = useState('');

  return <section className="otto-card p-6 space-y-4">
    <h1 className="text-2xl font-semibold">Привет, я Отто 👋</h1>
    <p>Я помогу тебе подготовиться к немецкому A1.</p>
    <label className="block">
      <span>Как тебя зовут?</span>
      <input className="mt-2 w-full rounded-xl p-3" value={name} onChange={(e) => setName(e.target.value)} placeholder="Имя" />
    </label>
    <button className="rounded-xl px-5 py-3" disabled={!name.trim()} onClick={() => onComplete(name)}>
      Продолжить
    </button>
  </section>;
}
