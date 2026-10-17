"""Original 120 BPM synthesized instrumental and restrained effects; no external samples."""
import math, random, wave, struct
from pathlib import Path
SR=44100
DURATION=18
samples=[0.0]*(SR*DURATION)
rng=random.Random(19)
def add(start,duration,fn,gain=1):
    offset=int(start*SR)
    for n in range(int(duration*SR)):
        i=offset+n
        if 0<=i<len(samples): samples[i]+=fn(n/SR)*gain
for beat in range(36):
    t=beat*.5
    add(t,.22,lambda x:math.sin(2*math.pi*(48*x+8*(1-math.exp(-x*30))))*math.exp(-x*22),.36)
    for off in [0,.25]:
        add(t+off,.045,lambda x:rng.uniform(-1,1)*math.exp(-x*95),.065)
    if beat%2:
        add(t,.11,lambda x:rng.uniform(-1,1)*math.exp(-x*38),.13)
    freq=[110,130.8128,164.8138,146.8324][(beat//4)%4]
    add(t,.35,lambda x,f=freq:(math.sin(2*math.pi*f*x)+.25*math.sin(4*math.pi*f*x))*min(x/.01,1)*math.exp(-x*9),.19)
    if beat%2==0:
        add(t+.25,.38,lambda x,f=freq*4:math.sin(2*math.pi*f*x)*math.exp(-x*12)*min(x/.006,1),.08)
# Scene cuts on beat boundaries; soft emphasis pops shortly after cuts.
starts=[0,2,3.5,5,7,9,11,12.5,14.5,16]
for t in starts:
    add(t+.27,.09,lambda x:math.sin(2*math.pi*(750*x-1800*x*x))*math.exp(-x*50),.12)
for t in [5,12.5]:
    add(t-.16,.25,lambda x:rng.uniform(-1,1)*math.sin(math.pi*x/.25)**2,.085)
for t in [9+10/30,9+20/30,9+30/30]:
    add(t,.025,lambda x:rng.uniform(-1,1)*math.exp(-x*180),.2)
peak=max(abs(s) for s in samples)
path=Path(__file__).resolve().parents[1]/'public/soundtrack.wav'
with wave.open(str(path),'wb') as out:
    out.setnchannels(2);out.setsampwidth(2);out.setframerate(SR)
    for i,s in enumerate(samples):
        fade=min(1,(len(samples)-i)/(SR*.3))
        v=int(s/peak*.78*fade*32767)
        out.writeframesraw(struct.pack('<hh',v,v))
print(path)
