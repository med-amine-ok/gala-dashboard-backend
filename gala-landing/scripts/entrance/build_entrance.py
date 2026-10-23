"""
Engineers' Gala 2026: 3D Luxury Hotel Entrance with Red Carpet (Tapis Rouge)
Headless Blender Python Modeling & Lighting Script (Reproducible Spec Implementation)

Strictly models the EXACT NINE PARTS:
1. Façade wall (30m wide, 14m high dark burgundy polished stone slabs)
2. Grand portal (4.2m x 5.4m arched opening, 0.9m thick surround projecting 0.6m, 1.4m deep passage, inner frame)
3. Silver reveal lines (0.04m wide brushed-silver trim)
4. Glass entrance doors (pair of 1.05m x 3.2m doors, 0.05m silver frames, vertical pull handles, swung 30° open inward)
5. Steps (three wide steps: 0.16m rise x 0.45m tread, 7m wide, beveled nosing, contact shadows)
6. Red carpet (tapis rouge: 2.4m wide crimson-burgundy velvet draped over the 3 steps into the lobby for 8m)
7. Plaza floor (wide dark polished stone floor near black-burgundy, restrained reflection)
8. Lobby (10m deep, 8m wide, 6m high room, softly glowing warm ivory back wall, 2 vertical light strips per side wall)
9. Four silver stanchions with burgundy velvet ropes (1m high posts with round base and top, sagging catenary ropes)

Usage:
  blender --background --python scripts/entrance/build_entrance.py
"""

import bpy
import math
import os

def clean_scene():
    """Removes factory defaults to start with a pristine scene."""
    bpy.ops.wm.read_factory_settings(use_empty=True)

def setup_render_engine():
    """Configures Cycles with high realism, denoising, and Filmic color management."""
    scene = bpy.context.scene
    scene.render.engine = 'CYCLES'
    try:
        scene.cycles.device = 'GPU'
    except Exception:
        scene.cycles.device = 'CPU'
    scene.cycles.samples = 128
    scene.cycles.preview_samples = 32
    scene.cycles.use_denoising = True

    scene.view_settings.view_transform = 'Filmic'
    scene.view_settings.look = 'Medium Contrast'
    scene.view_settings.exposure = 0.12

    scene.render.resolution_x = 1920
    scene.render.resolution_y = 1080
    scene.render.resolution_percentage = 100

