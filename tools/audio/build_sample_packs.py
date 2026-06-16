#!/usr/bin/env python3
"""Compile a curated SF2 subset into browser-ready WAV sprites.

This tool intentionally avoids runtime SoundFont parsing in the app. It reads
the SF2 structure, resolves preset/instrument/sample zones, extracts only the
requested regions, converts loop points into sprite-relative seconds, and emits
a TypeScript manifest for Web Audio playback.
"""

from __future__ import annotations

import argparse
import array
import json
import math
import os
import re
import struct
import wave
from dataclasses import dataclass
from pathlib import Path
from typing import Any, Iterable


GEN_PAN = 17
GEN_INSTRUMENT = 41
GEN_KEY_RANGE = 43
GEN_INITIAL_ATTENUATION = 48
GEN_COARSE_TUNE = 51
GEN_FINE_TUNE = 52
GEN_SAMPLE_ID = 53
GEN_SAMPLE_MODES = 54
GEN_SCALE_TUNING = 56
GEN_OVERRIDING_ROOT_KEY = 58

SAMPLE_TYPE_MONO = 1
SAMPLE_TYPE_RIGHT = 2
SAMPLE_TYPE_LEFT = 4
SAMPLE_TYPE_LINKED = 8

INT16_MAX = 32767
INT16_MIN = -32768


@dataclass(frozen=True)
class GeneratorAmount:
    operator: int
    raw: bytes
    signed: int
    unsigned: int
    low: int
    high: int


@dataclass(frozen=True)
class Bag:
    gen_index: int
    mod_index: int


@dataclass(frozen=True)
class PresetHeader:
    name: str
    preset: int
    bank: int
    bag_index: int


@dataclass(frozen=True)
class InstrumentHeader:
    name: str
    bag_index: int


@dataclass(frozen=True)
class SampleHeader:
    name: str
    start: int
    end: int
    start_loop: int
    end_loop: int
    sample_rate: int
    original_pitch: int
    pitch_correction: int
    sample_link: int
    sample_type: int
    index: int


@dataclass(frozen=True)
class ResolvedZone:
    preset_name: str
    preset: int
    bank: int
    instrument_name: str
    sample: SampleHeader
    key_low: int
    key_high: int
    root_midi: int
    root_cents: int
    fine_tune: int
    coarse_tune: int
    attenuation_cb: int
    pan: int
    sample_modes: int


@dataclass(frozen=True)
class RootRequest:
    root_midi: int
    low_midi: int | None = None
    high_midi: int | None = None
    sample_name: str | None = None
    sample_index: int | None = None


@dataclass
class RegionAudio:
    channels: int
    frames: list[list[float]]
    loop_start_frame: int | None
    loop_end_frame: int | None


@dataclass
class BuiltRegion:
    manifest: dict[str, Any]
    attribution: dict[str, Any]
    audio: RegionAudio | None


class Sf2Error(RuntimeError):
    pass


