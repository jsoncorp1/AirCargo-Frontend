import nextVitals from "eslint-config-next/core-web-vitals";
import nextTs from "eslint-config-next/typescript";
import { defineConfig, globalIgnores } from "eslint/config";

// Formatear fechas a mano vuelve a meter la zona horaria del navegador en el
// medio, que es de donde salió el bug de "lo cargado después de las 20:00 no
// aparece hasta mañana". La zona del negocio (Bolivia) vive en un solo lugar:
// src/utils/datetime.ts. Estas reglas empujan a usar sus helpers.
const fechasFueraDeUtils = {
  "no-restricted-syntax": [
    "error",
    {
      selector:
        "CallExpression[callee.property.name=/^toLocale(Date|Time)?String$/]",
      message:
        "Usá formatDate/formatTime/formatDateTime de @/utils/datetime: fijan la zona de Bolivia en vez de la del navegador.",
    },
    {
      // `toISOString()` a secas está bien (es un instante). Lo que rompe es
      // recortarle el día: ese día es UTC, no el boliviano.
      selector:
        "CallExpression[callee.property.name=/^(split|slice|substring|substr)$/][callee.object.callee.property.name='toISOString']",
      message:
        "El día de `toISOString()` es el UTC, que en Bolivia se adelanta a partir de las 20:00. Usá toApiDay/todayApiDay de @/utils/datetime.",
    },
  ],
};

const eslintConfig = defineConfig([
  ...nextVitals,
  ...nextTs,
  {
    files: ["src/**/*.{ts,tsx}"],
    ignores: ["src/utils/datetime.ts"],
    rules: fechasFueraDeUtils,
  },
  // Override default ignores of eslint-config-next.
  globalIgnores([
    // Default ignores of eslint-config-next:
    ".next/**",
    "out/**",
    "build/**",
    "next-env.d.ts",
  ]),
]);

export default eslintConfig;
