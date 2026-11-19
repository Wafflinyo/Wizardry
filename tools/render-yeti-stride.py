"""Build a grounded Yeti run atlas with separately tracked near and far legs."""
from math import pi, sin
from pathlib import Path

from PIL import Image, ImageChops, ImageDraw

ROOT = Path(__file__).resolve().parents[1]
CELL = 256
FRAMES = 12


def facet(draw, points, color):
    draw.polygon([(round(x * 2), round(y * 2)) for x, y in points], fill=color)


def fur_segment(draw, start, end, top_width, end_width, colors):
    x, y = start
    ex, ey = end
    length = ((ey-y)**2+(ex-x)**2)**.5
    nx, ny = (ey-y)/length, (x-ex)/length
    left = (x-nx*top_width, y-ny*top_width)
    right = (x+nx*top_width, y+ny*top_width)
    inner = (ex-nx*end_width, ey-ny*end_width)
    outer = (ex+nx*end_width, ey+ny*end_width)
    tip = (ex+(ex-x)*.12, ey+(ey-y)*.12)
    ridge = ((x+ex)*.5+nx*4, (y+ey)*.5+ny*4)
    facet(draw, [left,right,outer,tip,inner],colors[1])
    facet(draw, [left,right,ridge],colors[0])
    facet(draw, [left,ridge,inner],colors[2])
    facet(draw, [ridge,right,outer],colors[0])
    facet(draw, [inner,ridge,tip],colors[2])
    facet(draw, [ridge,outer,tip],colors[1])


def leg(draw, phase, far, bob):
    stance = .54
    hip = (132 if far else 113, (169 if far else 174)+bob)
    floor = 243 if far else 251
    if phase < stance:
        sweep = phase/stance
        ankle_x = 177-105*sweep
        lift = 0
        bend = sin(pi*sweep)*12
    else:
        sweep = (phase-stance)/(1-stance)
        ankle_x = 72+105*(sweep*sweep*(3-2*sweep))
        lift = 31*sin(pi*sweep)
        bend = 14*sin(pi*sweep)
    ankle_x += 7 if far else 0
    ankle_y = floor-11-lift
    hx, hy = hip
    knee = (hx+(ankle_x-hx)*.52+10+bend, hy+(ankle_y-hy)*.44-4)
    ankle = (ankle_x,ankle_y)
    colors = ('#cad0d7','#9aa4af','#7b8794') if far else ('#f0ede8','#c9cccd','#a3a8ae')
    foot = ('#668eaa','#416782','#2f506d') if far else ('#8dbcd9','#547f9e','#3e647e')
    fur_segment(draw,hip,knee,22 if far else 24,16,colors)
    fur_segment(draw,knee,ankle,17,12,colors)
    x,y=ankle
    facet(draw,[(x-9,y-5),(x+9,y-7),(x+20,y-3),(x+25,y+4),(x+19,y+10),(x-9,y+11),(x-13,y+4)],foot[1])
    facet(draw,[(x-9,y-5),(x+9,y-7),(x+20,y-3),(x+12,y+2),(x-13,y+4)],foot[0])
    facet(draw,[(x+12,y+2),(x+20,y-3),(x+25,y+4),(x+19,y+10)],foot[2])


def body(atlas,index):
    x,y=(index%4)*CELL,(index//4)*CELL
    torso=atlas.crop((x,y,x+CELL,y+CELL))
    mask=Image.new('L',torso.size)
    ImageDraw.Draw(mask).polygon(
        [(0,0),(255,0),(255,183),(178,183),(158,170),(139,164),
         (120,169),(99,172),(89,185),(0,185)], fill=255)
    torso.putalpha(ImageChops.multiply(torso.getchannel('A'),mask))
    return torso.resize((CELL*2,CELL*2),Image.Resampling.LANCZOS)


def main():
    source=Image.open(ROOT/'assets/yeti-run.webp').convert('RGBA')
    atlas=Image.new('RGBA',(4*CELL,3*CELL))
    for i in range(FRAMES):
        phase=i/FRAMES
        bob=round(-5*sin(phase*2*pi)**2)
        image=Image.new('RGBA',(CELL*2,CELL*2))
        draw=ImageDraw.Draw(image)
        leg(draw,(phase+.5)%1,True,bob)
        leg(draw,phase,False,bob)
        torso=body(source,(0,0,1,2,3,3,4,4,5,6,7,7)[i])
        image.alpha_composite(torso,(0,bob*2))
        atlas.paste(image.resize((CELL,CELL),Image.Resampling.LANCZOS),((i%4)*CELL,(i//4)*CELL))
    atlas.save(ROOT/'assets/yeti-stride.webp',quality=92,method=5)


if __name__=='__main__':
    main()