class SoundFont:
    def __init__(self, path: Path) -> None:
        self.path = path
        try:
            self.data = path.read_bytes()
        except FileNotFoundError as error:
            raise Sf2Error(f"SoundFont not found: {path}") from error
        self.lists = self._parse_riff()
        self.smpl = self._required_chunk("sdta", b"smpl")
        pdta = self.lists.get("pdta", {})

        self.presets = self._parse_phdr(self._required_from(pdta, b"phdr"))
        self.pbags = self._parse_bags(self._required_from(pdta, b"pbag"))
        self.pgens = self._parse_gens(self._required_from(pdta, b"pgen"))
        self.instruments = self._parse_inst(self._required_from(pdta, b"inst"))
        self.ibags = self._parse_bags(self._required_from(pdta, b"ibag"))
        self.igens = self._parse_gens(self._required_from(pdta, b"igen"))
        self.samples = self._parse_shdr(self._required_from(pdta, b"shdr"))
        self.zones = self._resolve_zones()

    def _parse_riff(self) -> dict[str, dict[bytes, bytes]]:
        if self.data[:4] != b"RIFF" or self.data[8:12] != b"sfbk":
            raise Sf2Error(f"{self.path} is not a SoundFont 2 RIFF file")

        lists: dict[str, dict[bytes, bytes]] = {}
        for chunk_id, payload in iter_chunks(self.data, 12, len(self.data)):
            if chunk_id != b"LIST" or len(payload) < 4:
                continue

            list_type = payload[:4].decode("ascii", errors="replace")
            children: dict[bytes, bytes] = {}
            for child_id, child_payload in iter_chunks(payload, 4, len(payload)):
                children[child_id] = child_payload
            lists[list_type] = children

        return lists

    def _required_chunk(self, list_type: str, chunk_id: bytes) -> bytes:
        return self._required_from(self.lists.get(list_type, {}), chunk_id)

    def _required_from(self, chunks: dict[bytes, bytes], chunk_id: bytes) -> bytes:
        payload = chunks.get(chunk_id)
        if payload is None:
            raise Sf2Error(f"Missing SF2 chunk {chunk_id.decode('ascii')}")
        return payload

    def _parse_phdr(self, payload: bytes) -> list[PresetHeader]:
        if len(payload) % 38 != 0:
            raise Sf2Error("Invalid phdr chunk size")
        return [
            PresetHeader(read_name(payload[offset : offset + 20]), preset, bank, bag)
            for offset in range(0, len(payload), 38)
            for preset, bank, bag in [struct.unpack_from("<HHH", payload, offset + 20)]
        ]

    def _parse_inst(self, payload: bytes) -> list[InstrumentHeader]:
        if len(payload) % 22 != 0:
            raise Sf2Error("Invalid inst chunk size")
        return [
            InstrumentHeader(read_name(payload[offset : offset + 20]), bag)
            for offset in range(0, len(payload), 22)
            for bag in [struct.unpack_from("<H", payload, offset + 20)[0]]
        ]

    def _parse_bags(self, payload: bytes) -> list[Bag]:
        if len(payload) % 4 != 0:
            raise Sf2Error("Invalid bag chunk size")
        return [
            Bag(*struct.unpack_from("<HH", payload, offset))
            for offset in range(0, len(payload), 4)
        ]

    def _parse_gens(self, payload: bytes) -> list[GeneratorAmount]:
        if len(payload) % 4 != 0:
            raise Sf2Error("Invalid generator chunk size")
        generators: list[GeneratorAmount] = []
        for offset in range(0, len(payload), 4):
            operator = struct.unpack_from("<H", payload, offset)[0]
            raw = payload[offset + 2 : offset + 4]
            generators.append(
                GeneratorAmount(
                    operator=operator,
                    raw=raw,
                    signed=struct.unpack("<h", raw)[0],
                    unsigned=struct.unpack("<H", raw)[0],
                    low=raw[0],
                    high=raw[1],
                )
            )
        return generators

    def _parse_shdr(self, payload: bytes) -> list[SampleHeader]:
        if len(payload) % 46 != 0:
            raise Sf2Error("Invalid shdr chunk size")
        samples: list[SampleHeader] = []
        for index, offset in enumerate(range(0, len(payload), 46)):
            (
                start,
                end,
                start_loop,
                end_loop,
                sample_rate,
                original_pitch,
                pitch_correction,
                sample_link,
                sample_type,
            ) = struct.unpack_from("<IIIIIBbHH", payload, offset + 20)
            samples.append(
                SampleHeader(
                    name=read_name(payload[offset : offset + 20]),
                    start=start,
                    end=end,
                    start_loop=start_loop,
                    end_loop=end_loop,
                    sample_rate=sample_rate,
                    original_pitch=original_pitch,
                    pitch_correction=pitch_correction,
                    sample_link=sample_link,
                    sample_type=sample_type,
                    index=index,
                )
            )
        return samples

    def _bag_generators(
        self,
        bags: list[Bag],
        gens: list[GeneratorAmount],
        bag_index: int,
    ) -> list[GeneratorAmount]:
        current = bags[bag_index]
        next_bag = bags[bag_index + 1]
        return gens[current.gen_index : next_bag.gen_index]

    def _resolve_zones(self) -> list[ResolvedZone]:
        zones: list[ResolvedZone] = []

        for preset_index, preset_header in enumerate(self.presets[:-1]):
            next_preset = self.presets[preset_index + 1]
            preset_global: dict[int, GeneratorAmount] = {}

            for pbag_index in range(preset_header.bag_index, next_preset.bag_index):
                preset_generators = self._bag_generators(
                    self.pbags, self.pgens, pbag_index
                )
                instrument_gen = find_gen(preset_generators, GEN_INSTRUMENT)

                if instrument_gen is None:
                    preset_global.update(gens_to_map(preset_generators))
                    continue

                preset_values = {
                    **preset_global,
                    **gens_to_map(preset_generators),
                }
                instrument_index = instrument_gen.unsigned
                if instrument_index >= len(self.instruments) - 1:
                    continue

                instrument = self.instruments[instrument_index]
                next_instrument = self.instruments[instrument_index + 1]
                instrument_global: dict[int, GeneratorAmount] = {}

                for ibag_index in range(
                    instrument.bag_index, next_instrument.bag_index
                ):
                    instrument_generators = self._bag_generators(
                        self.ibags, self.igens, ibag_index
                    )
                    sample_gen = find_gen(instrument_generators, GEN_SAMPLE_ID)

                    if sample_gen is None:
                        instrument_global.update(gens_to_map(instrument_generators))
                        continue

                    values = {
                        **preset_values,
                        **instrument_global,
                        **gens_to_map(instrument_generators),
                    }
                    sample_index = sample_gen.unsigned
                    if sample_index >= len(self.samples) - 1:
                        continue

                    preset_key_range = get_key_range(preset_values)
                    instrument_key_range = get_key_range(
                        {
                            **instrument_global,
                            **gens_to_map(instrument_generators),
                        }
                    )
                    key_low, key_high = intersect_ranges(
                        preset_key_range, instrument_key_range
                    )
                    if key_high < key_low:
                        continue
                    sample = self.samples[sample_index]
                    overriding_root = values.get(GEN_OVERRIDING_ROOT_KEY)
                    root_midi = (
                        sample.original_pitch
                        if overriding_root is None or overriding_root.unsigned == 255
                        else overriding_root.unsigned
                    )
                    fine_tune = get_signed(values, GEN_FINE_TUNE)
                    coarse_tune = get_signed(values, GEN_COARSE_TUNE)
                    root_cents = (
                        root_midi * 100
                        + sample.pitch_correction
                        + fine_tune
                        + coarse_tune * 100
                    )
                    zones.append(
                        ResolvedZone(
                            preset_name=preset_header.name,
                            preset=preset_header.preset,
                            bank=preset_header.bank,
                            instrument_name=instrument.name,
                            sample=sample,
                            key_low=key_low,
                            key_high=key_high,
                            root_midi=root_midi,
                            root_cents=root_cents,
                            fine_tune=fine_tune,
                            coarse_tune=coarse_tune,
                            attenuation_cb=get_signed(
                                values, GEN_INITIAL_ATTENUATION
                            ),
                            pan=get_signed(values, GEN_PAN),
                            sample_modes=get_unsigned(values, GEN_SAMPLE_MODES),
                        )
                    )

        return zones

    def get_sample_pcm(self, sample: SampleHeader) -> list[float]:
        if sample.end <= sample.start:
            return []

        start_byte = sample.start * 2
        end_byte = sample.end * 2
        raw = self.smpl[start_byte:end_byte]
        pcm = array.array("h")
        pcm.frombytes(raw)
        if os.sys.byteorder != "little":
            pcm.byteswap()
        return [max(-1.0, min(1.0, value / 32768.0)) for value in pcm]


