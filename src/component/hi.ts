import Translations from "./translations/en.json" with { type: "json" };

const dynamicKey = "dynamic1";

const i18n = {
  translate: function i18n(key: string, _?: any) {
    return (Translations as any)[key];
  },
};

i18n.translate("hello.world", {
  count: 10,
});
i18n.translate("hi");


i18n.translate(dynamicKey)