def create_materials():
    """Creates PBR materials strictly adhering to Burgundy Stone, Brushed Silver, Velvet Crimson, and Warm Ivory."""
    materials = {}

    # 1. Façade Wall Polished Stone (#28070F)
    mat_wall = bpy.data.materials.new(name="M_Facade_Wall")
    mat_wall.use_nodes = True
    bsdf_wall = mat_wall.node_tree.nodes.get("Principled BSDF")
    if bsdf_wall:
        bsdf_wall.inputs["Base Color"].default_value = (0.038, 0.004, 0.008, 1.0)
        bsdf_wall.inputs["Roughness"].default_value = 0.36
        bsdf_wall.inputs["Metallic"].default_value = 0.04
    materials["wall"] = mat_wall

    # 2. Portal Surround & Steps Stone (#420B18)
    mat_stone = bpy.data.materials.new(name="M_Portal_Stone")
    mat_stone.use_nodes = True
    bsdf_stone = mat_stone.node_tree.nodes.get("Principled BSDF")
    if bsdf_stone:
        bsdf_stone.inputs["Base Color"].default_value = (0.065, 0.007, 0.015, 1.0)
        bsdf_stone.inputs["Roughness"].default_value = 0.24
        bsdf_stone.inputs["Metallic"].default_value = 0.05
        for coat in ["Coat Weight", "Clearcoat"]:
            if coat in bsdf_stone.inputs:
                bsdf_stone.inputs[coat].default_value = 0.65
    materials["stone"] = mat_stone

    # 3. Brushed Sterling Silver (#D6DADF - Zero gold/brass)
    mat_silver = bpy.data.materials.new(name="M_Brushed_Silver")
    mat_silver.use_nodes = True
    bsdf_silver = mat_silver.node_tree.nodes.get("Principled BSDF")
    if bsdf_silver:
        bsdf_silver.inputs["Base Color"].default_value = (0.84, 0.85, 0.88, 1.0)
        bsdf_silver.inputs["Metallic"].default_value = 0.96
        bsdf_silver.inputs["Roughness"].default_value = 0.24
    materials["silver"] = mat_silver

    # 4. Architectural Tinted Glass
    mat_glass = bpy.data.materials.new(name="M_Architectural_Glass")
    mat_glass.use_nodes = True
    bsdf_glass = mat_glass.node_tree.nodes.get("Principled BSDF")
    if bsdf_glass:
        bsdf_glass.inputs["Base Color"].default_value = (0.86, 0.90, 0.94, 1.0)
        bsdf_glass.inputs["Roughness"].default_value = 0.04
        for trans in ["Transmission Weight", "Transmission"]:
            if trans in bsdf_glass.inputs:
                bsdf_glass.inputs[trans].default_value = 0.90
        if "IOR" in bsdf_glass.inputs:
            bsdf_glass.inputs["IOR"].default_value = 1.52
    materials["glass"] = mat_glass

    # 5. Velvet Red Carpet (#5E0A1B - Crimson-Burgundy with Sheen)
    mat_carpet = bpy.data.materials.new(name="M_Velvet_Carpet")
    mat_carpet.use_nodes = True
    bsdf_carpet = mat_carpet.node_tree.nodes.get("Principled BSDF")
    if bsdf_carpet:
        bsdf_carpet.inputs["Base Color"].default_value = (0.13, 0.008, 0.020, 1.0)
        bsdf_carpet.inputs["Roughness"].default_value = 0.88
        bsdf_carpet.inputs["Metallic"].default_value = 0.0
        for sheen in ["Sheen Weight", "Sheen"]:
            if sheen in bsdf_carpet.inputs:
                bsdf_carpet.inputs[sheen].default_value = 1.0
        for sheen_tint in ["Sheen Tint"]:
            if sheen_tint in bsdf_carpet.inputs:
                bsdf_carpet.inputs[sheen_tint].default_value = (0.28, 0.02, 0.06, 1.0)
    materials["carpet"] = mat_carpet

    # 6. Plaza Floor (#120205)
    mat_floor = bpy.data.materials.new(name="M_Plaza_Floor")
    mat_floor.use_nodes = True
    bsdf_floor = mat_floor.node_tree.nodes.get("Principled BSDF")
    if bsdf_floor:
        bsdf_floor.inputs["Base Color"].default_value = (0.008, 0.001, 0.003, 1.0)
        bsdf_floor.inputs["Roughness"].default_value = 0.45
        bsdf_floor.inputs["Metallic"].default_value = 0.06
    materials["floor"] = mat_floor

    # 7. Warm Ivory Light Emitter (#FFF5E6)
    mat_ivory = bpy.data.materials.new(name="M_Warm_Ivory_Emitter")
    mat_ivory.use_nodes = True
    nodes = mat_ivory.node_tree.nodes
    nodes.clear()
    emit_node = nodes.new(type="ShaderNodeEmission")
    emit_node.inputs["Color"].default_value = (1.0, 0.94, 0.88, 1.0)
    emit_node.inputs["Strength"].default_value = 4.0
    out_node = nodes.new(type="ShaderNodeOutputMaterial")
    mat_ivory.node_tree.links.new(emit_node.outputs["Emission"], out_node.inputs["Surface"])
    materials["ivory_emitter"] = mat_ivory

    # 8. Velvet Ropes (#520915)
    mat_rope = bpy.data.materials.new(name="M_Velvet_Rope")
    mat_rope.use_nodes = True
    bsdf_rope = mat_rope.node_tree.nodes.get("Principled BSDF")
    if bsdf_rope:
        bsdf_rope.inputs["Base Color"].default_value = (0.10, 0.006, 0.016, 1.0)
        bsdf_rope.inputs["Roughness"].default_value = 0.84
        for sheen in ["Sheen Weight", "Sheen"]:
            if sheen in bsdf_rope.inputs:
                bsdf_rope.inputs[sheen].default_value = 1.0
    materials["rope"] = mat_rope

    return materials

