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
            width: "30em",
            height: "6em",
            resize: "both",
            overflow: "hidden",
          }}
        >
          <Fretboard preset="lightTelecaster" />
          <Fretboard />
        </div>
      </section>
    </>
  );
}
