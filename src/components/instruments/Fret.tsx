import React from 'react';

type FretProps = {
  fretNumber: number;
};

const Fret = ({ fretNumber }: FretProps) => {
  return (
    <div
      className="relative h-full"
      data-fret-number={fretNumber}
    >
      {/* Fret wire */}
      <div className="absolute top-0 right-0 z-10 h-full w-[1px] bg-gray-400" />
    </div>
  );
};

export default Fret;
