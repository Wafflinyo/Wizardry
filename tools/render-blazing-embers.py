"""Bake the Blazing Embers cels into a transparent WebP sheet."""
from math import cos, pi, sin
from pathlib import Path
from random import Random

from PIL import Image, ImageDraw

WIDTH, HEIGHT = 192, 160
SCALE = 2
FACE_COLORS = (
    '#922827', '#c63e21', '#e05622', '#f37c29',
    '#fca840', '#ffce64', '#ffe597', '#fff1b3',
)
rng = Random(73)
sparks = [
    (i * 2 * pi / 18 + rng.uniform(-.12, .12),
     rng.uniform(49, 88), rng.uniform(2.2, 5.8), rng.uniform(0, .33))
    for i in range(18)
]


def ember(faces, x, y, z, size, angle, stretch=1, heat=0):
    """Make two staggered five-sided cross-sections with triangular facets."""
    rings = []
    for depth, radius, offset in ((-.64, .62, .46), (.23, 1, 0)):
        rings.append([
            (cos(i * 2 * pi / 5 + offset) * radius,
             sin(i * 2 * pi / 5 + offset) * radius, depth)
            for i in range(5)
        ])
    mesh = [*rings[0], *rings[1], (-.18, .15, 1.18), (.30, -.1, -1.0)]
    points = []
    for px, py, pz in mesh:
        px, pz = px * cos(angle * .85) + pz * sin(angle * .85), pz * cos(angle * .85) - px * sin(angle * .85)
        px, py = px * cos(angle) - py * sin(angle), py * cos(angle) + px * sin(angle)
        points.append((x + px * size * stretch, y + (py - pz * .36) * size, z + pz * size))
    triangles = []
    for i in range(5):
        j = (i + 1) % 5
        triangles.extend(((i, j, i + 5, 1), (j, j + 5, i + 5, 2),
                          (i + 5, j + 5, 10, 4), (i, 11, j, 0)))
    for a, b, c, base in triangles:
        triangle = [points[idx] for idx in (a, b, c)]
        ax, ay, _ = triangle[0]
        bx, by, _ = triangle[1]
        cx, cy, _ = triangle[2]
        if (bx - ax) * (cy - ay) - (by - ay) * (cx - ax) <= 0:
            continue
        light = 1 if (ay + by + cy) / 3 < y - size * .15 else 0
        color = FACE_COLORS[min(7, base + heat + light)]
        faces.append((sum(p[2] for p in triangle) / 3, color, triangle))


def flame_body(faces, size, angle, stretch):
    ember(faces, 0, 0, 0, size, angle, stretch, 1)
    ember(faces, -size * .42, 0, 2, size * .68, -angle + .6, stretch, 0)
    ember(faces, size * .28, -size * .16, 5, size * .67, angle + .4, stretch, 3)
    ember(faces, -size * .11, size * .35, -1, size * .76, angle - 1.7, stretch, 1)


def paint(frame):
    faces = []
    if frame < 16:
        t = frame / 15
        for i, (angle, radius, size, delay) in enumerate(sparks):
            progress = (t - delay) / (.69 + i % 3 * .11 - delay)
            if not 0 <= progress < 1:
                continue
            reach = radius * (1 - progress ** 1.45)
            curve = angle + (1.15 if i % 3 else -.9) * progress
            x, y = cos(curve) * reach, sin(curve) * reach * .72
            ember(faces, x, y, sin(curve) * 13, size * (.5 + progress * .72), curve + t * 4, 1.15, 2)
            ember(faces, x * 1.20, y * 1.2, -10, size * .46, curve, 1.3)
        if t > .29:
            flame_body(faces, 5 + 22 * ((t - .29) / .71) ** 1.2, t * 2.8, 1)
    elif frame < 22:
        t = (frame - 16) / 5
        flame_body(faces, 25 - t * 3, 2.8 + t * 3, 1.15 + t * .27)
        for i, (angle, _, size, _) in enumerate(sparks[:12]):
            spread = (i + 1) / 12
            ember(faces, -19 - 60 * spread, cos(angle + t * 5) * (26 - spread * 14),
                  sin(angle) * 10, size * (1 - .53 * spread), angle + t * 3, 2, 1)
    else:
        t = (frame - 22) / 9
        for i, (angle, radius, size, _) in enumerate(sparks):
            reach = 9 + (radius - 9) * (1 - (1 - t) ** 2)
            ember(faces, cos(angle) * reach, sin(angle) * reach * .7 + 22 * t * t,
                  sin(angle) * 12, size * (1.9 - 1.7 * t), angle + t * 4, 1.45, 2 if t < .4 else 0)
        if t < .45:
            ember(faces, 0, 0, -6, 24 * (1 - t * 2), frame, 1.3, 3)
    image = Image.new('RGBA', (WIDTH * SCALE, HEIGHT * SCALE))
    draw = ImageDraw.Draw(image)
    for _, color, triangle in sorted(faces, key=lambda facet: facet[0]):
        draw.polygon([((x + WIDTH / 2) * SCALE, (y + HEIGHT / 2) * SCALE)
                      for x, y, _ in triangle], fill=color)
    return image.resize((WIDTH, HEIGHT), Image.Resampling.LANCZOS)


atlas = Image.new('RGBA', (WIDTH * 8, HEIGHT * 4))
for index in range(32):
    atlas.paste(paint(index), (index % 8 * WIDTH, index // 8 * HEIGHT))
atlas.save(Path(__file__).resolve().parents[1] / 'assets' / 'blazing-embers-frames.webp',
           format='WEBP', lossless=True, method=6)
