import { Books } from "@/components/landing/books";
import { Contact } from "@/components/landing/contact";
import { FinalCta } from "@/components/landing/final-cta";
import { Hero } from "@/components/landing/hero";
import { Materials } from "@/components/landing/materials";
import { Options } from "@/components/landing/options";
import { Process } from "@/components/landing/process";
import { Quote } from "@/components/landing/quote";
import { SiteFooter } from "@/components/site/footer";
import { SiteHeader } from "@/components/site/header";
import { getMessages } from "@/lib/i18n/server";

export default async function HomePage() {
  const { t } = await getMessages();

  return (
    <>
      <SiteHeader />
      <main id="main">
        <Hero copy={t.hero} images={t.images} />
        <Books copy={t.books} />
        <Materials copy={t.materials} images={t.images} />
        <Options copy={t.options} images={t.images} />
        <Process copy={t.process} />
        <Quote copy={t.quote} />
        <FinalCta copy={t.cta} />
        <Contact copy={t.contact} email={t.footer.email} />
      </main>
      <SiteFooter />
    </>
  );
}
