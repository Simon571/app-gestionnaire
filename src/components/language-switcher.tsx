'use client';

import { usePathname, useRouter } from '@/navigation';
import { useLocale, useTranslations } from 'next-intl';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { locales, localeNames } from '@/i18n-config';
import { Label } from './ui/label';

export default function LanguageSwitcher() {
  const t = useTranslations('LanguageSwitcher');
  const locale = useLocale();
  const router = useRouter();
  const pathname = usePathname();

  const onSelectChange = (nextLocale: string) => {
    router.replace(pathname, { locale: nextLocale, scroll: false });
  };

  return (
    <div className="flex flex-col gap-2">
       <Label className="text-sidebar-foreground/70 text-xs px-2">{t('label')}</Label>
        <Select onValueChange={onSelectChange} defaultValue={locale}>
            <SelectTrigger className="w-full bg-sidebar-accent border-sidebar-border text-sidebar-foreground focus:ring-sidebar-ring">
            <SelectValue placeholder={t('change_language')} />
            </SelectTrigger>
            <SelectContent>
            {locales.map((cur) => (
                <SelectItem key={cur} value={cur}>
                {localeNames[cur]}
                </SelectItem>
            ))}
            </SelectContent>
        </Select>
    </div>
  );
}