def iter_chunks(data: bytes, start: int, end: int) -> Iterable[tuple[bytes, bytes]]:
    offset = start
    while offset + 8 <= end:
        chunk_id = data[offset : offset + 4]
        chunk_size = struct.unpack_from("<I", data, offset + 4)[0]
        payload_start = offset + 8
        payload_end = payload_start + chunk_size
        if payload_end > end:
            raise Sf2Error(
                f"Chunk {chunk_id.decode('ascii', errors='replace')} exceeds parent"
            )
        yield chunk_id, data[payload_start:payload_end]
        offset = payload_end + (chunk_size % 2)


def read_name(raw: bytes) -> str:
    return raw.split(b"\x00", 1)[0].decode("latin1", errors="replace").strip()


def find_gen(
    generators: Iterable[GeneratorAmount], operator: int
) -> GeneratorAmount | None:
    for generator in generators:
        if generator.operator == operator:
            return generator
    return None


def gens_to_map(generators: Iterable[GeneratorAmount]) -> dict[int, GeneratorAmount]:
    return {generator.operator: generator for generator in generators}


def get_key_range(values: dict[int, GeneratorAmount]) -> tuple[int, int]:
    key_range = values.get(GEN_KEY_RANGE)
    if key_range is None:
        return 0, 127
    return key_range.low, key_range.high


