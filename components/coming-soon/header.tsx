import { LanguageSwitcher } from './language-switcher';

export function Header() {
  return (
    <header className="fixed top-0 left-0 right-0 z-50 px-4 py-4">
      <div className="max-w-6xl mx-auto flex items-center justify-between">
        {/* Logo placeholder - can add an actual logo here later */}
        <div className="font-display text-lg font-semibold text-foreground">
          <span className="sr-only">Jasno i Jasno</span>
        </div>

        {/* Language switcher */}
        <LanguageSwitcher />
      </div>
    </header>
  );
}