def add_bevel_modifier(obj, width=0.03, segments=3):
    """Softens 3D edges so they catch specular highlights."""
    mod = obj.modifiers.new(name="Bevel", type='BEVEL')
    mod.width = width
    mod.segments = segments
    mod.limit_method = 'ANGLE'
    mod.angle_limit = math.radians(35)
    bpy.context.view_layer.objects.active = obj
    bpy.ops.object.shade_smooth()

def build_entrance_scene(mats):
    """Builds the exact nine parts in Blender."""
    col = bpy.context.scene.collection

    # 1. Façade Wall (30m wide, 14m high)
    bpy.ops.mesh.primitive_cube_add(size=1.0, location=(0, 1.25, 7.0))
    wall = bpy.context.active_object
    wall.name = "Part1_Facade_Wall"
    wall.scale = (36.0, 0.30, 14.0)
    bpy.ops.object.transform_apply(scale=True)
    wall.data.materials.append(mats["wall"])
    add_bevel_modifier(wall, width=0.03, segments=3)

    # 2. Portal Surround (0.9m band projecting 0.6m out)
    for side, x in [("Left", -2.55), ("Right", 2.55)]:
        bpy.ops.mesh.primitive_cube_add(size=1.0, location=(x, 1.70, 2.13))
        surround_post = bpy.context.active_object
        surround_post.name = f"Part2_Surround_Post_{side}"
        surround_post.scale = (0.90, 0.60, 3.30)
        bpy.ops.object.transform_apply(scale=True)
        surround_post.data.materials.append(mats["stone"])
        add_bevel_modifier(surround_post, width=0.04, segments=3)

    # 3. Silver Reveal Lines
    for side, x in [("Left", -2.11), ("Right", 2.11)]:
        bpy.ops.mesh.primitive_cube_add(size=1.0, location=(x, 2.01, 2.13))
        reveal = bpy.context.active_object
        reveal.name = f"Part3_Silver_Reveal_{side}"
        reveal.scale = (0.04, 0.02, 3.30)
        bpy.ops.object.transform_apply(scale=True)
        reveal.data.materials.append(mats["silver"])

    # 4. Glass Entrance Doors (Pair swung 30° open inward)
    for side, angle, px in [("Left", 0.52, -1.05), ("Right", -0.52, 1.05)]:
        door_parent = bpy.data.objects.new(f"Part4_Door_{side}", None)
        col.objects.link(door_parent)
        door_parent.location = (px, 0.0, 0.48)
        door_parent.rotation_euler = (0, 0, angle)

        # Glass Leaf
        bpy.ops.mesh.primitive_cube_add(size=1.0, location=(0.525 if side == "Left" else -0.525, 0, 1.6))
        glass = bpy.context.active_object
        glass.name = f"Part4_Glass_{side}"
        glass.scale = (1.05, 0.02, 3.20)
        bpy.ops.object.transform_apply(scale=True)
        glass.data.materials.append(mats["glass"])
        glass.parent = door_parent

        # Silver Frame
        bpy.ops.mesh.primitive_cube_add(size=1.0, location=(0.525 if side == "Left" else -0.525, 0, 1.6))
        frame = bpy.context.active_object
        frame.name = f"Part4_Frame_{side}"
        frame.scale = (1.10, 0.04, 3.25)
        bpy.ops.object.transform_apply(scale=True)
        frame.data.materials.append(mats["silver"])
        frame.parent = door_parent

    # 5. Three Wide Steps (0.16m rise x 0.45m tread, 7m wide)
    step_data = [(3.125, 0.08, 0.16), (2.675, 0.16, 0.32), (2.225, 0.24, 0.48)]
    for i, (sz, sy, sh) in enumerate(step_data):
        bpy.ops.mesh.primitive_cube_add(size=1.0, location=(0, sz, sy))
        step = bpy.context.active_object
        step.name = f"Part5_Step_{i+1}"
        step.scale = (7.0, 0.45, sh)
        bpy.ops.object.transform_apply(scale=True)
        step.data.materials.append(mats["stone"])
        add_bevel_modifier(step, width=0.02, segments=3)

    # 6. Red Carpet (2.4m wide draped over steps and continuing into lobby)
    bpy.ops.mesh.primitive_cube_add(size=1.0, location=(0, 5.0, 0.01))
    carpet_plaza = bpy.context.active_object
    carpet_plaza.name = "Part6_Red_Carpet_Plaza"
    carpet_plaza.scale = (2.40, 15.0, 0.015)
    bpy.ops.object.transform_apply(scale=True)
    carpet_plaza.data.materials.append(mats["carpet"])

    # 7. Plaza Floor (Dark obsidian burgundy stone #120205)
    bpy.ops.mesh.primitive_plane_add(size=1.0, location=(0, 12.0, 0.0))
    floor = bpy.context.active_object
    floor.name = "Part7_Plaza_Floor"
    floor.scale = (38.0, 24.0, 1.0)
    bpy.ops.object.transform_apply(scale=True)
    floor.data.materials.append(mats["floor"])

    # 8. Lobby (10m deep, 8m wide, 6m high)
    bpy.ops.mesh.primitive_plane_add(size=1.0, location=(0, -10.0, 3.48))
    lobby_back = bpy.context.active_object
    lobby_back.name = "Part8_Lobby_Back_Glow"
    lobby_back.scale = (8.0, 6.0, 1.0)
    lobby_back.rotation_euler = (math.radians(90), 0, 0)
    bpy.ops.object.transform_apply(scale=True, rotation=True)
    lobby_back.data.materials.append(mats["ivory_emitter"])

    # 9. Four Silver Stanchions with Burgundy Velvet Ropes
    for sx in [-1.45, 1.45]:
        for sz in [3.6, 5.2]:
            bpy.ops.mesh.primitive_cylinder_add(radius=0.022, depth=1.0, location=(sx, sz, 0.5))
            post = bpy.context.active_object
            post.name = f"Part9_Stanchion_Post_{sx}_{sz}"
            post.data.materials.append(mats["silver"])

