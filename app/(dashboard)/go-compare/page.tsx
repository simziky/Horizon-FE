import deckIco from "@/public/assets/svg/gocompare/deck.svg"
import Image from "next/image";

const page = () => {
  return (
    <div className="flex flex-col gap-3 justify-center items-center my-auto" style={{ height: "calc(100vh - 210px)" }}>
      <Image src={deckIco || "/placeholder.svg"} alt="deck icon" />
      <h1 className="font-medium">Your deck is empty</h1>
      <p className="text-sm text-[#737379] text-center">Add products to compare deals and find the best opportunities.</p>
    </div>
  )
};

export default page;
