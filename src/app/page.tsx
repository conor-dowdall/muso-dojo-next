import Fretboard from "@/components/instruments/Fretboard";
import Image from "next/image";

export default function Home() {
  return (
    <>
      <header
        style={{
          display: "flex",
          gap: "1em",
          alignItems: "center",
          padding: "1em",
          marginBlockEnd: "1em",
        }}
      >
        <Image
          style={{ borderRadius: "50%", display: "inline-block" }}
          width={48}
          height={48}
          src="/logo.png"
          alt="Muso Dojo Logo"
        />
        <h1 style={{ fontSize: "2em", display: "inline-block" }}>Muso Dojo</h1>
      </header>
      <section
        style={{
          minHeight: "100dvh",
          display: "grid",
          justifyItems: "center",
          alignContent: "start",
        }}
      >
        <div
          style={{
            width: "50em",
            height: "15em",
            resize: "both",
            overflow: "hidden",
          }}
        >
          <Fretboard />
        </div>
      </section>
    </>
  );
}
