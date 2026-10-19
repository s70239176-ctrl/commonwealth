"""An original, synthesised background track (no samples, no copyrighted material): a warm A-minor pad,
a soft pluck arpeggio, a low bass and a light shaker, ~96 s, 84 BPM. Writes audio/music.wav (44.1 kHz stereo)."""
import os
import wave
import numpy as np

SR = 44100
DUR = 96.0
BPM = 84
beat = 60.0 / BPM
n = int(SR * DUR)
t = np.arange(n) / SR
rng = np.random.default_rng(7)

def hz(midi):
    return 440.0 * 2 ** ((midi - 69) / 12)

# Am - F - C - G, two bars (8 beats) each
CHORDS = [(57, [57, 60, 64]), (53, [53, 57, 60]), (48, [48, 52, 55]), (55, [55, 59, 62])]
CHORD_LEN = 8 * beat

pad = np.zeros(n)
arp = np.zeros(n)
bass = np.zeros(n)
shk = np.zeros(n)

def add(buf, start, sig):
    i = int(start * SR)
    if i >= n:
        return
    j = min(n, i + len(sig))
    buf[i:j] += sig[: j - i]

# pad: slow-attack stacked, slightly detuned sines, per chord
for k in range(int(DUR / CHORD_LEN) + 1):
    root, notes = CHORDS[k % 4]
    start = k * CHORD_LEN
    L = int((CHORD_LEN + 1.2) * SR)
    tt = np.arange(L) / SR
    env = np.minimum(1, tt / 1.4) * np.minimum(1, (CHORD_LEN + 1.2 - tt) / 1.2)
    sig = np.zeros(L)
    for m in notes:
        for det in (-0.12, 0.0, 0.12):
            f = hz(m + 12) * (1 + det / 100)
            sig += np.sin(2 * np.pi * f * tt) + 0.35 * np.sin(2 * np.pi * 2 * f * tt)
    add(pad, start, 0.05 * sig * env)

# arpeggio: eighth-note plucks through the chord tones, an octave up
for step in range(int(DUR / (beat / 2))):
    start = step * beat / 2
    k = int(start / CHORD_LEN)
    _, notes = CHORDS[k % 4]
    pattern = [0, 1, 2, 1, 2, 1, 0, 1]
    m = notes[pattern[step % 8] % 3] + 24
    L = int(1.1 * SR)
    tt = np.arange(L) / SR
    env = np.exp(-tt * 5.0) * np.minimum(1, tt / 0.004)
    sig = np.sin(2 * np.pi * hz(m) * tt) + 0.4 * np.sin(2 * np.pi * 2 * hz(m) * tt) + 0.15 * np.sin(2 * np.pi * 3 * hz(m) * tt)
    gain = 0.07 if (step % 2 == 0) else 0.045
    add(arp, start, gain * sig * env)

# bass: root on beats 1 and 3
for b in range(int(DUR / beat)):
    if b % 4 not in (0, 2):
        continue
    start = b * beat
    k = int(start / CHORD_LEN)
    m = CHORDS[k % 4][0] - 12
    L = int(1.6 * beat * SR)
    tt = np.arange(L) / SR
    env = np.exp(-tt * 2.2) * np.minimum(1, tt / 0.01)
    add(bass, start, 0.16 * np.sin(2 * np.pi * hz(m) * tt) * env)

# shaker on the offbeats, very quiet
for b in range(int(DUR / beat)):
    start = b * beat + beat / 2
    L = int(0.07 * SR)
    tt = np.arange(L) / SR
    noise = rng.standard_normal(L)
    noise = noise - np.concatenate(([0], noise[:-1])) * 0.9  # crude high-pass
    add(shk, start, 0.02 * noise * np.exp(-tt * 55))

mix = pad + arp + bass + shk

# simple stereo space: two short feedback delays, different per channel
def echo(x, delay, fb, mixamt):
    d = int(delay * SR)
    y = x.copy()
    for r in range(1, 5):
        y[d * r:] += x[: n - d * r] * (fb ** r)
    return (1 - mixamt) * x + mixamt * y

left = echo(mix, 0.31, 0.45, 0.35)
right = echo(mix, 0.43, 0.42, 0.35)

# movement: slow swell, then fade in/out
swell = 0.88 + 0.12 * np.sin(2 * np.pi * t / 24.0)
fade = np.minimum(1, t / 3.0) * np.minimum(1, (DUR - t) / 5.0)
left *= swell * fade
right *= swell * fade
peak = max(np.abs(left).max(), np.abs(right).max())
scale = 0.85 / peak
stereo = np.stack([left, right], axis=1) * scale
pcm = (np.clip(stereo, -1, 1) * 32767).astype("<i2")
os.makedirs("audio", exist_ok=True)
with wave.open("audio/music.wav", "wb") as w:
    w.setnchannels(2)
    w.setsampwidth(2)
    w.setframerate(SR)
    w.writeframes(pcm.tobytes())
print("wrote audio/music.wav", round(DUR, 1), "s")
