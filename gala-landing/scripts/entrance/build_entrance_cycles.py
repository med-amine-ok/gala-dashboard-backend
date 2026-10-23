# pyrefly: ignore[missing-import]
import bpy
import math
from mathutils import Vector, Euler

def clean_scene():
    """Removes default objects from the scene."""
    bpy.ops.wm.read_factory_settings(use_empty=True)

def setup_render_engine():
    """Configures Cycles with high realism, denoising, and film color management."""
    scene = bpy.context.scene
    scene.render.engine = 'CYCLES'
    scene.cycles.device = 'GPU'
    scene.cycles.samples = 128
    scene.cycles.preview_samples = 32
    scene.cycles.use_denoising = True
    scene.cycles.denoiser = 'OPENIMAGEDENOISE'

    # Color Management (ACES-like filmic tone mapping)
    scene.view_settings.view_transform = 'Filmic'
    scene.view_settings.look = 'Medium High Contrast'
    scene.view_settings.exposure = 0.2

    # Dimensions: 1920x1080 (16:9 widescreen)
    scene.render.resolution_x = 1920
    scene.render.resolution_y = 1080
    scene.render.resolution_percentage = 100
    scene.render.image_settings.file_format = 'WEBP'
    scene.render.image_settings.quality = 92

def create_materials():
    """Builds PBR materials tuned strictly to Burgundy stone and Brushed Silver."""
    materials = {}

    # 1. Polished Burgundy Stone Cladding (Deep black-cherry with clearcoat)
    stone_mat = bpy.data.materials.new(name="Burgundy_Polished_Stone")
    stone_mat.use_nodes = True
    bsdf_stone = stone_mat.node_tree.nodes.get("Principled BSDF")
    if bsdf_stone:
        # Base color: #340812 (sRGB -> Linear)
        bsdf_stone.inputs["Base Color"].default_value = (0.045, 0.003, 0.007, 1.0)
        bsdf_stone.inputs["Roughness"].default_value = 0.20
        bsdf_stone.inputs["Metallic"].default_value = 0.08
        if "IOR" in bsdf_stone.inputs:
            bsdf_stone.inputs["IOR"].default_value = 1.54
        # Clearcoat for polished stone reflection
        for input_name in ["Coat Weight", "Clearcoat"]:
            if input_name in bsdf_stone.inputs:
                bsdf_stone.inputs[input_name].default_value = 0.6
        for input_name in ["Coat Roughness", "Clearcoat Roughness"]:
            if input_name in bsdf_stone.inputs:
                bsdf_stone.inputs[input_name].default_value = 0.12
    materials["stone"] = stone_mat

    # 2. Brushed Sterling Silver / Satin Nickel (Cool neutral metallic highlights, NO gold)
    silver_mat = bpy.data.materials.new(name="Brushed_Silver_Metal")
    silver_mat.use_nodes = True
    bsdf_silver = silver_mat.node_tree.nodes.get("Principled BSDF")
    if bsdf_silver:
        bsdf_silver.inputs["Base Color"].default_value = (0.85, 0.85, 0.88, 1.0)
        bsdf_silver.inputs["Metallic"].default_value = 0.95
        bsdf_silver.inputs["Roughness"].default_value = 0.16
        if "Anisotropic" in bsdf_silver.inputs:
            bsdf_silver.inputs["Anisotropic"].default_value = 0.35
    materials["silver"] = silver_mat

    # 3. Architectural Glass
    glass_mat = bpy.data.materials.new(name="Architectural_Glass")
    glass_mat.use_nodes = True
    bsdf_glass = glass_mat.node_tree.nodes.get("Principled BSDF")
    if bsdf_glass:
        bsdf_glass.inputs["Base Color"].default_value = (0.95, 0.97, 1.0, 1.0)
        bsdf_glass.inputs["Roughness"].default_value = 0.02
        if "Transmission Weight" in bsdf_glass.inputs:
            bsdf_glass.inputs["Transmission Weight"].default_value = 0.92
        elif "Transmission" in bsdf_glass.inputs:
            bsdf_glass.inputs["Transmission"].default_value = 0.92
        if "IOR" in bsdf_glass.inputs:
            bsdf_glass.inputs["IOR"].default_value = 1.52
    materials["glass"] = glass_mat

    # 4. Polished Obsidian Marble Threshold & Steps Floor
    marble_mat = bpy.data.materials.new(name="Obsidian_Marble_Floor")
    marble_mat.use_nodes = True
    bsdf_marble = marble_mat.node_tree.nodes.get("Principled BSDF")
    if bsdf_marble:
        bsdf_marble.inputs["Base Color"].default_value = (0.015, 0.003, 0.005, 1.0)
        bsdf_marble.inputs["Roughness"].default_value = 0.10
        bsdf_marble.inputs["Metallic"].default_value = 0.15
        for input_name in ["Coat Weight", "Clearcoat"]:
            if input_name in bsdf_marble.inputs:
                bsdf_marble.inputs[input_name].default_value = 0.85
    materials["marble"] = marble_mat

    # 5. Warm Ivory Light Panel Emitter (#FFF6EB)
    ivory_light_mat = bpy.data.materials.new(name="Warm_Ivory_Emitter")
    ivory_light_mat.use_nodes = True
    nodes = ivory_light_mat.node_tree.nodes
    nodes.clear()
    emit_node = nodes.new(type="ShaderNodeEmission")
    emit_node.inputs["Color"].default_value = (1.0, 0.92, 0.82, 1.0) # Warm Ivory
    emit_node.inputs["Strength"].default_value = 6.5
    output_node = nodes.new(type="ShaderNodeOutputMaterial")
    ivory_light_mat.node_tree.links.new(emit_node.outputs["Emission"], output_node.inputs["Surface"])
    materials["ivory_emitter"] = ivory_light_mat

    return materials