def intersect_ranges(left: tuple[int, int], right: tuple[int, int]) -> tuple[int, int]:
    low = max(left[0], right[0])
    high = min(left[1], right[1])
    return (low, high) if low <= high else (0, -1)


def get_signed(values: dict[int, GeneratorAmount], operator: int) -> int:
    return values.get(operator).signed if operator in values else 0


def get_unsigned(values: dict[int, GeneratorAmount], operator: int) -> int:
    return values.get(operator).unsigned if operator in values else 0


def sanitize_id(value: str) -> str:
    return re.sub(r"[^a-z0-9-]+", "-", value.lower()).strip("-")


def load_recipe(path: Path) -> dict[str, Any]:
    with path.open("r", encoding="utf-8") as recipe_file:
        recipe = json.load(recipe_file)
    if not isinstance(recipe, dict):
        raise Sf2Error("Recipe root must be an object")
    return recipe


def resolve_input_path(raw_path: str, recipe_path: Path) -> Path:
    path = Path(raw_path)
    if path.is_absolute():
        return path

    cwd_path = (Path.cwd() / path).resolve()
    if cwd_path.exists() or not raw_path.startswith("."):
        return cwd_path

    return (recipe_path.parent / path).resolve()


def parse_roots(raw_roots: Any) -> list[RootRequest]:
    if not isinstance(raw_roots, list) or not raw_roots:
        raise Sf2Error("Pack roots must be a non-empty array")

    roots: list[RootRequest] = []
    for entry in raw_roots:
        if isinstance(entry, int):
            roots.append(RootRequest(root_midi=entry))
            continue

        if not isinstance(entry, dict) or not isinstance(entry.get("rootMidi"), int):
            raise Sf2Error("Root entries must be integers or objects with rootMidi")

        roots.append(
            RootRequest(
                root_midi=entry["rootMidi"],
                low_midi=entry.get("lowMidi"),
                high_midi=entry.get("highMidi"),
                sample_name=entry.get("sampleName"),
                sample_index=entry.get("sampleIndex"),
            )
        )

    return sorted(roots, key=lambda root: root.root_midi)


def infer_ranges(roots: list[RootRequest]) -> list[RootRequest]:
    resolved: list[RootRequest] = []
    for index, root in enumerate(roots):
        previous_root = roots[index - 1].root_midi if index > 0 else 0
        next_root = roots[index + 1].root_midi if index < len(roots) - 1 else 127
        inferred_low = (
            root.low_midi
            if root.low_midi is not None
            else 0
            if index == 0
            else math.floor((previous_root + root.root_midi) / 2) + 1
        )
        inferred_high = (
            root.high_midi
            if root.high_midi is not None
            else 127
            if index == len(roots) - 1
            else math.floor((root.root_midi + next_root) / 2)
        )
        resolved.append(
            RootRequest(
                root_midi=root.root_midi,
                low_midi=max(0, min(127, inferred_low)),
                high_midi=max(0, min(127, inferred_high)),
                sample_name=root.sample_name,
                sample_index=root.sample_index,
            )
        )
    return resolved