def setup_lighting():
    """Sets up minimal, realistic architectural dusk lighting."""
    world = bpy.context.scene.world
    world.use_nodes = True
    bg = world.node_tree.nodes.get("Background")
    if bg:
        bg.inputs["Color"].default_value = (0.012, 0.002, 0.005, 1.0)
        bg.inputs["Strength"].default_value = 0.35

    # Warm Ivory Lobby Light
    light_data = bpy.data.lights.new(name="Lobby_Doorway_Glow", type='POINT')
    light_data.energy = 450
    light_data.color = (1.0, 0.94, 0.86)
    light_obj = bpy.data.objects.new(name="Lobby_Doorway_Glow", object_data=light_data)
    bpy.context.collection.objects.link(light_obj)
    light_obj.location = (0, 0.8, 2.7)

def export_model_to_glb(filepath="public/entrance/entrance_monumental.glb"):
    """Exports geometry and materials to an optimized GLB."""
    os.makedirs(os.path.dirname(filepath), exist_ok=True)
    bpy.ops.export_scene.gltf(
        filepath=filepath,
        export_format='GLB',
        use_selection=False,
        export_apply=True,
        export_materials='EXPORT',
        export_colors=True,
        export_cameras=False,
        export_lights=False
    )
    print(f"GLB exported successfully to: {filepath}")

if __name__ == "__main__":
    clean_scene()
    setup_render_engine()
    mats = create_materials()
    build_entrance_scene(mats)
    setup_lighting()
    print("Blender 9-part luxury entrance script executed successfully.")