def build_architecture(materials):
    """Builds the monumental portal facade, glass doors, steps, and lobby."""
    # 1. Main Facade Wall
    bpy.ops.mesh.primitive_cube_add(size=1.0, location=(0, 0, 4.5))
    facade = bpy.context.active_object
    facade.name = "Portal_Facade"
    facade.scale = (18.0, 1.2, 9.0)
    facade.data.materials.append(materials["stone"])

    # 2. Arched Portal Cutout (Boolean)
    bpy.ops.mesh.primitive_cylinder_add(radius=2.6, depth=3.0, location=(0, 0, 4.8))
    arch_cutter = bpy.context.active_object
    arch_cutter.rotation_euler = (math.radians(90), 0, 0)

    bool_mod = facade.modifiers.new(name="ArchCutout", type='BOOLEAN')
    bool_mod.operation = 'DIFFERENCE'
    bool_mod.object = arch_cutter
    bpy.context.view_layer.objects.active = facade
    bpy.ops.object.modifier_apply(modifier="ArchCutout")
    bpy.data.objects.remove(arch_cutter, do_unlink=True)

    # 3. Brushed Silver Reveal Arch Rim
    bpy.ops.mesh.primitive_torus_add(
        major_radius=2.65,
        minor_radius=0.06,
        location=(0, 0.61, 4.8)
    )
    silver_rim = bpy.context.active_object
    silver_rim.name = "Silver_Arch_Rim"
    silver_rim.rotation_euler = (math.radians(90), 0, 0)
    silver_rim.data.materials.append(materials["silver"])

    # 4. Double Glass Doors (Ajar at 20 degrees)
    for side, angle in [("Left", 0.35), ("Right", -0.35)]:
        # Glass panel
        bpy.ops.mesh.primitive_cube_add(size=1.0, location=(0, 0, 0))
        door = bpy.context.active_object
        door.name = f"Glass_Door_{side}"
        door.scale = (1.2, 0.04, 3.8)
        door.data.materials.append(materials["glass"])

        # Silver Frame & Handle
        bpy.ops.mesh.primitive_cylinder_add(radius=0.02, depth=1.2, location=(0.5, 0.06, 0))
        handle = bpy.context.active_object
        handle.name = f"Silver_Handle_{side}"
        handle.data.materials.append(materials["silver"])
        handle.parent = door

        door.location = (-1.2 if side == "Left" else 1.2, 0.0, 2.2)
        door.rotation_euler = (0, 0, angle)

    # 5. Broad Stone Steps (3 tiers)
    for i in range(3):
        bpy.ops.mesh.primitive_cube_add(size=1.0, location=(0, 1.2 + i * 0.8, i * 0.18 + 0.09))
        step = bpy.context.active_object
        step.name = f"Stone_Step_{i}"
        step.scale = (8.0 - i * 0.6, 0.8, 0.18)
        step.data.materials.append(materials["marble"])

    # 6. Lobby Interior & Vertical Light Panels
    bpy.ops.mesh.primitive_plane_add(size=1.0, location=(0, -8.0, 0.01))
    lobby_floor = bpy.context.active_object
    lobby_floor.scale = (12.0, 16.0, 1.0)
    lobby_floor.data.materials.append(materials["marble"])

    for x in [-3.2, -2.4, -1.6, 1.6, 2.4, 3.2]:
        bpy.ops.mesh.primitive_cube_add(size=1.0, location=(x, -6.5, 3.5))
        light_fin = bpy.context.active_object
        light_fin.name = f"Light_Fin_{x}"
        light_fin.scale = (0.12, 0.25, 4.5)
        light_fin.data.materials.append(materials["ivory_emitter"])