def select_preset_zones(soundfont: SoundFont, selector: Any) -> list[ResolvedZone]:
    if not isinstance(selector, dict):
        raise Sf2Error("sourcePreset must be an object")

    name = selector.get("name")
    bank = selector.get("bank")
    program = selector.get("program", selector.get("preset"))

    zones = soundfont.zones
    if isinstance(name, str):
        zones = [
            zone
            for zone in zones
            if zone.preset_name.lower() == name.lower()
            or name.lower() in zone.preset_name.lower()
        ]
    if isinstance(bank, int):
        zones = [zone for zone in zones if zone.bank == bank]
    if isinstance(program, int):
        zones = [zone for zone in zones if zone.preset == program]

    if not zones:
        raise Sf2Error(f"No zones found for sourcePreset {selector}")
    return zones


def choose_zone(zones: list[ResolvedZone], request: RootRequest) -> ResolvedZone:
    candidates = zones
    if request.sample_index is not None:
        candidates = [
            zone for zone in candidates if zone.sample.index == request.sample_index
        ]
    if request.sample_name:
        sample_name = request.sample_name.lower()
        candidates = [
            zone for zone in candidates if sample_name in zone.sample.name.lower()
        ]
    if not candidates:
        raise Sf2Error(f"No sample zone matches root request {request}")

    containing = [
        zone for zone in candidates if zone.key_low <= request.root_midi <= zone.key_high
    ]
    scored = containing or candidates
    return min(
        scored,
        key=lambda zone: (
            0 if zone.key_low <= request.root_midi <= zone.key_high else 1,
            abs(zone.root_midi - request.root_midi),
            abs(((zone.key_low + zone.key_high) / 2) - request.root_midi),
            zone.sample.index,
        ),
    )


def resample_linear(
    frames: list[float], source_rate: int, target_rate: int
) -> list[float]:
    if source_rate == target_rate or len(frames) <= 1:
        return frames[:]

    output_length = max(1, round(len(frames) * target_rate / source_rate))
    ratio = source_rate / target_rate
    output: list[float] = []

    for output_index in range(output_length):
        source_position = output_index * ratio
        left_index = int(math.floor(source_position))
        right_index = min(left_index + 1, len(frames) - 1)
        fraction = source_position - left_index
        left = frames[min(left_index, len(frames) - 1)]
        right = frames[right_index]
        output.append(left + (right - left) * fraction)

    return output


def find_stereo_partner(
    soundfont: SoundFont, sample: SampleHeader
) -> SampleHeader | None:
    if sample.sample_link >= len(soundfont.samples) - 1:
        return None
    partner = soundfont.samples[sample.sample_link]
    if partner.index == sample.index:
        return None
    return partner


def extract_region_audio(
    soundfont: SoundFont,
    zone: ResolvedZone,
    channels: str,
    target_sample_rate: int,
) -> RegionAudio:
    primary = zone.sample
    partner = find_stereo_partner(soundfont, primary)
    source_frames = soundfont.get_sample_pcm(primary)
    partner_frames = soundfont.get_sample_pcm(partner) if partner else None

    source_frames = resample_linear(
        source_frames, primary.sample_rate, target_sample_rate
    )
    if partner and partner_frames is not None:
        partner_frames = resample_linear(
            partner_frames, partner.sample_rate, target_sample_rate
        )

    loop_start_frame: int | None = None
    loop_end_frame: int | None = None
    has_loop = (
        zone.sample_modes in (1, 3)
        and primary.start_loop > primary.start
        and primary.end_loop > primary.start_loop
        and primary.end_loop <= primary.end
    )

    if has_loop:
        scale = target_sample_rate / primary.sample_rate
        loop_start_frame = round((primary.start_loop - primary.start) * scale)
        loop_end_frame = round((primary.end_loop - primary.start) * scale)
        loop_start_frame = max(0, min(loop_start_frame, len(source_frames) - 1))
        loop_end_frame = max(loop_start_frame + 1, min(loop_end_frame, len(source_frames)))

    if channels == "stereo":
        if partner_frames is None:
            return RegionAudio(
                channels=2,
                frames=[source_frames, source_frames[:]],
                loop_start_frame=loop_start_frame,
                loop_end_frame=loop_end_frame,
            )

        max_length = min(len(source_frames), len(partner_frames))
        left, right = orient_stereo(primary, source_frames, partner_frames)
        return RegionAudio(
            channels=2,
            frames=[left[:max_length], right[:max_length]],
            loop_start_frame=loop_start_frame,
            loop_end_frame=loop_end_frame,
        )

    if partner_frames is None:
        mono = source_frames
    else:
        max_length = min(len(source_frames), len(partner_frames))
        left, right = orient_stereo(primary, source_frames, partner_frames)
        mono = [
            (left[index] + right[index]) * 0.5 for index in range(max_length)
        ]

    return RegionAudio(
        channels=1,
        frames=[mono],
        loop_start_frame=loop_start_frame,
        loop_end_frame=loop_end_frame,
    )


