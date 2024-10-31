import Translations from "./translations/en.json" with { type: "json" };

function i18n(key: string) {
  return (Translations as any)[key];
}


i18n("hello.world");
i18n("hi");
