"""Render the 36 transparent Kamikaze? poses with Blender in background mode."""
import math
from pathlib import Path
import sys

import bpy
from mathutils import Vector

bpy.ops.wm.read_factory_settings(use_empty=True)
scene = bpy.context.scene
scene.render.engine = 'BLENDER_WORKBENCH'
scene.render.resolution_x = scene.render.resolution_y = 216
scene.render.resolution_percentage = 100
scene.render.film_transparent = True
scene.render.image_settings.color_mode = 'RGBA'
shading = scene.display.shading
shading.light = 'STUDIO'
shading.studiolight_rotate_z = .35
shading.color_type = 'OBJECT'
shading.show_shadows = True
shading.show_cavity = True
shading.cavity_type = 'BOTH'
shading.show_specular_highlight = True
scene.view_settings.view_transform = 'Standard'

RED = (.65, .038, .035, 1)
DARK = (.38, .018, .021, 1)
LIGHT = (.83, .079, .045, 1)
LEATHER = (.51, .22, .065, 1)
BONE = (1, .81, .49, 1)
GOLD = (1, .63, .15, 1)
INK = (.055, .039, .054, 1)
IRON = (.10, .12, .16, 1)


def group(parent=None):
    obj = bpy.data.objects.new('Joint', None)
    scene.collection.objects.link(obj)
    obj.parent = parent
    return obj


def gem(parent, loc, size, color, detail=1):
    bpy.ops.mesh.primitive_ico_sphere_add(subdivisions=detail)
    obj = bpy.context.object
    obj.parent, obj.location, obj.scale, obj.color = parent, loc, size, color
    return obj


def segment(parent, color, taper=.74, sides=7):
    bpy.ops.mesh.primitive_cone_add(vertices=sides, radius1=1, radius2=taper, depth=2)
    obj = bpy.context.object
    obj.parent, obj.color = parent, color
    return obj


def aim(obj, start, end, radius):
    start, end = Vector(start), Vector(end)
    delta = end - start
    obj.location = (start + end) / 2
    obj.rotation_euler = delta.to_track_quat('Z', 'Y').to_euler()
    obj.scale = radius, radius, delta.length / 2 + .045


root = group()
torso = group(root)
gem(torso, (0, 0, 0), (.35, .32, .43), RED, 2)
gem(torso, (-.05, 0, -.25), (.37, .35, .35), LEATHER, 2)
gem(torso, (-.02, 0, -.16), (.375, .36, .105), (.26, .086, .025, 1), 2)
for i in range(7):
    angle = math.tau * i / 7
    flap = segment(torso, LEATHER, .23, 4)
    x, y = math.cos(angle), math.sin(angle)
    aim(flap, (.28*x, .27*y, -.22), (.41*x, .36*y, -.57), .13)
head = group(torso)
gem(head, (0, 0, .03), (.43, .39, .39), LIGHT, 2)
gem(head, (.28, 0, -.11), (.33, .30, .20), RED, 2)
gem(head, (.44, 0, -.115), (.203, .24, .075), INK, 2)
gem(head, (.48, 0, .018), (.18, .14, .115), LIGHT, 2)
for side in (-1, 1):
    ear = segment(head, RED, 0, 5)
    aim(ear, (-.16, side*.27, .085), (-.51, side*.79, .27), .17)
    inner = segment(head, (.88, .21, .14, 1), 0, 3)
    aim(inner, (-.06, side*.30, .11), (-.39, side*.71, .248), .098)
    gem(head, (.303, side*.242, .105), (.136, .097, .106), GOLD, 2)
    gem(head, (.365, side*.304, .107), (.055, .035, .069), INK, 2)
    brow = segment(head, DARK)
    aim(brow, (.405, side*.29, .18), (.19, side*.279, .254), .071)
    for i in range(3):
        tooth = segment(head, BONE, 0, 4)
        aim(tooth, (.44-i*.052, side*(.164+i*.036), -.103), (.455-i*.052, side*(.18+i*.036), -.161), .026)
    gem(head, (-.27, side*.47, .022), (.063, .052, .07), GOLD, 2)

limbs = []
for side in (-1, 1):
    skin = RED if side < 0 else DARK
    limbs.append(tuple(segment(root, skin) for _ in range(4)) + (
        gem(root, (0, 0, 0), (.20, .117, .093), skin, 2),
        gem(root, (0, 0, 0), (.125, .115, .115), LIGHT if side < 0 else skin, 2)))

bomb = group(root)
bomb.scale = (1.55,) * 3
gem(bomb, (0, 0, 0), (.36, .36, .36), IRON, 2)
cap = segment(bomb, (.23, .22, .225, 1), .88)
aim(cap, (0, 0, .29), (0, 0, .40), .10)
fuse = group(bomb)
for start, end in [((0,0,.37),(.028,0,.50)), ((.028,0,.50),(.13,0,.57)), ((.13,0,.57),(.24,0,.56))]:
    aim(segment(fuse, (.70, .46, .21, 1), .96), start, end, .026)
for i in range(8):
    a = i*2.39996
    r = .065+(i%3)*.03
    gem(fuse, (.245+math.cos(a)*r, -.02, .56+math.sin(a)*r), (.038,.023,.038), GOLD if i%2 else (1,.26,.033,1))