def orient_stereo(
    primary: SampleHeader, primary_frames: list[float], partner_frames: list[float]
) -> tuple[list[float], list[float]]:
    if primary.sample_type & SAMPLE_TYPE_RIGHT:
        return partner_frames, primary_frames
    return primary_frames, partner_frames


def apply_gain(region: RegionAudio, gain: float) -> None:
    if gain == 1:
        return
    for channel_index, channel in enumerate(region.frames):
        region.frames[channel_index] = [sample * gain for sample in channel]


def write_wav(path: Path, channels: list[list[float]], sample_rate: int) -> None:
    if not channels:
        raise Sf2Error("Cannot write WAV with no channels")

    channel_count = len(channels)
    frame_count = len(channels[0])
    for channel in channels:
        if len(channel) != frame_count:
            raise Sf2Error("All output WAV channels must have equal length")

    path.parent.mkdir(parents=True, exist_ok=True)
    pcm = bytearray()
    clipped = 0
    for frame_index in range(frame_count):
        for channel in channels:
            sample = channel[frame_index]
            if sample > 1 or sample < -1:
                clipped += 1
            value = round(max(-1.0, min(1.0, sample)) * INT16_MAX)
            value = max(INT16_MIN, min(INT16_MAX, value))
            pcm.extend(struct.pack("<h", value))

    with wave.open(str(path), "wb") as wav:
        wav.setnchannels(channel_count)
        wav.setsampwidth(2)
        wav.setframerate(sample_rate)
        wav.writeframes(bytes(pcm))

    if clipped:
        print(f"warning: clipped {clipped} samples while writing {path}")


