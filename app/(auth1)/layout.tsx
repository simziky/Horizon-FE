import Image from "next/image";
import Link from "next/link";

import Logo from "@/public/assets/svg/optisage-logo-alt.svg";
import AuthSteps from "./_components/Steps";

export default function Auth1Layout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <section className="bg-[#FAFAFA] h-screen flex flex-col items-center px-4 sm:px-8 lg:px-0">
      <div className="my-auto flex flex-col gap-20 lg:gap-28 items-center w-full">
        <Link href="/" className="block md:hidden">
          <Image src={Logo} alt="Logo" width={203} height={53} quality={90} />
        </Link>

        <div className="w-full max-w-[819px] h-[492px] flex gap-4 bg-white border border-[#EDEDED] rounded-3xl shadow-md shadow-[#18CB961A]">
          <div className="rounded-l-3xl p-10 w-full max-w-[322px] h-full bg-[url(/assets/svg/auth-bg.svg)] bg-no-repeat bg-center border-l border-[#18CB96] hidden md:block">
            <Link href="/">
              <Image
                src={Logo}
                alt="Logo"
                width={143}
                height={37}
                quality={90}
              />
            </Link>

            {/* track steps */}
            <AuthSteps />
          </div>
          <div className="py-8 px-12 w-full my-auto">{children}</div>
        </div>
      </div>
    </section>
  );
}