def setup_lighting():
    """Sets up soft architectural evening lighting."""
    # World dark oxblood background
    world = bpy.context.scene.world
    world.use_nodes = True
    bg_node = world.node_tree.nodes.get("Background")
    if bg_node:
        bg_node.inputs["Color"].default_value = (0.012, 0.002, 0.004, 1.0) # Deep oxblood night
        bg_node.inputs["Strength"].default_value = 0.35

    # 1. Warm Ivory Lobby Area Light (radiates through opening)
    lobby_light_data = bpy.data.lights.new(name="Lobby_Warm_Glow", type='AREA')
    lobby_light_data.energy = 450
    lobby_light_data.color = (1.0, 0.94, 0.86) # Warm Ivory
    lobby_light_data.size = 4.0
    lobby_light_data.size_y = 6.0
    lobby_light = bpy.data.objects.new(name="Lobby_Light", object_data=lobby_light_data)
    bpy.context.collection.objects.link(lobby_light)
    lobby_light.location = (0, -4.5, 3.8)
    lobby_light.rotation_euler = (math.radians(-90), 0, 0)

    # 2. Exterior Soft Grazing Key Light
    key_light_data = bpy.data.lights.new(name="Exterior_Key_Light", type='AREA')
    key_light_data.energy = 180
    key_light_data.color = (0.92, 0.94, 1.0) # Soft cool twilight fill
    key_light_data.size = 6.0
    key_light = bpy.data.objects.new(name="Exterior_Key", object_data=key_light_data)
    bpy.context.collection.objects.link(key_light)
    key_light.location = (4.0, 8.0, 9.0)
    key_light.rotation_euler = (math.radians(45), math.radians(-30), 0)

def animate_camera():
    """Animates a single smooth camera move from wide establishing shot into lobby."""
    camera_data = bpy.data.cameras.new(name="Hero_Camera")
    camera_data.lens = 38 # 38mm natural architectural FOV
    camera_data.dof.use_dof = True
    camera_data.dof.focus_distance = 11.5
    camera_data.dof.aperture_fstop = 4.0

    camera_obj = bpy.data.objects.new(name="Hero_Camera", object_data=camera_data)
    bpy.context.collection.objects.link(camera_obj)
    bpy.context.scene.camera = camera_obj

    scene = bpy.context.scene
    scene.frame_start = 1
    scene.frame_end = 120

    # Keyframe 1: Wide establishing view
    scene.frame_set(1)
    camera_obj.location = (0, 11.8, 3.8)
    camera_obj.rotation_euler = (math.radians(90), 0, math.radians(180))
    camera_obj.keyframe_insert(data_path="location")
    camera_obj.keyframe_insert(data_path="rotation_euler")

    # Keyframe 60: Halfway up steps
    scene.frame_set(60)
    camera_obj.location = (0, 5.2, 3.2)
    camera_obj.keyframe_insert(data_path="location")

    # Keyframe 100: Passing between open glass doors
    scene.frame_set(100)
    camera_obj.location = (0, 0.8, 2.8)
    camera_obj.keyframe_insert(data_path="location")

    # Keyframe 120: Inside the tranquil warm ivory lobby
    scene.frame_set(120)
    camera_obj.location = (0, -3.5, 2.6)
    camera_obj.keyframe_insert(data_path="location")

def render_sequence(output_dir="public/entrance/frames/"):
    """Renders the animation sequence to disk."""
    bpy.context.scene.render.filepath = output_dir + "frame_###"
    print(f"Starting Cycles render sequence into: {output_dir}")
    bpy.ops.render.render(animation=True)
    print("Render complete!")

if __name__ == "__main__":
    clean_scene()
    setup_render_engine()
    mats = create_materials()
    build_architecture(mats)
    setup_lighting()
    animate_camera()
    print("Scene setup complete. Ready to render.")
