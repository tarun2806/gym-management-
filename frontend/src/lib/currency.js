import { useState, useEffect } from "react";
import { api } from "./api";
const CURRENCY_MAP = {
  "INR (\u20B9)": { symbol: "\u20B9", code: "INR" },
  "USD ($)": { symbol: "$", code: "USD" },
  "EUR (\u20AC)": { symbol: "\u20AC", code: "EUR" },
  "GBP (\xA3)": { symbol: "\xA3", code: "GBP" }
};
function resolveCurrency(raw) {
  const entry = CURRENCY_MAP[raw || ""] || CURRENCY_MAP["INR (\u20B9)"];
  return {
    symbol: entry.symbol,
    code: entry.code,
    format: (amount) => `${entry.symbol}${amount.toLocaleString()}`
  };
}
function useCurrency() {
  const [info, setInfo] = useState(resolveCurrency(null));
  useEffect(() => {
    api("/api/settings/app_preferences").then((prefs) => {
      const currency = prefs?.currency;
      setInfo(resolveCurrency(typeof currency === "string" ? currency : null));
    }).catch(() => {
    });
  }, []);
  return info;
}
export {
  CURRENCY_MAP,
  resolveCurrency,
  useCurrency
};
