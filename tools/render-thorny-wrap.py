"""Render separate back and front sprite frames from two fixed thorn-vine meshes."""
from math import cos, pi, sin, sqrt
from pathlib import Path

from PIL import Image, ImageDraw

CELL = 256
FRAMES = 24
SIDES = 6
STEMS = ((70, 117, 37), (99, 134, 51))
IVORY = (210, 192, 116)
LEAF = (115, 160, 47)
LIGHT = (-.54, .68, .5)


def add(a, b):
    return tuple(x + y for x, y in zip(a, b))


def sub(a, b):
    return tuple(x - y for x, y in zip(a, b))


def mul(vector, factor):
    return tuple(x * factor for x in vector)


def dot(a, b):
    return sum(x * y for x, y in zip(a, b))


def cross(a, b):
    x, y, z = a
    u, v, w = b
    return y*w-z*v, z*u-x*w, x*v-y*u


def unit(vector):
    return mul(vector, 1 / sqrt(dot(vector, vector)))


def center(vine, t):
    angle = pi * vine + t * pi * 2.08
    radius = 94 - 26 * sin(t * pi * .7)
    return radius*cos(angle), (185 - vine*23)*t + 4, radius*sin(angle)


def local_axes(vine, t):
    forward = unit(sub(center(vine, t+.001), center(vine, t-.001)))
    out = unit((cos(pi*vine+t*pi*2.08), 0, sin(pi*vine+t*pi*2.08)))
    side = unit(cross(forward, out))
    return forward, unit(cross(side, forward)), side


def ring(vine, t, tip):
    origin = center(vine, t)
    _, radial, side = local_axes(vine, t)
    taper = min(1, max(.08, (tip-t)*19))
    radius = (13 - t*5) * taper
    return [
        add(origin, mul(add(mul(radial, cos(i*2*pi/SIDES)), mul(side, sin(i*2*pi/SIDES))), radius))
        for i in range(SIDES)
    ]


def faces_for(vine, tip):
    if tip <= 0:
        return []
    color = STEMS[vine]
    knots = sorted({0, tip, *(i / 40 for i in range(1, 40) if i / 40 < tip),
                    *(i / 2.08 for i in (1, 2) if i / 2.08 < tip)})
    faces = []
    rings = [ring(vine, t, tip) for t in knots]
    for index, (a, b) in enumerate(zip(rings, rings[1:])):
        front = center(vine, (knots[index]+knots[index+1])/2)[2] >= 0
        for j in range(SIDES):
            k = (j+1) % SIDES
            tint = tuple(round(channel*(1.05 if (index+j)%4 else .9)) for channel in color)
            faces.append((front, (a[j], a[k], b[k]), color))
            faces.append((front, (a[j], b[k], b[j]), tint))

    for index in range(12):
        t = .065 + index*.073 + vine*.008
        amount = min(1, max(0, (tip-t)*24))
        if amount == 0:
            continue
        origin = center(vine, t)
        forward, radial, side = local_axes(vine, t)
        facing = unit(add(radial, mul(side, .6 if index % 2 else -.6)))
        root = add(origin, mul(facing, 8))
        peak = add(root, mul(add(mul(facing, 16 + index%3*3), mul(forward, 10)), amount))
        triangle = (add(root, mul(side, 4)), add(root, mul(forward, -5)), add(root, mul(side, -4)))
        front = origin[2] >= 0
        for j in range(3):
            faces.append((front, (triangle[j], triangle[(j+1)%3], peak), IVORY))
        if index in (2, 6, 10):
            end = add(root, mul(add(mul(side, 20), mul(forward, 18)), amount))
            mid = add(root, mul(sub(end, root), .54))
            faces.append((front, (root, add(mid, mul(radial, 7)), end), LEAF))
            faces.append((front, (root, end, add(mid, mul(radial, -5))), color))
    return faces


def project(point):
    x, height, depth = point
    return 2*(CELL/2 + x), 2*(221-height + depth*.20)


def render_frame(index):
    progress = (index+1) / FRAMES
    growth = progress*progress*(3-2*progress)
    faces = faces_for(0, growth) + faces_for(1, growth)
    layers = []
    for front in (False, True):
        image = Image.new("RGBA", (2*CELL, 2*CELL))
        draw = ImageDraw.Draw(image)
        layer = ((points, color) for near, points, color in faces if near == front)
        for points, color in sorted(layer, key=lambda face: sum(p[2] for p in face[0])):
            a, b, c = points
            normal = cross(sub(b,a), sub(c,a))
            if dot(normal, normal) < .00001:
                continue
            normal = unit(normal)
            if normal[2] < 0:
                normal = mul(normal, -1)
            intensity = .51 + .53*max(0, dot(normal, LIGHT))
            fill = tuple(min(255, round(channel*intensity)) for channel in color)
            draw.polygon([project(p) for p in points], fill=fill)
        layers.append(image.resize((CELL, CELL), Image.Resampling.LANCZOS))
    return layers


def main():
    atlas = Image.new("RGBA", (CELL*8, CELL*6))
    for index in range(FRAMES):
        for layer, frame in enumerate(render_frame(index)):
            atlas.paste(frame, (CELL*(index%4+layer*4), CELL*(index//4)))
    destination = Path(__file__).resolve().parents[1] / "assets" / "thorny-wrap-v233.webp"
    atlas.save(destination, quality=91, method=5)


if __name__ == "__main__":
    main()