def build_pack(
    soundfont: SoundFont,
    pack: dict[str, Any],
    target_sample_rate: int,
    dry_run: bool,
) -> tuple[dict[str, Any], list[dict[str, Any]], list[list[float]] | None]:
    pack_id = require_string(pack, "id")
    channels = pack.get("channels", "mono")
    if channels not in ("mono", "stereo"):
        raise Sf2Error(f"Pack {pack_id}: channels must be mono or stereo")

    output_channels = 1 if channels == "mono" else 2
    padding_seconds = float(pack.get("paddingSeconds", 0.02))
    padding_frames = max(0, round(padding_seconds * target_sample_rate))
    gain = float(pack.get("gain", 1))
    preset_zones = select_preset_zones(soundfont, pack.get("sourcePreset"))
    roots = infer_ranges(parse_roots(pack.get("roots")))
    sprite_channels = (
        None if dry_run else [[] for _ in range(output_channels)]
    )
    regions: list[dict[str, Any]] = []
    attributions: list[dict[str, Any]] = []
    cursor = 0

    for root in roots:
        zone = choose_zone(preset_zones, root)
        audio = None if dry_run else extract_region_audio(
            soundfont, zone, channels, target_sample_rate
        )
        if audio is not None:
            apply_gain(audio, gain)
            frame_count = len(audio.frames[0])
        else:
            source_length = zone.sample.end - zone.sample.start
            frame_count = round(
                source_length * target_sample_rate / zone.sample.sample_rate
            )

        loop_start_seconds = None
        loop_end_seconds = None
        if audio and audio.loop_start_frame is not None and audio.loop_end_frame is not None:
            loop_start_seconds = (
                cursor + audio.loop_start_frame
            ) / target_sample_rate
            loop_end_seconds = (cursor + audio.loop_end_frame) / target_sample_rate
        elif (
            dry_run
            and zone.sample_modes in (1, 3)
            and zone.sample.start_loop > zone.sample.start
            and zone.sample.end_loop > zone.sample.start_loop
            and zone.sample.end_loop <= zone.sample.end
        ):
            scale = target_sample_rate / zone.sample.sample_rate
            loop_start_seconds = (
                cursor + round((zone.sample.start_loop - zone.sample.start) * scale)
            ) / target_sample_rate
            loop_end_seconds = (
                cursor + round((zone.sample.end_loop - zone.sample.start) * scale)
            ) / target_sample_rate

        region_id = f"{pack_id}-{root.root_midi}"
        manifest = {
            "id": region_id,
            "rootMidi": root.root_midi,
            "lowMidi": root.low_midi,
            "highMidi": root.high_midi,
            "offsetSeconds": cursor / target_sample_rate,
            "durationSeconds": frame_count / target_sample_rate,
            "rootCents": zone.root_cents,
            "gain": gain,
            "sourceSampleName": zone.sample.name,
            "sourceSampleRate": zone.sample.sample_rate,
        }
        if loop_start_seconds is not None and loop_end_seconds is not None:
            manifest["loopStartSeconds"] = loop_start_seconds
            manifest["loopEndSeconds"] = loop_end_seconds

        regions.append(manifest)
        attributions.append(
            {
                "regionId": region_id,
                "packId": pack_id,
                "preset": {
                    "name": zone.preset_name,
                    "bank": zone.bank,
                    "program": zone.preset,
                },
                "instrumentName": zone.instrument_name,
                "sample": {
                    "index": zone.sample.index,
                    "name": zone.sample.name,
                    "sampleRate": zone.sample.sample_rate,
                    "originalPitch": zone.sample.original_pitch,
                    "pitchCorrection": zone.sample.pitch_correction,
                    "start": zone.sample.start,
                    "end": zone.sample.end,
                    "startLoop": zone.sample.start_loop,
                    "endLoop": zone.sample.end_loop,
                    "sampleType": zone.sample.sample_type,
                    "sampleLink": zone.sample.sample_link,
                },
                "resolved": {
                    "rootMidi": zone.root_midi,
                    "rootCents": zone.root_cents,
                    "keyLow": zone.key_low,
                    "keyHigh": zone.key_high,
                    "fineTune": zone.fine_tune,
                    "coarseTune": zone.coarse_tune,
                    "sampleModes": zone.sample_modes,
                },
            }
        )

        if audio is not None and sprite_channels is not None:
            for channel_index in range(output_channels):
                sprite_channels[channel_index].extend(audio.frames[channel_index])
                sprite_channels[channel_index].extend([0.0] * padding_frames)

        cursor += frame_count + padding_frames

    pack_manifest = {
        "id": pack_id,
        "label": pack.get("label", pack_id),
        "url": f"/audio/v1/{pack_id}.wav",
        "channels": output_channels,
        "sampleRate": target_sample_rate,
        "regions": regions,
    }
    return pack_manifest, attributions, sprite_channels


def require_string(value: dict[str, Any], key: str) -> str:
    result = value.get(key)
    if not isinstance(result, str) or not result:
        raise Sf2Error(f"Missing required string field {key}")
    return result


def write_ts_manifest(path: Path, packs: dict[str, Any]) -> None:
    path.parent.mkdir(parents=True, exist_ok=True)
    content = (
        "/* eslint-disable */\n"
        "// Generated by tools/audio/build_sample_packs.py. Do not edit by hand.\n\n"
        "export const samplePacks = "
        + json.dumps(packs, indent=2)
        + " as const;\n"
    )
    path.write_text(content, encoding="utf-8")


