import type { Metadata, Viewport } from "next";
import { Archivo, IBM_Plex_Mono, IBM_Plex_Sans, Instrument_Serif, Inter, Urbanist } from "next/font/google";
import { accentCssVariables, DEFAULT_BRANDING } from "@/lib/branding";
import { faviconHref } from "@/lib/favicon";
import { appIconHref, NAV_INK, shortAppName } from "@/lib/pwa";
import { RegistrarServiceWorker } from "@/components/pwa";
import { atributosHtml, cssDePropio, cssDeTemas } from "@/lib/temas";
import { aparienciaActual } from "@/server/apariencia";
import { getBranding } from "@/server/branding";
import { enabledChannels } from "@/server/channels/enabled";
import { productName } from "@/lib/channels";
import { systemText } from "@/lib/i18n";
import { getI18n } from "@/server/i18n";
import { I18nProvider } from "@/components/i18n-provider";
import "./globals.css";

// Las voces de la marca. next/font las descarga en BUILD y las sirve
// self-hosted (sin CDN en runtime: soberanía). 061 — La interfaz va en
// Urbanist (geométrica y ligera, como la referencia del diseño de tarjetas);
// Archivo, la de vocerocrm.com, queda cargada para elegirla (062).
// `--font-sans` se arma en globals.css a partir de estas.
const urbanist = Urbanist({
  subsets: ["latin"],
  variable: "--font-urbanist",
  display: "swap",
});
const archivo = Archivo({
  subsets: ["latin"],
  variable: "--font-archivo",
  display: "swap",
});
// 062 — Las otras dos letras que se eligen en Ajustes → Apariencia.
const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
  display: "swap",
});
const plexSans = IBM_Plex_Sans({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  variable: "--font-plex-sans",
  display: "swap",
});
const instrumentSerif = Instrument_Serif({
  subsets: ["latin"],
  weight: "400",
  style: ["normal", "italic"],
  variable: "--font-serif",
  display: "swap",
});
const plexMono = IBM_Plex_Mono({
  subsets: ["latin"],
  weight: ["400", "500", "600"],
  variable: "--font-mono",
  display: "swap",
});

export const dynamic = "force-dynamic";

export async function generateMetadata(): Promise<Metadata> {
  const { t: tr } = await getI18n();

  const branding = await getBranding().catch(() => DEFAULT_BRANDING);
  const producto = systemText(tr.locale, productName([...enabledChannels()]));
  return {
    title: `${branding.name} — ${producto}`,
    description: tr("{v0} con agente de IA y Laboratorio de auto-evaluación", {v0: producto}),
    // El `?v=` cambia con la marca: los navegadores guardan el favicon con una
    // insistencia notable y, sin eso, el logo nuevo tarda días en aparecer.
    icons: {
      icon: faviconHref(branding),
      // 048 — El icono de «Agregar a inicio» del iPhone: PNG de 180, a sangre.
      apple: appIconHref(branding, 180),
    },
    // 048 — Instalada desde Safari, abre sin la barra del navegador. Barra de
    // estado negra y no translúcida: la página no tiene margen para el notch.
    appleWebApp: { capable: true, title: shortAppName(branding.name), statusBarStyle: "black" },
  };
}

/** 048 — La barra de estado de la app instalada, del color de la barra lateral. */
export const viewport: Viewport = { themeColor: NAV_INK };

export default async function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  const branding = await getBranding().catch(() => DEFAULT_BRANDING);
  const { locale, companyLocale, preference } = await getI18n();
  // 062 · D6 — La apariencia (tema, letra, tamaño y densidad) se resuelve en
  // el servidor: el primer pintado ya la trae, sin parpadeo.
  const { apariencia } = await aparienciaActual().catch(() => ({
    apariencia: { tema: "menta", letra: "urbanist", tamano: "normal", densidad: "normal" } as const,
  }));
  return (
    <html
      lang={locale}
      className={`${urbanist.variable} ${archivo.variable} ${inter.variable} ${plexSans.variable} ${instrumentSerif.variable} ${plexMono.variable}`}
      // La preferencia siempre es explícita: viaja resuelta en el HTML del
      // servidor, así que no hay divergencia con el cliente ni parpadeo.
      {...atributosHtml(apariencia)}
    >
      <head>
        {/* Acento white-label inyectado en SSR: sin flash de tema */}
        <style
          dangerouslySetInnerHTML={{ __html: accentCssVariables(branding.accent) }}
        />
        {/* 062 — Los temas listos (todos, para cambiar en vivo) y el propio. */}
        <style
          id="vocero-temas"
          dangerouslySetInnerHTML={{ __html: cssDeTemas() + cssDePropio(apariencia) }}
        />
      </head>
      <body className="font-sans">
        <I18nProvider locale={locale} companyLocale={companyLocale} preference={preference}>{children}</I18nProvider>
        <RegistrarServiceWorker />
      </body>
    </html>
  );
}