gem(fuse, (.24, -.04, .56), (.050, .036, .050), (1,.92,.59,1), 2)

bpy.ops.object.camera_add(location=(0, -9, 3.48))
camera = bpy.context.object
camera.rotation_euler = (Vector((0, 0, 1.75))-camera.location).to_track_quat('-Z','Y').to_euler()
camera.data.type = 'ORTHO'
camera.data.ortho_scale = 3.95
scene.camera = camera

# yaw points the face away at first. Lean, knee bend, and head turn tell the story.
poses = [
    ('idle',1.55,0,0,0), ('idle',1.55,0,0,-.95),
    ('hold',.22,0,0,0), ('lift',.21,0,0,0),
    ('lift',.21,0,0,0), ('lift',.21,0,0,0), ('lift',.21,0,0,0),
    ('place',.18,.43,.46,0), ('empty',.20,.46,.43,0),
    ('empty',2.78,.08,.12,0), ('empty',2.78,.08,.12,0),
    ('idle',1.57,0,0,0), ('ears',1.54,.40,.20,0),
    ('ears',1.46,.49,.25,0), ('ears',.91,.46,.24,-.65),
    ('idle',.24,.14,.1,.13), ('idle',.19,0,0,0), ('idle',.19,0,0,0),
    ('check',.22,.26,.42,-.10), ('check',.21,.38,.56,-.08),
    ('check',.19,.47,.64,-.06), ('scoop',.17,.46,.58,0),
    ('hold',.18,.20,.19,0), ('uh-oh',.13,.09,-.13,-.13),
]


def draw(index):
    phase = None
    if index < len(poses):
        act, yaw, crouch, lean, turn = poses[index]
    else:
        style, step = divmod(index - len(poses), 4)
        phase = step*math.tau/4
        act = ('lift', 'flee', 'dash')[style]
        yaw, crouch, lean, turn = .16, -.025-.055*abs(math.cos(phase)), .17, 0
    root.rotation_euler.z = yaw
    torso.location = (.04 if phase is not None else 0, 0, 1.15-crouch)
    torso.rotation_euler.y = lean
    head.location = (.045, 0, .48)
    head.rotation_euler = (0, lean*.19, turn)
    bomb.location = (.40, 0, 1.48-crouch)
    if act == 'lift':
        bomb.location = (.05, 0, 2.44-crouch)
    elif act == 'place' or act == 'scoop':
        bomb.location = (.72, 0, .56)
    elif act == 'uh-oh':
        bomb.location = (.46, 0, 1.22)

    fuse.rotation_euler.z = .08 * math.sin(index*2.4)
    for obj in bomb.children_recursive:
        obj.hide_render = act not in ('hold','lift','place','scoop','uh-oh') or (
            (obj == fuse or obj.parent == fuse) and 21 <= index <= 23)

    for i, side in enumerate((-1,1)):
        thigh, shin, bicep, forearm, foot, palm = limbs[i]
        swing = phase + i*math.pi if phase is not None else None
        offset = .075 if side < 0 else -.075
        stride = math.cos(swing)*.69 if swing is not None else offset
        lift = (.11+.22*max(0,math.sin(swing))) if swing is not None else .016
        hip = (-.03, side*.155, .87-crouch)
        knee = (stride*.52+.13+crouch*.41, side*.20, .46-crouch*.48+lift*.52)
        ankle = (stride, side*.23, .115+lift)
        aim(thigh, hip, knee, .149)
        aim(shin, knee, ankle, .109)
        foot.location = (ankle[0]+.085, ankle[1], ankle[2]-.024)
        foot.rotation_euler.y = .27*math.cos(swing) if swing is not None else 0
        shoulder = (.11+lean*.23, side*.29, 1.30-crouch)
        hand = (.16, side*.34, .77-crouch)
        elbow = (-.01, side*.42, 1.04-crouch)
        if act in ('lift', 'place', 'scoop', 'hold', 'uh-oh'):
            bx, _, bz = bomb.location
            hand = (bx-.055, side*.43, bz-.14)
            elbow = (bx*.38-.07, side*.39, (shoulder[2]+hand[2])*.5-.02)
        elif act == 'ears':
            hand = (.07+lean*.42, side*.345, 1.66-crouch)
            elbow = (.24, side*.47, 1.27-crouch)
        elif act == 'check':
            hand = (.42, side*.22, .79-crouch)
            elbow = (.31, side*.34, 1.10-crouch)
        elif swing is not None:
            hand = (-.38*math.cos(swing)+.17, side*.34, 1.08-crouch-.14*math.cos(swing))
            elbow = (hand[0]-.21, side*.37, hand[2]-.12)
        aim(bicep, shoulder, elbow, .112)
        aim(forearm, elbow, hand, .096)
        palm.location = hand


output = Path(sys.argv[sys.argv.index('--')+1])
output.mkdir(parents=True, exist_ok=True)
for index in range(36):
    draw(index)
    scene.render.filepath = str(output / f'{index:02d}.png')
    bpy.ops.render.render(write_still=True)
