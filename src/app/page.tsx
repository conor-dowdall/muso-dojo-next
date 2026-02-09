import Fretboard from "@/components/instruments/fretboard/Fretboard";

export default function Home() {
  return (
    <>
      <section
        style={{
          minHeight: "100dvh",
          display: "grid",
          gap: "1em",
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
        </div>
        <div
          style={{
            width: "30em",
            height: "6em",
            resize: "both",
            overflow: "hidden",
          }}
        >
          <Fretboard preset="darkGibson" />
        </div>
      </section>
    </>
  );
}