def run_build(args: argparse.Namespace) -> None:
    recipe_path = Path(args.recipe)
    recipe = load_recipe(recipe_path)
    source_sf2 = resolve_input_path(str(recipe.get("sourceSf2", "")), recipe_path)

    target_sample_rate = int(recipe.get("targetSampleRate", 48000))
    output_dir = Path(recipe.get("outputDir", "public/audio/v1"))
    manifest_path = Path(recipe.get("manifestPath", "src/audio/samplePacks.generated.ts"))
    attribution_path = Path(recipe.get("attributionPath", "public/audio/v1/attribution.json"))
    packs_config = recipe.get("packs")
    if not isinstance(packs_config, list) or not packs_config:
        raise Sf2Error("Recipe must contain a non-empty packs array")

    soundfont = SoundFont(source_sf2)
    built_packs: dict[str, Any] = {}
    attribution: dict[str, Any] = {
        "sourceSf2": str(source_sf2),
        "targetSampleRate": target_sample_rate,
        "packs": [],
    }

    for pack in packs_config:
        if not isinstance(pack, dict):
            raise Sf2Error("Each pack must be an object")
        pack_manifest, pack_attribution, sprite_channels = build_pack(
            soundfont, pack, target_sample_rate, args.dry_run
        )
        built_packs[pack_manifest["id"]] = pack_manifest
        attribution["packs"].append(
            {
                "id": pack_manifest["id"],
                "label": pack_manifest["label"],
                "regions": pack_attribution,
            }
        )

        if not args.dry_run and sprite_channels is not None:
            write_wav(output_dir / f"{pack_manifest['id']}.wav", sprite_channels, target_sample_rate)

        print(
            f"{pack_manifest['id']}: {len(pack_manifest['regions'])} regions, "
            f"{pack_manifest['channels']} channel(s)"
        )

    if args.dry_run:
        print(json.dumps({"samplePacks": built_packs, "attribution": attribution}, indent=2))
        return

    write_ts_manifest(manifest_path, built_packs)
    attribution_path.parent.mkdir(parents=True, exist_ok=True)
    attribution_path.write_text(json.dumps(attribution, indent=2) + "\n", encoding="utf-8")
    print(f"wrote {manifest_path}")
    print(f"wrote {attribution_path}")


def run_inspect(args: argparse.Namespace) -> None:
    soundfont = SoundFont(Path(args.sf2).resolve())
    if args.samples:
        for sample in soundfont.samples[:-1]:
            print(
                f"{sample.index:4d} {sample.name} "
                f"rate={sample.sample_rate} pitch={sample.original_pitch} "
                f"correction={sample.pitch_correction} "
                f"frames={sample.end - sample.start} "
                f"loop={sample.start_loop - sample.start}:{sample.end_loop - sample.start} "
                f"type={sample.sample_type} link={sample.sample_link}"
            )
        return

    seen: set[tuple[int, int, str]] = set()
    for zone in soundfont.zones:
        key = (zone.bank, zone.preset, zone.preset_name)
        if key in seen:
            continue
        seen.add(key)
        print(f"bank={zone.bank:3d} program={zone.preset:3d} {zone.preset_name}")


def create_parser() -> argparse.ArgumentParser:
    parser = argparse.ArgumentParser(description=__doc__)
    subparsers = parser.add_subparsers(dest="command", required=True)

    inspect = subparsers.add_parser("inspect", help="inspect presets or samples")
    inspect.add_argument("sf2", help="source .sf2 file")
    inspect.add_argument(
        "--samples",
        action="store_true",
        help="print sample headers instead of preset list",
    )
    inspect.set_defaults(func=run_inspect)

    build = subparsers.add_parser("build", help="build WAV sprites and manifest")
    build.add_argument(
        "recipe",
        nargs="?",
        default="tools/audio/sample-packs.example.json",
        help="sample pack recipe JSON",
    )
    build.add_argument(
        "--dry-run",
        action="store_true",
        help="emit planned manifests without writing WAV/TS/JSON outputs",
    )
    build.set_defaults(func=run_build)

    return parser


def main() -> None:
    parser = create_parser()
    args = parser.parse_args()
    try:
        args.func(args)
    except Sf2Error as error:
        parser.exit(1, f"error: {error}\n")


if __name__ == "__main__":
    main()
