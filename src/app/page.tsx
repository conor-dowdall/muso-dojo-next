import Fretboard from "@/components/instruments/fretboard/Fretboard";

export default function Home() {
  return (
    <>
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
